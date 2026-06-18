# 📊 SIN-Obras — Status de Implementação

> **Última atualização:** 18/06/2026
> **Projeto:** Sistema Integrado de Obras — Secretaria de Infraestrutura do RN (SIN-RN)
> **Repositório:** https://github.com/Diegoandredelima/sin-obras
> **Commit atual:** `d39101e`

---

## Legenda

| Símbolo | Significado |
|---|---|
| ✅ | Concluído e no repositório |
| 🔄 | Em andamento / parcialmente feito |
| ⏳ | Planejado — ainda não iniciado |

---

## 🏗️ BLOCO 1 — Fundação e Infraestrutura

**Status: `✅ COMPLETO E RODANDO`**

### 1.1 Setup do Projeto e DevOps ✅

| Artefato | Arquivo | Status |
|---|---|---|
| Estrutura de diretórios do monorepo | `backend/`, `frontend/`, `mobile/` | ✅ |
| Docker Compose (postgres+postgis, backend, frontend, minio) | `docker-compose.yml` | ✅ |
| Template de variáveis de ambiente | `.env.example` | ✅ |
| `.env` de desenvolvimento | `.env` | ✅ |
| `.gitignore` | `.gitignore` | ✅ |
| GitHub Actions / PR Template | `.github/` | ✅ |
| Makefile com comandos úteis | `Makefile` | ✅ |
| README com instruções completas | `README.md` | ✅ |
| AGENTS.md (guia para agentes de IA) | `AGENTS.md` | ✅ |

### 1.2 Backend — FastAPI ✅

| Artefato | Arquivo | Status |
|---|---|---|
| Projeto FastAPI com lifespan | `backend/app/main.py` | ✅ |
| Dependências Python (incl. openpyxl, geoalchemy2) | `backend/requirements.txt` | ✅ |
| Dockerfile do backend | `backend/Dockerfile` | ✅ |
| Configuração central (Pydantic Settings) | `backend/app/core/__init__.py` | ✅ |
| Conexão async com PostgreSQL (SQLAlchemy + asyncpg) | `backend/app/core/database.py` | ✅ |
| Alembic configurado com filtro de tabelas PostGIS | `backend/alembic/env.py` | ✅ |
| Script de Seed de desenvolvimento (idempotente) | `backend/app/seed.py` | ✅ |
| Script de importação da planilha oficial (idempotente) | `backend/app/import_acompanhamento.py` | ✅ |

**Modelos SQLAlchemy — 25 tabelas mapeadas:**

| Model(s) | Arquivo | Tabela(s) |
|---|---|---|
| `Usuario` | `models/usuario.py` | `usuarios` |
| `Obra`, `Contrato`, `Meta`, `Submeta`, `Evento` | `models/obra.py` | 5 tabelas |
| `Empresa`, `Orgao` | `models/cadastro.py` | `empresas`, `orgaos` |
| `AuditLog` | `models/auditoria.py` | `audit_logs` |
| `ArtRrt` | `models/art_rrt.py` | `art_rrt` |
| `Tarefa` | `models/tarefa.py` | `tarefas` |
| `DiarioObra`, `Medicao`, `Notificacao` | `models/portal.py` | 3 tabelas |
| `Vistoria`, `ChecklistItem`, `FotoVistoria` | `models/vistoria.py` | 3 tabelas |
| `OrdemServico`, `AditivoPrazo`, `Paralisacao`, `Readequacao`, `Apostilamento`, `Reajuste`, `TermoRecebimento`, `NotificacaoExtrajudicial`, `Portaria` | `models/acompanhamento.py` | 9 tabelas |

**10 Routers registrados em `main.py`:**

| Router | Rota Base | Arquivo |
|---|---|---|
| Auth | `/api/auth/` | `api/auth.py` |
| Obras | `/api/obras/` | `api/obras.py` |
| Contratos | `/api/contratos/` | `api/contratos.py` |
| Órgãos | `/api/orgaos/` | `api/orgaos.py` |
| Cronograma | `/api/` (metas/submetas/eventos) | `api/cronograma.py` |
| ART/RRT | `/api/art-rrt/` | `api/art_rrt.py` |
| Tarefas | `/api/tarefas/` | `api/tarefas.py` |
| Portal | `/api/portal/` | `api/portal.py` |
| Vistorias | `/api/vistorias/` | `api/vistorias.py` |
| Notificações | `/api/notificacoes/` | `api/notificacoes.py` |

