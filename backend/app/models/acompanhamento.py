"""
SIN-Obras — Modelos: Acompanhamento de Prazos e Contratos
Ordem de Serviço, Aditivos, Paralisações, Readequações,
Apostilamentos, Reajustes, Termos de Recebimento,
Notificações Extrajudiciais e Portarias.
"""

import enum
import uuid
from datetime import UTC, date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------
class TipoParalisacao(str, enum.Enum):
    PARALISACAO = "PARALISACAO"
    REINICIO = "REINICIO"


class TipoReadequacao(str, enum.Enum):
    COM_REFLEXO = "COM_REFLEXO"
    SEM_REFLEXO = "SEM_REFLEXO"


class TipoTermoRecebimento(str, enum.Enum):
    PROVISORIO = "PROVISORIO"
    DEFINITIVO = "DEFINITIVO"


class TipoPortaria(str, enum.Enum):
    FISCAL = "FISCAL"
    GESTOR = "GESTOR"
    OUTROS = "OUTROS"


# ---------------------------------------------------------------------------
# Ordem de Serviço
# ---------------------------------------------------------------------------
class OrdemServico(Base):
    """Ordem de serviço que autoriza o início da execução da obra."""
    __tablename__ = "ordens_servico"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    objeto_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("objetos.id", ondelete="CASCADE"), nullable=False
    )
    numero: Mapped[str] = mapped_column(String(50), nullable=False)
    data_emissao: Mapped[date] = mapped_column(Date, nullable=False)
    data_inicio: Mapped[date | None] = mapped_column(Date, nullable=True)
    processo_sei: Mapped[str | None] = mapped_column(String(50), nullable=True)
    observacao: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    objeto = relationship("Objeto", lazy="selectin")

    def __repr__(self) -> str:
        return f"<OrdemServico {self.numero}>"


# ---------------------------------------------------------------------------
# Aditivo de Prazo
# ---------------------------------------------------------------------------
class AditivoPrazo(Base):
    """Aditivo contratual de prazo (vigência e/ou execução)."""
    __tablename__ = "aditivos_prazo"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    objeto_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("objetos.id", ondelete="CASCADE"), nullable=False
    )
    numero: Mapped[int] = mapped_column(Integer, nullable=False)
    dias_adicionados: Mapped[int] = mapped_column(Integer, nullable=False)
    nova_data_vigencia: Mapped[date] = mapped_column(Date, nullable=False)
    nova_data_execucao: Mapped[date] = mapped_column(Date, nullable=False)
    processo_sei: Mapped[str | None] = mapped_column(String(50), nullable=True)
    data_assinatura: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_publicacao: Mapped[date | None] = mapped_column(Date, nullable=True)
    observacao: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    objeto = relationship("Objeto", lazy="selectin")

    def __repr__(self) -> str:
        return f"<AditivoPrazo #{self.numero} objeto={self.objeto_id}>"


