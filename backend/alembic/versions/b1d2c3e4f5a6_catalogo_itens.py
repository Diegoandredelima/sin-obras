"""catalogo_itens

Catálogo oficial de itens/serviços (Tabela 028), usado no cadastro do cronograma
físico-financeiro de uma obra. A tabela de origem foi tratada:
  • descartadas as colunas codigo_origem, fonte, data_emissao;
  • item = nome curto (sempre preenchido);
  • descricao = detalhamento, nulo quando repetia o item (vira campo livre).

Código `codigo_sistema` = SIN{classe:02d}-{item:06d}:
  • SIN = sigla da Secretaria de Infraestrutura;
  • classe = código sequencial da classe (catalogo_classes.codigo);
  • item   = código sequencial do item dentro da classe (catalogo_itens.item_codigo).

Estrutura: catalogo_classes (1) —N catalogo_itens; eventos.catalogo_item_id (N—1).

Defensiva por causa da "criação dupla de tabelas" (AGENTS.md): o
`Base.metadata.create_all` do startup pode já ter criado as tabelas e/ou a
coluna. Cada passo só roda se ainda não existir. O seed só insere se a tabela
estiver vazia (idempotente).

Revision ID: b1d2c3e4f5a6
Revises: a1c2e3f4b5d6
Create Date: 2026-06-23

"""
import csv
import uuid
from collections.abc import Sequence
from datetime import UTC, datetime
from pathlib import Path

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b1d2c3e4f5a6"
down_revision: str | None = "a1c2e3f4b5d6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


# CSV tratado, empacotado com o backend (app/data/catalogo_itens.csv).
_CSV_PATH = Path(__file__).resolve().parents[2] / "app" / "data" / "catalogo_itens.csv"


def _inspector():
    return sa.inspect(op.get_bind())


def _has_table(name: str) -> bool:
    return name in _inspector().get_table_names()


def _has_column(table: str, column: str) -> bool:
    return any(c["name"] == column for c in _inspector().get_columns(table))


def _seed_catalogo() -> None:
    """Popula catalogo_classes e catalogo_itens a partir do CSV (se vazias)."""
    bind = op.get_bind()
    if not _CSV_PATH.exists():
        return
    if bind.execute(sa.text("SELECT COUNT(*) FROM catalogo_itens")).scalar():
        return

    agora = datetime.now(UTC)
    with _CSV_PATH.open(encoding="utf-8", newline="") as f:
        registros = list(csv.DictReader(f))

    # --- Classes (distintas, codigo -> id) ---
    classes: dict[int, str] = {}
    for r in registros:
        cod = int(r["classe_codigo"])
        classes.setdefault(cod, r["classe"].strip())

    classe_id: dict[int, uuid.UUID] = {cod: uuid.uuid4() for cod in classes}
    classes_rows = [
        {"id": classe_id[cod], "codigo": cod, "nome": nome, "criado_em": agora}
        for cod, nome in sorted(classes.items())
    ]
    tbl_classes = sa.table(
        "catalogo_classes",
        sa.column("id", sa.UUID()),
        sa.column("codigo", sa.Integer()),
        sa.column("nome", sa.String()),
        sa.column("criado_em", sa.DateTime(timezone=True)),
    )
    op.bulk_insert(tbl_classes, classes_rows)

    # --- Itens ---
    itens_rows = []
    for r in registros:
        descricao = (r.get("descricao") or "").strip()
        itens_rows.append(
            {
                "id": uuid.uuid4(),
                "codigo_sistema": r["codigo_sistema"].strip(),
                "classe_id": classe_id[int(r["classe_codigo"])],
                "item_codigo": int(r["item_codigo"]),
                "item": (r["item"] or "").strip(),
                "descricao": descricao or None,
                "unidade": (r.get("unidade") or "").strip() or None,
                "ativo": True,
                "criado_em": agora,
            }
        )
    tbl_itens = sa.table(
        "catalogo_itens",
        sa.column("id", sa.UUID()),
        sa.column("codigo_sistema", sa.String()),
        sa.column("classe_id", sa.UUID()),
        sa.column("item_codigo", sa.Integer()),
        sa.column("item", sa.String()),
        sa.column("descricao", sa.Text()),
        sa.column("unidade", sa.String()),
        sa.column("ativo", sa.Boolean()),
        sa.column("criado_em", sa.DateTime(timezone=True)),
    )
    # Lotes para não estourar o limite de parâmetros do driver.
    for i in range(0, len(itens_rows), 1000):
        op.bulk_insert(tbl_itens, itens_rows[i : i + 1000])


def upgrade() -> None:
    if not _has_table("catalogo_classes"):
        op.create_table(
            "catalogo_classes",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("codigo", sa.Integer(), nullable=False),
            sa.Column("nome", sa.String(length=80), nullable=False),
            sa.Column("criado_em", sa.DateTime(timezone=True), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("codigo", name="uq_catalogo_classes_codigo"),
            sa.UniqueConstraint("nome", name="uq_catalogo_classes_nome"),
        )
        op.create_index("ix_catalogo_classes_codigo", "catalogo_classes", ["codigo"])

    if not _has_table("catalogo_itens"):
        op.create_table(
            "catalogo_itens",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("codigo_sistema", sa.String(length=20), nullable=False),
            sa.Column("classe_id", sa.UUID(), nullable=False),
            sa.Column("item_codigo", sa.Integer(), nullable=False),
            sa.Column("item", sa.String(length=200), nullable=False),
            sa.Column("descricao", sa.Text(), nullable=True),
            sa.Column("unidade", sa.String(length=10), nullable=True),
            sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("criado_em", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["classe_id"], ["catalogo_classes.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("codigo_sistema", name="uq_catalogo_itens_codigo_sistema"),
        )
        op.create_index("ix_catalogo_itens_codigo_sistema", "catalogo_itens", ["codigo_sistema"])
        op.create_index("ix_catalogo_itens_classe_id", "catalogo_itens", ["classe_id"])
        op.create_index("ix_catalogo_itens_item", "catalogo_itens", ["item"])

    # --- Evento: referência ao item do catálogo ---
    if not _has_column("eventos", "catalogo_item_id"):
        op.add_column("eventos", sa.Column("catalogo_item_id", sa.UUID(), nullable=True))
        op.create_index("ix_eventos_catalogo_item_id", "eventos", ["catalogo_item_id"])

    existing_fks = {fk["name"] for fk in _inspector().get_foreign_keys("eventos")}
    if "fk_eventos_catalogo_item_id" not in existing_fks:
        op.create_foreign_key(
            "fk_eventos_catalogo_item_id", "eventos", "catalogo_itens",
            ["catalogo_item_id"], ["id"],
        )

    _seed_catalogo()


def downgrade() -> None:
    existing_fks = {fk["name"] for fk in _inspector().get_foreign_keys("eventos")}
    if "fk_eventos_catalogo_item_id" in existing_fks:
        op.drop_constraint("fk_eventos_catalogo_item_id", "eventos", type_="foreignkey")
    if _has_column("eventos", "catalogo_item_id"):
        op.drop_index("ix_eventos_catalogo_item_id", table_name="eventos")
        op.drop_column("eventos", "catalogo_item_id")

    if _has_table("catalogo_itens"):
        op.drop_table("catalogo_itens")
    if _has_table("catalogo_classes"):
        op.drop_table("catalogo_classes")
