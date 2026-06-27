from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.documento import TipoDocumento


class DocumentoResponse(BaseModel):
    id: UUID
    objeto_id: UUID
    tipo: TipoDocumento
    nome: str
    url_storage: str | None
    data_validade: date | None
    versao: int
    ativo: bool
    substitui_id: UUID | None
    criado_em: datetime

    model_config = {"from_attributes": True}
