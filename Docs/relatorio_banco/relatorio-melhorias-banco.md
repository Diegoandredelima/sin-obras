# SIN-Obras — Relatório de Melhorias no Banco de Dados

> **Data:** 18 de junho de 2026
> **Objetivo:** Analisar dados oficiais (planilhas Excel de acompanhamento), criar novas tabelas para prazos e acompanhamento, gerar migration e popular o banco.

---

## 1. Arquivos Criados

### Documentação (`docs/`)

| Arquivo | Conteúdo |
|---|---|
| `dump-banco-atual.md` | Documentação completa das 15 tabelas existentes, 8 enums, índices, relacionamentos, RBAC (EMPRESA → SECRETARIO), infraestrutura PostGIS |
| `dados-a-ser-estudados.md` | Estrutura das colunas das planilhas Excel (`Acompanhamento de obras.xlsx` e `PASTA DA PRAZO marcelinho.xlsx`), 7 padrões identificados, 11 conceitos de negócio a modelar, 9 problemas graves das planilhas, recomendações |
| `analise-modelagem-access.md` | 10 falhas típicas de modelagens Access legadas e suas alternativas PostgreSQL, prováveis tabelas no `.accdb`, o que não reproduzir e como migrar |

### Pasta de Dados Oficiais (`dados-oficiais/`)

Cópias preservadas dos arquivos originais (fora do Git):
- `Acompanhamento de obras.xlsx` — planilha de acompanhamento da SIN
- `PASTA DA PRAZO marcelinho.xlsx` — planilha de prazos
- `SIN.Obras1.accdb` — modelagem Access primária
- `leia-me.txt` — descrição dos arquivos

### `.gitignore`

Adicionadas as regras:
```
dados-oficiais/
dados-sin-*/
```

---

## 2. Novas Tabelas (9 tabelas)

| # | Tabela | Descrição | FK |
|---|--------|-----------|-----|
| 1 | `ordens_servico` | Ordem de serviço (início da execução) com nº, datas e processo SEI | `obras` |
| 2 | `aditivos_prazo` | Aditivos de prazo (+N dias) com novas datas de vigência/execução e processo SEI | `obras` |
| 3 | `paralisacoes` | Paralisações e reinícios com saldo de dias, datas e motivos | `obras` |
| 4 | `readequacoes` | Readequações com/sem reflexo financeiro (percentual + valor) | `obras` |
| 5 | `apostilamentos` | Apostilamentos contratuais (endosso) com valor e processo SEI | `contratos` |
| 6 | `reajustes` | Reajustes financeiros por medição (correção monetária) | `medicoes` |
| 7 | `termos_recebimento` | Termos de aceitação provisória ou recebimento definitivo | `obras` |
| 8 | `notificacoes_extrajudiciais` | Notificações formais enviadas à empresa contratada | `obras`, `usuarios` |
| 9 | `portarias` | Portarias de designação (fiscal, gestor, outros) | `obras`, `usuarios` |

### Enums criados:
- `TipoParalisacao`: PARALISACAO, REINICIO
- `TipoReadequacao`: COM_REFLEXO, SEM_REFLEXO
- `TipoTermoRecebimento`: PROVISORIO, DEFINITIVO
- `TipoPortaria`: FISCAL, GESTOR, OUTROS

---

## 3. Melhorias nos Modelos Existentes

### `contratos` (colunas novas)
- `data_publicacao` DATE — data de publicação do contrato no DOE
- `prazo_vigencia_dias` INTEGER — prazo total de vigência em dias
- `prazo_execucao_dias` INTEGER — prazo total de execução em dias
- `gestor_id` UUID FK → usuarios — gestor do contrato
- `orgao` VARCHAR(100) — órgão/secretaria demandante (SEEC, SESAP, etc.)

### `obras` (colunas novas)
- `data_ordem_servico` DATE — data da ordem de serviço
- `gestor_id` UUID FK → usuarios — gestor da obra
- `orgao` VARCHAR(100) — órgão demandante

### `medicoes` (colunas novas)
- `valor_medido` NUMERIC(15,2) NOT NULL — valor medido nesta medição
- `data_medicao` DATE — data da medição
- `numero_processo_sei` VARCHAR(50) — nº do processo SEI da medição

---

## 4. Migration Alembic

- **Arquivo:** `backend/alembic/versions/ff6285b72f48_adicionar_tabelas_acompanhamento.py`
- **Operações:** 7 ALTER TABLE (colunas novas) + 9 CREATE TABLE (tabelas novas)
- **Status:** Marcada como `head` (aplicada)

---

## 5. Seed Atualizado

O `backend/app/seed.py` foi atualizado para popular as novas tabelas:

| Tabela | Registros |
|---|---|
| `usuarios` | 5 (1 por perfil) |
| `contratos` | 1 (com novos campos: órgão, gestor, prazos) |
| `obras` | 1 (com novos campos: gestor, órgão, data OS) |
| `ordens_servico` | 1 |
| `aditivos_prazo` | 1 (1º aditivo +30 dias) |
| `paralisacoes` | 2 (1 paralisação + 1 reinício) |
| `portarias` | 2 (1 fiscal + 1 gestor) |
| `termos_recebimento` | 1 (provisório) |
| `metas` | 2 |
| `submetas` | 4 |
| `eventos` | 7 |
| `tarefas` | 1 |

---

## 6. Correção de Bug

O `bcrypt` no container estava na versão 5.0.0 (incompatível com `passlib`). O `requirements.txt` já especificava `bcrypt==3.2.2`, mas uma instalação anterior havia sobrescrito. O rebuild do container (`docker compose build backend --no-cache`) corrigiu a versão.

---

## 7. Próximos Passos

1. **Abrir o Access**: Exportar as tabelas do `SIN.Obras1.accdb` para CSV e comparar com o schema atual
2. **Migrar dados reais**: Criar scripts de importação das planilhas Excel para as novas tabelas
3. **Criar endpoints API**: Rotas CRUD para as 9 novas tabelas
4. **Atualizar frontend**: Telas de acompanhamento de prazos, aditivos e paralisações
5. **Dashboard**: Gráficos de evolução temporal dos prazos (previsto vs. real)
