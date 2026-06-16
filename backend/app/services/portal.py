"""
SIN-Obras — Serviço de Diário de Obras e Medições
Implementa RN01 (Bloqueio por ART) e assinatura eletrônica com SHA-256
"""

import hashlib
import json
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.art_rrt import ArtRrt
from app.models.portal import DiarioObra, Medicao, StatusMedicao
from app.schemas.portal import DiarioCreate, DiarioUpdate, MedicaoCreate, MedicaoUpdate


# ---------------------------------------------------------------------------
# Diário de Obras
# ---------------------------------------------------------------------------
async def get_diario_by_obra(db: AsyncSession, obra_id: UUID):
    result = await db.execute(
        select(DiarioObra)
        .where(DiarioObra.obra_id == obra_id)
        .order_by(DiarioObra.data_registro.desc())
    )
    return result.scalars().all()


async def create_diario(db: AsyncSession, obra_id: UUID, usuario_id: UUID, obj_in: DiarioCreate) -> DiarioObra:
    db_obj = DiarioObra(**obj_in.model_dump(), obra_id=obra_id, usuario_id=usuario_id)
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


async def update_diario(db: AsyncSession, diario_id: UUID, usuario_id: UUID, obj_in: DiarioUpdate) -> DiarioObra:
    result = await db.execute(select(DiarioObra).where(DiarioObra.id == diario_id))
    db_obj = result.scalar_one_or_none()
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro de diário não encontrado.")
    if db_obj.usuario_id != usuario_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Você não tem permissão para editar este registro.")

    update_data = obj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)

    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


# ---------------------------------------------------------------------------
# Medições
# ---------------------------------------------------------------------------
async def get_medicoes_by_obra(db: AsyncSession, obra_id: UUID):
    result = await db.execute(
        select(Medicao)
        .where(Medicao.obra_id == obra_id)
        .order_by(Medicao.numero_medicao.desc())
    )
    return result.scalars().all()


async def get_medicao_by_id(db: AsyncSession, medicao_id: UUID) -> Medicao:
    result = await db.execute(select(Medicao).where(Medicao.id == medicao_id))
    medicao = result.scalar_one_or_none()
    if not medicao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medição não encontrada.")
    return medicao


async def _proximo_numero_medicao(db: AsyncSession, obra_id: UUID) -> int:
    result = await db.execute(
        select(func.coalesce(func.max(Medicao.numero_medicao), 0))
        .where(Medicao.obra_id == obra_id)
    )
    return result.scalar_one() + 1


async def create_medicao(db: AsyncSession, empresa_usuario_id: UUID, obj_in: MedicaoCreate) -> Medicao:
    numero = await _proximo_numero_medicao(db, obj_in.obra_id)
    db_obj = Medicao(
        obra_id=obj_in.obra_id,
        empresa_usuario_id=empresa_usuario_id,
        numero_medicao=numero,
        status=StatusMedicao.RASCUNHO,
        eventos_declarados=[e.model_dump(mode="json") for e in obj_in.eventos_declarados],
    )
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


async def update_medicao(db: AsyncSession, medicao_id: UUID, usuario_id: UUID, obj_in: MedicaoUpdate) -> Medicao:
    db_obj = await get_medicao_by_id(db, medicao_id)

    if db_obj.empresa_usuario_id != usuario_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado.")
    if db_obj.status != StatusMedicao.RASCUNHO:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Apenas rascunhos podem ser editados.")

    if obj_in.eventos_declarados is not None:
        db_obj.eventos_declarados = [e.model_dump(mode="json") for e in obj_in.eventos_declarados]

    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


async def assinar_medicao(db: AsyncSession, medicao_id: UUID, usuario_id: UUID) -> Medicao:
    """
    RN01 — Assinar medição:
    1. Verifica se a medição é um rascunho e pertence ao usuário
    2. Verifica se existe ART ativa para a obra
    3. Gera hash SHA-256 e registra assinatura
    """
    db_obj = await get_medicao_by_id(db, medicao_id)

    if db_obj.empresa_usuario_id != usuario_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado.")
    if db_obj.status != StatusMedicao.RASCUNHO:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Esta medição não pode ser assinada (status atual: {db_obj.status}).")

    # RN01 — Verificar ART ativa
    art_result = await db.execute(
        select(ArtRrt).where(
            ArtRrt.obra_id == db_obj.obra_id,
            ArtRrt.usuario_id == usuario_id,
            ArtRrt.ativa == True,
        )
    )
    art = art_result.scalar_one_or_none()
    if not art:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não é possível assinar a medição: você não possui uma ART/RRT ativa vinculada a esta obra."
        )

    # Gerar hash SHA-256 do conteúdo
    conteudo = json.dumps({
        "medicao_id": str(db_obj.id),
        "obra_id": str(db_obj.obra_id),
        "numero_medicao": db_obj.numero_medicao,
        "empresa_usuario_id": str(db_obj.empresa_usuario_id),
        "eventos_declarados": db_obj.eventos_declarados,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }, sort_keys=True)
    hash_sha256 = hashlib.sha256(conteudo.encode()).hexdigest()

    now = datetime.now(timezone.utc)
    db_obj.status = StatusMedicao.ASSINADA
    db_obj.assinada_em = now
    db_obj.enviada_em = now
    db_obj.hash_assinatura = hash_sha256

    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj


async def avaliar_medicao(db: AsyncSession, medicao_id: UUID, aprovada: bool, observacao: str | None = None) -> Medicao:
    """Fiscal aprova ou reprova a medição."""
    db_obj = await get_medicao_by_id(db, medicao_id)

    if db_obj.status not in (StatusMedicao.ASSINADA, StatusMedicao.EM_FISCALIZACAO):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A medição não está disponível para fiscalização.")

    db_obj.status = StatusMedicao.APROVADA if aprovada else StatusMedicao.REPROVADA
    db_obj.observacao_fiscal = observacao

    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj
