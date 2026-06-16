"""
SIN-Obras — Router de Notificações
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.usuario import Usuario
from app.schemas.portal import NotificacaoResponse
from app.services import notificacao as notif_service

router = APIRouter(prefix="/notificacoes", tags=["Notificações"])


@router.get("", response_model=List[NotificacaoResponse])
async def list_notificacoes(
    apenas_nao_lidas: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Lista as notificações do usuário logado."""
    return await notif_service.get_notificacoes(db, current_user.id, apenas_nao_lidas)


@router.get("/nao-lidas/count")
async def count_nao_lidas(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Retorna o número de notificações não lidas (para o badge no header)."""
    count = await notif_service.count_nao_lidas(db, current_user.id)
    return {"count": count}


@router.patch("/{id}/lida", response_model=NotificacaoResponse)
async def marcar_como_lida(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Marca uma notificação como lida."""
    notif = await notif_service.marcar_como_lida(db, id, current_user.id)
    if not notif:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notificação não encontrada.")
    return notif
