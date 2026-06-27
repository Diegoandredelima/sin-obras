# SIN-Obras — Fluxos de Trabalho para Implementação

> Documento-base para guiar o desenvolvimento dos requisitos do SIN-Obras.
> Adaptado a partir do mapeamento do fluxo SE Obras, alinhado ao modelo de domínio
> **Contrato → Objeto → Item** e **Objeto → Meta → Submeta → Evento**.

---

## 1. Cadastro de Contrato

### 1.1 Estrutura do Contrato

O **Contrato** é o documento jurídico principal (documento-mãe). Cada contrato formaliza
a execução de **um ou mais Objetos** (`Contrato 1—N Objeto`).

**Dados essenciais do contrato (formulário atual):**
- Número do contrato, número do processo SEI, link do processo
- Número da licitação, resumo (texto livre)
- Datas: assinatura, vigência (fim)
- Partes: empresa executora, órgão demandante, fiscal, gestor
- Financeiro: valor global, valor reajustado, valor final, recursos (federal/estadual)
- Retenção: percentual de retenção padrão (aplicado nas medições)

**Campos no backend mas não expostos no formulário web atual:**
- `tipo_licitacao`, `matricula_cei`, `valor_aditivo`
- Coordenadas GPS do objeto (aceitas pela API, uso futuro/mobile)
- Raio de geofencing, valor_contrato do objeto (defaults do sistema)

**Nota:** `data_publicacao` e "prazos em dias" não são campos do Contrato —
ficam em entidades de Acompanhamento (Ordem de Serviço, Aditivo de Prazo).

### 1.2 Fluxo de Cadastro

```
┌─────────────────────────────────────────────────────────────────┐
│  FASE 1+2 — CRIAÇÃO DO CONTRATO E OBJETO (formulário único)     │
│                                                                 │
│  ⚠️  O formulário /contratos/novo cria o CONTRATO e o           │
│     PRIMEIRO OBJETO em conjunto (uma única submissão).          │
│     Objetos adicionais são adicionados inline na mesma          │
│     página após o contrato ser salvo.                           │
│                                                                 │
│  1. Usuário (ENGENHEIRO+) acessa /contratos/novo                │
│  2. Seção 1 — Dados do Contrato:                                │
│     • Número do contrato*, processo SEI*, link SEI              │
│     • Número da licitação, resumo (texto livre)                 │
│     • Datas: assinatura, vigência (fim)                         │
│  3. Seção 2 — Empresa e Responsáveis:                           │
│     • Empresa executora, órgão demandante, fiscal, gestor       │
│  4. Seção 3 — Dados do Objeto (primeiro objeto):                │
│     • Título*, descrição, status, datas                         │
│     • Endereço: CEP (auto ViaCEP), logradouro, número,          │
│       conjunto, bairro, município, UF                           │
│  5. Seção 4 — Financeiro:                                       │
│     • Valor global*, valor reajustado, valor final              │
│     • Recurso federal, recurso estadual, % retenção             │
│  6. POST /api/contratos → POST /api/objetos (simultâneos)       │
│  7. Após salvar: adicionar demais objetos inline (opcional)     │
│  8. "Concluir" → redireciona para DetalheContrato               │
│                                                                 │
│  FASE 3 — ESTRUTURAÇÃO DO OBJETO                                │
│                                                                 │
│  5. Cadastrar itens do objeto:                                  │
│     • POST /api/objetos/{id}/itens (um por serviço/material)    │
│     • Cada item: descrição, unidade, quantidade, valor unitário │
│     • O valor_total do item = quantidade × valor_unitario       │
│                                                                 │
│  6. Cadastrar cronograma físico-financeiro:                     │
│     • POST /api/cronograma/objetos/{id}/metas                   │
│     • Para cada meta, submetas e eventos                        │
│     • Ver Fluxo 2 — Cronograma e Orçamento                      │
│                                                                 │
│  7. Cadastrar ART/RRT do responsável técnico:                   │
│     • POST /api/art-rrt (obrigatório para assinar medições)     │
└─────────────────────────────────────────────────────────────────┘
```

> **Navegação no frontend (contrato-cêntrico):** não há item "Objetos" no
> sidebar. O usuário trabalha a partir de **Contratos → Detalhe do
> Contrato**, que é o *hub*: um seletor lista os objetos vinculados e as
> sub-entidades do objeto (cronograma, ART/RRT, documentos, medições,
> diário, eventos/acompanhamento, solicitações, curva S, assistente IA)
> aparecem como **abas** dessa mesma tela. Os endpoints desta seção e das
> seguintes são consumidos por essas abas. Itens do sidebar: Dashboard,
> Cadastrar (submenu só para APOIO_N2+: Novo Contrato, Empresa),
> Contratos, Empresas, Diário de Obras (com sub-abas "Diário" e
> "Medições"), Quadro de Tarefas, Relatório e Documentos. **Não há "Mapa
> de Calor"**; Alertas e Notificações são sinos no header.

### 1.3 RBAC Envolvido
| Ação | Nível Mínimo |
|------|-------------|
| Criar contrato | ENGENHEIRO (APOIO_N2) |
| Criar objeto | APOIO_N1 |
| Editar contrato/objeto | APOIO_N1 |
| Excluir objeto | COORDENADOR |

---

## 2. Cronograma e Orçamento

### 2.1 Modelo de Cronograma Físico-Financeiro

O SIN-Obras adota uma hierarquia de **3 níveis** para o cronograma:

```
Objeto
  └── Meta (nível 1) — etapa macro do objeto
        │   • descricao, valor (R$ da meta), ordem
        │
        └── Submeta (nível 2) — desdobramento temporal
              │   • descricao, valor, percentual_previsto (% no período)
              │
              └── Evento (nível 3) — serviço mensurável
                    • descricao, quantidade, unidade, valor_unitario
                    • vinculável a um CatalogoItem (tabela SINAPI)
                    • valor_total = quantidade × valor_unitario
```

**O orçamento do objeto é a soma de todos os Eventos do cronograma.**
Não existe uma entidade "Orçamento" separada — ele é derivado do somatório
dos eventos e dos itens do objeto.

### 2.2 Fluxo de Estruturação do Cronograma

