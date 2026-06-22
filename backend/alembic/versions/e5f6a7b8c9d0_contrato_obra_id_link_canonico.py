"""contratos: obra_id (link canônico Contrato N-1 Obra) + valor_contrato opcional

Modelo de domínio: uma obra pode ter vários contratos; cada contrato pertence a
uma única obra. Adiciona contratos.obra_id e faz backfill a partir do link legado
obras.contrato_id. Torna obras.valor_contrato opcional (o valor canônico passa a
viver nos contratos da obra).

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-06-22
"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "e5f6a7b8c9d0"
down_revision: str | None = "d4e5f6a7b8c9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    cols = {c["name"] for c in insp.get_columns("contratos")}
    if "obra_id" not in cols:
        op.add_column("contratos", sa.Column("obra_id", postgresql.UUID(as_uuid=True), nullable=True))
        op.create_foreign_key(
            "fk_contratos_obra_id", "contratos", "obras", ["obra_id"], ["id"]
        )
        op.create_index("ix_contratos_obra_id", "contratos", ["obra_id"])

    # Backfill: cada contrato herda a obra que hoje aponta para ele (obras.contrato_id).
    # Se mais de uma obra apontar para o mesmo contrato, escolhe-se uma (caso raro/legado).
    op.execute(
        """
        UPDATE contratos c
        SET obra_id = sub.obra_id
        FROM (
            SELECT DISTINCT ON (contrato_id) contrato_id, id AS obra_id
            FROM obras
            WHERE contrato_id IS NOT NULL
            ORDER BY contrato_id, criado_em
        ) sub
        WHERE c.id = sub.contrato_id AND c.obra_id IS NULL
        """
    )

    # valor_contrato deixa de ser obrigatório
    op.alter_column("obras", "valor_contrato", existing_type=sa.Numeric(15, 2), nullable=True)


def downgrade() -> None:
    op.alter_column("obras", "valor_contrato", existing_type=sa.Numeric(15, 2), nullable=False)
    op.drop_index("ix_contratos_obra_id", table_name="contratos")
    op.drop_constraint("fk_contratos_obra_id", "contratos", type_="foreignkey")
    op.drop_column("contratos", "obra_id")
