"""normalizacao cadastro + campos de acompanhamento

Cria as tabelas de domínio `empresas` e `orgaos`, o enum `situacao_obra_enum`
e adiciona os campos de acompanhamento (financeiro, prazos, situação e textos
brutos) a `contratos` e `obras`.

Escrita de forma IDEMPOTENTE (guards via inspector / pg_type) porque o
`Base.metadata.create_all` roda no startup com hot-reload e pode ter criado
antecipadamente as tabelas novas `empresas`/`orgaos`.

Revision ID: b2f3a1c9d4e7
Revises: ff6285b72f48
Create Date: 2026-06-18
"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b2f3a1c9d4e7"
down_revision: str | None = "ff6285b72f48"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


SITUACAO_VALUES = (
    "A_INICIAR", "EM_ANDAMENTO", "PARALISADA", "INACABADA", "CONCLUIDA",
    "RESCINDIDA", "ARQUIVADA", "EXTINTA", "CEDIDA",
)


def _cols(insp, table):
    return {c["name"] for c in insp.get_columns(table)}


def upgrade() -> None:
    conn = op.get_bind()
    insp = inspect(conn)
    tables = set(insp.get_table_names())

    # --- Enum situacao_obra_enum (idempotente) ---
    op.execute(
        sa.text(
            "DO $$ BEGIN "
            "IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'situacao_obra_enum') THEN "
            "CREATE TYPE situacao_obra_enum AS ENUM "
            "('A_INICIAR','EM_ANDAMENTO','PARALISADA','INACABADA','CONCLUIDA',"
            "'RESCINDIDA','ARQUIVADA','EXTINTA','CEDIDA'); "
            "END IF; END $$;"
        )
    )
    situacao_enum = postgresql.ENUM(*SITUACAO_VALUES, name="situacao_obra_enum", create_type=False)

    # --- Tabela empresas ---
    if "empresas" not in tables:
        op.create_table(
            "empresas",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("razao_social", sa.String(length=300), nullable=False),
            sa.Column("cnpj", sa.String(length=18), nullable=True),
            sa.Column("usuario_id", sa.UUID(), nullable=True),
            sa.Column("criado_em", sa.DateTime(timezone=True), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("razao_social"),
            sa.UniqueConstraint("cnpj"),
        )
        op.create_index("ix_empresas_razao_social", "empresas", ["razao_social"])

    # --- Tabela orgaos ---
    if "orgaos" not in tables:
        op.create_table(
            "orgaos",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("sigla", sa.String(length=40), nullable=False),
            sa.Column("nome", sa.String(length=200), nullable=True),
            sa.Column("criado_em", sa.DateTime(timezone=True), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("sigla"),
        )
        op.create_index("ix_orgaos_sigla", "orgaos", ["sigla"])

    # --- Novas colunas em contratos ---
    ccols = _cols(insp, "contratos")
    contrato_adds = [
        ("empresa_ref_id", sa.Column("empresa_ref_id", sa.UUID(), nullable=True)),
        ("orgao_id", sa.Column("orgao_id", sa.UUID(), nullable=True)),
        ("fiscal_id", sa.Column("fiscal_id", sa.UUID(), nullable=True)),
        ("valor_aditivo", sa.Column("valor_aditivo", sa.Numeric(15, 2), nullable=True)),
        ("valor_reajustado", sa.Column("valor_reajustado", sa.Numeric(15, 2), nullable=True)),
        ("valor_final", sa.Column("valor_final", sa.Numeric(15, 2), nullable=True)),
        ("recurso_federal", sa.Column("recurso_federal", sa.Numeric(15, 2), nullable=True)),
        ("recurso_estadual", sa.Column("recurso_estadual", sa.Numeric(15, 2), nullable=True)),
        ("tipo_licitacao", sa.Column("tipo_licitacao", sa.String(100), nullable=True)),
        ("numero_licitacao", sa.Column("numero_licitacao", sa.String(100), nullable=True)),
        ("matricula_cei", sa.Column("matricula_cei", sa.String(50), nullable=True)),
    ]
    for name, col in contrato_adds:
        if name not in ccols:
            op.add_column("contratos", col)

    # Relaxar NOT NULL em contratos (dados históricos incompletos)
    op.alter_column("contratos", "empresa_id", existing_type=sa.UUID(), nullable=True)
    op.alter_column("contratos", "data_assinatura", existing_type=sa.Date(), nullable=True)
    op.alter_column("contratos", "data_vigencia", existing_type=sa.Date(), nullable=True)

    # FKs das novas colunas de contratos
    op.create_foreign_key("fk_contratos_empresa_ref", "contratos", "empresas", ["empresa_ref_id"], ["id"])
    op.create_foreign_key("fk_contratos_orgao", "contratos", "orgaos", ["orgao_id"], ["id"])
    op.create_foreign_key("fk_contratos_fiscal", "contratos", "usuarios", ["fiscal_id"], ["id"])

    # --- Novas colunas em obras ---
    ocols = _cols(insp, "obras")
    if "situacao" not in ocols:
        op.add_column("obras", sa.Column("situacao", situacao_enum, nullable=True))
    obra_adds = [
        ("situacao_origem", sa.Column("situacao_origem", sa.String(100), nullable=True)),
        ("ano_referencia", sa.Column("ano_referencia", sa.Integer(), nullable=True)),
        ("prazo_inicial_dias", sa.Column("prazo_inicial_dias", sa.Integer(), nullable=True)),
        ("vigencia_inicio", sa.Column("vigencia_inicio", sa.Date(), nullable=True)),
        ("vigencia_dias", sa.Column("vigencia_dias", sa.Integer(), nullable=True)),
        ("vigencia_fim", sa.Column("vigencia_fim", sa.Date(), nullable=True)),
        ("execucao_inicio", sa.Column("execucao_inicio", sa.Date(), nullable=True)),
        ("execucao_dias", sa.Column("execucao_dias", sa.Integer(), nullable=True)),
        ("execucao_fim", sa.Column("execucao_fim", sa.Date(), nullable=True)),
        ("valor_medido", sa.Column("valor_medido", sa.Numeric(15, 2), nullable=True)),
        ("saldo_a_medir", sa.Column("saldo_a_medir", sa.Numeric(15, 2), nullable=True)),
        ("matricula_cei", sa.Column("matricula_cei", sa.String(50), nullable=True)),
        ("historico", sa.Column("historico", sa.Text(), nullable=True)),
        ("importante", sa.Column("importante", sa.Text(), nullable=True)),
        ("observacoes", sa.Column("observacoes", sa.Text(), nullable=True)),
    ]
    for name, col in obra_adds:
        if name not in ocols:
            op.add_column("obras", col)


def downgrade() -> None:
    op.drop_constraint("fk_contratos_fiscal", "contratos", type_="foreignkey")
    op.drop_constraint("fk_contratos_orgao", "contratos", type_="foreignkey")
    op.drop_constraint("fk_contratos_empresa_ref", "contratos", type_="foreignkey")

    for col in [
        "observacoes", "importante", "historico", "matricula_cei", "saldo_a_medir",
        "valor_medido", "execucao_fim", "execucao_dias", "execucao_inicio",
        "vigencia_fim", "vigencia_dias", "vigencia_inicio", "prazo_inicial_dias",
        "ano_referencia", "situacao_origem", "situacao",
    ]:
        op.drop_column("obras", col)

    for col in [
        "matricula_cei", "numero_licitacao", "tipo_licitacao", "recurso_estadual",
        "recurso_federal", "valor_final", "valor_reajustado", "valor_aditivo",
        "fiscal_id", "orgao_id", "empresa_ref_id",
    ]:
        op.drop_column("contratos", col)

    op.alter_column("contratos", "data_vigencia", existing_type=sa.Date(), nullable=False)
    op.alter_column("contratos", "data_assinatura", existing_type=sa.Date(), nullable=False)
    op.alter_column("contratos", "empresa_id", existing_type=sa.UUID(), nullable=False)

    op.drop_table("orgaos")
    op.drop_table("empresas")
    op.execute("DROP TYPE IF EXISTS situacao_obra_enum")
