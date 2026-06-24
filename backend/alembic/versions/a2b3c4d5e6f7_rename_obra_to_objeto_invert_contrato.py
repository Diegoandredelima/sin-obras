"""rename obra->objeto, inverte hierarquia (Contrato 1—N Objeto) e cria itens

Revision ID: a2b3c4d5e6f7
Revises: b1d2c3e4f5a6
Create Date: 2026-06-24 10:00:00.000000

Reestrutura o domínio para o modelo documento-mãe → objeto → item:

  • CONTRATO passa a ser o documento-mãe (Contrato 1—N Objeto). O link canônico
    vive em `objetos.contrato_id` (antiga `obras.contrato_id`, já populada). A
    coluna legada `contratos.obra_id` é REMOVIDA.
  • A tabela `obras` é renomeada para `objetos`; os enums `*_obra_enum` viram
    `*_objeto_enum`; todas as FKs `obra_id` das tabelas-filhas viram `objeto_id`.
  • Nova tabela `itens` (Objeto 1—N Item) para as partes constitutivas.
  • A view `vw_relatorio_obras` é recriada como `vw_relatorio_objetos`.

Migração defensiva (idempotente): como `Base.metadata.create_all` roda no
startup e pode criar `objetos`/`itens` vazios antes desta migração, o upgrade
detecta o estado real via `sa.inspect` e só transforma quando ainda há a tabela
`obras` com os dados.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "a2b3c4d5e6f7"
down_revision: Union[str, None] = "b1d2c3e4f5a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Tabelas-filhas cuja FK `obra_id` deve virar `objeto_id`.
_CHILD_TABLES = [
    "metas",
    "diario_obra",
    "medicoes",
    "vistorias",
    "tarefas",
    "alertas",
    "art_rrt",
    "delegacoes_obras",
    "ordens_servico",
    "aditivos_prazo",
    "paralisacoes",
    "readequacoes",
    "termos_recebimento",
    "notificacoes_extrajudiciais",
    "portarias",
]


VIEW_OBJETOS = """
CREATE OR REPLACE VIEW vw_relatorio_objetos AS
SELECT
    o.id                                        AS objeto_id,
    o.titulo                                    AS titulo,
    o.municipio                                 AS municipio,
    o.status                                    AS status,
    o.situacao                                  AS situacao,
    o.situacao_origem                           AS situacao_origem,
    o.ano_referencia                            AS ano_referencia,
    o.saude                                     AS saude,
    o.percentual_executado                      AS percentual_executado,
    COALESCE(o.orgao, org.sigla)                AS orgao,
    o.valor_contrato                            AS valor_contrato,
    o.valor_medido                              AS valor_medido,
    o.saldo_a_medir                             AS saldo_a_medir,
    o.data_inicio                               AS data_inicio,
    o.data_fim_prevista                         AS data_fim_prevista,
    o.vigencia_inicio                           AS vigencia_inicio,
    o.vigencia_fim                              AS vigencia_fim,
    o.execucao_fim                              AS execucao_fim,
    c.id                                        AS contrato_id,
    c.numero_contrato                           AS contrato_numero,
    c.numero_processo                           AS numero_processo,
    c.valor_global                              AS valor_global,
    c.valor_final                               AS valor_final,
    c.fiscal_nome                               AS fiscal_nome,
    c.gestor_nome                               AS gestor_nome,
    emp.razao_social                            AS empresa_razao_social,
    emp.cnpj                                    AS empresa_cnpj,
    (o.vigencia_fim - CURRENT_DATE)             AS dias_restantes_vigencia,
    c.data_assinatura                           AS data_assinatura,
    COALESCE(
        o.vigencia_inicio,
        o.data_inicio,
        o.execucao_inicio,
        c.data_assinatura
    )                                           AS data_ref
FROM objetos o
LEFT JOIN contratos c   ON o.contrato_id = c.id
LEFT JOIN empresas  emp ON c.empresa_ref_id = emp.id
LEFT JOIN orgaos    org ON c.orgao_id = org.id
WHERE o.ativo = TRUE;
"""

VIEW_OBRAS = """
CREATE OR REPLACE VIEW vw_relatorio_obras AS
SELECT
    o.id AS obra_id, o.titulo AS titulo, o.municipio AS municipio,
    o.status AS status, o.situacao AS situacao, o.situacao_origem AS situacao_origem,
    o.ano_referencia AS ano_referencia, o.saude AS saude,
    o.percentual_executado AS percentual_executado,
    COALESCE(o.orgao, org.sigla) AS orgao,
    o.valor_contrato AS valor_contrato, o.valor_medido AS valor_medido,
    o.saldo_a_medir AS saldo_a_medir, o.data_inicio AS data_inicio,
    o.data_fim_prevista AS data_fim_prevista, o.vigencia_inicio AS vigencia_inicio,
    o.vigencia_fim AS vigencia_fim, o.execucao_fim AS execucao_fim,
    c.id AS contrato_id, c.numero_contrato AS contrato_numero,
    c.numero_processo AS numero_processo, c.valor_global AS valor_global,
    c.valor_final AS valor_final, c.fiscal_nome AS fiscal_nome,
    c.gestor_nome AS gestor_nome, emp.razao_social AS empresa_razao_social,
    emp.cnpj AS empresa_cnpj, (o.vigencia_fim - CURRENT_DATE) AS dias_restantes_vigencia,
    c.data_assinatura AS data_assinatura,
    COALESCE(o.vigencia_inicio, o.data_inicio, o.execucao_inicio, c.data_assinatura) AS data_ref
