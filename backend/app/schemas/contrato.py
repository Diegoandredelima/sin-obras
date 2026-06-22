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
    data_assinatura: date | None = None
    data_vigencia: date | None = None
    empresa_id: UUID | None = None
    empresa_ref_id: UUID | None = None
    obra_id: UUID | None = None
    orgao_id: UUID | None = None
    orgao: str | None = Field(None, max_length=100)
    objeto: str | None = None

class ContratoUpdate(BaseModel):
    numero_processo: str | None = Field(None, max_length=50)
    numero_contrato: str | None = Field(None, max_length=50)
    valor_global: Decimal | None = None
    data_assinatura: date | None = None
    data_vigencia: date | None = None
    empresa_id: UUID | None = None
    empresa_ref_id: UUID | None = None
    obra_id: UUID | None = None
    orgao_id: UUID | None = None
    orgao: str | None = Field(None, max_length=100)
    objeto: str | None = None

# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------
class EmpresaResumo(BaseModel):
    id: UUID
    razao_social: str
    cnpj: str | None = None
    model_config = {"from_attributes": True}

class OrgaoResumo(BaseModel):
    id: UUID
    sigla: str
    nome: str | None = None
    model_config = {"from_attributes": True}

class ContratoResponse(BaseModel):
    id: UUID
    numero_processo: str
    numero_contrato: str
    valor_global: Decimal
    valor_aditivo: Decimal | None = None
    valor_reajustado: Decimal | None = None
    valor_final: Decimal | None = None
    recurso_federal: Decimal | None = None
    recurso_estadual: Decimal | None = None
    data_assinatura: date | None = None
    data_vigencia: date | None = None
    empresa_id: UUID | None = None
    empresa_ref_id: UUID | None = None
    obra_id: UUID | None = None
    orgao_id: UUID | None = None
    orgao: str | None = None
    fiscal_nome: str | None = None
    gestor_nome: str | None = None
    tipo_licitacao: str | None = None
    numero_licitacao: str | None = None
    matricula_cei: str | None = None
    objeto: str | None = None
    criado_em: datetime

    empresa_ref: EmpresaResumo | None = None
    orgao_ref: OrgaoResumo | None = None

    model_config = {"from_attributes": True}
