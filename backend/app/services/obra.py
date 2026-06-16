"""
SIN-Obras — Serviço de Obras
"""

from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.obra import Obra
from app.schemas.obra import ObraCreate, ObraUpdate

async def get_obras(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(Obra).where(Obra.ativo == True).offset(skip).limit(limit))
    return result.scalars().all()

async def get_obra_by_id(db: AsyncSession, obra_id: UUID) -> Obra:
    result = await db.execute(select(Obra).where(Obra.id == obra_id, Obra.ativo == True))
    obra = result.scalar_one_or_none()
    if not obra:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obra não encontrada.")
    return obra

async def create_obra(db: AsyncSession, obj_in: ObraCreate) -> Obra:
    data = obj_in.model_dump(exclude={"latitude", "longitude"})
    
    db_obj = Obra(**data)
    
    # Se lat/long foram fornecidos, inserir como PostGIS Point
    if obj_in.latitude is not None and obj_in.longitude is not None:
        db_obj.localizacao = f"SRID=4326;POINT({obj_in.longitude} {obj_in.latitude})"
        
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj

async def update_obra(db: AsyncSession, obra_id: UUID, obj_in: ObraUpdate) -> Obra:
    db_obj = await get_obra_by_id(db, obra_id)
    update_data = obj_in.model_dump(exclude_unset=True, exclude={"latitude", "longitude"})
    
    for field, value in update_data.items():
        setattr(db_obj, field, value)
        
    if obj_in.latitude is not None and obj_in.longitude is not None:
        db_obj.localizacao = f"SRID=4326;POINT({obj_in.longitude} {obj_in.latitude})"
        
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj

async def delete_obra(db: AsyncSession, obra_id: UUID):
    db_obj = await get_obra_by_id(db, obra_id)
    db_obj.ativo = False
    db.add(db_obj)
    await db.flush()
    return db_obj
