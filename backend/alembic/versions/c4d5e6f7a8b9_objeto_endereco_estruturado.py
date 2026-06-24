"""objetos: endereco estruturado (cep, logradouro, numero, bairro, conjunto, uf)

Revision ID: c4d5e6f7a8b9
Revises: a2b3c4d5e6f7
Create Date: 2026-06-24

Adiciona campos estruturados de endereço ao objeto. A `cidade` reaproveita a
coluna já existente `objetos.municipio`; `endereco` (texto livre legado) é
mantido para exibição/compatibilidade.
"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect

from alembic import op

revision: str = "c4d5e6f7a8b9"
down_revision: str | None = "a2b3c4d5e6f7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


_NEW_COLUMNS = [
    ("cep", sa.String(9)),
    ("logradouro", sa.String(300)),
    ("numero", sa.String(20)),
    ("bairro", sa.String(150)),
    ("conjunto", sa.String(150)),
    ("uf", sa.String(2)),
]


def upgrade() -> None:
    insp = inspect(op.get_bind())
    cols = {c["name"] for c in insp.get_columns("objetos")}
    for name, coltype in _NEW_COLUMNS:
        if name not in cols:
            op.add_column("objetos", sa.Column(name, coltype, nullable=True))


def downgrade() -> None:
    for name, _ in reversed(_NEW_COLUMNS):
        op.drop_column("objetos", name)
