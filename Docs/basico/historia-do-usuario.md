# Documento Estruturado – Concepção do Sistema SIN-Obras

**Organização:** Secretaria de Estado da Infraestrutura do Rio Grande do Norte (SIN-RN)
**Demandante:** Coordenadoria de Obras e Serviços (COS)
**Desenvolvimento:** Assessoria de Informática (Analista: Diego André de Lima)
**Versão:** 2.0 — Junho/2026

---

## 1. Propósito do Documento

Este documento apresenta a concepção do sistema **SIN-Obras**, contendo:

- Contexto geral e fundamentação legal do projeto
- Histórias dos usuários detalhadas por persona (Fiscal de Obras, Apoio, Chefe de Setor, Empresa)
- Cenários de uso narrativos (dia típico de cada perfil)
- Fluxo de valor do sistema
- Diretrizes para orientar o desenvolvimento técnico

---

## 2. Contexto do Sistema

O sistema será desenvolvido para atender especificamente às demandas da **Coordenadoria de Obras e Serviços (COS)** da SIN-RN.

**Fundamentação Institucional:** A SIN-RN é o órgão responsável por planejar, coordenar e executar as políticas públicas de infraestrutura, além de controlar a aplicação de recursos (federais e estaduais) nos setores de obras. Como a secretaria tem o dever legal de projetar, licitar, executar, fiscalizar e receber obras e serviços de engenharia, além de realizar vistorias e perícias, o volume de dados e processos é altíssimo.

**O Problema a Resolver:** Atualmente, a fiscalização, o acompanhamento de contratos, medições e vistorias da COS sofrem com a descentralização de informações e processos manuais. O sistema visa eliminar o abismo entre o campo (canteiro de obras) e o escritório, garantindo rastreabilidade, integridade das informações e conformidade legal com as exigências do TCE-RN, CGU, LGPD e da Plataforma +Brasil.

---

## 3. Cenário Geral

O sistema é utilizado por quatro perfis distintos em papéis complementares:

| Perfil | Ambiente Principal | Papel no Fluxo |
|:---|:---|:---|
| **Empresa Executora** | Portal Web (externo) | Declara avanço, registra Diário de Obras e submete medições |
| **Fiscal de Obras** | App Mobile (campo) | Valida in loco o que a empresa declarou, com fotos e checklist |
| **Engenheiro de Apoio** | Web (escritório) | Analisa os dados, aprova medições e gere cadastros técnicos |
| **Chefe de Setor (COS)** | Web (gestão) | Monitora o desempenho global, recebe alertas e aprova decisões estratégicas |

---

## 4. Histórias dos Usuários

---

### 4.1. Fiscal de Obras

**Quem é:** Engenheiro civil concursado, responsável legal pela fiscalização em campo de um conjunto de contratos. Passa boa parte do tempo em deslocamento para municípios do interior. Seu maior desafio é registrar vistorias de forma que sejam juridicamente válidas, mesmo em áreas sem sinal de internet, e transmitir rapidamente as informações ao apoio para não travar o ciclo de medição e pagamento.

---

**US-F01 — Check-in Georreferenciado**
> Como **fiscal de obras**, quero **registrar minha chegada ao canteiro via GPS com validação automática de proximidade**, para **comprovar legalmente minha presença no local sem depender de papéis ou assinaturas físicas**.

**Critérios de Aceitação:**
- O app detecta automaticamente a coordenada do fiscal e valida se está dentro do raio configurado da obra (geofencing).
- Se o fiscal estiver fora do raio, o sistema exibe aviso e solicita justificativa antes de liberar o check-in manual.
- O registro de entrada inclui: coordenada GPS, precisão do sinal, data/hora do servidor (não do dispositivo), e foto de reconhecimento do canteiro.

---

**US-F02 — Checklist Dinâmico de Vistoria**
> Como **fiscal de obras**, quero **receber automaticamente no app apenas as etapas que a empresa declarou como executadas**, para **focar minha vistoria no que realmente precisa ser validado, sem consultar planilhas ou e-mails**.

