"""
SIN-Obras — Serviço de Objetos
"""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rbac import Role
from app.models.objeto import Contrato, Item, Objeto, SaudeObjeto, SituacaoObjeto, StatusObjeto
from app.schemas.objeto import ItemCreate, ItemUpdate, ObjetoCreate, ObjetoUpdate

# Perfis com visão completa do portfólio (não recebem recorte por usuário).
_ROLES_PORTFOLIO_COMPLETO = {
    Role.APOIO_N2,
    Role.ENGENHEIRO,
    Role.COORDENADOR,
    Role.SECRETARIO,
}


def scope_objetos_por_usuario(stmt, user):
    """Restringe uma query de `Objeto` ao escopo visível pelo `user`.

    Cada perfil enxerga seu próprio painel:
      • EMPRESA   → objetos cujos contratos estão vinculados à sua conta;
      • FISCAL    → objetos em que é responsável/gestor (ou fiscal do contrato);
      • APOIO_N1  → objetos que cadastrou;
      • APOIO_N2+ → portfólio completo (sem recorte).

    `user` pode ser ``None`` (uso interno/sistêmico) → sem recorte.
    """
    if user is None:
        return stmt

    role = Role(user.tipo)
    if role in _ROLES_PORTFOLIO_COMPLETO:
        return stmt
    if role == Role.APOIO_N1:
        return stmt.where(Objeto.criado_por_id == user.id)
    if role == Role.FISCAL:
        contratos_do_fiscal = select(Contrato.id).where(
            or_(Contrato.fiscal_id == user.id, Contrato.gestor_id == user.id)
        )
        return stmt.where(
            or_(
                Objeto.responsavel_id == user.id,
                Objeto.gestor_id == user.id,
                Objeto.contrato_id.in_(contratos_do_fiscal),
            )
        )
    if role == Role.EMPRESA:
        contratos_da_empresa = select(Contrato.id).where(Contrato.empresa_id == user.id)
        return stmt.where(Objeto.contrato_id.in_(contratos_da_empresa))
    return stmt


