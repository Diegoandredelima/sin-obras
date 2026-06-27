"""
SIN-Obras — Router de Documentos Contratuais (RF11)

Upload com versionamento, listagem e histórico de documentos do contrato/obra
(ART, plantas, licenças, garantias, seguros), com controle de vencimento.
"""
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.documento import TipoDocumento
from app.models.usuario import Usuario
from app.schemas.documento import DocumentoResponse
from app.services import documento as doc_service
from app.services.auditoria import registrar_auditoria

router = APIRouter(prefix="/documentos-contratuais", tags=["Documentos Contratuais"])


@router.get("/objetos/{objeto_id}", response_model=list[DocumentoResponse])
async def listar_documentos(
    objeto_id: UUID,
    incluir_historico: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    """Lista os documentos do objeto (versões correntes; histórico opcional)."""
    return await doc_service.list_documentos(db, objeto_id, incluir_historico)


@router.post("/objetos/{objeto_id}", response_model=DocumentoResponse, status_code=status.HTTP_201_CREATED)
async def upload_documento(
    objeto_id: UUID,
    tipo: TipoDocumento = Form(...),
    nome: str = Form(...),
    data_validade: date | None = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    """Faz upload de uma nova versão do documento (RF11)."""
    conteudo = await file.read()
    doc = await doc_service.criar_documento(
        db, objeto_id, tipo, nome, conteudo,
        file.content_type or "application/octet-stream", data_validade, current_user.id,
    )
    await registrar_auditoria(
        db, current_user.id, "Documento", str(doc.id), "UPLOAD",
        descricao=f"Documento {tipo.value} '{nome}' (v{doc.versao}) enviado",
    )
    return doc
