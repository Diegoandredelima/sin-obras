"""
SIN-Obras — Modelo de ART/RRT
"""

import uuid
from datetime import UTC, date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ArtRrt(Base):
    __tablename__ = "art_rrt"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    numero: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    tipo: Mapped[str] = mapped_column(String(10), nullable=False) # 'ART' ou 'RRT'
    objeto_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("objetos.id", ondelete="CASCADE"), nullable=False
    )
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False
    )
    data_emissao: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_validade: Mapped[date | None] = mapped_column(Date, nullable=True)
    arquivo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ativa: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relacionamentos
    # objeto = relationship("Objeto", lazy="selectin")
    # usuario = relationship("Usuario", lazy="selectin")

    def __repr__(self) -> str:
        return f"<{self.tipo} {self.numero}>"
