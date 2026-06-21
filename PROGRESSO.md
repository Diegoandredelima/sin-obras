# 📊 SIN-Obras — Status de Implementação

> **Última atualização:** 21/06/2026
> **Projeto:** Sistema Integrado de Obras — Secretaria de Infraestrutura do RN (SIN-RN)
> **Repositório:** https://github.com/Diegoandredelima/sin-obras

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
| Docker Compose produção (nginx, sem hot-reload, sem volumes) | `docker-compose.prod.yml` | ✅ |
| Dockerfile de produção do frontend (multi-stage → nginx:alpine) | `frontend/Dockerfile.prod` | ✅ |
| Config nginx (SPA routing, cache assets, gzip) | `frontend/nginx.conf` | ✅ |
| Template de variáveis de ambiente | `.env.example` | ✅ |
| `.env` de desenvolvimento | `.env` | ✅ |
| `.gitignore` | `.gitignore` | ✅ |
| GitHub Actions / PR Template | `.github/` | ✅ |
| CI pipeline (lint + typecheck + testes + coverage + build) | `.github/workflows/ci.yml` | ✅ |
| Makefile com comandos (incl. test com coverage, lint, validate) | `Makefile` | ✅ |
| Pre-commit hooks (ruff + eslint) | `.pre-commit-config.yaml` | ✅ |
| README com instruções completas | `README.md` | ✅ |
| AGENTS.md (guia para desenvolvedores e agentes de IA) | `AGENTS.md` | ✅ |

### 1.2 Backend — FastAPI ✅

| Artefato | Arquivo | Status |
|---|---|---|
| Projeto FastAPI com lifespan | `backend/app/main.py` | ✅ |
| Dependências Python (openpyxl, geoalchemy2, slowapi, pytest, pytest-cov, ruff) | `backend/requirements.txt` | ✅ |
| Dockerfile do backend | `backend/Dockerfile` | ✅ |
| Configuração central (Pydantic Settings) | `backend/app/core/__init__.py` | ✅ |
| Conexão async com PostgreSQL (SQLAlchemy + asyncpg) | `backend/app/core/database.py` | ✅ |
| Alembic configurado com filtro de tabelas PostGIS | `backend/alembic/env.py` | ✅ |
| Script de Seed de desenvolvimento (idempotente) | `backend/app/seed.py` | ✅ |
| Script de importação da planilha oficial (idempotente) | `backend/app/import_acompanhamento.py` | ✅ |
| Ruff config (lint Python — 0 erros) | `backend/pyproject.toml` | ✅ |
| Rate limiting (slowapi — 20 req/min no login) | `backend/app/main.py`, `backend/app/api/auth.py` | ✅ |
| Health check real (DB + MinIO) | `backend/app/main.py` | ✅ |
| Paginação genérica `PaginatedResponse[T]` | `backend/app/schemas/common.py` | ✅ |

**Modelos SQLAlchemy — 30 tabelas mapeadas:**

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
| `Alerta` | `models/alerta.py` | `alertas` |
| `Delegacao` | `models/delegacao.py` | `delegacoes` |

**16 Routers registrados em `main.py`:**

| Router | Rota Base | Arquivo |
|---|---|---|
| Auth | `/api/auth/` | `api/auth.py` |
| Obras | `/api/obras/` | `api/obras.py` |
| Contratos | `/api/contratos/` | `api/contratos.py` |
| Empresas | `/api/empresas/` | `api/empresas.py` |
| Órgãos | `/api/orgaos/` | `api/orgaos.py` |
| Cronograma | `/api/` (metas/submetas/eventos) | `api/cronograma.py` |
| ART/RRT | `/api/art-rrt/` | `api/art_rrt.py` |
| Tarefas | `/api/tarefas/` | `api/tarefas.py` |
| Portal | `/api/empresa/` | `api/portal.py` |
| Relatórios | `/api/relatorios/` | `api/relatorios.py` |
| Notificações | `/api/notificacoes/` | `api/notificacoes.py` |
| Vistorias | `/api/vistorias/` | `api/vistorias.py` |
| Alertas | `/api/alertas/` | `api/alertas.py` |
| Delegação | `/api/delegacoes/` | `api/delegacao.py` |
| Acompanhamento | `/api/acompanhamento/` | `api/acompanhamento.py` |
| Curva-S | `/api/curva-s/` | `api/curva_s.py` |

