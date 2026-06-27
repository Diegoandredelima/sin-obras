"""
SIN-Obras — Router de Acompanhamento de Prazos e Contratos.

Expõe endpoints para os 9 tipos de eventos contratuais e um endpoint
consolidado de timeline.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.acompanhamento import AditivoPrazo, Paralisacao, StatusTramitacao
from app.models.objeto import Objeto
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
from app.services.notificacao import criar_notificacao
from app.services.objeto import scope_objetos_por_usuario

router = APIRouter(prefix="/acompanhamento", tags=["Acompanhamento Contratual"])


async def _solicitante_se_empresa(db: AsyncSession, user: Usuario, objeto_id: UUID) -> UUID | None:
    """Valida e identifica solicitações da empresa (RF12/US-E05).

    Se o usuário é EMPRESA, garante que o objeto pertence a um contrato seu e
    retorna seu id (para marcar a solicitação como tramitação). Para perfis
    internos retorna ``None`` (cadastro direto, sem tramitação).
    """
    if Role(user.tipo) != Role.EMPRESA:
        return None
    stmt = scope_objetos_por_usuario(select(Objeto.id).where(Objeto.id == objeto_id), user)
    permitido = await db.scalar(stmt)
    if not permitido:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Empresa só pode registrar solicitações em objetos dos seus contratos.",
        )
    return user.id


async def _notificar_equipe(db: AsyncSession, titulo: str, mensagem: str) -> None:
    """Notifica Apoio N2 e Coordenadores sobre uma solicitação da empresa."""
    destinatarios = (await db.execute(
        select(Usuario).where(
            Usuario.tipo.in_([Role.APOIO_N2.value, Role.COORDENADOR.value, Role.ENGENHEIRO.value]),
            Usuario.ativo == True,
        )
    )).scalars().all()
    for u in destinatarios:
        await criar_notificacao(db=db, usuario_id=u.id, titulo=titulo, mensagem=mensagem)

# ---------------------------------------------------------------------------
# Timeline consolidada
# ---------------------------------------------------------------------------


@router.get("/objetos/{objeto_id}/eventos", response_model=EventoContratualResponse)
async def get_eventos_contratuais(
    objeto_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    """Retorna todos os eventos contratuais de uma objeto (timeline completa)."""
    return await svc.get_eventos_contratuais(db, objeto_id)


# ---------------------------------------------------------------------------
# Ordens de Serviço
# ---------------------------------------------------------------------------


@router.get(
    "/objetos/{objeto_id}/ordens-servico",
    response_model=list[OrdemServicoResponse],
)
async def list_ordens_servico(
    objeto_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    return await svc.list_ordens_servico(db, objeto_id)


@router.post(
    "/objetos/{objeto_id}/ordens-servico",
    response_model=OrdemServicoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_ordem_servico(
    objeto_id: UUID,
    payload: OrdemServicoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO)),
):
    obj = await svc.create_ordem_servico(db, objeto_id, payload)
    await registrar_auditoria(
        db, current_user.id, "OrdemServico", str(obj.id), "CREATE",
        dados_depois=payload.model_dump(mode="json"),
    )
    return obj


# ---------------------------------------------------------------------------
# Aditivos de Prazo
# ---------------------------------------------------------------------------


@router.get(
    "/objetos/{objeto_id}/aditivos-prazo",
    response_model=list[AditivoPrazoResponse],
)
async def list_aditivos_prazo(
    objeto_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    return await svc.list_aditivos_prazo(db, objeto_id)


@router.post(
    "/objetos/{objeto_id}/aditivos-prazo",
    response_model=AditivoPrazoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_aditivo_prazo(
    objeto_id: UUID,
    payload: AditivoPrazoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    """Solicita/cadastra um aditivo de prazo. Empresa pode solicitar nos seus
    contratos (tramitação RECEBIDA); perfis internos cadastram diretamente. (RF12)"""
    solicitante = await _solicitante_se_empresa(db, current_user, objeto_id)
    obj = await svc.create_aditivo_prazo(db, objeto_id, payload, solicitado_por_id=solicitante)
    await registrar_auditoria(
        db, current_user.id, "AditivoPrazo", str(obj.id), "CREATE",
        dados_depois=payload.model_dump(mode="json"),
    )
    if solicitante:
        await _notificar_equipe(
            db, "Nova solicitação de aditivo de prazo",
            f"A empresa solicitou um aditivo de prazo no objeto {objeto_id}.",
        )
    return obj


# ---------------------------------------------------------------------------
# Paralisações
# ---------------------------------------------------------------------------


@router.get(
    "/objetos/{objeto_id}/paralisacoes",
    response_model=list[ParalisacaoResponse],
)
async def list_paralisacoes(
    objeto_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    return await svc.list_paralisacoes(db, objeto_id)


@router.post(
    "/objetos/{objeto_id}/paralisacoes",
    response_model=ParalisacaoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_paralisacao(
    objeto_id: UUID,
    payload: ParalisacaoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    """Registra/solicita uma paralisação. Empresa pode formalizar nos seus
    contratos (tramitação RECEBIDA); perfis internos cadastram diretamente.
    RN10 — a paralisação suspende os alertas de SLA do objeto. (RF12)"""
    solicitante = await _solicitante_se_empresa(db, current_user, objeto_id)
    obj = await svc.create_paralisacao(db, objeto_id, payload, solicitado_por_id=solicitante)
    await registrar_auditoria(
        db, current_user.id, "Paralisacao", str(obj.id), "CREATE",
        dados_depois=payload.model_dump(mode="json"),
    )
    if solicitante:
        await _notificar_equipe(
            db, "Nova formalização de paralisação",
            f"A empresa formalizou uma paralisação no objeto {objeto_id}.",
        )
    return obj


# ---------------------------------------------------------------------------
# Tramitação de solicitações da empresa (RF12/US-E05)
# ---------------------------------------------------------------------------


@router.patch("/aditivos-prazo/{aditivo_id}/tramitacao", response_model=AditivoPrazoResponse)
async def tramitar_aditivo_prazo(
    aditivo_id: UUID,
    novo_status: StatusTramitacao,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N2)),
):
    """Atualiza a tramitação de um aditivo solicitado pela empresa."""
    obj = await svc.atualizar_status_tramitacao(db, AditivoPrazo, aditivo_id, novo_status)
    await registrar_auditoria(
        db, current_user.id, "AditivoPrazo", str(obj.id), "TRAMITACAO",
        dados_depois={"status_tramitacao": novo_status.value},
    )
    if obj.solicitado_por_id:
        await criar_notificacao(
            db=db, usuario_id=obj.solicitado_por_id,
            titulo=f"Aditivo de prazo {novo_status.value}",
            mensagem=f"Sua solicitação de aditivo foi atualizada para {novo_status.value}.",
        )
    return obj


@router.patch("/paralisacoes/{paralisacao_id}/tramitacao", response_model=ParalisacaoResponse)
async def tramitar_paralisacao(
    paralisacao_id: UUID,
    novo_status: StatusTramitacao,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N2)),
):
    """Atualiza a tramitação de uma paralisação solicitada pela empresa."""
    obj = await svc.atualizar_status_tramitacao(db, Paralisacao, paralisacao_id, novo_status)
    await registrar_auditoria(
        db, current_user.id, "Paralisacao", str(obj.id), "TRAMITACAO",
        dados_depois={"status_tramitacao": novo_status.value},
    )
    if obj.solicitado_por_id:
        await criar_notificacao(
            db=db, usuario_id=obj.solicitado_por_id,
            titulo=f"Paralisação {novo_status.value}",
            mensagem=f"Sua formalização de paralisação foi atualizada para {novo_status.value}.",
        )
    return obj


# ---------------------------------------------------------------------------
# Readequações
# ---------------------------------------------------------------------------


@router.get(
    "/objetos/{objeto_id}/readequacoes",
    response_model=list[ReadequacaoResponse],
)
async def list_readequacoes(
    objeto_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    return await svc.list_readequacoes(db, objeto_id)


@router.post(
    "/objetos/{objeto_id}/readequacoes",
    response_model=ReadequacaoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_readequacao(
    objeto_id: UUID,
    payload: ReadequacaoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO)),
):
    obj = await svc.create_readequacao(db, objeto_id, payload)
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
    "/objetos/{objeto_id}/termos-recebimento",
    response_model=list[TermoRecebimentoResponse],
)
async def list_termos_recebimento(
    objeto_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    return await svc.list_termos_recebimento(db, objeto_id)


@router.post(
    "/objetos/{objeto_id}/termos-recebimento",
    response_model=TermoRecebimentoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_termo_recebimento(
    objeto_id: UUID,
    payload: TermoRecebimentoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO)),
):
    obj = await svc.create_termo_recebimento(db, objeto_id, payload)
    await registrar_auditoria(
        db, current_user.id, "TermoRecebimento", str(obj.id), "CREATE",
        dados_depois=payload.model_dump(mode="json"),
    )
    return obj


# ---------------------------------------------------------------------------
# Notificações Extrajudiciais
# ---------------------------------------------------------------------------


@router.get(
    "/objetos/{objeto_id}/notificacoes-extrajudiciais",
    response_model=list[NotificacaoExtrajudicialResponse],
)
async def list_notificacoes_extrajudiciais(
    objeto_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    return await svc.list_notificacoes_extrajudiciais(db, objeto_id)


@router.post(
    "/objetos/{objeto_id}/notificacoes-extrajudiciais",
    response_model=NotificacaoExtrajudicialResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_notificacao_extrajudicial(
    objeto_id: UUID,
    payload: NotificacaoExtrajudicialCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO)),
):
    obj = await svc.create_notificacao_extrajudicial(db, objeto_id, payload)
    await registrar_auditoria(
        db, current_user.id, "NotificacaoExtrajudicial", str(obj.id), "CREATE",
        dados_depois=payload.model_dump(mode="json"),
    )
    return obj


# ---------------------------------------------------------------------------
# Portarias
# ---------------------------------------------------------------------------


@router.get(
    "/objetos/{objeto_id}/portarias",
    response_model=list[PortariaResponse],
)
async def list_portarias(
    objeto_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    return await svc.list_portarias(db, objeto_id)


@router.post(
    "/objetos/{objeto_id}/portarias",
    response_model=PortariaResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_portaria(
    objeto_id: UUID,
    payload: PortariaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO)),
):
    obj = await svc.create_portaria(db, objeto_id, payload)
    await registrar_auditoria(
        db, current_user.id, "Portaria", str(obj.id), "CREATE",
        dados_depois=payload.model_dump(mode="json"),
    )
    return obj
