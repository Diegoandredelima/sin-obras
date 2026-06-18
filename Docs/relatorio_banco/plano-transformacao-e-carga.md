# SIN-Obras — Plano de Transformação e Carga dos Dados Oficiais

> Fonte: `dados-oficiais/Acompanhamento de obras.xlsx`, aba **OBRAS**.
> Script: [`backend/app/import_acompanhamento.py`](../../backend/app/import_acompanhamento.py)

---

## 1. Características reais da planilha (mapeadas)

- **1 aba** (`OBRAS`), dimensão `A1:AEN620` (820 colunas alocadas, **~53 úteis**).
- Cabeçalho principal na **linha 11**; subcabeçalhos de grupos mesclados na
  **linha 12**; dados a partir da **linha 13**.
- **608 linhas de dados**, das quais **595 são contratos** (13 linhas sem
  Nº de contrato — separadores/subtotais — são ignoradas).
- Padrão "uma linha por contrato", com tudo embutido horizontalmente.

> Observação: este layout difere do descrito em `dados-a-ser-estudados.md`
> (que se referia à planilha `PASTA DA PRAZO marcelinho.xlsx`). O mapeamento
> abaixo reflete o arquivo **real** de Acompanhamento.

### Mapa de colunas → destino

| Col | Cabeçalho | Destino |
|---|---|---|
| B | SITUAÇÃO DA OBRA | `obras.situacao` (+ `situacao_origem`, `ano_referencia`) |
| C | Nº CONTRATO | `contratos.numero_contrato` |
| D | Nº PROCESSO MÃE | `contratos.numero_processo` |
| E | MUNICÍPIO | `obras.municipio` |
| F | OBJETO | `contratos.objeto` / `obras.titulo`,`descricao` |
| G | ÓRGÃO | `orgaos.sigla` → `contratos.orgao_id` |
| H | EMPRESA | `empresas.razao_social` → `contratos.empresa_ref_id` |
| I | FISCAL | `contratos.fiscal_nome` |
| K | GESTOR | `contratos.gestor_nome` |
| L | VALOR INICIAL | `contratos.valor_global` |
| M | ADITIVO VALOR | `contratos.valor_aditivo` |
| N | VALOR REAJUSTADO | `contratos.valor_reajustado` |
| O | VALOR FINAL | `contratos.valor_final` / `obras.valor_contrato` |
| P | VALOR MEDIDO | `obras.valor_medido` |
| Q | SALDO A MEDIR | `obras.saldo_a_medir` |
| R / S | RECURSO FED. / EST. | `contratos.recurso_federal` / `recurso_estadual` |
| T | EXECUÇÃO (fração) | `obras.percentual_executado` (×100) |
| V | MATRÍCULA CEI | `contratos.matricula_cei` / `obras.matricula_cei` |
| W | PRAZO INICIAL | `obras.prazo_inicial_dias` |
| X | HISTÓRICO | `obras.historico` |
| AI–AK | VIGÊNCIA (início/dias/fim) | `obras.vigencia_*` |
| AM–AO | EXECUÇÃO (início/dias/fim) | `obras.execucao_*` |
| AQ | IMPORTANTE | `obras.importante` |
| AS | TIPO DE LICITAÇÃO | `contratos.tipo_licitacao` |
| U, J, AC, AG, AH, AR, AT–AZ | OS, portaria, paralisações, processos SEI, OBS, previsão | `obras.observacoes` (bloco rotulado) |

---

## 2. Regras de transformação

| Problema na origem | Tratamento |
|---|---|
| Datas como **serial Excel** | `openpyxl` já entrega `datetime`; o "zero" (1899-12-29/30) é convertido para `NULL`. |
| Valores `'#N/A'`, `'#REF!'`, vazios | Normalizados para `NULL` (lista `NA_TOKENS`). |
| Valores numéricos (float) | Convertidos para `NUMERIC(15,2)` com arredondamento; parser pt-BR (`1.234,56`) como fallback para strings. |
| Prazo "90 DIAS" (texto) | Extraído o inteiro → `prazo_inicial_dias`. |
| EXECUÇÃO como fração (0,90) | `× 100` → percentual, limitado a 100. |
| Situação livre (43 variações) | `map_situacao()` → enum de 9 estados; texto original preservado. |
| Empresa/órgão repetidos | Deduplicação em cache; get-or-create em `empresas`/`orgaos`. |
| Nº de contrato duplicado na planilha | Desambiguado com sufixo ` (2)`, ` (3)`… (UNIQUE preservado). |
| Eventos em texto livre (paralisações, SEI) | **Preservados** em `obras.observacoes` (não parseados). |

**Idempotência:** o script pré-carrega os `numero_contrato` já existentes e
pula os repetidos — pode ser reexecutado sem duplicar.

---

## 3. Como executar a carga

Pré-requisitos: Docker no ar (`make up`), migrations aplicadas
(`make migrate-apply`).

```bash
# 1. Garantir a dependência de leitura de xlsx (já em requirements.txt)
docker compose exec backend pip install openpyxl==3.1.5   # ou: docker compose build backend

# 2. Copiar a planilha oficial para dentro do container
docker compose exec backend mkdir -p /app/_import
docker compose cp "dados-oficiais/Acompanhamento de obras.xlsx" \
    backend:/app/_import/Acompanhamento.xlsx

# 3. Rodar a importação
docker compose exec -e PYTHONPATH=/app backend python -m app.import_acompanhamento
```

Variável opcional: `IMPORT_XLSX` define o caminho do arquivo dentro do
container (default `/app/_import/Acompanhamento.xlsx`).

---

## 4. Resultado da carga (execução de 18/06/2026)

| Entidade | Registros | Observação |
|---|---|---|
| `orgaos` | 42 | criados a partir das siglas distintas |
| `empresas` | 277 | razões sociais distintas |
| `contratos` | 596 | 595 importados + 1 demo (seed) |
| `obras` | 596 | 1 obra por contrato |
| linhas sem nº de contrato | 13 | ignoradas (separadores) |

---

## 5. Queries de validação de integridade

```sql
-- Nenhuma obra órfã (FK garante, mas confirma):
SELECT count(*) FROM obras o
  LEFT JOIN contratos c ON o.contrato_id = c.id
  WHERE o.contrato_id IS NOT NULL AND c.id IS NULL;            -- esperado: 0

-- Distribuição por situação oficial:
SELECT situacao, count(*) FROM obras GROUP BY situacao ORDER BY 2 DESC;

-- Totais financeiros consolidados:
SELECT sum(valor_global)   AS inicial,
       sum(valor_final)    AS final
  FROM contratos;
SELECT sum(valor_medido)   AS medido FROM obras;

-- Contratos sem órgão (esperado ~23 = demo + linhas com órgão em branco):
SELECT count(*) FROM contratos WHERE orgao_id IS NULL;
```