### 1.3 Autenticação e RBAC ✅

| Artefato | Status |
|---|---|
| JWT + bcrypt (pinado em 3.2.2 por compatibilidade com passlib) | ✅ |
| RBAC com 5 roles: EMPRESA(0) < FISCAL(1) < ENGENHEIRO(2) < COORDENADOR(3) < SECRETARIO(4) | ✅ |
| Serviço de Auditoria imutável (RF12) | ✅ |
| Router de auth: login, refresh, me, logout, registrar | ✅ |

**Credenciais de desenvolvimento (seed executado):**

| Perfil | Matrícula/CNPJ | Senha |
|---|---|---|
| Secretário | `10001` | `sin@2026` |
| Coordenador | `10002` | `sin@2026` |
| Engenheiro | `10003` | `sin@2026` |
| Fiscal | `10004` | `sin@2026` |
| Empresa | `12345678000195` | `empresa@2026` |

### 1.4 Banco de Dados — Reestruturação e Carga ✅

Realizado em 18/06/2026. Documentação completa em `Docs/relatorio_banco/`.

**Migrations aplicadas:**

| Revisão | Conteúdo |
|---|---|
| `ff6285b72f48` | 9 tabelas de acompanhamento (`ordens_servico`, `aditivos_prazo`, `paralisacoes`, etc.) |
| `b2f3a1c9d4e7` | Tabelas `empresas` e `orgaos`; enum `situacao_obra_enum`; +14 colunas em `contratos`; +18 colunas em `obras` |
| `c3d4e5f6a7b8` | `contratos.fiscal_nome` e `contratos.gestor_nome` |

**Dados oficiais carregados** (fonte: `Acompanhamento de obras.xlsx`):

| Entidade | Registros |
|---|---|
| `orgaos` | 42 (com nomes por extenso — lista oficial do Governo do RN) |
| `empresas` | 277 (razões sociais deduplicadas) |
| `contratos` | 596 (595 oficiais + 1 demo) |
| `obras` | 596 |

**Totais financeiros:** Σ valor inicial R$ 1,47 bi · Σ valor final R$ 1,53 bi · Σ medido R$ 770 mi

**Distribuição por situação:** CONCLUIDA 339 · EM_ANDAMENTO 127 · RESCINDIDA 56 · PARALISADA 38 · INACABADA 10 · ARQUIVADA 10 · A_INICIAR 7 · CEDIDA 3 · EXTINTA 3

---

## 📋 BLOCO 2 — Gestão de Obras e Contratos

**Status: `✅ Backend completo` / `✅ Frontend conectado à API real`**

### 2.1 Backend ✅

| Endpoint | Funcionalidade |
|---|---|
| `GET /api/obras` | Listagem com filtros: `search`, `status`, `situacao`, `municipio`, `contrato_id` |
| `GET /api/obras/stats` | KPIs agregados (total, por_situacao, por_status) para o Dashboard |
| `GET /api/obras/:id` | Detalhe completo: inclui prazos, financeiro, histórico, observações, metas |
| `POST/PUT/DELETE /api/obras` | CRUD completo com auditoria |
| `GET /api/contratos` | Listagem com filtros: `search`, `orgao` |
| `GET /api/contratos/:id` | Detalhe: empresa_ref, orgao_ref, financeiro completo, fiscal/gestor |
| `POST/PUT /api/contratos` | CRUD com auditoria |
| `GET /api/orgaos` | Lista todos os 42 órgãos (sigla + nome por extenso) |
| Cronograma | CRUD de Metas / Submetas / Eventos |
| ART/RRT | Upload e validação de vencimento |
| Tarefas | Kanban por obra |

### 2.2 Frontend — Páginas ✅

| Página | Rota | Arquivo | Status |
|---|---|---|---|
| Dashboard | `/dashboard` | `pages/Dashboard.jsx` | ✅ Conectado à API — KPIs reais, distribuição por situação, obras recentes |
| Lista de Obras | `/obras` | `pages/Obras.jsx` | ✅ Conectado à API — 595 obras, filtro por situação, busca debounced, skeleton loading |
| Detalhe da Obra | `/obras/:id` | `pages/DetalheObra.jsx` | ✅ Contrato, prazos (vigência/execução), financeiro, situação oficial, observações colapsáveis |
| Nova Obra | `/obras/nova` | `pages/NovaObra.jsx` | ✅ Formulário multi-step |
| Lista de Contratos | `/contratos` | `pages/Contratos.jsx` | ✅ Conectado à API — busca por número/objeto/fiscal, link para detalhe |
| Detalhe do Contrato | `/contratos/:id` | `pages/DetalheContrato.jsx` | ✅ Empresa, responsáveis, financeiro com barra de variação, obra vinculada |
| Quadro Kanban | `/quadro` | `pages/Quadro.jsx` | ✅ Drag-and-drop |