```
┌─────────────────────────────────────────────────────────────────┐
│  FASE 1 — DEFINIÇÃO DAS METAS                                   │
│                                                                 │
│  1. Acessar o objeto e criar as metas (etapas macro):           │
│     POST /api/cronograma/objetos/{objeto_id}/metas              │
│     Ex: Meta 1 "Fundação", Meta 2 "Estrutura",                  │
│          Meta 3 "Acabamento", Meta 4 "Instalações"              │
│                                                                 │
│  FASE 2 — DISTRIBUIÇÃO TEMPORAL (SUBMETAS)                      │
│                                                                 │
│  2. Para cada meta, criar submetas representando os períodos:   │
│     POST /api/cronograma/metas/{meta_id}/submetas               │
│     Ex: Submeta "Mês 1", "Mês 2", "Mês 3"...                    │
│     • percentual_previsto: quanto da meta se executa no período │
│                                                                 │
│  FASE 3 — SERVIÇOS MENSURÁVEIS (EVENTOS)                        │
│                                                                 │
│  3. Para cada submeta, cadastrar os eventos (serviços):         │
│     POST /api/cronograma/submetas/{submeta_id}/eventos           │
│     • descricao: ex "Concreto usinado FCK 25MPa"                │
│     • quantidade prevista para aquele período                    │
│     • unidade: m³, m², kg, un, etc.                             │
│     • valor_unitario: preço unitário (referência SINAPI)        │
│     • catalogo_item_id: opcional, vincula ao catálogo SINAPI    │
│                                                                 │
│  4. (Opcional) Vincular itens do objeto aos eventos:            │
│     Os itens (tabela itens) representam o escopo total;         │
│     os eventos distribuem esse escopo no tempo.                 │
│     A soma das quantidades dos eventos por item não deve        │
│     ultrapassar a quantidade contratada no item.                │
│                                                                 │
│  FASE 4 — ACOMPANHAMENTO DO PROGRESSO POR META                  │
│                                                                 │
│  5. Consultar relatório de progresso por meta:                  │
│     GET /api/relatorios/cronograma/{objeto_id}                  │
│     • Exibe % de avanço planejada × realizada por meta          │
│     • Permite identificar metas em atraso antes da medição      │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Regras de Negócio

- **O valor total do cronograma** (soma dos eventos) representa o valor
  planejado do objeto, usado como linha de base para comparação nas medições.
- **Critérios de medição SINAPI**: os eventos vinculados ao catálogo
  herdam as regras de medição (ex: desconto de vãos em alvenaria).
- **O cronograma é a referência para as medições**: cada medição se
  vincula a uma submeta/período, e os eventos daquele período são
  automaticamente sugeridos para lançamento.

### 2.4 RBAC Envolvido
| Ação | Nível Mínimo |
|------|-------------|
| Criar/editar meta | APOIO_N1 |
| Criar/editar submeta | APOIO_N1 |
| Criar/editar/deletar evento | APOIO_N1 |

---

## 3. Fluxo de Medições

### 3.1 Modelo de Dados da Medição

```
Medicao
  ├── origem: EMPRESA (automedição) | FISCAL (medição oficial)
  ├── numero_medicao: sequencial por objeto (1, 2, 3...)
  ├── periodo: data_inicio_periodo, data_fim_periodo
  ├── status: RASCUNHO → ASSINADA → EM_FISCALIZACAO → APROVADA
  │                                      ↘ REPROVADA
  │           (fiscal: RASCUNHO → APROVADA via /concluir)
  │
  └── MedicaoItem (1:N)
        ├── evento_id: vincula ao evento do cronograma
        ├── quantidade_periodo: executado no período
        ├── valor_unitario: congelado no momento da criação
        ├── desconto_vaos: dedução por vãos (portas/janelas)
        ├── quantidade_aprovada: aprovação parcial (fiscal)
        │
        └── MedicaoItemMemoria (1:N) — memória de cálculo
              • comprimento, largura, altura, percentual
              • n_repeticoes, quantidade (resultado calculado)
```

### 3.2 Máquina de Estados da Medição

```
ORIGEM EMPRESA:
  RASCUNHO ──(assinar)──► ASSINADA ──(fiscal avalia)──► EM_FISCALIZACAO
                                                             │
                                    ┌────────────────────────┤
                                    ▼                        ▼
                               APROVADA                  REPROVADA
                                    ▲
                                    │ (se valor > alçada)
                              AGUARDANDO_CHEFE ──(chefe aprova)──► APROVADA

ORIGEM FISCAL:
  RASCUNHO ──(concluir)──► APROVADA (direto, sem assinatura da empresa)
```

### 3.3 Fluxo Completo de Medição

```
┌─────────────────────────────────────────────────────────────────┐
│  FASE 1 — ABERTURA DA MEDIÇÃO                                   │
│                                                                 │
│  1. Usuário acessa o objeto e cria nova medição:                │
│     • EMPRESA: POST /api/empresa/objetos/{id}/medicoes          │
│     • FISCAL:  POST /api/empresa/objetos/{id}/medicoes/fiscal   │
│                                                                 │
│  2. Preenche:                                                   │
│     • Título/número (sequencial automático)                     │
│     • Período de vigência (data_inicio, data_fim)               │
│     • Parcela do cronograma de referência                       │
│                                                                 │
│  3. Status inicial: RASCUNHO                                    │
│                                                                 │
│  FASE 2 — LEVANTAMENTO FÍSICO EM CAMPO                          │
│                                                                 │
│  4. Fiscal/responsável vai ao canteiro e levanta quantitativos  │
│  5. APLICA RIGOROSAMENTE os critérios de medição da base        │
│     orçamentária (SINAPI):                                      │
│     • Ex: desconto de vãos (portas/janelas) em alvenaria        │
│     • Ex: medição por área líquida, não área bruta              │
│  6. Registra memória de cálculo com dimensões aferidas          │
│                                                                 │
│  FASE 3 — LANÇAMENTO DAS QUANTIDADES                            │
│                                                                 │
│  7. Para cada evento do cronograma do período:                  │
│     POST /api/empresa/medicoes/{id}/itens                       │
│     • evento_id: qual serviço está sendo medido                 │
│     • quantidade_periodo: volume executado                      │
│     • valor_unitario: congelado do evento                       │
│     • desconto_vaos: deduções conforme critério SINAPI          │
│                                                                 │
│  8. Para cada item, registrar memória de cálculo:               │
│     • comprimento, largura, altura, percentual, repetições      │
│     • quantidade resultante = C × L × H × % × N                │
│                                                                 │
│  9. Função "preencher conforme previsto":                       │
│     O sistema sugere automaticamente as quantidades do          │
│     cronograma para aquele período, agilizando o lançamento.    │
│     O usuário edita apenas se o executado for diferente.        │
│                                                                 │
│  FASE 4 — ANÁLISE DE DESVIOS                                    │
│                                                                 │
│  10. O sistema cruza quantidade_periodo × previsto_no_cronograma│
│      e emite alertas:                                           │
│      • VERMELHO: medição excedente (>20% acima do previsto)     │
│      • AMARELO: medição abaixo do previsto (<80% do previsto)   │
│      • VERDE: dentro do esperado (±20%)                         │
│                                                                 │
│  FASE 5 — COMPROVAÇÃO FOTOGRÁFICA (RN03)                        │
│                                                                 │
│  11. Anexar fotos aos itens medidos:                            │
│      POST /api/empresa/medicoes/{id}/fotos                      │
│      • Obrigatório: toda medição precisa de fotos,              │
│        mas a exigência de foto POR ITEM é validada na           │
│        assinatura (itens com avanço > 0 exigem foto)            │
│      • Hash SHA-256 calculado no upload (integridade)           │
│      • Carimbo do servidor (data/hora do upload)                │
│      • Coordenadas GPS (georreferenciamento)                    │
│      • Exif metadata extraído automaticamente                   │
│                                                                 │
│  FASE 6 — ASSINATURA (EMPRESA)                                  │
│                                                                 │
│  12. Empresa revisa e assina a medição:                         │
│      POST /api/empresa/medicoes/{id}/assinar                    │
│                                                                 │
│      Validações pré-assinatura:                                 │
│      • Medição pertence ao usuário logado                       │
│      • Status atual = RASCUNHO                                  │
│      • Cada MedicaoItem com avanço > 0 tem ao menos 1 foto     │
│      • Existe ART/RRT ativa para o objeto                       │
│                                                                 │
│      Ao assinar:                                                │
│      • Gera hash SHA-256 do conteúdo da medição                 │
│      • Status muda para ASSINADA                                │
│      • Registra valor_medido (soma dos valores brutos)          │
│      • Auditoria: registra assinatura no audit_log              │
│                                                                 │
│  FASE 7 — FISCALIZAÇÃO E AVALIAÇÃO                              │
│                                                                 │
│  13. Fiscal avalia a medição assinada:                          │
│      POST /api/empresa/medicoes/{id}/avaliar                    │
│                                                                 │
│      Revisar criteriosamente os documentos e registros:         │
│      • Planilha de medição × planilha orçamentária contratada   │
│      • Livro da obra (diário de obra / RDO do período)          │
│      • Certidões da empresa (regularidade fiscal/trabalhista)   │
│      • Quantidades lançadas × previstas no cronograma           │
│      • Memória de cálculo, descontos de vãos, fotos             │
│      • ART/RRT ativa para o objeto                              │
│                                                                 │
│      • Status muda para EM_FISCALIZACAO quando inicia análise   │
│      • Pode APROVAR totalmente → status APROVADA                │
│      • Pode APROVAR PARCIALMENTE (RF23): define                 │
│        quantidade_aprovada por item (menor que quantidade_periodo)│
│      • Pode REPROVAR → status REPROVADA (volta para empresa)    │
│      • Observação do fiscal registrada em observacao_fiscal     │
│                                                                 │
│  14. Se valor líquido > ALCADA_APROVACAO_PADRAO (RN08):         │
│      • Status vai para AGUARDANDO_CHEFE                         │
│      • COORDENADOR aprova via:                                  │
│        POST /api/empresa/medicoes/{id}/aprovar-chefe            │
│                                                                 │
│  FASE 8 — ATUALIZAÇÃO FINANCEIRA DO OBJETO                      │
│                                                                 │
│  15. Ao aprovar, o sistema recalcula:                           │
│      • objeto.valor_medido = soma de todas as medições APROVADAS│
│      • objeto.saldo_a_medir = valor_contrato - valor_medido     │
│      • objeto.percentual_executado = valor_medido / valor_contrato│
│                                                                 │
│  FASE 9 — BOLETIM DE MEDIÇÃO                                    │
│                                                                 │
│  16. Boletim (7 colunas) disponível em:                         │
│      GET /api/empresa/medicoes/{id}/boletim                     │
│                                                                 │
│      Colunas do boletim:                                        │
│      ┌──────────────┬──────────┬────────────┬───────────┐       │
│      │ Contratado   │ Período  │ Acum. Ant. │ Acum. At. │       │
│      │ (qtde + R$)  │ (qtde)   │ (qtde)     │ (qtde)    │       │
│      ├──────────────┼──────────┼────────────┼───────────┤       │
│      │ Saldo        │ % Per.   │ % Acum.    │           │       │
│      │ (qtde + R$)  │          │            │           │       │
│      └──────────────┴──────────┴────────────┴───────────┘       │
│                                                                 │
│      O acumulado anterior considera todas as medições           │
│      APROVADAS com numero_medicao menor que a atual.            │
│      O numero_medicao é gerado automaticamente (sequencial      │
│      por objeto) e fixado no cabeçalho do boletim.             │
│                                                                 │
│  FASE 10 — EXPORTAÇÃO                                           │
│                                                                 │
│  17. Documentos oficiais:                                       │
│      • Boletim em XLSX/PDF:                                     │
│        GET /api/documentos/medicoes/{id}/boletim                 │
│      • Memória de cálculo em XLSX:                              │
│        GET /api/documentos/medicoes/{id}/memoria-calculo         │
│      • Relatório fotográfico:                                   │
│        GET /api/relatorios/fotos/{objeto_id}                    │
│        (compilação de fotos por vistoria/período, export PDF)   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Regras de Negócio das Medições

