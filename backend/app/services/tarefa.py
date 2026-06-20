"""
SIN-Obras — Serviço de Tarefas (Kanban)

Gerencia a distribuição de tarefas pontuais para equipes administrativas e de fiscalização
(ex: checagem de documentação, aprovação de laudos, etc.), servindo de apoio para
alimentar o painel visual Kanban no frontend.
"""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tarefa import Tarefa
from app.schemas.tarefa import TarefaCreate, TarefaUpdate


async def get_tarefas(db: AsyncSession, obra_id: UUID | None = None, responsavel_id: UUID | None = None):
    query = select(Tarefa)
    if obra_id:
        query = query.where(Tarefa.obra_id == obra_id)
    if responsavel_id:
        query = query.where(Tarefa.responsavel_id == responsavel_id)

    result = await db.execute(query.order_by(Tarefa.criado_em.desc()))
    return result.scalars().all()

async def get_tarefa_by_id(db: AsyncSession, tarefa_id: UUID) -> Tarefa:
    result = await db.execute(select(Tarefa).where(Tarefa.id == tarefa_id))
    tarefa = result.scalar_one_or_none()
    if not tarefa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa não encontrada.")
    return tarefa

async def create_tarefa(db: AsyncSession, obj_in: TarefaCreate) -> Tarefa:
    db_obj = Tarefa(**obj_in.model_dump())
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj

async def update_tarefa(db: AsyncSession, tarefa_id: UUID, obj_in: TarefaUpdate) -> Tarefa:
    db_obj = await get_tarefa_by_id(db, tarefa_id)
    update_data = obj_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj

async def delete_tarefa(db: AsyncSession, tarefa_id: UUID):
    db_obj = await get_tarefa_by_id(db, tarefa_id)
    await db.delete(db_obj)
    await db.flush()
