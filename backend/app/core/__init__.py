"""
SIN-Obras Backend — Configuração Central
Carrega variáveis de ambiente e define constantes do sistema.
"""

from decimal import Decimal

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configurações da aplicação carregadas via variáveis de ambiente."""

    # --- App ---
    APP_NAME: str = "SIN-Obras API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # --- Aprovação de medições (RF24 / RN08) ---
    # Limite de alçada padrão: medições com valor líquido aprovado acima deste
    # valor exigem aprovação adicional do Coordenador (Chefe de Setor).
    ALCADA_APROVACAO_PADRAO: Decimal = Decimal("100000.00")

    # --- Agendamento (RF27) ---
    # Quando SCHEDULER_ENABLED=False, nenhum job periódico é iniciado.
    SCHEDULER_ENABLED: bool = True

    # --- Assistente de IA (RF21) ---
    # Quando IA_ENABLED=False (padrão dev) ou sem ANTHROPIC_API_KEY, o assistente
    # retorna vazio (fallback gracioso) sem chamar a API.
    IA_ENABLED: bool = False
    ANTHROPIC_API_KEY: str = ""
    IA_MODEL: str = "claude-opus-4-8"

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
        "http://localhost:5174",
        "http://localhost:3000",
    ]

    # --- MinIO / S3 ---
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ROOT_USER: str = "minioadmin"
    MINIO_ROOT_PASSWORD: str = "minioadmin123"
    MINIO_BUCKET: str = "sinobras-fotos"
    MINIO_USE_SSL: bool = False

    # --- E-mail transacional (RF10) ---
    # Quando EMAIL_ENABLED=False (padrão dev), as notificações apenas são
    # registradas no sistema; nenhum e-mail é enviado (fallback gracioso).
    EMAIL_ENABLED: bool = False
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True
    EMAIL_FROM: str = "nao-responder@sin.rn.gov.br"
    EMAIL_FROM_NAME: str = "SIN-Obras"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