| Regra | Descrição |
|-------|-----------|
| **RN01** | Assinatura exige ART/RRT ativa + foto por item com avanço |
| **RN03** | Toda foto tem hash SHA-256, carimbo do servidor e GPS |
| **RN08** | Medições acima da alçada exigem aprovação do chefe (COORDENADOR) |
| **RN23** | Fiscal pode aprovar parcialmente (quantidade_aprovada por item) |
| **RN24** | Reprovação retorna medição para empresa corrigir |
| **Desconto de vãos** | Campo `desconto_vaos` deduzido do valor bruto |
| **Acumulado** | Soma de todas as medições APROVADAS anteriores |
| **Congelamento** | `valor_unitario` é copiado do evento no momento da criação do MedicaoItem |

### 3.5 RBAC Envolvido
> **Nota:** medições são atividade de **APOIO_N2+** (e da própria EMPRESA, no
> seu portal). **APOIO_N1 e FISCAL não acessam medições** — o mínimo das ações
> fiscais é `APOIO_N2`.

| Ação | Quem Pode |
|------|-----------|
| Criar medição (EMPRESA) | EMPRESA (usuário dono do contrato) |
| Criar medição (FISCAL) | **APOIO_N2+** |
| Lançar itens e fotos | EMPRESA (na sua medição) |
| Assinar medição | EMPRESA (dono) |
| Concluir medição fiscal | **APOIO_N2+** (direto para APROVADA) |
| Avaliar medição | **APOIO_N2+** |
| Aprovar chefe | COORDENADOR+ |

---

## 4. Replanejamento e Aditivos

### 4.1 Quando Replanejar

Sempre que o contrato sofrer alteração de escopo:
- Inclusão de novos serviços (ex: reboco, piso em granilite)
- Alteração de quantidades
- Aditivos de prazo ou valor

### 4.2 Fluxo de Replanejamento

```
┌─────────────────────────────────────────────────────────────────┐
│  1. REGRA DE OURO:                                              │
│     NÃO é permitido replanejar com medições em aberto.          │
│     Toda medição vigente deve estar APROVADA ou REPROVADA.      │
│                                                                 │
│  2. Finalizar e aprovar a medição do período atual              │
│                                                                 │
│  3. Registrar o aditivo no acompanhamento contratual:           │
│     • POST /api/acompanhamento/objetos/{id}/aditivos-prazo      │
│     • POST /api/acompanhamento/objetos/{id}/readequacoes        │
│     • POST /api/apostilamentos (no contrato)                    │
│                                                                 │
│  4. Editar o cronograma:                                        │
│     • Adicionar novos eventos (serviços) nas submetas futuras   │
│     • Ajustar quantidades/valores dos eventos existentes        │
│     • Incluir as novas parcelas (submetas) se necessário        │
│                                                                 │
│  5. O sistema entende automaticamente:                          │
│     • Serviços já medidos em parcelas passadas = concluídos     │
│     • Novos serviços aparecem nas próximas medições             │
│     • Saldo residual de serviços parcialmente medidos           │
│       continua disponível para medições futuras                 │
│                                                                 │
│  6. Atualizar dados do contrato se houver alteração de valor:   │
│     • PUT /api/contratos/{id}                                   │
│     • Campos: valor_aditivo, valor_reajustado, valor_final      │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Entidades de Acompanhamento Contratual

| Entidade | Escopo | Descrição |
|----------|--------|-----------|
| Ordem de Serviço | Objeto | Emissão da OS, data de início |
| Aditivo de Prazo | Objeto | Prorrogação de vigência/execução |
| Paralisação/Reinício | Objeto | Suspensão e retomada |
| Readequação | Objeto | Com ou sem reflexo financeiro |
| Apostilamento | Contrato | Acréscimo de valor |
| Reajuste | Medição | Reajuste contratual |
| Termo de Recebimento | Objeto | Provisório ou definitivo |
| Notificação Extrajudicial | Objeto | Notificações à empresa |
| Portaria | Objeto | Designação de fiscal/gestor |

---

## 5. Fluxos Complementares

### 5.1 Diário de Obra (RDO)

Registro diário da execução da obra, preenchido pelo fiscal ou responsável
técnico. Documenta as condições de campo, mão de obra, equipamentos e
ocorrências do dia.

#### 5.1.1 Modelo de Dados

```
DiarioObra
  ├── objeto_id: FK → Objeto
  ├── usuario_id: FK → Usuario (quem registrou)
  ├── data_registro: Date (um registro por dia por objeto)
  │
  ├── Clima estruturado:
  │   ├── tempo_manha: BOM | CHUVA_FRACA | CHUVA_FORTE
  │   ├── tempo_tarde: BOM | CHUVA_FRACA | CHUVA_FORTE
  │   └── pluviometria_mm: Numeric(6,2)
  │
  ├── Mão de obra (JSONB):
  │   └── [{"funcao": "Pedreiro", "quantidade": 4}, ...]
  │
  ├── Equipamentos (JSONB):
  │   └── [{"nome": "Betoneira", "quantidade": 1}, ...]
  │
  ├── Atividades realizadas (texto livre)
  ├── Ocorrências (texto livre)
  ├── Observações do fiscal (texto livre)
  │
  └── qtd_funcionarios: Integer (total)
