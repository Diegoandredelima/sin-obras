"""
SIN-Obras — Serviço de Delegação de Obras

Gerencia a atribuição de fiscais e apoios a obras pelo Chefe de Setor.
"""
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.delegacao import DelegacaoObra


async def list_delegacoes(
    db: AsyncSession,
    obra_id: UUID | None = None,
    usuario_id: UUID | None = None,
) -> list[DelegacaoObra]:
    query = select(DelegacaoObra)
    if obra_id:
        query = query.where(DelegacaoObra.obra_id == obra_id)
    if usuario_id:
        query = query.where(DelegacaoObra.usuario_id == usuario_id)
    query = query.order_by(DelegacaoObra.criado_em.desc())
    result = await db.execute(query)
    return result.scalars().all()


async def create_delegacao(
    db: AsyncSession,
    delegado_por_id: UUID,
    obra_id: UUID,
    usuario_id: UUID,
    funcao: str,
    data_inicio: str,
    data_fim: str | None = None,
    observacao: str | None = None,
) -> DelegacaoObra:
    # Desativar delegações anteriores do mesmo usuário para a mesma obra/função
    existing = await db.execute(
        select(DelegacaoObra).where(
            DelegacaoObra.obra_id == obra_id,
            DelegacaoObra.usuario_id == usuario_id,
            DelegacaoObra.funcao == funcao,
            DelegacaoObra.ativo == True,
        )
    )
    for d in existing.scalars().all():
        d.ativo = False

    db_obj = DelegacaoObra(
        obra_id=obra_id,
        usuario_id=usuario_id,
        delegado_por_id=delegado_por_id,
        funcao=funcao,
        data_inicio=data_inicio,
        data_fim=data_fim,
        observacao=observacao,
    )
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


async def revogar_delegacao(db: AsyncSession, delegacao_id: UUID) -> DelegacaoObra:
    result = await db.execute(
        select(DelegacaoObra).where(DelegacaoObra.id == delegacao_id)
    )
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delegação não encontrada.")
    obj.ativo = False
    await db.flush()
    await db.refresh(obj)
    return obj
