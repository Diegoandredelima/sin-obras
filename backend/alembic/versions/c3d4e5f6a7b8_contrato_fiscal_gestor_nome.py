"""contratos: fiscal_nome e gestor_nome (preservar texto da planilha)

Revision ID: c3d4e5f6a7b8
Revises: b2f3a1c9d4e7
Create Date: 2026-06-18
"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect

from alembic import op

revision: str = "c3d4e5f6a7b8"
down_revision: str | None = "b2f3a1c9d4e7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    insp = inspect(op.get_bind())
    cols = {c["name"] for c in insp.get_columns("contratos")}
    if "fiscal_nome" not in cols:
        op.add_column("contratos", sa.Column("fiscal_nome", sa.String(200), nullable=True))
    if "gestor_nome" not in cols:
        op.add_column("contratos", sa.Column("gestor_nome", sa.String(200), nullable=True))


def downgrade() -> None:
    op.drop_column("contratos", "gestor_nome")
    op.drop_column("contratos", "fiscal_nome")
