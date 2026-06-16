"""
SIN-Obras — Modelos: Diário de Obras, Medição, Notificação
"""

import enum
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean, Date, DateTime, Enum, ForeignKey,
    Integer, Numeric, String, Text
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


# ---------------------------------------------------------------------------
# Diário de Obras
# ---------------------------------------------------------------------------
class DiarioObra(Base):
    __tablename__ = "diario_obra"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    obra_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("obras.id", ondelete="CASCADE"), nullable=False)
    usuario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    data_registro: Mapped[date] = mapped_column(Date, nullable=False)
    clima: Mapped[str | None] = mapped_column(String(100), nullable=True)
    qtd_funcionarios: Mapped[int] = mapped_column(Integer, default=0)
    equipamentos: Mapped[str | None] = mapped_column(Text, nullable=True)
    ocorrencias: Mapped[str | None] = mapped_column(Text, nullable=True)
    atividades_realizadas: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self) -> str:
        return f"<DiarioObra obra={self.obra_id} data={self.data_registro}>"


# ---------------------------------------------------------------------------
# Medição
# ---------------------------------------------------------------------------
class StatusMedicao(str, enum.Enum):
    RASCUNHO = "RASCUNHO"
    ASSINADA = "ASSINADA"
    EM_FISCALIZACAO = "EM_FISCALIZACAO"
    APROVADA = "APROVADA"
    REPROVADA = "REPROVADA"


class Medicao(Base):
    __tablename__ = "medicoes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    obra_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("obras.id", ondelete="CASCADE"), nullable=False)
    empresa_usuario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    numero_medicao: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(
        Enum(StatusMedicao, name="status_medicao_enum"),
        default=StatusMedicao.RASCUNHO,
        nullable=False
    )
    # JSON com lista de {evento_id, percentual_declarado, observacao}
    eventos_declarados: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    assinada_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    enviada_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Hash SHA-256 do conteúdo da medição no momento da assinatura
    hash_assinatura: Mapped[str | None] = mapped_column(String(64), nullable=True)
    # Observações do fiscal ao aprovar/reprovar
    observacao_fiscal: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self) -> str:
        return f"<Medicao #{self.numero_medicao} obra={self.obra_id} status={self.status}>"


# ---------------------------------------------------------------------------
# Notificação
# ---------------------------------------------------------------------------
class CanalNotificacao(str, enum.Enum):
    SISTEMA = "SISTEMA"
    EMAIL = "EMAIL"
    PUSH = "PUSH"


class Notificacao(Base):
    __tablename__ = "notificacoes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    mensagem: Mapped[str | None] = mapped_column(Text, nullable=True)
    canal: Mapped[str] = mapped_column(
        Enum(CanalNotificacao, name="canal_notificacao_enum"),
        default=CanalNotificacao.SISTEMA,
        nullable=False
    )
    lida: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self) -> str:
        return f"<Notificacao usuario={self.usuario_id} lida={self.lida}>"