async def get_objetos(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    search: str | None = None,
    status: StatusObjeto | None = None,
    situacao: SituacaoObjeto | None = None,
    saude: SaudeObjeto | None = None,
    municipio: str | None = None,
    contrato_id: str | None = None,
    criado_por_id: UUID | None = None,
    scope_user=None,
):
    base = select(Objeto).where(Objeto.ativo == True)
    base = scope_objetos_por_usuario(base, scope_user)

    if search:
        term = f"%{search}%"
        base = base.where(or_(Objeto.titulo.ilike(term), Objeto.municipio.ilike(term)))
    if status:
        base = base.where(Objeto.status == status)
    if situacao:
        base = base.where(Objeto.situacao == situacao)
    if saude:
        base = base.where(Objeto.saude == saude)
    if municipio:
        base = base.where(Objeto.municipio.ilike(f"%{municipio}%"))
    if contrato_id:
        base = base.where(Objeto.contrato_id == contrato_id)
    if criado_por_id:
        base = base.where(Objeto.criado_por_id == criado_por_id)

    total = await db.scalar(select(func.count()).select_from(base.subquery()))

    q = base.order_by(Objeto.criado_em.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    items = result.scalars().all()

    return {"items": list(items), "total": total or 0, "skip": skip, "limit": limit}


async def get_objetos_stats(db: AsyncSession, scope_user=None) -> dict:
    """Contagens agregadas do Dashboard, recortadas ao escopo do usuário."""
    ativos = scope_objetos_por_usuario(select(Objeto).where(Objeto.ativo == True), scope_user)
    total = await db.scalar(select(func.count()).select_from(ativos.subquery()))

    def _agg(coluna):
        return scope_objetos_por_usuario(
            select(coluna, func.count().label("n")).where(Objeto.ativo == True),
            scope_user,
        ).group_by(coluna)

    rows = await db.execute(_agg(Objeto.situacao))
    por_situacao = {(r.situacao or "SEM_SITUACAO"): r.n for r in rows}

    rows2 = await db.execute(_agg(Objeto.status))
    por_status = {r.status: r.n for r in rows2}

    rows3 = await db.execute(_agg(Objeto.saude))
    por_saude = {(r.saude or "VERDE"): r.n for r in rows3}

    return {
        "total": total or 0,
        "por_situacao": por_situacao,
        "por_status": por_status,
        "por_saude": por_saude,
    }


async def get_objeto_by_id(db: AsyncSession, objeto_id: UUID) -> Objeto:
    result = await db.execute(select(Objeto).where(Objeto.id == objeto_id, Objeto.ativo == True))
    objeto = result.scalar_one_or_none()
    if not objeto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Objeto não encontrado.")
    return objeto


async def create_objeto(db: AsyncSession, obj_in: ObjetoCreate, criado_por_id: UUID | None = None) -> Objeto:
    data = obj_in.model_dump(exclude={"latitude", "longitude"})

    db_obj = Objeto(**data)
    if criado_por_id:
        db_obj.criado_por_id = criado_por_id

    if obj_in.latitude is not None and obj_in.longitude is not None:
        db_obj.localizacao = f"SRID=4326;POINT({obj_in.longitude} {obj_in.latitude})"

    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


async def update_objeto(db: AsyncSession, objeto_id: UUID, obj_in: ObjetoUpdate) -> Objeto:
    db_obj = await get_objeto_by_id(db, objeto_id)
    update_data = obj_in.model_dump(exclude_unset=True, exclude={"latitude", "longitude"})

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    if obj_in.latitude is not None and obj_in.longitude is not None:
        db_obj.localizacao = f"SRID=4326;POINT({obj_in.longitude} {obj_in.latitude})"

    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


async def delete_objeto(db: AsyncSession, objeto_id: UUID):
    db_obj = await get_objeto_by_id(db, objeto_id)
    db_obj.ativo = False
    db.add(db_obj)
    await db.flush()
    return db_obj


# ---------------------------------------------------------------------------
# Itens (partes constitutivas do objeto)
# ---------------------------------------------------------------------------
async def get_itens_by_objeto(db: AsyncSession, objeto_id: UUID) -> list[Item]:
    result = await db.execute(
        select(Item).where(Item.objeto_id == objeto_id).order_by(Item.ordem)
    )
    return list(result.scalars().all())


async def create_item(db: AsyncSession, objeto_id: UUID, obj_in: ItemCreate) -> Item:
    # Garante que o objeto existe (e está ativo) antes de pendurar o item.
    await get_objeto_by_id(db, objeto_id)
    data = obj_in.model_dump(exclude={"objeto_id"})
    db_obj = Item(objeto_id=objeto_id, **data)
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


async def update_item(db: AsyncSession, item_id: UUID, obj_in: ItemUpdate) -> Item:
    db_obj = await db.get(Item, item_id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item não encontrado.")
    for field, value in obj_in.model_dump(exclude_unset=True).items():
        setattr(db_obj, field, value)
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


async def delete_item(db: AsyncSession, item_id: UUID) -> None:
    db_obj = await db.get(Item, item_id)
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item não encontrado.")
    await db.delete(db_obj)


async def get_municipios_list(db: AsyncSession, scope_user=None) -> list[str]:
    """Retorna lista de municípios únicos cadastrados, ordenada alfabeticamente."""
    stmt = select(Objeto.municipio).where(Objeto.municipio.isnot(None)).distinct()
    stmt = scope_objetos_por_usuario(stmt, scope_user)
    stmt = stmt.order_by(Objeto.municipio)
    result = await db.execute(stmt)
    municipios = [row[0] for row in result.fetchall() if row[0]]
    return sorted(set(municipios))

    await db.flush()
