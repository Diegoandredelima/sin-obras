"""
SIN-Obras — Router de Vistorias (Bloco 4 — Mobile)
Check-in georreferenciado, checklist, upload de fotos e finalização.
"""

from datetime import UTC
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.alerta import Alerta, PrioridadeAlerta, TipoAlerta
from app.models.objeto import Contrato, Objeto
from app.models.portal import Medicao, StatusMedicao
from app.models.usuario import Usuario
from app.models.vistoria import Vistoria
from app.schemas.vistoria import (
    CheckinRequest,
    ChecklistItemResponse,
    ChecklistItemUpdate,
    FotoUploadResponse,
    VistoriaFinalizarRequest,
    VistoriaResponse,
)
from app.services import vistoria as vistoria_service
from app.services.auditoria import registrar_auditoria
from app.services.notificacao import criar_notificacao

router = APIRouter(prefix="/vistorias", tags=["Vistorias (Mobile)"])

# Gravidade da pendência → prioridade do alerta (RF17).
_GRAVIDADE_PRIORIDADE = {
    "LEVE": PrioridadeAlerta.BAIXA,
    "GRAVE": PrioridadeAlerta.ALTA,
    "CRITICO": PrioridadeAlerta.CRITICA,
}


class PendenciaRequest(BaseModel):
    descricao: str
    gravidade: str = "GRAVE"  # LEVE | GRAVE | CRITICO
    prazo_dias: int | None = None


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
    RF05 — Realiza check-in georreferenciado na objeto.
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
@router.get("/{vistoria_id}/checklist", response_model=list[ChecklistItemResponse])
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
    from datetime import datetime
    return {"timestamp": datetime.now(UTC).isoformat(), "timezone": "UTC"}


# ---------------------------------------------------------------------------
# RF18 — Histórico da obra no app (vistorias, medições aprovadas e pendências)
# ---------------------------------------------------------------------------
@router.get("/objetos/{objeto_id}/historico")
async def historico_objeto(
    objeto_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL)),
):
    """Linha do tempo da obra para o app do fiscal (RF18)."""
    vistorias = (await db.execute(
        select(Vistoria).where(Vistoria.objeto_id == objeto_id).order_by(Vistoria.checkin_em.desc().nullslast())
    )).scalars().all()
    medicoes = (await db.execute(
        select(Medicao).where(
            Medicao.objeto_id == objeto_id, Medicao.status == StatusMedicao.APROVADA
        ).order_by(Medicao.criado_em.desc())
    )).scalars().all()
    pendencias = (await db.execute(
        select(Alerta).where(
            Alerta.objeto_id == objeto_id,
            Alerta.tipo == TipoAlerta.NOTIFICACAO_PENDENTE,
        ).order_by(Alerta.criado_em.desc())
    )).scalars().all()

    return {
        "vistorias": [
            {
                "id": str(v.id),
                "checkin_em": v.checkin_em.isoformat() if v.checkin_em else None,
                "resultado": v.resultado,
                "dentro_raio": v.dentro_raio,
                "observacoes": v.observacoes,
            }
            for v in vistorias
        ],
        "medicoes": [
            {
                "id": str(m.id),
                "numero_medicao": m.numero_medicao,
                "valor_medido": float(m.valor_medido or 0),
                "criado_em": m.criado_em.isoformat() if m.criado_em else None,
            }
            for m in medicoes
        ],
        "pendencias": [
            {
                "id": str(p.id),
                "titulo": p.titulo,
                "descricao": p.descricao,
                "prioridade": p.prioridade,
                "resolvido": p.resolvido,
                "criado_em": p.criado_em.isoformat() if p.criado_em else None,
            }
            for p in pendencias
        ],
    }


# ---------------------------------------------------------------------------
# RF17 — Registro de pendência / não conformidade + notificação
# ---------------------------------------------------------------------------
@router.post("/{vistoria_id}/pendencias", status_code=status.HTTP_201_CREATED)
async def registrar_pendencia(
    vistoria_id: UUID,
    payload: PendenciaRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL)),
):
    """Fiscal registra uma pendência e notifica empresa e apoio (RF17)."""
    vistoria = (await db.execute(
        select(Vistoria).where(Vistoria.id == vistoria_id)
    )).scalar_one_or_none()
    if not vistoria:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vistoria não encontrada.")

    prioridade = _GRAVIDADE_PRIORIDADE.get(payload.gravidade.upper(), PrioridadeAlerta.MEDIA)
    prazo = f" Prazo sugerido: {payload.prazo_dias} dias." if payload.prazo_dias else ""
    alerta = Alerta(
        objeto_id=vistoria.objeto_id,
        tipo=TipoAlerta.NOTIFICACAO_PENDENTE,
        prioridade=prioridade,
        titulo=f"Pendência [{payload.gravidade.upper()}] registrada em vistoria",
        descricao=f"{payload.descricao}{prazo}",
    )
    db.add(alerta)
    await db.flush()
    await registrar_auditoria(
        db, current_user.id, "Alerta", str(alerta.id), "PENDENCIA",
        descricao=f"Pendência registrada pelo fiscal (gravidade {payload.gravidade}).",
    )

    # Notifica apoio/coordenadores e a empresa do contrato (RF17).
    destinatarios = (await db.execute(
        select(Usuario).where(
            Usuario.tipo.in_([Role.APOIO_N2.value, Role.COORDENADOR.value, Role.ENGENHEIRO.value]),
            Usuario.ativo == True,  # noqa: E712
        )
    )).scalars().all()
    empresa_id = await db.scalar(
        select(Contrato.empresa_id).join(Objeto, Objeto.contrato_id == Contrato.id).where(Objeto.id == vistoria.objeto_id)
    )
    ids = {u.id for u in destinatarios}
    if empresa_id:
        ids.add(empresa_id)
    for uid in ids:
        await criar_notificacao(
            db=db, usuario_id=uid,
            titulo="Nova pendência registrada em vistoria",
            mensagem=payload.descricao,
        )

    return {"id": str(alerta.id), "titulo": alerta.titulo, "prioridade": alerta.prioridade}