**Critérios de Aceitação:**
- O checklist é gerado automaticamente a partir do Diário de Obras e das medições submetidas pela empresa.
- Cada item do checklist tem: descrição da etapa, percentual declarado pela empresa, campo para o fiscal atestar (Conforme / Não Conforme / Parcialmente) e campo para fotos obrigatórias.
- O fiscal não pode marcar "Conforme" sem ao menos uma foto vinculada ao item.

---

**US-F03 — Câmera com Metadados Invioláveis**
> Como **fiscal de obras**, quero **tirar fotos diretamente pelo app com carimbo automático de data, hora e localização**, para **garantir que as evidências fotográficas não possam ser questionadas ou adulteradas**.

**Critérios de Aceitação:**
- Fotos só podem ser capturadas pela câmera integrada do app — importação da galeria é bloqueada.
- Cada foto recebe metadados: latitude, longitude, precisão GPS, timestamp do servidor, hash SHA-256 e identificação do usuário.
- As fotos são armazenadas com os metadados protegidos e exibem um rodapé visual com as informações na visualização da vistoria.

---

**US-F04 — Modo Offline**
> Como **fiscal de obras**, quero **preencher vistorias completas mesmo sem sinal de internet em áreas remotas**, para **não interromper meu trabalho de campo por limitações de conectividade**.

**Critérios de Aceitação:**
- O app sincroniza as obras, checklists e dados necessários antes da viagem (download offline).
- Ao recuperar conexão, o sistema sincroniza automaticamente as vistorias, fotos e dados preenchidos offline.
- Em caso de conflito de dados, o sistema sinaliza ao Apoio para resolução manual.

---

**US-F05 — Registro de Pendências e Notificações à Empresa**
> Como **fiscal de obras**, quero **registrar pendências e não conformidades diretamente no app e notificar automaticamente a empresa e o apoio**, para **agilizar a resolução de problemas sem depender de e-mails avulsos**.

**Critérios de Aceitação:**
- O fiscal pode criar pendências vinculadas a itens do checklist ou à obra de forma geral.
- Cada pendência tem: descrição, prazo para resolução sugerido, foto obrigatória e nível de gravidade (Leve / Grave / Crítico).
- A empresa e o Engenheiro de Apoio recebem notificação imediata (push e e-mail) com o detalhamento da pendência.

---

**US-F06 — Histórico da Obra no App**
> Como **fiscal de obras**, quero **consultar o histórico de vistorias anteriores, medições aprovadas e pendências abertas de uma obra diretamente no celular**, para **me preparar para a vistoria e verificar o cumprimento de exigências da visita anterior**.

**Critérios de Aceitação:**
- O app exibe linha do tempo com todas as vistorias, medições e eventos da obra.
- Pendências da visita anterior são destacadas no início do checklist atual.
- O fiscal pode visualizar as fotos e atestados anteriores para comparação.

---

### 4.2. Engenheiro de Apoio

**Quem é:** Engenheiro civil servidor da SIN-RN que atua no escritório da COS como gestor técnico de contratos. É o elo central do sistema: recebe os dados do campo (fiscal) e do portal (empresa), analisa consistências, aprova ou reprova medições e mantém o cadastro técnico das obras atualizado. Sua maior dificuldade é conciliar dados que chegam por canais distintos (e-mail, WhatsApp, planilhas) em tempo hábil para não atrasar o ciclo de pagamento.

---

**US-A01 — Painel de Obras e Contratos**
> Como **engenheiro de apoio**, quero **visualizar em um painel único todas as obras sob minha responsabilidade com seus status, pendências e próximas vistorias**, para **priorizar meu trabalho diário sem depender de planilhas isoladas**.

**Critérios de Aceitação:**
- O painel exibe: obras agrupadas por status (Em Andamento, Paralisada, Concluída), indicadores de saúde (Verde/Amarelo/Vermelho), prazo do contrato e percentual executado.
- Alertas de obras com medições pendentes de aprovação são destacados no topo.
- O apoio pode filtrar por órgão demandante, município, empresa executora ou fiscal responsável.

