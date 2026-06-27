"""
SIN-Obras — Router de Cronograma (Metas, Submetas, Eventos)
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.objeto import CronogramaParcela, CronogramaVersao
from app.models.usuario import Usuario
from app.schemas.objeto import (
    CronogramaPrevisaoParcela,
    CronogramaPrevisaoResponse,
    CronogramaVersaoCreate,
    CronogramaVersaoResponse,
    EventoBase,
    EventoCreate,
    EventoResponse,
    MetaCreate,
    MetaResponse,
    SubmetaCreate,
    SubmetaResponse,
)
from app.services import cronograma as cronograma_service
from app.services.auditoria import registrar_auditoria

router = APIRouter(prefix="/cronograma", tags=["Cronograma"])

# ---------------------------------------------------------------------------
# Metas
# ---------------------------------------------------------------------------
@router.get("/objetos/{objeto_id}/metas", response_model=list[MetaResponse])
async def list_metas(
    objeto_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Lista as metas de uma objeto."""
    return await cronograma_service.get_metas_by_objeto(db, objeto_id)

@router.post("/objetos/{objeto_id}/metas", response_model=MetaResponse, status_code=status.HTTP_201_CREATED)
async def create_meta(
    objeto_id: UUID,
    payload: MetaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N1))
):
    """Cria uma meta para a objeto."""
    payload.objeto_id = objeto_id
    meta = await cronograma_service.create_meta(db, payload)

    await registrar_auditoria(db, current_user.id, "Meta", str(meta.id), "CREATE", dados_depois=payload.model_dump(mode="json"))
    return meta

# ---------------------------------------------------------------------------
# Submetas
# ---------------------------------------------------------------------------
@router.post("/metas/{meta_id}/submetas", response_model=SubmetaResponse, status_code=status.HTTP_201_CREATED)
async def create_submeta(
    meta_id: UUID,
    payload: SubmetaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N1))
):
    """Cria uma submeta."""
    payload.meta_id = meta_id
    submeta = await cronograma_service.create_submeta(db, payload)

    await registrar_auditoria(db, current_user.id, "Submeta", str(submeta.id), "CREATE", dados_depois=payload.model_dump(mode="json"))
    return submeta

# ---------------------------------------------------------------------------
# Eventos
# ---------------------------------------------------------------------------
@router.post("/submetas/{submeta_id}/eventos", response_model=EventoResponse, status_code=status.HTTP_201_CREATED)
async def create_evento(
    submeta_id: UUID,
    payload: EventoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N1))
):
    """Cria um evento."""
    payload.submeta_id = submeta_id
    evento = await cronograma_service.create_evento(db, payload)

    await registrar_auditoria(db, current_user.id, "Evento", str(evento.id), "CREATE", dados_depois=payload.model_dump(mode="json"))
    return evento

@router.put("/eventos/{id}", response_model=EventoResponse)
async def update_evento(
    id: UUID,
    payload: EventoBase,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N1))
):
    """Atualiza um evento."""
    evento = await cronograma_service.update_evento(db, id, payload)

    await registrar_auditoria(db, current_user.id, "Evento", str(evento.id), "UPDATE", dados_depois=payload.model_dump(mode="json"))
    return evento

@router.delete("/eventos/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_evento(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N1))
):
    """Exclui um evento."""
    await cronograma_service.delete_evento(db, id)
    await registrar_auditoria(db, current_user.id, "Evento", str(id), "DELETE", descricao=f"Evento {id} removido")
    return None

# ---------------------------------------------------------------------------
# Cronograma (Versões e Parcelas)
# ---------------------------------------------------------------------------
@router.post("/objetos/{objeto_id}/versoes", response_model=CronogramaVersaoResponse, status_code=status.HTTP_201_CREATED)
async def create_cronograma_versao(
    objeto_id: UUID,
    payload: CronogramaVersaoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N2))
):
    """
    Cria uma nova versão do cronograma (físico-financeiro), com suas parcelas.
    A versão recém-criada torna-se a versão ativa, desativando as anteriores.
    """
    versao = await cronograma_service.create_cronograma_versao(db, objeto_id, payload, current_user.id)
    await registrar_auditoria(
        db, current_user.id, "CronogramaVersao", str(versao.id), "CREATE",
        descricao=f"Versão {versao.numero_versao} do cronograma criada",
        dados_depois=payload.model_dump(mode="json")
    )
    return versao

@router.get("/objetos/{objeto_id}/versoes/ativa", response_model=CronogramaVersaoResponse)
async def get_cronograma_versao_ativa(
    objeto_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """
    Retorna a versão ativa do cronograma para o objeto.
    """
    versao = await cronograma_service.get_cronograma_versao_ativa(db, objeto_id)
    if not versao:
        raise HTTPException(status_code=404, detail="Nenhuma versão ativa encontrada.")
    return versao

@router.get("/objetos/{objeto_id}/versoes", response_model=list[CronogramaVersaoResponse])
async def list_cronograma_versoes(
    objeto_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """
    Lista todas as versões do cronograma para o objeto (em ordem decrescente de versão).
    """
    result = await db.execute(
        select(CronogramaVersao)
        .where(CronogramaVersao.objeto_id == objeto_id)
        .order_by(CronogramaVersao.numero_versao.desc())
    )
    return result.scalars().all()

@router.get("/versoes/{versao_id}", response_model=CronogramaVersaoResponse)
async def get_cronograma_versao(
    versao_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """
    Retorna uma versão específica do cronograma pelo ID.
    Inclui todas as parcelas associadas.
    """
    result = await db.execute(
        select(CronogramaVersao).where(CronogramaVersao.id == versao_id)
    )
    versao = result.scalar_one_or_none()
    if not versao:
        raise HTTPException(status_code=404, detail="Versão do cronograma não encontrada.")
    return versao

@router.get("/objetos/{objeto_id}/previsao", response_model=CronogramaPrevisaoResponse)
async def get_previsao_periodo(
    objeto_id: UUID,
    periodo: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """
    Retorna as quantidades previstas para o período N com base na versão ativa do cronograma.
    Usado na hora de criar nova medição para preencher 'conforme previsto'.
    """
    versao = await cronograma_service.get_cronograma_versao_ativa(db, objeto_id)
    if not versao:
        return CronogramaPrevisaoResponse(periodo=periodo, parcelas=[])

    result = await db.execute(
        select(CronogramaParcela)
        .where(CronogramaParcela.versao_id == versao.id)
        .where(CronogramaParcela.periodo_numero == periodo)
    )
    parcelas = result.scalars().all()

    return CronogramaPrevisaoResponse(
        periodo=periodo,
        versao_id=versao.id,
        parcelas=[
            CronogramaPrevisaoParcela(evento_id=p.evento_id, quantidade_prevista=p.quantidade_prevista)
            for p in parcelas
        ],
    )
