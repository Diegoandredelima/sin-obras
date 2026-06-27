"""
SIN-Obras — Serviço de Alertas

Gera alertas automáticos com base em regras de negócio e consulta o banco.
"""
from datetime import UTC, date, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.acompanhamento import Paralisacao, TipoParalisacao
from app.models.alerta import Alerta, PrioridadeAlerta, TipoAlerta
from app.models.art_rrt import ArtRrt
from app.models.documento import Documento
from app.models.objeto import Objeto, SaudeObjeto, StatusObjeto
from app.models.vistoria import Vistoria
from app.services.curva_s import compute_curva_s

# Severidade relativa da saúde (maior = pior) — usada para só "piorar" o status
# automaticamente, nunca melhorar uma marcação manual (RN05).
_SAUDE_SEVERIDADE = {
    SaudeObjeto.VERDE: 0,
    SaudeObjeto.AMARELO: 1,
    SaudeObjeto.VERMELHO: 2,
}


async def list_alertas(
    db: AsyncSession,
    objeto_id: UUID | None = None,
    prioridade: str | None = None,
    resolvido: bool | None = None,
) -> list[Alerta]:
    query = select(Alerta)
    if objeto_id:
        query = query.where(Alerta.objeto_id == objeto_id)
    if prioridade:
        query = query.where(Alerta.prioridade == prioridade)
    if resolvido is not None:
        query = query.where(Alerta.resolvido == resolvido)
    query = query.order_by(
        Alerta.resolvido.asc(),
        Alerta.prioridade.desc(),
        Alerta.criado_em.desc(),
    )
    result = await db.execute(query)
    return result.scalars().all()


async def _objetos_paralisados(db: AsyncSession) -> set[UUID]:
    """Conjunto de objetos atualmente paralisados (RN10).

    Considera paralisado quando o último evento de paralisação registrado for do
    tipo PARALISACAO (sem REINICIO posterior). Usado para suspender os alertas de
    SLA (prazo vencido / sem vistoria) enquanto a obra estiver formalmente parada.
    """
    eventos = (
        await db.execute(
            select(Paralisacao).order_by(
                Paralisacao.objeto_id, Paralisacao.data_evento.asc(), Paralisacao.criado_em.asc()
            )
        )
    ).scalars().all()
    ultimo_tipo: dict[UUID, str] = {}
    for ev in eventos:
        ultimo_tipo[ev.objeto_id] = ev.tipo
    return {oid for oid, tipo in ultimo_tipo.items() if tipo == TipoParalisacao.PARALISACAO}


async def _avaliar_saude_preditiva(db: AsyncSession, objeto: Objeto) -> int:
    """RN05 — usa a curva preditiva para atualizar a saúde do objeto e alertar o chefe.

    Se a tendência (Curva S preditiva) indicar conclusão após o prazo contratual,
    muda a saúde para AMARELO (atraso) ou VERMELHO (atraso > 45 dias) e gera um
    alerta ATRASO_PREDITIVO. A saúde só é piorada automaticamente, nunca melhorada.
    Retorna 1 se um alerta foi criado, senão 0.
    """
    curva = await compute_curva_s(db, objeto.id)
    predito_str = curva.get("prazo_predito")
    contratual_str = curva.get("prazo_contratual")
    if not predito_str or not contratual_str:
        return 0

    try:
        predito = date.fromisoformat(predito_str)
        contratual = date.fromisoformat(contratual_str)
    except (TypeError, ValueError):
        return 0

    dias_atraso = (predito - contratual).days
    if dias_atraso <= 0:
        return 0

    nova_saude = SaudeObjeto.VERMELHO if dias_atraso > 45 else SaudeObjeto.AMARELO

    # Só piora a saúde automaticamente (preserva marcação manual mais severa).
    atual = SaudeObjeto(objeto.saude) if objeto.saude else SaudeObjeto.VERDE
    if _SAUDE_SEVERIDADE[nova_saude] > _SAUDE_SEVERIDADE[atual]:
        objeto.saude = nova_saude
        db.add(objeto)

    existe = await db.execute(
        select(Alerta).where(
            Alerta.objeto_id == objeto.id,
            Alerta.tipo == TipoAlerta.ATRASO_PREDITIVO,
            Alerta.resolvido == False,
        )
    )
    if existe.scalar_one_or_none():
        return 0

    db.add(Alerta(
        objeto_id=objeto.id,
        tipo=TipoAlerta.ATRASO_PREDITIVO,
        prioridade=PrioridadeAlerta.CRITICA if dias_atraso > 45 else PrioridadeAlerta.ALTA,
        titulo=f"Tendência de atraso de {dias_atraso} dias — {objeto.titulo[:100]}",
        descricao=(
            f"A Curva S preditiva projeta conclusão em {predito.isoformat()}, "
            f"após o prazo contratual ({contratual.isoformat()}). "
            f"Saúde do objeto ajustada para {nova_saude.value}."
        ),
    ))
    return 1


