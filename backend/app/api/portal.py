"""
SIN-Obras — Router do Portal da Empresa Executora
Endpoints: Diário de Obras, Medições (com assinatura e fluxo de fiscalização)
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.usuario import Usuario
from app.schemas.portal import (
    DiarioCreate, DiarioResponse, DiarioUpdate,
    MedicaoCreate, MedicaoResponse, MedicaoUpdate,
    MedicaoAssinarRequest, MedicaoFiscalRequest,
)
from app.services import portal as portal_service
from app.services.notificacao import criar_notificacao
from app.services.auditoria import registrar_auditoria

router = APIRouter(prefix="/empresa", tags=["Portal da Empresa"])


# ---------------------------------------------------------------------------
# Diário de Obras
# ---------------------------------------------------------------------------
@router.get("/obras/{obra_id}/diario", response_model=List[DiarioResponse])
async def list_diario(
    obra_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Lista todos os registros do Diário de Obras."""
    return await portal_service.get_diario_by_obra(db, obra_id)


@router.post("/obras/{obra_id}/diario", response_model=DiarioResponse, status_code=status.HTTP_201_CREATED)
async def create_diario(
    obra_id: UUID,
    payload: DiarioCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Insere um novo registro no Diário de Obras."""
    registro = await portal_service.create_diario(db, obra_id, current_user.id, payload)
    await registrar_auditoria(db, current_user.id, "DiarioObra", str(registro.id), "CREATE",
                               dados_depois=payload.model_dump(mode="json"))
    return registro


@router.put("/diario/{id}", response_model=DiarioResponse)
async def update_diario(
    id: UUID,
    payload: DiarioUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Edita um registro do diário (somente pelo autor)."""
    return await portal_service.update_diario(db, id, current_user.id, payload)


# ---------------------------------------------------------------------------
# Medições
# ---------------------------------------------------------------------------
@router.get("/obras/{obra_id}/medicoes", response_model=List[MedicaoResponse])
async def list_medicoes(
    obra_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Lista as medições de uma obra."""
    return await portal_service.get_medicoes_by_obra(db, obra_id)


@router.post("/obras/{obra_id}/medicoes", response_model=MedicaoResponse, status_code=status.HTTP_201_CREATED)
async def create_medicao(
    obra_id: UUID,
    payload: MedicaoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Cria uma medição em rascunho."""
    payload.obra_id = obra_id
    medicao = await portal_service.create_medicao(db, current_user.id, payload)
    await registrar_auditoria(db, current_user.id, "Medicao", str(medicao.id), "CREATE",
                               descricao=f"Medição #{medicao.numero_medicao} criada como rascunho")
    return medicao


@router.get("/medicoes/{id}", response_model=MedicaoResponse)
async def get_medicao(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Detalhes de uma medição."""
    return await portal_service.get_medicao_by_id(db, id)


@router.put("/medicoes/{id}", response_model=MedicaoResponse)
async def update_medicao(
    id: UUID,
    payload: MedicaoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Edita um rascunho de medição."""
    return await portal_service.update_medicao(db, id, current_user.id, payload)


@router.post("/medicoes/{id}/assinar", response_model=MedicaoResponse)
async def assinar_medicao(
    id: UUID,
    payload: MedicaoAssinarRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """
    Assina digitalmente a medição e envia para fiscalização.
    RN01 — Requer ART ativa vinculada à obra.
    """
    medicao = await portal_service.assinar_medicao(db, id, current_user.id)
    await registrar_auditoria(db, current_user.id, "Medicao", str(medicao.id), "ASSINAR",
                               descricao=f"Medição #{medicao.numero_medicao} assinada (hash: {medicao.hash_assinatura[:12]}...)")
    return medicao


@router.post("/medicoes/{id}/avaliar", response_model=MedicaoResponse)
async def avaliar_medicao(
    id: UUID,
    payload: MedicaoFiscalRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL))
):
    """
    Fiscal aprova ou reprova uma medição.
    RN02 — Resultado altera status da medição.
    """
    medicao = await portal_service.avaliar_medicao(db, id, payload.aprovada, payload.observacao_fiscal)

    status_label = "APROVADA" if payload.aprovada else "REPROVADA"
    await registrar_auditoria(db, current_user.id, "Medicao", str(medicao.id), "AVALIAR",
                               descricao=f"Medição #{medicao.numero_medicao} {status_label} pelo fiscal")

    # Notificar a empresa
    await criar_notificacao(
        db=db,
        usuario_id=medicao.empresa_usuario_id,
        titulo=f"Medição #{medicao.numero_medicao} {status_label}",
        mensagem=payload.observacao_fiscal or f"Sua medição foi {status_label.lower()} pelo fiscal responsável.",
    )

    return medicao
