"""
SIN-Obras — Serviço de Auditoria
Registra todas as ações no AuditLog imutável (RF12).
"""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auditoria import AuditLog


async def registrar_auditoria(
    db: AsyncSession,
    usuario_id: UUID,
    entidade: str,
    entidade_id: str,
    acao: str,
    dados_antes: dict | None = None,
    dados_depois: dict | None = None,
    descricao: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> AuditLog:
    """
    Cria um registro imutável na trilha de auditoria.
    Chamado automaticamente pelos endpoints que modificam dados.
    """
    log = AuditLog(
        usuario_id=usuario_id,
        entidade=entidade,
        entidade_id=str(entidade_id),
        acao=acao,
        dados_antes=dados_antes,
        dados_depois=dados_depois,
        descricao=descricao,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(log)
    # Não faz commit aqui — será feito pela sessão do request
    return log