### 1.3 Autenticação e RBAC ✅

| Artefato | Status |
|---|---|
| JWT + bcrypt (pinado em 3.2.2 por compatibilidade com passlib) | ✅ |
| RBAC com 6 roles: EMPRESA(0) < FISCAL(1) < APOIO_N2(1) < ENGENHEIRO(2) < COORDENADOR(3) < SECRETARIO(4) | ✅ |
| Todos os endpoints protegidos com `require_minimum_role` | ✅ |
| `POST /auth/registrar` protegido (exige COORDENADOR+) | ✅ |
| Refresh Token — renovação automática no frontend | ✅ |
| Rate limiting — 20 req/min no `/auth/login` | ✅ |
| Serviço de Auditoria imutável (RF12) | ✅ |
| Router de auth: login, refresh, me, logout, registrar, update me | ✅ |

**Credenciais de desenvolvimento (seed executado):**

| Perfil | Matrícula/CNPJ | Senha |
|---|---|---|
| Secretário | `10001` | `sin@2026` |
| Coordenador | `10002` | `sin@2026` |
| Engenheiro | `10003` | `sin@2026` |
| Fiscal | `10004` | `sin@2026` |
| Empresa | `12345678000195` | `empresa@2026` |

### 1.4 Testes ✅

| Artefato | Status |
|---|---|
| pytest configurado com conftest (sync engine + async API) | ✅ |
| pytest-cov instalado — cobertura de código no `make test` e CI | ✅ |
| Banco de testes isolado (`sinobras_test`) | ✅ |
| Limpeza de tabelas entre testes (autouse clean_tables) | ✅ |
| 12 testes: auth (7) + obras (7) — **100% passando** | ✅ |

**Suite de testes:**

| Arquivo | Testes |
|---|---|
| `tests/test_auth.py` | login sucesso, credenciais inválidas, usuário inativo, me autenticado, me sem token, refresh token, RBAC acesso negado |
| `tests/test_obras.py` | criar obra (engenheiro), criar obra bloqueado (empresa), listar, buscar por ID, 404, stats, sem autenticação |

### 1.5 Banco de Dados — Reestruturação e Carga ✅

Realizado em 18/06/2026.

**Migrations aplicadas:**

| Revisão | Conteúdo |
|---|---|
| `ff6285b72f48` | 9 tabelas de acompanhamento (`ordens_servico`, `aditivos_prazo`, `paralisacoes`, etc.) |
| `b2f3a1c9d4e7` | Tabelas `empresas` e `orgaos`; enum `situacao_obra_enum`; +14 colunas em `contratos`; +18 colunas em `obras` |
| `c3d4e5f6a7b8` | `contratos.fiscal_nome` e `contratos.gestor_nome` |
| `03ce3a3976aa` | Roles APOIO_N2 no enum de usuários |
| `27b769b34877` | Tabela `delegacoes` (obra → fiscal/apoio) |

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
| `GET /api/obras` | Listagem com filtros + **paginação real** (`{ items, total, skip, limit }`, 20/página) |
| `GET /api/obras/stats` | KPIs agregados (total, por_situacao, por_status) para o Dashboard |
| `GET /api/obras/:id` | Detalhe completo: inclui prazos, financeiro, histórico, observações, metas |
| `POST/PUT/DELETE /api/obras` | CRUD completo com auditoria |
| `GET /api/contratos` | Listagem com filtros + **paginação real** |
| `GET /api/contratos/:id` | Detalhe: empresa_ref, orgao_ref, financeiro completo, fiscal/gestor |
| `POST/PUT /api/contratos` | CRUD com auditoria |
| `GET /api/orgaos` | Lista todos os 42 órgãos (sigla + nome por extenso) |
| Cronograma | CRUD de Metas / Submetas / Eventos |
| ART/RRT | Upload e validação de vencimento |
| Tarefas | Kanban por obra |

