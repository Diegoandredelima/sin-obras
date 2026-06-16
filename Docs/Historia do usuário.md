# **Documento Estruturado – Concepção do Sistema**

**Organização:** Secretaria de Estado da Infraestrutura do Rio Grande do Norte (SIN-RN)

**Demandante:** Coordenadoria de Obras e Serviços (COS) 

**Desenvolvimento:** Assessoria de Informática (Analista: Diego André de Lima)

## **1\. Propósito do Documento**

Este documento apresenta o rascunho inicial para a concepção de um sistema de gestão de obras, incluindo:

* Contexto geral do projeto e fundamentação legal  
* História dos usuários (Personas)  
* Cenário de uso  
* Diretrizes para orientar a geração de soluções, fluxos e requisitos

O objetivo é fornecer uma visão clara, organizada e profissional para orientar o desenvolvimento técnico e o alinhamento com as necessidades da Coordenadoria de Obras e Serviços (COS) e da Secretaria de Infraestrutura como um todo.

## **2\. Contexto do Sistema**

O sistema será desenvolvido para atender especificamente às demandas da **Coordenadoria de Obras e Serviços (COS)**. A motivação central é centralizar, otimizar e monitorar o fluxo de gestão de obras públicas e a manutenção de prédios públicos.

**Fundamentação Institucional:** A SIN-RN é o órgão responsável por planejar, coordenar e executar as políticas públicas de infraestrutura, além de controlar a aplicação de recursos (federais e estaduais) nos setores de obras. Como a secretaria tem o dever legal de projetar, licitar, executar, fiscalizar e receber obras e serviços de engenharia, além de realizar vistorias e perícias, o volume de dados e processos é altíssimo.

**O Problema a ser Resolvido:** Atualmente, a fiscalização, o acompanhamento de contratos, medições e vistorias da COS necessitam de maior integração entre o campo e o escritório. O sistema visa resolver a descentralização de informações, permitindo o acompanhamento em tempo real do andamento físico e financeiro das obras, garantindo transparência, segurança na aplicação de convênios/financiamentos e facilitando a comunicação entre fiscais, engenheiros de apoio, coordenadores, secretariado e empresas executoras.

## **3\. Cenário Geral**

O sistema será utilizado por equipes multidisciplinares e níveis hierárquicos variados da Secretaria de Infraestrutura (com foco na COS), operando tanto em ambiente de escritório (Web) quanto em canteiros de obras (Mobile).

* **Usuários envolvidos:** Engenheiros (apoio/gestão e fiscais de campo), Coordenadores de Setor (COS), Secretário de Infraestrutura e representantes das Empresas Executoras.  
* **Necessidades principais:** Acompanhamento rigoroso de prazos e pagamentos, comprovação visual e georreferenciada do andamento das obras (para prestação de contas de recursos estaduais e federais), geração de relatórios gerenciais automáticos e facilidade na comunicação interna e externa.  
* **Desafios e limitações:** Falta de previsibilidade de atrasos, dificuldade em conciliar dados de campo com os contratos em tempo hábil para evitar paralisações, e a necessidade de padronizar rigorosamente as medições e vistorias conforme as exigências da Administração Pública.

  ## **4\. Histórias dos Usuários**

* **Engenheiro Civil (Apoio / Gestor do Projeto na COS):** Como *engenheiro de apoio*, quero *analisar os dados das vistorias, medições e contratos em um painel único*, para *garantir a regularidade das obras, aprovar etapas dos processos licitados e resguardar a aplicação correta dos recursos*.  
* **Engenheiro Civil (Fiscal de Obras):** Como *fiscal de obras*, quero *utilizar um aplicativo mobile para realizar check-in com localização, preencher formulários padronizados da obra e anexar fotos*, para *comprovar a execução física dos serviços de forma prática e legalmente válida durante minhas visitas mensais*.  
* **Coordenador de Obras e Serviços (COS):** Como *coordenador da COS*, quero *receber alertas automáticos (prazos, pagamentos e visitas) e gerar relatórios macro e planilhas personalizadas*, para *monitorar o desempenho global das obras, da minha equipe e garantir a conformidade dos processos administrativos*.  
* **Secretário de Estado da Infraestrutura:** Como *secretário*, quero *visualizar um dashboard analítico simplificado com indicadores chave*, para *ter um panorama executivo das obras estaduais e dos investimentos de transportes e infraestrutura, com a opção de aprofundar os dados quando necessário para tomada de decisões governamentais*.  
* **Empresa Executora:** Como *representante da empresa executora licitada*, quero *inserir informações e atualizações restritas à minha obra no sistema*, para *manter o engenheiro gestor atualizado e dar transparência à execução do contrato público*.

  ## **5\. Requisitos Iniciais**

  ### **5.1. Requisitos Funcionais**

