"""
SIN-Obras — Serviço de Vistoria
Implementa: Check-in com PostGIS, geofencing, checklist, fotos invioláveis (RN03)
"""

import hashlib
import math
from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.obra import Obra
from app.models.portal import Medicao
from app.models.vistoria import ChecklistItem, FotoVistoria, ResultadoVistoria, Vistoria
from app.schemas.vistoria import CheckinRequest, ChecklistItemUpdate, VistoriaFinalizarRequest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _haversine_metros(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcula distância em metros entre dois pontos geográficos."""
    R = 6_371_000  # raio da Terra em metros
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ---------------------------------------------------------------------------
# Check-in
# ---------------------------------------------------------------------------
async def fazer_checkin(
    db: AsyncSession,
    fiscal_id: UUID,
    payload: CheckinRequest,
) -> Vistoria:
    """
    RF05 — Check-in georreferenciado:
    1. Obtém coordenadas da obra
    2. Calcula distância com Haversine
    3. Compara com raio configurado na obra
    4. Cria registro de vistoria com resultado georreferenciado
    """
    # Buscar obra
    obra_result = await db.execute(select(Obra).where(Obra.id == payload.obra_id, Obra.ativo == True))
    obra = obra_result.scalar_one_or_none()
    if not obra:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obra não encontrada.")

    # Extrair coordenadas da obra (PostGIS)
    obra_lat, obra_lon = None, None
    if obra.localizacao is not None:
        # GeoAlchemy2 retorna WKBElement; precisamos converter
        from geoalchemy2.shape import to_shape
        try:
            ponto = to_shape(obra.localizacao)
            obra_lat, obra_lon = ponto.y, ponto.x
        except Exception:
            pass

    # Calcular distância
    distancia = None
    dentro_raio = False
    if obra_lat is not None:
        distancia = _haversine_metros(payload.latitude, payload.longitude, obra_lat, obra_lon)
        dentro_raio = distancia <= obra.raio_geofencing_metros

    # Criar vistoria
    vistoria = Vistoria(
        obra_id=payload.obra_id,
        fiscal_id=fiscal_id,
        medicao_id=payload.medicao_id,
        local_checkin=f"SRID=4326;POINT({payload.longitude} {payload.latitude})",
        checkin_em=datetime.now(UTC),
        dentro_raio=dentro_raio,
        distancia_metros=distancia,
        resultado=ResultadoVistoria.PENDENTE,
    )
    db.add(vistoria)
    await db.flush()

    # Gerar checklist a partir dos eventos declarados na medição
    if payload.medicao_id:
        med_result = await db.execute(select(Medicao).where(Medicao.id == payload.medicao_id))
        medicao = med_result.scalar_one_or_none()
        if medicao and medicao.eventos_declarados:
            for ev in medicao.eventos_declarados:
                item = ChecklistItem(
                    vistoria_id=vistoria.id,
                    evento_id=ev["evento_id"],
                )
                db.add(item)

    await db.flush()
    await db.refresh(vistoria)
    return vistoria


# ---------------------------------------------------------------------------
# Checklist
# ---------------------------------------------------------------------------
async def get_checklist(db: AsyncSession, vistoria_id: UUID):
    result = await db.execute(select(ChecklistItem).where(ChecklistItem.vistoria_id == vistoria_id))
    return result.scalars().all()


async def update_checklist_item(
    db: AsyncSession,
    item_id: UUID,
    payload: ChecklistItemUpdate,
) -> ChecklistItem:
    result = await db.execute(select(ChecklistItem).where(ChecklistItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item de checklist não encontrado.")
    item.atestado = payload.atestado
    item.observacao = payload.observacao
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


# ---------------------------------------------------------------------------
# Upload de Foto (RN03)
# ---------------------------------------------------------------------------
async def upload_foto(
    db: AsyncSession,
    vistoria_id: UUID,
    checklist_item_id: UUID | None,
    latitude: float | None,
    longitude: float | None,
    file: UploadFile,
) -> FotoVistoria:
    """
    RN03 — Foto inviolável:
    1. Lê os bytes da foto
    2. Gera hash SHA-256
    3. Registra carimbo de tempo do SERVIDOR (não do dispositivo)
    4. Armazena metadados de localização
    """
    # Validar tipo de arquivo
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tipo de arquivo inválido. Use JPEG, PNG ou WebP.")

    conteudo = await file.read()
    if len(conteudo) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Arquivo vazio.")

    # Hash SHA-256
    hash_sha256 = hashlib.sha256(conteudo).hexdigest()

    # Carimbo do servidor (inviolável)
    agora = datetime.now(UTC)

    # Em produção: fazer upload para S3/MinIO aqui
    # Por enquanto, apenas registramos os metadados
    url_storage = f"mock://fotos/{vistoria_id}/{hash_sha256[:16]}.jpg"

    coordenadas_wkt = None
    if latitude is not None and longitude is not None:
        coordenadas_wkt = f"SRID=4326;POINT({longitude} {latitude})"

    foto = FotoVistoria(
        vistoria_id=vistoria_id,
        checklist_item_id=checklist_item_id,
        url_storage=url_storage,
        filename=file.filename,
        coordenadas=coordenadas_wkt,
        hash_sha256=hash_sha256,
        carimbo_servidor=agora,
        exif_metadata={"latitude": latitude, "longitude": longitude},
        origem_camera=True,
    )
    db.add(foto)
    await db.flush()
    await db.refresh(foto)
    return foto


# ---------------------------------------------------------------------------
# Finalizar Vistoria
# ---------------------------------------------------------------------------
async def finalizar_vistoria(
    db: AsyncSession,
    vistoria_id: UUID,
    fiscal_id: UUID,
    payload: VistoriaFinalizarRequest,
) -> Vistoria:
    """RN02 — Fiscal registra resultado CONFORME ou NAO_CONFORME."""
    result = await db.execute(select(Vistoria).where(Vistoria.id == vistoria_id))
    vistoria = result.scalar_one_or_none()
    if not vistoria:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vistoria não encontrada.")
    if vistoria.fiscal_id != fiscal_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado.")
    if vistoria.resultado != ResultadoVistoria.PENDENTE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vistoria já foi finalizada.")
    if payload.resultado == ResultadoVistoria.NAO_CONFORME and not payload.observacoes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Observações são obrigatórias para 'Não Conforme'.")

    vistoria.resultado = payload.resultado
    vistoria.observacoes = payload.observacoes
    vistoria.finalizada_em = datetime.now(UTC)
    db.add(vistoria)
    await db.flush()
    await db.refresh(vistoria)
    return vistoria
