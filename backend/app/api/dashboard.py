"""
SIN-Obras — Router do Dashboard Executivo (RF30)

Visão consolidada e read-only do portfólio para o Secretário (e Coordenador).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.usuario import Usuario
from app.services import dashboard as dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard Executivo"])


@router.get("/executivo")
async def dashboard_executivo(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.COORDENADOR)),
):
    """Indicadores consolidados do portfólio (RF30). Coordenador e Secretário."""
    return await dashboard_service.get_dashboard_executivo(db)


@router.get("/mapa")
async def mapa_calor(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL)),
):
    """Pontos georreferenciados das obras para o Mapa de Calor (RF20)."""
    return await dashboard_service.get_mapa_calor(db)
