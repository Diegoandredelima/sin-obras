"""planejamento snapshot, travas de contrato, memoria contratada e legenda de foto

Revision ID: b8c9d0e1f2a3
Revises: 9c16c956a63e
Create Date: 2026-06-26 21:30:00.000000

Consolida as mudanças do Plano de Gestão e Medição:
  - Decisão 1: travas de lançamento no contrato (qtd negativa / acima do contratado);
  - Decisão 2: snapshot do orçamento na parcela do cronograma (Planejamento);
  - Memória de cálculo contratada (tabela evento_memoria);
  - Legenda das fotos de medição (titulo/descricao).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "b8c9d0e1f2a3"
down_revision: Union[str, None] = "9c16c956a63e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _inspector():
    return sa.inspect(op.get_bind())


def _has_table(name: str) -> bool:
    return name in _inspector().get_table_names()


def _has_column(table: str, column: str) -> bool:
    return any(c["name"] == column for c in _inspector().get_columns(table))


def upgrade() -> None:
    # --- Contrato: regras de trava do lançamento (Decisão 1) ---
    if not _has_column("contratos", "bloquear_quantidade_negativa"):
        op.add_column(
            "contratos",
            sa.Column("bloquear_quantidade_negativa", sa.Boolean(), nullable=False, server_default="true"),
        )
    if not _has_column("contratos", "bloquear_acima_contratado"):
        op.add_column(
            "contratos",
            sa.Column("bloquear_acima_contratado", sa.Boolean(), nullable=False, server_default="true"),
        )

    # --- CronogramaParcela: snapshot do orçamento por versão (Decisão 2) ---
    if not _has_column("cronograma_parcelas", "quantidade_contratada"):
        op.add_column(
            "cronograma_parcelas",
            sa.Column("quantidade_contratada", sa.Numeric(precision=12, scale=4), nullable=True),
        )
    if not _has_column("cronograma_parcelas", "valor_unitario"):
        op.add_column(
            "cronograma_parcelas",
            sa.Column("valor_unitario", sa.Numeric(precision=12, scale=4), nullable=True),
        )
    if not _has_column("cronograma_parcelas", "descricao_evento"):
        op.add_column(
            "cronograma_parcelas",
            sa.Column("descricao_evento", sa.String(length=500), nullable=True),
        )

    # --- FotoMedicao: legenda (título + descrição) ---
    if not _has_column("fotos_medicao", "titulo"):
        op.add_column("fotos_medicao", sa.Column("titulo", sa.String(length=200), nullable=True))
    if not _has_column("fotos_medicao", "descricao"):
        op.add_column("fotos_medicao", sa.Column("descricao", sa.Text(), nullable=True))

    # --- Memória de cálculo contratada (evento_memoria) ---
    if not _has_table("evento_memoria"):
        op.create_table(
            "evento_memoria",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("evento_id", sa.UUID(), nullable=False),
            sa.Column("ordem", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("descricao", sa.Text(), nullable=True),
            sa.Column("comprimento", sa.Numeric(precision=12, scale=4), nullable=True),
            sa.Column("largura", sa.Numeric(precision=12, scale=4), nullable=True),
            sa.Column("altura", sa.Numeric(precision=12, scale=4), nullable=True),
            sa.Column("percentual", sa.Numeric(precision=7, scale=4), nullable=True),
            sa.Column("n_repeticoes", sa.Numeric(precision=12, scale=4), nullable=False, server_default="1"),
            sa.Column("quantidade", sa.Numeric(precision=12, scale=4), nullable=False, server_default="0"),
            sa.ForeignKeyConstraint(["evento_id"], ["eventos.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id", name="evento_memoria_pkey"),
        )


def downgrade() -> None:
    if _has_table("evento_memoria"):
        op.drop_table("evento_memoria")
    for col in ("descricao", "titulo"):
        if _has_column("fotos_medicao", col):
            op.drop_column("fotos_medicao", col)
    for col in ("descricao_evento", "valor_unitario", "quantidade_contratada"):
        if _has_column("cronograma_parcelas", col):
            op.drop_column("cronograma_parcelas", col)
    for col in ("bloquear_acima_contratado", "bloquear_quantidade_negativa"):
        if _has_column("contratos", col):
            op.drop_column("contratos", col)
