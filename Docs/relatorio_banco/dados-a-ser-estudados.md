# SIN-Obras — Dados a Serem Estudados

> Análise extraída das planilhas Excel de acompanhamento e prazos da SIN

---

## Origem dos Dados

### Arquivo 1: `Acompanhamento de obras.xlsx`
- **1 aba** com ~100+ linhas de dados
- Usado diariamente pela equipe da SIN
- Controle completo de contratos, medições, prazos e valores

### Arquivo 2: `PASTA DA PRAZO marcelinho.xlsx`
- **4 abas** com dados de prazos
- Abas 1 e 2: Mesma estrutura do Acompanhamento (dados duplicados/espelhados)
- Abas 3 e 4: Estrutura simplificada (só contrato, processo, objeto, empresa, fiscal, vigência, execução)

---

## Estrutura das Colunas

### Aba de Acompanhamento (Sheet 1 e 2)

| Col | Campo | Descrição | Tipo Real |
|---|---|---|---|
| A | Sequencial | Número da linha | Inteiro |
| B | Nº CONTRATO | Formato XXX/AAAA | Texto |
| C | Nº PROCESSO MÃE | Número SEI/SIPAC | Texto |
| D | OBJETO | Descrição completa da obra | Texto (longo) |
| E | EMPRESA | Razão social da contratada | Texto |
| F | MUNICÍPIO | Local da obra | Texto |
| G | ÓRGÃO | Secretaria demandante (SEEC, SESAP, SESED...) | Texto |
| H | FISCAL | Nome do fiscal designado | Texto |
| I | GESTOR | Nome do gestor do contrato | Texto |
| J | PRAZO VIGÊNCIA | Data fim vigência (serial Excel) | Data/Inteiro |
| K | PRAZO EXECUÇÃO | Data fim execução (serial Excel) | Data/Inteiro |
| L | ADITIVO PRAZO | Nº do aditivo (1º, 2º...) | Texto |
| M | PROCESSO ADITIVO | Nº SEI do aditivo de prazo | Texto |
| N | 2º ADITIVO | Nº do segundo aditivo | Texto |
| O | PROCESSO 2º ADITIVO | Nº SEI | Texto |
| P | VALOR INICIAL | R$ contratado originalmente | Decimal |
| Q | VALOR ADITADO | R$ adicionado por readequações | Decimal |
| R | VALOR EXECUTADO | R$ acumulado executado | Decimal |
| S | % EXECUTADO | Percentual executado | Decimal/% |
| T..AG | MEDIÇÕES (1ª a 21ª) | Cada medição ocupa 3 colunas: Nº medição + Valor + Processo SEI | Texto/Decimal |
| AH | TOTAL MEDIÇÕES | Soma dos valores medidos | Decimal |
| AL | READEQUAÇÃO | Nº processo SEI da readequação | Texto |
| AO | APOSTILAMENTO | Nº processo SEI do apostilamento | Texto |
| AR | REAJUSTAMENTO | Nº processo SEI do reajuste | Texto |
| BD | NOTIFICAÇÃO | Dados de notificação extrajudicial | Texto |

**Demais colunas (esparsas):**
- Termos de paralisação/reinício (datas, processos)
- Termos de recebimento provisório/definitivo
- Ordens de serviço (data, processo)
- Portarias de designação
- Observações gerais (campo texto livre enorme)

### Aba Simplificada (Sheet 3 e 4)

| Col | Campo | Descrição |
|---|---|---|
| A | Sequencial | Número |
| B | Nº CONTRATO | Formato XXX/AAAA |
| C | Nº PROCESSO MÃE | SEI/SIPAC |
| D | OBJETO | Descrição da obra |
| E | EMPRESA | Contratada |
| F | FISCAL | Nome do fiscal |
| G | VIGÊNCIA | Data fim vigência (serial) |
| H | EXECUÇÃO | Data fim execução (serial) |

---

## Padrões Identificados

### 1. Cada linha = 1 contrato/obra
O modelo mental é: **uma linha por contrato**, com todas as informações relacionadas embutidas horizontalmente.

### 2. Múltiplas medições inline
As medições são colunas repetidas (1ª, 2ª, 3ª... até 21ª), cada uma com 3 subcolunas (identificação, valor, processo SEI). Isso é um **padrão de planilha** que NÃO deve ser reproduzido no banco — medições são linhas em tabela própria.

### 3. Datas como números de série Excel
Datas armazenadas como números decimais (ex: 46244 = 01/01/2026 + 46244 dias). Precisam ser convertidas para DATE no PostgreSQL.

