"""
SIN-Obras — Schemas do Portal da Empresa (Diário de Obras, Medições, Notificações)
"""

from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.portal import CanalNotificacao, StatusMedicao


# ---------------------------------------------------------------------------
# Diário de Obras
# ---------------------------------------------------------------------------
class DiarioCreate(BaseModel):
    data_registro: date
    clima: str | None = Field(None, max_length=100)
    qtd_funcionarios: int = Field(default=0, ge=0)
    equipamentos: str | None = None
    ocorrencias: str | None = None
    atividades_realizadas: str | None = None

class DiarioUpdate(BaseModel):
    clima: str | None = None
    qtd_funcionarios: int | None = None
    equipamentos: str | None = None
    ocorrencias: str | None = None
    atividades_realizadas: str | None = None

class DiarioResponse(DiarioCreate):
    id: UUID
    obra_id: UUID
    usuario_id: UUID
    criado_em: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Medição
# ---------------------------------------------------------------------------
class EventoDeclarado(BaseModel):
    evento_id: UUID
    percentual_declarado: float = Field(..., ge=0, le=100)
    observacao: str | None = None

class MedicaoCreate(BaseModel):
    obra_id: UUID
    eventos_declarados: list[EventoDeclarado] = []

class MedicaoUpdate(BaseModel):
    eventos_declarados: list[EventoDeclarado] | None = None

class MedicaoAssinarRequest(BaseModel):
    """Confirmação de assinatura pela empresa"""
    confirmado: bool = True

class MedicaoFiscalRequest(BaseModel):
    """Ação do fiscal: aprovar ou reprovar"""
    aprovada: bool
    observacao_fiscal: str | None = None

class MedicaoResponse(BaseModel):
    id: UUID
    obra_id: UUID
    empresa_usuario_id: UUID
    numero_medicao: int
    status: StatusMedicao
    eventos_declarados: Any | None
    assinada_em: datetime | None
    enviada_em: datetime | None
    hash_assinatura: str | None
    observacao_fiscal: str | None
    criado_em: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Notificação
# ---------------------------------------------------------------------------
class NotificacaoResponse(BaseModel):
    id: UUID
    usuario_id: UUID
    titulo: str
    mensagem: str | None
    canal: CanalNotificacao
    lida: bool
    criado_em: datetime

    model_config = {"from_attributes": True}
