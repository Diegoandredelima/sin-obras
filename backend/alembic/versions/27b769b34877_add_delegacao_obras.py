"""add_delegacao_obras

Revision ID: 27b769b34877
Revises: 03ce3a3976aa
Create Date: 2026-06-21 04:28:47.344981

Tabela de delegações: vincula usuários a obras com função e período.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = '27b769b34877'
down_revision: Union[str, None] = '03ce3a3976aa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "delegacoes_obras",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("obra_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("obras.id", ondelete="CASCADE"), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False),
        sa.Column("delegado_por_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True),
        sa.Column("funcao", sa.String(30), nullable=False, server_default="FISCAL"),
        sa.Column("data_inicio", sa.Date(), nullable=False),
        sa.Column("data_fim", sa.Date(), nullable=True),
        sa.Column("observacao", sa.Text(), nullable=True),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("criado_em", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("delegacoes_obras")



def downgrade() -> None:
    pass
