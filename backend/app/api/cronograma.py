"""
SIN-Obras — Router de Cronograma (Metas, Submetas, Eventos)
"""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.usuario import Usuario
from app.schemas.objeto import (
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
@router.get("/objetos/{objeto_id}/metas", response_model=list[MetaResponse])
async def list_metas(
    objeto_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Lista as metas de uma objeto."""
    return await cronograma_service.get_metas_by_obra(db, objeto_id)

@router.post("/objetos/{objeto_id}/metas", response_model=MetaResponse, status_code=status.HTTP_201_CREATED)
async def create_meta(
    objeto_id: UUID,
    payload: MetaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N1))
):
    """Cria uma meta para a objeto."""
    payload.objeto_id = objeto_id
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
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N1))
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
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N1))
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
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N1))
):
    """Atualiza um evento."""
    evento = await cronograma_service.update_evento(db, id, payload)

    await registrar_auditoria(db, current_user.id, "Evento", str(evento.id), "UPDATE", dados_depois=payload.model_dump(mode="json"))
    return evento

@router.delete("/eventos/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_evento(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N1))
):
    """Exclui um evento."""
    await cronograma_service.delete_evento(db, id)
    await registrar_auditoria(db, current_user.id, "Evento", str(id), "DELETE", descricao=f"Evento {id} removido")
    return None
