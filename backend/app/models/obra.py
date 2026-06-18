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


class SituacaoObra(str, enum.Enum):
    """Situação oficial da obra conforme a planilha de acompanhamento da SIN.

    Mais granular que `StatusObra` (que é o status operacional usado pelo app).
    Consolida as ~43 variações de texto livre da coluna "SITUAÇÃO DA OBRA".
    """
    A_INICIAR = "A_INICIAR"
    EM_ANDAMENTO = "EM_ANDAMENTO"
    PARALISADA = "PARALISADA"
    INACABADA = "INACABADA"
    CONCLUIDA = "CONCLUIDA"
    RESCINDIDA = "RESCINDIDA"
    ARQUIVADA = "ARQUIVADA"
    EXTINTA = "EXTINTA"
    CEDIDA = "CEDIDA"


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
    # Datas relaxadas para nullable: contratos históricos importados nem sempre
    # têm a data de assinatura/vigência preenchida nas planilhas.
    data_assinatura: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_publicacao: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_vigencia: Mapped[date | None] = mapped_column(Date, nullable=True)
    prazo_vigencia_dias: Mapped[int | None] = mapped_column(Integer, nullable=True)
    prazo_execucao_dias: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Conta de login da empresa (opcional). A referência cadastral canônica é
    # `empresa_ref_id` → tabela `empresas`.
    empresa_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True
    )
    empresa_ref_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("empresas.id"), nullable=True
    )
    orgao_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orgaos.id"), nullable=True
    )
    fiscal_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True
    )
    gestor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True
    )
    # Nomes brutos do fiscal/gestor (planilha) — preservados quando ainda não
    # há conta de usuário vinculada (fiscal_id / gestor_id).
    fiscal_nome: Mapped[str | None] = mapped_column(String(200), nullable=True)
    gestor_nome: Mapped[str | None] = mapped_column(String(200), nullable=True)
    # Texto livre legado do órgão (mantido por compatibilidade; preferir orgao_id)
    orgao: Mapped[str | None] = mapped_column(String(100), nullable=True)
    objeto: Mapped[str | None] = mapped_column(Text, nullable=True)
    # --- Financeiro (planilha de acompanhamento) ---
    valor_aditivo: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    valor_reajustado: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    valor_final: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    recurso_federal: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    recurso_estadual: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    # --- Licitação ---
    tipo_licitacao: Mapped[str | None] = mapped_column(String(100), nullable=True)
    numero_licitacao: Mapped[str | None] = mapped_column(String(100), nullable=True)
    matricula_cei: Mapped[str | None] = mapped_column(String(50), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    empresa = relationship("Usuario", foreign_keys=[empresa_id], lazy="selectin")
    empresa_ref = relationship("Empresa", foreign_keys=[empresa_ref_id], lazy="selectin")
    orgao_ref = relationship("Orgao", foreign_keys=[orgao_id], lazy="selectin")
    fiscal = relationship("Usuario", foreign_keys=[fiscal_id], lazy="selectin")
    gestor = relationship("Usuario", foreign_keys=[gestor_id], lazy="selectin")
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
    data_ordem_servico: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum(StatusObra, name="status_obra_enum"),
        default=StatusObra.PLANEJADA,
        nullable=False,
    )
    # Situação oficial (planilha) — mais granular que `status`
    situacao: Mapped[str | None] = mapped_column(
        Enum(SituacaoObra, name="situacao_obra_enum"),
        nullable=True,
    )
    # Texto bruto original da coluna "SITUAÇÃO DA OBRA" (ex.: "CONCLUÍDA/2022")
    situacao_origem: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ano_referencia: Mapped[int | None] = mapped_column(Integer, nullable=True)
    saude: Mapped[str] = mapped_column(
        Enum(SaudeObra, name="saude_obra_enum"),
        default=SaudeObra.VERDE,
        nullable=False,
    )
    percentual_executado: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("0.00"), nullable=False
    )
    # --- Prazos rastreáveis (planilha de acompanhamento) ---
    prazo_inicial_dias: Mapped[int | None] = mapped_column(Integer, nullable=True)
    vigencia_inicio: Mapped[date | None] = mapped_column(Date, nullable=True)
    vigencia_dias: Mapped[int | None] = mapped_column(Integer, nullable=True)
    vigencia_fim: Mapped[date | None] = mapped_column(Date, nullable=True)
    execucao_inicio: Mapped[date | None] = mapped_column(Date, nullable=True)
    execucao_dias: Mapped[int | None] = mapped_column(Integer, nullable=True)
    execucao_fim: Mapped[date | None] = mapped_column(Date, nullable=True)
    # --- Financeiro de execução ---
    valor_medido: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    saldo_a_medir: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    matricula_cei: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # --- Textos brutos preservados da planilha (não estruturados) ---
    historico: Mapped[str | None] = mapped_column(Text, nullable=True)
    importante: Mapped[str | None] = mapped_column(Text, nullable=True)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)
    raio_geofencing_metros: Mapped[int] = mapped_column(
        Integer, default=200, nullable=False
    )
    contrato_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contratos.id"), nullable=True
    )
    responsavel_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True
    )
    gestor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True
    )
    orgao: Mapped[str | None] = mapped_column(String(100), nullable=True)
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
    gestor = relationship("Usuario", foreign_keys=[gestor_id], lazy="selectin")
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
