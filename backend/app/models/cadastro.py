"""
SIN-Obras — Modelos de Cadastro (tabelas de domínio / normalização)

Empresa  — pessoa jurídica contratada (executora da obra). Separada de
           `usuarios`: nem toda empresa possui conta de login no portal.
Orgao    — órgão/secretaria demandante da obra (SEEC, SESAP, DER, ...).

Essas tabelas substituem os campos de texto livre que existiam nas planilhas
(coluna EMPRESA e coluna ÓRGÃO), garantindo deduplicação e integridade
referencial.
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


# ---------------------------------------------------------------------------
# Empresa (contratada / executora)
# ---------------------------------------------------------------------------
class Empresa(Base):
    """Empresa executora contratada. Fonte única da razão social."""
    __tablename__ = "empresas"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    razao_social: Mapped[str] = mapped_column(
        String(300), unique=True, nullable=False, index=True
    )
    cnpj: Mapped[str | None] = mapped_column(String(18), unique=True, nullable=True)
    # Conta de login no portal, quando a empresa tiver acesso (opcional)
    usuario_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<Empresa {self.razao_social[:40]}>"


# ---------------------------------------------------------------------------
# Órgão / Secretaria demandante
# ---------------------------------------------------------------------------
class Orgao(Base):
    """Órgão ou secretaria demandante da obra (unidade gestora)."""
    __tablename__ = "orgaos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    sigla: Mapped[str] = mapped_column(
        String(40), unique=True, nullable=False, index=True
    )
    nome: Mapped[str | None] = mapped_column(String(200), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<Orgao {self.sigla}>"
