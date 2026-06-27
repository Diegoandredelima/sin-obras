"""
SIN-Obras — Modelo: Orçamento (módulo separado, anterior ao Objeto)

O Orçamento é o "banco de dados técnico" da obra: criado de forma independente,
recebe um ID legível (``codigo``, ex.: ORC-2026-0012) e contém a EAP completa
(Meta → Submeta → Evento) com memória de cálculo e critério de medição.

Ao cadastrar um Objeto, busca-se o orçamento pelo código e a árvore é **copiada**
para dentro do objeto (Opção A — cópia congelada). O BDI é embutido no preço
unitário no momento da cópia (ver ``services/orcamento.copiar_orcamento_para_objeto``).
A EAP do orçamento reaproveita os modelos Meta/Submeta/Evento (que ganharam um
``orcamento_id`` nullable); por isso este módulo só define a entidade-cabeçalho.
"""

import enum
import uuid
from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class StatusOrcamento(str, enum.Enum):
    RASCUNHO = "RASCUNHO"
    FINALIZADO = "FINALIZADO"


class Orcamento(Base):
    __tablename__ = "orcamentos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # ID legível usado na busca/vínculo (ex.: ORC-2026-0012). UUID fica "under the hood".
    codigo: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    titulo: Mapped[str] = mapped_column(String(300), nullable=False)
    # Data-base dos preços (marco legal para reajuste futuro — parâmetro, não texto).
    data_base: Mapped[date | None] = mapped_column(Date, nullable=True)
    # Taxa de BDI (%) aplicada sobre o custo direto (embutida no preço ao copiar).
    bdi_percentual: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("0.00"), nullable=False
    )
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum(StatusOrcamento, name="status_orcamento_enum"),
        default=StatusOrcamento.RASCUNHO,
        nullable=False,
    )
    criado_por_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True
    )
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    # EAP do orçamento (Meta com orcamento_id preenchido). selectin para serializar
    # a árvore no contexto async sem lazy-load fora do greenlet.
    metas = relationship(
        "Meta",
        back_populates="orcamento",
        lazy="selectin",
        cascade="all, delete-orphan",
        foreign_keys="Meta.orcamento_id",
    )

    def __repr__(self) -> str:
        return f"<Orcamento {self.codigo} ({self.status})>"
