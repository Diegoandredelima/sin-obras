"""
SIN-Obras — Schemas de Tarefa (Kanban)
"""

from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.tarefa import StatusTarefa, PrioridadeTarefa

class TarefaBase(BaseModel):
    titulo: str = Field(..., max_length=200)
    descricao: str | None = None
    status: StatusTarefa = StatusTarefa.A_FAZER
    prioridade: PrioridadeTarefa = PrioridadeTarefa.MEDIA
    prazo: date | None = None
    obra_id: UUID | None = None
    responsavel_id: UUID | None = None

class TarefaCreate(TarefaBase):
    pass

class TarefaUpdate(BaseModel):
    titulo: str | None = Field(None, max_length=200)
    descricao: str | None = None
    status: StatusTarefa | None = None
    prioridade: PrioridadeTarefa | None = None
    prazo: date | None = None
    obra_id: UUID | None = None
    responsavel_id: UUID | None = None

class TarefaResponse(TarefaBase):
    id: UUID
    criado_em: datetime

    model_config = {"from_attributes": True}
