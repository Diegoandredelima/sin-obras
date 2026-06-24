"""medicao_boletim_itens_fotos

Boletim de Medição físico-financeiro: itens quantitativos (qtd x preço unitário),
fotos invioláveis por item, origem empresa/fiscal e parâmetros de retenção.

Defensiva por causa da "criação dupla de tabelas" (AGENTS.md): o
`Base.metadata.create_all` do startup pode já ter criado as tabelas novas e/ou
o tipo enum. Cada passo só roda se ainda não existir.

Revision ID: f7a1b2c3d4e5
Revises: e5f6a7b8c9d0
Create Date: 2026-06-22

"""
from collections.abc import Sequence

import geoalchemy2 as ga
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f7a1b2c3d4e5"
down_revision: str | None = "e5f6a7b8c9d0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


origem_medicao_enum = postgresql.ENUM(
    "EMPRESA", "FISCAL", name="origem_medicao_enum", create_type=False
)


def _inspector():
    return sa.inspect(op.get_bind())


def _has_table(name: str) -> bool:
    return name in _inspector().get_table_names()


def _has_column(table: str, column: str) -> bool:
    return any(c["name"] == column for c in _inspector().get_columns(table))


def _add_column(table: str, column: sa.Column) -> None:
    if not _has_column(table, column.name):
        op.add_column(table, column)


def upgrade() -> None:
    # --- Contrato: percentual de retenção padrão ---
    _add_column("contratos", sa.Column("percentual_retencao", sa.Numeric(precision=5, scale=2), nullable=True))

    # --- Enum de origem da medição ---
    origem_medicao_enum.create(op.get_bind(), checkfirst=True)

    # --- Medição: cabeçalho do boletim ---
    _add_column("medicoes", sa.Column("contrato_id", sa.UUID(), nullable=True))
    _add_column("medicoes", sa.Column("autor_id", sa.UUID(), nullable=True))
    _add_column("medicoes", sa.Column("origem", origem_medicao_enum, nullable=False, server_default="EMPRESA"))
    _add_column("medicoes", sa.Column("data_inicio_periodo", sa.Date(), nullable=True))
    _add_column("medicoes", sa.Column("data_fim_periodo", sa.Date(), nullable=True))
    _add_column("medicoes", sa.Column("percentual_retencao", sa.Numeric(precision=5, scale=2), nullable=False, server_default="0"))
    _add_column("medicoes", sa.Column("valor_faturamento_direto", sa.Numeric(precision=15, scale=2), nullable=False, server_default="0"))

    # Medições de origem FISCAL podem não ter empresa usuária vinculada.
    op.alter_column("medicoes", "empresa_usuario_id", existing_type=sa.UUID(), nullable=True)

    existing_fks = {fk["name"] for fk in _inspector().get_foreign_keys("medicoes")}
    if "fk_medicoes_contrato_id" not in existing_fks:
        op.create_foreign_key("fk_medicoes_contrato_id", "medicoes", "contratos", ["contrato_id"], ["id"])
    if "fk_medicoes_autor_id" not in existing_fks:
        op.create_foreign_key("fk_medicoes_autor_id", "medicoes", "usuarios", ["autor_id"], ["id"])

    # --- Itens do boletim (1 por evento) ---
    if not _has_table("medicao_itens"):
        op.create_table(
            "medicao_itens",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("medicao_id", sa.UUID(), nullable=False),
            sa.Column("evento_id", sa.UUID(), nullable=False),
            sa.Column("quantidade_periodo", sa.Numeric(precision=12, scale=4), nullable=False, server_default="0"),
            sa.Column("valor_unitario", sa.Numeric(precision=12, scale=4), nullable=False, server_default="0"),
            sa.Column("desconto_vaos", sa.Numeric(precision=12, scale=4), nullable=False, server_default="0"),
            sa.Column("observacao", sa.Text(), nullable=True),
            sa.ForeignKeyConstraint(["medicao_id"], ["medicoes.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["evento_id"], ["eventos.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    # --- Fotos invioláveis da medição ---
    if not _has_table("fotos_medicao"):
        op.create_table(
            "fotos_medicao",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("medicao_id", sa.UUID(), nullable=False),
            sa.Column("medicao_item_id", sa.UUID(), nullable=True),
            sa.Column("enviado_por_id", sa.UUID(), nullable=True),
            sa.Column("url_storage", sa.String(length=500), nullable=True),
            sa.Column("filename", sa.String(length=200), nullable=True),
            sa.Column("coordenadas", ga.Geometry(geometry_type="POINT", srid=4326, spatial_index=False), nullable=True),
            sa.Column("hash_sha256", sa.String(length=64), nullable=True),
            sa.Column("carimbo_servidor", sa.DateTime(timezone=True), nullable=True),
            sa.Column("exif_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column("origem_camera", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("criado_em", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["medicao_id"], ["medicoes.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["medicao_item_id"], ["medicao_itens.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["enviado_por_id"], ["usuarios.id"]),
            sa.PrimaryKeyConstraint("id"),
        )


def downgrade() -> None:
    op.drop_table("fotos_medicao")
    op.drop_table("medicao_itens")

    op.drop_constraint("fk_medicoes_autor_id", "medicoes", type_="foreignkey")
    op.drop_constraint("fk_medicoes_contrato_id", "medicoes", type_="foreignkey")
    op.alter_column("medicoes", "empresa_usuario_id", existing_type=sa.UUID(), nullable=False)
    op.drop_column("medicoes", "valor_faturamento_direto")
    op.drop_column("medicoes", "percentual_retencao")
    op.drop_column("medicoes", "data_fim_periodo")
    op.drop_column("medicoes", "data_inicio_periodo")
    op.drop_column("medicoes", "origem")
    op.drop_column("medicoes", "autor_id")
    op.drop_column("medicoes", "contrato_id")

    origem_medicao_enum.drop(op.get_bind(), checkfirst=True)

    op.drop_column("contratos", "percentual_retencao")
