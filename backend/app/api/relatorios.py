"""
SIN-Obras — Router de Relatórios
"""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.cadastro import Empresa
from app.models.obra import Contrato, Obra
from app.models.usuario import Usuario
from app.schemas.relatorio import RelatorioResumo, ResumoPorOrgao, ResumoPorStatus

router = APIRouter(prefix="/relatorios", tags=["Relatórios"])

STATUS_LABELS: dict[str, str] = {
    "EM_EXECUCAO": "Em Execução",
    "PARALISADA": "Paralisada",
    "CONCLUIDA": "Concluída",
    "PLANEJADA": "Planejada",
}


@router.get("/resumo", response_model=RelatorioResumo)
async def resumo_relatorio(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL)),
):
    """Retorna dados agregados para a tela de relatórios."""

    total_obras = await db.scalar(select(func.count(Obra.id)).where(Obra.ativo == True))
    total_contratos = await db.scalar(select(func.count(Contrato.id)))
    total_empresas = await db.scalar(select(func.count(Empresa.id)))
    valor_total = await db.scalar(
        select(func.coalesce(func.sum(Contrato.valor_global), 0))
    )

    # Obras por status
    status_rows = await db.execute(
        select(Obra.status, func.count(Obra.id))
        .where(Obra.ativo == True, Obra.status != None)
        .group_by(Obra.status)
    )
    obras_por_status = [
        ResumoPorStatus(
            status=row[0],
            label=STATUS_LABELS.get(row[0], row[0]),
            total=row[1],
        )
        for row in status_rows
    ]

    # Obras por órgão (top 10)
    orgao_rows = await db.execute(
        select(
            Obra.orgao,
            func.count(Obra.id),
            func.coalesce(func.sum(Contrato.valor_global), 0),
        )
        .join(Contrato, Obra.contrato_id == Contrato.id, isouter=True)
        .where(Obra.ativo == True)
        .group_by(Obra.orgao)
        .order_by(func.count(Obra.id).desc())
        .limit(10)
    )
    obras_por_orgao = [
        ResumoPorOrgao(
            orgao=row[0] or "Não informado",
            total_obras=row[1],
            valor_total=float(row[2]),
        )
        for row in orgao_rows
    ]

    return RelatorioResumo(
        total_obras=total_obras or 0,
        total_contratos=total_contratos or 0,
        total_empresas=total_empresas or 0,
        obras_por_status=obras_por_status,
        obras_por_orgao=obras_por_orgao,
        valor_total_contratos=float(valor_total or 0),
    )
