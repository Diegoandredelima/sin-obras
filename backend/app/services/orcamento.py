"""
SIN-Obras — Serviço do módulo de Orçamento (template / banco de dados técnico)

Cria orçamentos com EAP aninhada (Meta→Submeta→Evento→memória), gera o ID legível
(``ORC-AAAA-NNNN``) e copia a árvore para dentro de um Objeto na vinculação,
embutindo o BDI no preço unitário (Opção A — cópia congelada).
"""

from datetime import UTC, datetime
from decimal import ROUND_HALF_UP, Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.objeto import Evento, EventoMemoria, Meta, Objeto, Submeta
from app.models.orcamento import Orcamento, StatusOrcamento
from app.schemas.orcamento import (
    OrcamentoCreate,
    OrcamentoEventoCreate,
    OrcamentoMetaCreate,
    OrcamentoSubmetaCreate,
    OrcamentoUpdate,
)

QTD = Decimal("0.0001")


def _q4(value: Decimal) -> Decimal:
    return Decimal(value).quantize(QTD, rounding=ROUND_HALF_UP)


# ---------------------------------------------------------------------------
# Construção da EAP (a partir do schema aninhado)
# ---------------------------------------------------------------------------
def _build_memoria(linhas) -> list[EventoMemoria]:
    return [
        EventoMemoria(
            ordem=l.ordem if l.ordem is not None else i,
            descricao=l.descricao,
            comprimento=l.comprimento,
            largura=l.largura,
            altura=l.altura,
            percentual=l.percentual,
            n_repeticoes=l.n_repeticoes,
            quantidade=l.quantidade,
        )
        for i, l in enumerate(linhas or [])
    ]


def _build_evento(ev: OrcamentoEventoCreate) -> Evento:
    return Evento(
        codigo_referencia=ev.codigo_referencia,
        descricao=ev.descricao,
        unidade=ev.unidade,
        quantidade=ev.quantidade,
        valor_unitario=ev.valor_unitario,  # custo direto (sem BDI) no template
        criterio_medicao=ev.criterio_medicao,
        memoria=_build_memoria(ev.memoria),
    )


def _build_submeta(sub: OrcamentoSubmetaCreate) -> Submeta:
    return Submeta(
        descricao=sub.descricao,
        valor=sub.valor,
        percentual_previsto=sub.percentual_previsto,
        eventos=[_build_evento(e) for e in sub.eventos],
    )


def _build_meta(meta: OrcamentoMetaCreate) -> Meta:
    return Meta(
        descricao=meta.descricao,
        valor=meta.valor,
        ordem=meta.ordem,
        submetas=[_build_submeta(s) for s in meta.submetas],
    )


# ---------------------------------------------------------------------------
# CRUD do orçamento
# ---------------------------------------------------------------------------
async def _gerar_codigo(db: AsyncSession) -> str:
    """ID legível ORC-AAAA-NNNN (NNNN = sequência do ano da criação)."""
    ano = datetime.now(UTC).year
    prefix = f"ORC-{ano}-"
    result = await db.execute(
        select(func.count()).select_from(Orcamento).where(Orcamento.codigo.like(f"{prefix}%"))
    )
    seq = (result.scalar() or 0) + 1
    return f"{prefix}{seq:04d}"


async def create_orcamento(db: AsyncSession, obj_in: OrcamentoCreate, usuario_id: UUID | None = None) -> Orcamento:
    db_obj = Orcamento(
        codigo=await _gerar_codigo(db),
        titulo=obj_in.titulo,
        data_base=obj_in.data_base,
        bdi_percentual=obj_in.bdi_percentual,
        descricao=obj_in.descricao,
        criado_por_id=usuario_id,
        metas=[_build_meta(m) for m in obj_in.metas],
    )
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


async def get_orcamento(db: AsyncSession, orcamento_id: UUID) -> Orcamento:
    result = await db.execute(select(Orcamento).where(Orcamento.id == orcamento_id))
    orc = result.scalar_one_or_none()
    if not orc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orçamento não encontrado.")
    return orc


async def list_orcamentos(db: AsyncSession, q: str | None = None, limit: int = 100):
    stmt = select(Orcamento).order_by(Orcamento.criado_em.desc()).limit(limit)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Orcamento.codigo.ilike(like), Orcamento.titulo.ilike(like)))
    result = await db.execute(stmt)
    return result.scalars().all()


async def update_orcamento(db: AsyncSession, orcamento_id: UUID, obj_in: OrcamentoUpdate) -> Orcamento:
    db_obj = await get_orcamento(db, orcamento_id)
    data = obj_in.model_dump(exclude_unset=True)
    substituir_metas = "metas" in data
    data.pop("metas", None)
    for field, value in data.items():
        setattr(db_obj, field, value)
    if substituir_metas:
        db_obj.metas.clear()
        db_obj.metas.extend(_build_meta(m) for m in (obj_in.metas or []))
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


async def delete_orcamento(db: AsyncSession, orcamento_id: UUID) -> None:
    db_obj = await get_orcamento(db, orcamento_id)
    await db.delete(db_obj)
    await db.flush()


# ---------------------------------------------------------------------------
# Cópia template → objeto (vinculação, com BDI embutido)
# ---------------------------------------------------------------------------
async def copiar_orcamento_para_objeto(db: AsyncSession, orcamento_id: UUID, objeto_id: UUID) -> None:
    """Clona a EAP do orçamento para dentro do objeto (Opção A — cópia congelada).

    O BDI do orçamento é embutido no preço unitário de cada evento copiado:
    ``valor_unitario_final = custo_direto × (1 + BDI/100)`` — pois o boletim de
    medição multiplica a quantidade executada por este preço.
    """
    orc = await get_orcamento(db, orcamento_id)
    fator = Decimal(1) + (Decimal(orc.bdi_percentual or 0) / Decimal(100))

    for meta in orc.metas:
        nova_meta = Meta(objeto_id=objeto_id, descricao=meta.descricao, valor=meta.valor, ordem=meta.ordem)
        for sub in meta.submetas:
            nova_sub = Submeta(
                descricao=sub.descricao, valor=sub.valor, percentual_previsto=sub.percentual_previsto,
            )
            for ev in sub.eventos:
                novo_ev = Evento(
                    codigo_referencia=ev.codigo_referencia,
                    descricao=ev.descricao,
                    unidade=ev.unidade,
                    quantidade=ev.quantidade,
                    valor_unitario=_q4(Decimal(ev.valor_unitario) * fator),  # BDI embutido
                    criterio_medicao=ev.criterio_medicao,
                    memoria=[
                        EventoMemoria(
                            ordem=m.ordem, descricao=m.descricao, comprimento=m.comprimento,
                            largura=m.largura, altura=m.altura, percentual=m.percentual,
                            n_repeticoes=m.n_repeticoes, quantidade=m.quantidade,
                        )
                        for m in ev.memoria
                    ],
                )
                nova_sub.eventos.append(novo_ev)
            nova_meta.submetas.append(nova_sub)
        db.add(nova_meta)

    # Rastreabilidade: registra qual orçamento originou a árvore deste objeto.
    objeto = await db.get(Objeto, objeto_id)
    if objeto is not None:
        objeto.orcamento_id = orcamento_id
        db.add(objeto)

    await db.flush()
