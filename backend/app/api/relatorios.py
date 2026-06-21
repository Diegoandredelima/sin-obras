"""
SIN-Obras — Router de Relatórios
"""

from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.cadastro import Empresa
from app.models.obra import Contrato, Obra
from app.models.usuario import Usuario
from app.schemas.relatorio import (
    RelatorioObraRow,
    RelatorioResumo,
    ResumoPorOrgao,
    ResumoPorStatus,
)
from app.services import export_relatorio as export_svc
from app.services.obra import scope_obras_por_usuario

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

    obras_no_escopo = scope_obras_por_usuario(
        select(Obra).where(Obra.ativo == True), current_user
    ).subquery()
    total_obras = await db.scalar(select(func.count()).select_from(obras_no_escopo))
    total_contratos = await db.scalar(select(func.count(Contrato.id)))
    total_empresas = await db.scalar(select(func.count(Empresa.id)))
    valor_total = await db.scalar(
        select(func.coalesce(func.sum(Contrato.valor_global), 0))
    )

    # Obras por status
    status_rows = await db.execute(
        scope_obras_por_usuario(
            select(Obra.status, func.count(Obra.id)).where(
                Obra.ativo == True, Obra.status != None
            ),
            current_user,
        ).group_by(Obra.status)
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
        scope_obras_por_usuario(
            select(
                Obra.orgao,
                func.count(Obra.id),
                func.coalesce(func.sum(Contrato.valor_global), 0),
            )
            .join(Contrato, Obra.contrato_id == Contrato.id, isouter=True)
            .where(Obra.ativo == True),
            current_user,
        )
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


@router.get("/obras", response_model=list[RelatorioObraRow])
async def relatorio_obras(
    search: str | None = Query(None, description="Busca por título, município, empresa ou nº de contrato"),
    situacao: str | None = Query(None),
    status: str | None = Query(None),
    municipio: str | None = Query(None),
    orgao: str | None = Query(None),
    empresa: str | None = Query(None),
    saude: str | None = Query(None),
    valor_min: Decimal | None = Query(None),
    valor_max: Decimal | None = Query(None),
    ano: int | None = Query(None, description="Filtra por ano da data de referência"),
    periodo: str | None = Query(
        None,
        regex="^(T[1-4]|S[1-2])$",
        description="Trimestre (T1..T4) ou semestre (S1..S2) da data de referência",
    ),
    limit: int = Query(500, le=2000),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL)),
):
    """Linhas denormalizadas (view `vw_relatorio_obras`) com filtros combináveis.

    Alimenta o construtor de relatórios e os templates de impressão. Retorna a
    lista completa (até `limit`) — não paginado, pois é usado para gerar o
    documento por inteiro.
    """
    conditions: list[str] = []
    params: dict = {"limit": limit}

    if search:
        conditions.append(
            "(titulo ILIKE :search OR municipio ILIKE :search "
            "OR empresa_razao_social ILIKE :search OR contrato_numero ILIKE :search)"
        )
        params["search"] = f"%{search}%"
    if situacao:
        conditions.append("situacao = :situacao")
        params["situacao"] = situacao
    if status:
        conditions.append("status = :status")
        params["status"] = status
    if municipio:
        conditions.append("municipio ILIKE :municipio")
        params["municipio"] = f"%{municipio}%"
    if orgao:
        conditions.append("orgao ILIKE :orgao")
        params["orgao"] = f"%{orgao}%"
    if empresa:
        conditions.append("empresa_razao_social ILIKE :empresa")
        params["empresa"] = f"%{empresa}%"
    if saude:
        conditions.append("saude = :saude")
        params["saude"] = saude
    if valor_min is not None:
        conditions.append("COALESCE(valor_final, valor_global, valor_contrato) >= :valor_min")
        params["valor_min"] = valor_min
    if valor_max is not None:
        conditions.append("COALESCE(valor_final, valor_global, valor_contrato) <= :valor_max")
        params["valor_max"] = valor_max
    if ano is not None:
        conditions.append("EXTRACT(YEAR FROM data_ref) = :ano")
        params["ano"] = ano
    if periodo:
        if periodo.startswith("T"):
            conditions.append("EXTRACT(QUARTER FROM data_ref) = :trimestre")
            params["trimestre"] = int(periodo[1])
        else:  # semestre S1/S2 → meses 1-6 ou 7-12
            sem = int(periodo[1])
            conditions.append("EXTRACT(MONTH FROM data_ref) BETWEEN :mes_ini AND :mes_fim")
            params["mes_ini"] = 1 if sem == 1 else 7
            params["mes_fim"] = 6 if sem == 1 else 12

    where = (" WHERE " + " AND ".join(conditions)) if conditions else ""
    sql = text(
        f"SELECT * FROM vw_relatorio_obras{where} "
        "ORDER BY titulo ASC LIMIT :limit"
    )
    result = await db.execute(sql, params)
    return [RelatorioObraRow.model_validate(row) for row in result.mappings()]