# ---------------------------------------------------------------------------
# Paralisação / Reinício
# ---------------------------------------------------------------------------
class Paralisacao(Base):
    """Registro de paralisação ou reinício da execução da obra."""
    __tablename__ = "paralisacoes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    objeto_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("objetos.id", ondelete="CASCADE"), nullable=False
    )
    tipo: Mapped[str] = mapped_column(
        Enum(TipoParalisacao, name="tipo_paralisacao_enum"),
        nullable=False,
    )
    data_evento: Mapped[date] = mapped_column(Date, nullable=False)
    data_publicacao: Mapped[date | None] = mapped_column(Date, nullable=True)
    saldo_dias_execucao: Mapped[int | None] = mapped_column(Integer, nullable=True)
    saldo_dias_vigencia: Mapped[int | None] = mapped_column(Integer, nullable=True)
    processo_sei: Mapped[str | None] = mapped_column(String(50), nullable=True)
    motivo: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    objeto = relationship("Objeto", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Paralisacao {self.tipo} objeto={self.objeto_id}>"


# ---------------------------------------------------------------------------
# Readequação (com ou sem reflexo financeiro)
# ---------------------------------------------------------------------------
class Readequacao(Base):
    """Readequação contratual com ou sem reflexo financeiro."""
    __tablename__ = "readequacoes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    objeto_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("objetos.id", ondelete="CASCADE"), nullable=False
    )
    numero: Mapped[int] = mapped_column(Integer, nullable=False)
    tipo: Mapped[str] = mapped_column(
        Enum(TipoReadequacao, name="tipo_readequacao_enum"),
        nullable=False,
    )
    percentual: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    valor: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    processo_sei: Mapped[str | None] = mapped_column(String(50), nullable=True)
    data_assinatura: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_publicacao: Mapped[date | None] = mapped_column(Date, nullable=True)
    observacao: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    objeto = relationship("Objeto", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Readequacao #{self.numero} {self.tipo}>"


# ---------------------------------------------------------------------------
# Apostilamento (endosso contratual)
# ---------------------------------------------------------------------------
class Apostilamento(Base):
    """Apostilamento — endosso ou averbação do contrato."""
    __tablename__ = "apostilamentos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    contrato_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contratos.id", ondelete="CASCADE"), nullable=False
    )
    valor: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    processo_sei: Mapped[str | None] = mapped_column(String(50), nullable=True)
    data_assinatura: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_publicacao: Mapped[date | None] = mapped_column(Date, nullable=True)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    contrato = relationship("Contrato", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Apostilamento contrato={self.contrato_id}>"


# ---------------------------------------------------------------------------
# Reajuste (correção monetária de medição)
# ---------------------------------------------------------------------------
class Reajuste(Base):
    """Reajuste financeiro aplicado a uma medição (correção monetária)."""
    __tablename__ = "reajustes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    medicao_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medicoes.id", ondelete="CASCADE"), nullable=False
    )
    valor: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    processo_sei: Mapped[str | None] = mapped_column(String(50), nullable=True)
    data_assinatura: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_publicacao: Mapped[date | None] = mapped_column(Date, nullable=True)
    observacao: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    medicao = relationship("Medicao", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Reajuste medicao={self.medicao_id} valor={self.valor}>"


# ---------------------------------------------------------------------------
# Termo de Recebimento (Provisório ou Definitivo)
# ---------------------------------------------------------------------------
class TermoRecebimento(Base):
    """Termo de aceitação provisória ou recebimento definitivo da obra."""
    __tablename__ = "termos_recebimento"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    objeto_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("objetos.id", ondelete="CASCADE"), nullable=False
    )
    tipo: Mapped[str] = mapped_column(
        Enum(TipoTermoRecebimento, name="tipo_termo_recebimento_enum"),
        nullable=False,
    )
    numero: Mapped[str] = mapped_column(String(50), nullable=False)
    data_emissao: Mapped[date] = mapped_column(Date, nullable=False)
    data_publicacao: Mapped[date | None] = mapped_column(Date, nullable=True)
    processo_sei: Mapped[str | None] = mapped_column(String(50), nullable=True)
    observacao: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    objeto = relationship("Objeto", lazy="selectin")

    def __repr__(self) -> str:
        return f"<TermoRecebimento {self.tipo} objeto={self.objeto_id}>"


# ---------------------------------------------------------------------------
# Notificação Extrajudicial
# ---------------------------------------------------------------------------
class NotificacaoExtrajudicial(Base):
    """Notificação formal enviada à empresa contratada."""
    __tablename__ = "notificacoes_extrajudiciais"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    objeto_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("objetos.id", ondelete="CASCADE"), nullable=False
    )
    empresa_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False
    )
    numero: Mapped[str] = mapped_column(String(50), nullable=False)
    data_emissao: Mapped[date] = mapped_column(Date, nullable=False)
    data_recebimento: Mapped[date | None] = mapped_column(Date, nullable=True)
    assunto: Mapped[str] = mapped_column(String(300), nullable=False)
    teor: Mapped[str | None] = mapped_column(Text, nullable=True)
    processo_sei: Mapped[str | None] = mapped_column(String(50), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    objeto = relationship("Objeto", lazy="selectin")
    empresa = relationship("Usuario", foreign_keys=[empresa_id], lazy="selectin")

    def __repr__(self) -> str:
        return f"<NotificacaoExtrajudicial {self.numero}>"


# ---------------------------------------------------------------------------
# Portaria (designação de fiscal, gestor, etc.)
# ---------------------------------------------------------------------------
class Portaria(Base):
    """Portaria de designação de fiscal, gestor ou outro responsável."""
    __tablename__ = "portarias"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    objeto_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("objetos.id", ondelete="CASCADE"), nullable=False
    )
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False
    )
    tipo: Mapped[str] = mapped_column(
        Enum(TipoPortaria, name="tipo_portaria_enum"),
        nullable=False,
    )
    numero: Mapped[str] = mapped_column(String(50), nullable=False)
    data_emissao: Mapped[date] = mapped_column(Date, nullable=False)
    data_publicacao: Mapped[date | None] = mapped_column(Date, nullable=True)
    processo_sei: Mapped[str | None] = mapped_column(String(50), nullable=True)
    observacao: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    objeto = relationship("Objeto", lazy="selectin")
    usuario = relationship("Usuario", foreign_keys=[usuario_id], lazy="selectin")

    def __repr__(self) -> str:
        return f"<Portaria {self.numero} {self.tipo}>"
