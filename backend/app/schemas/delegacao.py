"""
SIN-Obras — Schemas de Delegação de Obras
"""
from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class DelegacaoCreate(BaseModel):
    obra_id: UUID
    usuario_id: UUID
    funcao: str = "FISCAL"
    data_inicio: date
    data_fim: date | None = None
    observacao: str | None = None


class DelegacaoResponse(BaseModel):
    id: UUID
    obra_id: UUID
    usuario_id: UUID
    delegado_por_id: UUID | None
    funcao: str
    data_inicio: date
    data_fim: date | None
    observacao: str | None
    ativo: bool
    criado_em: datetime

    model_config = {"from_attributes": True}
