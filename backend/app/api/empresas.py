"""
SIN-Obras — Router de Empresas
Endpoints: Detalhe da empresa e seus contratos vinculados.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.cadastro import Empresa
from app.models.obra import Contrato, Obra
from app.models.usuario import Usuario
from app.schemas.empresa import ContratoResumo, EmpresaDetalhe

router = APIRouter(prefix="/empresas", tags=["Empresas"])


@router.get("/{id}", response_model=EmpresaDetalhe)
async def get_empresa(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    """Retorna os detalhes de uma empresa executora."""
    result = await db.execute(select(Empresa).where(Empresa.id == id))
    empresa = result.scalar_one_or_none()
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa não encontrada.")

    total_contratos = await db.scalar(
        select(func.count()).select_from(Contrato).where(Contrato.empresa_ref_id == id)
    )
    total_obras = await db.scalar(
        select(func.count()).select_from(Obra).where(Obra.empresa_ref_id == id)
    )

    return EmpresaDetalhe(
        id=empresa.id,
        razao_social=empresa.razao_social,
        cnpj=empresa.cnpj,
        criado_em=empresa.criado_em,
        total_contratos=total_contratos or 0,
        total_obras=total_obras or 0,
    )


@router.get("/{id}/contratos", response_model=list[ContratoResumo])
async def list_contratos_empresa(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    """Lista os contratos vinculados a uma empresa."""
    empresa = await db.scalar(select(Empresa.id).where(Empresa.id == id))
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa não encontrada.")

    result = await db.execute(
        select(Contrato)
        .where(Contrato.empresa_ref_id == id)
        .order_by(Contrato.criado_em.desc())
    )
    contratos = result.scalars().all()

    return [
        ContratoResumo(
            id=c.id,
            numero_contrato=c.numero_contrato,
            numero_processo=c.numero_processo,
            valor_global=float(c.valor_global),
            data_assinatura=c.data_assinatura.isoformat() if c.data_assinatura else None,
            data_vigencia=c.data_vigencia.isoformat() if c.data_vigencia else None,
            objeto=c.objeto,
            orgao=c.orgao,
        )
        for c in contratos
    ]
