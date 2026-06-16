"""
SIN-Obras — Router de ART/RRT
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.usuario import Usuario
from app.schemas.art_rrt import ArtRrtCreate, ArtRrtResponse
from app.services import art_rrt as art_rrt_service
from app.services.auditoria import registrar_auditoria

router = APIRouter(prefix="/art-rrt", tags=["ART/RRT"])

@router.get("/obra/{obra_id}", response_model=List[ArtRrtResponse])
async def list_art_rrt_by_obra(
    obra_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Lista as ARTs/RRTs ativas de uma obra."""
    return await art_rrt_service.get_art_rrt_by_obra(db, obra_id)

@router.post("", response_model=ArtRrtResponse, status_code=status.HTTP_201_CREATED)
async def create_art_rrt(
    payload: ArtRrtCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Upload/cadastro de ART/RRT."""
    art = await art_rrt_service.create_art_rrt(db, current_user.id, payload)
    
    await registrar_auditoria(db, current_user.id, "ArtRrt", str(art.id), "CREATE", dados_depois=payload.model_dump(mode="json"))
    return art

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_art_rrt(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Inativa uma ART/RRT."""
    art = await art_rrt_service.inativar_art_rrt(db, id)
    await registrar_auditoria(db, current_user.id, "ArtRrt", str(art.id), "UPDATE", descricao="ART inativada")
