# SIN-Obras — Dump do Banco de Dados Atual

> PostgreSQL 16 + PostGIS 3.4 | SQLAlchemy Async | 15 tabelas

---

## Diagrama de Dependências (FK)

```
usuarios ──────────────────────────────────────────────────────────
  │         │            │            │           │           │
  ▼         ▼            ▼            ▼           ▼           ▼
contratos  obras      medicoes    vistorias   tarefas    notificacoes
(empresa)  (resp,     (empresa)   (fiscal)    (resp)     (usuario)
           contrato)       │          │
  │           │            │          │
  │           │            │          ├──────────┬────────────────┐
  │           ▼            │          ▼          ▼                ▼
  │         metas          │     checklist_items  fotos_vistoria  audit_logs
  │           │            │          │                           (usuario)
  │           ▼            │          │
  │        submetas        │          ▼
  │           │            │        eventos
  │           ▼            │
  │        eventos ◄───────┘
  │
  ▼
art_rrt (obra, usuario)
```

---

## 1. usuarios

*Arquivo:* `backend/app/models/usuario.py`
*Tabela:* `usuarios`

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | UUID | PK, default uuid4 |
| `nome` | VARCHAR(255) | NOT NULL |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL |
| `matricula_cnpj` | VARCHAR(20) | UNIQUE, NOT NULL, INDEX |
| `senha_hash` | TEXT | NOT NULL |
| `tipo` | ENUM (role_enum) | NOT NULL — EMPRESA, FISCAL, ENGENHEIRO, COORDENADOR, SECRETARIO |
| `ativo` | BOOLEAN | DEFAULT TRUE |
| `telefone` | VARCHAR(20) | NULLABLE |
| `cargo` | VARCHAR(100) | NULLABLE |
| `criado_em` | TIMESTAMPTZ | DEFAULT NOW() |
| `atualizado_em` | TIMESTAMPTZ | DEFAULT NOW(), ON UPDATE NOW() |

**Relacionamentos:**
- `audit_logs` → AuditLog (one-to-many)

---

## 2. contratos

*Arquivo:* `backend/app/models/obra.py`
*Tabela:* `contratos`

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | UUID | PK, default uuid4 |
| `numero_processo` | VARCHAR(50) | NOT NULL |
| `numero_contrato` | VARCHAR(50) | UNIQUE, NOT NULL, INDEX |
| `valor_global` | NUMERIC(15,2) | NOT NULL |
| `data_assinatura` | DATE | NOT NULL |
| `data_vigencia` | DATE | NOT NULL |
| `empresa_id` | UUID | FK → usuarios.id, NOT NULL |
| `objeto` | TEXT | NULLABLE |
| `criado_em` | TIMESTAMPTZ | DEFAULT NOW() |

**Relacionamentos:**
- `empresa` → Usuario
- `obras` → Obra (one-to-many)

---

## 3. obras

*Arquivo:* `backend/app/models/obra.py`
*Tabela:* `obras`

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | UUID | PK, default uuid4 |
| `titulo` | VARCHAR(300) | NOT NULL |
| `descricao` | TEXT | NULLABLE |
| `localizacao` | GEOMETRY(POINT, 4326) | NULLABLE — PostGIS |
| `endereco` | VARCHAR(500) | NULLABLE |
| `municipio` | VARCHAR(100) | NULLABLE |
| `valor_contrato` | NUMERIC(15,2) | NOT NULL |
| `data_inicio` | DATE | NULLABLE |
| `data_fim_prevista` | DATE | NULLABLE |
| `status` | ENUM (status_obra_enum) | DEFAULT PLANEJADA — PLANEJADA, EM_EXECUCAO, PARALISADA, CONCLUIDA |
| `saude` | ENUM (saude_obra_enum) | DEFAULT VERDE — VERDE, AMARELO, VERMELHO |
| `percentual_executado` | NUMERIC(5,2) | DEFAULT 0.00 |
| `raio_geofencing_metros` | INTEGER | DEFAULT 200 |
| `contrato_id` | UUID | FK → contratos.id, NULLABLE |
| `responsavel_id` | UUID | FK → usuarios.id, NULLABLE |
| `ativo` | BOOLEAN | DEFAULT TRUE |
| `criado_em` | TIMESTAMPTZ | DEFAULT NOW() |
| `atualizado_em` | TIMESTAMPTZ | DEFAULT NOW(), ON UPDATE NOW() |

