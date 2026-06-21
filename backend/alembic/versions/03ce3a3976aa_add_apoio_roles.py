"""add_apoio_roles

Revision ID: 03ce3a3976aa
Revises: c3d4e5f6a7b8
Create Date: 2026-06-21 04:27:47.055731

Adiciona APOIO_N1 e APOIO_N2 ao enum role_enum.
"""
from typing import Sequence, Union

from alembic import op


revision: str = '03ce3a3976aa'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE role_enum ADD VALUE IF NOT EXISTS 'APOIO_N1'")
    op.execute("ALTER TYPE role_enum ADD VALUE IF NOT EXISTS 'APOIO_N2'")


def downgrade() -> None:
    # PostgreSQL não permite remover valores de enum. Apenas nota.
    pass
