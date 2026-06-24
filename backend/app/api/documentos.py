"""
SIN-Obras — Router de Emissão de Documentos (XLS)

Endpoints de download dos documentos de objeto em XLS. Os PDFs equivalentes são
gerados no frontend (rotas de impressão com PrintLayout); aqui servimos apenas
o formato de planilha. Acesso restrito a FISCAL ou superior, como os demais
exports de relatório.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.usuario import Usuario
from app.services import export_documentos as docs

router = APIRouter(prefix="/documentos", tags=["Documentos"])

XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def _stream(buf, filename: str) -> StreamingResponse:
    return StreamingResponse(
        buf, media_type=XLSX_MIME,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _so_xls(formato: str) -> None:
    if formato != "xls":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este endpoint gera apenas XLS. O PDF é emitido pela rota de impressão.",
        )


@router.get("/medicoes/{medicao_id}/boletim")
async def boletim_documento(
    medicao_id: UUID,
    formato: str = Query("xls", pattern="^(xls)$"),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL)),
):
    _so_xls(formato)
    buf, filename = await docs.gerar_boletim_xlsx(db, medicao_id)
    return _stream(buf, filename)


@router.get("/medicoes/{medicao_id}/memoria-calculo")
async def memoria_documento(
    medicao_id: UUID,
    formato: str = Query("xls", pattern="^(xls)$"),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL)),
):
    _so_xls(formato)
    buf, filename = await docs.gerar_memoria_xlsx(db, medicao_id)
    return _stream(buf, filename)


@router.get("/diario/{diario_id}/rdo")
async def rdo_documento(
    diario_id: UUID,
    formato: str = Query("xls", pattern="^(xls)$"),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.FISCAL)),
):
    _so_xls(formato)
    buf, filename = await docs.gerar_rdo_xlsx(db, diario_id)
    return _stream(buf, filename)
