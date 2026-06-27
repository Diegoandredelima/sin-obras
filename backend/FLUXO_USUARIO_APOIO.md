# SIN-Obras — Fluxo de Usuário: APOIO N1 e APOIO N2

> Documento de referência para treinamento e implementação.
> Descreve as capacidades e fluxos de trabalho dos perfis de Apoio
> Técnico Nível 1 (APOIO_N1) e Nível 2 (APOIO_N2) no sistema SIN-Obras.
>
> Hierarquia RBAC: `EMPRESA(0) < FISCAL(1) < APOIO_N1(2) < APOIO_N2(3) < COORDENADOR(4) < SECRETARIO(5)`

---

## 1. Visão Geral dos Perfis

### 1.1 APOIO N1 — Apoio Técnico Nível 1

Perfil operacional de entrada. Responsável por cadastrar e manter os objetos
(obras/serviços), estruturar o cronograma físico-financeiro e realizar
vistorias de campo. Trabalha sob supervisão do APOIO_N2 ou COORDENADOR.

> **Importante:** o APOIO_N1 **não** trabalha com **Medições** nem com o
> **Diário de Obras** — essas atividades são exclusivas do **APOIO_N2+**
> (e da própria **Empresa** executora, no seu portal). O N1 estrutura o
> objeto e fiscaliza em campo (vistorias), mas não cria/avalia medições.

**Resumo de capacidades:**
- Criar e editar **Objetos** e seus **Itens**
- Gerenciar integralmente o **Cronograma** (Metas, Submetas, Eventos)
- Editar **Contratos** (sem criá-los)
- Realizar **Vistorias** completas (check-in, checklist, fotos, finalização)
- Visualizar **Curva S**, **Relatórios**, **Dashboard** (mapa)
- Gerenciar **ART/RRT**
- Visualizar **Tarefas**, **Documentos**, **Notificações**, **Empresas**

### 1.2 APOIO N2 — Apoio Técnico Nível 2 (Engenheiro)

Perfil técnico sênior. Além de todas as funções do APOIO_N1, pode criar
contratos, gerenciar o quadro de tarefas, monitorar e resolver alertas,
cadastrar empresas e utilizar recursos de IA. Equivale ao perfil legado
`ENGENHEIRO`.

**Resumo de capacidades (tudo do N1 +):**
- **Medições**: criar medição como Fiscal, concluir e **avaliar** medições
  da empresa (atividade exclusiva do N2+, não disponível ao N1)
- **Diário de Obras**: acompanhar e registrar (junto da Empresa executora)
- **Criar Contratos**
- **Criar e excluir Tarefas** (Kanban)
- **Visualizar e resolver Alertas**
- **Criar e editar Empresas**
- **Visualizar Delegações**
- **Utilizar IA** (análise de diários)
- Visualizar **Dashboard Executivo** (se autorizado)

---

## 2. Fluxo de Trabalho — APOIO N1

