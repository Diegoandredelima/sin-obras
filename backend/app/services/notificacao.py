"""
SIN-Obras — Serviço de Notificações

Gerencia o disparo de alertas internos do sistema e notificações por canais externos
(como e-mail). É acionado para informar engenheiros sobre vistorias agendadas,
alertar fiscais sobre medições pendentes e enviar avisos de atraso em obras.
"""

from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.portal import Notificacao, CanalNotificacao


async def criar_notificacao(
    db: AsyncSession,
    usuario_id: UUID,
    titulo: str,
    mensagem: str | None = None,
    canal: CanalNotificacao = CanalNotificacao.SISTEMA,
) -> Notificacao:
    """Cria e persiste uma notificação para o usuário."""
    notif = Notificacao(
        usuario_id=usuario_id,
        titulo=titulo,
        mensagem=mensagem,
        canal=canal,
    )
    db.add(notif)
    await db.flush()
    return notif


async def get_notificacoes(db: AsyncSession, usuario_id: UUID, apenas_nao_lidas: bool = False):
    query = select(Notificacao).where(Notificacao.usuario_id == usuario_id)
    if apenas_nao_lidas:
        query = query.where(Notificacao.lida == False)
    query = query.order_by(Notificacao.criado_em.desc())
    result = await db.execute(query)
    return result.scalars().all()


async def count_nao_lidas(db: AsyncSession, usuario_id: UUID) -> int:
    result = await db.execute(
        select(func.count(Notificacao.id)).where(
            Notificacao.usuario_id == usuario_id,
            Notificacao.lida == False
        )
    )
    return result.scalar_one()


async def marcar_como_lida(db: AsyncSession, notif_id: UUID, usuario_id: UUID) -> Notificacao | None:
    result = await db.execute(
        select(Notificacao).where(
            Notificacao.id == notif_id,
            Notificacao.usuario_id == usuario_id
        )
    )
    notif = result.scalar_one_or_none()
    if notif:
        notif.lida = True
        db.add(notif)
        await db.flush()
    return notif
