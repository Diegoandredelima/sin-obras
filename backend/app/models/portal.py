"""
SIN-Obras — Modelos: Diário de Obras, Medição, Notificação
"""

import enum
import uuid
from datetime import UTC, date, datetime
from decimal import Decimal

from geoalchemy2 import Geometry
from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


# ---------------------------------------------------------------------------
# Diário de Obras (RDO / Livro de Ocorrência)
# ---------------------------------------------------------------------------
class CondicaoTempo(str, enum.Enum):
    """Condição climática registrada por turno no RDO."""
    BOM = "BOM"
    CHUVA_FRACA = "CHUVA_FRACA"
    CHUVA_FORTE = "CHUVA_FORTE"


# Instância única de enum compartilhada por tempo_manha/tempo_tarde: evita que o
# create_all do startup tente criar o mesmo tipo PG duas vezes.
_condicao_tempo_type = Enum(CondicaoTempo, name="condicao_tempo_enum")


class DiarioObra(Base):
    __tablename__ = "diario_obra"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    objeto_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("objetos.id", ondelete="CASCADE"), nullable=False)
    usuario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    data_registro: Mapped[date] = mapped_column(Date, nullable=False)
    # Legado: clima como texto livre e contagem única de funcionários. Mantidos
    # por compatibilidade; o RDO real usa os campos estruturados abaixo.
    clima: Mapped[str | None] = mapped_column(String(100), nullable=True)
    qtd_funcionarios: Mapped[int] = mapped_column(Integer, default=0)
    equipamentos: Mapped[str | None] = mapped_column(Text, nullable=True)
    ocorrencias: Mapped[str | None] = mapped_column(Text, nullable=True)
    atividades_realizadas: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Tempo estruturado por turno (RDO): manhã/tarde + pluviometria em mm.
    tempo_manha: Mapped[str | None] = mapped_column(_condicao_tempo_type, nullable=True)
    tempo_tarde: Mapped[str | None] = mapped_column(_condicao_tempo_type, nullable=True)
    pluviometria_mm: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)

    # Tabelas estruturadas do RDO. Arrays de objetos:
    #   equipamentos_lista: [{"nome": str, "quantidade": number}]
    #   mao_de_obra:        [{"funcao": str, "quantidade": number}]
    equipamentos_lista: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    mao_de_obra: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # Preenchimento da fiscalização (separado do da empresa).
    observacoes_fiscal: Mapped[str | None] = mapped_column(Text, nullable=True)

    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    def __repr__(self) -> str:
        return f"<DiarioObra objeto={self.objeto_id} data={self.data_registro}>"


# ---------------------------------------------------------------------------
# Medição
# ---------------------------------------------------------------------------
class StatusMedicao(str, enum.Enum):
    RASCUNHO = "RASCUNHO"
    ASSINADA = "ASSINADA"
    EM_FISCALIZACAO = "EM_FISCALIZACAO"
    APROVADA = "APROVADA"
    REPROVADA = "REPROVADA"


class OrigemMedicao(str, enum.Enum):
    """Quem iniciou a medição: a empresa executora ou o fiscal de obras."""
    EMPRESA = "EMPRESA"
    FISCAL = "FISCAL"


