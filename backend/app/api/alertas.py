"""
SIN-Obras — Router de Alertas

Central de alertas com geração automática, delegação e resolução.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.usuario import Usuario
from app.schemas.alerta import AlertaDelegarRequest, AlertaResponse
from app.services import alerta as alerta_service
from app.services.auditoria import registrar_auditoria

router = APIRouter(prefix="/alertas", tags=["Alertas"])


@router.get("", response_model=list[AlertaResponse])
async def list_alertas(
    obra_id: UUID | None = None,
    prioridade: str | None = None,
    resolvido: bool | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N2)),
):
    """Lista alertas com filtros opcionais."""
    return await alerta_service.list_alertas(db, obra_id, prioridade, resolvido)


@router.post("/gerar", response_model=dict)
async def gerar_alertas(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.COORDENADOR)),
):
    """Força a geração de alertas automáticos. (Acesso: Chefe de Setor+)"""
    criados = await alerta_service.gerar_alertas(db)
    await registrar_auditoria(db, current_user.id, "Alerta", "batch", "GERAR", descricao=f"{criados} alertas gerados")
    return {"criados": criados}


@router.patch("/{id}/delegar", response_model=AlertaResponse)
async def delegar_alerta(
    id: UUID,
    payload: AlertaDelegarRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.COORDENADOR)),
):
    """Delega um alerta a um servidor com prazo. (Acesso: Chefe de Setor+)"""
    obj = await alerta_service.delegar_alerta(db, id, payload.delegado_para_id, payload.prazo_acao)
    await registrar_auditoria(
        db, current_user.id, "Alerta", str(obj.id), "DELEGAR",
        descricao=f"Delegado para {payload.delegado_para_id}",
    )
    return obj


@router.patch("/{id}/resolver", response_model=AlertaResponse, status_code=status.HTTP_200_OK)
async def resolver_alerta(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N2)),
):
    """Marca um alerta como resolvido."""
    obj = await alerta_service.resolver_alerta(db, id)
    await registrar_auditoria(db, current_user.id, "Alerta", str(obj.id), "RESOLVER")
    return obj
