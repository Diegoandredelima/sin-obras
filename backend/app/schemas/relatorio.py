"""
SIN-Obras — Schemas de Relatório
"""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class ResumoPorStatus(BaseModel):
    status: str
    label: str
    total: int


class ResumoPorOrgao(BaseModel):
    orgao: str
    total_objetos: int
    valor_total: float


class RelatorioResumo(BaseModel):
    total_objetos: int
    total_contratos: int
    total_empresas: int
    objetos_por_status: list[ResumoPorStatus]
    objetos_por_orgao: list[ResumoPorOrgao]
    valor_total_contratos: float


class ProgressoMetaRow(BaseModel):
    """Avanço planejado × realizado de uma Meta do cronograma."""

    meta_id: UUID
    descricao: str
    ordem: int
    valor_planejado: Decimal
    valor_realizado: Decimal
    percentual: Decimal


class RelatorioCronograma(BaseModel):
    """Progresso físico-financeiro por meta de um objeto."""

    objeto_id: UUID
    objeto_titulo: str
    metas: list[ProgressoMetaRow]
    valor_planejado_total: Decimal
    valor_realizado_total: Decimal
    percentual_total: Decimal


class FotoMedicaoRow(BaseModel):
    """Uma foto inviolável vinculada (opcionalmente) a um item da medição."""

    id: UUID
    url_storage: str | None = None
    filename: str | None = None
    carimbo_servidor: datetime | None = None
    item_descricao: str | None = None


class MedicaoFotosGroup(BaseModel):
    medicao_id: UUID
    numero_medicao: int
    data_fim_periodo: date | None = None
    fotos: list[FotoMedicaoRow]


class RelatorioFotos(BaseModel):
    """Compilação das fotos de todas as medições de um objeto."""

    objeto_id: UUID
    objeto_titulo: str
    medicoes: list[MedicaoFotosGroup]
    total_fotos: int


class RelatorioObjetoRow(BaseModel):
    """Linha denormalizada da view `vw_relatorio_objetos` (objeto + contrato +
    empresa + órgão) usada no construtor de relatórios e na impressão."""

    objeto_id: UUID
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