```

#### 5.1.2 Fluxo de Registro Diário

```
┌─────────────────────────────────────────────────────────────────┐
│  FASE 1 — ABRIR DIÁRIO DO DIA                                   │
│                                                                 │
│  1. Fiscal acessa o objeto e abre o diário:                     │
│     GET /api/empresa/objetos/{objeto_id}/diario                  │
│     • Lista os registros existentes, agrupados por data          │
│                                                                 │
│  2. Criar novo registro do dia:                                 │
│     POST /api/empresa/objetos/{objeto_id}/diario                 │
│     • data_registro (padrão: hoje)                              │
│     • Um registro por dia por objeto (unicidade lógica)         │
│                                                                 │
│  FASE 2 — PREENCHIMENTO DAS CONDIÇÕES                           │
│                                                                 │
│  3. Registrar clima:                                             │
│     • tempo_manha: selecionar condição (BOM/CHUVA)              │
│     • tempo_tarde: selecionar condição                          │
│     • pluviometria_mm: precipitação em mm (se houve chuva)      │
│                                                                 │
│  4. Registrar mão de obra presente:                             │
│     • Função (Pedreiro, Servente, Armador, Carpinteiro, etc.)   │
│     • Quantidade de profissionais por função                    │
│     • qtd_funcionarios: total automático                        │
│                                                                 │
│  5. Registrar equipamentos utilizados:                          │
│     • Nome do equipamento                                       │
│     • Quantidade em operação                                    │
│                                                                 │
│  FASE 3 — ATIVIDADES E OCORRÊNCIAS                              │
│                                                                 │
│  6. Descrever atividades realizadas no dia:                     │
│     • Texto livre descrevendo os serviços executados            │
│     • Ex: "Concretagem das sapatas do bloco A"                  │
│                                                                 │
│  7. Registrar ocorrências (se houver):                          │
│     • Intercorrências, acidentes, paralisações                  │
│     • Falta de material, condições adversas                     │
│                                                                 │
│  8. Observações do fiscal:                                      │
│     • Anotações técnicas, recomendações                         │
│     • Encaminhamentos necessários                               │
│                                                                 │
│  FASE 4 — EDIÇÃO E CONSULTA                                     │
│                                                                 │
│  9. Editar registro existente:                                  │
│     PUT /api/empresa/diario/{id}                                │
│     • Permite correções no mesmo dia ou dias posteriores        │
│                                                                 │
│  10. Exportar RDO (impressão):                                  │
│      GET /api/documentos/diario/{diario_id}/rdo                 │
│      • Gera documento formatado para impressão/PDF              │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.1.3 RBAC Envolvido

| Ação | Quem Pode |
|------|-----------|
| Criar/editar diário | EMPRESA (dono do contrato) |
| Visualizar diário | EMPRESA e **APOIO_N2+** (APOIO_N1 e FISCAL não acessam) |
| Exportar RDO | EMPRESA e **APOIO_N2+** |

---

### 5.2 Vistorias (Mobile)

Fluxo de fiscalização presencial via aplicativo mobile. O fiscal vai ao
canteiro de obras, faz check-in georreferenciado, executa um checklist
baseado nos itens da medição vigente, registra fotos invioláveis e emite
o resultado da vistoria.

#### 5.2.1 Modelo de Dados

```
Vistoria
  ├── fiscal_id: FK → Usuario
  ├── objeto_id: FK → Objeto
  ├── medicao_id: FK → Medicao (opcional, vincula à medição vigente)
  ├── local_checkin: Geometry(POINT, 4326) — coordenadas do fiscal
  ├── checkin_em: DateTime (momento do check-in)
  ├── dentro_raio: Boolean (se está dentro do geofencing)
  ├── distancia_metros: Float (distância até o objeto)
  ├── resultado: PENDENTE | CONFORME | NAO_CONFORME
  ├── observacoes: Text (obrigatório se NÃO CONFORME)
  ├── finalizada_em: DateTime (momento da finalização)
  │
  └── ChecklistItem (1:N)
        ├── evento_id: FK → Evento (serviço do cronograma a vistoriar)
        ├── atestado: Boolean (true = conforme, false = não conforme)
        └── observacao: Text

FotoVistoria
  ├── vistoria_id: FK → Vistoria
  ├── checklist_item_id: FK → ChecklistItem (opcional)
  ├── url_storage: String
  ├── filename: String
  ├── coordenadas: Geometry(POINT, 4326)
  ├── hash_sha256: String(64) — integridade da imagem
  ├── carimbo_servidor: DateTime — timestamp do servidor (não do dispositivo)
  ├── exif_metadata: JSONB — metadados extraídos
  └── origem_camera: Boolean (sempre true — RN03 proíbe galeria)
```

#### 5.2.2 Fluxo Completo da Vistoria

