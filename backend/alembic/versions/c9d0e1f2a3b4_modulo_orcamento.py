"""modulo de orcamento (template), EAP sob orcamento, codigo/criterio no evento

Revision ID: c9d0e1f2a3b4
Revises: b8c9d0e1f2a3
Create Date: 2026-06-26 22:30:00.000000

Cria o módulo de Orçamento (banco de dados técnico, anterior ao Objeto):
  - tabela ``orcamentos`` (cabeçalho: código, título, data-base, BDI, status);
  - ``metas.orcamento_id`` (EAP pode pertencer a um orçamento) + ``metas.objeto_id``
    passa a ser nullable (uma meta pertence a um objeto OU a um orçamento);
  - ``eventos.codigo_referencia`` (SINAPI) e ``eventos.criterio_medicao``;
  - ``objetos.orcamento_id`` (rastreabilidade do template que originou a EAP).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "c9d0e1f2a3b4"
down_revision: Union[str, None] = "b8c9d0e1f2a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _inspector():
    return sa.inspect(op.get_bind())


def _has_table(name: str) -> bool:
    return name in _inspector().get_table_names()


def _has_column(table: str, column: str) -> bool:
    return any(c["name"] == column for c in _inspector().get_columns(table))


def upgrade() -> None:
    status_enum = sa.Enum("RASCUNHO", "FINALIZADO", name="status_orcamento_enum")
    status_enum.create(op.get_bind(), checkfirst=True)

    if not _has_table("orcamentos"):
        op.create_table(
            "orcamentos",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("codigo", sa.String(length=30), nullable=False),
            sa.Column("titulo", sa.String(length=300), nullable=False),
            sa.Column("data_base", sa.Date(), nullable=True),
            sa.Column("bdi_percentual", sa.Numeric(precision=5, scale=2), nullable=False, server_default="0"),
            sa.Column("descricao", sa.Text(), nullable=True),
            sa.Column("status", status_enum, nullable=False, server_default="RASCUNHO"),
            sa.Column("criado_por_id", sa.UUID(), nullable=True),
            sa.Column("criado_em", sa.DateTime(timezone=True), nullable=False),
            sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["criado_por_id"], ["usuarios.id"]),
            sa.PrimaryKeyConstraint("id", name="orcamentos_pkey"),
            sa.UniqueConstraint("codigo", name="uq_orcamentos_codigo"),
        )
        op.create_index("ix_orcamentos_codigo", "orcamentos", ["codigo"])

    # Meta: pode pertencer a um orçamento; objeto_id passa a ser opcional.
    if not _has_column("metas", "orcamento_id"):
        op.add_column("metas", sa.Column("orcamento_id", sa.UUID(), nullable=True))
        op.create_foreign_key(
            "metas_orcamento_id_fkey", "metas", "orcamentos", ["orcamento_id"], ["id"], ondelete="CASCADE",
        )
        op.create_index("ix_metas_orcamento_id", "metas", ["orcamento_id"])
    op.alter_column("metas", "objeto_id", existing_type=sa.UUID(), nullable=True)

    # Evento: código de referência (SINAPI) e critério de medição.
    if not _has_column("eventos", "codigo_referencia"):
        op.add_column("eventos", sa.Column("codigo_referencia", sa.String(length=50), nullable=True))
    if not _has_column("eventos", "criterio_medicao"):
        op.add_column("eventos", sa.Column("criterio_medicao", sa.Text(), nullable=True))

    # Objeto: rastreabilidade do orçamento de origem.
    if not _has_column("objetos", "orcamento_id"):
        op.add_column("objetos", sa.Column("orcamento_id", sa.UUID(), nullable=True))
        op.create_foreign_key(
            "objetos_orcamento_id_fkey", "objetos", "orcamentos", ["orcamento_id"], ["id"],
        )
        op.create_index("ix_objetos_orcamento_id", "objetos", ["orcamento_id"])


def downgrade() -> None:
    if _has_column("objetos", "orcamento_id"):
        op.drop_index("ix_objetos_orcamento_id", table_name="objetos")
        op.drop_constraint("objetos_orcamento_id_fkey", "objetos", type_="foreignkey")
        op.drop_column("objetos", "orcamento_id")
    for col in ("criterio_medicao", "codigo_referencia"):
        if _has_column("eventos", col):
            op.drop_column("eventos", col)
    if _has_column("metas", "orcamento_id"):
        op.drop_index("ix_metas_orcamento_id", table_name="metas")
        op.drop_constraint("metas_orcamento_id_fkey", "metas", type_="foreignkey")
        op.drop_column("metas", "orcamento_id")
    # objeto_id volta a NOT NULL apenas se não houver metas órfãs (best-effort).
    op.alter_column("metas", "objeto_id", existing_type=sa.UUID(), nullable=False)
    if _has_table("orcamentos"):
        op.drop_index("ix_orcamentos_codigo", table_name="orcamentos")
        op.drop_table("orcamentos")
    sa.Enum(name="status_orcamento_enum").drop(op.get_bind(), checkfirst=True)
