"""
SIN-Obras — Relatório de progresso por meta (cronograma)

Agrega, por Meta do cronograma (Meta → Submeta → Evento), o valor planejado
(soma dos eventos) e o valor realizado (itens de medições APROVADAS cujo evento
pertence à meta), permitindo identificar metas em atraso.
"""

from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.objeto import Meta, Objeto
from app.models.portal import Medicao, MedicaoItem, StatusMedicao

_CENT = Decimal("0.01")


def _money(v: Decimal) -> Decimal:
    return Decimal(v).quantize(_CENT)


async def progresso_por_meta(db: AsyncSession, objeto_id: UUID) -> dict:
    objeto = await db.scalar(select(Objeto).where(Objeto.id == objeto_id))
    if not objeto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Objeto não encontrado.")

    metas = (
        await db.execute(select(Meta).where(Meta.objeto_id == objeto_id).order_by(Meta.ordem))
    ).scalars().all()

    # Mapa evento_id → meta_id e planejado por meta (submetas/eventos via selectin).
    evento_to_meta: dict[UUID, UUID] = {}
    planejado_por_meta: dict[UUID, Decimal] = {}
    for meta in metas:
        planejado = Decimal("0")
        for submeta in meta.submetas:
            for evento in submeta.eventos:
                evento_to_meta[evento.id] = meta.id
                planejado += evento.quantidade * evento.valor_unitario
        planejado_por_meta[meta.id] = planejado

    # Realizado = itens de medições APROVADAS, agrupados pela meta do evento.
    itens = (
        await db.execute(
            select(MedicaoItem)
            .join(Medicao, MedicaoItem.medicao_id == Medicao.id)
            .where(Medicao.objeto_id == objeto_id, Medicao.status == StatusMedicao.APROVADA)
        )
    ).scalars().all()

    realizado_por_meta: dict[UUID, Decimal] = {}
    for item in itens:
        meta_id = evento_to_meta.get(item.evento_id)
        if meta_id is None:
            continue
        realizado_por_meta[meta_id] = realizado_por_meta.get(meta_id, Decimal("0")) + item.valor_bruto_aprovado

    metas_out: list[dict] = []
    total_plan = Decimal("0")
    total_real = Decimal("0")
    for meta in metas:
        plan = _money(planejado_por_meta.get(meta.id, Decimal("0")))
        real = _money(realizado_por_meta.get(meta.id, Decimal("0")))
        pct = _money(real / plan * Decimal("100")) if plan > 0 else Decimal("0.00")
        total_plan += plan
        total_real += real
        metas_out.append({
            "meta_id": meta.id,
            "descricao": meta.descricao,
            "ordem": meta.ordem,
            "valor_planejado": plan,
            "valor_realizado": real,
            "percentual": pct,
        })

    total_plan = _money(total_plan)
    total_real = _money(total_real)
    pct_total = _money(total_real / total_plan * Decimal("100")) if total_plan > 0 else Decimal("0.00")

    return {
        "objeto_id": objeto.id,
        "objeto_titulo": objeto.titulo,
        "metas": metas_out,
        "valor_planejado_total": total_plan,
        "valor_realizado_total": total_real,
        "percentual_total": pct_total,
    }