### 2.3 Pendências do Bloco 2 ⏳

- ⏳ `/obras/:id/cronograma` — Árvore Meta → Submeta → Evento (edição inline)
- ⏳ Calculadora de Engenharia (modal lateral)

---

## 🏢 BLOCO 3 — Portal da Empresa Executora

**Status: `✅ Backend completo` / `🔄 Frontend parcialmente feito`**

### Backend ✅
- ✅ Diário de Obras (`api/portal.py`, `services/portal.py`)
- ✅ Medições: rascunho, assinatura digital, hash SHA-256
- ✅ RN01 — Travamento por ART implementado em `services/portal.py`
- ✅ Notificações: sistema e email (`api/notificacoes.py`)

### Frontend — Páginas existentes 🔄
| Página | Rota | Arquivo | Observação |
|---|---|---|---|
| Diário de Obras | `/empresa/obras/:obraId/diario` | `pages/DiarioObras.jsx` | Interface criada, integração pendente |
| Medições | `/empresa/obras/:obraId/medicoes` | `pages/Medicoes.jsx` | Interface criada, integração pendente |

### Pendências do Bloco 3 ⏳
- ⏳ `/empresa/obras` — Lista das obras da empresa logada
- ⏳ Wizard de nova medição (Metas → Submetas → Eventos)
- ⏳ Modal de Assinatura Digital com validação de ART

---

## 📱 BLOCO 4 — App Mobile de Fiscalização

**Status: `🔄 Estrutura criada — integração pendente`**

| Artefato | Status |
|---|---|
| Projeto Expo (`App.tsx`, `app.json`) | ✅ |
| Tela de Check-in Georreferenciado | ✅ estrutura criada |
| Tela de Checklist Dinâmico | ✅ estrutura criada |
| Câmera com metadados invioláveis (RN03) | ✅ estrutura criada |
| Modo Offline com SQLite + fila de sync | ✅ estrutura criada |
| Backend: `api/vistorias.py`, `services/vistoria.py` | ✅ |
| Integração real com API do backend | ⏳ |

---

## 🧠 BLOCO 5 — Inteligência, Analytics e IA

**Status: `⏳ Não iniciado`**

| Artefato | Status |
|---|---|
| Curva S Preditiva (EVM) | ⏳ |
| Mapa de Calor (PostGIS + Mapbox) | ⏳ |
| Geocodificação de municípios (`obras.localizacao`) | ⏳ |
| Dashboard Executivo completo | ⏳ |
| Assistente de IA (Gemini / OpenAI) | ⏳ |
| Alertas automáticos agendados (APScheduler) | ⏳ |

---

## 🐛 Bugs corrigidos

| Bug | Causa | Correção |
|---|---|---|
| `ModuleNotFoundError: No module named 'app'` | Alembic sem `/app` no `PYTHONPATH` | Adicionado `PYTHONPATH=/app` no `docker-compose.yml` |
| `FileNotFoundError: script.py.mako` | Template Alembic ausente | Criado `alembic/script.py.mako` |
| `ValueError: password cannot be longer than 72 bytes` | `bcrypt 4.x` quebrou `passlib` | Pinado `bcrypt==3.2.2` |
| Alembic detectando 40+ tabelas PostGIS como "removed" | Filtro `include_object` incompleto | Expandido em `alembic/env.py` para excluir tabelas Tiger/topology/PostGIS |
| Typo `RESCIDIDA` na planilha (sem 'N') | Dado incorreto na planilha oficial | `map_situacao()` usa `startswith("RESCI")` para cobrir ambas as grafias |
| `openpyxl` ausente no container | Não estava em `requirements.txt` | Adicionado `openpyxl==3.1.5` |

---

## 📁 Árvore do Projeto (estado atual)

