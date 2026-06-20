"""
SIN-Obras — Schemas de Vistoria (Bloco 4 — Mobile)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.vistoria import ResultadoVistoria


# ---------------------------------------------------------------------------
# Vistoria
# ---------------------------------------------------------------------------
class CheckinRequest(BaseModel):
    obra_id: UUID
    medicao_id: UUID | None = None
    latitude: float
    longitude: float

class ChecklistItemUpdate(BaseModel):
    atestado: bool
    observacao: str | None = None

class VistoriaFinalizarRequest(BaseModel):
    resultado: ResultadoVistoria
    observacoes: str | None = None

class ChecklistItemResponse(BaseModel):
    id: UUID
    vistoria_id: UUID
    evento_id: UUID
    atestado: bool
    observacao: str | None

    model_config = {"from_attributes": True}

class VistoriaResponse(BaseModel):
    id: UUID
    obra_id: UUID
    fiscal_id: UUID
    medicao_id: UUID | None
    checkin_em: datetime | None
    dentro_raio: bool
    distancia_metros: float | None
    resultado: ResultadoVistoria
    observacoes: str | None
    finalizada_em: datetime | None
    criado_em: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Foto
# ---------------------------------------------------------------------------
class FotoUploadResponse(BaseModel):
    id: UUID
    vistoria_id: UUID
    checklist_item_id: UUID | None
    url_storage: str | None
    hash_sha256: str | None
    carimbo_servidor: datetime | None
    dentro_raio: bool = True

    model_config = {"from_attributes": True}
