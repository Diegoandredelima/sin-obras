"""
SIN-Obras — Router de Cronograma (Metas, Submetas, Eventos)
"""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.usuario import Usuario
from app.schemas.obra import (
    EventoBase,
    EventoCreate,
    EventoResponse,
    MetaCreate,
    MetaResponse,
    SubmetaCreate,
    SubmetaResponse,
)
from app.services import cronograma as cronograma_service
from app.services.auditoria import registrar_auditoria

router = APIRouter(prefix="/cronograma", tags=["Cronograma"])

# ---------------------------------------------------------------------------
# Metas
# ---------------------------------------------------------------------------
@router.get("/obras/{obra_id}/metas", response_model=list[MetaResponse])
async def list_metas(
    obra_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Lista as metas de uma obra."""
    return await cronograma_service.get_metas_by_obra(db, obra_id)

@router.post("/obras/{obra_id}/metas", response_model=MetaResponse, status_code=status.HTTP_201_CREATED)
async def create_meta(
    obra_id: UUID,
    payload: MetaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO))
):
    """Cria uma meta para a obra."""
    payload.obra_id = obra_id
    meta = await cronograma_service.create_meta(db, payload)

    await registrar_auditoria(db, current_user.id, "Meta", str(meta.id), "CREATE", dados_depois=payload.model_dump(mode="json"))
    return meta

# ---------------------------------------------------------------------------
# Submetas
# ---------------------------------------------------------------------------
@router.post("/metas/{meta_id}/submetas", response_model=SubmetaResponse, status_code=status.HTTP_201_CREATED)
async def create_submeta(
    meta_id: UUID,
    payload: SubmetaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO))
):
    """Cria uma submeta."""
    payload.meta_id = meta_id
    submeta = await cronograma_service.create_submeta(db, payload)

    await registrar_auditoria(db, current_user.id, "Submeta", str(submeta.id), "CREATE", dados_depois=payload.model_dump(mode="json"))
    return submeta

# ---------------------------------------------------------------------------
# Eventos
# ---------------------------------------------------------------------------
@router.post("/submetas/{submeta_id}/eventos", response_model=EventoResponse, status_code=status.HTTP_201_CREATED)
async def create_evento(
    submeta_id: UUID,
    payload: EventoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO))
):
    """Cria um evento."""
    payload.submeta_id = submeta_id
    evento = await cronograma_service.create_evento(db, payload)

    await registrar_auditoria(db, current_user.id, "Evento", str(evento.id), "CREATE", dados_depois=payload.model_dump(mode="json"))
    return evento

@router.put("/eventos/{id}", response_model=EventoResponse)
async def update_evento(
    id: UUID,
    payload: EventoBase,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO))
):
    """Atualiza um evento."""
    evento = await cronograma_service.update_evento(db, id, payload)

    await registrar_auditoria(db, current_user.id, "Evento", str(evento.id), "UPDATE", dados_depois=payload.model_dump(mode="json"))
    return evento
