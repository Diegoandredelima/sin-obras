"""
SIN-Obras — Schemas de Objeto, Item, Meta, Submeta e Evento
"""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.objeto import SaudeObjeto, SituacaoObjeto, StatusObjeto


# ---------------------------------------------------------------------------
# Evento
# ---------------------------------------------------------------------------
class EventoBase(BaseModel):
    descricao: str = Field(..., max_length=500)
    quantidade: Decimal = Field(default=Decimal("0.0"))
    unidade: str = Field(default="un", max_length=20)
    valor_unitario: Decimal = Field(default=Decimal("0.0"))

class EventoCreate(EventoBase):
    submeta_id: UUID

class EventoResponse(EventoBase):
    id: UUID
    submeta_id: UUID
    valor_total: Decimal

    model_config = {"from_attributes": True}

# ---------------------------------------------------------------------------
# Submeta
# ---------------------------------------------------------------------------
class SubmetaBase(BaseModel):
    descricao: str = Field(..., max_length=500)
    valor: Decimal = Field(default=Decimal("0.0"))
    percentual_previsto: Decimal = Field(default=Decimal("0.0"))

class SubmetaCreate(SubmetaBase):
    meta_id: UUID

class SubmetaResponse(SubmetaBase):
    id: UUID
    meta_id: UUID
    eventos: list[EventoResponse] = []

    model_config = {"from_attributes": True}

# ---------------------------------------------------------------------------
# Meta
# ---------------------------------------------------------------------------
class MetaBase(BaseModel):
    descricao: str = Field(..., max_length=500)
    valor: Decimal = Field(default=Decimal("0.0"))
    ordem: int = 0

class MetaCreate(MetaBase):
    objeto_id: UUID

class MetaResponse(MetaBase):
    id: UUID
    objeto_id: UUID
    submetas: list[SubmetaResponse] = []

    model_config = {"from_attributes": True}

# ---------------------------------------------------------------------------
# Item (partes constitutivas do objeto)
# ---------------------------------------------------------------------------
class ItemBase(BaseModel):
    descricao: str = Field(..., max_length=500)
    unidade: str = Field(default="un", max_length=20)
    quantidade: Decimal = Field(default=Decimal("0.0"))
    valor_unitario: Decimal = Field(default=Decimal("0.0"))
    ordem: int = 0

class ItemCreate(ItemBase):
    # Definido pelo path da rota (/objetos/{id}/itens); opcional no corpo.
    objeto_id: UUID | None = None

class ItemUpdate(BaseModel):
    descricao: str | None = Field(None, max_length=500)
    unidade: str | None = Field(None, max_length=20)
    quantidade: Decimal | None = None
    valor_unitario: Decimal | None = None
    ordem: int | None = None

class ItemResponse(ItemBase):
    id: UUID
    objeto_id: UUID
    valor_total: Decimal

    model_config = {"from_attributes": True}

# ---------------------------------------------------------------------------
# Objeto
# ---------------------------------------------------------------------------
class ObjetoBase(BaseModel):
    titulo: str = Field(..., max_length=300)
    descricao: str | None = None
    endereco: str | None = Field(None, max_length=500)
    cep: str | None = Field(None, max_length=9)
    logradouro: str | None = Field(None, max_length=300)
    numero: str | None = Field(None, max_length=20)
    bairro: str | None = Field(None, max_length=150)
    conjunto: str | None = Field(None, max_length=150)
    uf: str | None = Field(None, max_length=2)
    municipio: str | None = Field(None, max_length=100)
    valor_contrato: Decimal | None = None
    orgao: str | None = Field(None, max_length=100)
    data_inicio: date | None = None
    data_fim_prevista: date | None = None
    status: StatusObjeto = StatusObjeto.PLANEJADA
    saude: SaudeObjeto = SaudeObjeto.VERDE
    percentual_executado: Decimal = Field(default=Decimal("0.0"))
    raio_geofencing_metros: int = 200
    contrato_id: UUID | None = None
    responsavel_id: UUID | None = None

class ObjetoCreate(ObjetoBase):
    latitude: float | None = Field(None, description="Latitude para o PostGIS")
    longitude: float | None = Field(None, description="Longitude para o PostGIS")

class ObjetoUpdate(BaseModel):
    titulo: str | None = Field(None, max_length=300)
    descricao: str | None = None
    endereco: str | None = Field(None, max_length=500)
    cep: str | None = Field(None, max_length=9)
    logradouro: str | None = Field(None, max_length=300)
    numero: str | None = Field(None, max_length=20)
    bairro: str | None = Field(None, max_length=150)
    conjunto: str | None = Field(None, max_length=150)
    uf: str | None = Field(None, max_length=2)
    municipio: str | None = Field(None, max_length=100)
    valor_contrato: Decimal | None = None
    data_inicio: date | None = None
    data_fim_prevista: date | None = None
    status: StatusObjeto | None = None
    saude: SaudeObjeto | None = None
    percentual_executado: Decimal | None = None
    raio_geofencing_metros: int | None = None
    contrato_id: UUID | None = None
    responsavel_id: UUID | None = None
    gestor_id: UUID | None = None
    latitude: float | None = None
    longitude: float | None = None
    ativo: bool | None = None
    data_ordem_servico: date | None = None
    orgao: str | None = Field(None, max_length=100)
    historico: str | None = None
    observacoes: str | None = None
    importante: str | None = None

class ObjetoResponse(ObjetoBase):
    id: UUID
    ativo: bool
    criado_por_id: UUID | None = None
    criado_em: datetime
    atualizado_em: datetime

    # Campos da planilha oficial
    situacao: SituacaoObjeto | None = None
    situacao_origem: str | None = None
    ano_referencia: int | None = None
    orgao: str | None = None
    vigencia_inicio: date | None = None
    vigencia_fim: date | None = None
    execucao_inicio: date | None = None
    execucao_fim: date | None = None
    valor_medido: Decimal | None = None
    saldo_a_medir: Decimal | None = None

    # Coordenadas extraídas do PostGIS
    latitude: float | None = None
    longitude: float | None = None

    model_config = {"from_attributes": True}

class ObjetoDetalheResponse(ObjetoResponse):
    prazo_inicial_dias: int | None = None
    vigencia_dias: int | None = None
    execucao_dias: int | None = None
    historico: str | None = None
    importante: str | None = None
    observacoes: str | None = None
    itens: list[ItemResponse] = []
    metas: list[MetaResponse] = []
