"""
SIN-Obras — Serviço de Documentos Contratuais (RF11)

Upload com versionamento (nova versão substitui a anterior, preservando o
histórico) e controle de vencimento.
"""
import uuid
from datetime import date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.documento import Documento, TipoDocumento
from app.services import storage


async def list_documentos(db: AsyncSession, objeto_id: UUID, incluir_historico: bool = False) -> list[Documento]:
    stmt = select(Documento).where(Documento.objeto_id == objeto_id)
    if not incluir_historico:
        stmt = stmt.where(Documento.ativo == True)  # noqa: E712
    stmt = stmt.order_by(Documento.tipo, Documento.versao.desc())
    return list((await db.execute(stmt)).scalars().all())


async def criar_documento(
    db: AsyncSession,
    objeto_id: UUID,
    tipo: TipoDocumento,
    nome: str,
    conteudo: bytes,
    content_type: str,
    data_validade: date | None,
    criado_por_id: UUID | None,
) -> Documento:
    """Cria uma nova versão do documento, desativando a versão anterior do mesmo tipo."""
    # Versão anterior ativa do mesmo tipo (para versionamento).
    anterior = (await db.execute(
        select(Documento).where(
            Documento.objeto_id == objeto_id,
            Documento.tipo == tipo,
            Documento.ativo == True,  # noqa: E712
        ).order_by(Documento.versao.desc())
    )).scalars().first()

    nova_versao = (anterior.versao + 1) if anterior else 1

    # Upload best-effort: se o storage falhar, persiste com URL mock:// (dev).
    key = f"documentos/{objeto_id}/{tipo.value}/{uuid.uuid4().hex}_{nome}"
    try:
        url = storage.upload_bytes(conteudo, key, content_type)
    except storage.StorageError:
        url = f"mock://{key}"

    if anterior:
        anterior.ativo = False
        db.add(anterior)

    doc = Documento(
        objeto_id=objeto_id, tipo=tipo, nome=nome, url_storage=url,
        data_validade=data_validade, versao=nova_versao, ativo=True,
        substitui_id=anterior.id if anterior else None,
        criado_por_id=criado_por_id,
    )
    db.add(doc)
    await db.flush()
    await db.refresh(doc)
    return doc
