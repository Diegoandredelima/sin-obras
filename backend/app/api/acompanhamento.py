"""
SIN-Obras — Router de Acompanhamento de Prazos e Contratos.

Expõe endpoints para os 9 tipos de eventos contratuais e um endpoint
consolidado de timeline.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.usuario import Usuario
from app.schemas.acompanhamento import (
    AditivoPrazoCreate,
    AditivoPrazoResponse,
    ApostilamentoCreate,
    ApostilamentoResponse,
    EventoContratualResponse,
    NotificacaoExtrajudicialCreate,
    NotificacaoExtrajudicialResponse,
    OrdemServicoCreate,
    OrdemServicoResponse,
    ParalisacaoCreate,
    ParalisacaoResponse,
    PortariaCreate,
    PortariaResponse,
    ReadequacaoCreate,
    ReadequacaoResponse,
    ReajusteCreate,
    ReajusteResponse,
    TermoRecebimentoCreate,
    TermoRecebimentoResponse,
)
from app.services import acompanhamento as svc
from app.services.auditoria import registrar_auditoria

router = APIRouter(prefix="/acompanhamento", tags=["Acompanhamento Contratual"])

# ---------------------------------------------------------------------------
# Timeline consolidada
# ---------------------------------------------------------------------------


@router.get("/obras/{obra_id}/eventos", response_model=EventoContratualResponse)
async def get_eventos_contratuais(
    obra_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    """Retorna todos os eventos contratuais de uma obra (timeline completa)."""
    return await svc.get_eventos_contratuais(db, obra_id)


# ---------------------------------------------------------------------------
# Ordens de Serviço
# ---------------------------------------------------------------------------


@router.get(
    "/obras/{obra_id}/ordens-servico",
    response_model=list[OrdemServicoResponse],
)
async def list_ordens_servico(
    obra_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    return await svc.list_ordens_servico(db, obra_id)


@router.post(
    "/obras/{obra_id}/ordens-servico",
    response_model=OrdemServicoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_ordem_servico(
    obra_id: UUID,
    payload: OrdemServicoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO)),
):
    obj = await svc.create_ordem_servico(db, obra_id, payload)
    await registrar_auditoria(
        db, current_user.id, "OrdemServico", str(obj.id), "CREATE",
        dados_depois=payload.model_dump(mode="json"),
    )
    return obj


# ---------------------------------------------------------------------------
# Aditivos de Prazo
# ---------------------------------------------------------------------------


@router.get(
    "/obras/{obra_id}/aditivos-prazo",
    response_model=list[AditivoPrazoResponse],
)
async def list_aditivos_prazo(
    obra_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    return await svc.list_aditivos_prazo(db, obra_id)


@router.post(
    "/obras/{obra_id}/aditivos-prazo",
    response_model=AditivoPrazoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_aditivo_prazo(
    obra_id: UUID,
    payload: AditivoPrazoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO)),
):
    obj = await svc.create_aditivo_prazo(db, obra_id, payload)
    await registrar_auditoria(
        db, current_user.id, "AditivoPrazo", str(obj.id), "CREATE",
        dados_depois=payload.model_dump(mode="json"),
    )
    return obj


# ---------------------------------------------------------------------------
# Paralisações
# ---------------------------------------------------------------------------


@router.get(
    "/obras/{obra_id}/paralisacoes",
    response_model=list[ParalisacaoResponse],
)
async def list_paralisacoes(
    obra_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    return await svc.list_paralisacoes(db, obra_id)


@router.post(
    "/obras/{obra_id}/paralisacoes",
    response_model=ParalisacaoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_paralisacao(
    obra_id: UUID,
    payload: ParalisacaoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO)),
):
    obj = await svc.create_paralisacao(db, obra_id, payload)
    await registrar_auditoria(
        db, current_user.id, "Paralisacao", str(obj.id), "CREATE",
        dados_depois=payload.model_dump(mode="json"),
    )
    return obj


# ---------------------------------------------------------------------------
# Readequações
# ---------------------------------------------------------------------------


@router.get(
    "/obras/{obra_id}/readequacoes",
    response_model=list[ReadequacaoResponse],
)
async def list_readequacoes(
    obra_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    return await svc.list_readequacoes(db, obra_id)


@router.post(
    "/obras/{obra_id}/readequacoes",
    response_model=ReadequacaoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_readequacao(
    obra_id: UUID,
    payload: ReadequacaoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO)),
):
    obj = await svc.create_readequacao(db, obra_id, payload)
    await registrar_auditoria(
        db, current_user.id, "Readequacao", str(obj.id), "CREATE",
        dados_depois=payload.model_dump(mode="json"),
    )
    return obj


# ---------------------------------------------------------------------------
# Apostilamentos (vinculados a contrato)
# ---------------------------------------------------------------------------


@router.get(
    "/contratos/{contrato_id}/apostilamentos",
    response_model=list[ApostilamentoResponse],
)
async def list_apostilamentos(
    contrato_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    return await svc.list_apostilamentos(db, contrato_id)


@router.post(
    "/contratos/{contrato_id}/apostilamentos",
    response_model=ApostilamentoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_apostilamento(
    contrato_id: UUID,
    payload: ApostilamentoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO)),
):
    obj = await svc.create_apostilamento(db, contrato_id, payload)
    await registrar_auditoria(
        db, current_user.id, "Apostilamento", str(obj.id), "CREATE",
        dados_depois=payload.model_dump(mode="json"),
    )
    return obj


# ---------------------------------------------------------------------------
# Reajustes (vinculados a medição)
# ---------------------------------------------------------------------------


@router.get(
    "/medicoes/{medicao_id}/reajustes",
    response_model=list[ReajusteResponse],
)
async def list_reajustes(
    medicao_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    return await svc.list_reajustes(db, medicao_id)


@router.post(
    "/medicoes/{medicao_id}/reajustes",
    response_model=ReajusteResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_reajuste(
    medicao_id: UUID,
    payload: ReajusteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO)),
):
    obj = await svc.create_reajuste(db, medicao_id, payload)
    await registrar_auditoria(
        db, current_user.id, "Reajuste", str(obj.id), "CREATE",
        dados_depois=payload.model_dump(mode="json"),
    )
    return obj


# ---------------------------------------------------------------------------
# Termos de Recebimento
# ---------------------------------------------------------------------------


@router.get(
    "/obras/{obra_id}/termos-recebimento",
    response_model=list[TermoRecebimentoResponse],
)
async def list_termos_recebimento(
    obra_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    return await svc.list_termos_recebimento(db, obra_id)


@router.post(
    "/obras/{obra_id}/termos-recebimento",
    response_model=TermoRecebimentoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_termo_recebimento(
    obra_id: UUID,
    payload: TermoRecebimentoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO)),
):
    obj = await svc.create_termo_recebimento(db, obra_id, payload)
    await registrar_auditoria(
        db, current_user.id, "TermoRecebimento", str(obj.id), "CREATE",
        dados_depois=payload.model_dump(mode="json"),
    )
    return obj


# ---------------------------------------------------------------------------
# Notificações Extrajudiciais
# ---------------------------------------------------------------------------


@router.get(
    "/obras/{obra_id}/notificacoes-extrajudiciais",
    response_model=list[NotificacaoExtrajudicialResponse],
)
async def list_notificacoes_extrajudiciais(
    obra_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    return await svc.list_notificacoes_extrajudiciais(db, obra_id)


@router.post(
    "/obras/{obra_id}/notificacoes-extrajudiciais",
    response_model=NotificacaoExtrajudicialResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_notificacao_extrajudicial(
    obra_id: UUID,
    payload: NotificacaoExtrajudicialCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO)),
):
    obj = await svc.create_notificacao_extrajudicial(db, obra_id, payload)
    await registrar_auditoria(
        db, current_user.id, "NotificacaoExtrajudicial", str(obj.id), "CREATE",
        dados_depois=payload.model_dump(mode="json"),
    )
    return obj


# ---------------------------------------------------------------------------
# Portarias
# ---------------------------------------------------------------------------


@router.get(
    "/obras/{obra_id}/portarias",
    response_model=list[PortariaResponse],
)
async def list_portarias(
    obra_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    return await svc.list_portarias(db, obra_id)


@router.post(
    "/obras/{obra_id}/portarias",
    response_model=PortariaResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_portaria(
    obra_id: UUID,
    payload: PortariaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO)),
):
    obj = await svc.create_portaria(db, obra_id, payload)
    await registrar_auditoria(
        db, current_user.id, "Portaria", str(obj.id), "CREATE",
        dados_depois=payload.model_dump(mode="json"),
    )
    return obj
