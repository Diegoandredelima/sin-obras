import os

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from starlette.testclient import TestClient

from app.core.database import Base

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
def client():
    from app.main import app
    with TestClient(app) as c:
        yield c
