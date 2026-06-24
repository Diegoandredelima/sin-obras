"""
SIN-Obras — Router de Delegação de Obras

Permite ao Chefe de Setor delegar objetos para fiscais e apoios.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.usuario import Usuario
from app.schemas.delegacao import DelegacaoCreate, DelegacaoResponse
from app.services import delegacao as delegacao_service
from app.services.auditoria import registrar_auditoria

router = APIRouter(prefix="/delegacoes", tags=["Delegações"])


@router.get("", response_model=list[DelegacaoResponse])
async def list_delegacoes(
    objeto_id: UUID | None = None,
    usuario_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N2)),
):
    """Lista delegações com filtros opcionais por objeto ou usuário."""
    return await delegacao_service.list_delegacoes(db, objeto_id, usuario_id)


@router.post("", response_model=DelegacaoResponse, status_code=status.HTTP_201_CREATED)
async def create_delegacao(
    payload: DelegacaoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.COORDENADOR)),
):
    """Delega uma objeto a um fiscal ou apoio. (Acesso: Chefe de Setor+)"""
    obj = await delegacao_service.create_delegacao(
        db,
        delegado_por_id=current_user.id,
        objeto_id=payload.objeto_id,
        usuario_id=payload.usuario_id,
        funcao=payload.funcao,
        data_inicio=payload.data_inicio,
        data_fim=payload.data_fim,
        observacao=payload.observacao,
    )
    await registrar_auditoria(
        db, current_user.id, "DelegacaoObra", str(obj.id), "CREATE",
        dados_depois=payload.model_dump(mode="json"),
    )
    return obj


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def revogar_delegacao(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.COORDENADOR)),
):
    """Revoga uma delegação. (Acesso: Chefe de Setor+)"""
    obj = await delegacao_service.revogar_delegacao(db, id)
    await registrar_auditoria(
        db, current_user.id, "DelegacaoObra", str(obj.id), "REVOGAR",
        descricao=f"Delegação de {obj.usuario_id} para objeto {obj.objeto_id} revogada",
    )
