"""
SIN-Obras — Serviço de E-mail Transacional (RF10)

Envio best-effort de e-mails via SMTP. Projetado para nunca quebrar o fluxo
principal: se o e-mail estiver desabilitado, sem host configurado ou se o envio
falhar, apenas registra um aviso e segue (a notificação no sistema continua
sendo a fonte de verdade).
"""
import asyncio
import logging
import smtplib
from email.message import EmailMessage

from app.core import settings

logger = logging.getLogger("sinobras.email")


def _send_sync(to_email: str, subject: str, body: str) -> None:
    msg = EmailMessage()
    msg["From"] = f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
        if settings.SMTP_USE_TLS:
            server.starttls()
        if settings.SMTP_USER:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)


async def send_email(to_email: str | None, subject: str, body: str) -> bool:
    """Envia um e-mail de forma assíncrona (best-effort). Retorna True se enviado."""
    if not settings.EMAIL_ENABLED or not settings.SMTP_HOST or not to_email:
        logger.debug("E-mail não enviado (desabilitado ou destinatário ausente): %s", subject)
        return False
    try:
        await asyncio.to_thread(_send_sync, to_email, subject, body)
        return True
    except Exception as exc:  # noqa: BLE001 — best-effort, não pode quebrar o fluxo
        logger.warning("Falha ao enviar e-mail para %s: %s", to_email, exc)
        return False
