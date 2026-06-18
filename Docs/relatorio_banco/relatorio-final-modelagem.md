# SIN-Obras — Relatório Final de Modelagem e Carga de Dados

> **Data:** 18 de junho de 2026
> **Autor:** Assessoria de Informática (Diego André de Lima) + assistente
> **Objetivo:** Restruturar o banco de dados e popular com os dados oficiais
> da planilha de acompanhamento de obras da SIN-RN.

---

## 1. Ponto de partida

O banco já tinha 15 tabelas + 9 tabelas de acompanhamento (criadas na migration
`ff6285b72f48`), mas:

- **Empresa, órgão e fiscal** eram campos de texto livre (ou inexistentes),
  sem deduplicação nem integridade.
- A **situação da obra** não era modelada; a planilha usa 43 variações de texto.
- O **financeiro detalhado** (aditivo de valor, reajuste, recursos federal/estadual)
  e os **prazos rastreáveis** (vigência e execução, com início/dias/término) não
  tinham onde ser armazenados.
- Não havia nenhum dado real carregado — apenas 1 obra de demonstração (seed).

A planilha real (`Acompanhamento de obras.xlsx`) tem **595 contratos** em ~53
colunas úteis, no padrão "uma linha por contrato".

---

## 2. O que foi feito

### 2.1. Modelo (decisões)

1. **Tabelas de domínio dedicadas** — `empresas` (277) e `orgaos` (42), separadas
   de `usuarios`. *Por quê:* contratos históricos não têm conta de login;
   forçá-los em `usuarios` poluiria o RBAC. A empresa pode opcionalmente ter um
   `usuario_id` de portal.
2. **Enum `situacao_obra_enum`** com 9 estados canônicos + preservação do texto
   bruto (`situacao_origem`) e do ano (`ano_referencia`). Mantém-se o `status`
   operacional (4 estados) usado pelo app, derivado da situação.
3. **`contratos` e `obras` estendidas** com os campos financeiros, de licitação e
   de prazos (ver [`modelo-novo-der-e-logico.md`](./modelo-novo-der-e-logico.md)).
4. **Textos não-estruturados preservados** (ordem de serviço, paralisações,
   processos SEI, OBS) num bloco rotulado em `obras.observacoes` — sem perda de
   informação e sem parsing frágil. Estruturação incremental fica para depois,
   alimentando as 9 tabelas de acompanhamento já existentes.
5. **Relaxamento de NOT NULL** em `contratos.empresa_id`, `data_assinatura` e
   `data_vigencia` — dados históricos incompletos.

### 2.2. Migrations

| Revisão | Conteúdo |
|---|---|
| `ff6285b72f48` | (anterior) 9 tabelas de acompanhamento + campos de prazo |
| `b2f3a1c9d4e7` | `empresas`, `orgaos`, enum `situacao_obra_enum`, +14 col. em contratos, +18 em obras, relaxamento de NOT NULL |
| `c3d4e5f6a7b8` | `contratos.fiscal_nome`, `contratos.gestor_nome` |

As migrations `b2f3` e `c3d4` foram escritas de forma **idempotente** (guards via
inspector / `pg_type`) para conviver com o `create_all` que roda no startup com
hot-reload (cf. AGENTS.md).

### 2.3. Carga

Script `backend/app/import_acompanhamento.py` (idempotente): lê o xlsx, aplica
as regras de transformação e popula `orgaos`, `empresas`, `contratos`, `obras`.

---

## 3. Resultados e validação

| Métrica | Valor |
|---|---|
| Órgãos | 42 |
| Empresas | 277 |
| Contratos | 596 (595 oficiais + 1 demo) |
| Obras | 596 |
| Obras órfãs | **0** |
| Σ valor inicial | R$ 1.469.215.187,41 |
| Σ valor final | R$ 1.530.870.972,09 |
| Σ valor medido | R$ 770.492.135,33 |

Distribuição por situação: CONCLUIDA 339, EM_ANDAMENTO 127, RESCINDIDA 56,
PARALISADA 38, INACABADA 10, ARQUIVADA 10, A_INICIAR 7, CEDIDA 3, EXTINTA 3
(3 obras sem situação: 1 demo + 2 células em branco na planilha).

**Integridade:** todas as FKs (`empresa_ref_id`, `orgao_id`, `contrato_id`)
consistentes; nenhum registro órfão; valores e percentuais tipados corretamente.

---

## 4. Limitações conhecidas

- **Eventos detalhados** (cada aditivo, paralisação, readequação, reajuste,
  termo, portaria) ainda estão como texto em `obras.observacoes`. Estruturá-los
  exigirá parsing dedicado/curadoria — as tabelas-destino já existem.
- **`fiscal_id`/`gestor_id`** ficam nulos para o histórico (só os nomes foram
  preservados); o vínculo a `usuarios` se dá quando as pessoas forem cadastradas.
- **`orgaos.nome`** (nome por extenso) ficou nulo — só a sigla veio da planilha.
- **Geolocalização** (`obras.localizacao`) não existe na planilha; permanece nula.

---

## 5. Próximos passos sugeridos

1. Preencher `orgaos.nome` (de–para de siglas) e CNPJ das empresas.
2. Parsers incrementais para popular `aditivos_prazo`, `paralisacoes`,
   `readequacoes`, etc., a partir dos textos preservados.
3. Endpoints CRUD e telas para empresas/órgãos e para o painel de prazos.
4. Geocodificar endereços/municípios para habilitar o mapa (PostGIS).

---

## 6. Índice de artefatos

| Artefato | Caminho |
|---|---|
| DER + modelo lógico | `Docs/relatorio_banco/modelo-novo-der-e-logico.md` |
| DDL completo (CREATE TABLE) | `Docs/relatorio_banco/schema-novo.sql` |
| Plano de transformação + instruções de carga | `Docs/relatorio_banco/plano-transformacao-e-carga.md` |
| Script de importação | `backend/app/import_acompanhamento.py` |
| Modelos novos | `backend/app/models/cadastro.py` |
| Migrations | `backend/alembic/versions/b2f3a1c9d4e7_*.py`, `c3d4e5f6a7b8_*.py` |
