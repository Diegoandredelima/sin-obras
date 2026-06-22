#!/usr/bin/env bash
# =============================================================================
# SIN-Obras — Validação local (substitui o CI do GitHub Actions, que não é usado)
# =============================================================================
# Roda o mesmo conjunto do antigo CI: lint + testes (backend) + lint + typecheck
# + build (frontend). Aborta no primeiro erro.
#
#   • Backend  (ruff, pytest) → roda no container `backend` (precisa do banco).
#   • Frontend (eslint, tsc, build) → roda no HOST, onde o node_modules está
#     completo. O container usa um volume anônimo de node_modules que pode
#     ficar desatualizado (ex.: faltando typescript-eslint).
#
# Uso:   bash scripts/validate.sh      (ou: make validate / hook de pre-push)
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DB_TEST="postgresql+asyncpg://sinobras:sinobras_dev_2026@postgres:5432/sinobras_test"

# --- pré-condições ----------------------------------------------------------
if [ -z "$(docker compose ps --status running --quiet backend 2>/dev/null)" ]; then
  echo "❌ O container 'backend' não está rodando. Rode 'docker compose up -d' antes."
  exit 1
fi
if [ ! -d frontend/node_modules ]; then
  echo "📦 Instalando dependências do frontend (host)..."
  ( cd frontend && npm ci )
fi

# --- backend (docker) -------------------------------------------------------
echo "🔍 Ruff (backend)..."
docker compose exec -T -e PYTHONPATH=/app backend ruff check .

echo "🧪 Pytest (backend)..."
docker compose exec -T -e PYTHONPATH=/app -e DATABASE_URL="$DB_TEST" backend pytest tests/ -q

# --- frontend (host) --------------------------------------------------------
echo "🔍 ESLint (frontend)..."
( cd frontend && npx eslint . )

echo "📋 TypeScript (frontend)..."
( cd frontend && npx tsc --noEmit )

echo "🏗️  Build (frontend)..."
( cd frontend && npm run build )

echo ""
echo "============================================"
echo "  ✅ Validação local completa!"
echo "============================================"
