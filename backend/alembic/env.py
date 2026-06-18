import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Importar o Base e os modelos
from app.core.database import Base
from app.core import settings
import app.models  # Isso carrega todos os modelos

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Configurar a URL do banco a partir das settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

def include_object(object, name, type_, reflected, compare_to):
    """
    Filtra objetos do PostGIS, Tiger geocoder e Topology para evitar
    que o autogenerate detecte tabelas internas como 'removed'.
    """
    # Ignorar schemas internas do PostGIS/Tiger
    IGNORED_SCHEMAS = {"tiger", "tiger_data", "topology"}

    # Ignorar tabelas internas do PostGIS (schema public mas de extensões)
    IGNORED_TABLES = {
        "spatial_ref_sys",
        # Tiger geocoder
        "loader_lookuptables", "loader_variables", "loader_platform",
        "countysub_lookup", "secondary_unit_lookup", "street_type_lookup",
        "state_lookup", "direction_lookup", "place_lookup", "county_lookup",
        "zip_lookup", "zip_lookup_all", "zip_lookup_base", "zip_state",
        "zip_state_loc", "geocode_settings", "geocode_settings_default",
        "layer", "topology",
        # PostGIS Tiger tabelas geográficas
        "bg", "tabblock", "tabblock20", "tract", "county", "state",
        "place", "zcta5", "cousub", "faces", "edges", "addr",
        "addrfeat", "featnames", "pagc_rules", "pagc_lex", "pagc_gaz",
    }

    if type_ == "table":
        # Ignorar tabelas de schemas internas
        schema = getattr(object, "schema", None)
        if schema and schema in IGNORED_SCHEMAS:
            return False
        # Ignorar tabelas internas no schema public
        if name in IGNORED_TABLES:
            return False

    return True


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection, 
        target_metadata=target_metadata,
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations() -> None:
    """In this scenario we need to create an Engine
    and associate a connection with the context.

    """

    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    asyncio.run(run_async_migrations())

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