---

**US-A02 — Aprovação de Medições**
> Como **engenheiro de apoio**, quero **analisar as medições submetidas pela empresa lado a lado com o laudo de vistoria do fiscal e as fotos georreferenciadas**, para **aprovar ou reprovar medições com fundamentação técnica e rastreabilidade total**.

**Critérios de Aceitação:**
- A interface de aprovação exibe em tela dividida: o que a empresa declarou vs. o que o fiscal atestou.
- O apoio pode aprovar parcialmente uma medição (ex: aprovar 80% do item declarado).
- Toda aprovação ou reprovação gera registro imutável de auditoria com justificativa obrigatória.
- Após aprovação do apoio, a medição entra na fila de aprovação financeira do Chefe de Setor.

---

**US-A03 — Gestão de ART/RRT**
> Como **engenheiro de apoio**, quero **cadastrar e controlar as ARTs/RRTs dos responsáveis técnicos das empresas**, para **garantir que nenhuma medição seja aprovada sem o vínculo de responsabilidade técnica válida e ativa**.

**Critérios de Aceitação:**
- O sistema bloqueia automaticamente a submissão de medições pela empresa se a ART estiver vencida ou não vinculada à submeta correspondente.
- O apoio recebe alerta com antecedência configurável (ex: 30 dias antes do vencimento) para solicitar renovação.
- Upload de ART em PDF com validação de validade e vínculo à obra.

---

**US-A04 — Curva S e Análise Preditiva**
> Como **engenheiro de apoio**, quero **visualizar a Curva S de cada obra comparando o cronograma planejado com a execução real e a tendência preditiva**, para **identificar antecipadamente riscos de atraso e acionar medidas preventivas**.

**Critérios de Aceitação:**
- O gráfico exibe três séries: Planejado (baseline), Realizado (dados de medição aprovada) e Preditivo (projeção por algoritmo de tendência).
- Se a curva preditiva indicar extrapolação do prazo contratual, a obra muda automaticamente para Amarelo no Mapa de Calor.
- O apoio pode exportar o gráfico em PDF para compor relatórios de prestação de contas.

---

**US-A05 — Quadro de Tarefas (Kanban)**
> Como **engenheiro de apoio**, quero **organizar minhas pendências administrativas (processos licitatórios, tramitações, solicitações) em um quadro visual de tarefas**, para **não perder prazos burocráticos entre o volume de obras simultâneas**.

**Critérios de Aceitação:**
- O Kanban tem colunas configuráveis (ex: A Fazer, Em Andamento, Aguardando, Concluído).
- Tarefas podem ser vinculadas a uma obra, contrato ou processo SEI específico.
- Tarefas com prazo vencido são destacadas em vermelho.
- O Chefe de Setor pode visualizar o quadro de toda a equipe.

---

**US-A06 — Assistente de IA (Análise de Riscos)**
> Como **engenheiro de apoio**, quero **receber alertas gerados por IA sobre inconsistências e riscos identificados nos Diários de Obras e relatórios de campo**, para **detectar problemas antes que se tornem paralisações ou irregularidades**.

**Critérios de Aceitação:**
- A IA varre textos do Diário de Obras e compara com dados históricos da obra para identificar padrões de risco (ex: menção repetida de chuvas como justificativa para atraso, divergência entre equipe declarada e equipe observada em campo).
- Os alertas são apresentados em linguagem simples com o trecho do diário que gerou o alerta.
- O apoio pode marcar alertas como "Ciente" ou "Falso Positivo" para calibrar o modelo.

---

**US-A07 — Gestão de Registros Contratuais**
> Como **engenheiro de apoio**, quero **cadastrar e consultar os eventos contratuais (aditivos de prazo, paralisações, readequações, apostilamentos, reajustes e termos de recebimento)** de cada obra, para **manter o histórico completo do contrato acessível e auditável**.

