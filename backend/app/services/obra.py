"""
SIN-Obras — Serviço de Obras
"""

from uuid import UUID
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.obra import Obra, StatusObra, SituacaoObra
from app.schemas.obra import ObraCreate, ObraUpdate


async def get_obras(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    status: StatusObra | None = None,
    situacao: SituacaoObra | None = None,
    municipio: str | None = None,
    contrato_id: str | None = None,
):
    q = select(Obra).where(Obra.ativo == True)

    if search:
        term = f"%{search}%"
        q = q.where(or_(Obra.titulo.ilike(term), Obra.municipio.ilike(term)))
    if status:
        q = q.where(Obra.status == status)
    if situacao:
        q = q.where(Obra.situacao == situacao)
    if municipio:
        q = q.where(Obra.municipio.ilike(f"%{municipio}%"))
    if contrato_id:
        q = q.where(Obra.contrato_id == contrato_id)

    q = q.order_by(Obra.criado_em.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


async def get_obras_stats(db: AsyncSession) -> dict:
    total = await db.scalar(select(func.count()).select_from(Obra).where(Obra.ativo == True))

    rows = await db.execute(
        select(Obra.situacao, func.count().label("n"))
        .where(Obra.ativo == True)
        .group_by(Obra.situacao)
    )
    por_situacao = {(r.situacao or "SEM_SITUACAO"): r.n for r in rows}

    rows2 = await db.execute(
        select(Obra.status, func.count().label("n"))
        .where(Obra.ativo == True)
        .group_by(Obra.status)
    )
    por_status = {r.status: r.n for r in rows2}

    return {
        "total": total or 0,
        "por_situacao": por_situacao,
        "por_status": por_status,
    }


async def get_obra_by_id(db: AsyncSession, obra_id: UUID) -> Obra:
    result = await db.execute(select(Obra).where(Obra.id == obra_id, Obra.ativo == True))
    obra = result.scalar_one_or_none()
    if not obra:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obra não encontrada.")
    return obra


async def create_obra(db: AsyncSession, obj_in: ObraCreate) -> Obra:
    data = obj_in.model_dump(exclude={"latitude", "longitude"})

    db_obj = Obra(**data)

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
