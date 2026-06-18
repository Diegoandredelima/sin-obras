"""
SIN-Obras — Schemas de Obra, Meta, Submeta e Evento
"""

from datetime import date, datetime
from decimal import Decimal
from typing import List
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.obra import StatusObra, SaudeObra, SituacaoObra

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
    eventos: List[EventoResponse] = []

    model_config = {"from_attributes": True}

# ---------------------------------------------------------------------------
# Meta
# ---------------------------------------------------------------------------
class MetaBase(BaseModel):
    descricao: str = Field(..., max_length=500)
    valor: Decimal = Field(default=Decimal("0.0"))
    ordem: int = 0

class MetaCreate(MetaBase):
    obra_id: UUID

class MetaResponse(MetaBase):
    id: UUID
    obra_id: UUID
    submetas: List[SubmetaResponse] = []

    model_config = {"from_attributes": True}

# ---------------------------------------------------------------------------
# Obra
# ---------------------------------------------------------------------------
class ObraBase(BaseModel):
    titulo: str = Field(..., max_length=300)
    descricao: str | None = None
    endereco: str | None = Field(None, max_length=500)
    municipio: str | None = Field(None, max_length=100)
    valor_contrato: Decimal
    data_inicio: date | None = None
    data_fim_prevista: date | None = None
    status: StatusObra = StatusObra.PLANEJADA
    saude: SaudeObra = SaudeObra.VERDE
    percentual_executado: Decimal = Field(default=Decimal("0.0"))
    raio_geofencing_metros: int = 200
    contrato_id: UUID | None = None
    responsavel_id: UUID | None = None

class ObraCreate(ObraBase):
    latitude: float | None = Field(None, description="Latitude para o PostGIS")
    longitude: float | None = Field(None, description="Longitude para o PostGIS")

class ObraUpdate(BaseModel):
    titulo: str | None = Field(None, max_length=300)
    descricao: str | None = None
    endereco: str | None = Field(None, max_length=500)
    municipio: str | None = Field(None, max_length=100)
    valor_contrato: Decimal | None = None
    data_inicio: date | None = None
    data_fim_prevista: date | None = None
    status: StatusObra | None = None
    saude: SaudeObra | None = None
    percentual_executado: Decimal | None = None
    raio_geofencing_metros: int | None = None
    contrato_id: UUID | None = None
    responsavel_id: UUID | None = None
    latitude: float | None = None
    longitude: float | None = None
    ativo: bool | None = None

class ObraResponse(ObraBase):
    id: UUID
    ativo: bool
    criado_em: datetime
    atualizado_em: datetime

    # Campos da planilha oficial
    situacao: SituacaoObra | None = None
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

class ObraDetalheResponse(ObraResponse):
    prazo_inicial_dias: int | None = None
    vigencia_dias: int | None = None
    execucao_dias: int | None = None
    historico: str | None = None
    importante: str | None = None
    observacoes: str | None = None
    metas: List[MetaResponse] = []
