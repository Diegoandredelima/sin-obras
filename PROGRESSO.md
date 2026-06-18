# 📊 SIN-Obras — Status de Implementação

> **Última atualização:** 18/06/2026  
> **Projeto:** Sistema Integrado de Obras — Secretaria de Infraestrutura do RN (SIN-RN)

---

## Legenda

| Símbolo | Significado |
|---|---|
| ✅ | Concluído e no repositório |
| 🔄 | Em andamento / parcialmente feito |
| ⏳ | Planejado — ainda não iniciado |
| 🏃 | Requer execução manual pelo dev |

---

## 🏗️ BLOCO 1 — Fundação e Infraestrutura

**Status geral: `✅ CÓDIGO COMPLETO — Aguardando execução dos containers`**

### 1.1 Setup do Projeto e DevOps ✅

| Artefato | Arquivo | Status |
|---|---|---|
| Estrutura de diretórios do monorepo | `backend/`, `frontend/`, `mobile/` | ✅ |
| Docker Compose (postgres+postgis, backend, frontend, minio) | [`docker-compose.yml`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/docker-compose.yml) | ✅ |
| Template de variáveis de ambiente | [`.env.example`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/.env.example) | ✅ |
| `.env` de desenvolvimento | [`.env`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/.env) | ✅ |
| `.gitignore` | [`.gitignore`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/.gitignore) | ✅ |
| GitHub Actions / PR Template | `.github/` | ✅ |
| Makefile com comandos úteis | [`Makefile`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Makefile) | ✅ |
| README com instruções completas | [`README.md`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/README.md) | ✅ |

### 1.2 Backend — FastAPI ✅

| Artefato | Arquivo | Status |
|---|---|---|
| Projeto FastAPI com lifespan | [`backend/app/main.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/main.py) | ✅ |
| Dependências Python | [`backend/requirements.txt`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/requirements.txt) | ✅ |
| Dockerfile do backend | [`backend/Dockerfile`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/Dockerfile) | ✅ |
| Configuração central (Pydantic Settings) | [`backend/app/core/__init__.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/core/__init__.py) | ✅ |
| Conexão async com PostgreSQL (SQLAlchemy) | [`backend/app/core/database.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/core/database.py) | ✅ |
| Alembic configurado (`env.py` + `alembic.ini`) | `backend/alembic/` | ✅ |
| Pasta `alembic/versions/` criada | `backend/alembic/versions/.gitkeep` | ✅ |
| **Script de Seed de desenvolvimento** | [`backend/app/seed.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/seed.py) | ✅ |

**Modelos SQLAlchemy (todos criados):**

| Model(s) | Arquivo | Tabela(s) |
|---|---|---|
| `Usuario` | [`models/usuario.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/models/usuario.py) | `usuarios` |
| `Obra`, `Contrato`, `Meta`, `Submeta`, `Evento` | [`models/obra.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/models/obra.py) | 5 tabelas |
| `AuditLog` | [`models/auditoria.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/models/auditoria.py) | `audit_logs` |
| `ArtRrt` | [`models/art_rrt.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/models/art_rrt.py) | `art_rrt` |
| `Tarefa` | [`models/tarefa.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/models/tarefa.py) | `tarefas` |
| `DiarioObra`, `Medicao`, `Notificacao` | [`models/portal.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/models/portal.py) | 3 tabelas |
| `Vistoria`, `ChecklistItem`, `FotoVistoria` | [`models/vistoria.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/models/vistoria.py) | 3 tabelas |

**Total: 14 tabelas mapeadas**

### 1.3 Autenticação e RBAC ✅

| Artefato | Arquivo | Status |
|---|---|---|
| JWT + bcrypt | [`core/security.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/core/security.py) | ✅ |
| RBAC com 5 roles e hierarquia de privilégios | [`core/rbac.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/core/rbac.py) | ✅ |
| Serviço de Auditoria imutável (RF12) | [`services/auditoria.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/services/auditoria.py) | ✅ |
| Schemas Pydantic de auth | [`schemas/auth.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/schemas/auth.py) | ✅ |
| **Router de auth**: login, refresh, me, logout, registrar | [`api/auth.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/api/auth.py) | ✅ |

