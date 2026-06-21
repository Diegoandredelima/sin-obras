"""
SIN-Obras — Schemas de Relatório
"""

from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class ResumoPorStatus(BaseModel):
    status: str
    label: str
    total: int


class ResumoPorOrgao(BaseModel):
    orgao: str
    total_obras: int
    valor_total: float


class RelatorioResumo(BaseModel):
    total_obras: int
    total_contratos: int
    total_empresas: int
    obras_por_status: list[ResumoPorStatus]
    obras_por_orgao: list[ResumoPorOrgao]
    valor_total_contratos: float


class RelatorioObraRow(BaseModel):
    """Linha denormalizada da view `vw_relatorio_obras` (obra + contrato +
    empresa + órgão) usada no construtor de relatórios e na impressão."""

    obra_id: UUID
    titulo: str
    municipio: str | None = None
    status: str | None = None
    situacao: str | None = None
    situacao_origem: str | None = None
    ano_referencia: int | None = None
    saude: str | None = None
    percentual_executado: Decimal | None = None
    orgao: str | None = None
    valor_contrato: Decimal | None = None
    valor_medido: Decimal | None = None
    saldo_a_medir: Decimal | None = None
    data_inicio: date | None = None
    data_fim_prevista: date | None = None
    vigencia_inicio: date | None = None
    vigencia_fim: date | None = None
    execucao_fim: date | None = None
    contrato_id: UUID | None = None
    contrato_numero: str | None = None
    numero_processo: str | None = None
    valor_global: Decimal | None = None
    valor_final: Decimal | None = None
    fiscal_nome: str | None = None
    gestor_nome: str | None = None
    empresa_razao_social: str | None = None
    empresa_cnpj: str | None = None
    dias_restantes_vigencia: int | None = None
    data_assinatura: date | None = None
    data_ref: date | None = None

    model_config = {"from_attributes": True}
