# Documento de Concepção e Requisitos: Sistema SIN-Obras

**Organização:** Secretaria de Estado da Infraestrutura do Rio Grande do Norte (SIN-RN)
**Demandante:** Coordenadoria de Obras e Serviços (COS)
**Desenvolvimento:** Assessoria de Informática
**Identidade Visual:** Diretrizes do Governo do Estado do RN (Verde, Branco e tipografia oficial)
**Versão:** 2.0 — Junho/2026

---

## 1. Visão Geral e Propósito

Este documento consolida a concepção, os requisitos e a arquitetura tecnológica do sistema **SIN-Obras**, integrando um **Portal Web** e um **Aplicativo Mobile** em um único ecossistema operacional.

O objetivo é automatizar o acompanhamento físico e financeiro de obras públicas, assegurar a validade legal das vistorias e introduzir **inteligência preditiva** para evitar paralisações e atrasos, modernizando o fluxo atualmente analógico e superando os moldes da Plataforma +Brasil.

---

## 2. O Problema a ser Resolvido

| Problema Atual | Solução do Sistema |
|:---|:---|
| Informações de campo chegam por e-mail, WhatsApp e planilha | Módulo mobile unificado com checklist e fotos georreferenciadas |
| Fiscal não sabe o que a empresa declarou antes da vistoria | Checklist dinâmico gerado automaticamente pelo Diário de Obras |
| Fotos de vistoria podem ser adulteradas (importadas da galeria) | Câmera exclusiva do app com hash e metadados invioláveis |
| Medições sem rastreabilidade de quem aprovou e por quê | Trilha de auditoria imutável em todas as etapas de aprovação |
| Atrasos percebidos só quando já é tarde demais | Curva S preditiva + Mapa de Calor com alertas automáticos |
| Diário de Obras físico ou por e-mail | Portal digital estruturado com alimentação automática do checklist |
| ART vencida só descoberta na assinatura da medição | Alerta proativo 30 dias antes do vencimento + bloqueio automático |
| Chefe sem visão consolidada do portfólio | Dashboard executivo com mapa georreferenciado e alertas classificados |

---

## 3. Atores do Sistema (Personas e RBAC)

O sistema utiliza *Role-Based Access Control* (RBAC) para segregar dados sensíveis e fluxos de aprovação.
A hierarquia de privilégios é: EMPRESA < FISCAL < APOIO_N1 < APOIO_N2 < COORDENADOR (Chefe de Setor) < SECRETARIO.

| Perfil | Acesso | Escopo de Dados |
|:---|:---|:---|
| **Empresa Executora** | Portal Web (externo) | Somente seu(s) contrato(s) |
| **Fiscal de Obras** | App Mobile + Web | Obras sob sua responsabilidade (delegadas pelo Chefe de Setor) |
| **Apoio Nível 1 (Apoio N1)** | Web (escritório) | Somente obras que ele mesmo cadastrou. Não acompanha medições nem interage com fiscais. |
| **Apoio Nível 2 (Apoio N2)** | Web (escritório) | Todas as obras do setor. Acompanha medições, fiscais, prazos e reporta ao Chefe de Setor. |
| **Chefe de Setor (COORDENADOR)** | Web (gestão) | Visão global de todas as obras da COS. Delega obras para fiscais e apoios. Aprova ações críticas. |
| **Secretário** | Web (read-only) | Dashboard executivo consolidado |

### Fluxo de Delegação
1. **Chefe de Setor** delega obras para **Fiscais** e **Apoio N2**.
2. **Apoio N1** cadastra contratos/obras e envia para validação do **Apoio N2**.
3. **Apoio N2** confere e aceita/devolve cadastros do Apoio N1. Acompanha obras e fiscais, reporta ao Chefe.
4. **Fiscais** executam vistorias em campo, registram pendências e reportam ao Apoio N2 e Chefe.
5. O **Chefe de Setor** define os níveis de acesso de cada servidor (Apoio N1 vs Apoio N2).

---

## 4. Épicos e Módulos do Sistema

### Épico 1 — Gestão de Contratos e Obras (Backoffice Web — Apoio)

