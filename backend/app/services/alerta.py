"""
SIN-Obras — Serviço de Alertas

Gera alertas automáticos com base em regras de negócio e consulta o banco.
"""
from datetime import UTC, date, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alerta import Alerta, PrioridadeAlerta, TipoAlerta
from app.models.art_rrt import ArtRrt
from app.models.objeto import Objeto, StatusObjeto
from app.models.vistoria import Vistoria


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


async def gerar_alertas(db: AsyncSession) -> int:
    """Varre as objetos e gera alertas para situações de risco. Retorna quantos foram criados."""
    criados = 0
    hoje = date.today()

    # Buscar todas as objetos ativas
    objetos = (await db.execute(select(Objeto))).scalars().all()

    for objeto in objetos:
        # 1. Prazo de execução vencido
        if objeto.execucao_fim and objeto.execucao_fim < hoje and objeto.status not in (StatusObjeto.CONCLUIDA,):
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
        if objeto.status == StatusObjeto.EM_EXECUCAO:
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