```
┌─────────────────────────────────────────────────────────────────┐
│  FASE 1 — CHECK-IN GEORREFERENCIADO (RF05)                      │
│                                                                 │
│  1. App mobile envia coordenadas GPS do fiscal:                 │
│     POST /api/vistorias/checkin                                  │
│     Body: { objeto_id, latitude, longitude, medicao_id? }       │
│                                                                 │
│  2. Servidor valida geofencing (Haversine):                     │
│     • Calcula distância entre GPS do fiscal e coordenadas       │
│       do objeto (armazenadas em PostGIS)                        │
│     • Compara com raio_geofencing_metros do objeto              │
│       (padrão: 200m, configurável por objeto)                   │
│     • Registra dentro_raio (bool) e distancia_metros            │
│                                                                 │
│  3. Sistema cria a vistoria com status PENDENTE                 │
│                                                                 │
│  FASE 2 — GERAÇÃO DO CHECKLIST (RF06)                           │
│                                                                 │
│  4. Se vinculada a uma medição, o sistema gera automaticamente  │
│     o checklist a partir dos MedicaoItem da medição:            │
│     • Um ChecklistItem por evento do boletim                    │
│     • Fiscal confere cada serviço in loco                       │
│                                                                 │
│  5. App consulta o checklist:                                   │
│     GET /api/vistorias/{vistoria_id}/checklist                   │
│                                                                 │
│  FASE 3 — ATESTAÇÃO DOS ITENS (RF06)                            │
│                                                                 │
│  6. Para cada item do checklist, o fiscal atesta:               │
│     PATCH /api/vistorias/checklist/{item_id}                     │
│     • atestado: true (executado conforme) | false (problema)    │
│     • observacao: detalhes do que foi constatado                │
│                                                                 │
│  FASE 4 — REGISTRO FOTOGRÁFICO (RF07 / RN03)                    │
│                                                                 │
│  7. App captura foto com câmera nativa (nunca galeria):         │
│     POST /api/vistorias/{vistoria_id}/fotos                      │
│     Multipart: file + checklist_item_id + latitude + longitude  │
│                                                                 │
│  8. Servidor processa a foto (inviolabilidade):                 │
│     • Valida tipo (JPEG/PNG/WebP)                               │
│     • Calcula hash SHA-256 do conteúdo binário                  │
│     • Registra carimbo_servidor (data/hora UTC do servidor)     │
│     • Armazena coordenadas GPS em PostGIS                       │
│     • Extrai e persiste EXIF metadata                           │
│     • Upload para MinIO/S3 (fallback mock:// se indisponível)   │
│                                                                 │
│  FASE 5 — FINALIZAÇÃO (RN02)                                    │
│                                                                 │
│  9. Fiscal consolida e finaliza:                                │
│     POST /api/vistorias/{vistoria_id}/finalizar                  │
│     Body: { resultado: CONFORME | NAO_CONFORME, observacoes }   │
│                                                                 │
│     Validações:                                                 │
│     • Vistoria pertence ao fiscal logado                        │
│     • Status atual = PENDENTE (não pode refinalizar)            │
│     • Se NAO_CONFORME: observacoes é obrigatório                │
│                                                                 │
│  10. Sistema registra:                                          │
│      • resultado final                                          │
│      • finalizada_em (timestamp)                                │
│      • Auditoria: ação FINALIZAR no audit_log                   │
│                                                                 │
│  FASE 6 — REGISTRO DE PENDÊNCIAS (RF17)                         │
│                                                                 │
│  11. Se houver não conformidades, fiscal registra pendência:    │
│      POST /api/vistorias/{vistoria_id}/pendencias                │
│      Body: { descricao, gravidade: LEVE|GRAVE|CRITICO,          │
│               prazo_dias? }                                     │
│                                                                 │
│  12. Sistema gera automaticamente:                              │
│      • Alerta do tipo NOTIFICACAO_PENDENTE                      │
│      • Prioridade mapeada da gravidade                          │
│        (LEVE→BAIXA, GRAVE→ALTA, CRITICO→CRITICA)               │
│      • Notificação para empresa e equipe de apoio (RF17)        │
│                                                                 │
│  FASE 7 — HISTÓRICO DO OBJETO (RF18)                            │
│                                                                 │
│  13. App consulta linha do tempo do objeto:                     │
│      GET /api/vistorias/objetos/{objeto_id}/historico            │
│                                                                 │
│      Retorna consolidado de:                                    │
│      • Vistorias realizadas (check-in, resultado, observações)  │
│      • Medições aprovadas (número, valor, data)                 │
│      • Pendências ativas (título, prioridade, resolvido?)       │
│                                                                 │
│  FASE 8 — TIMESTAMP DO SERVIDOR                                 │
│                                                                 │
│  14. App obtém timestamp oficial para carimbos:                 │
│      GET /api/vistorias/timestamp                                │
│      • Usado pelo app para sincronizar relógio (RN03)           │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.2.3 Regras de Negócio

| Regra | Descrição |
|-------|-----------|
| **RN02** | Fiscal finaliza vistoria como CONFORME ou NAO_CONFORME; observações obrigatórias se não conforme |
| **RN03** | Fotos têm hash SHA-256, carimbo do servidor (não do dispositivo), GPS; proibido usar galeria |
| **RF05** | Check-in com validação de geofencing via Haversine + PostGIS |
| **RF06** | Checklist gerado automaticamente dos itens da medição vinculada |
| **RF07** | Upload de fotos com metadados invioláveis |
| **RF17** | Registro de pendências com notificação automática para empresa e apoio |
| **RF18** | Linha do tempo completa do objeto no app mobile |

#### 5.2.4 RBAC Envolvido

| Ação | Quem Pode |
|------|-----------|
| Check-in | FISCAL+ |
| Checklist (ler/atestar) | FISCAL+ |
| Upload de fotos | FISCAL+ |
| Finalizar vistoria | FISCAL+ |
| Registrar pendência | FISCAL+ |
| Consultar histórico | FISCAL+ |

---

### 5.3 Curva S — Análise de Valor Agregado (EVM)

Ferramenta de Earned Value Management que projeta três curvas de avanço
financeiro para acompanhamento da saúde do objeto. Alimenta o sistema de
alertas preditivos (RN05).

#### 5.3.1 Séries Calculadas

```
┌──────────────────────────────────────────────────────────────────┐
│  SÉRIE 1 — PLANEJADO (linha de base)                             │
│                                                                  │
│  • Soma o valor_total de todos os Eventos do cronograma          │
│  • Distribui uniformemente ao longo dos meses do projeto         │
│  • Período: data_inicio → data_fim_prevista do objeto            │
│  • Se não houver datas, usa criado_em → +365 dias                │
│  • Valor por mês = valor_total_planejado / total_de_meses        │
│  • Último ponto sempre atinge 100% do valor contratado           │
│                                                                  │
│  SÉRIE 2 — REALIZADO (acumulado das medições)                    │
│                                                                  │
│  • Soma valor_medido das medições com status APROVADA            │
│  • Ordenadas por data de criação (criado_em)                     │
│  • Acumula por mês: soma das medições com data ≤ mês corrente    │
│  • Reflete o valor efetivamente medido e aprovado                │
│                                                                  │
│  SÉRIE 3 — PREDITIVO (regressão linear)                          │
│                                                                  │
│  • Regressão linear simples sobre os pontos realizados > 0       │
│  • y = slope × x + intercept                                     │
│  • Projeta a data em que o valor atinge o total planejado        │
│  • Se a projeção ultrapassa o prazo contratual, estende o        │
│    eixo X com datas futuras (intervalos de 30 dias)              │
│  • A série planejada entra em platô após o fim do contrato       │
│                                                                  │
│  SAÍDA:                                                          │
│  { datas[], planejado[], realizado[], preditivo[],               │
│    valor_total_planejado, valor_total_realizado,                 │
│    prazo_contratual, prazo_predito }                             │
└──────────────────────────────────────────────────────────────────┘
```

#### 5.3.2 Fluxo de Uso

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Dashboard/Relatório solicita curva S:                       │
│     GET /api/curva-s/objetos/{objeto_id}                        │
│                                                                 │
│  2. Sistema retorna as 3 séries + metadados:                    │
│     • datas: eixo X (meses)                                     │
│     • planejado: valores acumulados esperados                   │
│     • realizado: valores acumulados efetivos                    │
│     • preditivo: projeção linear até conclusão                  │
│     • prazo_contratual: data fim prevista                       │
│     • prazo_predito: data estimada de conclusão                 │
│                                                                 │
│  3. Frontend renderiza gráfico de 3 linhas:                     │
│     • Linha tracejada azul = Planejado                          │
│     • Linha sólida verde = Realizado                            │
│     • Linha pontilhada laranja/vermelha = Preditivo             │
│                                                                 │
│  4. Interpretação (EVM):                                        │
│     • Realizado acima do Planejado = adiantado (SV > 0)         │
│     • Realizado abaixo do Planejado = atrasado (SV < 0)         │
│     • Preditivo cruza alvo após prazo = tendência de atraso     │
│     • Preditivo cruza alvo antes do prazo = tendência ok        │
│                                                                 │
│  5. Integração com Alertas (RN05):                              │
│     • Se prazo_predito > prazo_contratual:                       │
│       - Atraso ≤ 45 dias → saúde AMARELO + alerta ALTA          │
│       - Atraso > 45 dias → saúde VERMELHO + alerta CRITICA       │
│     • Saúde do objeto só é piorada automaticamente,             │
│       nunca melhorada (preserva marcação manual mais severa)    │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.3.3 RBAC Envolvido

| Ação | Quem Pode |
|------|-----------|
| Visualizar Curva S | FISCAL+ |

---

### 5.4 Gestão de ART/RRT

Controle das Anotações de Responsabilidade Técnica (ART) e Registros de
Responsabilidade Técnica (RRT), documentos obrigatórios que vinculam o
responsável técnico ao objeto. A existência de uma ART ativa é pré-requisito
para assinatura de medições (RN01).

#### 5.4.1 Modelo de Dados

```
ArtRrt
  ├── numero: String(50) UNIQUE — número do documento
  ├── tipo: Enum(ART, RRT)
  ├── objeto_id: FK → Objeto
  ├── usuario_id: FK → Usuario (responsável técnico)
  ├── data_emissao: Date
  ├── data_validade: Date
  ├── arquivo_url: String (documento digitalizado)
  └── ativa: Boolean (default True)
