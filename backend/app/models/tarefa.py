"""
SIN-Obras — Modelo de Tarefa (Kanban)
"""

import enum
import uuid
from datetime import UTC, date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class StatusTarefa(str, enum.Enum):
    A_FAZER = "A_FAZER"
    EM_ANDAMENTO = "EM_ANDAMENTO"
    CONCLUIDO = "CONCLUIDO"


class PrioridadeTarefa(str, enum.Enum):
    BAIXA = "BAIXA"
    MEDIA = "MEDIA"
    ALTA = "ALTA"
    URGENTE = "URGENTE"


class Tarefa(Base):
    __tablename__ = "tarefas"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum(StatusTarefa, name="status_tarefa_enum"),
        default=StatusTarefa.A_FAZER,
        nullable=False,
    )
    prioridade: Mapped[str] = mapped_column(
        Enum(PrioridadeTarefa, name="prioridade_tarefa_enum"),
        default=PrioridadeTarefa.MEDIA,
        nullable=False,
    )
    prazo: Mapped[date | None] = mapped_column(Date, nullable=True)
    obra_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("obras.id", ondelete="CASCADE"), nullable=True
    )
    responsavel_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True
    )
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relacionamentos (opcionais, mas bons para carregamento ansioso se necessário)
    # obra = relationship("Obra", lazy="selectin")
    # responsavel = relationship("Usuario", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Tarefa {self.titulo[:30]} ({self.status})>"
