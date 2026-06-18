# AGENTS.md — SIN-Obras

## Fluxo de desenvolvimento
- Tudo roda em Docker: `make up` (ou `docker compose up -d`)
- Após subir pela primeira vez: `make migrate-apply` e depois `make seed`
- Rebuild do backend após mudar dependências: `docker compose build backend`
- Resetar banco (destrutivo): `make reset-db`
- Ver todos os atalhos: `make help`

## Pegadinhas de comandos
- Dentro do container backend, Alembic e `python -m app.*` **exigem** `PYTHONPATH=/app`:
  ```
  docker compose exec -e PYTHONPATH=/app backend alembic upgrade head
  docker compose exec backend sh -c "PYTHONPATH=/app python -m app.seed"
  ```
  Os targets do `make` (`make migrate`, `make seed`) já cuidam disso — prefira usá-los.

## Backend — arquitetura e peculiaridades
- **bcrypt fixado na 3.2.2** — a versão 4.x removeu `__about__`, quebrando o passlib. Não atualize sem testar o login.
- **Criação dupla de tabelas**: `Base.metadata.create_all` roda no startup E o Alembic gerencia migrations. Ambos dependem de `import app.models` (import com efeito colateral que registra todos os modelos). Nunca remova essa linha do `main.py` nem do `alembic/env.py`.
- **Filtro include_object** no `alembic/env.py` exclui tabelas internas do PostGIS/Tiger. Se modificar, lembre que a imagem `postgis/postgis:16-3.4` traz dezenas de tabelas de extensões.
- Porta do PostgreSQL no host: **5433** (evita conflito); dentro da rede Docker use `postgres:5432`.
- 5 papéis no RBAC: EMPRESA(0) < FISCAL(1) < ENGENHEIRO(2) < COORDENADOR(3) < SECRETARIO(4). Use `require_role(*roles)` para conjunto exato, `require_minimum_role(role)` para hierarquia.
- Seed é idempotente — pula se já existir alguma linha em `Usuario`.

## Frontend — arquitetura e peculiaridades
- **Tailwind CSS v4** via plugin `@tailwindcss/vite`. **Não existe** `tailwind.config.js` — a config fica no `src/index.css`.
- React Router v7, Zustand com middleware `persist` (chave: `sinobras-auth` no localStorage).
- Interceptor do Axios injeta token `Bearer` automaticamente do store Zustand; 401 dispara logout automático.
- Servidor Vite binda em `0.0.0.0` (`--host 0.0.0.0` no comando do `docker-compose.yml`).

## Testes
- **Não há suíte de testes.** O CI (`ci.yml`) só roda `npm run build` no frontend. Verifique alterações manualmente via `curl http://localhost:8000/api/health` ou pelo Swagger em `http://localhost:8000/api/docs`.

## Mobile
- O diretório `mobile/` é um esqueleto (Expo + React Native). Não está integrado ao Docker. Rode separadamente com Expo CLI.
