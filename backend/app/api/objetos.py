"""
SIN-Obras — Router de Objetos
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.objeto import SaudeObjeto, SituacaoObjeto, StatusObjeto
from app.models.usuario import Usuario
from app.schemas.common import PaginatedResponse
from app.schemas.contrato import ContratoResponse
from app.schemas.objeto import (
    ItemCreate,
    ItemResponse,
    ItemUpdate,
    ObjetoCreate,
    ObjetoDetalheResponse,
    ObjetoResponse,
    ObjetoUpdate,
)
from app.services import objeto as objeto_service
from app.services.auditoria import registrar_auditoria

router = APIRouter(prefix="/objetos", tags=["Objetos"])


@router.get("/stats")
async def get_objetos_stats(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    """Contagens agregadas para o Dashboard, recortadas ao escopo do usuário."""
    return await objeto_service.get_objetos_stats(db, scope_user=current_user)


@router.get("/municipios/lista")
async def list_municipios(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    """Lista de municípios únicos cadastrados, ordenados."""
    return await objeto_service.get_municipios_list(db, scope_user=current_user)

@router.get("", response_model=PaginatedResponse[ObjetoResponse])
async def list_objetos(
    skip: int = 0,
    limit: int = 20,
    search: str | None = Query(None, description="Busca por título ou município"),
    status: StatusObjeto | None = Query(None),
    situacao: SituacaoObjeto | None = Query(None),
    saude: SaudeObjeto | None = Query(None),
    municipio: str | None = Query(None),
    contrato_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    """Lista objetos com filtros opcionais, recortadas ao escopo do usuário.

    Cada perfil vê apenas as objetos do seu painel (ver `scope_objetos_por_usuario`).
    """
    return await objeto_service.get_objetos(
        db, skip=skip, limit=limit,
        search=search, status=status, situacao=situacao, saude=saude,
        municipio=municipio, contrato_id=contrato_id,
        scope_user=current_user,
    )


@router.post("", response_model=ObjetoResponse, status_code=status.HTTP_201_CREATED)
async def create_objeto(
    payload: ObjetoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N1)),
):
    objeto = await objeto_service.create_objeto(db, payload, criado_por_id=current_user.id)
    await registrar_auditoria(
        db=db, usuario_id=current_user.id, entidade="Objeto", entidade_id=str(objeto.id),
        acao="CREATE", dados_depois=payload.model_dump(mode="json"),
        descricao=f"Objeto '{objeto.titulo}' cadastrado",
    )
    return objeto


@router.get("/{id}", response_model=ObjetoDetalheResponse)
async def get_objeto(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    return await objeto_service.get_objeto_by_id(db, id)


@router.get("/{id}/contrato", response_model=ContratoResponse | None)
async def get_contrato_objeto(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    """Retorna o contrato (documento-mãe) ao qual o objeto pertence (Objeto N—1 Contrato)."""
    objeto = await objeto_service.get_objeto_by_id(db, id)
    return objeto.contrato


@router.put("/{id}", response_model=ObjetoResponse)
async def update_objeto(
    id: UUID,
    payload: ObjetoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N1)),
):
    objeto = await objeto_service.update_objeto(db, id, payload)
    await registrar_auditoria(
        db=db, usuario_id=current_user.id, entidade="Objeto", entidade_id=str(objeto.id),
        acao="UPDATE", dados_depois=payload.model_dump(exclude_unset=True, mode="json"),
        descricao=f"Objeto '{objeto.titulo}' atualizado",
    )
    return objeto


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_objeto(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.COORDENADOR)),
):
    objeto = await objeto_service.delete_objeto(db, id)
    await registrar_auditoria(
        db=db, usuario_id=current_user.id, entidade="Objeto", entidade_id=str(objeto.id),
        acao="DELETE", descricao=f"Objeto '{objeto.titulo}' removido (soft delete)",
    )


# ---------------------------------------------------------------------------
# Itens do objeto (Objeto 1—N Item)
# ---------------------------------------------------------------------------
@router.get("/{id}/itens", response_model=list[ItemResponse])
async def list_itens_objeto(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    """Lista os itens que compõem um objeto."""
    return await objeto_service.get_itens_by_objeto(db, id)


@router.post("/{id}/itens", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item_objeto(
    id: UUID,
    payload: ItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N1)),
):
    item = await objeto_service.create_item(db, id, payload)
    await registrar_auditoria(
        db=db, usuario_id=current_user.id, entidade="Item", entidade_id=str(item.id),
        acao="CREATE", dados_depois=payload.model_dump(mode="json"),
        descricao=f"Item '{item.descricao[:80]}' adicionado ao objeto",
    )
    return item


@router.put("/itens/{item_id}", response_model=ItemResponse)
async def update_item_objeto(
    item_id: UUID,
    payload: ItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N1)),
):
    item = await objeto_service.update_item(db, item_id, payload)
    await registrar_auditoria(
        db=db, usuario_id=current_user.id, entidade="Item", entidade_id=str(item.id),
        acao="UPDATE", dados_depois=payload.model_dump(exclude_unset=True, mode="json"),
        descricao=f"Item '{item.descricao[:80]}' atualizado",
    )
    return item


@router.delete("/itens/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item_objeto(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.COORDENADOR)),
):
    await objeto_service.delete_item(db, item_id)
    await registrar_auditoria(
        db=db, usuario_id=current_user.id, entidade="Item", entidade_id=str(item_id),
        acao="DELETE", descricao="Item removido do objeto",
    )
