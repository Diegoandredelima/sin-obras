"""
SIN-Obras — Modelo: Usuário
Representa todos os atores do sistema (Empresa, Fiscal, Engenheiro, Coordenador, Secretário).
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Enum, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.rbac import Role


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    # Para servidores: matrícula (>= 5 dígitos). Para empresas: CNPJ.
    matricula_cnpj: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )
    senha_hash: Mapped[str] = mapped_column(Text, nullable=False)
    tipo: Mapped[str] = mapped_column(
        Enum(Role, name="role_enum", create_constraint=True),
        nullable=False,
    )
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    telefone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    cargo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    audit_logs = relationship("AuditLog", back_populates="usuario", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Usuario {self.nome} ({self.tipo})>"