- **CRUD de Obras e Contratos:** Cadastro completo com metas, submetas e eventos, espelhando o Cronograma Físico-Financeiro do instrumento licitatório.
- **Gestão de Responsabilidade Técnica:** Vínculo de ART/RRT com validação de vigência e bloqueio automático em medições.
- **Gestão de Eventos Contratuais:** Cadastro de aditivos de prazo, paralisações, readequações, apostilamentos, reajustes, termos de recebimento, notificações extrajudiciais e portarias.
- **Quadro de Tarefas (Kanban):** Gestão visual de pendências, processos licitatórios e tramitações internas, com vínculo a obras e processos SEI.
- **Calculadora de Engenharia:** Painel lateral para cubicagem, conversões, cálculo de BDI e verificações de reajuste INCC.
- **Histórico de Responsabilidade:** Registro de qual fiscal/apoio foi responsável por cada contrato e em que período.

---

### Épico 2 — Portal da Empresa Executora (Web — Externo)

- **Diário de Obras Digital:** Registro diário estruturado de clima, equipe por função, equipamentos, serviços executados por evento e ocorrências. Alerta para dias sem registro com contrato ativo.
- **Medições por Eventos:** Declaração de avanço físico estruturado por Meta → Submeta → Evento, com cálculo automático de valor com base no cronograma físico-financeiro.
- **Rascunho e Assinatura Eletrônica:** Salvamento de rascunhos de medição e assinatura eletrônica pelo Responsável Técnico vinculada à ART ativa.
- **Gestão de Documentos:** Upload de ART, plantas, licenças, garantias e seguros com alerta de vencimento e histórico de versões.
- **Acompanhamento de Status:** Linha do tempo da medição (Submetida → Vistoria → Análise → Aprovada/Reprovada → Liquidação → Paga) com notificações por e-mail e portal.
- **Registro de Paralisações e Solicitações:** Formalização de paralisações, solicitações de aditivo de prazo e comunicados gerais com rastreamento de resposta da SIN-RN.

---

### Épico 3 — Fiscalização Inteligente (App Mobile — Fiscal)

- **Check-in Georreferenciado (Geofencing):** Validação de presença via GPS com raio configurável por obra. Check-in manual com justificativa quando fora do raio.
- **Checklist Dinâmico:** Itens gerados automaticamente com base no que a empresa declarou no Diário de Obras e na medição submetida.
- **Câmera com Metadados Invioláveis:** Fotos capturadas exclusivamente pelo app, com Lat/Long, timestamp do servidor, hash SHA-256 e ID do usuário. Importação da galeria bloqueada.
- **Modo Offline:** Download prévio de obras, checklists e dados necessários. Sincronização automática ao recuperar conexão.
- **Registro de Pendências e Notificações:** Criação de pendências com gravidade (Leve/Grave/Crítico), prazo sugerido, foto obrigatória e notificação automática à empresa e ao apoio.
- **Histórico da Obra no App:** Consulta de vistorias anteriores, medições aprovadas e pendências abertas.
- **Registro de Equipe e Insumos em Campo:** Anotação da equipe observada em campo e dos insumos visíveis para cruzamento com o Diário de Obras da empresa.

---

### Épico 4 — Inteligência, Analytics e Dashboard (Web — Apoio e Chefe)

- **Curva S Preditiva:** Gráfico comparando Planejado (baseline) vs. Realizado vs. Preditivo (projeção de tendência). Mudança automática de status quando a preditiva ultrapassa o prazo contratual.
- **Mapa de Calor do RN:** Visualização georreferenciada com clustering por município, coloração por status de saúde (Verde/Amarelo/Vermelho) e filtros por órgão, fonte de recurso e período.
- **Assistente de IA (LLM):** Análise dos textos do Diário de Obras e relatórios de campo para detecção de inconsistências e riscos ocultos. Alertas em linguagem simples com trecho originador.
- **Painel de Equipe:** Visão do Chefe sobre carga de trabalho, frequência de visitas e produtividade dos fiscais e engenheiros de apoio.
- **Dashboard Executivo:** Indicadores-chave para o Secretário: volume de investimento ativo, distribuição por situação de obra, municípios mais impactados e tendência global de execução.

---

### Épico 5 — Gestão Administrativa e Controle de Acesso (Web — Chefe)