**Critérios de Aceitação:**
- Cada evento contratual tem: tipo, data, descrição, documento comprobatório (upload em PDF) e responsável pelo cadastro.
- O sistema calcula automaticamente o impacto dos aditivos de prazo no novo prazo contratual.
- Notificações extrajudiciais e portarias são vinculadas à obra com rastreamento de resposta.

---

**US-A08 — Calculadora de Engenharia Integrada**
> Como **engenheiro de apoio**, quero **realizar cálculos de cubicagem, conversões de unidades e estimativas de serviços diretamente no sistema**, para **não precisar alternar entre o sistema e planilhas externas durante a análise de medições**.

**Critérios de Aceitação:**
- A calculadora é acessada como painel lateral sem sair da tela atual.
- Suporta: cubicagem de estruturas (viga, laje, pilar), conversões de unidades (m², m³, ton, km), cálculo de BDI e verificações de reajuste INCC.
- Os resultados podem ser salvos como nota vinculada ao processo em análise.

---

### 4.3. Chefe de Setor (Coordenador COS)

**Quem é:** Coordenador técnico da Coordenadoria de Obras e Serviços (COS). Gerencia simultaneamente uma equipe de engenheiros de apoio e fiscais, dezenas de contratos ativos e precisa prestar contas ao Secretário e a órgãos de controle (TCE-RN, CGU). Seu maior desafio é ter visão consolidada do portfólio de obras sem se perder nos detalhes operacionais, tomando decisões estratégicas com base em dados confiáveis.

---

**US-C01 — Dashboard Executivo com Mapa de Calor**
> Como **chefe de setor**, quero **visualizar um mapa do Estado com todas as obras georreferenciadas e codificadas por status de saúde (Verde, Amarelo, Vermelho)**, para **identificar rapidamente onde estão as obras críticas e priorizar atenção da equipe**.

**Critérios de Aceitação:**
- O mapa exibe clusters de obras por município, com cor refletindo o status mais crítico do cluster.
- Ao clicar em um município ou obra, abre painel lateral com resumo: empresa, fiscal, prazo, percentual executado, última vistoria e pendências abertas.
- Filtros por órgão demandante, tipo de obra, fonte de recurso (federal/estadual) e período.

---

**US-C02 — Painel de Alertas e Pendências Críticas**
> Como **chefe de setor**, quero **receber alertas automáticos classificados por prioridade (prazo de contrato, pagamentos atrasados, obras sem vistoria há X dias, notificações extrajudiciais pendentes)**, para **agir preventivamente antes que problemas virem irregularidades formais**.

**Critérios de Aceitação:**
- Alertas são enviados via notificação no sistema, e-mail e (opcionalmente) WhatsApp.
- Cada alerta tem: obra vinculada, descrição do problema, prazo para ação recomendado e responsável sugerido.
- O chefe pode delegar um alerta para um engenheiro de apoio com prazo e anotação.

---

**US-C03 — Monitoramento da Equipe**
> Como **chefe de setor**, quero **acompanhar o desempenho e a carga de trabalho da minha equipe (fiscais e apoio)**, para **distribuir obras de forma equilibrada e identificar gargalos operacionais**.

**Critérios de Aceitação:**
- Painel da equipe exibe: número de obras por servidor, vistorias realizadas no mês, medições pendentes de aprovação e tarefas em aberto.
- Histórico de visitas por fiscal (frequência, obras visitadas, tempo médio de vistoria).
- Possibilidade de reatribuir a responsabilidade de um contrato entre servidores diretamente no sistema.

---

**US-C04 — Aprovação de Medições de Alto Valor**
> Como **chefe de setor**, quero **receber para aprovação final as medições que ultrapassem um valor-limite configurável**, para **exercer controle adicional sobre os pagamentos de maior impacto financeiro sem sobrecarregar minha rotina com medições menores**.

