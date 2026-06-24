"""contratos: link_processo (URL do processo no SEI)

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-06-24

Adiciona o campo `link_processo` ao contrato — URL externa que abre a página do
processo (SEI) correspondente ao `numero_processo` ao visualizar o contrato.
"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect

from alembic import op

revision: str = "d5e6f7a8b9c0"
down_revision: str | None = "c4d5e6f7a8b9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    insp = inspect(op.get_bind())
    cols = {c["name"] for c in insp.get_columns("contratos")}
    if "link_processo" not in cols:
        op.add_column("contratos", sa.Column("link_processo", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("contratos", "link_processo")