### 2.2 Frontend — Páginas ✅ (TypeScript `strict: true`)

| Página | Rota | Arquivo | Status |
|---|---|---|---|
| Login | `/login` | `pages/Login.tsx` | ✅ react-hook-form + zod |
| Dashboard | `/dashboard` | `pages/Dashboard.tsx` | ✅ useQuery — KPIs reais, distribuição, ações |
| Lista de Obras | `/obras` | `pages/Obras.tsx` | ✅ useQuery + paginação + filtros |
| Detalhe da Obra | `/obras/:id` | `pages/DetalheObra.tsx` | ✅ Abas Detalhes/Diário/Medições + redirect→contrato |
| Nova Obra | `/obras/nova` | `pages/NovaObra.tsx` | ✅ Multi-step + react-hook-form + zod por etapa |
| Lista de Contratos | `/contratos` | `pages/Contratos.tsx` | ✅ useQuery + paginação + empresa link |
| Detalhe do Contrato | `/contratos/:id` | `pages/DetalheContrato.tsx` | ✅ Unificado com dados da obra + abas Diário/Medições/Curva-S/Eventos |
| Quadro de Tarefas | `/quadro` | `pages/Quadro.tsx` | ✅ Kanban tipado |
| Diário de Obras | `/empresa/obras/:id/diario` | `pages/DiarioObras.tsx` | ✅ Conectado ao endpoint real (sem mock) |
| Medições | `/empresa/obras/:id/medicoes` | `pages/Medicoes.tsx` | ✅ Modal de assinatura + avaliação fiscal |
| Relatórios | `/relatorio` | `pages/Relatorio.tsx` | ✅ Gráficos de barras com dados reais |
| Central de Alertas | `/alertas` | `pages/Alertas.tsx` | ✅ Alertas automáticos + delegação + resolução |
| Gestão de Equipe | `/gestao` | `pages/Gestao.tsx` | ✅ Delegação de obras para fiscais/apoios |
| Perfil (modal) | — | `components/layout/PerfilModal.tsx` | ✅ Abre ao clicar no nome do usuário |
| Política de Privacidade | `/privacidade` | `pages/Privacidade.tsx` | ✅ LGPD |
| Detalhe da Empresa | `/empresas/:id` | `pages/DetalheEmpresa.tsx` | ✅ Conectado ao endpoint real |
| 404 | `*` | `pages/NotFound.tsx` | ✅ |

**Melhorias gerais do frontend:**
- ✅ TypeScript `strict: true` em todos os arquivos — `noUnusedLocals`, `noUnusedParameters` ativos
- ✅ `tsconfig.node.json` com `composite: true` (corrige project reference com `tsc --noEmit`)
- ✅ TanStack Query — cache, retry, deduplicação de requests
- ✅ **Validação de formulários** — react-hook-form + zod em Login e NovaObra; erros inline por campo; validação por etapa no multi-step
- ✅ Error Boundary — proteção contra crashes de render
- ✅ Refresh Token — renovação automática com fila de requests
- ✅ RBAC no frontend — menu lateral filtrado por `user.tipo` (6 roles)
- ✅ Título dinâmico no header — baseado na rota atual
- ✅ Utilitários de formatação — `fmtCurrency`, `fmtDate`, `fmtPercent` em `utils/format.ts`
- ✅ Sidebar com ID dinâmico — links de Diário/Medições detectam `contratoId` ou `obraId` da URL
- ✅ Modo escuro — toggle ☀/🌙 no sidebar, persistido em localStorage
- ✅ Cookie Banner LGPD — consentimento com link para política de privacidade
- ✅ Notificações — sino no header com badge de não lidas, dropdown com lista
- ✅ Rodapé com faixa `.sin-stripe` (laranja→verde→amarelo→azul) + "Governo do Estado do RN | infra-RN"
- ✅ **Identidade Visual SIN-RN v3** — Barlow/Barlow Condensed, tokens `brand-*`/`accent-*`/`success-*`/`warning-*`, motivo `.sin-stripe`
- ✅ Calculadora de Engenharia — drawer com cubicagem, conversão de unidades, BDI e INCC
- ✅ Componentes inline no detalhe do contrato: `CronogramaContent`, `CurvaSContent`, `EventosContratuaisContent`, `ArtRrtContent`, `MedicoesContent`