**Critérios de Aceitação:**
- O limite de valor para aprovação do chefe é configurável (ex: medições acima de R$ 100.000,00).
- A medição só segue para pagamento após aprovação do apoio E do chefe (quando aplicável).
- O chefe visualiza o resumo técnico da medição com o laudo do fiscal e o parecer do apoio antes de decidir.

---

**US-C05 — Relatórios Gerenciais e Exportação**
> Como **chefe de setor**, quero **gerar relatórios consolidados do portfólio de obras (financeiro, físico e de conformidade) com filtros customizáveis e exportá-los em PDF e Excel**, para **atender as demandas de prestação de contas de convênios, financiamentos e órgãos de controle**.

**Critérios de Aceitação:**
- Relatórios disponíveis: Acompanhamento Financeiro por Obra, Cronograma Físico vs. Realizado, Relatório de Vistorias por Período, Obras por Situação e Mapa de Riscos.
- Filtros: período, município, órgão demandante, empresa, fiscal, fonte de recurso.
- Exportação em PDF (formatado para impressão) e XLSX (dados brutos para análise).
- Relatórios agendáveis (ex: relatório mensal automático enviado por e-mail no dia 5 de cada mês).

---

**US-C06 — Gestão de Usuários e Perfis**
> Como **chefe de setor**, quero **cadastrar, ativar e desativar usuários do sistema (servidores e empresas)** e **definir quais obras cada fiscal ou engenheiro de apoio é responsável**, para **garantir que o controle de acesso reflita a estrutura real da equipe**.

**Critérios de Aceitação:**
- O chefe pode criar matrículas para novos servidores e vincular ao perfil correto (Fiscal / Apoio / Chefe).
- Desativação de usuário revoga imediatamente o acesso sem perder o histórico de registros do servidor.
- Vinculação de fiscal e apoio a contratos específicos com registro de data de início e fim da responsabilidade.

---

### 4.4. Empresa Executora

**Quem é:** Representante (geralmente o engenheiro responsável técnico ou o administrativo contratado) de uma construtora ou empresa de serviços que venceu um processo licitatório com a SIN-RN. Acessa o sistema exclusivamente via Portal Web, com visão restrita ao(s) seu(s) contrato(s). Seu maior desafio é registrar o avanço da obra de forma padronizada, cumprir as exigências documentais do contrato público e acompanhar o status das medições sem precisar telefonar para a secretaria.

---

**US-E01 — Diário de Obras Digital**
> Como **empresa executora**, quero **registrar diariamente as atividades da obra (equipe, equipamentos, clima, serviços executados e ocorrências)**, para **cumprir a obrigação contratual do Diário de Obras de forma prática e gerar evidências automáticas para suporte às medições**.

**Critérios de Aceitação:**
- O Diário de Obras é preenchido em formulário estruturado: data, clima (manhã/tarde), número de funcionários por função, equipamentos em uso, serviços executados (por evento/submeta) e ocorrências/justificativas.
- O sistema alerta sobre dias sem registro quando o contrato está "Em Andamento".
- O conteúdo do Diário alimenta automaticamente o checklist de vistoria do fiscal.

---

**US-E02 — Submissão de Medições por Eventos**
> Como **empresa executora**, quero **declarar o avanço físico de cada evento/submeta do cronograma e submeter a medição com assinatura eletrônica do responsável técnico**, para **solicitar o pagamento correspondente de forma formal, padronizada e rastreável**.

**Critérios de Aceitação:**
- A medição é estruturada por Metas → Submetas → Eventos, espelhando o Cronograma Físico-Financeiro do contrato.
- A empresa pode salvar rascunhos antes de assinar.
- A assinatura eletrônica exige a vinculação de uma ART/RRT ativa para aquela submeta.
- Após assinatura, a medição entra na fila de vistoria do fiscal e não pode mais ser editada.

---

**US-E03 — Acompanhamento do Status da Medição**
> Como **empresa executora**, quero **acompanhar em tempo real em que etapa do processo cada medição se encontra**, para **saber se há pendências que precisam de ação minha ou se estou aguardando a secretaria, sem precisar fazer contato telefônico**.

**Critérios de Aceitação:**
- Linha do tempo da medição: Submetida → Aguardando Vistoria → Em Análise (Apoio) → Aprovada / Reprovada → Em Liquidação → Paga.
- Notificação por e-mail (e no portal) a cada mudança de status.
- Em caso de reprovação, a justificativa do apoio e as fotos do fiscal são exibidas para a empresa entender a razão.

---

**US-E04 — Gestão de Documentos Contratuais**
> Como **empresa executora**, quero **fazer upload e gerenciar os documentos obrigatórios do contrato (ART, plantas, licenças, garantias, seguros)**, para **ter um repositório centralizado e receber alertas antes de documentos vencerem**.

**Critérios de Aceitação:**
- O sistema lista os documentos obrigatórios por tipo de contrato e sinaliza quais estão em dia, próximos do vencimento ou vencidos.
- Upload de documentos em PDF com controle de versão (novo documento substitui o anterior, mas o histórico é preservado).
- Alerta automático para a empresa e para o apoio 30 dias antes do vencimento de ART, seguro de obra ou garantia contratual.

---

**US-E05 — Registro de Paralisações e Solicitações**
> Como **empresa executora**, quero **notificar formalmente a SIN-RN sobre paralisações, solicitações de prazo e ocorrências relevantes diretamente pelo portal**, para **formalizar comunicações que anteriormente eram feitas por e-mail informal ou ofício físico, garantindo rastreabilidade**.

**Critérios de Aceitação:**
- O portal permite registrar: Paralisação (com motivo e data estimada de retorno), Solicitação de Aditivo de Prazo (com justificativa e documentos de suporte) e Comunicado Geral.
- O Engenheiro de Apoio e o Chefe de Setor são notificados imediatamente.
- O status da solicitação (Recebida, Em Análise, Deferida, Indeferida) é visível para a empresa.

---

## 5. Cenários Narrativos (Dia Típico)

### 5.1. Dia de Vistoria — Rafael (Fiscal de Obras)

Rafael sai de Natal às 6h para visitar uma escola em construção em Currais Novos. Antes de sair, abre o app e verifica que a empresa registrou no Diário que finalizou a execução das vigas do 1º pavimento (40% da Meta 2). O checklist de hoje já foi gerado automaticamente com 6 itens para validar.

Ao chegar na obra às 9h, abre o app e pressiona "Iniciar Vistoria". O GPS confirma que ele está a 12 metros da obra — dentro do raio de 50m — e o check-in é registrado. Rafael percorre a obra seguindo o checklist, tira as fotos obrigatórias em cada item (o app bloqueia importação da galeria), registra que 2 dos 6 itens estão apenas parcialmente executados e cria uma pendência de "Nível Grave" para a ausência de guarda-corpo em trecho das vigas.

De volta ao carro, com 1 barra de sinal, o app sincroniza tudo automaticamente. Rafael recebe confirmação de envio às 11h45. A empresa e o apoio são notificados da pendência imediatamente.

---

### 5.2. Análise de Medição — Carla (Engenheiro de Apoio)

Carla chega ao escritório e abre seu painel: 3 medições aguardando análise e 2 alertas da IA sobre inconsistências no Diário de Obras de uma pavimentação. Ela abre a medição da escola de Currais Novos.

Na tela dividida, vê à esquerda o que a empresa declarou (40% da Meta 2, R$ 48.000,00) e à direita o laudo do Rafael com as fotos georreferenciadas. Os 2 itens parcialmente executados são destacados em amarelo. Ela aprova 85% do valor da medição, registra justificativa técnica e encaminha para o Chefe de Setor, pois o valor aprovado (R$ 40.800,00) fica abaixo do limite de R$ 100.000,00 — segue direto para liquidação.

Em seguida, analisa o alerta da IA: "Diário de Obras menciona 'chuva intensa' em 12 dos últimos 15 dias úteis, mas a estação meteorológica de Mossoró registra apenas 3 dias com precipitação acima de 5mm no mesmo período." Carla abre a obra, cria uma pendência formal e notifica a empresa para justificar a divergência.

---

### 5.3. Visão do Portfólio — Geraldo (Chefe de Setor)

Geraldo abre o sistema às 8h. O mapa do RN mostra 4 obras em vermelho — todas têm previsão preditiva de atraso acima de 45 dias. Ele clica na obra mais crítica (reforma de hospital em Mossoró) e vê que não há vistoria há 37 dias (SLA de 30 dias excedido). Delega ao sistema o envio de alerta ao fiscal responsável com prazo de 5 dias para visita.

No painel de alertas, 2 ARTs vencem em 22 dias — ele encaminha para o apoio responsável resolver. Às 10h, recebe notificação de medição acima de R$ 500.000,00 aguardando aprovação. Abre, revisa o parecer do apoio, as fotos do fiscal e aprova. Às 11h, exporta o relatório mensal de acompanhamento para enviar ao Secretário.

---

### 5.4. Registro Diário — Construtora (Empresa Executora)

O engenheiro da construtora abre o Portal às 17h para registrar o Diário de Obras do dia. Preenche: 18 funcionários (pedreiros, serventes e encarregado), 1 betoneira e 1 caminhão-pipa; clima seco durante todo o dia; serviços executados: concretagem de pilares do 2º pavimento (Meta 3, Evento 2, avanço de 25%). Salva.

Ao final da semana, abre a tela de medição, seleciona os eventos com progresso acumulado suficiente, revisa os valores calculados automaticamente e salva como rascunho. Na segunda-feira, o Responsável Técnico vincula a ART ativa, assina eletronicamente e envia. A linha do tempo da medição mostra "Aguardando Vistoria". Três dias depois, recebe notificação: vistoria realizada, medição em análise pelo apoio.

---

## 6. Fluxo de Valor (Ciclo de Medição e Pagamento)

```
[EMPRESA]                [FISCAL]              [APOIO]            [CHEFE]
    |                       |                     |                  |
Registra Diário             |                     |                  |
de Obras diário             |                     |                  |
    |                       |                     |                  |
Declara avanço e            |                     |                  |
submete medição  ──────────►|                     |                  |
    |           (checklist  |                     |                  |
    |            gerado)    |                     |                  |
    |                    Realiza check-in         |                  |
    |                    georreferenciado         |                  |
    |                    Preenche checklist       |                  |
    |                    Tira fotos invioláveis   |                  |
    |                    Atesta / registra        |                  |
    |                    pendências    ──────────►|                  |
    |                       |          Analisa    |                  |
    |◄──────────────────────|          medição    |                  |
    | (notificação de       |          (lado a    |                  |
    |  pendência)           |           lado)     |                  |
    |                       |          Aprova     |                  |
    |                       |          parcial/   |                  |
    |                       |          total  ───►| (valor > limite) |
    |                       |          ou         | Aprova final     |
    |                       |          reprova    |                  |
    |◄──────────────────────|──────────────────────◄─────────────────|
    | (status atualizado)   |                     |                  |
    |                       |                     |         Segue para
    |                       |                     |         liquidação/pagamento
```

---

## 7. Considerações Técnicas

- **Integrações:** Google Maps / Mapbox para georreferenciamento; PostGIS para geofencing e mapa de calor; API de LLM (Anthropic Claude ou OpenAI) para o assistente de IA; serviço de e-mail transacional e push notifications.
- **Armazenamento:** Arquitetura em nuvem escalável (AWS S3 ou Datacenter Estadual) para fotos em alta resolução, laudos e documentos contratuais, com política de retenção e criptografia.
- **Segurança e LGPD:** Criptografia de ponta a ponta, mascaramento de dados sensíveis, logs de auditoria imutáveis. Toda ação relevante é registrada com: usuário, timestamp, IP, dado anterior e dado novo.
- **Offline-first:** O app mobile deve funcionar sem conexão e sincronizar quando houver rede, priorizando confiabilidade no campo.
