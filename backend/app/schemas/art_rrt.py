"""
SIN-Obras — Schemas de ART/RRT
"""

from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, Field

class ArtRrtBase(BaseModel):
    numero: str = Field(..., max_length=100)
    tipo: str = Field(..., max_length=10) # 'ART' ou 'RRT'
    obra_id: UUID
    data_emissao: date | None = None
    data_validade: date | None = None
    arquivo_url: str | None = None
    ativa: bool = True

class ArtRrtCreate(ArtRrtBase):
    pass

class ArtRrtResponse(ArtRrtBase):
    id: UUID
    usuario_id: UUID
    criado_em: datetime

    model_config = {"from_attributes": True}
