"""
SIN-Obras — Relatório fotográfico por objeto

Compila as fotos invioláveis (RN03) de todas as medições de um objeto, agrupadas
por medição, com a descrição do item construtivo correspondente.
"""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.objeto import Objeto
from app.models.portal import Medicao


async def fotos_por_objeto(db: AsyncSession, objeto_id: UUID) -> dict:
    objeto = await db.scalar(select(Objeto).where(Objeto.id == objeto_id))
    if not objeto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Objeto não encontrado.")

    medicoes = (
        await db.execute(
            select(Medicao).where(Medicao.objeto_id == objeto_id).order_by(Medicao.numero_medicao)
        )
    ).scalars().all()

    grupos: list[dict] = []
    total = 0
    for medicao in medicoes:
        # Descrição do item (via evento) para rotular cada foto.
        item_descricao = {it.id: (it.evento.descricao if it.evento else None) for it in medicao.itens}
        fotos_out = [
            {
                "id": foto.id,
                "url_storage": foto.url_storage,
                "filename": foto.filename,
                "carimbo_servidor": foto.carimbo_servidor,
                "item_descricao": item_descricao.get(foto.medicao_item_id),
            }
            for foto in medicao.fotos
        ]
        if not fotos_out:
            continue
        total += len(fotos_out)
        grupos.append({
            "medicao_id": medicao.id,
            "numero_medicao": medicao.numero_medicao,
            "data_fim_periodo": medicao.data_fim_periodo,
            "fotos": fotos_out,
        })

    return {
        "objeto_id": objeto.id,
        "objeto_titulo": objeto.titulo,
        "medicoes": grupos,
        "total_fotos": total,
    }
