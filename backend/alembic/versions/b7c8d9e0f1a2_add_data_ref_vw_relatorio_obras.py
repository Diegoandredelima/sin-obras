"""add_data_ref_vw_relatorio_obras

Revision ID: b7c8d9e0f1a2
Revises: a1b2c3d4e5f6
Create Date: 2026-06-21 14:00:00.000000

Recria `vw_relatorio_obras` acrescentando colunas de data de referência
(`data_assinatura` do contrato e `data_ref` consolidada) para permitir
filtros por ano, trimestre e semestre nos relatórios.
"""
from typing import Sequence, Union

from alembic import op


revision: str = "b7c8d9e0f1a2"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Mantém todas as colunas anteriores na MESMA ordem e acrescenta as novas
# ao final (requisito do CREATE OR REPLACE VIEW no PostgreSQL).
VIEW_V2 = """
CREATE OR REPLACE VIEW vw_relatorio_obras AS
SELECT
    o.id                                        AS obra_id,
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
FROM obras o
LEFT JOIN contratos c   ON o.contrato_id = c.id
LEFT JOIN empresas  emp ON c.empresa_ref_id = emp.id
LEFT JOIN orgaos    org ON c.orgao_id = org.id
WHERE o.ativo = TRUE;
"""

# Volta para a versão original (sem data_assinatura / data_ref).
VIEW_V1 = """
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
    emp.cnpj AS empresa_cnpj, (o.vigencia_fim - CURRENT_DATE) AS dias_restantes_vigencia
FROM obras o
LEFT JOIN contratos c   ON o.contrato_id = c.id
LEFT JOIN empresas  emp ON c.empresa_ref_id = emp.id
LEFT JOIN orgaos    org ON c.orgao_id = org.id
WHERE o.ativo = TRUE;
"""


def upgrade() -> None:
    op.execute(VIEW_V2)


def downgrade() -> None:
    # CREATE OR REPLACE não remove colunas; é preciso recriar a view.
    op.execute("DROP VIEW IF EXISTS vw_relatorio_obras;")
    op.execute(VIEW_V1)
