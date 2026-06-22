"""
SIN-Obras — Schemas de Empresa
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class EmpresaBase(BaseModel):
    razao_social: str = Field(min_length=1, max_length=300)
    cnpj: str | None = Field(default=None, max_length=18)
    nome_fantasia: str | None = Field(default=None, max_length=300)
    email: str | None = Field(default=None, max_length=200)
    telefone: str | None = Field(default=None, max_length=40)
    endereco: str | None = Field(default=None, max_length=300)
    municipio: str | None = Field(default=None, max_length=120)
    uf: str | None = Field(default=None, max_length=2)
    representante_legal: str | None = Field(default=None, max_length=200)
    observacoes: str | None = None


class EmpresaCreate(EmpresaBase):
    pass


class EmpresaUpdate(BaseModel):
    razao_social: str | None = Field(default=None, min_length=1, max_length=300)
    cnpj: str | None = Field(default=None, max_length=18)
    nome_fantasia: str | None = Field(default=None, max_length=300)
    email: str | None = Field(default=None, max_length=200)
    telefone: str | None = Field(default=None, max_length=40)
    endereco: str | None = Field(default=None, max_length=300)
    municipio: str | None = Field(default=None, max_length=120)
    uf: str | None = Field(default=None, max_length=2)
    representante_legal: str | None = Field(default=None, max_length=200)
    observacoes: str | None = None


class EmpresaResumo(BaseModel):
    id: UUID
    razao_social: str
    cnpj: str | None = None
    nome_fantasia: str | None = None
    email: str | None = None
    telefone: str | None = None
    endereco: str | None = None
    municipio: str | None = None
    uf: str | None = None
    representante_legal: str | None = None
    observacoes: str | None = None
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


class EmpresaListItem(EmpresaResumo):
    """Item de listagem com contadores agregados para os cards/lista."""
    criado_em: datetime
    total_contratos: int = 0
    total_obras: int = 0
