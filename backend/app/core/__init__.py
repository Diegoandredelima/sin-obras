"""
SIN-Obras Backend — Configuração Central
Carrega variáveis de ambiente e define constantes do sistema.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configurações da aplicação carregadas via variáveis de ambiente."""

    # --- App ---
    APP_NAME: str = "SIN-Obras API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # --- Banco de Dados ---
    DATABASE_URL: str = "postgresql+asyncpg://sinobras:sinobras_dev_2026@localhost:5432/sinobras"

    # --- Autenticação ---
    SECRET_KEY: str = "super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- CORS ---
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    # --- MinIO / S3 ---
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ROOT_USER: str = "minioadmin"
    MINIO_ROOT_PASSWORD: str = "minioadmin123"
    MINIO_BUCKET: str = "sinobras-fotos"
    MINIO_USE_SSL: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
