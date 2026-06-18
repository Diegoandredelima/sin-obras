"""
SIN-Obras — Router de Contratos
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.usuario import Usuario
from app.schemas.contrato import ContratoCreate, ContratoResponse, ContratoUpdate
from app.services import contrato as contrato_service
from app.services.auditoria import registrar_auditoria

router = APIRouter(prefix="/contratos", tags=["Contratos"])


@router.get("", response_model=List[ContratoResponse])
async def list_contratos(
    skip: int = 0,
    limit: int = 100,
    search: str | None = Query(None, description="Busca por número, objeto ou fiscal"),
    orgao: str | None = Query(None, description="Filtra por sigla do órgão"),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    return await contrato_service.get_contratos(db, skip=skip, limit=limit, search=search, orgao=orgao)


@router.post("", response_model=ContratoResponse, status_code=status.HTTP_201_CREATED)
async def create_contrato(
    payload: ContratoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO)),
):
    contrato = await contrato_service.create_contrato(db, payload)
    await registrar_auditoria(
        db=db, usuario_id=current_user.id, entidade="Contrato", entidade_id=str(contrato.id),
        acao="CREATE", dados_depois=payload.model_dump(mode="json"),
        descricao=f"Contrato {contrato.numero_contrato} criado",
    )
    return contrato


@router.get("/{id}", response_model=ContratoResponse)
async def get_contrato(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    return await contrato_service.get_contrato_by_id(db, id)


@router.put("/{id}", response_model=ContratoResponse)
async def update_contrato(
    id: UUID,
    payload: ContratoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO)),
):
    contrato = await contrato_service.update_contrato(db, id, payload)
    await registrar_auditoria(
        db=db, usuario_id=current_user.id, entidade="Contrato", entidade_id=str(contrato.id),
        acao="UPDATE", dados_depois=payload.model_dump(exclude_unset=True, mode="json"),
        descricao=f"Contrato {contrato.numero_contrato} atualizado",
    )
    return contrato
