"""
SIN-Obras — Schemas de Contrato
"""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------
class ContratoCreate(BaseModel):
    numero_processo: str = Field(..., max_length=50)
    numero_contrato: str = Field(..., max_length=50)
    valor_global: Decimal
    data_assinatura: date
    data_vigencia: date
    empresa_id: UUID
    objeto: str | None = None

class ContratoUpdate(BaseModel):
    numero_processo: str | None = Field(None, max_length=50)
    numero_contrato: str | None = Field(None, max_length=50)
    valor_global: Decimal | None = None
    data_assinatura: date | None = None
    data_vigencia: date | None = None
    empresa_id: UUID | None = None
    objeto: str | None = None

# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------
class ContratoResponse(BaseModel):
    id: UUID
    numero_processo: str
    numero_contrato: str
    valor_global: Decimal
    data_assinatura: date
    data_vigencia: date
    empresa_id: UUID
    objeto: str | None = None
    criado_em: datetime

    model_config = {"from_attributes": True}
