"""
SIN-Obras — Serviço de Contratos
"""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.obra import Contrato
from app.schemas.contrato import ContratoCreate, ContratoUpdate


async def get_contratos(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    search: str | None = None,
    orgao: str | None = None,
):
    base = select(Contrato)

    if search:
        term = f"%{search}%"
        base = base.where(
            or_(
                Contrato.numero_contrato.ilike(term),
                Contrato.objeto.ilike(term),
                Contrato.fiscal_nome.ilike(term),
            )
        )
    if orgao:
        base = base.where(Contrato.orgao.ilike(f"%{orgao}%"))

    total = await db.scalar(select(func.count()).select_from(base.subquery()))

    q = base.order_by(Contrato.criado_em.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    items = result.scalars().all()

    return {"items": list(items), "total": total or 0, "skip": skip, "limit": limit}


async def get_contrato_by_id(db: AsyncSession, contrato_id: UUID) -> Contrato:
    result = await db.execute(select(Contrato).where(Contrato.id == contrato_id))
    contrato = result.scalar_one_or_none()
    if not contrato:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contrato não encontrado.")
    return contrato


async def create_contrato(db: AsyncSession, obj_in: ContratoCreate) -> Contrato:
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
