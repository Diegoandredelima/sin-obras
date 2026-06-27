"""
SIN-Obras — Serviço de Cronograma (Metas, Submetas, Eventos)

Gerencia a estrutura hierárquica em 3 níveis do cronograma físico-financeiro:
  1. Meta (ex: Infraestrutura, Superestrutura)
  2. Submeta (ex: Fundações, Pilares, Lajes)
  3. Evento (ex: item de serviço unitário — m³ de concreto, m² de fôrma, etc.)

Esses itens formam a base para a declaração de medições e avanço de objetos.
"""

from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.objeto import Evento, EventoMemoria, Meta, Submeta
from app.schemas.objeto import EventoBase, EventoCreate, MetaCreate, SubmetaCreate


def _linhas_memoria_evento(memoria) -> list[EventoMemoria]:
    """Converte as linhas de memória de cálculo contratada (schema) em ORM."""
    return [
        EventoMemoria(
            ordem=linha.ordem if linha.ordem is not None else idx,
            descricao=linha.descricao,
            comprimento=linha.comprimento,
            largura=linha.largura,
            altura=linha.altura,
            percentual=linha.percentual,
            n_repeticoes=linha.n_repeticoes,
            quantidade=linha.quantidade,
        )
        for idx, linha in enumerate(memoria or [])
    ]


# ---------------------------------------------------------------------------
# Metas
# ---------------------------------------------------------------------------
async def create_meta(db: AsyncSession, obj_in: MetaCreate) -> Meta:
    db_obj = Meta(**obj_in.model_dump())
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj

async def get_metas_by_objeto(db: AsyncSession, objeto_id: UUID):
    result = await db.execute(select(Meta).where(Meta.objeto_id == objeto_id).order_by(Meta.ordem))
    return result.scalars().all()

# ---------------------------------------------------------------------------
# Submetas
# ---------------------------------------------------------------------------
async def create_submeta(db: AsyncSession, obj_in: SubmetaCreate) -> Submeta:
    db_obj = Submeta(**obj_in.model_dump())
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj

async def get_submetas_by_meta(db: AsyncSession, meta_id: UUID):
    result = await db.execute(select(Submeta).where(Submeta.meta_id == meta_id))
    return result.scalars().all()

# ---------------------------------------------------------------------------
# Eventos
# ---------------------------------------------------------------------------
async def create_evento(db: AsyncSession, obj_in: EventoCreate) -> Evento:
    data = obj_in.model_dump(exclude={"memoria"})
    db_obj = Evento(**data, memoria=_linhas_memoria_evento(obj_in.memoria))
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj

async def get_evento_by_id(db: AsyncSession, evento_id: UUID) -> Evento:
    result = await db.execute(select(Evento).where(Evento.id == evento_id))
    evento = result.scalar_one_or_none()
    if not evento:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento não encontrado.")
    return evento

async def _objeto_id_do_evento(db: AsyncSession, evento_id: UUID) -> UUID | None:
    """Resolve o objeto dono de um evento (Evento → Submeta → Meta → Objeto)."""
    result = await db.execute(
        select(Meta.objeto_id)
        .join(Submeta, Submeta.meta_id == Meta.id)
        .join(Evento, Evento.submeta_id == Submeta.id)
        .where(Evento.id == evento_id)
    )
    return result.scalar_one_or_none()


async def _bloquear_edicao_orcamento_com_medicao(db: AsyncSession, evento_id: UUID) -> None:
    """Decisão 2 — não editar/excluir evento (orçamento) com medição em andamento.

    Fecha a "porta dos fundos": o orçamento é metade da Linha de Base e não pode
    ser alterado enquanto houver medição aberta sobre o objeto.
    """
    objeto_id = await _objeto_id_do_evento(db, evento_id)
    if objeto_id and await check_medicoes_lock(db, objeto_id):
        raise HTTPException(
            status_code=409,
            detail="Não é possível alterar o orçamento. Finalize ou aprove a medição em andamento.",
        )


