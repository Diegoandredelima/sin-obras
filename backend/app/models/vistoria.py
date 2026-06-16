"""
SIN-Obras — Modelos: Vistoria, ChecklistItem, FotoVistoria
(Bloco 4 — App Mobile de Fiscalização)
"""

import enum
import uuid
from datetime import datetime, timezone

from geoalchemy2 import Geometry
from sqlalchemy import (
    Boolean, DateTime, Enum, ForeignKey, String, Text
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ResultadoVistoria(str, enum.Enum):
    PENDENTE = "PENDENTE"
    CONFORME = "CONFORME"
    NAO_CONFORME = "NAO_CONFORME"


class Vistoria(Base):
    __tablename__ = "vistorias"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    obra_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("obras.id", ondelete="CASCADE"), nullable=False)
    fiscal_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    medicao_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("medicoes.id"), nullable=True)

    # Georreferenciamento do check-in
    local_checkin = mapped_column(Geometry("POINT", srid=4326), nullable=True)
    checkin_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    dentro_raio: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    distancia_metros: Mapped[float | None] = mapped_column(nullable=True)

    resultado: Mapped[str] = mapped_column(
        Enum(ResultadoVistoria, name="resultado_vistoria_enum"),
        default=ResultadoVistoria.PENDENTE,
        nullable=False
    )
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    finalizada_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self) -> str:
        return f"<Vistoria obra={self.obra_id} fiscal={self.fiscal_id} resultado={self.resultado}>"


class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vistoria_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vistorias.id", ondelete="CASCADE"), nullable=False)
    evento_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("eventos.id"), nullable=False)
    atestado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    observacao: Mapped[str | None] = mapped_column(Text, nullable=True)

    def __repr__(self) -> str:
        return f"<ChecklistItem vistoria={self.vistoria_id} atestado={self.atestado}>"


class FotoVistoria(Base):
    __tablename__ = "fotos_vistoria"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vistoria_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vistorias.id", ondelete="CASCADE"), nullable=False)
    checklist_item_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("checklist_items.id"), nullable=True)

    # Armazenamento
    url_storage: Mapped[str | None] = mapped_column(String(500), nullable=True)  # S3 / MinIO URL
    filename: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Georreferenciamento e inviolabilidade (RN03)
    coordenadas = mapped_column(Geometry("POINT", srid=4326), nullable=True)
    hash_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)
    carimbo_servidor: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    exif_metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Origem deve ser câmera nativa (não galeria) — validado no upload
    origem_camera: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self) -> str:
        return f"<FotoVistoria vistoria={self.vistoria_id} hash={self.hash_sha256[:8] if self.hash_sha256 else 'N/A'}>"