- **Gestão de Usuários:** Criação e desativação de matrículas (servidores) e contas de empresa, com atribuição de perfil e histórico de acessos.
- **Painel do Chefe de Setor:** Visão consolidada de todas as obras do setor, com status, fiscais e apoios vinculados, ações rápidas de delegação.
- **Delegação de Obras:** Vinculação de fiscal e apoio (N1/N2) a obras específicas com registro de período de responsabilidade (data início/fim, função). Controle pelo Chefe de Setor.
- **Fluxo Apoio N1 → Apoio N2 → Chefe:** Cadastro inicial pelo Apoio N1, conferência e validação pelo Apoio N2, acompanhamento e aprovação pelo Chefe de Setor.
- **Atribuição de Contratos:** Vinculação de fiscal e apoio a contratos específicos com registro de período de responsabilidade.
- **Central de Alertas:** Painel consolidado de alertas por prioridade, com delegação para servidores e rastreamento de resolução.
- **Relatórios Gerenciais:** Geração e agendamento de relatórios (PDF e XLSX) de acompanhamento financeiro, cronograma físico, vistorias e conformidade.
- **Aprovação por Alçada:** Configuração de limite de valor para acionamento de aprovação adicional do Chefe de Setor no fluxo de medições.
- **Auditoria de Delegações:** Registro de todas as delegações, revogações e alterações de responsabilidade com usuário, timestamp e justificativa.

---

## 5. Requisitos Funcionais (RF) Consolidados

| ID | Módulo | Perfil | Descrição |
|:---|:---|:---|:---|
| **RF01** | Auth | Todos | Autenticação via matrícula institucional (≥ 5 dígitos) para servidores e CNPJ para empresas executoras. |
| **RF02** | Auth | Todos | Controle de acesso RBAC com 5 perfis distintos (Secretário, Chefe, Apoio, Fiscal, Empresa). |
| **RF03** | Gestão | Apoio | Cadastro de obras com Cronograma Físico-Financeiro estruturado em Metas → Submetas → Eventos. |
| **RF04** | Gestão | Apoio | Cadastro e controle de ART/RRT com alerta de vencimento e bloqueio automático em medições. |
| **RF05** | Gestão | Apoio | Registro de eventos contratuais: aditivos, paralisações, readequações, apostilamentos, reajustes, termos de recebimento e notificações extrajudiciais. |
| **RF06** | Gestão | Apoio | Quadro Kanban de tarefas com vínculo a obras e processos, colunas configuráveis e alerta de prazo. |
| **RF07** | Gestão | Apoio | Calculadora de engenharia integrada (cubicagem, BDI, conversões, reajuste INCC) com notas vinculáveis. |
| **RF08** | Portal Empresa | Empresa | Preenchimento de Diário de Obras digital com alerta para dias sem registro com contrato ativo. |
| **RF09** | Portal Empresa | Empresa | Submissão de medições estruturadas por evento com rascunho, assinatura eletrônica e vinculação de ART. |
| **RF10** | Portal Empresa | Empresa | Linha do tempo de status da medição com notificações por e-mail e portal a cada mudança. |
| **RF11** | Portal Empresa | Empresa | Gestão de documentos contratuais (upload, versionamento, alerta de vencimento) para ART, licenças, garantias e seguros. |
| **RF12** | Portal Empresa | Empresa | Registro formal de paralisações, solicitações de aditivo e comunicados gerais com rastreamento de resposta. |
| **RF13** | App Mobile | Fiscal | Check-in georreferenciado com validação de geofencing e check-in manual com justificativa quando fora do raio. |
| **RF14** | App Mobile | Fiscal | Checklist dinâmico gerado automaticamente com base no Diário de Obras e medições submetidas pela empresa. |
| **RF15** | App Mobile | Fiscal | Câmera exclusiva do app com metadados invioláveis (Lat, Long, timestamp servidor, hash SHA-256, usuário). |
| **RF16** | App Mobile | Fiscal | Modo offline com download prévio de dados e sincronização automática ao recuperar conexão. |
| **RF17** | App Mobile | Fiscal | Registro de pendências com gravidade, prazo, foto obrigatória e notificação automática. |
| **RF18** | App Mobile | Fiscal | Histórico completo da obra no app (vistorias, medições aprovadas, pendências abertas). |
| **RF19** | Analytics | Apoio | Curva S Preditiva comparando Planejado vs. Realizado vs. Preditivo com mudança automática de status. |
| **RF20** | Analytics | Chefe | Mapa de Calor georreferenciado do Estado com clusters por município e filtros por órgão e recurso. |
| **RF21** | IA | Apoio | Assistente de IA que analisa textos do Diário de Obras e gera alertas de risco com trecho originador. |
| **RF22** | Aprovação | Apoio | Interface de aprovação de medições com tela dividida (declaração da empresa vs. laudo do fiscal). |
| **RF23** | Aprovação | Apoio | Aprovação parcial de medições com registro de percentual aprovado por item e justificativa obrigatória. |
| **RF24** | Aprovação | Chefe | Configuração de alçada de valor: medições acima do limite requerem aprovação adicional do Chefe. |
| **RF25** | Alertas | Chefe | Central de alertas por prioridade: prazo vencido, obra sem vistoria, ART vencendo, pagamento atrasado. |
| **RF26** | Alertas | Chefe | Delegação de alertas para servidores com prazo e rastreamento de resolução. |
| **RF27** | Relatórios | Chefe | Geração e agendamento de relatórios gerenciais (PDF e XLSX) com filtros customizáveis. |
| **RF28** | Auditoria | Sistema | Trilha de auditoria imutável para toda ação relevante: aprovações, reprovações, alterações de status e cadastros. |
| **RF29** | Gestão | Chefe | Gerenciamento de usuários (criar, ativar, desativar) com atribuição de perfil e vínculo a contratos. |
| **RF30** | Analytics | Secretário | Dashboard executivo read-only com indicadores-chave de investimento, situação e tendência do portfólio. |

