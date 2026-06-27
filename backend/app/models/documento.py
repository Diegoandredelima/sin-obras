"""
SIN-Obras — Modelo: Documentos Contratuais (RF11)

Repositório de documentos do contrato/obra (ART, plantas, licenças, garantias,
seguros) com versionamento (novo documento substitui o anterior, preservando o
histórico) e controle de vencimento.
"""
import enum
import uuid
from datetime import UTC, date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TipoDocumento(str, enum.Enum):
    ART = "ART"
    PLANTA = "PLANTA"
    LICENCA = "LICENCA"
    GARANTIA = "GARANTIA"
    SEGURO = "SEGURO"
    OUTRO = "OUTRO"


class Documento(Base):
    __tablename__ = "documentos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    objeto_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("objetos.id", ondelete="CASCADE"), nullable=False
    )
    tipo: Mapped[str] = mapped_column(Enum(TipoDocumento, name="tipo_documento_enum"), nullable=False)
    nome: Mapped[str] = mapped_column(String(300), nullable=False)
    url_storage: Mapped[str | None] = mapped_column(Text, nullable=True)
    data_validade: Mapped[date | None] = mapped_column(Date, nullable=True)
    versao: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    # Versão corrente do documento (versões antigas ficam ativo=False, preservadas).
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # Documento que esta versão substitui (encadeamento do histórico).
    substitui_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documentos.id"), nullable=True
    )
    criado_por_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True
    )
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    objeto = relationship("Objeto", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Documento {self.tipo} v{self.versao} objeto={self.objeto_id}>"