async def gerar_alertas(db: AsyncSession) -> int:
    """Varre as objetos e gera alertas para situações de risco. Retorna quantos foram criados."""
    criados = 0
    hoje = date.today()

    # RN10 — obras formalmente paralisadas têm os alertas de SLA suspensos.
    paralisados = await _objetos_paralisados(db)

    # Buscar todas as objetos ativas
    objetos = (await db.execute(select(Objeto))).scalars().all()

    for objeto in objetos:
        # RN10 — suspende alertas de SLA (prazo vencido / sem vistoria) durante paralisação.
        sla_suspenso = objeto.status == StatusObjeto.PARALISADA or objeto.id in paralisados

        # 1. Prazo de execução vencido
        if not sla_suspenso and objeto.execucao_fim and objeto.execucao_fim < hoje and objeto.status not in (StatusObjeto.CONCLUIDA,):
            existe = await db.execute(
                select(Alerta).where(
                    Alerta.objeto_id == objeto.id,
                    Alerta.tipo == TipoAlerta.PRAZO_VENCIDO,
                    Alerta.resolvido == False,
                )
            )
            if not existe.scalar_one_or_none():
                db.add(Alerta(
                    objeto_id=objeto.id,
                    tipo=TipoAlerta.PRAZO_VENCIDO,
                    prioridade=PrioridadeAlerta.ALTA,
                    titulo=f"Prazo de execução vencido — {objeto.titulo[:100]}",
                    descricao=f"Execução prevista até {objeto.execucao_fim.isoformat()}. Status atual: {objeto.status or 'N/A'}.",
                ))
                criados += 1

        # 2. Objetos sem vistoria há mais de 30 dias
        if not sla_suspenso and objeto.status == StatusObjeto.EM_EXECUCAO:
            ultima_vistoria = await db.execute(
                select(Vistoria)
                .where(Vistoria.objeto_id == objeto.id)
                .order_by(Vistoria.checkin_em.desc().nullslast())
                .limit(1)
            )
            vist = ultima_vistoria.scalar_one_or_none()
            dias_sem = 999
            if vist and vist.checkin_em:
                dias_sem = (hoje - vist.checkin_em.date()).days
            if dias_sem > 30:
                existe = await db.execute(
                    select(Alerta).where(
                        Alerta.objeto_id == objeto.id,
                        Alerta.tipo == TipoAlerta.SEM_VISTORIA,
                        Alerta.resolvido == False,
                    )
                )
                if not existe.scalar_one_or_none():
                    db.add(Alerta(
                        objeto_id=objeto.id,
                        tipo=TipoAlerta.SEM_VISTORIA,
                        prioridade=PrioridadeAlerta.ALTA if dias_sem > 60 else PrioridadeAlerta.MEDIA,
                        titulo=f"Sem vistoria há {dias_sem} dias — {objeto.titulo[:100]}",
                        descricao=f"Última vistoria: {vist.checkin_em.date().isoformat() if vist and vist.checkin_em else 'Nunca vistoriada'}. SLA: 30 dias.",
                    ))
                    criados += 1

        # 3. ART/RRT vencida ou vencendo
        arts = (await db.execute(
            select(ArtRrt).where(ArtRrt.objeto_id == objeto.id, ArtRrt.ativa == True)
        )).scalars().all()
        for art in arts:
            if art.data_validade:
                dias_rest = (art.data_validade - hoje).days
                if dias_rest < 0:
                    existe = await db.execute(
                        select(Alerta).where(
                            Alerta.objeto_id == objeto.id,
                            Alerta.tipo == TipoAlerta.ART_VENCIDA,
                            Alerta.resolvido == False,
                        )
                    )
                    if not existe.scalar_one_or_none():
                        db.add(Alerta(
                            objeto_id=objeto.id,
                            tipo=TipoAlerta.ART_VENCIDA,
                            prioridade=PrioridadeAlerta.CRITICA,
                            titulo=f"ART/RRT vencida — {art.tipo} {art.numero}",
                            descricao=f"Vencida em {art.data_validade.isoformat()}. Bloqueia assinatura de medições.",
                        ))
                        criados += 1
                elif dias_rest <= 30:
                    existe = await db.execute(
                        select(Alerta).where(
                            Alerta.objeto_id == objeto.id,
                            Alerta.tipo == TipoAlerta.ART_VENCENDO,
                            Alerta.resolvido == False,
                        )
                    )
                    if not existe.scalar_one_or_none():
                        db.add(Alerta(
                            objeto_id=objeto.id,
                            tipo=TipoAlerta.ART_VENCENDO,
                            prioridade=PrioridadeAlerta.MEDIA,
                            titulo=f"ART/RRT vence em {dias_rest} dias — {art.tipo} {art.numero}",
                            descricao=f"Validade: {art.data_validade.isoformat()}. Providencie a renovação.",
                        ))
                        criados += 1

        # 4. Objetos paralisados há muito tempo
        if objeto.status == StatusObjeto.PARALISADA:
            existe = await db.execute(
                select(Alerta).where(
                    Alerta.objeto_id == objeto.id,
                    Alerta.tipo == TipoAlerta.PARALISADA,
                    Alerta.resolvido == False,
                )
            )
            if not existe.scalar_one_or_none():
                db.add(Alerta(
                    objeto_id=objeto.id,
                    tipo=TipoAlerta.PARALISADA,
                    prioridade=PrioridadeAlerta.MEDIA,
                    titulo=f"Objeto paralisada — {objeto.titulo[:100]}",
                    descricao="Objeto está com status PARALISADA. Verifique se há justificativa ou ação necessária.",
                ))
                criados += 1

        # 5. RF11 — documentos contratuais vencendo ou vencidos (30 dias de antecedência)
        documentos = (await db.execute(
            select(Documento).where(
                Documento.objeto_id == objeto.id,
                Documento.ativo == True,  # noqa: E712
                Documento.data_validade.isnot(None),
            )
        )).scalars().all()
        for doc in documentos:
            dias_rest = (doc.data_validade - hoje).days
            tipo_alerta = None
            if dias_rest < 0:
                tipo_alerta = TipoAlerta.DOCUMENTO_VENCIDO
            elif dias_rest <= 30:
                tipo_alerta = TipoAlerta.DOCUMENTO_VENCENDO
            if tipo_alerta is None:
                continue
            existe = await db.execute(
                select(Alerta).where(
                    Alerta.objeto_id == objeto.id,
                    Alerta.tipo == tipo_alerta,
                    Alerta.resolvido == False,  # noqa: E712
                    Alerta.titulo.like(f"%{doc.tipo}%{doc.nome[:40]}%"),
                )
            )
            if not existe.scalar_one_or_none():
                vencido = tipo_alerta == TipoAlerta.DOCUMENTO_VENCIDO
                db.add(Alerta(
                    objeto_id=objeto.id,
                    tipo=tipo_alerta,
                    prioridade=PrioridadeAlerta.ALTA if vencido else PrioridadeAlerta.MEDIA,
                    titulo=f"Documento {doc.tipo} {'vencido' if vencido else f'vence em {dias_rest} dias'} — {doc.nome[:60]}",
                    descricao=f"Validade: {doc.data_validade.isoformat()}. Providencie a regularização.",
                ))
                criados += 1

        # 6. RN05 — tendência preditiva de atraso (apenas obras em execução não suspensas)
        if not sla_suspenso and objeto.status == StatusObjeto.EM_EXECUCAO:
            criados += await _avaliar_saude_preditiva(db, objeto)

    await db.flush()
    return criados


async def delegar_alerta(db: AsyncSession, alerta_id: UUID, delegado_para_id: UUID, prazo_acao: str | None) -> Alerta:
    result = await db.execute(select(Alerta).where(Alerta.id == alerta_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta não encontrado.")
    obj.delegado_para_id = delegado_para_id
    if prazo_acao:
        obj.prazo_acao = datetime.fromisoformat(prazo_acao)
    await db.flush()
    await db.refresh(obj)
    return obj


async def resolver_alerta(db: AsyncSession, alerta_id: UUID) -> Alerta:
    result = await db.execute(select(Alerta).where(Alerta.id == alerta_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta não encontrado.")
    obj.resolvido = True
    obj.resolvido_em = datetime.now(UTC)
    await db.flush()
    await db.refresh(obj)
    return obj
