"""
SIN-Obras — Schemas de Relatório
"""

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
