"""
SIN-Obras — Serviço de Cronograma (Metas, Submetas, Eventos)

Gerencia a estrutura hierárquica em 3 níveis do cronograma físico-financeiro:
  1. Meta (ex: Infraestrutura, Superestrutura)
  2. Submeta (ex: Fundações, Pilares, Lajes)
  3. Evento (ex: item de serviço unitário — m³ de concreto, m² de fôrma, etc.)

Esses itens formam a base para a declaração de medições e avanço de obras.
"""

from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.obra import Meta, Submeta, Evento
from app.schemas.obra import MetaCreate, SubmetaCreate, EventoCreate, EventoBase

# ---------------------------------------------------------------------------
# Metas
# ---------------------------------------------------------------------------
async def create_meta(db: AsyncSession, obj_in: MetaCreate) -> Meta:
    db_obj = Meta(**obj_in.model_dump())
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj

async def get_metas_by_obra(db: AsyncSession, obra_id: UUID):
    result = await db.execute(select(Meta).where(Meta.obra_id == obra_id).order_by(Meta.ordem))
    return result.scalars().all()

# ---------------------------------------------------------------------------
# Submetas
# ---------------------------------------------------------------------------
async def create_submeta(db: AsyncSession, obj_in: SubmetaCreate) -> Submeta:
    db_obj = Submeta(**obj_in.model_dump())
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj

async def get_submetas_by_meta(db: AsyncSession, meta_id: UUID):
    result = await db.execute(select(Submeta).where(Submeta.meta_id == meta_id))
    return result.scalars().all()

# ---------------------------------------------------------------------------
# Eventos
# ---------------------------------------------------------------------------
async def create_evento(db: AsyncSession, obj_in: EventoCreate) -> Evento:
    db_obj = Evento(**obj_in.model_dump())
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj

async def get_evento_by_id(db: AsyncSession, evento_id: UUID) -> Evento:
    result = await db.execute(select(Evento).where(Evento.id == evento_id))
    evento = result.scalar_one_or_none()
    if not evento:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento não encontrado.")
    return evento

async def update_evento(db: AsyncSession, evento_id: UUID, obj_in: EventoBase) -> Evento:
    db_obj = await get_evento_by_id(db, evento_id)
    update_data = obj_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_obj, field, value)
        
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj
