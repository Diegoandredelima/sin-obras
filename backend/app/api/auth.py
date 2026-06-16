"""
SIN-Obras — Router de Autenticação
Endpoints: login, refresh, me, logout
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    get_password_hash,
    verify_password,
)
from app.models.usuario import Usuario
from app.schemas.auth import (
    LoginRequest,
    MeResponse,
    RefreshRequest,
    TokenResponse,
    UsuarioCreateRequest,
    UsuarioResponse,
)
from app.services.auditoria import registrar_auditoria

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Autenticação por matrícula institucional (servidores) ou CNPJ (empresas).
    Retorna access_token e refresh_token.
    """
    result = await db.execute(
        select(Usuario).where(Usuario.matricula_cnpj == payload.matricula_cnpj)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.senha, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Matrícula/CNPJ ou senha incorretos.",
        )

    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo. Contate o administrador.",
        )

    # Gerar tokens
    token_data = {"sub": str(user.id), "role": user.tipo}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Registrar auditoria (RF12)
    await registrar_auditoria(
        db=db,
        usuario_id=user.id,
        entidade="Usuario",
        entidade_id=str(user.id),
        acao="LOGIN",
        descricao=f"Login realizado por {user.nome}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    """Renova o access token usando um refresh token válido."""
    decoded = decode_token(payload.refresh_token)

    if decoded.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token não é do tipo refresh.",
        )

    user_id = decoded.get("sub")
    role = decoded.get("role")

    token_data = {"sub": user_id, "role": role}
    new_access = create_access_token(token_data)
    new_refresh = create_refresh_token(token_data)

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me", response_model=MeResponse)
async def me(current_user: Usuario = Depends(get_current_user)):
    """Retorna os dados do usuário autenticado."""
    return MeResponse(usuario=UsuarioResponse.model_validate(current_user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Logout do usuário. Por ora, apenas registra a auditoria.
    Em produção, adicionar o token a uma blacklist (Redis).
    """
    await registrar_auditoria(
        db=db,
        usuario_id=current_user.id,
        entidade="Usuario",
        entidade_id=str(current_user.id),
        acao="LOGOUT",
        descricao=f"Logout realizado por {current_user.nome}",
        ip_address=request.client.host if request.client else None,
    )
    return None


# ---------------------------------------------------------------------------
# Endpoint administrativo para criar usuários (seed / dev)
# ---------------------------------------------------------------------------
@router.post(
    "/registrar",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
)
async def registrar_usuario(
    payload: UsuarioCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Cria um novo usuário no sistema.
    Em produção, este endpoint deve ser protegido com role COORDENADOR+.
    """
    # Verificar duplicidade
    existing = await db.execute(
        select(Usuario).where(
            (Usuario.matricula_cnpj == payload.matricula_cnpj)
            | (Usuario.email == payload.email)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Matrícula/CNPJ ou e-mail já cadastrado.",
        )

    user = Usuario(
        nome=payload.nome,
        email=payload.email,
        matricula_cnpj=payload.matricula_cnpj,
        senha_hash=get_password_hash(payload.senha),
        tipo=payload.tipo,
        telefone=payload.telefone,
        cargo=payload.cargo,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    return UsuarioResponse.model_validate(user)
