"""
SIN-Obras — Router do Assistente de IA (RF21)

Analisa os Diários de Obra de um objeto e retorna alertas de risco gerados por IA.
"""
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import settings
from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.portal import DiarioObra
from app.models.usuario import Usuario
from app.services import ia as ia_service

router = APIRouter(prefix="/ia", tags=["Assistente de IA"])


def _diario_para_texto(d: DiarioObra) -> str:
    partes = [f"Data: {d.data_registro.isoformat()}"]
    if d.tempo_manha or d.tempo_tarde:
        partes.append(f"Clima: manhã {d.tempo_manha or '-'} / tarde {d.tempo_tarde or '-'}")
    if d.pluviometria_mm is not None:
        partes.append(f"Pluviometria: {d.pluviometria_mm} mm")
    if d.qtd_funcionarios:
        partes.append(f"Funcionários: {d.qtd_funcionarios}")
    if d.mao_de_obra:
        partes.append(f"Mão de obra: {d.mao_de_obra}")
    if d.equipamentos:
        partes.append(f"Equipamentos: {d.equipamentos}")
    if d.atividades_realizadas:
        partes.append(f"Atividades: {d.atividades_realizadas}")
    if d.ocorrencias:
        partes.append(f"Ocorrências: {d.ocorrencias}")
    if d.observacoes_fiscal:
        partes.append(f"Obs. fiscal: {d.observacoes_fiscal}")
    return " | ".join(partes)


@router.post("/objetos/{objeto_id}/analisar-diarios")
async def analisar_diarios(
    objeto_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N2)),
):
    """Analisa os Diários de Obra do objeto e retorna alertas de risco (RF21)."""
    diarios = (await db.execute(
        select(DiarioObra)
        .where(DiarioObra.objeto_id == objeto_id)
        .order_by(DiarioObra.data_registro.desc())
        .limit(60)
    )).scalars().all()

    textos = [_diario_para_texto(d) for d in diarios]
    alertas = await ia_service.analisar_diarios(textos)
    return {
        "habilitado": settings.IA_ENABLED and bool(settings.ANTHROPIC_API_KEY),
        "total_diarios": len(diarios),
        "alertas": alertas,
    }