### 2.3 Pendências do Bloco 2 ⏳

- ⏳ `/empresa/obras` — Lista das obras vinculadas à empresa logada

---

## 🏢 BLOCO 3 — Portal da Empresa Executora

**Status: `✅ Backend completo` / `✅ Frontend conectado à API real`**

### Backend ✅
- ✅ Diário de Obras — CRUD completo (`GET/POST/PUT /empresa/obras/{id}/diario`)
- ✅ Medições — rascunho, assinatura digital SHA-256, avaliação fiscal, fluxo de aprovação/reprovação
- ✅ RN01 — Travamento por ART implementado em `services/portal.py`
- ✅ Notificações — sistema (`GET /notificacoes`, `PATCH /notificacoes/{id}/lida`)
- ✅ Alertas automáticos — geração por obra (`POST /alertas/gerar`), delegação, resolução
- ✅ Delegação — CRUD (`POST/GET/DELETE /delegacoes`), vinculo fiscal/apoio por obra

### Frontend — Páginas ✅
| Página | Rota | Arquivo | Status |
|---|---|---|---|
| Diário de Obras | `/empresa/obras/:id/diario` | `pages/DiarioObras.tsx` | ✅ useQuery real + formulário POST |
| Medições | `/empresa/obras/:id/medicoes` | `pages/Medicoes.tsx` | ✅ useQuery real + modal de assinatura |
| Abas na Obra/Contrato | — | `DetalheObra.tsx` / `DetalheContrato.tsx` | ✅ Diário e Medições como abas inline |

### Pendências do Bloco 3 ⏳
- ⏳ Wizard de nova medição (Metas → Submetas → Eventos)

---

## 🔧 BLOCO 6 — Funcionalidades Transversais e UX

**Status: `✅ Implementado`**

### 6.1 Melhorias de Interface ✅
- ✅ Rodapé com "Governo do Estado do RN | infra-RN | Política de Privacidade"
- ✅ Sidebar reordenada: Dashboard, Contratos, Diário, Quadro, Relatório, Medições
- ✅ Modal de Perfil — abre ao clicar no nome do usuário (foto, dados, matrícula readonly)
- ✅ Modo escuro — toggle ☀/🌙 com persistência em localStorage
- ✅ Cookie Banner LGPD — consentimento explícito com link para política

### 6.2 LGPD ✅
- ✅ Página de Política de Privacidade (`/privacidade`)
- ✅ Banner de cookies com Aceitar/Rejeitar
- ✅ Consenso persistido em localStorage

### 6.3 Empresas ✅
- ✅ `GET /api/empresas/:id` — detalhes + total de contratos e obras
- ✅ `GET /api/empresas/:id/contratos` — lista de contratos vinculados
- ✅ Página de Detalhe da Empresa (`/empresas/:id`) — dados reais
- ✅ Empresa clicável nos cards de contrato, detalhe do contrato e detalhe da obra

### 6.4 Perfil e Atualização de Dados ✅
- ✅ Modal de perfil com foto (upload via FileReader, persistida em localStorage)
- ✅ `PATCH /api/auth/me` — atualiza nome, email, telefone, cargo
- ✅ Matrícula/CNPJ bloqueado para edição

### 6.5 Relatórios ✅
- ✅ `GET /api/relatorios/resumo` — dados agregados: KPIs, status, órgãos, valores
- ✅ Página de Relatório (`/relatorio`) — gráficos de barras com CSS puro
- ✅ Barras: obras por status, obras por órgão, valor por órgão

