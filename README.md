# SIN-Obras

**Sistema Integrado de Obras — Secretaria de Estado da Infraestrutura do Rio Grande do Norte**

> Sistema unificado de gestão de obras públicas: do cadastro e fiscalização em campo até a análise preditiva e conformidade legal.

---

## Como Rodar (Desenvolvimento)

### Pré-requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando
- Git

### 1. Clone e configure

```bash
git clone <url-do-repo>
cp .env.example .env
```

### 2. Suba a stack

```bash
make up
```

| Serviço | URL |
|---|---|
| **API (Swagger)** | http://localhost:8000/api/docs |
| **Frontend** | http://localhost:5173 |
| **MinIO Console** | http://localhost:9001 |

### 3. Migrations e seed

```bash
make migrate-apply
make seed
```

### 4. Login

| Perfil | Matrícula/CNPJ | Senha |
|---|---|---|
| SECRETARIO | 10001 | sin@2026 |
| COORDENADOR | 10002 | sin@2026 |
| ENGENHEIRO | 10003 | sin@2026 |
| FISCAL | 10004 | sin@2026 |
| EMPRESA | 12345678000195 | empresa@2026 |

---

## Comandos

```bash
make up              # Sobe todos os containers
make down            # Para os containers
make build           # Rebuild sem cache
make logs            # Logs em tempo real
make seed            # Popula banco com dados dev
make migrate         # Gera e aplica migrations
make reset-db        # Apaga e recria banco (DESTRUTIVO)

make test            # Testes do backend com cobertura (pytest-cov)
make lint            # Ruff + ESLint
make validate        # Lint + typecheck + testes + build
```

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, TypeScript (`strict: true`), Tailwind CSS v4, Vite |
| Formulários | react-hook-form + zod (validação por schema) |
| Estado | Zustand + TanStack Query |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0 (async) |
| Banco | PostgreSQL 16 + PostGIS 3.4 |
| Storage | MinIO (S3-compatible) |
| Auth | JWT + bcrypt (5 níveis RBAC) |
| Testes | pytest + pytest-cov (12 testes, backend) |
| Lint | Ruff (backend) + ESLint/TypeScript (frontend) |
| CI/CD | GitHub Actions (lint + typecheck + testes + coverage + build) |
| Produção | nginx:alpine via Dockerfile.prod (multi-stage) |

---

## Estrutura

```
Sin-Obras/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (13 módulos)
│   │   ├── core/         # Config, DB, RBAC, Security
│   │   ├── models/       # SQLAlchemy models (28 tabelas)
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── main.py       # Entry point
│   ├── tests/            # pytest (auth + obras)
│   └── alembic/          # Database migrations
├── frontend/
│   ├── src/
│   │   ├── components/   # Layout, Sidebar, ErrorBoundary, CookieBanner, NotificacoesBell
│   │   ├── hooks/        # useDarkMode
│   │   ├── pages/        # 15 páginas
│   │   ├── services/     # Axios + interceptors (JWT + refresh)
│   │   ├── store/        # Zustand (auth persist)
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # format (currency, date, percent)
│   ├── Dockerfile         # Dev (node:22-slim + npm run dev)
│   ├── Dockerfile.prod    # Produção (multi-stage: build → nginx:alpine)
│   └── nginx.conf         # SPA routing, cache de assets, gzip
├── mobile/               # Expo + React Native
├── docker-compose.yml    # Desenvolvimento
├── docker-compose.prod.yml # Override de produção
├── Makefile
└── AGENTS.md             # Guia para desenvolvedores
```

---

## Perfis de Acesso (RBAC)

| Nível | Perfil | Acesso |
|---|---|---|
| 4 | SECRETARIO | Dashboard executivo, todos os recursos |
| 3 | COORDENADOR | Monitoramento, alertas, equipes, gestão de usuários |
| 2 | ENGENHEIRO | Gestão de obras, aprovação de medições |
| 1 | FISCAL | Vistorias, check-in, checklist |
| 0 | EMPRESA | Portal restrito à sua obra |

Todos os endpoints da API são protegidos com `require_minimum_role`. Criação de usuários (`POST /auth/registrar`) requer COORDENADOR+.

---

## Deploy em Produção

```bash
# Build e sobe com nginx servindo o frontend
VITE_API_URL=https://api.sinobras.rn.gov.br/api \
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

O frontend é compilado em build-time com `VITE_API_URL` embutido no bundle, depois servido por nginx:alpine (sem Node.js na imagem final).

Para onboarding de devs, veja [AGENTS.md](./AGENTS.md).