### 2.1 Entrada no Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Fazer login em /login                                       │
│  2. Sistema redireciona para /dashboard (Painel de Controle)    │
│  3. Sidebar do APOIO_N1 (menu lateral) — itens, nesta ordem:   │
│     • Dashboard          → /dashboard                           │
│     • Contratos          → /contratos                           │
│     • Empresas           → /empresas                            │
│     • Quadro de Tarefas  → /quadro                              │
│     • Relatório          → /relatorio                           │
│     • Documentos         → /documentos                          │
│                                                                 │
│  (O N1 NÃO vê "Cadastrar" nem "Diário de Obras" — este último  │
│   é exclusivo de Empresa e APOIO_N2+. Para o N2, "Cadastrar ▾" │
│   e "Diário de Obras" aparecem; ver §3.)                        │
│                                                                 │
│  4. RODAPÉ do sidebar: cartão de perfil (abre modal) +          │
│     botão "Sair do sistema".                                    │
│                                                                 │
│  5. HEADER (topo à direita) — NÃO ficam no sidebar:             │
│     • Calculadora de Engenharia (ícone)                         │
│     • Sino de Alertas       (AlertasBell)                       │
│     • Sino de Notificações  (NotificacoesBell)                  │
└─────────────────────────────────────────────────────────────────┘
```

> **Observações sobre a navegação (importante):**
>
> - **Não há item "Mapa de Calor" no sidebar.**
> - O item **"Cadastrar"** é um submenu expansível e só aparece para
>   **APOIO_N2+** (perfis que podem criar contrato/empresa). **APOIO_N1
>   não o vê.** Abre as opções **Novo Contrato** (`/contratos/novo`) e
>   **Empresa** (`/empresas/nova`).
> - **"Medições" não é item próprio do sidebar** — para quem tem acesso
>   (Empresa e APOIO_N2+), aparece como **sub-aba dentro de "Diário de
>   Obras"** (sub-abas `Diário` e `Medições`).
> - **Não existe item "Objetos" no sidebar.** O sistema é
>   **contrato-cêntrico**: o usuário entra em **Contratos**, abre um
>   contrato e cai no **Detalhe do Contrato**, que é o *hub* de trabalho.
> - O **Detalhe do Contrato** concentra, em **abas**, quase todo o ciclo
>   de vida do objeto: `Detalhes · Cronograma · Diário · Medições ·
>   ART/RRT · Documentos · Eventos · Solicitações · Curva S ·
>   Assistente IA`. Um seletor lista os objetos vinculados ao contrato.
> - Para **APOIO_N1**, as abas **Diário**, **Medições** e **Assistente
>   IA** do Detalhe do Contrato ficam **ocultas** — e ele também não vê o
>   item **"Diário de Obras"** no sidebar. Medições e diário são de
>   **APOIO_N2+** (e da Empresa executora). O N1 vê as abas `Detalhes ·
>   Cronograma · ART/RRT · Documentos · Eventos · Solicitações · Curva S`.
> - **Alertas** e **Notificações** são **sinos no header**, não itens de
>   sidebar. Os itens **Executivo** e **Gestão** existem no sidebar, mas
>   só aparecem para **COORDENADOR/SECRETARIO** (N1 e N2 não os veem).

### 2.2 Ciclo de Vida de um Objeto (APOIO_N1)

Este é o fluxo principal do APOIO_N1: estruturar um objeto do início ao fim.

> **Onde isso acontece na interface:** salvo o cadastro inicial do objeto,
> todas as etapas a seguir (cronograma, ART/RRT, documentos, curva S,
> medições, diário) são executadas dentro das **abas do Detalhe do
> Contrato** — não em telas separadas do sidebar. Os endpoints abaixo são
> os mesmos consumidos por essas abas.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ETAPA 1 — RECEBER DEMANDA                                      │
│                                                                 │
│  O COORDENADOR ou APOIO_N2 cria o Contrato.                     │
│  O APOIO_N1 recebe a tarefa de cadastrar os Objetos do          │
│  contrato e estruturar o cronograma.                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ETAPA 2 — CRIAR OBJETO                                         │
│                                                                 │
│  [POST /api/objetos]                                            │
│                                                                 │
│  ⚠️  Na interface, o PRIMEIRO objeto é criado junto com o       │
│     contrato no MESMO formulário (/contratos/novo). Objetos     │
│     adicionais são adicionados inline na mesma página após      │
│     salvar. Não há rota separada de "novo objeto" no sidebar.   │
│                                                                 │
│  2.1 Acessar /contratos/novo (cria contrato + objeto juntos)   │
│  2.2 Campos do objeto no formulário:                            │
│      • Título (obrigatório)                                     │
│      • Descrição do escopo                                      │
│      • Endereço estruturado: CEP (preenchimento automático      │
│        via ViaCEP), logradouro, número, conjunto, bairro,       │
│        município, UF                                            │
│      • Status: PLANEJADA / EM_EXECUCAO / PARALISADA / CONCLUIDA │
│      • Datas: início, previsão de fim                           │
│                                                                 │
│  Valores definidos pelo sistema (não expostos no formulário):   │
│      • Situação: A_INICIAR (default)                            │
│      • Saúde: VERDE (default)                                   │
│      • Raio de geofencing: 200m (default)                       │
│      • Coordenadas GPS: aceitas pelo backend, mas sem campo     │
│        de entrada no formulário web (uso futuro / mobile)       │
│                                                                 │
│  2.3 Salvar → Contrato + Objeto criados, status PLANEJADA       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ETAPA 3 — CADASTRAR ITENS DO OBJETO                            │
│                                                                 │
│  [POST /api/objetos/{id}/itens]                                 │
│                                                                 │
│  3.1 Para cada serviço/material previsto no escopo:             │
│      • Descrição (ex: "Concreto usinado FCK 25MPa")             │
│      • Unidade (m³, m², kg, un, etc.)                           │
│      • Quantidade total contratada                              │
│      • Valor unitário (referência SINAPI ou planilha)           │
│      • Ordem (sequência na planilha)                            │
│                                                                 │
│  3.2 O valor_total do item = quantidade × valor_unitario        │
│  3.3 A soma dos itens compõe o valor total do objeto            │
│                                                                 │
│  [PUT /api/objetos/itens/{item_id}] — editar item existente     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ETAPA 4 — ESTRUTURAR O CRONOGRAMA                              │
│                                                                 │
│  O cronograma tem 3 níveis: Meta → Submeta → Evento             │
│                                                                 │
│  4.1 CRIAR METAS (etapas macro):                                │
│      [POST /api/cronograma/objetos/{id}/metas]                  │
│                                                                 │
│      Exemplo para uma escola:                                   │
│      Meta 1: "Serviços Preliminares"         — R$ 50.000,00     │
│      Meta 2: "Fundação e Estrutura"          — R$ 500.000,00    │
│      Meta 3: "Alvenaria e Cobertura"         — R$ 300.000,00    │
│      Meta 4: "Instalações Hidrossanitárias"  — R$ 150.000,00    │
│      Meta 5: "Instalações Elétricas"         — R$ 120.000,00    │
│      Meta 6: "Revestimentos e Acabamentos"   — R$ 280.000,00    │
│      Meta 7: "Serviços Complementares"       — R$ 100.000,00    │
│                                                                 │
│  4.2 CRIAR SUBMETAS (distribuição temporal):                    │
│      [POST /api/cronograma/metas/{meta_id}/submetas]            │
│                                                                 │
│      Para cada meta, distribuir nos meses:                      │
│      Meta 1 → Submeta "Mês 1": 100%                             │
│      Meta 2 → Submeta "Mês 1": 30%, "Mês 2": 50%, "Mês 3": 20% │
│      Meta 3 → Submeta "Mês 2": 20%, "Mês 3": 60%, "Mês 4": 20% │
│      ...                                                        │
│                                                                 │
│      • valor: parcela em R$ da meta naquele período             │
│      • percentual_previsto: % de avanço da meta no período      │
│                                                                 │
│  4.3 CRIAR EVENTOS (serviços mensuráveis por período):          │
│      [POST /api/cronograma/submetas/{submeta_id}/eventos]       │
│                                                                 │
│      Para cada submeta, detalhar os serviços:                   │
│      • descricao: nome do serviço                               │
│      • quantidade: volume previsto para aquele período          │
│      • unidade: m³, m², kg, un, etc.                            │
│      • valor_unitario: preço unitário                           │
│      • catalogo_item_id: vínculo opcional ao catálogo SINAPI    │
│                                                                 │
│      Exemplo — Submeta "Mês 2" da Meta 2:                      │
│      Evento 1: "Escavação manual" — 50 m³ — R$ 80,00/m³        │
│      Evento 2: "Concreto magro" — 15 m³ — R$ 350,00/m³         │
│      Evento 3: "Armação CA-50" — 2.000 kg — R$ 12,00/kg        │
│      Evento 4: "Forma de madeira" — 200 m² — R$ 65,00/m²       │
│                                                                 │
│  [PUT /api/cronograma/eventos/{id}] — editar evento             │
│  [DELETE /api/cronograma/eventos/{id}] — remover evento         │
│                                                                 │
│  CHECKLIST DE CONSISTÊNCIA DO CRONOGRAMA:                       │
│  ☐ Soma dos valores das Metas ≈ valor do Objeto                 │
│  ☐ Soma dos percentuais das Submetas de uma Meta = 100%         │
│  ☐ Soma das quantidades dos Eventos por serviço ≤               │
│    quantidade total do Item correspondente                      │
│  ☐ Todos os meses do projeto têm Submetas?                      │
│                                                                 │
│  RELATÓRIO DE PROGRESSO POR META:                               │
│  [GET /api/relatorios/cronograma/{objeto_id}]                   │
│  • Exibe porcentagem de avanço planejada × realizada por meta   │
│  • Permite identificar metas em atraso antes da medição         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ETAPA 5 — CADASTRAR ART/RRT                                    │
│                                                                 │
│  [POST /api/art-rrt]                                            │
│                                                                 │
│  5.1 Registrar o documento de responsabilidade técnica:         │
│      • Número da ART ou RRT                                     │
│      • Tipo: ART (obra) ou RRT (serviço)                        │
│      • Objeto vinculado                                         │
│      • Datas de emissão e validade                              │
│      • URL do documento digitalizado (upload)                   │
│                                                                 │
│  ⚠️  Sem ART/RRT ativa, a empresa não consegue assinar          │
│     medições (RN01). A ART é obrigatória a partir da 1ª medição.│
│  ⚠️  O número da ART/RRT é vinculado à medição e registrado     │
│     de forma fixa no cabeçalho de cada boletim de medição.     │
│                                                                 │
│  [GET /api/art-rrt/objeto/{id}] — verificar ARTs ativas         │
│  [DELETE /api/art-rrt/{id}] — inativar (não exclui)             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ETAPA 6 — ACOMPANHAR EXECUÇÃO                                  │
│                                                                 │
│  6.1 Visualizar Curva S do objeto:                              │
│      [GET /api/curva-s/objetos/{objeto_id}]                     │
│      • Acompanhar planejado × realizado × preditivo             │
│      • Identificar tendências de atraso ou adiantamento         │
│                                                                 │
│  6.2 Visualizar Relatórios:                                     │
│      [GET /api/relatorios/resumo]                               │
│      [GET /api/relatorios/objetos]                              │
│      [GET /api/relatorios/export]                               │
│      • Resumo consolidado de todos os objetos                   │
│      • Exportação em XLSX/PDF                                   │
│                                                                 │
│  6.3 Acompanhar Diário de Obra (RDO):                           │
│      [GET /api/empresa/objetos/{id}/diario]                     │
│      • Ver registros diários da empresa                         │
│                                                                 │
│  6.4 Visualizar Documentos Contratuais:                         │
│      [GET /api/documentos-contratuais/objetos/{id}]             │
│      • Plantas, licenças, garantias, seguros                    │
│                                                                 │
│  6.5 Relatório Fotográfico:                                     │
│      [GET /api/relatorios/fotos/{objeto_id}]                    │
│      • Compilação das fotos de vistorias e medições             │
│      • Exportável em PDF, agrupado por vistoria/período         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ETAPA 7 — REALIZAR VISTORIAS                                   │
│                                                                 │
│  (Ver seção 4 — Fluxo de Vistoria)                              │
│                                                                 │
│  7.1 Fazer check-in no objeto (valida geofencing)               │
│  7.2 Executar checklist dos itens da medição                   │
│  7.3 Registrar fotos georreferenciadas                          │
│  7.4 Finalizar como CONFORME ou NÃO CONFORME                    │
│  7.5 Registrar pendências se necessário                         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ETAPA 8 — ENCAMINHAR PARA MEDIÇÃO (APOIO_N2)                   │
│                                                                 │
│  ⚠️  Medições NÃO são responsabilidade do APOIO_N1.             │
│  Com o objeto estruturado e fiscalizado, o N1 sinaliza ao       │
│  APOIO_N2 que o objeto está apto para o ciclo de medições.      │
│  O N2 (ou a Empresa, no portal) cria, conclui e avalia as       │
│  medições — ver seções 5 e 6.                                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ETAPA 9 — CONSULTAR DOCUMENTOS (somente leitura)              │
│                                                                 │
│  O N1 pode visualizar/exportar documentos já gerados:           │
│  9.1 Boletim de Medição (XLSX/PDF):                             │
│       [GET /api/documentos/medicoes/{id}/boletim]               │
│  9.2 Memória de Cálculo:                                        │
│       [GET /api/documentos/medicoes/{id}/memoria-calculo]       │
│  9.3 RDO (Diário):                                              │
│       [GET /api/documentos/diario/{diario_id}/rdo]              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Permissões Específicas — APOIO_N1

| Ação | Endpoint | Permitido? |
|------|----------|-----------|
| Criar objeto | `POST /api/objetos` | Sim |
| Editar objeto | `PUT /api/objetos/{id}` | Sim |
| Excluir objeto | `DELETE /api/objetos/{id}` | Não (COORDENADOR+) |
| Criar/editar itens | `POST/PUT /api/objetos/{id}/itens` | Sim |
| Excluir itens | `DELETE /api/objetos/itens/{id}` | Não (COORDENADOR+) |
| Criar contrato | `POST /api/contratos` | **Não** |
| Editar contrato | `PUT /api/contratos/{id}` | Sim |
| Criar/editar/excluir metas | Cronograma | Sim |
| Criar/editar/excluir submetas | Cronograma | Sim |
| Criar/editar/excluir eventos | Cronograma | Sim |
| Criar medição fiscal | `POST .../medicoes/fiscal` | **Não (APOIO_N2+)** |
| Concluir medição fiscal | `POST .../medicoes/{id}/concluir` | **Não (APOIO_N2+)** |
| Avaliar medição | `POST .../medicoes/{id}/avaliar` | **Não (APOIO_N2+)** |
| Aprovar como chefe | `POST .../medicoes/{id}/aprovar-chefe` | Não (COORDENADOR+) |
| Acessar Diário de Obras | `.../objetos/{id}/diario` | **Não (APOIO_N2+ / Empresa)** |
| Check-in vistoria | `POST /api/vistorias/checkin` | Sim |
| Checklist + fotos | Vistorias | Sim |
| Finalizar vistoria | `POST .../finalizar` | Sim |
| Curva S | `GET /api/curva-s/...` | Sim |
| Relatórios | `GET /api/relatorios/...` | Sim |
| Dashboard mapa | `GET /api/dashboard/mapa` | Sim |
| Dashboard executivo | `GET /api/dashboard/executivo` | Não (COORDENADOR+) |
| Criar tarefa | `POST /api/tarefas` | **Não** |
| Excluir tarefa | `DELETE /api/tarefas/{id}` | **Não** |
| Visualizar alertas | `GET /api/alertas` | **Não** |
| Resolver alertas | `PATCH /api/alertas/{id}/resolver` | **Não** |
| Criar/editar empresa | `POST/PATCH /api/empresas` | **Não** |
| IA — analisar diários | `POST /api/ia/...` | **Não** |
| Gerenciar ART/RRT | `POST/DELETE /api/art-rrt` | Sim |
| Ver notificações | `/api/notificacoes` | Sim |
| Ver documentos | `/api/documentos-contratuais` | Sim |
| Exportar documentos | `/api/documentos/medicoes/...` | Sim |

---

## 3. Fluxo de Trabalho — APOIO N2

O APOIO_N2 herda **todas** as capacidades do APOIO_N1 (seção 2) mais as
atividades de supervisão e gestão descritas a seguir.

### 3.1 Capacidades Exclusivas do APOIO_N2

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  FUNÇÃO 1 — CRIAR CONTRATOS                                     │
│                                                                 │
│  [POST /api/contratos]                                          │
│                                                                 │
│  1.1 Acessar /contratos/novo                                    │
│  1.2 Preencher o formulário (contrato + primeiro objeto juntos):│
│      Contrato:                                                  │
│      • Número do contrato (único)*                              │
│      • Número e link do processo SEI*                           │
│      • Número da licitação, resumo (texto livre)                │
│      • Datas: assinatura, vigência (fim)                        │
│      • Partes: empresa, órgão, fiscal, gestor                   │
│      • Financeiro: valor global*, reajustado, final             │
│      • Recursos: federal, estadual                              │
│      • Percentual de retenção padrão                            │
│      Primeiro objeto (criado no mesmo formulário):              │
│      • Título*, descrição, status, datas, endereço              │
│  1.3 Salvar → Contrato + objeto criados simultaneamente         │
│  1.4 Adicionar demais objetos inline (se houver)                │
│  1.5 "Concluir" → abre DetalheContrato                          │
│                                                                 │
│  ⚠️  APOIO_N1 NÃO pode criar contratos — apenas editar.         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FUNÇÃO 2 — GERENCIAR TAREFAS (KANBAN)                          │
│                                                                 │
│  [POST /api/tarefas]                                            │
│  [DELETE /api/tarefas/{id}]                                     │
│                                                                 │
│  2.1 Criar tarefas para a equipe:                               │
│      • Definir título, descrição, prioridade, prazo             │
│      • Vincular a um objeto e/ou responsável                    │
│      • Posicionar na coluna A FAZER                             │
│                                                                 │
│  2.2 Acompanhar quadro Kanban:                                  │
│      • Visualizar todas as tarefas por objeto                   │
│      • Mover entre colunas (A FAZER → EM ANDAMENTO → CONCLUÍDO) │
│                                                                 │
│  2.3 Excluir tarefas obsoletas ou concluídas                    │
│                                                                 │
│  ⚠️  APOIO_N1 só pode VISUALIZAR tarefas, não criar/excluir.    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FUNÇÃO 3 — MONITORAR E RESOLVER ALERTAS                        │
│                                                                 │
│  [GET /api/alertas]                                             │
│  [PATCH /api/alertas/{id}/resolver]                             │
│                                                                 │
│  3.1 Acessar central de alertas:                                │
│      • Filtrar por objeto, prioridade, resolvido/não            │
│      • Ordenação: não resolvidos primeiro, maior prioridade     │
│                                                                 │
│  3.2 Analisar cada alerta:                                      │
│      • PRAZO_VENCIDO: execução atrasada                         │
│      • SEM_VISTORIA: objeto sem fiscalização há +30 dias        │
│      • ART_VENCIDA/VENCENDO: documento de RT irregular          │
│      • PARALISADA: objeto com status de paralisação             │
│      • ATRASO_PREDITIVO: Curva S projeta atraso                 │
│      • DOCUMENTO_VENCIDO/VENCENDO: documento contratual expirado│
│      • NOTIFICACAO_PENDENTE: pendência de vistoria              │
│                                                                 │
│  3.3 Resolver alerta após tratativa:                            │
│      • Seta resolvido = true                                    │
│      • Registra resolvido_em automaticamente                    │
│                                                                 │
│  ⚠️  APOIO_N1 NÃO tem acesso à central de alertas.              │
│  ⚠️  Apenas COORDENADOR pode GERAR alertas ou DELEGAR.          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FUNÇÃO 4 — CADASTRAR E EDITAR EMPRESAS                         │
│                                                                 │
│  [POST /api/empresas]                                           │
│  [PATCH /api/empresas/{id}]                                     │
│                                                                 │
│  4.1 Cadastrar nova empresa executora:                          │
│      • Razão social (única)                                     │
│      • CNPJ (único)                                             │
│      • Nome fantasia                                             │
│      • Email, telefone                                          │
│      • Endereço, município, UF                                  │
│      • Representante legal                                      │
│      • Observações                                              │
│                                                                 │
│  4.2 Editar dados cadastrais da empresa                         │
│                                                                 │
│  4.3 Visualizar contratos vinculados à empresa:                 │
│      [GET /api/empresas/{id}/contratos]                         │
│                                                                 │
│  ⚠️  APOIO_N1 só pode VISUALIZAR empresas.                      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FUNÇÃO 5 — VISUALIZAR DELEGAÇÕES                               │
│                                                                 │
│  [GET /api/delegacoes]                                          │
│                                                                 │
│  5.1 Consultar delegações de fiscalização:                      │
│      • Quem está delegado a qual objeto                         │
│      • Função delegada: FISCAL, APOIO_N1, APOIO_N2              │
│      • Período de vigência da delegação                         │
│                                                                 │
│  ⚠️  Apenas COORDENADOR pode CRIAR ou EXCLUIR delegações.       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FUNÇÃO 6 — ANALISAR DIÁRIOS COM IA (RF21)                      │
│                                                                 │
│  [POST /api/ia/objetos/{objeto_id}/analisar-diarios]            │
│                                                                 │
│  6.1 Solicitar análise inteligente dos diários de obra:         │
│      • Resumo das atividades por período                        │
│      • Identificação de padrões e anomalias                     │
│      • Sugestões baseadas nos registros                         │
│                                                                 │
│  ⚠️  APOIO_N1 NÃO tem acesso aos recursos de IA.                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Permissões Exclusivas — APOIO_N2

| Ação | Endpoint | APOIO_N1 | APOIO_N2 |
|------|----------|----------|----------|
| Criar contrato | `POST /api/contratos` | Não | **Sim** |
| Criar tarefa | `POST /api/tarefas` | Não | **Sim** |
| Excluir tarefa | `DELETE /api/tarefas/{id}` | Não | **Sim** |
| Visualizar alertas | `GET /api/alertas` | Não | **Sim** |
| Resolver alertas | `PATCH /api/alertas/{id}/resolver` | Não | **Sim** |
| Gerar alertas | `POST /api/alertas/gerar` | Não | Não (COORD.) |
| Delegar alertas | `PATCH /api/alertas/{id}/delegar` | Não | Não (COORD.) |
| Criar empresa | `POST /api/empresas` | Não | **Sim** |
| Editar empresa | `PATCH /api/empresas/{id}` | Não | **Sim** |
| Visualizar delegações | `GET /api/delegacoes` | Não | **Sim** |
| Criar/excluir delegação | `POST/DELETE /api/delegacoes` | Não | Não (COORD.) |
| IA — analisar diários | `POST /api/ia/...` | Não | **Sim** |
| Dashboard executivo | `GET /api/dashboard/executivo` | Não | Não (COORD.) |

---

## 4. Fluxo Detalhado — Vistoria (APOIO_N1 e APOIO_N2)

Fluxo comum aos dois perfis. O fiscal (APOIO_N1 ou N2) vai a campo para
conferir a execução dos serviços.

```
┌─────────────────────────────────────────────────────────────────┐
│  PASSO 1 — CHECK-IN (RF05)                                      │
│                                                                 │
│  Abrir app mobile, selecionar o objeto e tocar em "Check-in".   │
│  POST /api/vistorias/checkin                                     │
│                                                                 │
│  • App envia coordenadas GPS atuais do dispositivo              │
│  • Servidor calcula distância (Haversine) até o objeto          │
│  • Valida se está dentro do raio de geofencing                  │
│    (configurável por objeto, padrão 200m)                       │
│  • Registra: dentro_raio (bool), distancia_metros               │
│                                                                 │
│  Resultado: Vistoria criada com status PENDENTE.                │
│                                                                 │
│  ⚠️  Se houver medição vinculada, o checklist é gerado          │
│     automaticamente com os itens daquela medição.               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  PASSO 2 — EXECUTAR CHECKLIST (RF06)                            │
│                                                                 │
│  GET /api/vistorias/{vistoria_id}/checklist                      │
│                                                                 │
│  Para cada item do checklist (um por evento da medição):        │
│  • Conferir fisicamente o serviço no canteiro                   │
│  • Atestar se foi executado conforme:                           │
│    PATCH /api/vistorias/checklist/{item_id}                      │
│    Body: { atestado: true/false, observacao: "..." }            │
│                                                                 │
│  ⚠️  Itens não conformes devem ter observação descritiva.       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  PASSO 3 — REGISTRAR FOTOS (RF07 / RN03)                        │
│                                                                 │
│  POST /api/vistorias/{vistoria_id}/fotos                         │
│                                                                 │
│  • Capturar com câmera nativa (NUNCA galeria — RN03)            │
│  • App envia: foto + checklist_item_id + latitude + longitude   │
│                                                                 │
│  Servidor processa:                                             │
│  • Valida tipo (JPEG/PNG/WebP)                                  │
│  • Calcula hash SHA-256 dos bytes da imagem                     │
│  • Registra carimbo do servidor (data/hora UTC)                 │
│  • Armazena coordenadas GPS (PostGIS)                           │
│  • Extrai EXIF metadata                                         │
│  • Upload para MinIO/S3                                         │
│                                                                 │
│  ⚠️  Hash e carimbo do servidor garantem a inviolabilidade      │
│     da foto para fins de auditoria.                             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  PASSO 4 — FINALIZAR VISTORIA (RN02)                            │
│                                                                 │
│  POST /api/vistorias/{vistoria_id}/finalizar                     │
│                                                                 │
│  • Escolher resultado: CONFORME ou NÃO CONFORME                 │
│  • Se NÃO CONFORME: OBSERVAÇÕES SÃO OBRIGATÓRIAS               │
│                                                                 │
│  Validações do servidor:                                        │
│  • Vistoria pertence ao usuário logado?                         │
│  • Status atual = PENDENTE? (não pode refinalizar)              │
│  • Se NAO_CONFORME: observacoes preenchidas?                    │
│                                                                 │
│  Resultado: Vistoria finalizada.                                │
│  Registrado em audit_log: ação FINALIZAR.                       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  PASSO 5 — REGISTRAR PENDÊNCIA (RF17, se necessário)            │
│                                                                 │
│  POST /api/vistorias/{vistoria_id}/pendencias                    │
│  Body: { descricao, gravidade: LEVE|GRAVE|CRITICO,              │
│           prazo_dias? }                                         │
│                                                                 │
│  Sistema automaticamente:                                       │
│  • Cria alerta do tipo NOTIFICACAO_PENDENTE                     │
│  • Prioridade: LEVE→BAIXA, GRAVE→ALTA, CRITICO→CRITICA          │
│  • Notifica a empresa e a equipe de apoio                       │
│  • Registra em audit_log                                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  CONSULTA — HISTÓRICO DO OBJETO (RF18)                          │
│                                                                 │
│  GET /api/vistorias/objetos/{objeto_id}/historico                │
│                                                                 │
│  Retorna linha do tempo consolidada:                            │
│  • Vistorias realizadas (datas, resultados, observações)        │
│  • Medições aprovadas (número, valor, data)                     │
│  • Pendências ativas (título, prioridade, status)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Fluxo Detalhado — Medição como Fiscal (APOIO_N2)

