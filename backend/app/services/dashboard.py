"""
SIN-Obras — Serviço do Dashboard Executivo (RF30)

Agrega indicadores do portfólio completo de obras para a visão do Secretário
(read-only): volume de investimento, distribuição por situação/saúde, municípios
e órgãos mais impactados e tendência global de execução.
"""
from decimal import Decimal

from geoalchemy2.functions import ST_X, ST_Y
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.objeto import Objeto, SaudeObjeto, StatusObjeto


def _f(v) -> float:
    return float(v or 0)


async def get_mapa_calor(db: AsyncSession) -> dict:
    """RF20 — pontos georreferenciados (lat/long do PostGIS) + agregação por município.

    Retorna apenas objetos com coordenadas cadastradas. Objetos sem `localizacao`
    dependem de geocodificação (passo seguinte) e não aparecem no mapa.
    """
    rows = await db.execute(
        select(
            Objeto.id, Objeto.titulo, Objeto.municipio, Objeto.saude, Objeto.status,
            Objeto.valor_contrato, ST_Y(Objeto.localizacao), ST_X(Objeto.localizacao),
        ).where(Objeto.ativo == True, Objeto.localizacao.isnot(None))  # noqa: E712
    )
    pontos = [
        {
            "id": str(r[0]), "titulo": r[1], "municipio": r[2],
            "saude": r[3] or SaudeObjeto.VERDE.value, "status": r[4],
            "valor": _f(r[5]), "latitude": r[6], "longitude": r[7],
        }
        for r in rows
    ]
    return {"pontos": pontos, "total": len(pontos)}


async def get_dashboard_executivo(db: AsyncSession) -> dict:
    ativos = Objeto.ativo == True  # noqa: E712

    total_objetos = await db.scalar(select(func.count(Objeto.id)).where(ativos))
    valor_investido = await db.scalar(
        select(func.coalesce(func.sum(Objeto.valor_contrato), 0)).where(ativos)
    )
    valor_medido = await db.scalar(
        select(func.coalesce(func.sum(Objeto.valor_medido), 0)).where(ativos)
    )
    em_execucao = await db.scalar(
        select(func.count(Objeto.id)).where(ativos, Objeto.status == StatusObjeto.EM_EXECUCAO)
    )

    pct_execucao = 0.0
    if valor_investido and Decimal(valor_investido) > 0:
        pct_execucao = round(_f(valor_medido) / _f(valor_investido) * 100, 2)

    # Por situação (com valor)
    sit_rows = await db.execute(
        select(
            Objeto.situacao,
            func.count(Objeto.id),
            func.coalesce(func.sum(Objeto.valor_contrato), 0),
        ).where(ativos).group_by(Objeto.situacao)
    )
    por_situacao = [
        {"situacao": r[0] or "SEM_SITUACAO", "total": r[1], "valor": _f(r[2])}
        for r in sit_rows
    ]

    # Por saúde (Verde/Amarelo/Vermelho)
    saude_rows = await db.execute(
        select(Objeto.saude, func.count(Objeto.id)).where(ativos).group_by(Objeto.saude)
    )
    por_saude = {(r[0] or SaudeObjeto.VERDE.value): r[1] for r in saude_rows}

    # Top municípios (por valor)
    mun_rows = await db.execute(
        select(
            Objeto.municipio,
            func.count(Objeto.id),
            func.coalesce(func.sum(Objeto.valor_contrato), 0),
        )
        .where(ativos, Objeto.municipio.isnot(None))
        .group_by(Objeto.municipio)
        .order_by(func.coalesce(func.sum(Objeto.valor_contrato), 0).desc())
        .limit(10)
    )
    top_municipios = [
        {"municipio": r[0], "total": r[1], "valor": _f(r[2])} for r in mun_rows
    ]

    # Top órgãos (por valor)
    org_rows = await db.execute(
        select(
            Objeto.orgao,
            func.count(Objeto.id),
            func.coalesce(func.sum(Objeto.valor_contrato), 0),
        )
        .where(ativos)
        .group_by(Objeto.orgao)
        .order_by(func.coalesce(func.sum(Objeto.valor_contrato), 0).desc())
        .limit(10)
    )
    top_orgaos = [
        {"orgao": r[0] or "Não informado", "total": r[1], "valor": _f(r[2])} for r in org_rows
    ]

    return {
        "total_objetos": total_objetos or 0,
        "em_execucao": em_execucao or 0,
        "valor_investido": _f(valor_investido),
        "valor_medido": _f(valor_medido),
        "pct_execucao_global": pct_execucao,
        "obras_criticas": por_saude.get(SaudeObjeto.VERMELHO.value, 0),
        "obras_atencao": por_saude.get(SaudeObjeto.AMARELO.value, 0),
        "por_situacao": por_situacao,
        "por_saude": por_saude,
        "top_municipios": top_municipios,
        "top_orgaos": top_orgaos,
    }