async def update_evento(db: AsyncSession, evento_id: UUID, obj_in: EventoBase) -> Evento:
    db_obj = await get_evento_by_id(db, evento_id)
    await _bloquear_edicao_orcamento_com_medicao(db, evento_id)
    update_data = obj_in.model_dump(exclude_unset=True)

    # Memória de cálculo contratada é tratada à parte (replace-all): só substitui
    # quando o campo veio explicitamente no payload.
    substituir_memoria = "memoria" in update_data
    nova_memoria = update_data.pop("memoria", None)

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    if substituir_memoria:
        db_obj.memoria.clear()
        db_obj.memoria.extend(_linhas_memoria_evento(obj_in.memoria))

    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj

async def delete_evento(db: AsyncSession, evento_id: UUID) -> None:
    db_obj = await get_evento_by_id(db, evento_id)
    await _bloquear_edicao_orcamento_com_medicao(db, evento_id)
    await db.delete(db_obj)
    await db.flush()

# ---------------------------------------------------------------------------
# Cronograma (Versões e Parcelas)
# ---------------------------------------------------------------------------
from app.models.objeto import CronogramaVersao, CronogramaParcela
from app.models.portal import Medicao, StatusMedicao
from app.schemas.objeto import CronogramaVersaoCreate

# Medições "em andamento" — bloqueiam o replanejamento do cronograma (Passo 3 do
# fluxo). Medições já finalizadas (APROVADA/REPROVADA) NÃO bloqueiam: o
# replanejamento por aditivo pressupõe parcelas passadas já executadas (Passo 5).
MEDICOES_EM_ANDAMENTO = (
    StatusMedicao.ASSINADA,
    StatusMedicao.EM_FISCALIZACAO,
    StatusMedicao.AGUARDANDO_CHEFE,
)


async def check_medicoes_lock(db: AsyncSession, objeto_id: UUID) -> bool:
    """Verifica se há medições em andamento que bloqueiem editar o cronograma."""
    result = await db.execute(
        select(Medicao.id)
        .where(Medicao.objeto_id == objeto_id)
        .where(Medicao.status.in_(MEDICOES_EM_ANDAMENTO))
        .limit(1)
    )
    return result.scalar_one_or_none() is not None


async def _validar_parcelas(db: AsyncSession, objeto_id: UUID, obj_in: CronogramaVersaoCreate) -> None:
    """Garante que cada parcela referencia um evento do objeto e que a soma
    distribuída por evento não excede a quantidade contratada."""
    if not obj_in.parcelas:
        return

    result_ev = await db.execute(
        select(Evento.id, Evento.quantidade)
        .join(Submeta, Evento.submeta_id == Submeta.id)
        .join(Meta, Submeta.meta_id == Meta.id)
        .where(Meta.objeto_id == objeto_id)
    )
    quant_por_evento = {row[0]: row[1] for row in result_ev}

    soma_por_evento: dict[UUID, Decimal] = {}
    for p in obj_in.parcelas:
        if p.evento_id not in quant_por_evento:
            raise HTTPException(
                status_code=422,
                detail=f"Evento {p.evento_id} não pertence a este objeto.",
            )
        soma_por_evento[p.evento_id] = soma_por_evento.get(p.evento_id, Decimal(0)) + p.quantidade_prevista

    for ev_id, soma in soma_por_evento.items():
        if soma > quant_por_evento[ev_id]:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Quantidade distribuída ({soma}) excede a quantidade "
                    f"contratada do evento ({quant_por_evento[ev_id]})."
                ),
            )


async def _orcamento_dos_eventos(db: AsyncSession, objeto_id: UUID) -> dict[UUID, tuple[Decimal, Decimal, str]]:
    """Mapa evento_id → (quantidade, valor_unitario, descricao) das linhas vivas.

    Usado para fotografar o orçamento no congelamento de uma versão (Decisão 2).
    """
    result = await db.execute(
        select(Evento.id, Evento.quantidade, Evento.valor_unitario, Evento.descricao)
        .join(Submeta, Evento.submeta_id == Submeta.id)
        .join(Meta, Submeta.meta_id == Meta.id)
        .where(Meta.objeto_id == objeto_id)
    )
    return {row[0]: (row[1], row[2], row[3]) for row in result.all()}