```

#### 5.4.2 Fluxo de Gestão

```
┌─────────────────────────────────────────────────────────────────┐
│  FASE 1 — CADASTRO DA ART/RRT                                   │
│                                                                 │
│  1. Responsável cadastra a ART/RRT do objeto:                   │
│     POST /api/art-rrt                                            │
│     Body: { numero, tipo: ART|RRT, objeto_id, data_emissao,     │
│              data_validade, arquivo_url? }                       │
│                                                                 │
│     Validações:                                                 │
│     • Número único no sistema (não pode duplicar)               │
│     • Se já existe com mesmo número → 400 Bad Request           │
│                                                                 │
│  FASE 2 — CONSULTA                                              │
│                                                                 │
│  2. Visualizar ARTs ativas do objeto:                           │
│     GET /api/art-rrt/objeto/{objeto_id}                          │
│     • Retorna apenas registros com ativa = true                 │
│     • Usado para validação antes de assinar medição             │
│                                                                 │
│  FASE 3 — INATIVAÇÃO                                            │
│                                                                 │
│  3. Inativar ART/RRT (ex: vencida ou substituída):              │
│     DELETE /api/art-rrt/{id}                                     │
│     • Não remove o registro — apenas seta ativa = false         │
│     • Histórico preservado para auditoria                       │
│                                                                 │
│  FASE 4 — INTEGRAÇÃO COM MEDIÇÕES (RN01)                        │
│                                                                 │
│  4. Ao assinar medição, sistema verifica:                       │
│     • Existe ao menos 1 ArtRrt com ativa = true para o objeto   │
│     • Se não existir: 400 "Objeto não possui ART/RRT ativa"     │
│     • Bloqueia assinatura até regularização                     │
│                                                                 │
│  FASE 5 — ALERTAS DE VENCIMENTO                                 │
│                                                                 │
│  5. Motor de alertas (gerar_alertas) verifica periodicamente:   │
│     • ART_VENCIDA: data_validade < hoje → CRITICA               │
│     • ART_VENCENDO: data_validade ≤ hoje + 30 dias → MEDIA      │
│     • Alerta gerado uma única vez (não duplica)                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.4.3 Regras de Negócio

| Regra | Descrição |
|-------|-----------|
| **Unicidade** | Número da ART/RRT é único no sistema |
| **RN01** | Medição só pode ser assinada se existir ART/RRT ativa; obrigatória a partir da 1ª medição |
| **Cabeçalho** | O número da ART/RRT é vinculado e fixado no cabeçalho de cada boletim de medição |
| **Inativação** | Inativar não exclui — preserva histórico |
| **Alertas** | Vencida gera CRITICA, vencendo em 30 dias gera MEDIA |

#### 5.4.4 RBAC Envolvido

| Ação | Quem Pode |
|------|-----------|
| Criar ART/RRT | EMPRESA+ |
| Listar ART/RRT | EMPRESA+ |
| Inativar ART/RRT | EMPRESA+ |

---

### 5.5 Gestão de Tarefas (Kanban)

Quadro de tarefas para gestão administrativa e de fiscalização das obras.
Suporta filtro por objeto e responsável, alimentando o painel Kanban no
frontend.

#### 5.5.1 Modelo de Dados

```
Tarefa
  ├── titulo: String (obrigatório)
  ├── descricao: Text
  ├── status: A_FAZER | EM_ANDAMENTO | CONCLUIDO
  ├── prioridade: BAIXA | MEDIA | ALTA | URGENTE
  ├── prazo: Date (opcional)
  ├── objeto_id: FK → Objeto (opcional)
  ├── responsavel_id: FK → Usuario (opcional)
  └── criado_em: DateTime
```

#### 5.5.2 Fluxo Kanban

```
┌─────────────────────────────────────────────────────────────────┐
│  COLUNAS DO QUADRO:                                             │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────┐            │
│  │ A FAZER  │ →  │ EM ANDAMENTO │ →  │  CONCLUÍDO  │            │
│  └──────────┘    └──────────────┘    └─────────────┘            │
│                                                                 │
│  FASE 1 — CRIAÇÃO DE TAREFA                                     │
│                                                                 │
│  1. Usuário cria nova tarefa:                                   │
│     POST /api/tarefas                                            │
│     Body: { titulo, descricao?, status?, prioridade?,           │
│              prazo?, objeto_id?, responsavel_id? }              │
│     • Status padrão: A_FAZER                                    │
│     • Prioridade padrão: MEDIA                                  │
│                                                                 │
│  FASE 2 — VISUALIZAÇÃO                                          │
│                                                                 │
│  2. Listar tarefas com filtros:                                 │
│     GET /api/tarefas?objeto_id=X&responsavel_id=Y               │
│     • Ordenação: criado_em DESC                                 │
│     • Filtros opcionais: por objeto e/ou responsável            │
│                                                                 │
│  3. Ver detalhes de uma tarefa:                                 │
│     GET /api/tarefas/{id}                                        │
│                                                                 │
│  FASE 3 — MOVIMENTAÇÃO NO KANBAN                                │
│                                                                 │
│  4. Atualizar tarefa (mover coluna, alterar prioridade):        │
│     PUT /api/tarefas/{id}                                        │
│     Body: { status?, prioridade?, titulo?, descricao?,          │
│              prazo?, responsavel_id? }                          │
│     • PATCH /api/tarefas/{id}/mover: atalho para mudar status   │
│                                                                 │
│  FASE 4 — CONCLUSÃO / EXCLUSÃO                                  │
│                                                                 │
│  5. Mover para CONCLUIDO:                                       │
│     PATCH /api/tarefas/{id}/mover com status CONCLUIDO           │
│                                                                 │
│  6. Excluir tarefa (se necessário):                             │
│     DELETE /api/tarefas/{id}                                     │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.5.3 RBAC Envolvido

| Ação | Quem Pode |
|------|-----------|
| Listar/visualizar tarefas | EMPRESA+ |
| Criar tarefa | ENGENHEIRO+ (APOIO_N2) |
| Editar/mover tarefa | EMPRESA+ |
| Excluir tarefa | ENGENHEIRO+ (APOIO_N2) |

---

### 5.6 Alertas Automáticos

Motor de alertas que varre periodicamente todos os objetos ativos e gera
alertas para situações de risco. Integra-se com Curva S, ART/RRT, Vistorias
e Documentos. Pode ser acionado manualmente ou por scheduler (RF27).

#### 5.6.1 Modelo de Dados

```
Alerta
  ├── objeto_id: FK → Objeto
  ├── tipo: Enum — classificação do alerta
  │   ├── PRAZO_VENCIDO
  │   ├── SEM_VISTORIA
  │   ├── ART_VENCENDO
  │   ├── ART_VENCIDA
  │   ├── PARALISADA
  │   ├── NOTIFICACAO_PENDENTE
  │   ├── MEDICAO_PENDENTE
  │   ├── ATRASO_PREDITIVO
  │   ├── DOCUMENTO_VENCENDO
  │   └── DOCUMENTO_VENCIDO
  ├── prioridade: BAIXA | MEDIA | ALTA | CRITICA
  ├── titulo: String(200)
  ├── descricao: Text
  ├── resolvido: Boolean (default False)
  ├── resolvido_em: DateTime
  ├── delegado_para_id: FK → Usuario (opcional)
  └── prazo_acao: DateTime (opcional)