FROM obras o
LEFT JOIN contratos c   ON o.contrato_id = c.id
LEFT JOIN empresas  emp ON c.empresa_ref_id = emp.id
LEFT JOIN orgaos    org ON c.orgao_id = org.id
WHERE o.ativo = TRUE;
"""


def _migrate_enum(table: str, column: str, old: str, new: str) -> None:
    """Garante que `table.column` use o enum `new`, cobrindo o caso em que o
    `create_all` do startup já criou o enum `new` antes da migração rodar.

    - Só o `old` existe        → renomeia o tipo (`ALTER TYPE ... RENAME TO`).
    - `old` e `new` existem     → converte a coluna para `new` e dropa o `old`
                                  (a coluna ainda apontava para o tipo antigo).
    - Só o `new` existe         → nada a fazer.

    Requer que views dependentes da coluna já tenham sido removidas.
    """
    op.execute(
        f"""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = '{old}') THEN
                IF EXISTS (SELECT 1 FROM pg_type WHERE typname = '{new}') THEN
                    EXECUTE 'ALTER TABLE {table} ALTER COLUMN {column} DROP DEFAULT';
                    EXECUTE 'ALTER TABLE {table} ALTER COLUMN {column} TYPE {new} USING {column}::text::{new}';
                    EXECUTE 'DROP TYPE {old}';
                ELSE
                    EXECUTE 'ALTER TYPE {old} RENAME TO {new}';
                END IF;
            END IF;
        END$$;
        """
    )


def _create_itens() -> None:
    op.create_table(
        "itens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "objeto_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("objetos.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("descricao", sa.String(length=500), nullable=False),
        sa.Column("unidade", sa.String(length=20), nullable=True),
        sa.Column("quantidade", sa.Numeric(12, 4), nullable=True),
        sa.Column("valor_unitario", sa.Numeric(12, 4), nullable=True),
        sa.Column("ordem", sa.Integer(), nullable=True),
        sa.Column("criado_em", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_itens_objeto_id", "itens", ["objeto_id"])


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    tables = set(insp.get_table_names())

    # Schema novo já em vigor (DB criado por create_all): nada a transformar.
    if "obras" not in tables:
        if "itens" not in tables:
            _create_itens()
        return

    # create_all pode ter criado 'objetos'/'itens' vazios antes desta migração;
    # os dados reais vivem em 'obras', então liberamos o caminho do RENAME.
    op.execute("DROP TABLE IF EXISTS itens CASCADE")
    op.execute("DROP TABLE IF EXISTS objetos CASCADE")

    # 1. View antiga depende de obras.* → removê-la antes de renomear/alterar enums.
    op.execute("DROP VIEW IF EXISTS vw_relatorio_obras")

    # 2. Inversão: remove o link legado contratos.obra_id (Contrato vira o pai).
    op.execute("ALTER TABLE contratos DROP CONSTRAINT IF EXISTS fk_contratos_obra_id")
    op.execute("ALTER TABLE contratos DROP COLUMN IF EXISTS obra_id")

    # 3. Renomeia a tabela principal obras → objetos.
    op.rename_table("obras", "objetos")
    op.create_index("ix_objetos_contrato_id", "objetos", ["contrato_id"])

    # 4. Migra os enums das colunas de `objetos` (cobre o caso de o create_all já
    #    ter criado os enums *_objeto_enum antes desta migração).
    _migrate_enum("objetos", "status", "status_obra_enum", "status_objeto_enum")
    _migrate_enum("objetos", "situacao", "situacao_obra_enum", "situacao_objeto_enum")
    _migrate_enum("objetos", "saude", "saude_obra_enum", "saude_objeto_enum")

    # 5. Renomeia obra_id → objeto_id nas tabelas-filhas (somente onde existir).
    for tbl in _CHILD_TABLES:
        if tbl not in tables:
            continue
        cols = {c["name"] for c in insp.get_columns(tbl)}
        if "obra_id" in cols and "objeto_id" not in cols:
            op.alter_column(tbl, "obra_id", new_column_name="objeto_id")

    # 6. Cria a tabela de itens.
    _create_itens()

    # 7. Recria a view consolidada como vw_relatorio_objetos.
    op.execute(VIEW_OBJETOS)


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    tables = set(insp.get_table_names())

    if "objetos" not in tables:
        return

    op.execute("DROP VIEW IF EXISTS vw_relatorio_objetos")
    op.execute("DROP TABLE IF EXISTS itens CASCADE")

    op.drop_index("ix_objetos_contrato_id", table_name="objetos")
    op.rename_table("objetos", "obras")

    _migrate_enum("obras", "status", "status_objeto_enum", "status_obra_enum")
    _migrate_enum("obras", "situacao", "situacao_objeto_enum", "situacao_obra_enum")
    _migrate_enum("obras", "saude", "saude_objeto_enum", "saude_obra_enum")

    for tbl in _CHILD_TABLES:
        if tbl not in tables:
            continue
        cols = {c["name"] for c in insp.get_columns(tbl)}
        if "objeto_id" in cols and "obra_id" not in cols:
            op.alter_column(tbl, "objeto_id", new_column_name="obra_id")

    # Recria a coluna legada contratos.obra_id (sem repopular — link invertido).
    op.add_column(
        "contratos",
        sa.Column("obra_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_contratos_obra_id", "contratos", "obras", ["obra_id"], ["id"]
    )

    op.execute(VIEW_OBRAS)
