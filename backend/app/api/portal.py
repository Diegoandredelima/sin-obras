"""
SIN-Obras — Router do Portal da Empresa Executora
Endpoints: Diário de Obras, Medições (com assinatura e fluxo de fiscalização)
"""

from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.portal import OrigemMedicao
from app.models.usuario import Usuario
from app.schemas.portal import (
    DiarioCreate,
    DiarioResponse,
    DiarioUpdate,
    FotoMedicaoResponse,
    MedicaoAssinarRequest,
    MedicaoBoletimResponse,
    MedicaoConcluirRequest,
    MedicaoCreate,
    MedicaoFiscalRequest,
    MedicaoItemCreate,
    MedicaoItemResponse,
    MedicaoItemUpdate,
    MedicaoResponse,
    MedicaoUpdate,
)
from app.services import portal as portal_service
from app.services.auditoria import registrar_auditoria
from app.services.notificacao import criar_notificacao


def _bloquear_apoio_n1(user: Usuario):
    if user.tipo == Role.APOIO_N1:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Apoio N1 não tem acesso a medições e diário.")


router = APIRouter(prefix="/empresa", tags=["Portal da Empresa"])


# ---------------------------------------------------------------------------
# Diário de Obras
# ---------------------------------------------------------------------------
@router.get("/objetos/{objeto_id}/diario", response_model=list[DiarioResponse])
async def list_diario(
    objeto_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Lista todos os registros do Diário de Obras."""
    _bloquear_apoio_n1(current_user)
    return await portal_service.get_diario_by_obra(db, objeto_id)


@router.post("/objetos/{objeto_id}/diario", response_model=DiarioResponse, status_code=status.HTTP_201_CREATED)
async def create_diario(
    objeto_id: UUID,
    payload: DiarioCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Insere um novo registro no Diário de Obras."""
    _bloquear_apoio_n1(current_user)
    registro = await portal_service.create_diario(db, objeto_id, current_user.id, payload)
    await registrar_auditoria(db, current_user.id, "DiarioObra", str(registro.id), "CREATE",
                               dados_depois=payload.model_dump(mode="json"))
    return registro


@router.put("/diario/{id}", response_model=DiarioResponse)
async def update_diario(
    id: UUID,
    payload: DiarioUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Edita um registro do diário (somente pelo autor)."""
    _bloquear_apoio_n1(current_user)
    return await portal_service.update_diario(db, id, current_user.id, payload)


# ---------------------------------------------------------------------------
# Medições
# ---------------------------------------------------------------------------
@router.get("/objetos/{objeto_id}/medicoes", response_model=list[MedicaoResponse])
async def list_medicoes(
    objeto_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Lista as medições de uma objeto."""
    _bloquear_apoio_n1(current_user)
    return await portal_service.get_medicoes_by_obra(db, objeto_id)


@router.post("/objetos/{objeto_id}/medicoes", response_model=MedicaoResponse, status_code=status.HTTP_201_CREATED)
async def create_medicao(
    objeto_id: UUID,
    payload: MedicaoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Cria uma medição (boletim) em rascunho — fluxo da empresa."""
    _bloquear_apoio_n1(current_user)
    payload.objeto_id = objeto_id
    medicao = await portal_service.create_medicao(db, current_user.id, payload, OrigemMedicao.EMPRESA)
    await registrar_auditoria(db, current_user.id, "Medicao", str(medicao.id), "CREATE",
                               descricao=f"Medição #{medicao.numero_medicao} criada como rascunho")
    return medicao


@router.post("/objetos/{objeto_id}/medicoes/fiscal", response_model=MedicaoResponse, status_code=status.HTTP_201_CREATED)
async def create_medicao_fiscal(
    objeto_id: UUID,
    payload: MedicaoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL))
):
    """Cria uma medição de origem FISCAL (o fiscal mede diretamente, com foto)."""
    payload.objeto_id = objeto_id
    medicao = await portal_service.create_medicao(db, current_user.id, payload, OrigemMedicao.FISCAL)
    await registrar_auditoria(db, current_user.id, "Medicao", str(medicao.id), "CREATE",
                               descricao=f"Medição #{medicao.numero_medicao} criada pelo fiscal")
    return medicao


@router.get("/medicoes/{id}", response_model=MedicaoResponse)
async def get_medicao(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Detalhes de uma medição."""
    _bloquear_apoio_n1(current_user)
    return await portal_service.get_medicao_by_id(db, id)


@router.put("/medicoes/{id}", response_model=MedicaoResponse)
async def update_medicao(
    id: UUID,
    payload: MedicaoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Edita o cabeçalho de um rascunho de medição."""
    _bloquear_apoio_n1(current_user)
    return await portal_service.update_medicao(db, id, current_user.id, payload)


@router.get("/medicoes/{id}/boletim", response_model=MedicaoBoletimResponse)
async def get_boletim(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Boletim de Medição calculado (físico-financeiro com as 7 colunas)."""
    _bloquear_apoio_n1(current_user)
    medicao = await portal_service.get_medicao_by_id(db, id)
    return await portal_service.montar_boletim(db, medicao)


# ---------------------------------------------------------------------------
# Itens do boletim
# ---------------------------------------------------------------------------
@router.post("/medicoes/{id}/itens", response_model=MedicaoItemResponse, status_code=status.HTTP_201_CREATED)
async def add_item(
    id: UUID,
    payload: MedicaoItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Adiciona uma linha (evento) ao boletim de um rascunho."""
    _bloquear_apoio_n1(current_user)
    return await portal_service.add_item(db, id, current_user.id, payload)


@router.put("/medicoes/itens/{item_id}", response_model=MedicaoItemResponse)
async def update_item(
    item_id: UUID,
    payload: MedicaoItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Edita uma linha do boletim (somente em rascunho)."""
    _bloquear_apoio_n1(current_user)
    return await portal_service.update_item(db, item_id, current_user.id, payload)


@router.delete("/medicoes/itens/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Remove uma linha do boletim (somente em rascunho)."""
    _bloquear_apoio_n1(current_user)
    await portal_service.remove_item(db, item_id, current_user.id)


# ---------------------------------------------------------------------------
# Fotos invioláveis da medição (RN03)
# ---------------------------------------------------------------------------
@router.post("/medicoes/{id}/fotos", response_model=FotoMedicaoResponse, status_code=status.HTTP_201_CREATED)
async def upload_foto_medicao(
    id: UUID,
    file: UploadFile = File(...),
    medicao_item_id: UUID | None = Form(default=None),
    latitude: float | None = Form(default=None),
    longitude: float | None = Form(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """Anexa foto de validação à medição (opcionalmente vinculada a um item)."""
    _bloquear_apoio_n1(current_user)
    foto = await portal_service.upload_foto_medicao(
        db, id, current_user.id, medicao_item_id, latitude, longitude, file
    )
    await registrar_auditoria(db, current_user.id, "FotoMedicao", str(foto.id), "UPLOAD",
                               descricao=f"Foto registrada — hash: {foto.hash_sha256[:12]}...")
    return foto


@router.post("/medicoes/{id}/concluir", response_model=MedicaoResponse)
async def concluir_medicao(
    id: UUID,
    payload: MedicaoConcluirRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL))
):
    """Fiscal conclui (atesta) uma medição de origem fiscal — vai direto a APROVADA."""
    medicao = await portal_service.concluir_medicao_fiscal(db, id, current_user.id, payload.observacao)
    await registrar_auditoria(db, current_user.id, "Medicao", str(medicao.id), "CONCLUIR",
                               descricao=f"Medição #{medicao.numero_medicao} concluída pelo fiscal")
    return medicao


@router.post("/medicoes/{id}/assinar", response_model=MedicaoResponse)
async def assinar_medicao(
    id: UUID,
    payload: MedicaoAssinarRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA))
):
    """
    Assina digitalmente a medição e envia para fiscalização.
    RN01 — Requer ART ativa vinculada à objeto.
    """
    _bloquear_apoio_n1(current_user)
    medicao = await portal_service.assinar_medicao(db, id, current_user.id)
    await registrar_auditoria(db, current_user.id, "Medicao", str(medicao.id), "ASSINAR",
                               descricao=f"Medição #{medicao.numero_medicao} assinada (hash: {medicao.hash_assinatura[:12]}...)")
    return medicao


@router.post("/medicoes/{id}/avaliar", response_model=MedicaoResponse)
async def avaliar_medicao(
    id: UUID,
    payload: MedicaoFiscalRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL))
):
    """
    Fiscal aprova ou reprova uma medição.
    RN02 — Resultado altera status da medição.
    """
    medicao = await portal_service.avaliar_medicao(db, id, payload.aprovada, payload.observacao_fiscal)

    status_label = "APROVADA" if payload.aprovada else "REPROVADA"
    await registrar_auditoria(db, current_user.id, "Medicao", str(medicao.id), "AVALIAR",
                               descricao=f"Medição #{medicao.numero_medicao} {status_label} pelo fiscal")

    # Notificar a empresa (quando há conta vinculada)
    if medicao.empresa_usuario_id:
        await criar_notificacao(
            db=db,
            usuario_id=medicao.empresa_usuario_id,
            titulo=f"Medição #{medicao.numero_medicao} {status_label}",
            mensagem=payload.observacao_fiscal or f"Sua medição foi {status_label.lower()} pelo fiscal responsável.",
        )

    return medicao
