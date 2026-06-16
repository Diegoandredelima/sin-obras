"""
SIN-Obras — Router de Vistorias (Bloco 4 — Mobile)
Check-in georreferenciado, checklist, upload de fotos e finalização.
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Form, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.usuario import Usuario
from app.schemas.vistoria import (
    CheckinRequest, ChecklistItemResponse, ChecklistItemUpdate,
    FotoUploadResponse, VistoriaFinalizarRequest, VistoriaResponse,
)
from app.services import vistoria as vistoria_service
from app.services.auditoria import registrar_auditoria

router = APIRouter(prefix="/vistorias", tags=["Vistorias (Mobile)"])


# ---------------------------------------------------------------------------
# Check-in
# ---------------------------------------------------------------------------
@router.post("/checkin", response_model=VistoriaResponse, status_code=status.HTTP_201_CREATED)
async def checkin(
    payload: CheckinRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL)),
):
    """
    RF05 — Realiza check-in georreferenciado na obra.
    Valida geofencing via Haversine e cria vistoria com checklist automático.
    """
    vistoria = await vistoria_service.fazer_checkin(db, current_user.id, payload)
    await registrar_auditoria(
        db, current_user.id, "Vistoria", str(vistoria.id), "CHECKIN",
        descricao=f"Check-in {'dentro' if vistoria.dentro_raio else 'fora'} do raio ({vistoria.distancia_metros:.0f}m)" if vistoria.distancia_metros else "Check-in realizado"
    )
    return vistoria


# ---------------------------------------------------------------------------
# Checklist
# ---------------------------------------------------------------------------
@router.get("/{vistoria_id}/checklist", response_model=List[ChecklistItemResponse])
async def get_checklist(
    vistoria_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL)),
):
    """RF06 — Retorna o checklist de itens a serem validados pelo fiscal."""
    return await vistoria_service.get_checklist(db, vistoria_id)


@router.patch("/checklist/{item_id}", response_model=ChecklistItemResponse)
async def update_checklist_item(
    item_id: UUID,
    payload: ChecklistItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL)),
):
    """RF06 — Atestar ou reprovar um item do checklist."""
    return await vistoria_service.update_checklist_item(db, item_id, payload)


# ---------------------------------------------------------------------------
# Upload de Foto (RN03)
# ---------------------------------------------------------------------------
@router.post("/{vistoria_id}/fotos", response_model=FotoUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_foto(
    vistoria_id: UUID,
    file: UploadFile = File(...),
    checklist_item_id: UUID | None = Form(default=None),
    latitude: float | None = Form(default=None),
    longitude: float | None = Form(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL)),
):
    """
    RF07 / RN03 — Upload de foto com metadados invioláveis.
    Gera hash SHA-256 e registra carimbo do servidor.
    Fotos da galeria são rejeitadas na validação do app mobile.
    """
    foto = await vistoria_service.upload_foto(
        db, vistoria_id, checklist_item_id, latitude, longitude, file
    )
    await registrar_auditoria(
        db, current_user.id, "FotoVistoria", str(foto.id), "UPLOAD",
        descricao=f"Foto registrada — hash: {foto.hash_sha256[:12]}..."
    )
    return foto


# ---------------------------------------------------------------------------
# Finalizar Vistoria
# ---------------------------------------------------------------------------
@router.post("/{vistoria_id}/finalizar", response_model=VistoriaResponse)
async def finalizar_vistoria(
    vistoria_id: UUID,
    payload: VistoriaFinalizarRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL)),
):
    """
    RN02 — Fiscal registra resultado final: CONFORME ou NAO_CONFORME.
    Observações são obrigatórias para não conformidade.
    """
    vistoria = await vistoria_service.finalizar_vistoria(db, vistoria_id, current_user.id, payload)
    await registrar_auditoria(
        db, current_user.id, "Vistoria", str(vistoria.id), "FINALIZAR",
        descricao=f"Vistoria finalizada como {vistoria.resultado}"
    )
    return vistoria


# ---------------------------------------------------------------------------
# Timestamp do Servidor (usado pelo app mobile para carimbo de fotos)
# ---------------------------------------------------------------------------
@router.get("/timestamp")
async def server_timestamp(
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL)),
):
    """Retorna o timestamp oficial do servidor para carimbo de fotos (RN03)."""
    from datetime import datetime, timezone
    return {"timestamp": datetime.now(timezone.utc).isoformat(), "timezone": "UTC"}