> Atividade **exclusiva do APOIO_N2+**. O APOIO_N1 não cria nem conclui
> medições (ver §1.1).

Quando o próprio fiscal (APOIO_N2) vai a campo e cria a medição.
Diferente da medição da empresa, a medição fiscal vai direto para
APROVADA após conclusão.

```
┌─────────────────────────────────────────────────────────────────┐
│  PASSO 1 — CRIAR MEDIÇÃO FISCAL                                 │
│                                                                 │
│  POST /api/empresa/objetos/{objeto_id}/medicoes/fiscal           │
│                                                                 │
│  • Preencher período de vigência (data_inicio, data_fim)        │
│  • Definir data da medição                                      │
│  • Status inicial: RASCUNHO                                     │
│  • Origem: FISCAL (define o fluxo direto)                       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  PASSO 2 — LANÇAR ITENS                                         │
│                                                                 │
│  POST /api/empresa/medicoes/{medicao_id}/itens                   │
│                                                                 │
│  Para cada serviço executado no período:                        │
│  • evento_id: vínculo com o evento do cronograma                │
│  • quantidade_periodo: volume executado                         │
│  • valor_unitario: congelado do evento                          │
│  • desconto_vaos: dedução conforme critério SINAPI              │
│                                                                 │
│  Memória de cálculo (para cada item):                           │
│  • comprimento, largura, altura, percentual, n_repeticoes       │
│  • quantidade = C × L × H × % × N                              │
│                                                                 │
│  [PUT /api/empresa/medicoes/itens/{item_id}] — editar           │
│  [DELETE /api/empresa/medicoes/itens/{item_id}] — remover       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  PASSO 3 — ANEXAR FOTOS (RN03)                                  │
│                                                                 │
│  POST /api/empresa/medicoes/{medicao_id}/fotos                   │
│                                                                 │
│  • Mesmo processo de inviolabilidade da vistoria:               │
│    hash SHA-256, carimbo do servidor, GPS, EXIF                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  PASSO 4 — CONCLUIR MEDIÇÃO                                     │
│                                                                 │
│  POST /api/empresa/medicoes/{medicao_id}/concluir                │
│                                                                 │
│  • Medição vai DIRETO para APROVADA                             │
│  • Não passa por assinatura da empresa                          │
│  • Não passa por avaliação de outro fiscal                      │
│                                                                 │
│  Sistema recalcula:                                             │
│  • objeto.valor_medido (soma de todas APROVADAS)                │
│  • objeto.saldo_a_medir = valor_contrato - valor_medido         │
│  • objeto.percentual_executado                                  │
│                                                                 │
│  ⚠️  A medição fiscal NÃO passa pelo fluxo de assinatura da     │
│     empresa nem por avaliação de outro fiscal — vai direto.     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  PASSO 5 — VISUALIZAR BOLETIM                                   │
│                                                                 │
│  GET /api/empresa/medicoes/{medicao_id}/boletim                  │
│                                                                 │
│  Boletim com 7 colunas:                                         │
│  ┌──────────┬──────────┬───────────┬──────────┬────────┐        │
│  │Contratado│ Período  │Acum. Ant. │Acum. At. │ Saldo  │        │
│  │(qtde+R$) │ (qtde)   │ (qtde)    │ (qtde)   │(qtde+R$)│       │
│  ├──────────┼──────────┼───────────┼──────────┼────────┤        │
│  │ % Per.   │ % Acum.  │           │          │        │        │
│  └──────────┴──────────┴───────────┴──────────┴────────┘        │
│                                                                 │
│  O acumulado anterior = soma de medições APROVADAS              │
│  com numero_medicao menor que a atual.                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Fluxo Detalhado — Avaliação de Medição da Empresa (APOIO_N2)

> Atividade **exclusiva do APOIO_N2+**. O APOIO_N1 não avalia medições
> (ver §1.1).

Quando a empresa submete uma medição para avaliação do fiscal.

```
┌─────────────────────────────────────────────────────────────────┐
│  PRÉ-CONDIÇÃO: Empresa já assinou a medição (status ASSINADA).  │
│                                                                 │
│  PASSO 1 — RECEBER MEDIÇÃO                                      │
│                                                                 │
│  GET /api/empresa/objetos/{objeto_id}/medicoes                   │
│  • Filtrar por status = ASSINADA                                │
│  • Identificar medições pendentes de avaliação                  │
│                                                                 │
│  PASSO 2 — ANALISAR MEDIÇÃO                                     │
│                                                                 │
│  GET /api/empresa/medicoes/{medicao_id}                          │
│  GET /api/empresa/medicoes/{medicao_id}/boletim                  │
│                                                                 │
│  Revisar criteriosamente os documentos e registros:             │
│  • Planilha de medição × planilha orçamentária contratada       │
│  • Livro da obra (diário de obra / RDO do período)              │
│  • Certidões da empresa (regularidade fiscal e trabalhista)     │
│  • Quantidades lançadas × previstas no cronograma               │
│  • Descontos de vãos aplicados corretamente?                    │
│  • Memória de cálculo confere com as dimensões?                 │
│  • Fotos comprovam a execução de cada item?                     │
│  • ART/RRT ativa para o objeto?                                 │
│                                                                 │
│  PASSO 3 — DECIDIR                                              │
│                                                                 │
│  POST /api/empresa/medicoes/{medicao_id}/avaliar                 │
│                                                                 │
│  OPÇÃO A — APROVAR TOTALMENTE:                                  │
│  • Status → APROVADA                                            │
│  • Atualiza financeiro do objeto                                │
│                                                                 │
│  OPÇÃO B — APROVAR PARCIALMENTE (RF23):                         │
│  • Define quantidade_aprovada < quantidade_periodo por item     │
│  • Apenas a quantidade aprovada entra no acumulado              │
│  • Status → APROVADA                                            │
│                                                                 │
│  OPÇÃO C — REPROVAR (RN24):                                     │
│  • Status → REPROVADA                                           │
│  • Registra observacao_fiscal com a justificativa               │
│  • Empresa pode corrigir e reenviar                             │
│                                                                 │
│  REGRA DE ALÇADA (RN08):                                        │
│  • Se valor líquido > ALCADA_APROVACAO_PADRAO:                  │
│    Status → AGUARDANDO_CHEFE (não vai direto para APROVADA)    │
│  • COORDENADOR precisa aprovar via:                             │
│    POST /api/empresa/medicoes/{id}/aprovar-chefe                │
│                                                                 │
│  ⚠️  APOIO_N1 e APOIO_N2 NÃO podem executar aprovar-chefe.      │
│     Apenas o COORDENADOR tem essa permissão.                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PASSO 4 — PÓS-AVALIAÇÃO                                        │
│                                                                 │
│  Se APROVADA:                                                   │
│  • Financeiro do objeto atualizado automaticamente              │
│  • Boletim disponível para exportação                           │
│  • Curva S reflete o novo realizado                             │
│                                                                 │
│  Se REPROVADA:                                                  │
│  • Empresa é notificada                                         │
│  • Empresa corrige e reenvia (nova assinatura)                  │
│                                                                 │
│  Se AGUARDANDO_CHEFE:                                           │
│  • COORDENADOR é notificado                                     │
│  • COORDENADOR revisa e aprova/reprova                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Comparativo Rápido — APOIO_N1 × APOIO_N2

| Funcionalidade | APOIO_N1 | APOIO_N2 |
|---------------|----------|----------|
| Criar/editar Objetos | Sim | Sim |
| Gerenciar Cronograma (metas/submetas/eventos) | Sim | Sim |
| Editar Contratos | Sim | Sim |
| **Criar Contratos** | **Não** | **Sim** |
| **Criar medição como Fiscal** | **Não** | **Sim** |
| **Concluir medição Fiscal (aprovação direta)** | **Não** | **Sim** |
| **Avaliar medição da Empresa** | **Não** | **Sim** |
| **Diário de Obras (acessar/registrar)** | **Não** | **Sim** |
| Realizar Vistorias (check-in, checklist, fotos) | Sim | Sim |
| Visualizar Curva S, Relatórios, Dashboard Mapa | Sim | Sim |
| Gerenciar ART/RRT | Sim | Sim |
| Exportar/consultar documentos (boletim, memória, RDO) | Sim | Sim |
| **Criar/Excluir Tarefas (Kanban)** | **Não** | **Sim** |
| **Visualizar Alertas** | **Não** | **Sim** |
| **Resolver Alertas** | **Não** | **Sim** |
| **Criar/Editar Empresas** | **Não** | **Sim** |
| **Visualizar Delegações** | **Não** | **Sim** |
| **IA — Analisar Diários** | **Não** | **Sim** |
| Aprovar como Chefe (alçada) | Não | Não |
| Gerar Alertas, Delegar Alertas | Não | Não |
| Dashboard Executivo | Não | Não |
| Excluir Objeto/Item | Não | Não |
| Gerenciar usuários (criar/editar) | Não | Não |