```

#### 5.6.2 Regras de Geração de Alertas

```
┌─────────────────────────────────────────────────────────────────┐
│  REGRA 1 — PRAZO DE EXECUÇÃO VENCIDO                            │
│                                                                 │
│  Gatilho: objeto.execucao_fim < hoje                            │
│           E objeto.status NÃO é CONCLUIDA                       │
│           E objeto NÃO está paralisada (RN10)                   │
│  Alerta:  PRAZO_VENCIDO — prioridade ALTA                       │
│  Suspenso durante paralisação formal (RN10)                     │
│                                                                 │
│  REGRA 2 — SEM VISTORIA HÁ +30 DIAS                             │
│                                                                 │
│  Gatilho: objeto.status = EM_EXECUCAO E objeto NÃO paralisada   │
│           E (hoje - última vistoria.checkin_em) > 30 dias       │
│  Alerta:  SEM_VISTORIA                                          │
│           • 30-60 dias → prioridade MEDIA                       │
│           • >60 dias → prioridade ALTA                           │
│  Suspenso durante paralisação formal (RN10)                     │
│                                                                 │
│  REGRA 3 — ART/RRT VENCIDA                                      │
│                                                                 │
│  Gatilho: art.data_validade < hoje E art.ativa = true           │
│  Alerta:  ART_VENCIDA — prioridade CRITICA                      │
│  Descrição: "Bloqueia assinatura de medições"                   │
│                                                                 │
│  REGRA 4 — ART/RRT VENCENDO                                     │
│                                                                 │
│  Gatilho: (art.data_validade - hoje) ≤ 30 dias E art.ativa      │
│  Alerta:  ART_VENCENDO — prioridade MEDIA                       │
│  Descrição: "Providencie a renovação"                           │
│                                                                 │
│  REGRA 5 — OBJETO PARALISADA                                    │
│                                                                 │
│  Gatilho: objeto.status = PARALISADA                            │
│  Alerta:  PARALISADA — prioridade MEDIA                         │
│                                                                 │
│  REGRA 6 — ATRASO PREDITIVO (RN05)                              │
│                                                                 │
│  Gatilho: Curva S preditiva projeta conclusão após prazo        │
│           contratual E objeto EM_EXECUCAO E não paralisada      │
│  Alerta:  ATRASO_PREDITIVO                                      │
│           • Atraso ≤ 45 dias → prioridade ALTA, saúde AMARELO   │
│           • Atraso > 45 dias → prioridade CRITICA, saúde VERMELHO│
│  Efeito:  Atualiza saúde do objeto (só piora, nunca melhora)    │
│                                                                 │
│  REGRA 7 — DOCUMENTO VENCIDO (RF11)                             │
│                                                                 │
│  Gatilho: doc.data_validade < hoje E doc.ativo = true           │
│  Alerta:  DOCUMENTO_VENCIDO — prioridade ALTA                   │
│                                                                 │
│  REGRA 8 — DOCUMENTO VENCENDO (RF11)                            │
│                                                                 │
│  Gatilho: (doc.data_validade - hoje) ≤ 30 dias E doc.ativo      │
│  Alerta:  DOCUMENTO_VENCENDO — prioridade MEDIA                 │
│                                                                 │
│  REGRA GERAL: Cada alerta é gerado UMA única vez por condição.  │
│  Se já existe alerta não resolvido do mesmo tipo para o mesmo   │
│  objeto, não duplica.                                           │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.6.3 Fluxo de Operação

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Geração de alertas (manual ou scheduler RF27):              │
│     POST /api/alertas/gerar                                      │
│     • Varre todos os objetos ativos                             │
│     • Aplica as 8 regras de geração                             │
│     • Respeita suspensão por paralisação (RN10)                 │
│     • Retorna quantos alertas foram criados                     │
│                                                                 │
│  2. Listar alertas com filtros:                                 │
│     GET /api/alertas?objeto_id=X&prioridade=Y&resolvido=false   │
│     • Ordenação: resolvido ASC, prioridade DESC, criado_em DESC │
│                                                                 │
│  3. Delegar alerta a um usuário:                                │
│     PATCH /api/alertas/{id}/delegar                              │
│     Body: { delegado_para_id, prazo_acao? }                     │
│                                                                 │
│  4. Resolver alerta:                                            │
│     PATCH /api/alertas/{id}/resolver                             │
│     • Seta resolvido = true                                     │
│     • Registra resolvido_em (timestamp UTC)                     │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.6.4 RBAC Envolvido

| Ação | Quem Pode |
|------|-----------|
| Listar alertas | APOIO_N2+ |
| Gerar alertas | COORDENADOR+ |
| Delegar alerta | COORDENADOR+ |
| Resolver alerta | APOIO_N2+ |

---

### 5.7 Documentos Contratuais (RF11)

Gerenciamento de documentos vinculados ao objeto com versionamento.
Quando uma nova versão é carregada, a anterior é automaticamente
desativada (mantendo o histórico). Controle de validade alimenta o
motor de alertas.

#### 5.7.1 Modelo de Dados

```
Documento
  ├── objeto_id: FK → Objeto
  ├── tipo: Enum — ART | PLANTA | LICENCA | GARANTIA | SEGURO | OUTRO
  ├── nome: String
  ├── url_storage: String (MinIO/S3 ou mock://)
  ├── data_validade: Date (opcional — para controle de vencimento)
  ├── versao: Integer (incrementa a cada upload do mesmo tipo)
  ├── ativo: Boolean (default True — False para versões substituídas)
  ├── substitui_id: FK → Documento (self-referência, versão anterior)
  └── criado_por_id: FK → Usuario
```

#### 5.7.2 Fluxo de Gestão Documental

