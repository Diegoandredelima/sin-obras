"""
SIN-Obras — Modelo: AuditLog (Trilha de Auditoria Imutável)
RF12 — Log imutável de quem aprovou, reprovou ou alterou medições.
Conformidade LGPD e TCE-RN.
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False
    )
    entidade: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )
    entidade_id: Mapped[str] = mapped_column(
        String(36), nullable=False, index=True
    )
    acao: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # CREATE, UPDATE, DELETE, APPROVE, REJECT, LOGIN, etc.
    dados_antes: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    dados_depois: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
        index=True,
    )

    # Relationships
    usuario = relationship("Usuario", back_populates="audit_logs", lazy="selectin")

    def __repr__(self) -> str:
        return f"<AuditLog {self.acao} {self.entidade}:{self.entidade_id}>"
