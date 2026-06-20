# =============================================================================
# SIN-Obras — Makefile de Desenvolvimento
# =============================================================================
# Atalhos para os comandos Docker mais usados no dia a dia.
# Uso: make <comando>     Ex: make up, make seed, make shell-backend
#
# Requer: Docker e Docker Compose instalados e rodando
# =============================================================================

# .PHONY declara que esses nomes são comandos, não arquivos no disco.
# Sem isso, se existir um arquivo chamado "up", o make confundiria com o alvo.
.PHONY: help up down build logs migrate migrate-apply seed shell-backend shell-db reset-db test lint validate

# Exibe todos os comandos disponíveis (comando padrão ao rodar só "make")
help:
	@echo ""
	@echo "  SIN-Obras — Comandos de Desenvolvimento"
	@echo "  ========================================"
	@echo "  make up             — Sobe todos os containers (docker compose up -d)"
	@echo "  make down           — Para e remove os containers"
	@echo "  make build          — Rebuild das imagens Docker (sem cache)"
	@echo "  make logs           — Logs em tempo real de todos os serviços"
	@echo "  make migrate        — Gera nova migration e aplica (alembic autogenerate)"
	@echo "  make migrate-apply  — Aplica migrations existentes sem gerar nova"
	@echo "  make seed           — Popula o banco com dados de desenvolvimento"
	@echo "  make shell-backend  — Abre bash no container do backend"
	@echo "  make shell-db       — Abre psql no container do PostgreSQL"
	@echo "  make reset-db       — APAGA e recria o banco (DESTRUTIVO!)"
	@echo "  make test           — Roda os testes do backend"
	@echo "  make lint           — Roda ruff (backend) + eslint (frontend)"
	@echo "  make validate       — Roda lint + typecheck + testes + build"
	@echo ""

# Sobe a stack completa em modo detached (-d = background)
# O healthcheck do postgres garante que o banco esteja pronto antes do backend
up:
	docker compose up -d
	@echo "✅ Stack iniciada!"
	@echo "   API Docs:     http://localhost:8000/api/docs"
	@echo "   Frontend:     http://localhost:5173"
	@echo "   MinIO:        http://localhost:9001"

# Para todos os containers (mantém os volumes — dados preservados)
down:
	docker compose down

# Rebuild completo das imagens sem cache
# Use após mudar o Dockerfile ou o requirements.txt
build:
	docker compose build --no-cache

# Exibe logs em tempo real de todos os serviços (Ctrl+C para sair)
logs:
	docker compose logs -f

# Gera uma nova migration via autogenerate do Alembic e a aplica
# O Alembic compara os models SQLAlchemy com o estado atual do banco
# e gera o SQL de diferença automaticamente.
# PYTHONPATH=/app é necessário para o Alembic encontrar o módulo 'app'
migrate:
	@echo "🔄 Gerando migration..."
	docker compose exec -e PYTHONPATH=/app backend alembic revision --autogenerate -m "auto"
	@echo "🔄 Aplicando migration..."
	docker compose exec -e PYTHONPATH=/app backend alembic upgrade head
	@echo "✅ Migration aplicada!"

# Aplica as migrations já existentes em alembic/versions/ sem gerar nova
# Use após um git pull que trouxe novas migrations de outro dev
migrate-apply:
	docker compose exec -e PYTHONPATH=/app backend alembic upgrade head

# Popula o banco com usuários e dados de desenvolvimento (um por perfil)
# Veja: backend/app/seed.py
# Credenciais: secretario/10001, fiscal/10004, empresa/12345678000195
seed:
	@echo "🌱 Rodando seed..."
	docker compose exec -e PYTHONPATH=/app backend python -m app.seed
	@echo "✅ Seed concluído!"

# Abre um shell bash interativo dentro do container do backend
# Útil para rodar scripts Python, inspecionar arquivos, etc.
shell-backend:
	docker compose exec backend bash

# Abre o psql (CLI do PostgreSQL) direto no container do banco
# Útil para inspecionar tabelas, rodar queries manuais, etc.
shell-db:
	docker compose exec postgres psql -U sinobras -d sinobras

# ATENÇÃO: DESTRUTIVO!
# Apaga todos os volumes Docker (dados do banco e MinIO) e recria do zero.
# Use apenas quando quiser um ambiente limpo (ex: testar o seed do início).
reset-db:
	@echo "⚠️  ATENÇÃO: Isto vai APAGAR todos os dados!"
	@read -p "  Confirmar? [y/N] " ans && [ "$$ans" = "y" ]
	docker compose down -v              # -v remove os volumes
	docker compose up -d postgres       # Sobe só o banco primeiro
	@sleep 3                            # Aguarda o banco inicializar
	docker compose up -d backend frontend
	@echo "✅ Banco recriado. Rode 'make seed' para popular."

# =============================================================================
# Validação e Testes
# =============================================================================

# Roda os testes do backend com cobertura de código
# Usa o banco de dados sinobras_test (isolado do dev)
test:
	docker compose exec -e PYTHONPATH=/app \
		-e DATABASE_URL="postgresql+asyncpg://sinobras:sinobras_dev_2026@postgres:5432/sinobras_test" \
		backend pytest tests/ -v --cov=app --cov-report=term-missing

# Roda linters no backend e frontend
lint:
	@echo "🔍 Ruff (backend)..."
	docker compose exec -e PYTHONPATH=/app backend ruff check .
	@echo "🔍 ESLint (frontend)..."
	docker compose exec frontend npm run lint

# Validação completa da stack (lint + typecheck + testes + build)
validate:
	@echo "============================================"
	@echo "  SIN-Obras — Validação Completa"
	@echo "============================================"
	@echo ""
	@echo "🔍 Ruff (backend)..."
	docker compose exec -e PYTHONPATH=/app backend ruff check .
	@echo ""
	@echo "🧪 Testes (backend)..."
	docker compose exec -e PYTHONPATH=/app \
		-e DATABASE_URL="postgresql+asyncpg://sinobras:sinobras_dev_2026@postgres:5432/sinobras_test" \
		backend pytest tests/ -v
	@echo ""
	@echo "🔍 ESLint (frontend)..."
	docker compose exec frontend npm run lint
	@echo ""
	@echo "📋 TypeScript (frontend)..."
	docker compose exec frontend npx tsc --noEmit
	@echo ""
	@echo "🏗️  Build (frontend)..."
	docker compose exec frontend npm run build
	@echo ""
	@echo "============================================"
	@echo "  ✅ Validação completa!"
	@echo "============================================"
