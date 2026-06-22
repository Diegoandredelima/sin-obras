"""
SIN-Obras — Serviço de Obras
"""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rbac import Role
from app.models.obra import Contrato, Obra, SaudeObra, SituacaoObra, StatusObra
from app.schemas.obra import ObraCreate, ObraUpdate

# Perfis com visão completa do portfólio (não recebem recorte por usuário).
_ROLES_PORTFOLIO_COMPLETO = {
    Role.APOIO_N2,
    Role.ENGENHEIRO,
    Role.COORDENADOR,
    Role.SECRETARIO,
}


def scope_obras_por_usuario(stmt, user):
    """Restringe uma query de `Obra` ao escopo visível pelo `user`.

    Cada perfil enxerga seu próprio painel:
      • EMPRESA   → obras cujos contratos estão vinculados à sua conta;
      • FISCAL    → obras em que é responsável/gestor (ou fiscal do contrato);
      • APOIO_N1  → obras que cadastrou;
      • APOIO_N2+ → portfólio completo (sem recorte).

    `user` pode ser ``None`` (uso interno/sistêmico) → sem recorte.
    """
    if user is None:
        return stmt

    role = Role(user.tipo)
    if role in _ROLES_PORTFOLIO_COMPLETO:
        return stmt
    if role == Role.APOIO_N1:
        return stmt.where(Obra.criado_por_id == user.id)
    if role == Role.FISCAL:
        contratos_do_fiscal = select(Contrato.id).where(
            or_(Contrato.fiscal_id == user.id, Contrato.gestor_id == user.id)
        )
        return stmt.where(
            or_(
                Obra.responsavel_id == user.id,
                Obra.gestor_id == user.id,
                Obra.contrato_id.in_(contratos_do_fiscal),
            )
        )
    if role == Role.EMPRESA:
        contratos_da_empresa = select(Contrato.id).where(Contrato.empresa_id == user.id)
        return stmt.where(Obra.contrato_id.in_(contratos_da_empresa))
    return stmt


async def get_obras(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    search: str | None = None,
    status: StatusObra | None = None,
    situacao: SituacaoObra | None = None,
    saude: SaudeObra | None = None,
    municipio: str | None = None,
    contrato_id: str | None = None,
    criado_por_id: UUID | None = None,
    scope_user=None,
):
    base = select(Obra).where(Obra.ativo == True)
    base = scope_obras_por_usuario(base, scope_user)

    if search:
        term = f"%{search}%"
        base = base.where(or_(Obra.titulo.ilike(term), Obra.municipio.ilike(term)))
    if status:
        base = base.where(Obra.status == status)
    if situacao:
        base = base.where(Obra.situacao == situacao)
    if saude:
        base = base.where(Obra.saude == saude)
    if municipio:
        base = base.where(Obra.municipio.ilike(f"%{municipio}%"))
    if contrato_id:
        base = base.where(Obra.contrato_id == contrato_id)
    if criado_por_id:
        base = base.where(Obra.criado_por_id == criado_por_id)

    total = await db.scalar(select(func.count()).select_from(base.subquery()))

    q = base.order_by(Obra.criado_em.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    items = result.scalars().all()

    return {"items": list(items), "total": total or 0, "skip": skip, "limit": limit}


async def get_obras_stats(db: AsyncSession, scope_user=None) -> dict:
    """Contagens agregadas do Dashboard, recortadas ao escopo do usuário."""
    ativos = scope_obras_por_usuario(select(Obra).where(Obra.ativo == True), scope_user)
    total = await db.scalar(select(func.count()).select_from(ativos.subquery()))

    def _agg(coluna):
        return scope_obras_por_usuario(
            select(coluna, func.count().label("n")).where(Obra.ativo == True),
            scope_user,
        ).group_by(coluna)

    rows = await db.execute(_agg(Obra.situacao))
    por_situacao = {(r.situacao or "SEM_SITUACAO"): r.n for r in rows}

    rows2 = await db.execute(_agg(Obra.status))
    por_status = {r.status: r.n for r in rows2}

    rows3 = await db.execute(_agg(Obra.saude))
    por_saude = {(r.saude or "VERDE"): r.n for r in rows3}

    return {
        "total": total or 0,
        "por_situacao": por_situacao,
        "por_status": por_status,
        "por_saude": por_saude,
    }


async def get_obra_by_id(db: AsyncSession, obra_id: UUID) -> Obra:
    result = await db.execute(select(Obra).where(Obra.id == obra_id, Obra.ativo == True))
    obra = result.scalar_one_or_none()
    if not obra:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obra não encontrada.")
    return obra


async def create_obra(db: AsyncSession, obj_in: ObraCreate, criado_por_id: UUID | None = None) -> Obra:
    data = obj_in.model_dump(exclude={"latitude", "longitude"})

    db_obj = Obra(**data)
    if criado_por_id:
        db_obj.criado_por_id = criado_por_id

    if obj_in.latitude is not None and obj_in.longitude is not None:
        db_obj.localizacao = f"SRID=4326;POINT({obj_in.longitude} {obj_in.latitude})"

    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


async def update_obra(db: AsyncSession, obra_id: UUID, obj_in: ObraUpdate) -> Obra:
    db_obj = await get_obra_by_id(db, obra_id)
    update_data = obj_in.model_dump(exclude_unset=True, exclude={"latitude", "longitude"})

    for field, value in update_data.items():
        setattr(db_obj, field, value)

    if obj_in.latitude is not None and obj_in.longitude is not None:
        db_obj.localizacao = f"SRID=4326;POINT({obj_in.longitude} {obj_in.latitude})"

    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


async def delete_obra(db: AsyncSession, obra_id: UUID):
    db_obj = await get_obra_by_id(db, obra_id)
    db_obj.ativo = False
    db.add(db_obj)
    await db.flush()
    return db_obj
