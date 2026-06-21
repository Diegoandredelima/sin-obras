"""
SIN-Obras — RBAC (Role-Based Access Control)
Define os perfis do sistema e decorators para proteger endpoints.

Hierarquia:
  EMPRESA < FISCAL < APOIO_N1 < APOIO_N2 < COORDENADOR < SECRETARIO
"""

import enum

from fastapi import Depends, HTTPException, status

from app.core.security import get_current_user


class Role(str, enum.Enum):
    """Perfis do sistema, ordenados do menor ao maior privilégio."""
    EMPRESA = "EMPRESA"
    FISCAL = "FISCAL"
    APOIO_N1 = "APOIO_N1"
    APOIO_N2 = "APOIO_N2"
    COORDENADOR = "COORDENADOR"
    SECRETARIO = "SECRETARIO"
    # --- legado (mantido para compatibilidade) ---
    ENGENHEIRO = "ENGENHEIRO"


# Hierarquia de privilégios (índice maior = mais privilégio)
_ROLE_HIERARCHY = {
    Role.EMPRESA: 0,
    Role.FISCAL: 1,
    Role.APOIO_N1: 2,
    Role.APOIO_N2: 3,
    Role.ENGENHEIRO: 3,   # legado ≈ APOIO_N2
    Role.COORDENADOR: 4,
    Role.SECRETARIO: 5,
}


def require_role(*allowed_roles: Role):
    """
    Dependency factory que verifica se o usuário logado possui uma das roles permitidas.

    Uso:
        @router.get("/rota", dependencies=[Depends(require_role(Role.ENGENHEIRO, Role.COORDENADOR))])
        async def minha_rota():
            ...

    Ou como parâmetro:
        async def minha_rota(user = Depends(require_role(Role.ENGENHEIRO))):
            ...
    """
    async def _check_role(current_user=Depends(get_current_user)):
        user_role = Role(current_user.tipo)
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado. Perfis permitidos: {[r.value for r in allowed_roles]}. "
                       f"Seu perfil: {user_role.value}.",
            )
        return current_user

    return _check_role


def require_minimum_role(minimum_role: Role):
    """
    Dependency factory que verifica se o usuário tem pelo menos o nível de acesso mínimo.

    Usa a hierarquia de roles: EMPRESA < FISCAL < ENGENHEIRO < COORDENADOR < SECRETARIO

    Uso:
        @router.post("/rota", dependencies=[Depends(require_minimum_role(Role.ENGENHEIRO))])
    """
    async def _check_minimum(current_user=Depends(get_current_user)):
        user_role = Role(current_user.tipo)
        if _ROLE_HIERARCHY.get(user_role, -1) < _ROLE_HIERARCHY.get(minimum_role, 99):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado. Nível mínimo requerido: {minimum_role.value}. "
                       f"Seu perfil: {user_role.value}.",
            )
        return current_user

    return _check_minimum
