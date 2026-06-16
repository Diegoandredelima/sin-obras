"""
SIN-Obras — Router de Tarefas (Kanban)
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.usuario import Usuario
from app.schemas.tarefa import TarefaCreate, TarefaResponse, TarefaUpdate
from app.services import tarefa as tarefa_service
from app.services.auditoria import registrar_auditoria

router = APIRouter(prefix="/tarefas", tags=["Tarefas Kanban"])

@router.get("", response_model=List[TarefaResponse])
async def list_tarefas(
    obra_id: UUID | None = None,
    responsavel_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Lista tarefas com filtros opcionais."""
    return await tarefa_service.get_tarefas(db, obra_id, responsavel_id)

@router.post("", response_model=TarefaResponse, status_code=status.HTTP_201_CREATED)
async def create_tarefa(
    payload: TarefaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO))
):
    """Cria uma tarefa (Acesso: Engenheiro+)."""
    tarefa = await tarefa_service.create_tarefa(db, payload)
    
    await registrar_auditoria(db, current_user.id, "Tarefa", str(tarefa.id), "CREATE", dados_depois=payload.model_dump(mode="json"))
    return tarefa

@router.get("/{id}", response_model=TarefaResponse)
async def get_tarefa(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Detalhes da tarefa."""
    return await tarefa_service.get_tarefa_by_id(db, id)

@router.patch("/{id}/mover", response_model=TarefaResponse)
async def move_tarefa(
    id: UUID,
    payload: TarefaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Atualiza o status de uma tarefa (drag & drop no Kanban)."""
    tarefa = await tarefa_service.update_tarefa(db, id, payload)
    
    await registrar_auditoria(db, current_user.id, "Tarefa", str(tarefa.id), "UPDATE", dados_depois=payload.model_dump(exclude_unset=True, mode="json"))
    return tarefa

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tarefa(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.ENGENHEIRO))
):
    """Remove uma tarefa."""
    await tarefa_service.delete_tarefa(db, id)
    await registrar_auditoria(db, current_user.id, "Tarefa", str(id), "DELETE")
