"""
SIN-Obras — Modelos: Catálogo de Itens e Serviços

Tabela de referência (lookup) com o catálogo oficial de insumos/serviços
(Tabela 028). Usada no cadastro do cronograma físico-financeiro de uma obra:
ao lançar um Evento, seleciona-se um item do catálogo, herdando unidade e
descrição.

Código (`codigo_sistema`) — lógica ``SIN{classe:02d}-{item:06d}``:
  • ``SIN``  — sigla da Secretaria de Infraestrutura.
  • ``{classe:02d}`` — código sequencial da CLASSE (``catalogo_classes.codigo``).
  • ``{item:06d}``   — código sequencial do ITEM dentro da classe
                      (``catalogo_itens.item_codigo``).
  Ex.: ``SIN18-000042`` = 42º item da classe 18.

Tratamento dos dados de origem (vs. CSV bruto):
  • Colunas descartadas: ``codigo_origem``, ``fonte``, ``data_emissao``.
  • ``item`` é o nome curto (o "elemento" da descrição) — sempre preenchido.
  • ``descricao`` guarda o detalhamento APENAS quando acrescenta informação ao
    ``item``. Quando o CSV repetia item == descricao, ``descricao`` fica nula
    (NULL) e passa a ser um campo livre para o usuário complementar.
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CatalogoClasse(Base):
    """Categoria do catálogo (ex.: "INSTAL.HIDRAULICA"). 45 valores.

    ``codigo`` é o código sequencial da classe (1..N) — os dois dígitos centrais
    do ``codigo_sistema`` dos itens.
    """
    __tablename__ = "catalogo_classes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    codigo: Mapped[int] = mapped_column(Integer, unique=True, nullable=False, index=True)
    nome: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    itens = relationship("CatalogoItem", back_populates="classe", lazy="selectin")

    def __repr__(self) -> str:
        return f"<CatalogoClasse {self.codigo:02d} {self.nome}>"


class CatalogoItem(Base):
    __tablename__ = "catalogo_itens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # Código composto SIN{classe:02d}-{item:06d}. Único e indexado.
    codigo_sistema: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True
    )
    classe_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("catalogo_classes.id"), nullable=False, index=True
    )
    # Código sequencial do item DENTRO da classe (parte final do codigo_sistema).
    item_codigo: Mapped[int] = mapped_column(Integer, nullable=False)
    # Nome curto — o "elemento" da descrição. Sempre preenchido.
    item: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    # Detalhamento complementar. NULL quando repetia o item (campo livre para o
    # usuário preencher na hora do cadastro).
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Unidade de medida (UN, M, M2, M3, KG, H, HxMÊS...).
    unidade: Mapped[str | None] = mapped_column(String(10), nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    classe = relationship("CatalogoClasse", back_populates="itens", lazy="selectin")
    # Eventos do cronograma que referenciam este item do catálogo.
    eventos = relationship(
        "Evento", back_populates="catalogo_item", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<CatalogoItem {self.codigo_sistema} {self.item[:40]}>"
