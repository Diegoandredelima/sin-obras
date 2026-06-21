"""create_vw_relatorio_obras

Revision ID: a1b2c3d4e5f6
Revises: 4e381841eac9
Create Date: 2026-06-21 13:00:00.000000

Cria a view denormalizada `vw_relatorio_obras`, que consolida em uma única
linha os dados de obra + contrato + empresa + órgão. Facilita a montagem de
relatórios e análises sem múltiplos JOINs repetidos no código de aplicação.
"""
from typing import Sequence, Union

from alembic import op


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "4e381841eac9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


CREATE_VIEW = """
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
    (o.vigencia_fim - CURRENT_DATE)             AS dias_restantes_vigencia
FROM obras o
LEFT JOIN contratos c   ON o.contrato_id = c.id
LEFT JOIN empresas  emp ON c.empresa_ref_id = emp.id
LEFT JOIN orgaos    org ON c.orgao_id = org.id
WHERE o.ativo = TRUE;
"""

DROP_VIEW = "DROP VIEW IF EXISTS vw_relatorio_obras;"


def upgrade() -> None:
    op.execute(CREATE_VIEW)


def downgrade() -> None:
    op.execute(DROP_VIEW)
