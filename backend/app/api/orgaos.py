"""
SIN-Obras — Router de Órgãos
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.cadastro import Orgao
from app.models.usuario import Usuario

router = APIRouter(prefix="/orgaos", tags=["Órgãos"])


class OrgaoResponse(BaseModel):
    id: UUID
    sigla: str
    nome: str | None = None
    model_config = {"from_attributes": True}


@router.get("", response_model=List[OrgaoResponse])
async def list_orgaos(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    result = await db.execute(select(Orgao).order_by(Orgao.sigla))
    return result.scalars().all()
