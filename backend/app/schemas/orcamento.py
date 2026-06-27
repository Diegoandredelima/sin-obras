"""
SIN-Obras — Schemas do módulo de Orçamento (template / banco de dados técnico)

A EAP é criada de forma aninhada (cabeçalho → metas → submetas → eventos →
memória). No orçamento, ``valor_unitario`` é o CUSTO DIRETO; o BDI (``bdi_percentual``
do cabeçalho) é exibido pelo cliente e embutido no preço apenas ao copiar para o
Objeto. ``criterio_medicao`` é obrigatório em todo evento.
"""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.orcamento import StatusOrcamento
from app.schemas.objeto import EventoMemoriaLinha, EventoMemoriaResponse


# ---------------------------------------------------------------------------
# Evento do orçamento (serviço)
# ---------------------------------------------------------------------------
class OrcamentoEventoCreate(BaseModel):
    codigo_referencia: str | None = Field(None, max_length=50)
    descricao: str = Field(..., max_length=500)
    unidade: str = Field(default="un", max_length=20)
    quantidade: Decimal = Field(default=Decimal("0"))
    # Custo direto unitário (sem BDI).
    valor_unitario: Decimal = Field(default=Decimal("0"))
    # Obrigatório em TODO evento (mesmo un/vb): regra de medição da fiscalização.
    criterio_medicao: str = Field(..., min_length=1)
    memoria: list[EventoMemoriaLinha] | None = None


class OrcamentoEventoResponse(BaseModel):
    id: UUID
    codigo_referencia: str | None = None
    descricao: str
    unidade: str
    quantidade: Decimal
    valor_unitario: Decimal
    criterio_medicao: str | None = None
    valor_total: Decimal  # custo direto: quantidade × valor_unitario (sem BDI)
    memoria: list[EventoMemoriaResponse] = []

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Submeta / Meta do orçamento (EAP)
# ---------------------------------------------------------------------------
class OrcamentoSubmetaCreate(BaseModel):
    descricao: str = Field(..., max_length=500)
    valor: Decimal = Field(default=Decimal("0"))
    percentual_previsto: Decimal = Field(default=Decimal("0"))
    eventos: list[OrcamentoEventoCreate] = []


class OrcamentoSubmetaResponse(BaseModel):
    id: UUID
    descricao: str
    valor: Decimal
    percentual_previsto: Decimal
    eventos: list[OrcamentoEventoResponse] = []

    model_config = {"from_attributes": True}


class OrcamentoMetaCreate(BaseModel):
    descricao: str = Field(..., max_length=500)
    valor: Decimal = Field(default=Decimal("0"))
    ordem: int = 0
    submetas: list[OrcamentoSubmetaCreate] = []


class OrcamentoMetaResponse(BaseModel):
    id: UUID
    descricao: str
    valor: Decimal
    ordem: int
    submetas: list[OrcamentoSubmetaResponse] = []

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Orçamento (cabeçalho + EAP)
# ---------------------------------------------------------------------------
class OrcamentoCreate(BaseModel):
    titulo: str = Field(..., max_length=300)
    data_base: date | None = None
    bdi_percentual: Decimal = Field(default=Decimal("0"))
    descricao: str | None = None
    metas: list[OrcamentoMetaCreate] = []


class OrcamentoUpdate(BaseModel):
    titulo: str | None = Field(None, max_length=300)
    data_base: date | None = None
    bdi_percentual: Decimal | None = None
    descricao: str | None = None
    status: StatusOrcamento | None = None
    # Quando presente, substitui toda a EAP (replace-all).
    metas: list[OrcamentoMetaCreate] | None = None


class OrcamentoResumo(BaseModel):
    """Item de listagem/busca (sem a árvore)."""
    id: UUID
    codigo: str
    titulo: str
    data_base: date | None = None
    bdi_percentual: Decimal
    status: StatusOrcamento
    criado_em: datetime

    model_config = {"from_attributes": True}


class OrcamentoResponse(OrcamentoResumo):
    descricao: str | None = None
    metas: list[OrcamentoMetaResponse] = []
