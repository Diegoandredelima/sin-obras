"""add_criado_por_id_obra

Revision ID: 4e381841eac9
Revises: 27b769b34877
Create Date: 2026-06-21 12:28:14.036398

Adiciona coluna criado_por_id à tabela obras.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = '4e381841eac9'
down_revision: Union[str, None] = '27b769b34877'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("obras", sa.Column("criado_por_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(None, "obras", "usuarios", ["criado_por_id"], ["id"], ondelete="SET NULL")


def downgrade() -> None:
    op.drop_constraint(None, "obras", type_="foreignkey")
    op.drop_column("obras", "criado_por_id")


def downgrade() -> None:
    pass