---

## 8. Cenários Típicos de Uso

### 8.1 Cenário APOIO_N1 — Estruturar Novo Objeto

```
1. COORDENADOR informa: "Contrato 045/2025 foi criado. Cadastrar objetos."
2. APOIO_N1 acessa /objetos/nova
3. Cria objeto "Construção da Escola Municipal Y"
4. Cadastra 45 itens (serviços e materiais da planilha licitatória)
5. Estrutura cronograma:
   - 7 Metas (etapas macro)
   - 12 Submetas (distribuição mensal)
   - 89 Eventos (serviços detalhados por mês)
6. Cadastra ART do engenheiro responsável
7. COORDENADOR revisa e aprova a estrutura
8. O objeto está pronto para início das medições
```

### 8.2 Cenário APOIO_N1 — Vistoria de Rotina

```
1. APOIO_N1 recebe tarefa: "Vistoriar Escola Municipal Y esta semana"
2. Vai ao canteiro de obras com app mobile
3. Faz check-in (GPS valida que está dentro do raio de 200m)
4. App carrega checklist com 12 itens da medição do mês
5. Confere cada item fisicamente:
   - 10 itens CONFORME
   - 2 itens NÃO CONFORME (alvenaria com desvio, falta de material)
6. Tira 15 fotos georreferenciadas
7. Finaliza vistoria como NÃO CONFORME com observações
8. Registra pendência GRAVE sobre a alvenaria (prazo 7 dias)
9. Sistema notifica empresa e equipe de apoio
```

### 8.3 Cenário APOIO_N2 — Gestão Semanal

```
1. APOIO_N2 acessa central de alertas:
   - 2 alertas ART_VENCENDO (renovar em 15 dias)
   - 1 alerta SEM_VISTORIA (objeto X está há 45 dias sem vistoria)
   - 3 alertas ATRASO_PREDITIVO (Curva S indica atraso)
2. Cria tarefas no Kanban:
   - "Renovar ART da Escola Y" → responsável: APOIO_N1, prazo: 10 dias
   - "Agendar vistoria no objeto X" → responsável: APOIO_N1, urgente
   - "Revisar cronograma da Creche Z" → responsável: APOIO_N1
3. Cadastra nova empresa vencedora de licitação
4. Cria contrato para a nova licitação
5. Usa IA para analisar diários dos últimos 30 dias do objeto Y
6. Resolve alerta de documento vencido (após upload da nova licença)
```

### 8.4 Cenário APOIO_N2 — Medição Fiscal

```
1. APOIO_N2 vai a campo na Escola Y para medir o mês 3
2. Cria medição fiscal no sistema
3. Lança 18 itens com quantidades aferidas em campo
4. Registra memória de cálculo de cada item (dimensões reais)
5. Aplica desconto de vãos na alvenaria (conforme SINAPI)
6. Sistema alerta: 2 itens acima do previsto (amarelo)
7. Anexa 22 fotos comprovando a execução
8. Conclui a medição → status APROVADA direto
9. Sistema atualiza valor_medido e saldo_a_medir do objeto
10. Exporta boletim em PDF para arquivar no processo
```