**Relacionamentos:**
- `contrato` → Contrato
- `responsavel` → Usuario
- `metas` → Meta (one-to-many, cascade delete-orphan)

---

## 4. metas

*Arquivo:* `backend/app/models/obra.py`
*Tabela:* `metas`

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | UUID | PK, default uuid4 |
| `obra_id` | UUID | FK → obras.id, ON DELETE CASCADE, NOT NULL |
| `descricao` | VARCHAR(500) | NOT NULL |
| `valor` | NUMERIC(15,2) | DEFAULT 0.00 |
| `ordem` | INTEGER | DEFAULT 0 |

**Relacionamentos:**
- `obra` → Obra
- `submetas` → Submeta (one-to-many, cascade delete-orphan)

---

## 5. submetas

*Arquivo:* `backend/app/models/obra.py`
*Tabela:* `submetas`

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | UUID | PK, default uuid4 |
| `meta_id` | UUID | FK → metas.id, ON DELETE CASCADE, NOT NULL |
| `descricao` | VARCHAR(500) | NOT NULL |
| `valor` | NUMERIC(15,2) | DEFAULT 0.00 |
| `percentual_previsto` | NUMERIC(5,2) | DEFAULT 0.00 |

**Relacionamentos:**
- `meta` → Meta
- `eventos` → Evento (one-to-many, cascade delete-orphan)

---

## 6. eventos

*Arquivo:* `backend/app/models/obra.py`
*Tabela:* `eventos`

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | UUID | PK, default uuid4 |
| `submeta_id` | UUID | FK → submetas.id, ON DELETE CASCADE, NOT NULL |
| `descricao` | VARCHAR(500) | NOT NULL |
| `quantidade` | NUMERIC(12,4) | DEFAULT 0 |
| `unidade` | VARCHAR(20) | DEFAULT 'un' |
| `valor_unitario` | NUMERIC(12,4) | DEFAULT 0 |

**Propriedade computada:** `valor_total` = quantidade × valor_unitario

---

## 7. diario_obra

*Arquivo:* `backend/app/models/portal.py`
*Tabela:* `diario_obra`

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | UUID | PK, default uuid4 |
| `obra_id` | UUID | FK → obras.id, ON DELETE CASCADE, NOT NULL |
| `usuario_id` | UUID | FK → usuarios.id, NOT NULL |
| `data_registro` | DATE | NOT NULL |
| `clima` | VARCHAR(100) | NULLABLE |
| `qtd_funcionarios` | INTEGER | DEFAULT 0 |
| `equipamentos` | TEXT | NULLABLE |
| `ocorrencias` | TEXT | NULLABLE |
| `atividades_realizadas` | TEXT | NULLABLE |
| `criado_em` | TIMESTAMPTZ | DEFAULT NOW() |

---

## 8. medicoes

*Arquivo:* `backend/app/models/portal.py`
*Tabela:* `medicoes`

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | UUID | PK, default uuid4 |
| `obra_id` | UUID | FK → obras.id, ON DELETE CASCADE, NOT NULL |
| `empresa_usuario_id` | UUID | FK → usuarios.id, NOT NULL |
| `numero_medicao` | INTEGER | NOT NULL |
| `status` | ENUM (status_medicao_enum) | DEFAULT RASCUNHO — RASCUNHO, ASSINADA, EM_FISCALIZACAO, APROVADA, REPROVADA |
| `eventos_declarados` | JSONB | NULLABLE — [{evento_id, percentual_declarado, observacao}] |
| `assinada_em` | TIMESTAMPTZ | NULLABLE |
| `enviada_em` | TIMESTAMPTZ | NULLABLE |
| `hash_assinatura` | VARCHAR(64) | NULLABLE — SHA-256 |
| `observacao_fiscal` | TEXT | NULLABLE |
| `criado_em` | TIMESTAMPTZ | DEFAULT NOW() |

---

## 9. notificacoes

*Arquivo:* `backend/app/models/portal.py`
*Tabela:* `notificacoes`

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | UUID | PK, default uuid4 |
| `usuario_id` | UUID | FK → usuarios.id, ON DELETE CASCADE, NOT NULL |
| `titulo` | VARCHAR(200) | NOT NULL |
| `mensagem` | TEXT | NULLABLE |
| `canal` | ENUM (canal_notificacao_enum) | DEFAULT SISTEMA — SISTEMA, EMAIL, PUSH |
| `lida` | BOOLEAN | DEFAULT FALSE |
| `criado_em` | TIMESTAMPTZ | DEFAULT NOW() |

---

## 10. vistorias

*Arquivo:* `backend/app/models/vistoria.py`
*Tabela:* `vistorias`

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | UUID | PK, default uuid4 |
| `obra_id` | UUID | FK → obras.id, ON DELETE CASCADE, NOT NULL |
| `fiscal_id` | UUID | FK → usuarios.id, NOT NULL |
| `medicao_id` | UUID | FK → medicoes.id, NULLABLE |
| `local_checkin` | GEOMETRY(POINT, 4326) | NULLABLE — PostGIS |
| `checkin_em` | TIMESTAMPTZ | NULLABLE |
| `dentro_raio` | BOOLEAN | DEFAULT FALSE |
| `distancia_metros` | FLOAT | NULLABLE |
| `resultado` | ENUM (resultado_vistoria_enum) | DEFAULT PENDENTE — PENDENTE, CONFORME, NAO_CONFORME |
| `observacoes` | TEXT | NULLABLE |
| `finalizada_em` | TIMESTAMPTZ | NULLABLE |
| `criado_em` | TIMESTAMPTZ | DEFAULT NOW() |

---

## 11. checklist_items

*Arquivo:* `backend/app/models/vistoria.py`
*Tabela:* `checklist_items`

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | UUID | PK, default uuid4 |
| `vistoria_id` | UUID | FK → vistorias.id, ON DELETE CASCADE, NOT NULL |
| `evento_id` | UUID | FK → eventos.id, NOT NULL |
| `atestado` | BOOLEAN | DEFAULT FALSE |
| `observacao` | TEXT | NULLABLE |

---

## 12. fotos_vistoria

*Arquivo:* `backend/app/models/vistoria.py`
*Tabela:* `fotos_vistoria`

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | UUID | PK, default uuid4 |
| `vistoria_id` | UUID | FK → vistorias.id, ON DELETE CASCADE, NOT NULL |
| `checklist_item_id` | UUID | FK → checklist_items.id, NULLABLE |
| `url_storage` | VARCHAR(500) | NULLABLE — S3/MinIO |
| `filename` | VARCHAR(200) | NULLABLE |
| `coordenadas` | GEOMETRY(POINT, 4326) | NULLABLE — PostGIS |
| `hash_sha256` | VARCHAR(64) | NULLABLE |
| `carimbo_servidor` | TIMESTAMPTZ | NULLABLE |
| `exif_metadata` | JSONB | NULLABLE |
| `origem_camera` | BOOLEAN | DEFAULT TRUE |
| `criado_em` | TIMESTAMPTZ | DEFAULT NOW() |

---

## 13. art_rrt

*Arquivo:* `backend/app/models/art_rrt.py`
*Tabela:* `art_rrt`

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | UUID | PK, default uuid4 |
| `numero` | VARCHAR(100) | UNIQUE, NOT NULL, INDEX |
| `tipo` | VARCHAR(10) | NOT NULL — 'ART' ou 'RRT' |
| `obra_id` | UUID | FK → obras.id, ON DELETE CASCADE, NOT NULL |
| `usuario_id` | UUID | FK → usuarios.id, ON DELETE CASCADE, NOT NULL |
| `data_emissao` | DATE | NULLABLE |
| `data_validade` | DATE | NULLABLE |
| `arquivo_url` | VARCHAR(500) | NULLABLE |
| `ativa` | BOOLEAN | DEFAULT TRUE |
| `criado_em` | TIMESTAMPTZ | DEFAULT NOW() |

---

## 14. tarefas

*Arquivo:* `backend/app/models/tarefa.py`
*Tabela:* `tarefas`

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | UUID | PK, default uuid4 |
| `titulo` | VARCHAR(200) | NOT NULL |
| `descricao` | TEXT | NULLABLE |
| `status` | ENUM (status_tarefa_enum) | DEFAULT A_FAZER — A_FAZER, EM_ANDAMENTO, CONCLUIDO |
| `prioridade` | ENUM (prioridade_tarefa_enum) | DEFAULT MEDIA — BAIXA, MEDIA, ALTA, URGENTE |
| `prazo` | DATE | NULLABLE |
| `obra_id` | UUID | FK → obras.id, ON DELETE CASCADE, NULLABLE |
| `responsavel_id` | UUID | FK → usuarios.id, ON DELETE SET NULL, NULLABLE |
| `criado_em` | TIMESTAMPTZ | DEFAULT NOW() |

---

## 15. audit_logs

*Arquivo:* `backend/app/models/auditoria.py`
*Tabela:* `audit_logs`

| Coluna | Tipo | Constraints |
|---|---|---|
| `id` | UUID | PK, default uuid4 |
| `usuario_id` | UUID | FK → usuarios.id, NOT NULL |
| `entidade` | VARCHAR(100) | NOT NULL, INDEX |
| `entidade_id` | VARCHAR(36) | NOT NULL, INDEX |
| `acao` | VARCHAR(50) | NOT NULL — CREATE, UPDATE, DELETE, APPROVE, REJECT, LOGIN... |
| `dados_antes` | JSONB | NULLABLE |
| `dados_depois` | JSONB | NULLABLE |
| `descricao` | TEXT | NULLABLE |
| `ip_address` | VARCHAR(45) | NULLABLE |
| `user_agent` | VARCHAR(500) | NULLABLE |
| `criado_em` | TIMESTAMPTZ | DEFAULT NOW(), INDEX |

---

## Enums do Sistema

| Enum | Valores | Usado em |
|---|---|---|
| `Role` | EMPRESA, FISCAL, ENGENHEIRO, COORDENADOR, SECRETARIO | usuarios.tipo |
| `StatusObra` | PLANEJADA, EM_EXECUCAO, PARALISADA, CONCLUIDA | obras.status |
| `SaudeObra` | VERDE, AMARELO, VERMELHO | obras.saude |
| `StatusMedicao` | RASCUNHO, ASSINADA, EM_FISCALIZACAO, APROVADA, REPROVADA | medicoes.status |
| `StatusTarefa` | A_FAZER, EM_ANDAMENTO, CONCLUIDO | tarefas.status |
| `PrioridadeTarefa` | BAIXA, MEDIA, ALTA, URGENTE | tarefas.prioridade |
| `ResultadoVistoria` | PENDENTE, CONFORME, NAO_CONFORME | vistorias.resultado |
| `CanalNotificacao` | SISTEMA, EMAIL, PUSH | notificacoes.canal |

---

## Hierarquia RBAC

```
EMPRESA (0) < FISCAL (1) < ENGENHEIRO (2) < COORDENADOR (3) < SECRETARIO (4)
```

- `require_role(*roles)` — conjunto exato de perfis
- `require_minimum_role(role)` — aceita o perfil informado ou superior

---

## Índices

| Tabela | Coluna(s) | Tipo |
|---|---|---|
| `usuarios` | `email` | UNIQUE |
| `usuarios` | `matricula_cnpj` | UNIQUE + INDEX |
| `contratos` | `numero_contrato` | UNIQUE + INDEX |
| `art_rrt` | `numero` | UNIQUE + INDEX |
| `audit_logs` | `entidade` | INDEX |
| `audit_logs` | `entidade_id` | INDEX |
| `audit_logs` | `criado_em` | INDEX |

---

## Extensões PostgreSQL

- **postgis** — PostGIS 3.4 (geolocalização de obras, vistorias, fotos)
- `CREATE EXTENSION IF NOT EXISTS postgis` executado no startup e no seed

---

## Infraestrutura

| Componente | Detalhe |
|---|---|
| Engine | Async SQLAlchemy (`create_async_engine` + asyncpg) |
| Pool | 10 conexões, max overflow 20, pool_pre_ping |
| Session | `AsyncSessionLocal`, `expire_on_commit=False` |
| Migrations | Alembic (async), sem versões geradas ainda |
| Criação | `Base.metadata.create_all` no startup (dev) |
| Seed | Idempotente, 5 usuários + 1 obra demo com cronograma |