```
┌─────────────────────────────────────────────────────────────────┐
│  FASE 1 — LISTAR DOCUMENTOS DO OBJETO                           │
│                                                                 │
│  1. Consultar documentos ativos:                                │
│     GET /api/documentos-contratuais/objetos/{objeto_id}          │
│     • Por padrão, retorna apenas ativos (versão mais recente    │
│       de cada tipo)                                             │
│     • Parâmetro ?incluir_historico=true para ver substituídos   │
│     • Ordenação: tipo, versão DESC                              │
│                                                                 │
│  FASE 2 — UPLOAD DE NOVO DOCUMENTO                              │
│                                                                 │
│  2. Fazer upload:                                               │
│     POST /api/documentos-contratuais/objetos/{objeto_id}         │
│     Multipart: file + tipo + nome + data_validade?              │
│                                                                 │
│  3. Sistema processa o versionamento:                           │
│     a) Busca versão ativa anterior do mesmo tipo no objeto      │
│     b) Se existir:                                              │
│        • Seta ativo = False na versão anterior                  │
│        • Nova versão recebe versao = anterior.versao + 1        │
│        • Nova versão referencia anterior via substitui_id       │
│     c) Se não existir:                                          │
│        • Nova versão recebe versao = 1                          │
│     d) Upload para MinIO/S3                                     │
│        • Chave: documentos/{objeto_id}/{tipo}/{uuid}_{nome}     │
│        • Fallback para mock:// se storage indisponível          │
│     e) Persiste registro no banco                               │
│                                                                 │
│  FASE 3 — INTEGRAÇÃO COM ALERTAS (RF11)                         │
│                                                                 │
│  4. Motor de alertas monitora data_validade:                    │
│     • DOCUMENTO_VENCIDO: validade < hoje → ALTA                 │
│     • DOCUMENTO_VENCENDO: validade ≤ hoje + 30 dias → MEDIA     │
│     • Filtro: apenas documentos com ativo = true                │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.7.3 Regras de Negócio

| Regra | Descrição |
|-------|-----------|
| **RF11** | Versionamento automático: nova versão desativa anterior |
| **Storage** | Upload para MinIO/S3; fallback `mock://` se indisponível |
| **Validade** | data_validade opcional; se preenchida, gera alertas |
| **Histórico** | Versões anteriores preservadas (ativo = false, substitui_id linka) |

#### 5.7.4 RBAC Envolvido

| Ação | Quem Pode |
|------|-----------|
| Listar documentos | EMPRESA+ |
| Fazer upload | EMPRESA+ |

---

### 5.8 Notificações

Sistema de notificações multicanal que informa os usuários sobre eventos
relevantes: medições assinadas, vistorias finalizadas, pendências
registradas, alertas gerados.

#### 5.8.1 Modelo de Dados

```
Notificacao
  ├── usuario_id: FK → Usuario (destinatário)
  ├── titulo: String(200)
  ├── mensagem: Text
  ├── canal: SISTEMA | EMAIL | PUSH
  ├── lida: Boolean (default False)
  └── criado_em: DateTime
```

#### 5.8.2 Fluxo de Notificações

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Sistema gera notificações automaticamente em eventos:       │
│     • Medição assinada → notifica fiscal                        │
│     • Medição aprovada/reprovada → notifica empresa             │
│     • Pendência registrada (RF17) → notifica empresa + apoio    │
│     • Vistoria finalizada → notifica interessados               │
│                                                                 │
│  2. Usuário consulta notificações:                              │
│     GET /api/notificacoes                                        │
│                                                                 │
│  3. Badge de não lidas no header (sino):                        │
│     GET /api/notificacoes/nao-lidas/count                        │
│                                                                 │
│  4. Marcar como lida ao clicar:                                 │
│     PATCH /api/notificacoes/{id}/lida                            │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.8.3 RBAC Envolvido

| Ação | Quem Pode |
|------|-----------|
| Listar notificações | EMPRESA+ |
| Contar não lidas | EMPRESA+ |
| Marcar como lida | EMPRESA+ |

---

## 6. Resumo dos Endpoints por Fluxo

| Fluxo | Endpoints Principais |
|-------|---------------------|
| **Contratos** | `GET/POST /api/contratos`, `GET/PUT /api/contratos/{id}`, `GET /api/contratos/{id}/objetos` |
| **Objetos** | `GET/POST /api/objetos`, `GET/PUT/DELETE /api/objetos/{id}`, `GET/POST /api/objetos/{id}/itens` |
| **Cronograma** | `GET/POST /api/cronograma/objetos/{id}/metas`, `POST .../metas/{id}/submetas`, `POST .../submetas/{id}/eventos`, `PUT/DELETE .../eventos/{id}` |
| **Medições** | `GET/POST /api/empresa/objetos/{id}/medicoes`, `GET /api/empresa/medicoes/{id}/boletim`, `POST .../assinar`, `POST .../avaliar`, `POST .../concluir`, `POST .../aprovar-chefe` |
| **Fotos Medição** | `POST /api/empresa/medicoes/{id}/fotos` |
| **Diário (RDO)** | `GET/POST /api/empresa/objetos/{id}/diario`, `PUT /api/empresa/diario/{id}`, `GET /api/documentos/diario/{id}/rdo` (export) |
| **Vistorias** | `POST /api/vistorias/checkin`, `GET /api/vistorias/{id}/checklist`, `PATCH .../checklist/{id}`, `POST .../{id}/fotos`, `POST .../{id}/finalizar`, `POST .../{id}/pendencias`, `GET .../objetos/{id}/historico`, `GET .../timestamp` |
| **Curva S** | `GET /api/curva-s/objetos/{objeto_id}` |
| **ART/RRT** | `GET /api/art-rrt/objeto/{id}`, `POST /api/art-rrt`, `DELETE /api/art-rrt/{id}` |
| **Tarefas (Kanban)** | `GET /api/tarefas`, `POST /api/tarefas`, `GET /api/tarefas/{id}`, `PUT /api/tarefas/{id}`, `PATCH .../mover`, `DELETE /api/tarefas/{id}` |
| **Alertas** | `GET /api/alertas`, `POST /api/alertas/gerar`, `PATCH /api/alertas/{id}/delegar`, `PATCH /api/alertas/{id}/resolver` |
| **Documentos Contratuais** | `GET /api/documentos-contratuais/objetos/{id}`, `POST /api/documentos-contratuais/objetos/{id}` (upload) |
| **Documentos Export** | `GET /api/documentos/medicoes/{id}/boletim`, `GET .../memoria-calculo` |
| **Notificações** | `GET /api/notificacoes`, `GET /api/notificacoes/nao-lidas/count`, `PATCH /api/notificacoes/{id}/lida` |
| **Acompanhamento** | `GET /api/acompanhamento/objetos/{id}/eventos` + CRUD 9 sub-entidades |
| **Relatórios** | `GET /api/relatorios/resumo`, `GET /api/relatorios/objetos`, `GET /api/relatorios/export`, `GET /api/relatorios/export-objetos`, `GET /api/relatorios/cronograma/{objeto_id}`, `GET /api/relatorios/fotos/{objeto_id}` |
| **Dashboard** | `GET /api/dashboard/executivo`, `GET /api/dashboard/mapa` |
| **Empresas** | `GET/POST /api/empresas`, `GET/PATCH /api/empresas/{id}`, `GET /api/empresas/{id}/contratos` |

---

## 7. Glossário

| Termo | Significado no SIN-Obras |
|-------|--------------------------|
| **Contrato** | Documento jurídico principal; agrupa um ou mais Objetos |
| **Objeto** | O que está sendo contratado (obra, serviço); antiga "Obra" |
| **Item** | Parte constitutiva de um Objeto (serviço/material) |
| **Meta** | Etapa macro do cronograma (nível 1) |
| **Submeta** | Período/parcela da meta (nível 2) |
| **Evento** | Serviço mensurável no período (nível 3) |
| **Medição** | Boletim de aferição do executado em um período |
| **MedicaoItem** | Linha do boletim, vinculada a um Evento |
| **Memória de Cálculo** | Fórmulas e dimensões que compõem a quantidade medida |
| **Boletim** | Documento oficial com 7 colunas (contratado, período, acumulado, saldo) |
| **RDO** | Diário de Obra — registro diário da execução |
| **ART/RRT** | Anotação de Responsabilidade Técnica |
| **SINAPI** | Sistema Nacional de Pesquisa de Custos e Índices da Construção Civil |
| **Alçada** | Valor limite para aprovação sem necessidade de chefe |

---

*Documento gerado a partir do mapeamento do fluxo SE Obras, adaptado ao modelo
de domínio e endpoints do SIN-Obras. Serve como referência para implementação
dos requisitos.*
