"""
SIN-Obras — Serviço de Contratos
"""

from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.obra import Contrato
from app.schemas.contrato import ContratoCreate, ContratoUpdate

async def get_contratos(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(Contrato).offset(skip).limit(limit))
    return result.scalars().all()

async def get_contrato_by_id(db: AsyncSession, contrato_id: UUID) -> Contrato:
    result = await db.execute(select(Contrato).where(Contrato.id == contrato_id))
    contrato = result.scalar_one_or_none()
    if not contrato:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contrato não encontrado.")
    return contrato

async def create_contrato(db: AsyncSession, obj_in: ContratoCreate) -> Contrato:
    # Verificar se número já existe
    result = await db.execute(select(Contrato).where(Contrato.numero_contrato == obj_in.numero_contrato))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Contrato com este número já existe.")
    
    db_obj = Contrato(**obj_in.model_dump())
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj

async def update_contrato(db: AsyncSession, contrato_id: UUID, obj_in: ContratoUpdate) -> Contrato:
    db_obj = await get_contrato_by_id(db, contrato_id)
    update_data = obj_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_obj, field, value)
        
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj
