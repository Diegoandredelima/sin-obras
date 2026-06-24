# AGENTS.md — SIN-Obras

## Modelo de domínio (documento-mãe → objeto → item)
- **Contrato** é o documento jurídico principal (documento-mãe). Um contrato
  formaliza a execução de **um ou mais objetos** (`Contrato 1—N Objeto`).
- **Objeto** (tabela `objetos`) é o que está sendo contratado — uma obra, um
  serviço ou um conjunto de atividades. Pertence a um contrato via
  `objetos.contrato_id` (link canônico). *Antes chamava-se `Obra`.*
- **Item** (tabela `itens`) são as partes constitutivas de um objeto
  (`Objeto 1—N Item`).
- O cronograma físico-financeiro continua: `Objeto → Meta → Submeta → Evento`.
- Todas as FKs das tabelas-filhas usam `objeto_id` (não mais `obra_id`). Os
  enums são `status_objeto_enum`, `situacao_objeto_enum`, `saude_objeto_enum`.
- Termos mantidos por serem nomenclatura legal/diferente: `DiarioObra` /
  "Diário de Obra" (RDO), `mao_de_obra` (força de trabalho), "Fiscal de Obras"
  (cargo) e a marca `SIN-Obras`/`sinobras`.

## Fluxo de desenvolvimento
- Tudo roda em Docker: `make up` (ou `docker compose up -d`)
- Após subir pela primeira vez: `make migrate-apply` e depois `make seed`
- Rebuild do backend após mudar dependências: `docker compose build backend`
- Rebuild do frontend após mudar dependências: `docker compose build frontend`
- Resetar banco (destrutivo): `make reset-db`
- Ver todos os atalhos: `make help`

## Pegadinhas de comandos
- Dentro do container backend, Alembic e `python -m app.*` **exigem** `PYTHONPATH=/app`:
  ```
  docker compose exec -e PYTHONPATH=/app backend alembic upgrade head
  docker compose exec backend sh -c "PYTHONPATH=/app python -m app.seed"
  ```
  Os targets do `make` (`make migrate`, `make seed`) já cuidam disso — prefira usá-los.
- **Windows (Git Bash)**: o `make` não está disponível. Use `docker compose exec` direto. Além disso, o Git Bash converte caminhos POSIX (`/app`) em caminhos Windows — prefixe com `MSYS_NO_PATHCONV=1`:
  ```
  MSYS_NO_PATHCONV=1 docker compose exec -e PYTHONPATH=/app backend alembic upgrade head
  MSYS_NO_PATHCONV=1 docker compose exec -e PYTHONPATH=/app \
    -e DATABASE_URL="postgresql+asyncpg://sinobras:sinobras_dev_2026@postgres:5432/sinobras_test" \
    backend pytest tests/ -q
  ```

## Backend — arquitetura e peculiaridades
- **bcrypt fixado na 3.2.2** — a versão 4.x removeu `__about__`, quebrando o passlib. Não atualize sem testar o login.
- **Criação dupla de tabelas**: `Base.metadata.create_all` roda no startup E o Alembic gerencia migrations. Ambos dependem de `import app.models` (import com efeito colateral que registra todos os modelos). Nunca remova essa linha do `main.py` nem do `alembic/env.py`. **Consequência prática**: migrações que criam tabelas ou colunas novas devem ser **defensivas** — checar existência antes de criar. Use `_has_table()` e `_has_column()` com `sa.inspect(op.get_bind())`, e `checkfirst=True` para enums. Ver migração `f7a1b2c3d4e5` como referência.
- **Filtro include_object** no `alembic/env.py` exclui tabelas internas do PostGIS/Tiger. Se modificar, lembre que a imagem `postgis/postgis:16-3.4` traz dezenas de tabelas de extensões.
- Porta do PostgreSQL no host: **5433** (evita conflito); dentro da rede Docker use `postgres:5432`.
- **RBAC**: hierarquia em `app/core/rbac.py` — EMPRESA(0) < FISCAL(1) < APOIO_N1(2) < APOIO_N2(3) < COORDENADOR(4) < SECRETARIO(5). `ENGENHEIRO` é legado e equivale a APOIO_N2(3). Use `require_role(*roles)` para conjunto exato, `require_minimum_role(role)` para hierarquia. Todos os endpoints são protegidos; `POST /auth/registrar`, `GET /auth/usuarios` e `PATCH /auth/usuarios/{id}` exigem COORDENADOR+.
- Seed é idempotente — pula se já existir alguma linha em `Usuario`.
- **Rate limiting**: `slowapi` com 20 req/min no `/auth/login`. Configurar em `app/main.py` e `app/api/auth.py`.
- **Health check real**: `GET /api/health` verifica banco (`SELECT 1`) e MinIO (`list_buckets`). Retorna 503 se degradado.
- **API versionada**: todos os routers prefixados com `/api`. Paginação padrão: `{ items, total, skip, limit }`.

## Frontend — arquitetura e peculiaridades
- **TypeScript** em todos os arquivos (`.tsx`/`.ts`) com `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`. Config em `tsconfig.json` com path aliases `@/`. `tsconfig.node.json` usa `composite: true` (necessário para project references funcionar com `tsc --noEmit`).
- **Tailwind CSS v4** via plugin `@tailwindcss/vite`. **Não existe** `tailwind.config.js` — a config fica no `src/index.css`.
- React Router v7, Zustand com middleware `persist` (chave: `sinobras-auth`).
- **TanStack Query** (`@tanstack/react-query`) para cache e fetching de dados do servidor. Use `useQuery`/`useMutation`, não `useState + useEffect + api.get`.
- **Validação de formulários**: `react-hook-form` + `zod` + `@hookform/resolvers`. Padrão: schema Zod → `useForm({ resolver: zodResolver(schema) })` → `register()` nos inputs → `formState.errors` para mensagens inline. Formulários multi-etapa usam `trigger(campos)` para validar somente a etapa atual antes de avançar.
- **Refresh Token**: o interceptor do Axios tenta renovar o token via `/auth/refresh` antes de fazer logout. Fila de requests concorrentes gerenciada em `src/services/api.ts`.
- **Error Boundary**: `src/components/ErrorBoundary.tsx` captura crashes de render e mostra fallback UI.
- **RBAC no frontend**: Sidebar filtra itens por `user.tipo`. EMPRESA vê Dashboard + Diário + Medições. A proteção real é feita no backend — o frontend é apenas UX.
- **Utilitários**: `src/utils/format.ts` exporta `fmtCurrency`, `fmtDate`, `fmtPercent`. Use-os, não repita código inline.
- Servidor Vite binda em `0.0.0.0` (`--host 0.0.0.0` no comando do `docker-compose.yml`).

### Páginas e componentes
- **16 páginas**: Login, Dashboard, Objetos, CadastrarObjeto, DetalheObjeto, Contratos, DetalheContrato, Quadro, DiarioObras, Medicoes, NovaMedicao, Relatorio, Privacidade, DetalheEmpresa, RedirectObjeto, NotFound
- **Perfil**: modal (`PerfilModal.tsx`) abre ao clicar no nome do usuário na sidebar. Foto via FileReader + localStorage. `PATCH /auth/me` no backend.
- **Modo escuro**: hook `useDarkMode.ts`, toggle ☀/🌙 na sidebar, classe `.dark` no `<html>`. Variantes `dark:` no Layout, header, main, footer.
- **Cookie Banner**: `CookieBanner.tsx` — consentimento LGPD com Aceitar/Rejeitar, persistido em localStorage.
- **Notificações**: `NotificacoesBell.tsx` — sino no header com badge de não lidas, dropdown com lista, clique marca como lida.
- **Relatórios**: `Relatorio.tsx` — gráficos de barras com CSS puro, dados do endpoint `/relatorios/resumo`.
- **Empresa**: `DetalheEmpresa.tsx` — dados reais com lista de contratos vinculados.
- **Rodapé**: no `Layout.tsx` com "Governo do RN | infra-RN | Política de Privacidade".
- **DetalheContrato unificado**: inclui todos os dados do objeto (progresso, KPIs, prazos, metas, histórico). Abas Detalhes|Diário|Medições com `?tab=`.
- **Diário/Medições**: conectados aos endpoints reais. Medições agora têm boletim completo (7 colunas calculadas no backend — `GET /empresa/medicoes/{id}/boletim`). Nova medição criada via `/empresa/objetos/{id}/medicoes/fiscal` (fiscal) ou `/empresa/objetos/{id}/medicoes` (empresa). Itens gerenciados em `medicao_itens`; fotos em `fotos_medicao` com hash SHA-256 e carimbo do servidor.
- **Storage**: `services/storage.py` encapsula MinIO/boto3 (`upload_bytes`). Upload real ao MinIO; fallback gracioso `mock://` se MinIO indisponível (não lança erro para o cliente).
- **Redirect**: `/objetos/:id` → busca `contrato_id` e redireciona para `/contratos/:id`.

## Testes
- **Backend**: 24 testes em `tests/` (auth + objetos + medições) com cobertura de código. Rodar com `make test` ou:
  ```
  docker compose exec -e PYTHONPATH=/app \
    -e DATABASE_URL="postgresql+asyncpg://sinobras:sinobras_dev_2026@postgres:5432/sinobras_test" \
    backend pytest tests/ -v --cov=app --cov-report=term-missing
  ```
- Banco de testes: `sinobras_test` (criado uma vez com `CREATE DATABASE` no postgres).
- Testes usam `TestClient` síncrono do Starlette. Setup em `conftest.py` com sync engine (psycopg2) para seed e async engine para API.
- Tabelas limpas entre testes via `delete()` no fixture `clean_tables` (autouse).
- `test_medicoes.py` cobre: cálculo do boletim (7 colunas), desconto de vãos, acumulado entre medições aprovadas, bloqueio sem foto por item, bloqueio sem ART, assinar (empresa), criar+concluir (fiscal), 403 empresa tentando concluir.
- **Frontend**: sem testes automatizados ainda. CI roda `npm run lint` + `npx tsc --noEmit` + `npm run build`.

## CI/CD
- `.github/workflows/ci.yml`: 2 jobs paralelos
  - `frontend-lint-build`: ESLint → TypeScript check (`strict: true`) → Build
  - `backend-tests`: PostgreSQL service → `pytest` com `--cov=app --cov-report=term-missing`

## Validação
- `make validate`: roda ruff + pytest (com coverage) + eslint + tsc + build
- `make lint`: ruff (backend) + eslint (frontend)
- `make test`: pytest com cobertura de código

## Lint
- **Backend**: `ruff` configurado em `pyproject.toml`. Ignora B008 (FastAPI Depends), E712 (SQLAlchemy `== True`), B904 (HTTPException em except).
- **Frontend**: ESLint com TypeScript. Config em `eslint.config.js`. TypeScript com `strict: true` — não desabilite `noUnusedLocals`/`noUnusedParameters`.

## Produção
- `frontend/Dockerfile.prod`: build multi-stage — Stage 1 (node:22-slim) compila o bundle Vite, Stage 2 (nginx:alpine) serve os arquivos estáticos. Node.js **não está presente** na imagem final.
- `frontend/nginx.conf`: SPA routing (`try_files $uri /index.html`), cache imutável de 1 ano em `/assets/`, gzip habilitado.
- `VITE_API_URL` é resolvido em **build-time** pelo Vite (não em runtime). Passar via `ARG` no Dockerfile.prod ou como variável antes do `docker compose build`.
- Subir em produção:
  ```bash
  VITE_API_URL=https://api.sinobras.rn.gov.br/api \
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
  ```

## Mobile
- O diretório `mobile/` é um projeto Expo + React Native. Não está integrado ao Docker. Rode separadamente com Expo CLI.
- Telas existentes: `CheckinScreen`, `ChecklistScreen`, `ResultadoVistoriaScreen`, `MedicaoScreen` (fiscal mede em campo), `SyncScreen`.
- `MedicaoScreen` usa `medicaoAPI` de `services/api.ts` e `uploadFotoMedicao` de `services/camera.ts`. Objeto passado via `OBJETO_MOCK` por ora — quando o fluxo de seleção de objeto for implementado, substituir por `navigation.params`.
- Câmera sempre abre câmera nativa (nunca galeria — RN03). Hash SHA-256 local calculado via `expo-crypto`; o backend recalcula no upload.
