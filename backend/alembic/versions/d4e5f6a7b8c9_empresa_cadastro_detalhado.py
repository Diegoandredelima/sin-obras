"""empresas: campos de cadastro detalhado

Revision ID: d4e5f6a7b8c9
Revises: b7c8d9e0f1a2
Create Date: 2026-06-21
"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect

from alembic import op

revision: str = "d4e5f6a7b8c9"
down_revision: str | None = "b7c8d9e0f1a2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


_NEW_COLUMNS = [
    ("nome_fantasia", sa.String(300)),
    ("email", sa.String(200)),
    ("telefone", sa.String(40)),
    ("endereco", sa.String(300)),
    ("municipio", sa.String(120)),
    ("uf", sa.String(2)),
    ("representante_legal", sa.String(200)),
    ("observacoes", sa.Text()),
]


def upgrade() -> None:
    insp = inspect(op.get_bind())
    cols = {c["name"] for c in insp.get_columns("empresas")}
    for name, coltype in _NEW_COLUMNS:
        if name not in cols:
            op.add_column("empresas", sa.Column(name, coltype, nullable=True))


def downgrade() -> None:
    for name, _ in reversed(_NEW_COLUMNS):
        op.drop_column("empresas", name)
