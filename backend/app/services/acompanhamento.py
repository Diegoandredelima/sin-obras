"""
SIN-Obras — Serviço de Acompanhamento de Prazos e Contratos.

Expõe CRUD para as 9 tabelas de acompanhamento e um endpoint consolidado
de timeline (todos os eventos contratuais de uma obra).
"""
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.acompanhamento import (
    AditivoPrazo,
    Apostilamento,
    NotificacaoExtrajudicial,
    OrdemServico,
    Paralisacao,
    Portaria,
    Readequacao,
    Reajuste,
    TermoRecebimento,
)
from app.models.obra import Contrato, Obra
from app.models.portal import Medicao
from app.schemas.acompanhamento import (
    AditivoPrazoCreate,
    ApostilamentoCreate,
    EventoContratualResponse,
    NotificacaoExtrajudicialCreate,
    OrdemServicoCreate,
    ParalisacaoCreate,
    PortariaCreate,
    ReadequacaoCreate,
    ReajusteCreate,
    TermoRecebimentoCreate,
)


async def _get_or_404(db: AsyncSession, model, obj_id: UUID):
    result = await db.execute(select(model).where(model.id == obj_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{model.__name__} não encontrado(a).",
        )
    return obj


# ---------------------------------------------------------------------------
# Eventos consolidados (timeline)
# ---------------------------------------------------------------------------
async def get_eventos_contratuais(
    db: AsyncSession, obra_id: UUID
) -> EventoContratualResponse:
    """Retorna todos os eventos contratuais vinculados a uma obra."""

    async def _fetch(model, filter_col):
        stmt = select(model).where(filter_col == obra_id).order_by(model.criado_em.desc())
        result = await db.execute(stmt)
        return result.scalars().all()

    ordens = await _fetch(OrdemServico, OrdemServico.obra_id)
    aditivos = await _fetch(AditivoPrazo, AditivoPrazo.obra_id)
    paralisacoes = await _fetch(Paralisacao, Paralisacao.obra_id)
    readequacoes = await _fetch(Readequacao, Readequacao.obra_id)
    termos = await _fetch(TermoRecebimento, TermoRecebimento.obra_id)
    notificacoes = await _fetch(NotificacaoExtrajudicial, NotificacaoExtrajudicial.obra_id)
    portarias = await _fetch(Portaria, Portaria.obra_id)

    # Apostilamento: vinculado a contrato → obra via contrato_id na tabela obras
    apost_stmt = (
        select(Apostilamento)
        .join(Contrato, Apostilamento.contrato_id == Contrato.id)
        .join(Obra, Obra.contrato_id == Contrato.id)
        .where(Obra.id == obra_id)
        .order_by(Apostilamento.criado_em.desc())
    )
    apost_result = await db.execute(apost_stmt)
    apostilamentos = apost_result.scalars().all()

    # Reajuste: vinculado a medição (que tem obra_id)
    reaj_stmt = (
        select(Reajuste)
        .join(Medicao, Reajuste.medicao_id == Medicao.id)
        .where(Medicao.obra_id == obra_id)
        .order_by(Reajuste.criado_em.desc())
    )
    reaj_result = await db.execute(reaj_stmt)
    reajustes = reaj_result.scalars().all()

    return EventoContratualResponse(
        ordens_servico=list(ordens),
        aditivos_prazo=list(aditivos),
        paralisacoes=list(paralisacoes),
        readequacoes=list(readequacoes),
        apostilamentos=list(apostilamentos),
        reajustes=list(reajustes),
        termos_recebimento=list(termos),
        notificacoes_extrajudiciais=list(notificacoes),
        portarias=list(portarias),
    )


# ---------------------------------------------------------------------------
# Ordens de Serviço
# ---------------------------------------------------------------------------
async def list_ordens_servico(db: AsyncSession, obra_id: UUID):
    stmt = select(OrdemServico).where(OrdemServico.obra_id == obra_id).order_by(OrdemServico.data_emissao.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


async def create_ordem_servico(db: AsyncSession, obra_id: UUID, obj_in: OrdemServicoCreate) -> OrdemServico:
    db_obj = OrdemServico(obra_id=obra_id, **obj_in.model_dump())
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


# ---------------------------------------------------------------------------
# Aditivos de Prazo
# ---------------------------------------------------------------------------
async def list_aditivos_prazo(db: AsyncSession, obra_id: UUID):
    stmt = select(AditivoPrazo).where(AditivoPrazo.obra_id == obra_id).order_by(AditivoPrazo.numero.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


async def create_aditivo_prazo(db: AsyncSession, obra_id: UUID, obj_in: AditivoPrazoCreate) -> AditivoPrazo:
    db_obj = AditivoPrazo(obra_id=obra_id, **obj_in.model_dump())
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


# ---------------------------------------------------------------------------
# Paralisações
# ---------------------------------------------------------------------------
async def list_paralisacoes(db: AsyncSession, obra_id: UUID):
    stmt = select(Paralisacao).where(Paralisacao.obra_id == obra_id).order_by(Paralisacao.data_evento.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


async def create_paralisacao(db: AsyncSession, obra_id: UUID, obj_in: ParalisacaoCreate) -> Paralisacao:
    db_obj = Paralisacao(obra_id=obra_id, **obj_in.model_dump())
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


# ---------------------------------------------------------------------------
# Readequações
# ---------------------------------------------------------------------------
async def list_readequacoes(db: AsyncSession, obra_id: UUID):
    stmt = select(Readequacao).where(Readequacao.obra_id == obra_id).order_by(Readequacao.numero.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


async def create_readequacao(db: AsyncSession, obra_id: UUID, obj_in: ReadequacaoCreate) -> Readequacao:
    db_obj = Readequacao(obra_id=obra_id, **obj_in.model_dump())
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


# ---------------------------------------------------------------------------
# Apostilamentos (vinculado a contrato)
# ---------------------------------------------------------------------------
async def list_apostilamentos(db: AsyncSession, contrato_id: UUID):
    stmt = select(Apostilamento).where(Apostilamento.contrato_id == contrato_id).order_by(Apostilamento.data_assinatura.desc().nullslast(), Apostilamento.criado_em.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


async def create_apostilamento(db: AsyncSession, contrato_id: UUID, obj_in: ApostilamentoCreate) -> Apostilamento:
    db_obj = Apostilamento(contrato_id=contrato_id, **obj_in.model_dump())
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


# ---------------------------------------------------------------------------
# Reajustes (vinculado a medição)
# ---------------------------------------------------------------------------
async def list_reajustes(db: AsyncSession, medicao_id: UUID):
    stmt = select(Reajuste).where(Reajuste.medicao_id == medicao_id).order_by(Reajuste.data_assinatura.desc().nullslast(), Reajuste.criado_em.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


async def create_reajuste(db: AsyncSession, medicao_id: UUID, obj_in: ReajusteCreate) -> Reajuste:
    db_obj = Reajuste(medicao_id=medicao_id, **obj_in.model_dump())
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


# ---------------------------------------------------------------------------
# Termos de Recebimento
# ---------------------------------------------------------------------------
async def list_termos_recebimento(db: AsyncSession, obra_id: UUID):
    stmt = select(TermoRecebimento).where(TermoRecebimento.obra_id == obra_id).order_by(TermoRecebimento.data_emissao.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


async def create_termo_recebimento(db: AsyncSession, obra_id: UUID, obj_in: TermoRecebimentoCreate) -> TermoRecebimento:
    db_obj = TermoRecebimento(obra_id=obra_id, **obj_in.model_dump())
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


# ---------------------------------------------------------------------------
# Notificações Extrajudiciais
# ---------------------------------------------------------------------------
async def list_notificacoes_extrajudiciais(db: AsyncSession, obra_id: UUID):
    stmt = select(NotificacaoExtrajudicial).where(NotificacaoExtrajudicial.obra_id == obra_id).order_by(NotificacaoExtrajudicial.data_emissao.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


async def create_notificacao_extrajudicial(db: AsyncSession, obra_id: UUID, obj_in: NotificacaoExtrajudicialCreate) -> NotificacaoExtrajudicial:
    db_obj = NotificacaoExtrajudicial(obra_id=obra_id, **obj_in.model_dump())
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


# ---------------------------------------------------------------------------
# Portarias
# ---------------------------------------------------------------------------
async def list_portarias(db: AsyncSession, obra_id: UUID):
    stmt = select(Portaria).where(Portaria.obra_id == obra_id).order_by(Portaria.data_emissao.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


async def create_portaria(db: AsyncSession, obra_id: UUID, obj_in: PortariaCreate) -> Portaria:
    db_obj = Portaria(obra_id=obra_id, **obj_in.model_dump())
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj
