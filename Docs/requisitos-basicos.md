# 📄 Documento de Concepção e Requisitos: Sistema Integrado de Obras (SIN-RN)

**Organização:** Secretaria de Estado da Infraestrutura do Rio Grande do Norte (SIN-RN)  
**Demandante:** Coordenadoria de Obras e Serviços (COS)  
**Desenvolvimento:** Assessoria de Informática  
**Identidade Visual:** Diretrizes do Governo do Estado do RN (Verde, Branco e tipografia oficial).  

---

## 1. Visão Geral e Propósito
Este documento consolida a concepção, os requisitos e a arquitetura tecnológica de um sistema unificado de gestão de obras para a SIN-RN. O projeto integra um **Portal Web** e um **Aplicativo Mobile** em um único ecossistema, eliminando o abismo entre o canteiro de obras e o escritório.

O objetivo é automatizar o acompanhamento físico e financeiro de obras públicas, assegurar a validade legal das vistorias e introduzir **inteligência preditiva** para evitar paralisações e atrasos, modernizando o fluxo atualmente analógico e superando os moldes da Plataforma +Brasil.

## 2. O Problema a ser Resolvido
Atualmente, a fiscalização, o acompanhamento de contratos, medições e vistorias da COS sofrem com a descentralização de informações. O sistema visa resolver:
* A falta de previsibilidade de atrasos.
* A dificuldade em conciliar dados de campo com os contratos em tempo hábil.
* A necessidade de padronizar rigorosamente as medições e vistorias (comprovação visual e georreferenciada) para prestação de contas de recursos estaduais e federais.

---

## 3. Atores do Sistema (Personas e RBAC)
O sistema utilizará *Role-Based Access Control* (RBAC) rigoroso para segregar dados sensíveis e fluxos de aprovação:

1. **Empresa Executora (Externa):** Acesso via Portal Web restrito ao seu contrato. Insere relatórios, alimenta o Diário de Obras e submete medições com assinatura eletrônica.
2. **Fiscal de Obras (Campo):** Acesso via App Mobile. Realiza check-in georreferenciado, segue o checklist gerado pelo sistema e valida com fotos o que a empresa relatou.
3. **Engenheiro de Apoio/Gestor (Escritório):** Acesso via Web. Analisa os dados das vistorias e medições, aprova etapas, gere o quadro de tarefas e cadastra novas obras.
4. **Coordenador (COS):** Acesso via Web. Monitora os alertas do sistema, o desempenho global das equipes e as pendências administrativas.
5. **Secretário de Infraestrutura:** Acesso via Web. Visualiza painéis executivos (Mapas de Calor e Curvas Preditivas) para tomadas de decisão de alto nível.

---

## 4. Épicos e Módulos do Sistema

### 🏛️ Épico 1: Gestão de Contratos e Obras (Backoffice Web)
* **CRUD de Obras e Contratos:** Cadastro de obras, metas, submetas e eventos.
* **Gestão de Responsabilidade Técnica:** Vínculo de engenheiros, upload e validação de ART/RRT ativas.
* **Quadro de Tarefas (Kanban):** Gestão de pendências, processos licitatórios e tramitações internas.
* **Calculadora de Engenharia:** Ferramenta lateral para cubicação, conversões e cálculos estruturais rápidos.

### 🏢 Épico 2: Portal da Empresa Executora (Web)
* **Diário de Obras Digital:** Registro diário de clima, equipe, equipamentos e ocorrências.
* **Registro de Medições por Eventos:** A empresa declara o avanço físico por submeta/evento (inspirado na PLE da Plataforma +Brasil).
* **Assinatura e Tramitação:** Assinatura eletrônica da medição pelo Responsável Técnico e envio para a fila de fiscalização da SIN-RN.

### 📱 Épico 3: Fiscalização Inteligente (App Mobile)
* **Check-in Georreferenciado:** Validação de presença no canteiro via GPS (PostGIS).
* **Checklist Dinâmico:** O app recebe automaticamente apenas os eventos que a Empresa declarou como "Executados".
* **Câmera com Metadados Invioláveis:** Captura de fotos que registram coordenadas, carimbo de data/hora do servidor e *hash* criptográfico.
* **Modo Offline:** Preenchimento de vistorias em áreas sem sinal, com sincronização automática.

### 📊 Épico 4: Inteligência, Analytics e Dashboard (Web)
* **Curva S Preditiva:** Algoritmo que cruza o cronograma baseline com o avanço real e projeta matematicamente a data de conclusão e desvios.
* **Mapa de Calor do RN / Canteiro:** Visualização gráfica onde obras ou etapas "Vermelhas" indicam atraso crítico.
* **Assistente de IA (LLM):** Copiloto que lê os Diários de Obras e relatórios de campo, alertando o gestor sobre riscos ocultos e inconsistências.

---

## 5. Requisitos Funcionais (RF) Consolidados

