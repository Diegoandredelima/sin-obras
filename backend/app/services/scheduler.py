"""
SIN-Obras — Agendador de Tarefas (RF27)

Jobs periódicos com APScheduler:
- Geração diária de alertas automáticos (fecha a pendência de "alertas agendados").
- Relatório executivo mensal enviado por e-mail aos coordenadores/secretários
  no dia 5 de cada mês (RF27).

O agendador é best-effort: falhas em um job são registradas e não derrubam a app.
"""
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select

from app.core import settings
from app.core.database import AsyncSessionLocal
from app.core.rbac import Role
from app.models.usuario import Usuario
from app.services import dashboard as dashboard_service
from app.services.alerta import gerar_alertas
from app.services.email import send_email

logger = logging.getLogger("sinobras.scheduler")

_scheduler: AsyncIOScheduler | None = None


async def _job_gerar_alertas() -> None:
    """Job diário: gera alertas automáticos para o portfólio."""
    try:
        async with AsyncSessionLocal() as db:
            criados = await gerar_alertas(db)
            await db.commit()
            logger.info("Job de alertas: %s alerta(s) gerado(s).", criados)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Falha no job de alertas: %s", exc)


def _formatar_relatorio(dados: dict) -> str:
    linhas = [
        "Relatório Executivo Mensal — SIN-Obras",
        "",
        f"Obras ativas: {dados['total_objetos']}",
        f"Em execução: {dados['em_execucao']}",
        f"Investimento ativo: R$ {dados['valor_investido']:,.2f}",
        f"Total medido: R$ {dados['valor_medido']:,.2f}",
        f"Execução global: {dados['pct_execucao_global']}%",
        f"Obras críticas (vermelho): {dados['obras_criticas']}",
        f"Obras em atenção (amarelo): {dados['obras_atencao']}",
        "",
        "Municípios mais impactados:",
    ]
    for m in dados.get("top_municipios", [])[:5]:
        linhas.append(f"  - {m['municipio']}: {m['total']} obras · R$ {m['valor']:,.2f}")
    return "\n".join(linhas)


async def _job_relatorio_mensal() -> None:
    """Job mensal: envia o relatório executivo por e-mail aos gestores."""
    try:
        async with AsyncSessionLocal() as db:
            dados = await dashboard_service.get_dashboard_executivo(db)
            corpo = _formatar_relatorio(dados)
            gestores = (await db.execute(
                select(Usuario).where(
                    Usuario.tipo.in_([Role.COORDENADOR.value, Role.SECRETARIO.value]),
                    Usuario.ativo == True,  # noqa: E712
                )
            )).scalars().all()
            for g in gestores:
                await send_email(g.email, "Relatório Executivo Mensal — SIN-Obras", corpo)
            logger.info("Relatório mensal enviado para %s gestor(es).", len(gestores))
    except Exception as exc:  # noqa: BLE001
        logger.warning("Falha no job de relatório mensal: %s", exc)


def start_scheduler() -> None:
    """Inicia o agendador (chamado no lifespan do FastAPI)."""
    global _scheduler
    if not settings.SCHEDULER_ENABLED or _scheduler is not None:
        return
    _scheduler = AsyncIOScheduler(timezone="America/Recife")
    # Alertas diários às 06:00.
    _scheduler.add_job(_job_gerar_alertas, CronTrigger(hour=6, minute=0), id="alertas_diarios", replace_existing=True)
    # Relatório mensal no dia 5 às 08:00.
    _scheduler.add_job(_job_relatorio_mensal, CronTrigger(day=5, hour=8, minute=0), id="relatorio_mensal", replace_existing=True)
    _scheduler.start()
    logger.info("Agendador iniciado (alertas diários + relatório mensal).")


def shutdown_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