---

## 6. Requisitos Não Funcionais (RNF) e Arquitetura

| ID | Categoria | Descrição |
|:---|:---|:---|
| **RNF01** | Front-end Web | React 19 + Tailwind CSS v4. Foco em performance, renderização de mapas e dashboards analíticos. |
| **RNF02** | Front-end Mobile | React Native com código único iOS/Android. Acesso nativo a GPS, câmera e armazenamento local (offline). |
| **RNF03** | Back-end | Python (FastAPI) para APIs RESTful, rotinas matemáticas da Curva S e integração com LLMs. |
| **RNF04** | Banco de Dados | PostgreSQL com extensão PostGIS. Essencial para geofencing, mapas de calor e armazenamento espacial. |
| **RNF05** | Storage | Buckets em nuvem (AWS S3 ou Datacenter Estadual) com criptografia em repouso e política de retenção para fotos e documentos. |
| **RNF06** | Segurança | Criptografia TLS em trânsito, AES-256 em repouso para dados sensíveis, mascaramento de dados por perfil e RBAC estrito. |
| **RNF07** | LGPD e Auditoria | Logs imutáveis com: usuário, timestamp, IP, dado anterior e dado novo. Conformidade com TCE-RN, CGU e LGPD. |
| **RNF08** | Disponibilidade | SLA mínimo de 99,5% para o Portal Web. App Mobile funcional 100% em modo offline. |
| **RNF09** | Performance | Carregamento do Mapa de Calor em menos de 3 segundos para até 500 obras simultâneas. |
| **RNF10** | Escalabilidade | Arquitetura containerizada (Docker/Kubernetes) para escalonamento horizontal sob carga. |

---

## 7. Regras de Negócio Críticas (RN)