**Todos os 9 Routers registrados em `main.py`:**

| Router | Rota Base | Arquivo |
|---|---|---|
| Auth | `/api/auth/` | [`api/auth.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/api/auth.py) |
| Obras | `/api/obras/` | [`api/obras.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/api/obras.py) |
| Contratos | `/api/contratos/` | [`api/contratos.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/api/contratos.py) |
| Cronograma | `/api/` (metas/submetas/eventos) | [`api/cronograma.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/api/cronograma.py) |
| ART/RRT | `/api/art-rrt/` | [`api/art_rrt.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/api/art_rrt.py) |
| Tarefas | `/api/tarefas/` | [`api/tarefas.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/api/tarefas.py) |
| Portal | `/api/portal/` | [`api/portal.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/api/portal.py) |
| Vistorias | `/api/vistorias/` | [`api/vistorias.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/api/vistorias.py) |
| Notificações | `/api/notificacoes/` | [`api/notificacoes.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/app/api/notificacoes.py) |

### 1.4 Frontend Web — Shell e Layout ✅

| Artefato | Arquivo | Status |
|---|---|---|
| Projeto Vite + React 19 + Tailwind CSS v4 | [`frontend/package.json`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/frontend/package.json) | ✅ |
| Dockerfile do frontend | [`frontend/Dockerfile`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/frontend/Dockerfile) | ✅ |
| Cliente de API (Axios + interceptors JWT) | [`src/services/api.js`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/frontend/src/services/api.js) | ✅ |
| Store de auth (Zustand + persist) | [`src/store/auth.js`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/frontend/src/store/auth.js) | ✅ |
| Layout com ProtectedRoute (redireciona se !auth) | [`components/layout/Layout.jsx`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/frontend/src/components/layout/Layout.jsx) | ✅ |
| Sidebar com menu contextual por role | [`components/layout/Sidebar.jsx`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/frontend/src/components/layout/Sidebar.jsx) | ✅ |
| Roteamento completo (React Router v7) | [`src/App.jsx`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/frontend/src/App.jsx) | ✅ |
| **Login** (integrado com `/api/auth/login` + `/api/auth/me`) | [`pages/Login.jsx`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/frontend/src/pages/Login.jsx) | ✅ |
| **Dashboard** (KPIs, obras recentes, atalhos) | [`pages/Dashboard.jsx`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/frontend/src/pages/Dashboard.jsx) | ✅ |
| Página 404 | [`pages/NotFound.jsx`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/frontend/src/pages/NotFound.jsx) | ✅ |

---

### 📋 Execução e Bugs Corrigidos

#### ✅ Concluído
- `docker compose up -d` — **Stack rodando** (postgres+postgis ✅, minio ✅, backend ✅, frontend ✅)
- Tabelas criadas automaticamente pelo `Base.metadata.create_all` no startup do backend

#### 🐛 Bugs encontrados e corrigidos

| Bug | Causa | Correção |
|---|---|---|
| `ModuleNotFoundError: No module named 'app'` | Alembic não tinha `/app` no `PYTHONPATH` | Adicionado `PYTHONPATH=/app` no `docker-compose.yml` + executar com `-e PYTHONPATH=/app` |
| `FileNotFoundError: script.py.mako` | Template do Alembic ausente | Criado [`alembic/script.py.mako`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/alembic/script.py.mako) |
| `ValueError: password cannot be longer than 72 bytes` | `bcrypt 4.x` removeu `__about__` e quebrou o `passlib` | Pinado `bcrypt==3.2.2` no [`requirements.txt`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/requirements.txt) |
| Alembic detectando 40+ tabelas do PostGIS como "removed" | Filtro `include_object` incompleto | Expandido para excluir todas as tabelas Tiger/topology/PostGIS em [`alembic/env.py`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/backend/alembic/env.py) |

#### 🏃 Próximos comandos — Execute no terminal

Depois do `docker compose build backend` (para pegar o `bcrypt==3.2.2`):

```powershell
# 1. Rebuild do backend com requirements corrigido
docker compose build backend
docker compose up -d

# 2. Rodar o seed (agora deve funcionar)
docker compose exec backend sh -c "PYTHONPATH=/app python -m app.seed"

# 3. Gerar migration inicial (agora com filtro correto)
docker compose exec backend sh -c "PYTHONPATH=/app alembic revision --autogenerate -m 'initial_schema'"
docker compose exec backend sh -c "PYTHONPATH=/app alembic upgrade head"

# 4. Verificar API
curl http://localhost:8000/api/health
```

**Credenciais de desenvolvimento (após seed):**
| Perfil | Matrícula/CNPJ | Senha | Status |
|---|---|---|---|
| Secretário | `10001` | `sin@2026` | ⏳ aguardando seed |
| Coordenador | `10002` | `sin@2026` | ⏳ aguardando seed |
| Engenheiro | `10003` | `sin@2026` | ⏳ aguardando seed |
| Fiscal | `10004` | `sin@2026` | ⏳ aguardando seed |
| Empresa | `12345678000195` | `empresa@2026` | ⏳ aguardando seed |

> ℹ️ **Nota:** Sem dados reais para migrar — banco novo, seed cria os dados de desenvolvimento do zero.

---

## 📋 BLOCO 2 — Gestão de Obras e Contratos

**Status: `✅ Backend completo` / `🔄 Frontend parcialmente feito`**

### Backend ✅
- ✅ CRUD de Obras (`api/obras.py`, `services/obra.py`, `schemas/obra.py`)
- ✅ CRUD de Contratos (`api/contratos.py`, `services/contrato.py`)
- ✅ Cronograma físico-financeiro — Metas/Submetas/Eventos (`api/cronograma.py`)
- ✅ ART/RRT com validação de vencimento (`api/art_rrt.py`)
- ✅ Tarefas Kanban (`api/tarefas.py`)

### Frontend — Páginas existentes ✅
| Página | Arquivo | Observação |
|---|---|---|
| Lista de Obras | [`pages/Obras.jsx`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/frontend/src/pages/Obras.jsx) | Cards com filtros |
| Nova Obra | [`pages/NovaObra.jsx`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/frontend/src/pages/NovaObra.jsx) | Formulário multi-step |
| Lista de Contratos | [`pages/Contratos.jsx`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/frontend/src/pages/Contratos.jsx) | — |
| Quadro Kanban | [`pages/Quadro.jsx`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/frontend/src/pages/Quadro.jsx) | Drag-and-drop |

### Frontend — Pendências do Bloco 2 ⏳
- ⏳ `/obras/:id` — Página de detalhe da obra
- ⏳ `/obras/:id/cronograma` — Árvore Meta → Submeta → Evento (edição inline)
- ⏳ Calculadora de Engenharia (modal lateral)

---

## 🏢 BLOCO 3 — Portal da Empresa Executora

**Status: `✅ Backend completo` / `🔄 Frontend parcialmente feito`**

### Backend ✅
- ✅ Diário de Obras (`api/portal.py`, `services/portal.py`)
- ✅ Medições: rascunho, assinatura digital, hash SHA-256
- ✅ **RN01 — Travamento por ART** implementado em `services/portal.py`
- ✅ Notificações: sistema, email (`api/notificacoes.py`)

### Frontend — Páginas existentes ✅
| Página | Arquivo |
|---|---|
| Diário de Obras | [`pages/DiarioObras.jsx`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/frontend/src/pages/DiarioObras.jsx) |
| Medições | [`pages/Medicoes.jsx`](file:///c:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/frontend/src/pages/Medicoes.jsx) |

### Frontend — Pendências do Bloco 3 ⏳
- ⏳ `/empresa/obras` — Lista das obras da empresa logada
- ⏳ Wizard de nova medição (Metas → Submetas → Eventos)
- ⏳ Modal de Assinatura Digital com validação de ART

---

## 📱 BLOCO 4 — App Mobile de Fiscalização

**Status: `✅ CÓDIGO COMPLETO — Telas e Fluxo Offline Criados`**

| Artefato | Status |
|---|---|
| Projeto Expo criado (`App.tsx`, `app.json`) | ✅ |
| Pastas: `screens/`, `services/`, `store/`, `db/` | ✅ |
| Backend preparado: `api/vistorias.py`, `services/vistoria.py` | ✅ |
| Tela de Check-in Georreferenciado | ✅ |
| Tela de Checklist Dinâmico | ✅ |
| Câmera com metadados invioláveis (RN03) | ✅ |
| Modo Offline com SQLite + fila de sync | ✅ |

---

## 🧠 BLOCO 5 — Inteligência, Analytics e IA

**Status: `⏳ Não iniciado`**

| Artefato | Status |
|---|---|
| Curva S Preditiva (EVM) | ⏳ |
| Mapa de Calor (PostGIS + Mapbox) | ⏳ |
| Dashboard Executivo completo | ⏳ |
| Assistente de IA (Gemini / OpenAI) | ⏳ |
| Alertas automáticos agendados (APScheduler) | ⏳ |

---

## 📁 Árvore Completa do Projeto

```
Sin-Obras/
├── .env                          ✅
├── .env.example                  ✅
├── .gitignore                    ✅
├── docker-compose.yml            ✅
├── Makefile                      ✅
├── README.md                     ✅
├── PROGRESSO.md                  ✅ (este arquivo)
│
├── .github/
│   ├── workflows/                ✅
│   └── PULL_REQUEST_TEMPLATE.md  ✅
│
├── Docs/
│   ├── requisitos-basicos        ✅ (documento original)
│   ├── Historia do usuário.md    ✅ (documento original)
│   └── WhatsApp Image (...).jpeg ✅ (logo do projeto)
│
├── backend/
│   ├── Dockerfile                ✅
│   ├── requirements.txt          ✅
│   ├── alembic.ini               ✅
│   ├── alembic/
│   │   ├── env.py                ✅
│   │   └── versions/             ✅ (migrations serão geradas aqui)
│   └── app/
│       ├── main.py               ✅ (todos os 9 routers registrados)
│       ├── seed.py               ✅ (5 usuários + 1 obra de demo)
│       ├── core/
│       │   ├── __init__.py       ✅ (Pydantic Settings)
│       │   ├── database.py       ✅ (async SQLAlchemy)
│       │   ├── security.py       ✅ (JWT + bcrypt)
│       │   └── rbac.py           ✅ (5 roles com hierarquia)
│       ├── models/               ✅ (14 tabelas — todos os blocos)
│       ├── schemas/              ✅ (8 arquivos Pydantic)
│       ├── api/                  ✅ (9 routers)
│       └── services/             ✅ (9 services + regras de negócio)
│
├── frontend/
│   ├── Dockerfile                ✅
│   ├── package.json              ✅ (React 19, Vite, Tailwind v4)
│   └── src/
│       ├── App.jsx               ✅ (React Router v7)
│       ├── components/layout/
│       │   ├── Layout.jsx        ✅ (ProtectedRoute)
│       │   └── Sidebar.jsx       ✅ (menu por role)
│       ├── pages/
│       │   ├── Login.jsx         ✅ (integrado com API)
│       │   ├── Dashboard.jsx     ✅ (KPIs + obras recentes)
│       │   ├── Obras.jsx         ✅
│       │   ├── NovaObra.jsx      ✅
│       │   ├── Contratos.jsx     ✅
│       │   ├── Quadro.jsx        ✅ (Kanban)
│       │   ├── DiarioObras.jsx   ✅
│       │   ├── Medicoes.jsx      ✅
│       │   └── NotFound.jsx      ✅
│       ├── services/api.js       ✅ (Axios + interceptors)
│       └── store/auth.js         ✅ (Zustand + persist)
│
└── mobile/
    ├── App.tsx                   ✅ (estrutura Expo)
    ├── app.json                  ✅
    └── src/
        ├── screens/              ⏳ (pastas criadas)
        ├── services/             ⏳
        ├── store/                ⏳
        └── db/                   ⏳
```
