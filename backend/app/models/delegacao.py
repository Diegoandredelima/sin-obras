"""
SIN-Obras — Modelo: Delegação de Obras

Registra a atribuição de obras a fiscais e apoios, com período de responsabilidade.
Controlado pelo Chefe de Setor (COORDENADOR).
"""
import uuid
from datetime import UTC, date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DelegacaoObra(Base):
    """Vincula um usuário (fiscal ou apoio) a uma obra com período definido."""
    __tablename__ = "delegacoes_obras"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    objeto_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("objetos.id", ondelete="CASCADE"), nullable=False
    )
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False
    )
    delegado_por_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True
    )
    funcao: Mapped[str] = mapped_column(
        String(30), nullable=False, default="FISCAL",
        comment="Papel do delegado nesta obra: FISCAL, APOIO_N1, APOIO_N2"
    )
    data_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    data_fim: Mapped[date | None] = mapped_column(Date, nullable=True)
    observacao: Mapped[str | None] = mapped_column(Text, nullable=True)
    ativo: Mapped[bool] = mapped_column(default=True, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    objeto = relationship("Objeto", lazy="selectin")
    usuario = relationship("Usuario", foreign_keys=[usuario_id], lazy="selectin")
    delegado_por = relationship("Usuario", foreign_keys=[delegado_por_id], lazy="selectin")

    def __repr__(self) -> str:
        return f"<DelegacaoObra objeto={self.objeto_id} usuario={self.usuario_id} {self.funcao}>"
