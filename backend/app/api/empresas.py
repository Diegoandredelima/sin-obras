"""
SIN-Obras — Router de Empresas
Endpoints: listagem, cadastro, edição, detalhe da empresa e contratos vinculados.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rbac import Role, require_minimum_role
from app.models.cadastro import Empresa
from app.models.objeto import Contrato, Objeto
from app.models.usuario import Usuario
from app.schemas.empresa import (
    ContratoResumo,
    EmpresaCreate,
    EmpresaDetalhe,
    EmpresaListItem,
    EmpresaUpdate,
)

router = APIRouter(prefix="/empresas", tags=["Empresas"])


async def _contadores(db: AsyncSession, empresa_id: UUID) -> tuple[int, int]:
    total_contratos = await db.scalar(
        select(func.count()).select_from(Contrato).where(Contrato.empresa_ref_id == empresa_id)
    )
    # Objetos ligam-se à empresa via contrato (Objeto.contrato_id -> Contrato.empresa_ref_id)
    total_objetos = await db.scalar(
        select(func.count())
        .select_from(Objeto)
        .join(Contrato, Objeto.contrato_id == Contrato.id)
        .where(Contrato.empresa_ref_id == empresa_id)
    )
    return total_contratos or 0, total_objetos or 0


@router.get("", response_model=list[EmpresaListItem])
async def list_empresas(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.EMPRESA)),
):
    """Lista todas as empresas cadastradas com contadores de contratos e objetos."""
    contratos_sub = (
        select(Contrato.empresa_ref_id, func.count().label("n"))
        .group_by(Contrato.empresa_ref_id)
        .subquery()
    )
    objetos_sub = (
        select(Contrato.empresa_ref_id.label("empresa_ref_id"), func.count(Objeto.id).label("n"))
        .join(Objeto, Objeto.contrato_id == Contrato.id)
        .group_by(Contrato.empresa_ref_id)
        .subquery()
    )

    result = await db.execute(
        select(
            Empresa,
            func.coalesce(contratos_sub.c.n, 0),
            func.coalesce(objetos_sub.c.n, 0),
        )
        .outerjoin(contratos_sub, contratos_sub.c.empresa_ref_id == Empresa.id)
        .outerjoin(objetos_sub, objetos_sub.c.empresa_ref_id == Empresa.id)
        .order_by(Empresa.razao_social)
    )

    return [
        EmpresaListItem(
            **{c.name: getattr(e, c.name) for c in Empresa.__table__.columns},
            total_contratos=n_contratos,
            total_objetos=n_objetos,
        )
        for e, n_contratos, n_objetos in result.all()
    ]


@router.post("", response_model=EmpresaDetalhe, status_code=status.HTTP_201_CREATED)
async def create_empresa(
    payload: EmpresaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N2)),
):
    """Cadastra uma nova empresa executora."""
    existente = await db.scalar(
        select(Empresa.id).where(Empresa.razao_social == payload.razao_social)
    )
    if existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma empresa com essa razão social.",
        )
    if payload.cnpj:
        cnpj_existente = await db.scalar(select(Empresa.id).where(Empresa.cnpj == payload.cnpj))
        if cnpj_existente:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe uma empresa com esse CNPJ.",
            )

    empresa = Empresa(**payload.model_dump())
    db.add(empresa)
    await db.commit()
    await db.refresh(empresa)

    return EmpresaDetalhe(
        **{c.name: getattr(empresa, c.name) for c in Empresa.__table__.columns},
        total_contratos=0,
        total_objetos=0,
    )


@router.patch("/{id}", response_model=EmpresaDetalhe)
async def update_empresa(
    id: UUID,
    payload: EmpresaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_minimum_role(Role.APOIO_N2)),
):
    """Edita os dados cadastrais de uma empresa."""
    empresa = await db.scalar(select(Empresa).where(Empresa.id == id))
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa não encontrada.")

    dados = payload.model_dump(exclude_unset=True)

    nova_razao = dados.get("razao_social")
    if nova_razao and nova_razao != empresa.razao_social:
        conflito = await db.scalar(
            select(Empresa.id).where(Empresa.razao_social == nova_razao, Empresa.id != id)
        )
        if conflito:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe uma empresa com essa razão social.",
            )

    novo_cnpj = dados.get("cnpj")
    if novo_cnpj and novo_cnpj != empresa.cnpj:
        conflito = await db.scalar(
            select(Empresa.id).where(Empresa.cnpj == novo_cnpj, Empresa.id != id)
        )
        if conflito:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe uma empresa com esse CNPJ.",
            )

    for campo, valor in dados.items():
        setattr(empresa, campo, valor)

    await db.commit()
    await db.refresh(empresa)

    total_contratos, total_objetos = await _contadores(db, empresa.id)
    return EmpresaDetalhe(
        **{c.name: getattr(empresa, c.name) for c in Empresa.__table__.columns},
        total_contratos=total_contratos,
        total_objetos=total_objetos,
    )


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

    total_contratos, total_objetos = await _contadores(db, empresa.id)

    return EmpresaDetalhe(
        **{c.name: getattr(empresa, c.name) for c in Empresa.__table__.columns},
        total_contratos=total_contratos,
        total_objetos=total_objetos,
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
