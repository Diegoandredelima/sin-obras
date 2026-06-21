"""
SIN-Obras — Schemas de Alertas
"""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AlertaResponse(BaseModel):
    id: UUID
    obra_id: UUID | None
    tipo: str
    prioridade: str
    titulo: str
    descricao: str | None
    resolvido: bool
    resolvido_em: datetime | None
    delegado_para_id: UUID | None
    prazo_acao: datetime | None
    criado_em: datetime

    model_config = {"from_attributes": True}


class AlertaDelegarRequest(BaseModel):
    delegado_para_id: UUID
    prazo_acao: str | None = None


class AlertaResolverRequest(BaseModel):
    resolvido: bool = True