class Medicao(Base):
    __tablename__ = "medicoes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    objeto_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("objetos.id", ondelete="CASCADE"), nullable=False)
    # Contrato (documento-mãe) ao qual a medição se refere. Usado para valor
    # global e percentual de retenção padrão.
    contrato_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("contratos.id"), nullable=True)
    # Conta de usuário da empresa executora. Nullable: medições de origem FISCAL
    # podem não ter empresa usuária vinculada.
    empresa_usuario_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)
    # Criador da medição (empresa ou fiscal) — canônico para "quem lançou".
    autor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)
    origem: Mapped[str] = mapped_column(
        Enum(OrigemMedicao, name="origem_medicao_enum"),
        default=OrigemMedicao.EMPRESA,
        nullable=False,
    )
    numero_medicao: Mapped[int] = mapped_column(Integer, nullable=False)
    # Valor líquido autorizado a faturar (preenchido na assinatura/aprovação).
    valor_medido: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    data_medicao: Mapped[date | None] = mapped_column(Date, nullable=True)
    # Período coberto pela medição
    data_inicio_periodo: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_fim_periodo: Mapped[date | None] = mapped_column(Date, nullable=True)
    # Parâmetros financeiros do boletim
    percentual_retencao: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    valor_faturamento_direto: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    numero_processo_sei: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(
        Enum(StatusMedicao, name="status_medicao_enum"),
        default=StatusMedicao.RASCUNHO,
        nullable=False
    )
    # Legado: lista de {evento_id, percentual_declarado, observacao}. A fonte de
    # verdade agora é a tabela medicao_itens (boletim quantitativo).
    eventos_declarados: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    assinada_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    enviada_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Hash SHA-256 do conteúdo da medição no momento da assinatura
    hash_assinatura: Mapped[str | None] = mapped_column(String(64), nullable=True)
    # Observações do fiscal ao aprovar/reprovar
    observacao_fiscal: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    # Relationships
    itens = relationship(
        "MedicaoItem", back_populates="medicao", lazy="selectin",
        cascade="all, delete-orphan",
    )
    fotos = relationship(
        "FotoMedicao", back_populates="medicao", lazy="selectin",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Medicao #{self.numero_medicao} objeto={self.objeto_id} status={self.status}>"


# ---------------------------------------------------------------------------
# Item de Medição (linha do Boletim — 1 por evento)
# ---------------------------------------------------------------------------
class MedicaoItem(Base):
    __tablename__ = "medicao_itens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    medicao_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("medicoes.id", ondelete="CASCADE"), nullable=False)
    evento_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("eventos.id"), nullable=False)
    # Quantidade executada no período (m², m³, un...).
    quantidade_periodo: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"), nullable=False)
    # Preço unitário congelado no momento do lançamento (preserva histórico).
    valor_unitario: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"), nullable=False)
    # Abatimento de quantidade (ex.: vãos de portas/janelas na alvenaria).
    desconto_vaos: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"), nullable=False)
    observacao: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    medicao = relationship("Medicao", back_populates="itens")
    evento = relationship("Evento", lazy="selectin")
    memoria = relationship(
        "MedicaoItemMemoria", back_populates="item", lazy="selectin",
        cascade="all, delete-orphan", order_by="MedicaoItemMemoria.ordem",
    )

    @property
    def valor_bruto(self) -> Decimal:
        return (self.quantidade_periodo - self.desconto_vaos) * self.valor_unitario

    def __repr__(self) -> str:
        return f"<MedicaoItem medicao={self.medicao_id} evento={self.evento_id}>"


# ---------------------------------------------------------------------------
# Linha de Memória de Cálculo (uma medição do item: C/P × L × H × N = A/V)
# ---------------------------------------------------------------------------
class MedicaoItemMemoria(Base):
    """Linha estruturada da memória de cálculo de um item da medição.

    Espelha a aba "M. DE CÁLCULO" do boletim: cada linha registra as dimensões
    medidas (comprimento/perímetro, largura, altura), o nº de repetições e um
    fator percentual, resultando na quantidade (área/volume). A soma das linhas
    de um item deve corresponder ao seu ``quantidade_periodo``.
    """
    __tablename__ = "medicao_item_memoria"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    medicao_item_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("medicao_itens.id", ondelete="CASCADE"), nullable=False)
    ordem: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    comprimento: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)  # C/P
    largura: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)       # L
    altura: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)        # H
    percentual: Mapped[Decimal | None] = mapped_column(Numeric(7, 4), nullable=True)      # %
    n_repeticoes: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("1"), nullable=False)  # N
    quantidade: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"), nullable=False)    # A/V resultante

    item = relationship("MedicaoItem", back_populates="memoria")

    def __repr__(self) -> str:
        return f"<MedicaoItemMemoria item={self.medicao_item_id} ordem={self.ordem}>"


# ---------------------------------------------------------------------------
# Foto de Medição (validação inviolável por item — espelha FotoVistoria)
# ---------------------------------------------------------------------------
class FotoMedicao(Base):
    __tablename__ = "fotos_medicao"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    medicao_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("medicoes.id", ondelete="CASCADE"), nullable=False)
    medicao_item_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("medicao_itens.id", ondelete="CASCADE"), nullable=True)
    enviado_por_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)

    # Armazenamento (MinIO/S3)
    url_storage: Mapped[str | None] = mapped_column(String(500), nullable=True)
    filename: Mapped[str | None] = mapped_column(String(200), nullable=True)

    # Georreferenciamento e inviolabilidade (RN03)
    coordenadas = mapped_column(Geometry("POINT", srid=4326), nullable=True)
    hash_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)
    carimbo_servidor: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    exif_metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    origem_camera: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    # Relationships
    medicao = relationship("Medicao", back_populates="fotos")

    def __repr__(self) -> str:
        return f"<FotoMedicao medicao={self.medicao_id} item={self.medicao_item_id}>"


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
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    def __repr__(self) -> str:
        return f"<Notificacao usuario={self.usuario_id} lida={self.lida}>"