@router.get("/anos")
async def anos_disponiveis(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL)),
):
    """Retorna o intervalo de anos disponíveis na view vw_relatorio_obras."""
    result = await db.execute(text(
        "SELECT MIN(EXTRACT(YEAR FROM data_ref))::int, "
        "MAX(EXTRACT(YEAR FROM data_ref))::int "
        "FROM vw_relatorio_obras WHERE data_ref IS NOT NULL"
    ))
    row = result.one_or_none()
    ano_atual = date.today().year
    return {
        "ano_min": row[0] if row and row[0] else ano_atual,
        "ano_max": row[1] if row and row[1] else ano_atual,
    }


@router.get("/empresas-lista")
async def empresas_lista(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL)),
):
    """Lista de empresas cadastradas para o dropdown de filtro."""
    result = await db.execute(
        select(Empresa.id, Empresa.razao_social).order_by(Empresa.razao_social)
    )
    return [{"id": str(r[0]), "razao_social": r[1]} for r in result]


@router.get("/export-obras")
async def export_obras_filtradas(
    search: str | None = Query(None),
    situacao: str | None = Query(None),
    status: str | None = Query(None),
    municipio: str | None = Query(None),
    orgao: str | None = Query(None),
    empresa: str | None = Query(None),
    saude: str | None = Query(None),
    valor_min: Decimal | None = Query(None),
    valor_max: Decimal | None = Query(None),
    ano: int | None = Query(None),
    periodo: str | None = Query(None, regex="^(T[1-4]|S[1-2])$"),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL)),
):
    """Exporta em XLSX a lista de obras com os mesmos filtros de /obras."""
    conditions: list[str] = []
    params: dict = {"limit": 2000}

    if search:
        conditions.append(
            "(titulo ILIKE :search OR municipio ILIKE :search "
            "OR empresa_razao_social ILIKE :search OR contrato_numero ILIKE :search)"
        )
        params["search"] = f"%{search}%"
    if situacao:
        conditions.append("situacao = :situacao")
        params["situacao"] = situacao
    if status:
        conditions.append("status = :status")
        params["status"] = status
    if municipio:
        conditions.append("municipio ILIKE :municipio")
        params["municipio"] = f"%{municipio}%"
    if orgao:
        conditions.append("orgao ILIKE :orgao")
        params["orgao"] = f"%{orgao}%"
    if empresa:
        conditions.append("empresa_razao_social ILIKE :empresa")
        params["empresa"] = f"%{empresa}%"
    if saude:
        conditions.append("saude = :saude")
        params["saude"] = saude
    if valor_min is not None:
        conditions.append("COALESCE(valor_final, valor_global, valor_contrato) >= :valor_min")
        params["valor_min"] = valor_min
    if valor_max is not None:
        conditions.append("COALESCE(valor_final, valor_global, valor_contrato) <= :valor_max")
        params["valor_max"] = valor_max
    if ano is not None:
        conditions.append("EXTRACT(YEAR FROM data_ref) = :ano")
        params["ano"] = ano
    if periodo:
        if periodo.startswith("T"):
            conditions.append("EXTRACT(QUARTER FROM data_ref) = :trimestre")
            params["trimestre"] = int(periodo[1])
        else:
            sem = int(periodo[1])
            conditions.append("EXTRACT(MONTH FROM data_ref) BETWEEN :mes_ini AND :mes_fim")
            params["mes_ini"] = 1 if sem == 1 else 7
            params["mes_fim"] = 6 if sem == 1 else 12

    where = (" WHERE " + " AND ".join(conditions)) if conditions else ""
    sql = text(f"SELECT * FROM vw_relatorio_obras{where} ORDER BY titulo ASC LIMIT :limit")
    result = await db.execute(sql, params)
    obras = [RelatorioObraRow.model_validate(row) for row in result.mappings()]

    buf = export_svc.gerar_xlsx_obras(obras)
    filename = f"obras_{date.today().isoformat()}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export")
async def export_relatorio(
    formato: str = Query("xlsx", regex="^(xlsx|pdf)$"),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL)),
):
    """Exporta o relatório-resumo em XLSX ou PDF."""
    data = await export_svc._fetch_data(db)

    if formato == "xlsx":
        buf = export_svc.gerar_xlsx(data)
        filename = f"relatorio_obras_{data['total_obras']}_obras.xlsx"
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else:
        buf = export_svc.gerar_pdf(data)
        filename = f"relatorio_obras_{data['total_obras']}_obras.pdf"
        media_type = "application/pdf"

    return StreamingResponse(
        buf,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
