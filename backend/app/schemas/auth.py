"""
SIN-Obras — Schemas de Autenticação (Pydantic)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.core.rbac import Role


# ---------------------------------------------------------------------------
# Request Schemas
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    """Payload de login — aceita matrícula ou CNPJ + senha."""
    matricula_cnpj: str = Field(
        ..., min_length=5, description="Matrícula institucional (≥5 dígitos) ou CNPJ"
    )
    senha: str = Field(..., min_length=6, description="Senha do usuário")


class RefreshRequest(BaseModel):
    """Payload para renovar o access token."""
    refresh_token: str


class UsuarioCreateRequest(BaseModel):
    """Payload para criar um novo usuário (uso administrativo)."""
    nome: str = Field(..., min_length=2, max_length=255)
    email: str = Field(..., max_length=255)
    matricula_cnpj: str = Field(..., min_length=5, max_length=20)
    senha: str = Field(..., min_length=6)
    tipo: Role
    telefone: str | None = None
    cargo: str | None = None


# ---------------------------------------------------------------------------
# Response Schemas
# ---------------------------------------------------------------------------
class TokenResponse(BaseModel):
    """Resposta com tokens JWT."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(
        description="Tempo de expiração do access token em segundos"
    )


class UsuarioResponse(BaseModel):
    """Dados do usuário retornados pela API."""
    id: UUID
    nome: str
    email: str
    matricula_cnpj: str
    tipo: Role
    ativo: bool
    telefone: str | None = None
    cargo: str | None = None
    criado_em: datetime

    model_config = {"from_attributes": True}


class MeResponse(BaseModel):
    """Dados do usuário logado."""
    usuario: UsuarioResponse
