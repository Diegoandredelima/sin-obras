# 📂 Guia de Documentação — SIN-Obras

Este diretório centraliza toda a documentação do sistema **SIN-Obras** (Sistema de Informação e Acompanhamento de Obras da Secretaria de Estado de Infraestrutura do RN). Aqui você encontrará especificações de processos, requisitos de negócio, definições de design/identidade visual e relatórios de modelagem de banco de dados.

---

## 🗺️ Mapa da Documentação

### 🎨 [Identidade Visual](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/Identidade-Visual-SIN-RN-Completa)
Contém os guias, especificações e arquivos de estilo do governo do RN adaptados ao sistema SIN-Obras:
* **[DESIGN-HANDOFF.md](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/Identidade-Visual-SIN-RN-Completa/DESIGN-HANDOFF.md)**: Manual de transição do design (Figma) para o código CSS/Tailwind.
* **[DESIGN-MANIFEST.json](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/Identidade-Visual-SIN-RN-Completa/DESIGN-MANIFEST.json)**: Tokens de cores, fontes, espaçamentos e estilos oficiais.
* **[identidade-visual-sin-v3.html](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/Identidade-Visual-SIN-RN-Completa/identidade-visual-sin-v3.html)**: Demonstração interativa HTML dos componentes e paleta de cores.
* **Assets**: [Brasão Oficial do RN](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/Identidade-Visual-SIN-RN-Completa/brasao_RN.png) e mockups de tela ([Preview 1](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/Identidade-Visual-SIN-RN-Completa/1.png), [Preview 2](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/Identidade-Visual-SIN-RN-Completa/2.png)).

---

### 📋 [Requisitos Básicos e Casos de Uso](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/basico)
Especificação conceitual e regras de negócio essenciais para o desenvolvimento do sistema:
* **[requisitos-basicos.md](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/basico/requisitos-basicos.md)**: Visão geral das funcionalidades, escopo do sistema e principais integrações.
* **[historia-do-usuario.md](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/basico/historia-do-usuario.md)**: Detalhamento das personas (Fiscal, Gestor, Construtora, Secretário) e fluxos de navegação/ação de cada uma.

---

### 📑 [Modelos de Documentos de Campo](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/documento_usados_hoje_na_sinRN)
Exemplos práticos de documentos físicos e planilhas utilizados hoje na rotina da SIN-RN. Servem como base de modelagem para os módulos digitais correspondentes:
* **Diário de Obra (RDO)**: [Exemplo de RDO assinado](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/documento_usados_hoje_na_sinRN/SIN-Cobertura_Quadra_PM-Nova_Cruz-BM_02-RDO_assinado.pdf).
* **Boletim de Medição**: [Planilha XLSX de Medição](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/documento_usados_hoje_na_sinRN/SIN-Cobertura_Quadra_PM-Nova_Cruz-BM_02.xlsx) e [Medição em PDF assinada](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/documento_usados_hoje_na_sinRN/MEDICAO_01___PAX_2026_05_21_assinado_assinado.pdf).
* **Relatório Fotográfico**: [Exemplo de relatório fotográfico de campo](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/documento_usados_hoje_na_sinRN/SIN-Cobertura_Quadra_PM-Nova_Cruz-BM_02-Relatorio_Fotografico..pdf).

---

### 🗄️ [Modelagem de Banco de Dados e ETL](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/relatorio_banco)
Análise técnica do banco legado (MS Access) e especificação detalhada do novo banco relacional no PostgreSQL:
* **[analise-modelagem-access.md](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/relatorio_banco/analise-modelagem-access.md)**: Levantamento das limitações e falhas do banco de dados Access (`SIN.Obras1.accdb`).
* **[dados-a-ser-estudados.md](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/relatorio_banco/dados-a-ser-estudados.md)**: Análise das planilhas Excel usadas no dia a dia e mapeamento de colunas para entidades atômicas.
* **[relatorio-melhorias-banco.md](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/relatorio_banco/relatorio-melhorias-banco.md)**: Principais melhorias e novas entidades inseridas no modelo PostgreSQL (notificações, termos, aditivos).
* **[modelo-novo-der-e-logico.md](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/relatorio_banco/modelo-novo-der-e-logico.md)**: Modelo Entidade-Relacionamento lógico do novo schema.
* **[schema-novo.sql](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/relatorio_banco/schema-novo.sql)**: Script SQL do schema DDL completo (PostgreSQL).
* **[plano-transformacao-e-carga.md](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/relatorio_banco/plano-transformacao-e-carga.md)**: Planejamento estratégico de migração e ETL.
* **[relatorio-final-modelagem.md](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/relatorio_banco/relatorio-final-modelagem.md)**: Fechamento técnico da nova estrutura de dados de engenharia.
* **[dump-banco-atual.md](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/relatorio_banco/dump-banco-atual.md)**: Inspecionamento e exportação do estado atual do PostgreSQL.

---

### 🛡️ Políticas de Desenvolvimento e Fluxos
* **[ci-local.md](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/ci-local.md)**: Explicação de como rodar o script de validação de qualidade (`ruff` + `pytest` + `eslint` + `tsc` + `build`) localmente no computador, contornando a indisponibilidade do plano pago do GitHub Actions.
* **[branch-protection.md](file:///C:/Users/diego/OneDrive/Documentos/projetos/Sin-Obras/Docs/branch-protection.md)**: Regras de segurança de branch configuradas para evitar pushes diretos sem validações ou force-pushes na branch `main`.
