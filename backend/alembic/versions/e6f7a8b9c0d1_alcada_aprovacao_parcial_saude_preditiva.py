"""alcada_aprovacao_parcial_saude_preditiva

Revision ID: e6f7a8b9c0d1
Revises: d5e6f7a8b9c0
Create Date: 2026-06-25 12:00:00.000000

Quick wins de alinhamento:
- RF24/RN08: novo status de medição AGUARDANDO_CHEFE (alçada de aprovação).
- RF23: coluna ``medicao_itens.quantidade_aprovada`` (aprovação parcial por item).
- RN05: novo tipo de alerta ATRASO_PREDITIVO (saúde preditiva).
- RF12: tramitação de solicitações da empresa (status_tramitacao_enum +
  colunas em ``paralisacoes`` e ``aditivos_prazo``).

Migração defensiva: o ``create_all`` no startup pode já ter criado colunas/tipos
em bancos novos; checa existência antes de criar.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "e6f7a8b9c0d1"
down_revision: Union[str, None] = "d5e6f7a8b9c0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(table: str, column: str) -> bool:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    return any(c["name"] == column for c in insp.get_columns(table))


def upgrade() -> None:
    bind = op.get_bind()

    # Enums de medição/alerta (idempotente)
    op.execute("ALTER TYPE status_medicao_enum ADD VALUE IF NOT EXISTS 'AGUARDANDO_CHEFE'")
    op.execute("ALTER TYPE tipo_alerta_enum ADD VALUE IF NOT EXISTS 'ATRASO_PREDITIVO'")

    # Tipo enum de tramitação (cria se ainda não existe)
    tramitacao_enum = sa.Enum(
        "RECEBIDA", "EM_ANALISE", "DEFERIDA", "INDEFERIDA",
        name="status_tramitacao_enum",
    )
    tramitacao_enum.create(bind, checkfirst=True)
    tramitacao_col = sa.Enum(
        "RECEBIDA", "EM_ANALISE", "DEFERIDA", "INDEFERIDA",
        name="status_tramitacao_enum", create_type=False,
    )

    # Coluna de aprovação parcial por item
    if not _has_column("medicao_itens", "quantidade_aprovada"):
        op.add_column(
            "medicao_itens",
            sa.Column("quantidade_aprovada", sa.Numeric(12, 4), nullable=True),
        )

    # Tramitação das solicitações da empresa
    for tabela in ("paralisacoes", "aditivos_prazo"):
        if not _has_column(tabela, "status_tramitacao"):
            op.add_column(tabela, sa.Column("status_tramitacao", tramitacao_col, nullable=True))
        if not _has_column(tabela, "solicitado_por_id"):
            op.add_column(
                tabela,
                sa.Column("solicitado_por_id", postgresql.UUID(as_uuid=True), nullable=True),
            )
            op.create_foreign_key(
                f"fk_{tabela}_solicitado_por", tabela, "usuarios",
                ["solicitado_por_id"], ["id"],
            )


def downgrade() -> None:
    for tabela in ("paralisacoes", "aditivos_prazo"):
        if _has_column(tabela, "solicitado_por_id"):
            op.drop_constraint(f"fk_{tabela}_solicitado_por", tabela, type_="foreignkey")
            op.drop_column(tabela, "solicitado_por_id")
        if _has_column(tabela, "status_tramitacao"):
            op.drop_column(tabela, "status_tramitacao")
    if _has_column("medicao_itens", "quantidade_aprovada"):
        op.drop_column("medicao_itens", "quantidade_aprovada")
    sa.Enum(name="status_tramitacao_enum").drop(op.get_bind(), checkfirst=True)
    # PostgreSQL não permite remover valores de enum. Apenas nota.
