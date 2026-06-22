"""
SIN-Obras — Router de Obras
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.obra import SaudeObra, SituacaoObra, StatusObra
from app.models.usuario import Usuario
from app.schemas.common import PaginatedResponse
from app.schemas.contrato import ContratoResponse
from app.schemas.obra import ObraCreate, ObraDetalheResponse, ObraResponse, ObraUpdate
from app.services import obra as obra_service
from app.services.auditoria import registrar_auditoria

router = APIRouter(prefix="/obras", tags=["Obras"])


@router.get("/stats")
async def get_obras_stats(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    """Contagens agregadas para o Dashboard, recortadas ao escopo do usuário."""
    return await obra_service.get_obras_stats(db, scope_user=current_user)


@router.get("", response_model=PaginatedResponse[ObraResponse])
async def list_obras(
    skip: int = 0,
    limit: int = 20,
    search: str | None = Query(None, description="Busca por título ou município"),
    status: StatusObra | None = Query(None),
    situacao: SituacaoObra | None = Query(None),
    saude: SaudeObra | None = Query(None),
    municipio: str | None = Query(None),
    contrato_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    """Lista obras com filtros opcionais, recortadas ao escopo do usuário.

    Cada perfil vê apenas as obras do seu painel (ver `scope_obras_por_usuario`).
    """
    return await obra_service.get_obras(
        db, skip=skip, limit=limit,
        search=search, status=status, situacao=situacao, saude=saude,
        municipio=municipio, contrato_id=contrato_id,
        scope_user=current_user,
    )


@router.post("", response_model=ObraResponse, status_code=status.HTTP_201_CREATED)
async def create_obra(
    payload: ObraCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N1)),
):
    obra = await obra_service.create_obra(db, payload, criado_por_id=current_user.id)
    await registrar_auditoria(
        db=db, usuario_id=current_user.id, entidade="Obra", entidade_id=str(obra.id),
        acao="CREATE", dados_depois=payload.model_dump(mode="json"),
        descricao=f"Obra '{obra.titulo}' cadastrada",
    )
    return obra


@router.get("/{id}", response_model=ObraDetalheResponse)
async def get_obra(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    return await obra_service.get_obra_by_id(db, id)


@router.get("/{id}/contratos", response_model=list[ContratoResponse])
async def list_contratos_obra(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    """Lista os contratos vinculados a uma obra (Obra 1—N Contrato)."""
    obra = await obra_service.get_obra_by_id(db, id)
    return obra.contratos


@router.put("/{id}", response_model=ObraResponse)
async def update_obra(
    id: UUID,
    payload: ObraUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO)),
):
    obra = await obra_service.update_obra(db, id, payload)
    await registrar_auditoria(
        db=db, usuario_id=current_user.id, entidade="Obra", entidade_id=str(obra.id),
        acao="UPDATE", dados_depois=payload.model_dump(exclude_unset=True, mode="json"),
        descricao=f"Obra '{obra.titulo}' atualizada",
    )
    return obra


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_obra(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.COORDENADOR)),
):
    obra = await obra_service.delete_obra(db, id)
    await registrar_auditoria(
        db=db, usuario_id=current_user.id, entidade="Obra", entidade_id=str(obra.id),
        acao="DELETE", descricao=f"Obra '{obra.titulo}' removida (soft delete)",
    )
