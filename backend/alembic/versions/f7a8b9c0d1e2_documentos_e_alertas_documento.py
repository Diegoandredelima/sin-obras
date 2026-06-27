"""documentos_contratuais e alertas de documento

Revision ID: f7a8b9c0d1e2
Revises: e6f7a8b9c0d1
Create Date: 2026-06-25 13:00:00.000000

RF11 — tabela `documentos` (versionamento + vencimento) e enum tipo_documento_enum;
novos valores DOCUMENTO_VENCENDO/DOCUMENTO_VENCIDO em tipo_alerta_enum.

Migração defensiva: o `create_all` no startup pode já ter criado a tabela/enum em
bancos novos; checa existência antes de criar.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "f7a8b9c0d1e2"
down_revision: Union[str, None] = "e6f7a8b9c0d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_table(table: str) -> bool:
    return sa.inspect(op.get_bind()).has_table(table)


def upgrade() -> None:
    bind = op.get_bind()

    # Novos valores do enum de alerta (idempotente)
    op.execute("ALTER TYPE tipo_alerta_enum ADD VALUE IF NOT EXISTS 'DOCUMENTO_VENCENDO'")
    op.execute("ALTER TYPE tipo_alerta_enum ADD VALUE IF NOT EXISTS 'DOCUMENTO_VENCIDO'")

    tipo_doc = sa.Enum(
        "ART", "PLANTA", "LICENCA", "GARANTIA", "SEGURO", "OUTRO",
        name="tipo_documento_enum",
    )
    tipo_doc.create(bind, checkfirst=True)

    if not _has_table("documentos"):
        op.create_table(
            "documentos",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("objeto_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("objetos.id", ondelete="CASCADE"), nullable=False),
            sa.Column("tipo", sa.Enum(name="tipo_documento_enum", create_type=False), nullable=False),
            sa.Column("nome", sa.String(300), nullable=False),
            sa.Column("url_storage", sa.Text(), nullable=True),
            sa.Column("data_validade", sa.Date(), nullable=True),
            sa.Column("versao", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("substitui_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("documentos.id"), nullable=True),
            sa.Column("criado_por_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("usuarios.id"), nullable=True),
            sa.Column("criado_em", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )


def downgrade() -> None:
    if _has_table("documentos"):
        op.drop_table("documentos")
    sa.Enum(name="tipo_documento_enum").drop(op.get_bind(), checkfirst=True)
    # PostgreSQL não permite remover valores de enum. Apenas nota.