### 6.6 Notificações ✅
- ✅ `GET /api/notificacoes` — lista com filtro de não lidas
- ✅ `GET /api/notificacoes/nao-lidas/count` — contagem para badge
- ✅ `PATCH /api/notificacoes/{id}/lida` — marcar como lida
- ✅ Sino no header com badge de contagem (atualiza a cada 30s)
- ✅ Dropdown com lista — clique marca como lida

### 6.7 Detalhe do Contrato Unificado ✅
- ✅ DetalheContrato agora inclui todos os dados da obra vinculada
- ✅ Barras de progresso, KPIs da obra, prazos, metas, histórico, observações
- ✅ Abas Detalhes | Diário | Medições no contrato
- ✅ `?tab=` query param para navegação direta entre abas
- ✅ Redirect de `/obras/:id` → `/contratos/:contratoId`

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

**Status: `🔄 Parcialmente iniciado`**

| Artefato | Status |
|---|---|
| Curva-S de progresso (backend + componente frontend) | ✅ `api/curva_s.py` + `CurvaSContent.tsx` |
| Alertas automáticos por obra (prazo, vistoria, ART, paralisação) | ✅ `api/alertas.py` + `services/alerta.py` |
| Export de relatório (Excel/PDF) | ✅ `services/export_relatorio.py` |
| Mapa de Calor (PostGIS + Mapbox) | ⏳ |
| Geocodificação de municípios (`obras.localizacao`) | ⏳ |
| Dashboard Executivo completo | ⏳ |
| Assistente de IA (Gemini / OpenAI) | ⏳ |
| Alertas agendados automaticamente (APScheduler/cron) | ⏳ |

---

## 🛡️ Segurança e Infraestrutura

| Artefato | Status |
|---|---|
| Rate limiting no `/auth/login` (20 req/min) | ✅ slowapi |
| Health check real (DB `SELECT 1` + MinIO `list_buckets`) | ✅ |
| Refresh token automático no frontend | ✅ interceptor Axios |
| Todos os endpoints protegidos com RBAC | ✅ `require_minimum_role` |
| `POST /auth/registrar` protegido (COORDENADOR+) | ✅ |
| CI pipeline: lint + typecheck + testes + coverage + build | ✅ GitHub Actions |
| Lint Python (Ruff — 0 erros) | ✅ `pyproject.toml` |
| Pre-commit hooks (ruff + eslint) | ✅ `.pre-commit-config.yaml` |
| Frontend produção: nginx:alpine (multi-stage Dockerfile) | ✅ `frontend/Dockerfile.prod` |
| `docker-compose.prod.yml` (nginx, sem hot-reload, sem volumes) | ✅ |
| `make validate` (ruff + pytest + eslint + tsc + build) | ✅ |
| Token blacklist (revogação de tokens) | ⏳ Redis ou set em memória |
| Refresh token rotation (novo refresh a cada uso) | ⏳ |
| Usuário não-root nos Dockerfiles | ⏳ |
| Monitoramento (Prometheus + Grafana) | ⏳ |

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
| `@tanstack/react-query` não encontrado (Windows) | `node_modules` local desatualizado | Rodar `npm install` no diretório `frontend/` |
| `obras.map is not a function` no Dashboard | `/obras` retorna `PaginatedResponse` (não array) | Corrigido `Dashboard.tsx` e `DetalheContrato.tsx` para acessar `data.items` |
| `tsc --noEmit` falhava com TS6306/TS6310 | `tsconfig.node.json` com `noEmit:true` sendo referenciado como project reference | Substituído `noEmit:true` por `composite:true` |
| `variacao` possivelmente null em `DetalheContrato` | `variacao !== 0` não narrowava `number \| null` | Adicionado `variacao != null &&` antes da comparação |
| `POST /auth/registrar` sem autenticação | Endpoint criado sem dependency de role | Adicionado `require_minimum_role(Role.COORDENADOR)` |

---

## 📁 Árvore do Projeto (estado atual)

