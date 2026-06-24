"""
SIN-Obras — Router do Catálogo de Itens/Serviços (Tabela 028)

Endpoints de leitura usados no cadastro do cronograma físico-financeiro de uma
objeto: listar as classes (para filtro) e buscar itens (autocomplete), herdando
unidade e descrição ao lançar um Evento.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.catalogo import CatalogoClasse, CatalogoItem
from app.models.usuario import Usuario

router = APIRouter(prefix="/catalogo", tags=["Catálogo"])


class CatalogoClasseResponse(BaseModel):
    id: UUID
    codigo: int
    nome: str
    model_config = {"from_attributes": True}


class CatalogoItemResponse(BaseModel):
    id: UUID
    codigo_sistema: str
    item: str
    descricao: str | None = None
    unidade: str | None = None
    classe_id: UUID
    classe_codigo: int
    classe_nome: str

    @classmethod
    def de_modelo(cls, item: CatalogoItem) -> "CatalogoItemResponse":
        return cls(
            id=item.id,
            codigo_sistema=item.codigo_sistema,
            item=item.item,
            descricao=item.descricao,
            unidade=item.unidade,
            classe_id=item.classe_id,
            classe_codigo=item.classe.codigo,
            classe_nome=item.classe.nome,
        )


class CatalogoItemPagina(BaseModel):
    total: int
    itens: list[CatalogoItemResponse]


@router.get("/classes", response_model=list[CatalogoClasseResponse])
async def listar_classes(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    """Lista as 45 classes do catálogo (ordenadas pelo código)."""
    result = await db.execute(
        select(CatalogoClasse).order_by(CatalogoClasse.codigo)
    )
    return result.scalars().all()


@router.get("/itens", response_model=CatalogoItemPagina)
async def buscar_itens(
    q: str | None = Query(None, description="Busca por nome do item ou código"),
    classe_id: UUID | None = Query(None, description="Filtra por classe"),
    apenas_ativos: bool = Query(True),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    """Busca itens do catálogo (autocomplete) com filtro por classe/texto."""
    filtros = []
    if apenas_ativos:
        filtros.append(CatalogoItem.ativo.is_(True))
    if classe_id is not None:
        filtros.append(CatalogoItem.classe_id == classe_id)
    if q:
        termo = f"%{q.strip()}%"
        filtros.append(
            or_(
                CatalogoItem.item.ilike(termo),
                CatalogoItem.codigo_sistema.ilike(termo),
            )
        )

    total = await db.scalar(
        select(func.count()).select_from(CatalogoItem).where(*filtros)
    )
    result = await db.execute(
        select(CatalogoItem)
        .where(*filtros)
        .options(selectinload(CatalogoItem.classe))
        .order_by(CatalogoItem.codigo_sistema)
        .limit(limit)
        .offset(offset)
    )
    itens = [CatalogoItemResponse.de_modelo(i) for i in result.scalars().all()]
    return CatalogoItemPagina(total=total or 0, itens=itens)


@router.get("/itens/{item_id}", response_model=CatalogoItemResponse)
async def obter_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    """Detalhe de um item do catálogo."""
    item = await db.get(
        CatalogoItem, item_id, options=[selectinload(CatalogoItem.classe)]
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    return CatalogoItemResponse.de_modelo(item)
