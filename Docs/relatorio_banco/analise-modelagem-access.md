# SIN-Obras — Análise da Modelagem Access (SIN.Obras1.accdb)

> O arquivo `SIN.Obras1.accdb` (1,2 MB, formato Microsoft Access ACE DB) é uma modelagem primária dos dados do projeto. Sem acesso ao driver MS Access, a análise abaixo é baseada em padrões conhecidos de modelagens Access legadas e indícios das planilhas Excel que o complementam.

---

## Contexto

O Access é uma modelagem **primária** (protótipo inicial) do banco de dados. As planilhas Excel (`Acompanhamento de obras.xlsx` e `PASTA DA PRAZO marcelinho.xlsx`) são o que a equipe usa no dia a dia — ou seja, a modelagem Access nunca chegou a substituir as planilhas como ferramenta de trabalho.

---

## Falhas Típicas de Modelagens Access Legadas

Com base no que se observa em migrações de Access → PostgreSQL para sistemas de obras públicas, as falhas prováveis são:

### 1. Ausência de Integridade Referencial
- **Sintoma**: Tabelas sem Foreign Keys formais, apenas "campos de ligação" manuais
- **Consequência**: Registros órfãos, inconsistência entre contratos e obras
- **No PostgreSQL**: TODA relação deve ter FK com `ON DELETE` explícito

### 2. Campos Multivalorados (Lookup Fields)
- **Sintoma**: Um campo texto contendo múltiplos valores separados por vírgula/ponto-e-vírgula (ex: "1ª medição R$ 50.000, 2ª medição R$ 75.000")
- **Consequência**: Impossível consultar, somar ou filtrar por medição individual
- **No PostgreSQL**: Cada medição = 1 linha na tabela `medicoes`

### 3. Tabelas com Muitas Colunas Repetitivas
- **Sintoma**: Colunas como `Medicao1_Valor`, `Medicao2_Valor`, ..., `Medicao21_Valor`
- **Consequência**: Limite arbitrário de 21 medições, consultas SQL complexas com UNION
- **No PostgreSQL**: Tabela `medicoes` com 1 linha por medição

### 4. Tipagem Fraca ou Ausente
- **Sintoma**: Tudo é `Texto Curto` ou `Texto Longo` (Memo), inclusive valores e datas
- **Consequência**: "100.000,00" > "9.000,00" em ordenação alfabética, datas inválidas
- **No PostgreSQL**: Tipos rigorosos (DATE, NUMERIC, UUID, BOOLEAN)

### 5. Ausência de Tabelas de Apoio (Domínio)
- **Sintoma**: Status, órgãos, municípios digitados livremente em cada registro
- **Consequência**: "SEEC", "Seec", "SECRETARIA DE EDUCAÇÃO" tratados como valores diferentes
- **No PostgreSQL**: Enums ou tabelas de domínio com FKs

### 6. Sem Controle de Concorrência
- **Sintoma**: Access é single-file, dois usuários abrindo simultaneamente = corrupção ou perda de dados
- **Consequência**: Impossível uso multiusuário real
- **No PostgreSQL**: MVCC, transações ACID, concorrência nativa

### 7. Sem Registro de Auditoria
- **Sintoma**: Alterações sobrescrevem dados anteriores sem rastro
- **Consequência**: Impossível saber quem alterou o quê e quando
- **No PostgreSQL**: Tabela `audit_logs` com JSONB antes/depois

### 8. Lógica de Negócio na Interface (Forms/VBA)
- **Sintoma**: Validações e regras implementadas em formulários e macros VBA, não no banco
- **Consequência**: Bypass fácil editando a tabela diretamente; regras se perdem na migração
- **No PostgreSQL**: Constraints, triggers e validações na camada de modelos SQLAlchemy

### 9. Sem Suporte a Dados Geoespaciais
- **Sintoma**: Endereço em texto livre, sem coordenadas
- **Consequência**: Impossível verificar geofencing de vistorias ou plotar obras no mapa
- **No PostgreSQL**: PostGIS com GEOMETRY(POINT, 4326)

### 10. Schema Único e Monolítico
- **Sintoma**: Todas as tabelas no mesmo arquivo, sem separação por módulo
- **Consequência**: Arquivo cresce, performance degrada, backup complexo
- **No PostgreSQL**: Schemas separados por módulo se necessário, índices otimizados

---

## Prováveis Tabelas no Access

Pelo contexto das planilhas e do domínio, o Access provavelmente contém tabelas como:

| Tabela (provável) | Equivalente no schema atual |
|---|---|
| `Contratos` | `contratos` |
| `Obras` | `obras` |
| `Empresas` | `usuarios` (tipo EMPRESA) |
| `Fiscais` | `usuarios` (tipo FISCAL) |
| `Medições` | `medicoes` |
| `Aditivos` ou `Prazos` | ❌ NOVO necessário |
| `Paralisações` | ❌ NOVO necessário |
| `Readequações` | ❌ NOVO necessário |
| `Orgaos` ou `Secretarias` | ❌ Ausente do schema atual |

---

## O Que NÃO Deve Ser Reproduzido

| Prática do Access | Alternativa no PostgreSQL |
|---|---|
| Campos multivalorados (Memo com lista) | Tabela relacional com FK |
| Colunas repetidas (Medição1...MediçãoN) | Tabela `medicoes` com 1 linha por medição |
| Datas como texto | Tipo DATE |
| Valores como texto | Tipo NUMERIC(15,2) |
| Status como texto livre | ENUM do PostgreSQL |
| Falta de PK/FK | UUID + ForeignKey com ON DELETE |
| Sem auditoria | `audit_logs` automático |
| VBA para validação | Constraints e validações no modelo SQLAlchemy |
| Lookup fields do Access | Relationships com `lazy="selectin"` |
| Attachment fields para fotos | `fotos_vistoria` com URL S3/MinIO + hash SHA-256 |

---

## O Que Pode Ser Aproveitado

Apesar das falhas, a modelagem Access pode conter acertos:

1. **Nomenclatura de entidades**: Os nomes das tabelas e campos podem refletir o vocabulário real da SIN
2. **Relacionamentos conceituais**: Mesmo sem FKs formais, as relações pensadas (Contrato → Obra, Obra → Medição) provavelmente estão corretas
3. **Dados históricos**: Se há registros reais inseridos, são fonte valiosa para migração
4. **Campos específicos do domínio**: Informações que não aparecem nas planilhas podem estar modeladas

---

## Recomendação Final

Quando o Access puder ser aberto (via MS Access ou driver ODBC), exportar **todas as tabelas para CSV** e:

1. Comparar a lista de tabelas/campos com o schema atual do PostgreSQL
2. Identificar campos que existem no Access e faltam no PostgreSQL
3. Migrar dados históricos para as novas tabelas
4. Descartar a modelagem Access e adotar o schema PostgreSQL como fonte única da verdade
