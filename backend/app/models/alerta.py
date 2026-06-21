"""
SIN-Obras — Modelo: Alerta do Sistema

Alertas gerados automaticamente com base em regras de negócio:
- Obras sem vistoria há X dias
- ART/RRT vencida ou vencendo
- Prazo contratual vencido
- Obras paralisadas
- Notificações extrajudiciais pendentes
"""
import enum
import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PrioridadeAlerta(str, enum.Enum):
    BAIXA = "BAIXA"
    MEDIA = "MEDIA"
    ALTA = "ALTA"
    CRITICA = "CRITICA"


class TipoAlerta(str, enum.Enum):
    PRAZO_VENCIDO = "PRAZO_VENCIDO"
    SEM_VISTORIA = "SEM_VISTORIA"
    ART_VENCENDO = "ART_VENCENDO"
    ART_VENCIDA = "ART_VENCIDA"
    PARALISADA = "PARALISADA"
    NOTIFICACAO_PENDENTE = "NOTIFICACAO_PENDENTE"
    MEDICAO_PENDENTE = "MEDICAO_PENDENTE"


class Alerta(Base):
    __tablename__ = "alertas"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    obra_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("obras.id", ondelete="CASCADE"), nullable=True
    )
    tipo: Mapped[str] = mapped_column(
        Enum(TipoAlerta, name="tipo_alerta_enum"), nullable=False
    )
    prioridade: Mapped[str] = mapped_column(
        Enum(PrioridadeAlerta, name="prioridade_alerta_enum"),
        default=PrioridadeAlerta.MEDIA,
        nullable=False,
    )
    titulo: Mapped[str] = mapped_column(String(300), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolvido: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    resolvido_em: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    delegado_para_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True
    )
    prazo_acao: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    obra = relationship("Obra", lazy="selectin")
    delegado_para = relationship("Usuario", foreign_keys=[delegado_para_id], lazy="selectin")

    def __repr__(self) -> str:
        return f"<Alerta {self.tipo} {self.prioridade}>"
