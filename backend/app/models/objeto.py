"""
SIN-Obras — Modelos: Contrato, Objeto, Item, Meta, Submeta e Evento

Modelo de domínio (documento-mãe → objeto → item):
  • CONTRATO é o documento jurídico principal (documento-mãe) que formaliza a
    execução de UM OU MAIS objetos.
  • OBJETO é aquilo que está sendo contratado — uma obra, um serviço ou um
    conjunto de atividades correlatas. Um objeto pertence a UM contrato
    (`objetos.contrato_id`, link canônico Contrato 1—N Objeto).
  • ITEM é cada parte constitutiva de um objeto (`itens.objeto_id`,
    Objeto 1—N Item).
  • Uma EMPRESA pode estar em vários contratos (`contratos.empresa_ref_id`).

Hierarquia de cronograma físico-financeiro: Objeto → Meta → Submeta → Evento.
"""

import enum
import uuid
from datetime import UTC, date, datetime
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
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------
class StatusObjeto(str, enum.Enum):
    PLANEJADA = "PLANEJADA"
    EM_EXECUCAO = "EM_EXECUCAO"
    PARALISADA = "PARALISADA"
    CONCLUIDA = "CONCLUIDA"


class SaudeObjeto(str, enum.Enum):
    VERDE = "VERDE"
    AMARELO = "AMARELO"
    VERMELHO = "VERMELHO"


