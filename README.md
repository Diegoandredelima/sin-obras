# SIN-Obras 🏗️

**Sistema Integrado de Obras — Secretaria de Estado da Infraestrutura do Rio Grande do Norte**

> Sistema unificado de gestão de obras públicas: do cadastro e fiscalização em campo até a análise preditiva e conformidade legal (LGPD / TCE-RN).

---

## 🚀 Como Rodar (Desenvolvimento)

### Pré-requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e **rodando**
- Git

### 1. Clone e configure o ambiente

```bash
# Clone o repositório
git clone <url-do-repo>

# Copie o arquivo de ambiente
cp .env.example .env
# O .env já vem configurado para desenvolvimento local — não precisa alterar nada
```

### 2. Suba a stack completa

```bash
docker compose up -d
```

Aguarde ~30 segundos para os containers iniciarem. Depois:

| Serviço | URL |
|---|---|
| **API (Swagger Docs)** | http://localhost:8000/api/docs |
| **Frontend Web** | http://localhost:5173 |
| **MinIO (Storage)** | http://localhost:9001 |

### 3. Aplique as migrações do banco

```bash
# Dentro do container do backend:
docker compose exec backend alembic upgrade head
```

### 4. Popule o banco com dados de teste

```bash
docker compose exec backend python -m app.seed
```

Saída esperada com as credenciais de acesso:

```
[SECRETARIO   ] Matrícula/CNPJ: 10001            Senha: sin@2026
[COORDENADOR  ] Matrícula/CNPJ: 10002            Senha: sin@2026
[ENGENHEIRO   ] Matrícula/CNPJ: 10003            Senha: sin@2026
[FISCAL       ] Matrícula/CNPJ: 10004            Senha: sin@2026
[EMPRESA      ] Matrícula/CNPJ: 12345678000195   Senha: empresa@2026
```

### 5. Acesse o sistema

Abra http://localhost:5173 e faça login com qualquer credencial acima.

---

## 🛠️ Comandos Úteis

```bash
# Ver logs em tempo real
docker compose logs -f

# Logs apenas do backend
docker compose logs -f backend

# Abrir shell no backend
docker compose exec backend bash

# Abrir psql no banco
docker compose exec postgres psql -U sinobras -d sinobras

# Parar tudo
docker compose down

# Parar e apagar volumes (APAGA OS DADOS!)
docker compose down -v
```

---

## 📁 Estrutura do Projeto

```
Sin-Obras/
├── backend/          # FastAPI + SQLAlchemy + PostGIS
│   ├── app/
│   │   ├── api/      # Routers (endpoints)
│   │   ├── core/     # Config, Security, RBAC
│   │   ├── models/   # SQLAlchemy models
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── services/ # Business logic
│   │   ├── main.py   # FastAPI app entry point
│   │   └── seed.py   # Script de dados de desenvolvimento
│   └── alembic/      # Database migrations
├── frontend/         # Vite + React 19 + Tailwind CSS v4
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/  # API client (Axios)
│       └── store/     # State management (Zustand)
├── mobile/           # React Native + Expo (Bloco 4)
├── Docs/             # Documentação do projeto
├── docker-compose.yml
├── Makefile
└── PROGRESSO.md      # Status detalhado da implementação
```

---

## 🔐 Perfis de Acesso

| Perfil | Acesso | Descrição |
|---|---|---|
| **SECRETARIO** | Web | Dashboard executivo, mapa de calor |
| **COORDENADOR** | Web | Monitoramento global, alertas, equipes |
| **ENGENHEIRO** | Web | Gestão de obras, aprovação de medições |
| **FISCAL** | Mobile + Web | Vistorias, check-in, checklist |
| **EMPRESA** | Web | Portal restrito à sua obra |

---

## 📊 Status de Implementação

Veja o arquivo [PROGRESSO.md](./PROGRESSO.md) para o status detalhado de cada bloco.

---

## 🏛️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Front-end Web | React 19 + Tailwind CSS v4 + Vite |
| Front-end Mobile | React Native + Expo |
| Back-end | Python 3.12 + FastAPI |
| Banco de Dados | PostgreSQL 16 + PostGIS |
| Storage | MinIO (local) / AWS S3 (produção) |
| Auth | JWT + bcrypt |
| State Management | Zustand |
| Mapas | Mapbox GL JS |
