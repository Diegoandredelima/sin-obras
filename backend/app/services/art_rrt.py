"""
SIN-Obras — Serviço de ART/RRT

Este módulo gerencia o ciclo de vida dos registros de Anotação de Responsabilidade
Técnica (ART) e Registro de Responsabilidade Técnica (RRT), associando engenheiros
e empresas às respectivas obras, validando o período de vigência e ativação de termos.
"""

from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.art_rrt import ArtRrt
from app.schemas.art_rrt import ArtRrtCreate

async def get_art_rrt_by_obra(db: AsyncSession, obra_id: UUID):
    result = await db.execute(select(ArtRrt).where(ArtRrt.obra_id == obra_id, ArtRrt.ativa == True))
    return result.scalars().all()

async def create_art_rrt(db: AsyncSession, usuario_id: UUID, obj_in: ArtRrtCreate) -> ArtRrt:
    # Checar se já existe um documento com esse número
    result = await db.execute(select(ArtRrt).where(ArtRrt.numero == obj_in.numero))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ART/RRT com este número já existe.")

    db_obj = ArtRrt(**obj_in.model_dump(), usuario_id=usuario_id)
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj

async def inativar_art_rrt(db: AsyncSession, art_id: UUID):
    result = await db.execute(select(ArtRrt).where(ArtRrt.id == art_id))
    db_obj = result.scalar_one_or_none()
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ART/RRT não encontrada.")
    
    db_obj.ativa = False
    db.add(db_obj)
    await db.flush()
    return db_obj