| ID | Regra | Impacto |
|:---|:---|:---|
| **RN01** | Bloqueio por ART: o sistema não permite "Assinar e Enviar" medição se a ART do Responsável Técnico estiver vencida ou não vinculada à submeta. | Empresa / Apoio |
| **RN02** | Fotos invioláveis: o app bloqueia importação da galeria; fotos de vistoria só podem ser capturadas na câmera do app no momento da vistoria. | Fiscal |
| **RN03** | Geofencing: check-in só é validado automaticamente dentro do raio configurado. Fora do raio, exige justificativa e fica marcado como "Check-in Manual" para revisão do apoio. | Fiscal |
| **RN04** | Fluxo de validação em cascata: a medição só avança para aprovação do apoio após o atestado do fiscal no app; só avança para liquidação após aprovação do apoio (e do chefe, quando aplicável). | Todos |
| **RN05** | Cálculo preditivo automático: se a tendência indicar extrapolação do prazo contratual, a obra muda automaticamente para "Amarelo" ou "Vermelho" no Mapa de Calor e dispara alerta para o chefe. | Sistema |
| **RN06** | Imutabilidade de medição assinada: após assinatura eletrônica, a medição não pode ser editada. Alterações exigem reprovação e nova submissão com registro do motivo. | Empresa / Apoio |
| **RN07** | SLA de vistoria: o sistema alerta o chefe de setor quando uma obra "Em Andamento" não recebe vistoria há mais de 30 dias (prazo configurável). | Chefe / Sistema |
| **RN08** | Alçada de aprovação: medições acima do valor-limite configurado pelo chefe requerem aprovação adicional antes de seguir para liquidação. | Chefe / Apoio |
| **RN09** | Desativação de usuário: ao desativar um servidor, o sistema mantém todos os registros históricos intactos e exige reatribuição das obras ativas a outro servidor. | Chefe |
| **RN10** | Paralisação formalizada: qualquer paralisação deve ser registrada pela empresa no portal para que o sistema suspenda os alertas de SLA de execução daquela obra. | Empresa / Sistema |

---

## 8. Fluxo de Aprovação (Ciclo de Medição)

```
EMPRESA → Diário de Obras (diário)
        → Declara avanço por evento
        → Salva rascunho de medição
        → Assina eletronicamente (ART obrigatória)
        → Submete para vistoria

SISTEMA → Gera checklist dinâmico para o fiscal
        → Notifica fiscal da medição pendente

FISCAL  → Faz check-in georreferenciado (geofencing)
        → Preenche checklist item a item
        → Tira fotos obrigatórias (câmera exclusiva)
        → Registra pendências se houver
        → Atesta e finaliza vistoria (online ou offline)

SISTEMA → Libera medição para análise do apoio
        → Notifica empresa das pendências (se houver)

APOIO   → Analisa medição (tela dividida: empresa vs. fiscal)
        → Pode aprovar total, parcial (com %) ou reprovar
        → Registra justificativa técnica (obrigatória)
        → Se valor > alçada: encaminha ao chefe

CHEFE   → Aprova ou reprova medições acima da alçada
        → Medição aprovada segue para liquidação/pagamento

SISTEMA → Atualiza status de todos os envolvidos
        → Notifica empresa por e-mail e portal
        → Registra evento na trilha de auditoria
        → Recalcula Curva S e Mapa de Calor
```

---

## 9. Roadmap de Projeto (Próximos Passos)

| Fase | Entrega | Descrição |
|:---|:---|:---|
| **Fase 1** | MVP Backoffice | CRUD de obras/contratos, cadastro de cronograma, gestão de ART, Kanban de tarefas e painel de obras do apoio. |
| **Fase 2** | Portal da Empresa | Diário de Obras digital, submissão de medições com assinatura eletrônica e gestão de documentos. |
| **Fase 3** | App Mobile do Fiscal | Check-in georreferenciado, checklist dinâmico, câmera com metadados, modo offline e registro de pendências. |
| **Fase 4** | Analytics e IA | Curva S preditiva, Mapa de Calor georreferenciado, assistente de IA e dashboard executivo do Secretário. |
| **Fase 5** | Gestão e Controle | Central de alertas, gestão de usuários, relatórios agendáveis, alçadas de aprovação e auditoria completa. |

---

## 10. Integrações Externas

| Integração | Finalidade | Módulo Impactado |
|:---|:---|:---|
| **Google Maps / Mapbox API** | Georreferenciamento, Mapa de Calor e validação de geofencing | Mobile, Analytics |
| **PostGIS (PostgreSQL)** | Armazenamento e consulta de dados espaciais (raio, cluster, calor) | Back-end |
| **API de LLM (Claude / OpenAI)** | Análise de Diários de Obras e geração de alertas de risco | IA |
| **Serviço de E-mail (SMTP / SendGrid)** | Notificações transacionais de medições, alertas e pendências | Sistema |
| **Push Notifications (FCM)** | Alertas em tempo real no App Mobile do fiscal | Mobile |
| **Plataforma +Brasil (futuro)** | Exportação de dados de prestação de contas para convênios federais | Relatórios |