---

## 9. Resumo de Endpoints por Perfil

### 9.1 APOIO_N1 — Endpoints Acessíveis

| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/api/objetos` | Listar objetos |
| POST | `/api/objetos` | Criar objeto |
| GET | `/api/objetos/{id}` | Detalhar objeto |
| PUT | `/api/objetos/{id}` | Editar objeto |
| GET | `/api/objetos/{id}/itens` | Listar itens |
| POST | `/api/objetos/{id}/itens` | Criar item |
| PUT | `/api/objetos/itens/{id}` | Editar item |
| GET | `/api/contratos` | Listar contratos |
| PUT | `/api/contratos/{id}` | Editar contrato |
| GET/POST | `/api/cronograma/objetos/{id}/metas` | Gerenciar metas |
| POST | `/api/cronograma/metas/{id}/submetas` | Criar submetas |
| POST | `/api/cronograma/submetas/{id}/eventos` | Criar eventos |
| PUT/DELETE | `/api/cronograma/eventos/{id}` | Editar/remover eventos |
| POST | `/api/vistorias/checkin` | Check-in |
| GET | `/api/vistorias/{id}/checklist` | Ver checklist |
| PATCH | `/api/vistorias/checklist/{id}` | Atestar item |
| POST | `/api/vistorias/{id}/fotos` | Upload foto |
| POST | `/api/vistorias/{id}/finalizar` | Finalizar vistoria |
| POST | `/api/vistorias/{id}/pendencias` | Registrar pendência |
| GET | `/api/vistorias/objetos/{id}/historico` | Histórico do objeto |
| GET | `/api/curva-s/objetos/{id}` | Curva S |
| GET | `/api/relatorios/*` | Relatórios |
| GET | `/api/dashboard/mapa` | Mapa de calor |
| POST/DELETE | `/api/art-rrt` | Gerenciar ART/RRT |
| GET | `/api/tarefas` | Ver tarefas |
| GET | `/api/empresas` | Listar empresas |
| GET | `/api/documentos-contratuais/*` | Ver documentos |
| GET | `/api/documentos/medicoes/*` | Exportar documentos |
| GET/PATCH | `/api/notificacoes/*` | Notificações |

### 9.2 APOIO_N2 — Endpoints Adicionais (além dos do N1)

| Método | Endpoint | Uso |
|--------|----------|-----|
| POST | `/api/empresa/objetos/{id}/medicoes/fiscal` | **Criar medição fiscal** |
| POST | `/api/empresa/medicoes/{id}/concluir` | **Concluir medição fiscal** |
| POST | `/api/empresa/medicoes/{id}/avaliar` | **Avaliar medição da empresa** |
| GET | `/api/empresa/medicoes/{id}/boletim` | **Visualizar boletim** |
| GET/POST/PUT | Diário, Itens, Fotos da medição | **Gerenciar medições/diário** |
| POST | `/api/contratos` | **Criar contrato** |
| POST | `/api/tarefas` | **Criar tarefa** |
| DELETE | `/api/tarefas/{id}` | **Excluir tarefa** |
| GET | `/api/alertas` | **Listar alertas** |
| PATCH | `/api/alertas/{id}/resolver` | **Resolver alerta** |
| POST | `/api/empresas` | **Criar empresa** |
| PATCH | `/api/empresas/{id}` | **Editar empresa** |
| GET | `/api/delegacoes` | **Ver delegações** |
| POST | `/api/ia/objetos/{id}/analisar-diarios` | **IA — analisar diários** |

---

*Documento gerado com base no modelo de domínio, RBAC e endpoints do SIN-Obras.
Serve como referência para treinamento de usuários e implementação de controles
de acesso no frontend e backend.*
