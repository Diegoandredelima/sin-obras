import os

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from starlette.testclient import TestClient

from app.core.database import Base, get_db

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://sinobras:sinobras_dev_2026@postgres:5432/sinobras_test",
)
TEST_SYNC_URL = os.getenv(
    "TEST_SYNC_URL",
    "postgresql://sinobras:sinobras_dev_2026@postgres:5432/sinobras_test",
)


@pytest.fixture(scope="session")
def sync_engine():
    engine = create_engine(TEST_SYNC_URL, echo=False)
    import app.models  # noqa
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        conn.execute(text("COMMIT"))
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture(autouse=True)
def clean_tables(sync_engine):
    with sync_engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())
        conn.execute(text("COMMIT"))


@pytest.fixture
def db_session(sync_engine):
    SessionLocal = sessionmaker(bind=sync_engine, autocommit=False, autoflush=False)
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


@pytest.fixture
def client(sync_engine):
    """TestClient com `get_db` apontado ao banco de teste (`sinobras_test`).

    Sem este override o app consultaria o banco de `DATABASE_URL` (o principal),
    onde os usuários semeados pelas fixtures não existem — fazendo o login
    retornar 401. Usamos NullPool para que cada request abra/feche sua própria
    conexão no event loop atual do TestClient (evita reuso de conexão asyncpg
    entre loops distintos).
    """
    from app.main import app

    # Desliga o rate limiter de login: em testes todas as requisições vêm do
    # mesmo endereço e compartilham o bucket "20/minute" da sessão inteira,
    # estourando o limite conforme a suíte cresce (429 → login sem token).
    from app.api.auth import limiter
    limiter.enabled = False

    async_engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
    TestSession = async_sessionmaker(
        bind=async_engine, class_=AsyncSession, expire_on_commit=False
    )

    async def _get_db_override():
        async with TestSession() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = _get_db_override
    try:
        with TestClient(app) as c:
            yield c
    finally:
        app.dependency_overrides.pop(get_db, None)