* **RF01 – Autenticação:** O sistema deve permitir login baseado em vínculo institucional, utilizando credencial pré-cadastrada (ex: matrícula gerada aleatoriamente de no mínimo 5 dígitos).  
* **RF02 – Dashboard e Menu Principal:** O sistema deve possuir uma área de trabalho com menu fixo contendo: Acompanhar Obras, Cadastrar Obras, Quadro de Tarefas (Kanban/Trello), Caixa de E-mail, Relatórios, Configuração e Conta.  
* **RF03 – Gestão de Obras (CRUD):** O sistema deve permitir o cadastro e monitoramento das obras, registrando dados como: status, pendências, equipe em campo, valor estimado, datas de início/término e previsão de atraso.  
* **RF04 – Módulo Mobile (Fiscalização):** O aplicativo deve registrar check-in via GPS (localização/endereço), permitir preenchimento de objetivos da visita, controle de insumos/equipe e upload de fotos da obra.  
* **RF05 – Sistema de Alertas:** O sistema deve enviar notificações automáticas para a COS sobre visitas realizadas, tempo de visita, prazos, pagamentos realizados e atrasados.  
* **RF06 – Assistente de Inteligência Artificial:** O sistema deve integrar uma IA capaz de verificar inconsistências, gerar insights e sugerir correções para o engenheiro analista.  
* **RF07 – Ferramentas de Engenharia:** O sistema deve conter uma "calculadora de engenharia" integrada ao painel web.  
* **RF08 – Acesso da Empresa:** O sistema deve possuir um portal com visão restrita onde a empresa executora possa inserir relatórios e dados de sua própria obra licitada.

  ### **5.2. Requisitos Não Funcionais**

* **RNF01 – Multiplataforma:** O sistema deve funcionar via navegador Web (PCs) para gestão no órgão, e via aplicativo Mobile (Android/iOS) para o trabalho de campo das vistorias.  
* **RNF02 – Controle de Acesso (RBAC):** Os níveis de permissão e visualização devem ser estritamente baseados no perfil logado (Secretário, Coordenador, Engenheiro ou Empresa), resguardando informações sensíveis do Governo.  
* **RNF03 – Segurança de Credenciais:** A matrícula de login gerada pelo sistema deve conter no mínimo 5 dígitos e atender a padrões de segurança estaduais.  
* **RNF04 – Integração de Hardware:** O aplicativo mobile deve integrar-se obrigatoriamente com o GPS e a câmera do dispositivo do fiscal de obras para validação de presença.

  ## **6\. Fluxo de Uso (Visão Macro)**

1. **Acesso e Autenticação:** O usuário (interno da SIN ou externo da Empresa) realiza o login informando seu vínculo e credenciais.  
2. **Direcionamento de Perfil:** O sistema adapta o Dashboard com base no perfil (ex: visão global para o Secretário/Coordenador da COS; painel de cadastro para o Apoio; obras delegadas para a Empresa).  
3. **Registro de Informações (Campo vs. Escritório):**  
   * *Campo:* O Fiscal usa o app mobile para fazer o check-in na obra, preenche o formulário da vistoria mensal, faz medições e anexa fotos com metadados.  
   * *Escritório/Externa:* A Empresa Executora insere relatórios de avanço em seu portal. O Engenheiro de Apoio na COS cadastra novas obras baseadas em processos licitatórios e avalia os dados recebidos.  
4. **Processamento e Validação (IA e Sistema):** O sistema cruza os dados inseridos, a IA identifica possíveis inconsistências ou prevê atrasos, e o motor de regras dispara alertas (ex: medição aprovada, pagamento atrasado) para a coordenação.  
5. **Saída de Dados:** O sistema consolida as informações em relatórios personalizados (necessários para prestação de contas de convênios/financiamentos) e atualiza o dashboard executivo.

   ## **7\. Considerações Técnicas**

* **Integrações:** Necessidade de integração com APIs de mapas/georreferenciamento (Google Maps ou Mapbox) para o check-in do aplicativo, e serviço de envio de e-mails/notificações.  
* **Armazenamento:** Prever arquitetura em nuvem escalável para suportar o armazenamento de um grande volume de mídia (fotos em alta resolução e laudos de vistorias).  
* **Inteligência Artificial:** A ferramenta de IA precisará consumir uma API de modelo de linguagem (LLM) treinada ou adaptada para o contexto de engenharia civil e gestão pública.  
* **Segurança e Privacidade:** Como o sistema lidará com dados de obras, desapropriações e contratos públicos do Estado/União, deve seguir rigorosamente a LGPD e possuir trilhas de auditoria (logs) detalhadas, registrando quem validou medições e quem alterou status de processos.  
* 

  