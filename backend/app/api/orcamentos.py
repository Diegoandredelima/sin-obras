"""
SIN-Obras — Router do módulo de Orçamento (banco de dados técnico)

CRUD do orçamento-template e busca por código/título (usada na vinculação ao
Objeto). A cópia da EAP para o objeto acontece no cadastro do Objeto
(``ObjetoCreate.orcamento_id`` → ``services.orcamento.copiar_orcamento_para_objeto``).
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.usuario import Usuario
from app.schemas.orcamento import (
    OrcamentoCreate,
    OrcamentoResponse,
    OrcamentoResumo,
    OrcamentoUpdate,
)
from app.services import orcamento as orcamento_service
from app.services.auditoria import registrar_auditoria

router = APIRouter(prefix="/orcamentos", tags=["Orçamentos"])


@router.post("", response_model=OrcamentoResponse, status_code=status.HTTP_201_CREATED)
async def create_orcamento(
    payload: OrcamentoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N1)),
):
    """Cria um novo orçamento (cabeçalho + EAP) e gera o ID legível ORC-AAAA-NNNN."""
    orc = await orcamento_service.create_orcamento(db, payload, usuario_id=current_user.id)
    await registrar_auditoria(
        db, current_user.id, "Orcamento", str(orc.id), "CREATE",
        descricao=f"Orçamento {orc.codigo} criado",
    )
    return orc


@router.get("", response_model=list[OrcamentoResumo])
async def list_orcamentos(
    q: str | None = Query(None, description="Busca por código ou título"),
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N1)),
):
    """Lista/busca orçamentos (para selecionar e vincular ao cadastrar um objeto)."""
    return await orcamento_service.list_orcamentos(db, q=q, limit=limit)


@router.get("/{orcamento_id}", response_model=OrcamentoResponse)
async def get_orcamento(
    orcamento_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N1)),
):
    """Retorna o orçamento completo (cabeçalho + EAP + memória + critério)."""
    return await orcamento_service.get_orcamento(db, orcamento_id)


@router.put("/{orcamento_id}", response_model=OrcamentoResponse)
async def update_orcamento(
    orcamento_id: UUID,
    payload: OrcamentoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N1)),
):
    """Atualiza o cabeçalho e, opcionalmente, substitui a EAP inteira."""
    orc = await orcamento_service.update_orcamento(db, orcamento_id, payload)
    await registrar_auditoria(
        db, current_user.id, "Orcamento", str(orc.id), "UPDATE",
        descricao=f"Orçamento {orc.codigo} atualizado",
    )
    return orc


@router.delete("/{orcamento_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_orcamento(
    orcamento_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N2)),
):
    """Exclui um orçamento-template (não afeta objetos já vinculados — cópia congelada)."""
    await orcamento_service.delete_orcamento(db, orcamento_id)
    await registrar_auditoria(db, current_user.id, "Orcamento", str(orcamento_id), "DELETE")
    return None
