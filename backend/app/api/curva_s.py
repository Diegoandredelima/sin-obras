"""
SIN-Obras — Router de Curva S Preditiva
"""
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.usuario import Usuario
from app.services import curva_s as curva_service

router = APIRouter(prefix="/curva-s", tags=["Curva S Preditiva"])


@router.get("/objetos/{objeto_id}")
async def get_curva_s(
    objeto_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL)),
):
    """Retorna dados da Curva S: Planejado, Realizado e Preditivo."""
    return await curva_service.compute_curva_s(db, objeto_id)
