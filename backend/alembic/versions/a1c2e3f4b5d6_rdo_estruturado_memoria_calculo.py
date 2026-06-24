"""rdo_estruturado_memoria_calculo

RDO (Diário de Obras) estruturado: tempo por turno (manhã/tarde) + pluviometria,
listas JSONB de equipamento e mão de obra, e observações da fiscalização.
Memória de cálculo estruturada: nova tabela ``medicao_item_memoria`` com as
dimensões medidas por item (C/P × L × H × N = A/V).

Defensiva por causa da "criação dupla de tabelas" (AGENTS.md): o
``Base.metadata.create_all`` do startup pode já ter criado a tabela nova e/ou o
tipo enum. Cada passo só roda se ainda não existir.

Revision ID: a1c2e3f4b5d6
Revises: f7a1b2c3d4e5
Create Date: 2026-06-22

"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1c2e3f4b5d6"
down_revision: str | None = "f7a1b2c3d4e5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


condicao_tempo_enum = postgresql.ENUM(
    "BOM", "CHUVA_FRACA", "CHUVA_FORTE", name="condicao_tempo_enum", create_type=False
)


def _inspector():
    return sa.inspect(op.get_bind())


def _has_table(name: str) -> bool:
    return name in _inspector().get_table_names()


def _has_column(table: str, column: str) -> bool:
    return any(c["name"] == column for c in _inspector().get_columns(table))


def _add_column(table: str, column: sa.Column) -> None:
    if not _has_column(table, column.name):
        op.add_column(table, column)


def upgrade() -> None:
    # --- Enum de condição de tempo ---
    condicao_tempo_enum.create(op.get_bind(), checkfirst=True)

    # --- Diário de Obras: RDO estruturado ---
    _add_column("diario_obra", sa.Column("tempo_manha", condicao_tempo_enum, nullable=True))
    _add_column("diario_obra", sa.Column("tempo_tarde", condicao_tempo_enum, nullable=True))
    _add_column("diario_obra", sa.Column("pluviometria_mm", sa.Numeric(precision=6, scale=2), nullable=True))
    _add_column("diario_obra", sa.Column("equipamentos_lista", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    _add_column("diario_obra", sa.Column("mao_de_obra", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    _add_column("diario_obra", sa.Column("observacoes_fiscal", sa.Text(), nullable=True))

    # --- Memória de cálculo estruturada (linhas por item da medição) ---
    if not _has_table("medicao_item_memoria"):
        op.create_table(
            "medicao_item_memoria",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("medicao_item_id", sa.UUID(), nullable=False),
            sa.Column("ordem", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("descricao", sa.Text(), nullable=True),
            sa.Column("comprimento", sa.Numeric(precision=12, scale=4), nullable=True),
            sa.Column("largura", sa.Numeric(precision=12, scale=4), nullable=True),
            sa.Column("altura", sa.Numeric(precision=12, scale=4), nullable=True),
            sa.Column("percentual", sa.Numeric(precision=7, scale=4), nullable=True),
            sa.Column("n_repeticoes", sa.Numeric(precision=12, scale=4), nullable=False, server_default="1"),
            sa.Column("quantidade", sa.Numeric(precision=12, scale=4), nullable=False, server_default="0"),
            sa.ForeignKeyConstraint(["medicao_item_id"], ["medicao_itens.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )


def downgrade() -> None:
    op.drop_table("medicao_item_memoria")

    op.drop_column("diario_obra", "observacoes_fiscal")
    op.drop_column("diario_obra", "mao_de_obra")
    op.drop_column("diario_obra", "equipamentos_lista")
    op.drop_column("diario_obra", "pluviometria_mm")
    op.drop_column("diario_obra", "tempo_tarde")
    op.drop_column("diario_obra", "tempo_manha")

    condicao_tempo_enum.drop(op.get_bind(), checkfirst=True)