### 4. Texto estruturado em campo livre
Informações como "1º Aditivo de Prazo (+120 DIAS) — SAIU EM 11/07/2018, PUB. 21/07/2018" estão todas concatenadas em uma única célula. No banco relacional, cada evento deve ser um registro separado com campos atômicos.

### 5. Duplicação entre abas
As Sheets 1 e 2 da Pasta da Prazo têm exatamente a mesma estrutura e dados repetidos. Sheets 3 e 4 são versões simplificadas com subconjunto dos mesmos dados.

### 6. Mistura de unidades organizacionais
A coluna G (ÓRGÃO) contém secretarias diferentes (SEEC, SESAP, SESED, SEAP, SET, IPEM, PMRN) — o banco atual não modela o órgão demandante, apenas a empresa executora.

---

## Conceitos de Negócio a Modelar

Com base nos dados das planilhas, os seguintes conceitos precisam de tabelas próprias:

| Conceito | Exemplo real da planilha | Frequência |
|---|---|---|
| **Ordem de Serviço** | "ORDEM DE SERVIÇO Nº 002/2017 DE 30/01/2017" | 1 por contrato |
| **Aditivo de Prazo** | "1º ADITIVO DE PRAZO (+120 DIAS) — PUB. 21/07/2018" | 0 a 9+ por contrato |
| **Paralisação** | "TERMO DE PARALISAÇÃO DE 23/11/2017, PUB. 13/01/2018 (SALDO DE 12 DIAS EXECUÇÃO E 72 DIAS VIGÊNCIA)" | 0 a 2+ por contrato |
| **Reinício** | "TERMO DE REINÍCIO DE 30/07/2018, PUB. 28/07/2018" | 0 a 2+ por contrato |
| **Readequação** | "1º READEQUAÇÃO COM REFLEXO FINANCEIRO (+ 35,41% — R$ 205.214,70)" | 0 a 2+ por contrato |
| **Apostilamento** | "APOSTILAMENTO DO CONTRATO (R$ 23.240,25)" | 0 a 1+ por contrato |
| **Reajuste** | "REAJUSTE DA 4ª E 5ª MEDIÇÃO (R$ 7.252,54)" | 0 a N por contrato |
| **Termo de Recebimento** | "TERMO DE ACEITAÇÃO PROVISÓRIA Nº 006/2019-SIN DE 14/05/2019" | 2 por contrato (provisório + definitivo) |
| **Notificação Extrajudicial** | Notificações formais enviadas à contratada | 0 a N |
| **Portaria** | "PORTARIA Nº 179/2018-GS/SIN, PUB. 31/10/2018" | 1+ por contrato |
| **Rescisão** | "TERMO DE RESCISÃO AMIGÁVEL EM 13/06/2018, PUBLICADO EM 22/08/2018" | 0 a 1 |

---

## Problemas Graves das Planilhas

1. **Sem integridade referencial**: Nada impede duplicação de contratos ou medições
2. **Sem histórico**: Alterações sobrescrevem dados anteriores sem rastro
3. **Tipagem inexistente**: Datas como números, valores como texto, tudo misturado
4. **Escalabilidade zero**: 21 colunas fixas de medição limitam o acompanhamento
5. **Busca impossível**: Localizar uma informação específica requer leitura visual
6. **Colaboração frágil**: Múltiplas pessoas editando = alto risco de inconsistência
7. **Sem controle de acesso**: Qualquer pessoa com o arquivo vê tudo
8. **Sem geolocalização**: Não há coordenadas das obras
9. **Sem fotos/vistorias**: Apenas dados textuais

---

## O Que Aproveitar

### Dados que podem ser migrados
- Lista de contratos com nº de processo mãe
- Relação empresa × obra × município × órgão
- Valores iniciais, aditados e executados
- Cronologia de aditivos de prazo (extraindo de texto)
- Cronologia de paralisações/reinícios
- Termos de recebimento

### Estrutura que NÃO deve ser reproduzida
- Colunas repetidas para medições (usar tabela `medicoes`)
- Texto livre para eventos estruturados (cada evento = 1 registro)
- Datas como números de série (usar tipo DATE)
- Duplicação de dados entre abas (fonte única da verdade)

---

## Recomendações para o Schema Melhorado

1. Cada evento de prazo (aditivo, paralisação, reinício) = **registro próprio** com data início, data fim, dias adicionados, nº processo SEI, data publicação
2. Medições já têm tabela (`medicoes`) — adicionar `numero_processo_sei` e `valor_medido`
3. Órgão demandante como entidade separada ou campo normalizado
4. Datas de vigência e execução precisam ser rastreáveis ao longo do tempo (a cada aditivo, mudam)
5. Termos de recebimento como entidade própria vinculada à obra