| ID | Módulo | Descrição do Requisito |
| :--- | :--- | :--- |
| **RF01** | Auth | Autenticação via matrícula institucional (>= 5 dígitos) para servidores e CNPJ/GOV.br para empresas. |
| **RF02** | Gestão | Permitir o cadastro de Cronogramas Físico-Financeiros importados com estrutura de Metas, Submetas e Eventos. |
| **RF03** | Portal Empresa | Exigir o vínculo de uma ART/RRT ativa para o Responsável Técnico antes de permitir a assinatura de qualquer medição. |
| **RF04** | Portal Empresa | Permitir que a empresa salve "Rascunhos" de medição e assine digitalmente antes de enviar para a SIN-RN. |
| **RF05** | App Mobile | Realizar *check-in* de vistoria obrigatório dentro de um raio de X metros da coordenada geográfica da obra (Geofencing). |
| **RF06** | App Mobile | Gerar *Checklist de Validação* no app baseado estritamente no que a empresa inseriu no Diário de Obras / Medição. |
| **RF07** | App Mobile | Capturar fotos anexando metadados EXIF + Carimbo do Sistema (Lat, Long, Data, Hora, Usuário). |
| **RF08** | Analytics | Renderizar a **Curva S** comparando: *Planejado vs. Realizado vs. Preditivo (Tendência)*. |
| **RF09** | Analytics | Renderizar o **Mapa de Calor** do Estado, clusterizando obras por status de saúde (Verde, Amarelo, Vermelho). |
| **RF10** | IA | Implementar motor de IA para varrer textos do Diário de Obras e sugerir alertas de risco para o Engenheiro de Apoio. |
| **RF11** | Alertas | Disparar notificações (Push, E-mail e "Caixa de Entrada" no sistema) para a COS quando uma obra entrar em estado crítico. |
| **RF12** | Auditoria | Manter *Log* imutável (Trilha de Auditoria) de quem aprovou, reprovou ou alterou medições (Conformidade LGPD e TCE-RN). |

---

## 6. Requisitos Não Funcionais (RNF) e Arquitetura

* **RNF01 - Front-end Web:** React 19 + Tailwind CSS v4 (Foco em performance, renderização de mapas e dashboards analíticos).
* **RNF02 - Front-end Mobile:** React Native (Código único iOS/Android), com acesso nativo a sensores (GPS, Câmera, Armazenamento local para modo offline).
* **RNF03 - Back-end:** Python (FastAPI ou Django) para orquestração de APIs, rotinas matemáticas da Curva S e integração com LLMs.
* **RNF04 - Banco de Dados Espacial:** PostgreSQL com extensão **PostGIS** (Essencial para validar o *check-in* no canteiro e gerar os Mapas de Calor).
* **RNF05 - Storage:** Buckets em nuvem (AWS S3 ou Datacenter do Estado) com política de retenção e criptografia para laudos e fotos em alta resolução.
* **RNF06 - Segurança e LGPD:** Criptografia de ponta a ponta em dados sensíveis, mascaramento de dados e logs de auditoria inalteráveis.

---

## 7. Regras de Negócio Críticas (RN) - *O Fluxo de Valor*

1. **RN01 - Travamento por ART:** O sistema **não** permitirá que a Empresa Executora clique em "Assinar e Enviar Medição" se a ART do engenheiro responsável estiver vencida ou não estiver vinculada àquela submeta.
2. **RN02 - Fluxo de Validação:** 
   * A Empresa registra o avanço (ex: 50% da Fundação) $\rightarrow$ 
   * O sistema gera o Checklist no App do Fiscal $\rightarrow$ 
   * O Fiscal vai a campo, tira a foto e atesta $\rightarrow$ 
   * Somente após o "De Acordo" do Fiscal no App, o sistema libera a medição para aprovação financeira no Backoffice.
3. **RN03 - Inviolabilidade da Foto:** Fotos de vistoria não podem ser importadas da galeria do celular. Devem ser tiradas *exclusivamente* dentro do App no momento da vistoria para evitar fraudes.
4. **RN04 - Cálculo Preditivo:** Se o ritmo de execução indicar que a obra ultrapassará a data do contrato, o sistema muda a obra para "Amarelo" ou "Vermelho" no Mapa de Calor automaticamente, disparando alertas preventivos.

---

## 8. Próximos Passos Sugeridos (Roadmap de Projeto)

1. **Desenho de Fluxograma (BPMN):** Mapear visualmente o fluxo de *Medição e Aprovação*.
2. **Prototipação de Telas (Wireframes / Figma):**
   * *Tela 1:* O Mapa de Calor do Secretário.
   * *Tela 2:* A tela de "Checklist e Câmera" do App Mobile do Fiscal.
   * *Tela 3:* O Portal da Empresa com a lista de Eventos/Submetas para medição.
3. **Modelagem do Banco de Dados (DER):** Criar o diagrama entidade-relacionamento focando na integração do PostGIS.
4. **Definição da API de IA:** Testar *prompts* de LLMs alimentando-os com "Diários de Obras fictícios" para extração de riscos.