class SituacaoObjeto(str, enum.Enum):
    """Situação oficial do objeto conforme a planilha de acompanhamento da SIN.

    Mais granular que `StatusObjeto` (que é o status operacional usado pelo app).
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
# Contrato (documento-mãe)
# ---------------------------------------------------------------------------
class Contrato(Base):
    __tablename__ = "contratos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    numero_processo: Mapped[str] = mapped_column(String(50), nullable=False)
    # Link externo para o processo no SEI (ou outro sistema). Abre a página do
    # processo correspondente ao `numero_processo` ao visualizar o contrato.
    link_processo: Mapped[str | None] = mapped_column(String(500), nullable=True)
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
    # Descrição livre do objeto contratado (texto da planilha). A modelagem
    # estruturada do objeto vive na tabela `objetos` (relação `objetos`).
    objeto: Mapped[str | None] = mapped_column(Text, nullable=True)
    # --- Financeiro (planilha de acompanhamento) ---
    valor_aditivo: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    valor_reajustado: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    valor_final: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    recurso_federal: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    recurso_estadual: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    # Percentual de retenção contratual (ex.: 1.50 = 1,5%) — devolvido ao final
    # do objeto. Pré-preenche cada medição (pode ser ajustado por medição).
    percentual_retencao: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    # --- Regras de trava do lançamento de medição (Decisão 1) ---
    # Bloqueia, no momento do lançamento da medição, quantidade negativa e/ou
    # quantidade acumulada acima do contratado (sem aditivo formal). Configurável
    # por contrato — default rígido (ambas ligadas).
    bloquear_quantidade_negativa: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )
    bloquear_acima_contratado: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )
    # --- Licitação ---
    tipo_licitacao: Mapped[str | None] = mapped_column(String(100), nullable=True)
    numero_licitacao: Mapped[str | None] = mapped_column(String(100), nullable=True)
    matricula_cei: Mapped[str | None] = mapped_column(String(50), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    empresa = relationship("Usuario", foreign_keys=[empresa_id], lazy="selectin")
    empresa_ref = relationship("Empresa", foreign_keys=[empresa_ref_id], lazy="selectin")
    orgao_ref = relationship("Orgao", foreign_keys=[orgao_id], lazy="selectin")
    fiscal = relationship("Usuario", foreign_keys=[fiscal_id], lazy="selectin")
    gestor = relationship("Usuario", foreign_keys=[gestor_id], lazy="selectin")
    # Objetos que pertencem a este contrato (link canônico Contrato 1—N Objeto)
    objetos = relationship(
        "Objeto", back_populates="contrato", lazy="selectin",
        foreign_keys="Objeto.contrato_id",
    )

    def __repr__(self) -> str:
        return f"<Contrato {self.numero_contrato}>"


# ---------------------------------------------------------------------------
# Objeto (o que está sendo contratado)
# ---------------------------------------------------------------------------
class Objeto(Base):
    __tablename__ = "objetos"

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
    # Endereço estruturado. `municipio` faz o papel de cidade; `endereco` é o
    # texto livre legado (composto a partir das partes para exibição).
    cep: Mapped[str | None] = mapped_column(String(9), nullable=True)
    logradouro: Mapped[str | None] = mapped_column(String(300), nullable=True)
    numero: Mapped[str | None] = mapped_column(String(20), nullable=True)
    bairro: Mapped[str | None] = mapped_column(String(150), nullable=True)
    conjunto: Mapped[str | None] = mapped_column(String(150), nullable=True)
    uf: Mapped[str | None] = mapped_column(String(2), nullable=True)
    municipio: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # Opcional: o valor financeiro canônico vive no contrato do objeto.
    valor_contrato: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    data_inicio: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_fim_prevista: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_ordem_servico: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum(StatusObjeto, name="status_objeto_enum"),
        default=StatusObjeto.PLANEJADA,
        nullable=False,
    )
    # Situação oficial (planilha) — mais granular que `status`
    situacao: Mapped[str | None] = mapped_column(
        Enum(SituacaoObjeto, name="situacao_objeto_enum"),
        nullable=True,
    )
    # Texto bruto original da coluna "SITUAÇÃO DA OBRA" (ex.: "CONCLUÍDA/2022")
    situacao_origem: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ano_referencia: Mapped[int | None] = mapped_column(Integer, nullable=True)
    saude: Mapped[str] = mapped_column(
        Enum(SaudeObjeto, name="saude_objeto_enum"),
        default=SaudeObjeto.VERDE,
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
    # Link canônico: o objeto pertence a um contrato (objetos.contrato_id)
    contrato_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("contratos.id"), nullable=True, index=True
    )
    # Orçamento (template) que originou a EAP deste objeto. Rastreabilidade: a
    # árvore foi COPIADA (congelada) na vinculação; mudanças no template não a afetam.
    orcamento_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orcamentos.id"), nullable=True, index=True
    )
    responsavel_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True
    )
    gestor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True
    )
    criado_por_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True
    )
    orgao: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    # Contrato (documento-mãe) ao qual este objeto pertence
    contrato = relationship(
        "Contrato", back_populates="objetos", lazy="selectin",
        foreign_keys=[contrato_id],
    )
    responsavel = relationship("Usuario", foreign_keys=[responsavel_id], lazy="selectin")
    gestor = relationship("Usuario", foreign_keys=[gestor_id], lazy="selectin")
    # Itens que compõem este objeto (Objeto 1—N Item)
    itens = relationship(
        "Item", back_populates="objeto", lazy="selectin",
        cascade="all, delete-orphan", order_by="Item.ordem",
    )
    metas = relationship("Meta", back_populates="objeto", lazy="selectin", cascade="all, delete-orphan")
    cronograma_versoes = relationship("CronogramaVersao", back_populates="objeto", lazy="selectin", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Objeto {self.titulo} ({self.status})>"


# ---------------------------------------------------------------------------
# Item (partes constitutivas do objeto)
# ---------------------------------------------------------------------------
class Item(Base):
    __tablename__ = "itens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    objeto_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("objetos.id", ondelete="CASCADE"), nullable=False
    )
    descricao: Mapped[str] = mapped_column(String(500), nullable=False)
    unidade: Mapped[str] = mapped_column(String(20), default="un")
    quantidade: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"))
    valor_unitario: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"))
    ordem: Mapped[int] = mapped_column(Integer, default=0)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    objeto = relationship("Objeto", back_populates="itens")

    @property
    def valor_total(self) -> Decimal:
        return self.quantidade * self.valor_unitario

    def __repr__(self) -> str:
        return f"<Item {self.descricao[:40]}>"


# ---------------------------------------------------------------------------
# Meta (nível 1 do cronograma físico-financeiro)
# ---------------------------------------------------------------------------
class Meta(Base):
    __tablename__ = "metas"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # Uma Meta pertence a um Objeto (EAP de execução) OU a um Orçamento (template,
    # módulo separado). Exatamente um dos dois é preenchido — por isso ambos são
    # nullable. A cópia template→objeto clona a árvore trocando o pai.
    objeto_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("objetos.id", ondelete="CASCADE"), nullable=True
    )
    orcamento_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orcamentos.id", ondelete="CASCADE"), nullable=True, index=True
    )
    descricao: Mapped[str] = mapped_column(String(500), nullable=False)
    valor: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"))
    ordem: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    objeto = relationship("Objeto", back_populates="metas", foreign_keys=[objeto_id])
    orcamento = relationship("Orcamento", back_populates="metas", foreign_keys=[orcamento_id])
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
    # Item do catálogo oficial que originou este evento (opcional). Quando
    # preenchido, herda unidade/descrição do catálogo; descrição/qtd/preço podem
    # ser ajustados livremente por objeto.
    catalogo_item_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("catalogo_itens.id"), nullable=True, index=True
    )
    # Código do serviço no catálogo oficial (ex.: SINAPI 87529).
    codigo_referencia: Mapped[str | None] = mapped_column(String(50), nullable=True)
    descricao: Mapped[str] = mapped_column(String(500), nullable=False)
    quantidade: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"))
    unidade: Mapped[str] = mapped_column(String(20), default="un")
    # No orçamento (template) guarda o CUSTO DIRETO unitário; ao copiar para o
    # objeto, recebe o preço final com BDI embutido (custo × (1 + BDI)).
    valor_unitario: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"))
    # Regra que a fiscalização segue no campo (ex.: "área líquida, descontando vãos").
    criterio_medicao: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    submeta = relationship("Submeta", back_populates="eventos")
    catalogo_item = relationship(
        "CatalogoItem", back_populates="eventos", lazy="selectin"
    )
    # Memória de cálculo CONTRATADA (justificativa matemática da quantidade do
    # orçamento). Espelha a memória executada da medição (MedicaoItemMemoria).
    memoria = relationship(
        "EventoMemoria", back_populates="evento", lazy="selectin",
        cascade="all, delete-orphan", order_by="EventoMemoria.ordem",
    )

    @property
    def valor_total(self) -> Decimal:
        return self.quantidade * self.valor_unitario

    def __repr__(self) -> str:
        return f"<Evento {self.descricao[:40]}>"


# ---------------------------------------------------------------------------
# Memória de Cálculo Contratada (justificativa da quantidade do orçamento)
# ---------------------------------------------------------------------------
class EventoMemoria(Base):
    """Linha estruturada da memória de cálculo CONTRATADA de um evento.

    Espelha ``MedicaoItemMemoria`` (a memória executada da medição): cada linha
    registra as dimensões (comprimento/perímetro, largura, altura), o nº de
    repetições e um fator percentual, resultando na quantidade (área/volume). A
    soma das linhas justifica a ``Evento.quantidade`` contratada.
    """
    __tablename__ = "evento_memoria"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evento_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("eventos.id", ondelete="CASCADE"), nullable=False
    )
    ordem: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    comprimento: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)  # C/P
    largura: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)       # L
    altura: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)        # H
    percentual: Mapped[Decimal | None] = mapped_column(Numeric(7, 4), nullable=True)      # %
    n_repeticoes: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("1"), nullable=False)  # N
    quantidade: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"), nullable=False)    # A/V resultante

    evento = relationship("Evento", back_populates="memoria")

    def __repr__(self) -> str:
        return f"<EventoMemoria evento={self.evento_id} ordem={self.ordem}>"


# ---------------------------------------------------------------------------
# Cronograma (Versionamento)
# ---------------------------------------------------------------------------
class CronogramaVersao(Base):
    __tablename__ = "cronograma_versoes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    objeto_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("objetos.id", ondelete="CASCADE"), nullable=False
    )
    numero_versao: Mapped[int] = mapped_column(Integer, nullable=False)
    ativa: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    linha_de_base: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    justificativa: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_periodos: Mapped[int] = mapped_column(Integer, nullable=False)
    criado_por_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True
    )
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("objeto_id", "numero_versao", name="uq_cronograma_versao_numero"),
    )

    # Relationships
    objeto = relationship("Objeto", back_populates="cronograma_versoes")
    criado_por = relationship("Usuario", foreign_keys=[criado_por_id])
    # lazy="selectin": indispensável para serializar `parcelas` no contexto async
    # (lazy-load fora do greenlet estoura com MissingGreenlet).
    parcelas = relationship(
        "CronogramaParcela",
        back_populates="versao",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<CronogramaVersao {self.numero_versao} (Objeto: {self.objeto_id})>"


class CronogramaParcela(Base):
    __tablename__ = "cronograma_parcelas"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    versao_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cronograma_versoes.id", ondelete="CASCADE"), nullable=False
    )
    evento_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("eventos.id", ondelete="CASCADE"), nullable=False
    )
    periodo_numero: Mapped[int] = mapped_column(Integer, nullable=False)
    quantidade_prevista: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=Decimal("0"))
    # --- Snapshot do orçamento no congelamento da versão (Decisão 2 — Planejamento) ---
    # Fotografia dos valores contratados do evento NO MOMENTO desta versão. Não
    # referenciam a linha viva de `Evento` (que pode ser editada): preservam a
    # "fotografia" original para auditoria do TCE. Nullable por compatibilidade
    # com versões criadas antes do snapshot.
    quantidade_contratada: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)
    valor_unitario: Mapped[Decimal | None] = mapped_column(Numeric(12, 4), nullable=True)
    descricao_evento: Mapped[str | None] = mapped_column(String(500), nullable=True)

    __table_args__ = (
        UniqueConstraint("versao_id", "evento_id", "periodo_numero", name="uq_cronograma_parcela"),
    )

    # Relationships
    versao = relationship("CronogramaVersao", back_populates="parcelas")
    evento = relationship("Evento")

    def __repr__(self) -> str:
        return f"<CronogramaParcela P{self.periodo_numero} Evento:{self.evento_id}>"