async def orcamento_contratado_por_evento(db: AsyncSession, objeto_id: UUID) -> dict[UUID, tuple[Decimal, Decimal, str | None]]:
    """Orçamento contratado vigente por evento: ``{evento_id: (qtd, vu, descricao)}``.

    Lê o **snapshot da versão ativa** do Planejamento (a fotografia congelada do
    orçamento). Se a versão ativa não tiver snapshot (versões antigas) ou não
    houver versão ativa, faz fallback para as linhas vivas de ``Evento``.
    """
    versao = await get_cronograma_versao_ativa(db, objeto_id)
    contratado: dict[UUID, tuple[Decimal, Decimal, str | None]] = {}
    if versao is not None:
        for p in versao.parcelas:
            if p.quantidade_contratada is not None and p.evento_id not in contratado:
                contratado[p.evento_id] = (
                    p.quantidade_contratada,
                    p.valor_unitario if p.valor_unitario is not None else Decimal("0"),
                    p.descricao_evento,
                )
    if contratado:
        return contratado
    # Fallback: linhas vivas do orçamento.
    return await _orcamento_dos_eventos(db, objeto_id)


async def create_cronograma_versao(db: AsyncSession, objeto_id: UUID, obj_in: CronogramaVersaoCreate, usuario_id: UUID | None = None) -> CronogramaVersao:
    if await check_medicoes_lock(db, objeto_id):
        raise HTTPException(
            status_code=409,
            detail="Não é possível alterar o cronograma. Finalize ou aprove a medição em andamento.",
        )

    await _validar_parcelas(db, objeto_id, obj_in)

    # Fotografa o orçamento (Decisão 2): cada parcela carrega a quantidade/preço/
    # descrição contratada do evento no momento do congelamento desta versão.
    orcamento = await _orcamento_dos_eventos(db, objeto_id)

    # Obtém o número da versão (MAX + 1)
    result_max = await db.execute(
        select(sa.func.max(CronogramaVersao.numero_versao)).where(CronogramaVersao.objeto_id == objeto_id)
    )
    max_versao = result_max.scalar() or 0
    nova_versao_numero = max_versao + 1

    # Desativa versões anteriores
    await db.execute(
        sa.update(CronogramaVersao)
        .where(CronogramaVersao.objeto_id == objeto_id)
        .values(ativa=False)
    )

    # Determina o total de períodos
    if not obj_in.parcelas:
        total_periodos = 0
    else:
        total_periodos = max(p.periodo_numero for p in obj_in.parcelas)

    linha_de_base = (nova_versao_numero == 1)

    db_versao = CronogramaVersao(
        objeto_id=objeto_id,
        numero_versao=nova_versao_numero,
        ativa=True,
        linha_de_base=linha_de_base,
        justificativa=obj_in.justificativa,
        total_periodos=total_periodos,
        criado_por_id=usuario_id,
        # Popula a coleção em memória (via relationship, não FK solta): assim a
        # serialização da resposta não dispara lazy-load no contexto async.
        parcelas=[
            CronogramaParcela(
                evento_id=p.evento_id,
                periodo_numero=p.periodo_numero,
                quantidade_prevista=p.quantidade_prevista,
                quantidade_contratada=orcamento.get(p.evento_id, (None, None, None))[0],
                valor_unitario=orcamento.get(p.evento_id, (None, None, None))[1],
                descricao_evento=orcamento.get(p.evento_id, (None, None, None))[2],
            )
            for p in obj_in.parcelas
        ],
    )
    db.add(db_versao)
    await db.flush()
    return db_versao

async def get_cronograma_versao_ativa(db: AsyncSession, objeto_id: UUID) -> CronogramaVersao | None:
    result = await db.execute(
        select(CronogramaVersao)
        .where(CronogramaVersao.objeto_id == objeto_id)
        .where(CronogramaVersao.ativa == True)
    )
    return result.scalar_one_or_none()
