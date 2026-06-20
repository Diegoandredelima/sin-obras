"""
SIN-Obras — Aplicação Principal FastAPI
Sistema Integrado de Obras da Secretaria de Infraestrutura do RN.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import text

from app.api.art_rrt import router as art_rrt_router
from app.api.auth import router as auth_router
from app.api.contratos import router as contratos_router
from app.api.cronograma import router as cronograma_router
from app.api.empresas import router as empresas_router
from app.api.notificacoes import router as notificacoes_router
from app.api.obras import router as obras_router
from app.api.orgaos import router as orgaos_router
from app.api.portal import router as portal_router
from app.api.relatorios import router as relatorios_router
from app.api.tarefas import router as tarefas_router
from app.api.vistorias import router as vistorias_router
from app.core import settings
from app.core.database import Base, engine

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle handler: cria as tabelas no startup (dev mode).
    Em produção, usar exclusivamente Alembic migrations.
    """
    async with engine.begin() as conn:
        await conn.execute(
            text("CREATE EXTENSION IF NOT EXISTS postgis")
        )
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

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
app.include_router(empresas_router, prefix="/api")
app.include_router(tarefas_router, prefix="/api")
app.include_router(art_rrt_router, prefix="/api")
app.include_router(portal_router, prefix="/api")
app.include_router(relatorios_router, prefix="/api")
app.include_router(notificacoes_router, prefix="/api")
app.include_router(vistorias_router, prefix="/api")
app.include_router(orgaos_router, prefix="/api")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/api/health", tags=["Sistema"])
async def health_check():
    """Verifica a saúde da API e suas dependências."""
    db_status = "ok"
    minio_status = "ok"

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    try:
        import boto3
        s3 = boto3.client(
            "s3",
            endpoint_url=f"http{'s' if settings.MINIO_USE_SSL else ''}://{settings.MINIO_ENDPOINT}",
            aws_access_key_id=settings.MINIO_ROOT_USER,
            aws_secret_access_key=settings.MINIO_ROOT_PASSWORD,
        )
        s3.list_buckets()
    except Exception:
        minio_status = "error"

    healthy = db_status == "ok" and minio_status == "ok"

    return JSONResponse(
        content={
            "status": "ok" if healthy else "degraded",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "dependencies": {
                "database": db_status,
                "minio": minio_status,
            },
        },
        status_code=200 if healthy else 503,
    )
