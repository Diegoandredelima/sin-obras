"""
SIN-Obras — Router de Obras
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.usuario import Usuario
from app.schemas.obra import ObraCreate, ObraResponse, ObraUpdate, ObraDetalheResponse
from app.services import obra as obra_service
from app.services.auditoria import registrar_auditoria

router = APIRouter(prefix="/obras", tags=["Obras"])

@router.get("", response_model=List[ObraResponse])
async def list_obras(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Lista as obras ativas (com paginação)."""
    return await obra_service.get_obras(db, skip=skip, limit=limit)

@router.post("", response_model=ObraResponse, status_code=status.HTTP_201_CREATED)
async def create_obra(
    payload: ObraCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO))
):
    """Cadastra uma nova obra (Acesso: Engenheiro+)."""
    obra = await obra_service.create_obra(db, payload)
    
    await registrar_auditoria(
        db=db,
        usuario_id=current_user.id,
        entidade="Obra",
        entidade_id=str(obra.id),
        acao="CREATE",
        dados_depois=payload.model_dump(mode="json"),
        descricao=f"Obra '{obra.titulo}' cadastrada"
    )
    
    return obra

@router.get("/{id}", response_model=ObraDetalheResponse)
async def get_obra(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Detalhes de uma obra, incluindo metas (cronograma)."""
    return await obra_service.get_obra_by_id(db, id)

@router.put("/{id}", response_model=ObraResponse)
async def update_obra(
    id: UUID,
    payload: ObraUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO))
):
    """Atualiza uma obra (Acesso: Engenheiro+)."""
    obra = await obra_service.update_obra(db, id, payload)
    
    await registrar_auditoria(
        db=db,
        usuario_id=current_user.id,
        entidade="Obra",
        entidade_id=str(obra.id),
        acao="UPDATE",
        dados_depois=payload.model_dump(exclude_unset=True, mode="json"),
        descricao=f"Obra '{obra.titulo}' atualizada"
    )
    
    return obra

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_obra(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.COORDENADOR))
):
    """Remove uma obra (Soft delete) (Acesso: Coordenador+)."""
    obra = await obra_service.delete_obra(db, id)
    
    await registrar_auditoria(
        db=db,
        usuario_id=current_user.id,
        entidade="Obra",
        entidade_id=str(obra.id),
        acao="DELETE",
        descricao=f"Obra '{obra.titulo}' removida (soft delete)"
    )