```
Sin-Obras/
├── .env / .env.example               ✅
├── .gitignore                        ✅
├── .pre-commit-config.yaml           ✅ (ruff + eslint)
├── docker-compose.yml                ✅ (dev: hot-reload)
├── docker-compose.prod.yml           ✅ (prod: nginx + uvicorn sem reload)
├── Makefile                          ✅ (test com coverage, lint, validate)
├── README.md                         ✅
├── AGENTS.md                         ✅
├── PROGRESSO.md                      ✅ (este arquivo)
│
├── .github/
│   ├── workflows/ci.yml              ✅ (2 jobs: frontend + backend com coverage)
│   └── PULL_REQUEST_TEMPLATE.md      ✅
│
├── Docs/
│   ├── Identidade-Visual-SIN-RN-Completa/ ✅ (brand guide v3 — HTML + DESIGN-HANDOFF + MANIFEST)
│   ├── basico/                        ✅ (história de usuário + requisitos básicos)
│   └── relatorio_banco/              ✅ (relatório de reestruturação do banco)
│
├── backend/
│   ├── Dockerfile                    ✅
│   ├── requirements.txt              ✅ (inclui slowapi, pytest, pytest-cov, ruff)
│   ├── pyproject.toml                ✅ (ruff config)
│   ├── alembic.ini                   ✅
│   ├── alembic/
│   │   ├── env.py                    ✅ (filtro PostGIS)
│   │   └── versions/                 ✅ (5 migrations)
│   ├── app/
│   │   ├── main.py                   ✅ (16 routers + health check + rate limiter)
│   │   ├── seed.py                   ✅ (5 usuários + 1 obra demo)
│   │   ├── import_acompanhamento.py  ✅ (595 contratos)
│   │   ├── core/                     ✅ (settings, database, rbac, security)
│   │   ├── models/                   ✅ (10 arquivos, 30 tabelas)
│   │   ├── schemas/
│   │   │   ├── common.py             ✅ (PaginatedResponse)
│   │   │   ├── auth.py               ✅
│   │   │   ├── contrato.py           ✅ (EmpresaResumo, OrgaoResumo)
│   │   │   ├── empresa.py            ✅ (EmpresaDetalhe, ContratoResumo)
│   │   │   ├── obra.py               ✅
│   │   │   ├── portal.py             ✅ (Diario, Medicao, Notificacao)
│   │   │   ├── relatorio.py          ✅ (RelatorioResumo)
│   │   │   ├── tarefa.py             ✅
│   │   │   ├── alerta.py             ✅
│   │   │   ├── delegacao.py          ✅
│   │   │   └── acompanhamento.py     ✅
│   │   ├── api/                      ✅ (16 routers — todos com RBAC)
│   │   │   ├── auth.py               ✅ (login, refresh, me, logout, registrar[COORDENADOR+], update me)
│   │   │   ├── obras.py              ✅
│   │   │   ├── contratos.py          ✅
│   │   │   ├── empresas.py           ✅ (detalhe + contratos vinculados)
│   │   │   ├── relatorios.py         ✅ (resumo agregado)
│   │   │   ├── portal.py             ✅ (diário, medições, avaliação fiscal)
│   │   │   ├── notificacoes.py       ✅
│   │   │   ├── orgaos.py             ✅
│   │   │   ├── cronograma.py         ✅
│   │   │   ├── tarefas.py            ✅
│   │   │   ├── art_rrt.py            ✅
│   │   │   ├── vistorias.py          ✅
│   │   │   ├── alertas.py            ✅ (gerar, resolver, delegar)
│   │   │   ├── delegacao.py          ✅ (CRUD delegações)
│   │   │   ├── acompanhamento.py     ✅ (eventos contratuais)
│   │   │   └── curva_s.py            ✅ (curva-S de progresso)
│   │   └── services/                 ✅ (14 serviços)
│   └── tests/
│       ├── __init__.py               ✅
│       ├── conftest.py               ✅ (sync engine + async API)
│       ├── test_auth.py              ✅ (7 testes)
│       └── test_obras.py             ✅ (7 testes)
│
├── frontend/
│   ├── Dockerfile                    ✅ (dev: node:22-slim + npm run dev)
│   ├── Dockerfile.prod               ✅ (prod: multi-stage → nginx:alpine)
│   ├── nginx.conf                    ✅ (SPA routing, cache assets, gzip)
│   ├── package.json                  ✅ (React 19, TypeScript, TanStack Query, react-hook-form, zod)
│   ├── tsconfig.json                 ✅ (strict:true, noUnusedLocals, noUnusedParameters)
│   ├── tsconfig.node.json            ✅ (composite:true — corrige project reference)
│   ├── vite-env.d.ts                 ✅
│   ├── vite.config.ts                ✅
│   ├── eslint.config.js              ✅ (TypeScript)
│   └── src/
│       ├── main.tsx                  ✅ (QueryClientProvider + ErrorBoundary)
│       ├── App.tsx                   ✅ (React Router v7 — 17 rotas)
│       ├── types/index.ts            ✅ (tipos centralizados)
│       ├── utils/format.ts           ✅ (fmtCurrency, fmtDate, fmtPercent)
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Layout.tsx        ✅ (ProtectedRoute + header + calculadora + rodapé stripe)
│       │   │   ├── Sidebar.tsx       ✅ (RBAC 6 roles + brand azul + condensed logo + stripe)
│       │   │   └── PerfilModal.tsx   ✅ (abre ao clicar no nome do usuário)
│       │   ├── ErrorBoundary.tsx     ✅
│       │   ├── CookieBanner.tsx      ✅ (LGPD consentimento)
│       │   ├── NotificacoesBell.tsx  ✅ (sino + badge + dropdown)
│       │   ├── CalculadoraDrawer.tsx ✅ (cubicagem, conversão, BDI, INCC)
│       │   ├── CronogramaContent.tsx ✅ (árvore Meta → Submeta → Evento)
│       │   ├── CurvaSContent.tsx     ✅ (curva-S de progresso físico-financeiro)
│       │   ├── EventosContratuaisContent.tsx ✅ (aditivos, paralisações, apostilamentos)
│       │   └── ArtRrtContent.tsx     ✅ (gestão de ART/RRT)
│       ├── hooks/
│       │   └── useDarkMode.ts        ✅
│       ├── pages/
│       │   ├── Login.tsx             ✅ (react-hook-form + zod)
│       │   ├── Dashboard.tsx         ✅ (useQuery stats + contratos)
│       │   ├── Obras.tsx             ✅ (useQuery + paginação)
│       │   ├── DetalheObra.tsx       ✅ (abas Detalhes/Diário/Medições)
│       │   ├── NovaObra.tsx          ✅ (multi-step + react-hook-form + zod por etapa)
│       │   ├── Contratos.tsx         ✅ (useQuery + paginação + empresa link)
│       │   ├── DetalheContrato.tsx   ✅ (unificado obra + abas + ?tab=)
│       │   ├── Quadro.tsx            ✅ (Kanban)
│       │   ├── DiarioObras.tsx       ✅ (conectado ao endpoint real)
│       │   ├── Medicoes.tsx          ✅ (conectado ao endpoint real)
│       │   ├── Relatorio.tsx         ✅ (gráficos de barras com dados reais)
│       │   ├── Alertas.tsx           ✅ (central de alertas + delegação + resolução)
│       │   ├── Gestao.tsx            ✅ (delegação de obras para fiscais/apoios)
│       │   ├── Privacidade.tsx       ✅ (LGPD)
│       │   ├── DetalheEmpresa.tsx    ✅ (dados reais + contratos)
│       │   ├── RedirectObra.tsx      ✅ (redireciona /obras/:id → /contratos/:id)
│       │   └── NotFound.tsx          ✅
│       ├── services/api.ts           ✅ (Axios + JWT + refresh interceptor)
│       └── store/auth.ts             ✅ (Zustand + persist + refreshToken)
│
└── mobile/
    ├── App.tsx                       🔄 (estrutura Expo)
    └── src/                          🔄 (telas, serviços — integração pendente)
```