```
Sin-Obras/
├── .env / .env.example               ✅
├── .gitignore                        ✅
├── docker-compose.yml                ✅
├── Makefile                          ✅
├── README.md                         ✅
├── AGENTS.md                         ✅
├── PROGRESSO.md                      ✅ (este arquivo)
│
├── .github/
│   ├── workflows/                    ✅
│   └── PULL_REQUEST_TEMPLATE.md      ✅
│
├── Docs/
│   └── relatorio_banco/
│       ├── modelo-novo-der-e-logico.md   ✅ DER + modelo lógico
│       ├── schema-novo.sql               ✅ DDL completo (pg_dump)
│       ├── plano-transformacao-e-carga.md ✅ mapa de colunas + instruções
│       ├── relatorio-final-modelagem.md  ✅ relatório de decisões
│       ├── dump-banco-atual.md           ✅ snapshot pré-reestruturação
│       └── analise-modelagem-access.md   ✅ análise do banco legado
│
├── backend/
│   ├── Dockerfile                    ✅
│   ├── requirements.txt              ✅
│   ├── alembic.ini                   ✅
│   ├── alembic/
│   │   ├── env.py                    ✅ (filtro PostGIS)
│   │   └── versions/
│   │       ├── ff6285b72f48_...py    ✅ 9 tabelas acompanhamento
│   │       ├── b2f3a1c9d4e7_...py    ✅ empresas, orgaos, +32 colunas
│   │       └── c3d4e5f6a7b8_...py    ✅ fiscal_nome, gestor_nome
│   └── app/
│       ├── main.py                   ✅ (10 routers)
│       ├── seed.py                   ✅ (5 usuários + 1 obra demo)
│       ├── import_acompanhamento.py  ✅ (595 contratos da planilha)
│       ├── core/                     ✅
│       ├── models/
│       │   ├── usuario.py            ✅
│       │   ├── obra.py               ✅ (Contrato, Obra, Meta, Submeta, Evento)
│       │   ├── cadastro.py           ✅ (Empresa, Orgao)
│       │   ├── acompanhamento.py     ✅ (9 tabelas de acompanhamento)
│       │   ├── auditoria.py          ✅
│       │   ├── art_rrt.py            ✅
│       │   ├── tarefa.py             ✅
│       │   ├── portal.py             ✅
│       │   └── vistoria.py           ✅
│       ├── schemas/                  ✅ (8 arquivos Pydantic atualizados)
│       ├── api/
│       │   ├── auth.py               ✅
│       │   ├── obras.py              ✅ (filtros + /stats)
│       │   ├── contratos.py          ✅ (filtros)
│       │   ├── orgaos.py             ✅ (novo)
│       │   ├── cronograma.py         ✅
│       │   ├── art_rrt.py            ✅
│       │   ├── tarefas.py            ✅
│       │   ├── portal.py             ✅
│       │   ├── vistorias.py          ✅
│       │   └── notificacoes.py       ✅
│       └── services/                 ✅ (obra e contrato com filtros)
│
├── frontend/
│   ├── Dockerfile                    ✅
│   ├── package.json                  ✅ (React 19, Vite, Tailwind v4)
│   └── src/
│       ├── App.jsx                   ✅ (React Router v7 — 9 rotas)
│       ├── components/layout/
│       │   ├── Layout.jsx            ✅ (ProtectedRoute)
│       │   └── Sidebar.jsx           ✅ (menu por role)
│       ├── pages/
│       │   ├── Login.jsx             ✅ (integrado com API)
│       │   ├── Dashboard.jsx         ✅ (API real — KPIs + distribuição)
│       │   ├── Obras.jsx             ✅ (API real — filtros + skeleton)
│       │   ├── DetalheObra.jsx       ✅ (novo — /obras/:id)
│       │   ├── NovaObra.jsx          ✅ (formulário multi-step)
│       │   ├── Contratos.jsx         ✅ (API real — busca + link detalhe)
│       │   ├── DetalheContrato.jsx   ✅ (novo — /contratos/:id)
│       │   ├── Quadro.jsx            ✅ (Kanban)
│       │   ├── DiarioObras.jsx       🔄 (interface criada)
│       │   ├── Medicoes.jsx          🔄 (interface criada)
│       │   └── NotFound.jsx          ✅
│       ├── services/api.js           ✅ (Axios + interceptors JWT)
│       └── store/auth.js             ✅ (Zustand + persist)
│
└── mobile/
    ├── App.tsx                       🔄 (estrutura Expo)
    └── src/
        ├── screens/                  🔄 (telas criadas, integração pendente)
        ├── services/                 🔄
        └── store/                    🔄
```
