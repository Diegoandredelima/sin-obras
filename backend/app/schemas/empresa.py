"""
SIN-Obras — Schemas de Empresa
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class EmpresaResumo(BaseModel):
    id: UUID
    razao_social: str
    cnpj: str | None = None
    model_config = {"from_attributes": True}


class ContratoResumo(BaseModel):
    id: UUID
    numero_contrato: str
    numero_processo: str
    valor_global: float
    data_assinatura: str | None = None
    data_vigencia: str | None = None
    objeto: str | None = None
    orgao: str | None = None
    model_config = {"from_attributes": True}


class EmpresaDetalhe(EmpresaResumo):
    criado_em: datetime
    total_contratos: int = 0
    total_obras: int = 0
