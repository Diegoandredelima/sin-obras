"""
SIN-Obras — Aplicação Principal FastAPI
Sistema Integrado de Obras da Secretaria de Infraestrutura do RN.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core import settings
from app.core.database import engine, Base
from app.api.auth import router as auth_router
from app.api.obras import router as obras_router
from app.api.contratos import router as contratos_router
from app.api.cronograma import router as cronograma_router
from app.api.tarefas import router as tarefas_router
from app.api.art_rrt import router as art_rrt_router
from app.api.portal import router as portal_router
from app.api.notificacoes import router as notificacoes_router
from app.api.vistorias import router as vistorias_router
from app.api.orgaos import router as orgaos_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle handler: cria as tabelas no startup (dev mode).
    Em produção, usar exclusivamente Alembic migrations.
    """
    async with engine.begin() as conn:
        # Habilitar PostGIS
        await conn.execute(
            __import__("sqlalchemy").text("CREATE EXTENSION IF NOT EXISTS postgis")
        )
        # Importar todos os models para que Base.metadata os conheça
        import app.models  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "API do Sistema Integrado de Obras (SIN-RN) — "
        "Gestão de obras públicas, fiscalização, medições e inteligência preditiva."
    ),
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth_router, prefix="/api")
app.include_router(obras_router, prefix="/api")
app.include_router(contratos_router, prefix="/api")
app.include_router(cronograma_router, prefix="/api")
app.include_router(tarefas_router, prefix="/api")
app.include_router(art_rrt_router, prefix="/api")
app.include_router(portal_router, prefix="/api")
app.include_router(notificacoes_router, prefix="/api")
app.include_router(vistorias_router, prefix="/api")
app.include_router(orgaos_router, prefix="/api")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/api/health", tags=["Sistema"])
async def health_check():
    """Verifica se a API está respondendo."""
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }
