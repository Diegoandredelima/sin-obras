"""
SIN-Obras — Modelos: Obra, Contrato, Meta, Submeta e Evento
Hierarquia: Contrato → Obra → Meta → Submeta → Evento
"""

import enum
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from geoalchemy2 import Geometry
from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------
class StatusObra(str, enum.Enum):
    PLANEJADA = "PLANEJADA"
    EM_EXECUCAO = "EM_EXECUCAO"
    PARALISADA = "PARALISADA"
    CONCLUIDA = "CONCLUIDA"


class SaudeObra(str, enum.Enum):
    VERDE = "VERDE"
    AMARELO = "AMARELO"
    VERMELHO = "VERMELHO"


# ---------------------------------------------------------------------------
# Contrato
# ---------------------------------------------------------------------------
class Contrato(Base):
    __tablename__ = "contratos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    numero_processo: Mapped[str] = mapped_column(String(50), nullable=False)
    numero_contrato: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    valor_global: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    data_assinatura: Mapped[date] = mapped_column(Date, nullable=False)
    data_vigencia: Mapped[date] = mapped_column(Date, nullable=False)
    empresa_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False
    )
    objeto: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    empresa = relationship("Usuario", foreign_keys=[empresa_id], lazy="selectin")
    obras = relationship("Obra", back_populates="contrato", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Contrato {self.numero_contrato}>"


# ---------------------------------------------------------------------------
# Obra
# ---------------------------------------------------------------------------
class Obra(Base):
    __tablename__ = "obras"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    titulo: Mapped[str] = mapped_column(String(300), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    # PostGIS: ponto geográfico (longitude, latitude)
    localizacao = mapped_column(
        Geometry("POINT", srid=4326), nullable=True
    )
    endereco: Mapped[str | None] = mapped_column(String(500), nullable=True)
    municipio: Mapped[str | None] = mapped_column(String(100), nullable=True)
    valor_contrato: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    data_inicio: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_fim_prevista: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum(StatusObra, name="status_obra_enum"),
        default=StatusObra.PLANEJADA,
        nullable=False,
    )
    saude: Mapped[str] = mapped_column(
        Enum(SaudeObra, name="saude_obra_enum"),
        default=SaudeObra.VERDE,
        nullable=False,
    )
    percentual_executado: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("0.00"), nullable=False
    )
    raio_geofencing_metros: Mapped[int] = mapped_column(
        Integer, default=200, nullable=False
    )
    contrato_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contratos.id"), nullable=True
    )
    responsavel_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True
    )
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    contrato = relationship("Contrato", back_populates="obras", lazy="selectin")
    responsavel = relationship("Usuario", foreign_keys=[responsavel_id], lazy="selectin")
    metas = relationship("Meta", back_populates="obra", lazy="selectin", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Obra {self.titulo} ({self.status})>"


# ---------------------------------------------------------------------------
# Meta (nível 1 do cronograma físico-financeiro)
# ---------------------------------------------------------------------------
class Meta(Base):
    __tablename__ = "metas"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    obra_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("obras.id", ondelete="CASCADE"), nullable=False
    )
    descricao: Mapped[str] = mapped_column(String(500), nullable=False)
    valor: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"))
    ordem: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    obra = relationship("Obra", back_populates="metas")
    submetas = relationship("Submeta", back_populates="meta", lazy="selectin", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Meta {self.descricao[:40]}>"


# ---------------------------------------------------------------------------
# Submeta (nível 2)
# ---------------------------------------------------------------------------
class Submeta(Base):
    __tablename__ = "submetas"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    meta_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("metas.id", ondelete="CASCADE"), nullable=False
    )
    descricao: Mapped[str] = mapped_column(String(500), nullable=False)
    valor: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"))
    percentual_previsto: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("0.00")
    )

    # Relationships
    meta = relationship("Meta", back_populates="submetas")
    eventos = relationship("Evento", back_populates="submeta", lazy="selectin", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Submeta {self.descricao[:40]}>"


# ---------------------------------------------------------------------------
# Evento (nível 3 — item mais granular do cronograma)
# ---------------------------------------------------------------------------
class Evento(Base):
    __tablename__ = "eventos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    submeta_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("submetas.id", ondelete="CASCADE"), nullable=False
    )
    descricao: Mapped[str] = mapped_column(String(500), nullable=False)
    quantidade: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"))
    unidade: Mapped[str] = mapped_column(String(20), default="un")
    valor_unitario: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"))

    # Relationships
    submeta = relationship("Submeta", back_populates="eventos")

    @property
    def valor_total(self) -> Decimal:
        return self.quantidade * self.valor_unitario

    def __repr__(self) -> str:
        return f"<Evento {self.descricao[:40]}>"
