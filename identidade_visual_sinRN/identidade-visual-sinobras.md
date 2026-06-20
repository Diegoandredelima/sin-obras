# Manual de Identidade Visual — SIN-Obras / SIN-RN

> **Versão 2.0 | Junho 2026**
>
> Documento normativo de identidade visual e design system do sistema SIN-Obras,
> vinculado ao Governo do Estado do Rio Grande do Norte.
>
> **Público-alvo:** Designers, desenvolvedores frontend, equipes de comunicação e
> stakeholders institucionais.

---

## Índice

1. [Paleta de Cores](#1-paleta-de-cores)
2. [Tipografia](#2-tipografia)
3. [Iconografia](#3-iconografia)
4. [Componentes Visuais do Sistema](#4-componentes-visuais-do-sistema)
5. [Wireframes das Principais Páginas](#5-wireframes-das-principais-páginas)
6. [Elementos Gráficos Adicionais](#6-elementos-gráficos-adicionais)
7. [Aplicações Práticas](#7-aplicações-práticas)
8. [Tom de Voz e Diretrizes de Comunicação](#8-tom-de-voz-e-diretrizes-de-comunicação)

---

## 1. Paleta de Cores

A identidade cromática do SIN-Obras é ancorada no verde-esmeralda institucional,
herdado da identidade visual do Governo do RN. A paleta é complementada por tons
de âmbar (atenção), rose (erro/crítico), sky (informativo) e uma base neutra em
slate, garantindo hierarquia visual, acessibilidade e consistência em todos os
pontos de contato.

### 1.1 Cor Primária — Verde Institucional (Emerald)

A cor primária transmite confiança, crescimento e solidez. É o elemento
cromático dominante em botões de ação principal, links ativos, badges de
conclusão e indicadores de saúde "Em dia".

| Tom | HEX | RGB | CMYK | Uso |
|---|---|---|---|---|
| `brand-50` | `#f0fdf4` | `240, 253, 244` | `5, 0, 4, 1` | Fundo de seções com destaque leve |
| `brand-100` | `#dcfce7` | `220, 252, 231` | `13, 0, 8, 1` | Hover de linhas, fundo de badges positivos |
| `brand-200` | `#bbf7d0` | `187, 247, 208` | `24, 0, 16, 3` | Bordas de componentes positivos |
| `brand-300` | `#86efac` | `134, 239, 172` | `44, 0, 28, 6` | Acento decorativo, gráficos |
| `brand-400` | `#4ade80` | `74, 222, 128` | `67, 0, 42, 13` | Ícones de destaque, indicadores de progresso |
| `brand-500` | `#22c55e` | `34, 197, 94` | `83, 0, 52, 23` | Hover de botões primários, links ativos |
| `brand-600` | `#16a34a` | `22, 163, 74` | `87, 0, 55, 36` | Fundo de botões primários (ação principal) |
| **`brand-700`** | **`#15803d`** | **`21, 128, 61`** | **`84, 0, 52, 50`** | **Cor primária da marca** — cabeçalhos, sidebar logo |
| `brand-800` | `#166534` | `22, 101, 52` | `78, 0, 49, 60` | Texto sobre fundos claros (modo escuro) |
| `brand-900` | `#14532d` | `20, 83, 45` | `76, 0, 46, 67` | Fundo de cabeçalhos escuros |
| `brand-950` | `#052e16` | `5, 46, 22` | `89, 0, 52, 82` | Detalhes em modo escuro, contraste máximo |

**Regra de uso:**
- Use `brand-600` (`#16a34a`) como fundo de botões de ação primária.
- Use `brand-700` (`#15803d`) como cor de destaque máximo (logo, sidebar gradient).
- Nunca utilize tons abaixo de `brand-600` para texto sobre fundo branco
  — a relação de contraste é insuficiente para acessibilidade WCAG AA.
- Em modo escuro (sidebar), use `brand-400` para ícones e texto ativo.

---

### 1.2 Cores Secundárias — Semânticas

As cores semânticas são mapeadas para estados e significados universais,
reforçando a comunicação não-verbal com o usuário.

#### Sucesso / Concluído (Emerald, mesma família da primária)

| Tom | HEX | RGB | Uso |
|---|---|---|---|
| `emerald-100` | `#d1fae5` | `209, 250, 229` | Fundo de badge "Concluída" |
| `emerald-400` | `#34d399` | `52, 211, 153` | Indicador de saúde "Em dia", progress bar |
| `emerald-600` | `#059669` | `5, 150, 105` | Ícone de check, texto de badge |
| `emerald-700` | `#047857` | `4, 120, 87` | Texto de confirmação, destaque positivo |

#### Atenção / Pendente (Amber)

| Tom | HEX | RGB | CMYK | Uso |
|---|---|---|---|---|
| `amber-50` | `#fffbeb` | `255, 251, 235` | `0, 2, 8, 0` | Fundo de alertas de atenção |
| `amber-100` | `#fef3c7` | `254, 243, 199` | `0, 4, 22, 0` | Fundo de badge "Paralisada" |
| `amber-400` | `#fbbf24` | `251, 191, 36` | `0, 24, 86, 2` | Indicador de saúde "Atenção", dots |
| `amber-500` | `#f59e0b` | `245, 158, 11` | `0, 36, 96, 4` | Ícone de alerta, mensagens de warning |
| `amber-600` | `#d97706` | `217, 119, 6` | `0, 45, 97, 15` | Texto de badge, link de atenção |
| `amber-700` | `#b45309` | `180, 83, 9` | `0, 54, 95, 29` | Texto de alerta crítico, destaque |

#### Erro / Crítico (Rose)

| Tom | HEX | RGB | Uso |
|---|---|---|---|
| `rose-50` | `#fff1f2` | `255, 241, 242` | Fundo de alertas de erro |
| `rose-100` | `#ffe4e6` | `255, 228, 230` | Fundo de badge "Rescindida" |
| `rose-400` | `#fb7185` | `251, 113, 133` | Indicador de saúde "Crítico" |
| `rose-500` | `#f43f5e` | `244, 63, 94` | Ícone de erro, destaque de logout |
| `rose-600` | `#e11d48` | `225, 29, 72` | Texto de erro, mensagens de falha |
| `rose-700` | `#be123c` | `190, 18, 60` | Destaque máximo de erro |

#### Informativo / Neutro (Sky)

| Tom | HEX | RGB | Uso |
|---|---|---|---|
| `sky-50` | `#f0f9ff` | `240, 249, 255` | Fundo de badge "Em Execução" |
| `sky-100` | `#e0f2fe` | `224, 242, 254` | Fundo de badge "Em Andamento" |
| `sky-500` | `#0ea5e9` | `14, 165, 233` | Ícones informativos |
| `sky-600` | `#0284c7` | `2, 132, 199` | Links, ícones de medição |
| `sky-700` | `#0369a1` | `3, 105, 161` | Texto de badge informativo |

#### Status Especiais

| Status | Fundo | Texto | Borda |
|---|---|---|---|
| Planejada | `bg-slate-50` | `text-slate-600` | `border-slate-200` |
| Em Execução | `bg-sky-50` | `text-sky-700` | `border-sky-200` |
| Paralisada | `bg-amber-50` | `text-amber-700` | `border-amber-200` |
| Concluída | `bg-emerald-50` | `text-emerald-700` | `border-emerald-200` |
| Inacabada | `bg-orange-100` | `text-orange-700` | `border-orange-200` |
| Rescindida | `bg-rose-100` | `text-rose-700` | `border-rose-200` |
| Cedida | `bg-purple-100` | `text-purple-700` | `border-purple-200` |
| Arquivada/Extinta | `bg-slate-100` | `text-slate-600` | `border-slate-200` |

---

### 1.3 Cores de Superfície — Base Neutra (Slate)

A família Slate fornece a fundação do layout: fundos de página, cards, bordas,
textos e a barra lateral escura.

| Tom | HEX | RGB | Uso |
|---|---|---|---|
| `surface-50` | `#f8fafc` | `248, 250, 252` | Fundo geral da página |
| `surface-100` | `#f1f5f9` | `241, 245, 249` | Fundo de cards secundários, hover secundário |
| `surface-200` | `#e2e8f0` | `226, 232, 240` | Bordas padrão, separadores |
| `surface-800` | `#1e293b` | `30, 41, 59` | Texto de contraste, sidebar escura |
| `surface-900` | `#0f172a` | `15, 23, 42` | Texto principal, sidebar background |

#### Texto

| Uso | Classe Tailwind | HEX |
|---|---|---|
| Texto principal | `text-slate-900` | `#0f172a` |
| Texto secundário | `text-slate-600` / `text-slate-700` | `#475569` / `#334155` |
| Texto auxiliar (muted) | `text-slate-500` | `#64748b` |
| Placeholders | `text-slate-400` | `#94a3b8` |
| Texto sobre escuro (sidebar) | `text-slate-300` | `#cbd5e1` |
| Títulos sobre escuro | `text-white` | `#ffffff` |

#### Modo Escuro — Sidebar

A barra lateral adota um tema escuro contrastante com o conteúdo principal claro:

| Elemento | Classe | HEX |
|---|---|---|
| Fundo sidebar | `bg-slate-900` | `#0f172a` |
| Fundo logo area | `bg-slate-950/50` | `#020617` (50% opaco) |
| Texto de navegação | `text-slate-300` | `#cbd5e1` |
| Ícone inativo | `text-slate-400` | `#94a3b8` |
| Item ativo (fundo) | `bg-emerald-500/10` | `#10b981` (10% opaco) |
| Item ativo (texto/ícone) | `text-emerald-400` | `#34d399` |
| Indicador de ativo | `shadow-[inset_4px_0_0_0_#10b981]` | Barra esquerda `#10b981` |
| Hover item inativo | `hover:bg-white/5 hover:text-white` | Branco 5% opaco |
| Separador sessão | `text-slate-500` | `#64748b` |
| Logout hover | `hover:bg-rose-500/10 hover:text-rose-400` | Fundo rose 10% opaco |

---

### 1.4 Saúde das Obras — Sistema de Cores

Indicador visual universal para o status de saúde (prazos e orçamento) de cada obra:

| Nível | Cor Dot/Bar | HEX | Significado |
|---|---|---|---|
| Em dia | `emerald-400` | `#34d399` | Prazos e orçamento dentro do planejado |
| Atenção | `amber-400` | `#fbbf24` | Desvios moderados; requer acompanhamento |
| Crítico | `rose-400` | `#fb7185` | Desvios graves; ação imediata necessária |

---

## 2. Tipografia

### 2.1 Família Tipográfica

| Papel | Fonte | Fallback |
|---|---|---|
| **Principal** | Inter | Outfit, system-ui, sans-serif |
| **Monoespaçada** | Padrão do sistema | monospace |
| **Logo** | Inter Bold | — |

**Inter** foi escolhida por:
- Excelente legibilidade em tela (otimizada para UI)
- Ampla cobertura de pesos (Regular a Extra Bold)
- Suporte nativo a variáveis (variable font), reduzindo carregamento
- Caráter neutro e profissional, adequado ao contexto governamental

**Carregamento:** Google Fonts, pesos `400, 500, 600, 700, 800`.
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
```

### 2.2 Hierarquia Tipográfica

| Nível | Tag / Uso | Peso | Tamanho | Line-height | Exemplo |
|---|---|---|---|---|---|
| **Display** | 404, números hero | `font-black` (900) | `text-5xl` (48px) | natural | Página 404 |
| **H1** | Título de página | `font-bold` (700) | `text-2xl` (24px) | natural | "Painel de Controle", "Obras" |
| **H2** | Título de seção | `font-bold` (700) | `text-lg` (18px) | natural | Títulos de cards, modais |
| **H3** | Subtítulo / KPI label | `font-semibold` (600) | `text-sm` (14px) | natural | "Total de Obras", "Em andamento" |
| **Body** | Texto corrido | `font-normal` (400) | `text-sm` (14px) | 1.5 | Descrições, metadados |
| **Body Large** | Texto introdutório | `font-medium` (500) | `text-base` (16px) | natural | Texto de empty states |
| **Caption** | Legendas, metadados | `font-medium` (500) | `text-xs` (12px) | natural | Datas, labels de campos |
| **Micro** | Badges, rótulos | `font-bold` (700) | `text-[10px]` (10px) | natural | Headers de seção da sidebar |
| **Mono** | Hashes, números | `font-mono` | `text-sm` (14px) | natural | Números de contrato, hashes |

### 2.3 Regras de Uso

- **Nunca** utilize mais de 3 níveis hierárquicos em uma mesma tela.
- Títulos devem usar `tracking-tight` para coesão visual.
- Labels em uppercase devem usar `tracking-wide` ou `tracking-wider` com tamanho
  `text-[10px]` ou `text-xs` e peso `font-bold` ou `font-semibold`.
- Texto sobre fundo escuro (sidebar) exige `text-slate-300` (mín. `#cbd5e1`)
  e nunca `text-slate-500`.
- Use `font-mono` apenas para dados técnicos (números de contrato, hashes,
  códigos de medição).
- Aplicar `-webkit-font-smoothing: antialiased` e `-moz-osx-font-smoothing: grayscale`
  em todos os textos (já configurado no `index.css`).

### 2.4 Exemplo de Aplicação

```
┌──────────────────────────────────────────────┐
│  Obras                          [Nova Obra]  │  ← H1: text-2xl font-bold
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ RN-2024-0152                        │    │  ← H3: text-sm font-semibold
│  │ Construção da Ponte Nova            │    │
│  │                                      │    │
│  │ ████████████░░░░░ 76%             │    │  ← body: text-xs font-medium
│  │                                      │    │
│  │ EM EXECUÇÃO  │  Em dia            │    │  ← badge: text-xs font-semibold
│  │                                      │    │
│  │ 📍 Natal, RN  │  R$ 2.4M          │    │  ← caption: text-xs font-medium
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

---

## 3. Iconografia

### 3.1 Biblioteca

O sistema utiliza exclusivamente **Lucide React** (v1.20.0), uma biblioteca de
ícones open-source baseada no Feather Icons, com design limpo e geométrico.

**Importação padrão:**
```jsx
import { Building2, Calendar, CheckCircle2 } from "lucide-react";
```

### 3.2 Estilo e Regras

| Propriedade | Valor |
|---|---|
| **Estilo** | Linear (stroke), sem preenchimento |
| **Espessura do traço** | `strokeWidth={1.5}` a `{2}` (padrão da lib: 2) |
| **Cantos** | Arredondados (`strokeLinecap="round"`, `strokeLinejoin="round"`) |
| **Proporção** | Sempre quadrados (1:1) |
| **Tamanho padrão** | `h-4 w-4` (16px) para ícones inline |
| **Tamanho navegação** | `h-5 w-5` (20px) para sidebar e KPIs |
| **Tamanho cabeçalho** | `h-6 w-6` (24px) para títulos de página |
| **Tamanho ilustrativo** | `h-10 w-10` a `h-20 w-20` (40-80px) para empty states |
| **Cor** | Herda `currentColor`; nunca usar cores arbitrárias |
| **Margem** | Sempre `shrink-0` para evitar distorção em flex containers |

### 3.3 Ícones Essenciais do Sistema

| Ícone | Nome Lucide | Uso Principal |
|---|---|---|
| 🏢 `Building2` | `building-2` | Obras, contratos, empresas |
| 📋 `FileText` | `file-text` | Documentos, medições, contratos |
| 📅 `Calendar` | `calendar` | Datas, prazos, cronogramas |
| ✓ `CheckCircle2` | `check-circle-2` | Confirmações, conclusão |
| ⚠ `AlertTriangle` | `alert-triangle` | Alertas, atenção, pendências |
| ℹ `AlertCircle` | `alert-circle` | Informações, erros |
| 📍 `MapPin` | `map-pin` | Localização |
| 💰 `DollarSign` | `dollar-sign` | Valores financeiros, orçamento |
| 📊 `TrendingUp` | `trending-up` | Progresso, evolução |
| 🔍 `Search` | `search` | Busca e filtros |
| 🔔 `Bell` | `bell` | Notificações |
| 👤 `User` | `user` | Usuário, perfil |
| 🏠 `LayoutDashboard` | `layout-dashboard` | Dashboard |
| 📐 `KanbanSquare` | `kanban-square` | Quadro Kanban |
| ⏱ `Activity` | `activity` | Atividade, status |
| 🕐 `Clock` | `clock` | Prazos, histórico |
| ⏸ `Pause` | `pause` | Paralisação |
| 🔒 `Lock` | `lock` | Autenticação, segurança |
| 🛡 `Shield` | `shield` | Validação, assinatura |
| ✏ `Pencil` | `pencil` | Edição |
| ➕ `Plus` | `plus` | Adicionar, criar |
| 🧮 `Calculator` | `calculator` | Calculadora de engenharia |
| 📁 `FolderOpen` | `folder-open` | Projetos, arquivos |
| 💬 `BookOpen` | `book-open` | Diário de obras |
| ⛅ `Sun` / `Cloud` | `sun` / `cloud` | Condições climáticas |
| 🔄 `Loader2` | `loader-2` | Carregamento (com animação `animate-spin`) |

---

## 4. Componentes Visuais do Sistema

### 4.1 Botões

O sistema adota **três níveis hierárquicos** de botão, com consistência de
bordas (`rounded-xl`), tipografia (Inter, `font-semibold`) e transições.

#### 4.1.1 Botão Primário (Ação Principal)

```css
/* Primário Padrão */
bg-emerald-600 text-white text-sm font-semibold rounded-xl
shadow-md shadow-emerald-200 hover:bg-emerald-500
focus:outline-none focus:ring-4 focus:ring-emerald-500/30
disabled:opacity-70 disabled:cursor-not-allowed
transition-all px-5 py-2.5
```

| Estado | Aparência |
|---|---|
| **Normal** | Fundo `#16a34a`, texto branco, sombra suave verde |
| **Hover** | Fundo clareia para `#22c55e` |
| **Focus** | Anel de foco verde `#22c55e` com 30% de opacidade |
| **Ativo** | Idêntico ao normal (sem estilo `:active` explícito) |
| **Desabilitado** | Opacidade 70%, cursor `not-allowed` |

**Variante grande (Login):**
```css
/* Padding maior e shadow mais pronunciada */
py-3.5 shadow-lg shadow-emerald-500/30 focus:ring-emerald-500/50
```

**Variante compacta (ações inline):**
```css
/* Padding reduzido, rounded-lg */
px-3 py-1.5 rounded-lg text-xs
```

#### 4.1.2 Botão Secundário / Cancelar

```css
bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl
hover:bg-slate-200
transition-all px-5 py-2.5
```

| Estado | Aparência |
|---|---|
| **Normal** | Fundo `#f1f5f9`, texto `#475569` |
| **Hover** | Fundo `#e2e8f0` |
| **Desabilitado** | Opacidade 50% |

#### 4.1.3 Botão Outline / Ação Sutil

```css
/* Outline Emerald — usado para ações secundárias positivas (ex: Assinar) */
bg-emerald-50 text-emerald-600 text-xs font-semibold
border border-emerald-200 rounded-xl
hover:bg-emerald-100 transition-all px-3 py-1.5
```

#### 4.1.4 Botão Flutuante (FAB)

```css
/* Posicionamento fixo, com animação de escala */
fixed bottom-6 right-6 z-40
flex h-14 w-14 items-center justify-center
rounded-2xl shadow-2xl transition-all duration-300
bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-110
```

#### 4.1.5 Hierarquia Visual — Regra de Ouro

- **Máximo 1 botão primário por formulário/seção.**
- A ação principal (submit, confirmar, salvar) sempre recebe o estilo primário.
- Ações de cancelar/voltar usam o estilo secundário.
- Ações destrutivas (excluir, rescindir) **não possuem estilo dedicado** no
  sistema atual. Caso necessário, criar com `bg-rose-600` seguindo o mesmo
  padrão de tokens do primário.

---

### 4.2 Campos de Formulário

#### 4.2.1 Campo de Texto Padrão

```css
block w-full rounded-xl border border-slate-200 bg-slate-50
py-2.5 px-3 text-sm
placeholder:text-slate-400
focus:border-emerald-500 focus:bg-white focus:outline-none
focus:ring-4 focus:ring-emerald-500/10
transition-all
```

| Estado | Aparência |
|---|---|
| **Normal** | Fundo `#f8fafc`, borda `#e2e8f0` |
| **Hover** | Sem alteração (apenas cursor texto) |
| **Focus** | Borda muda para `#10b981`, fundo fica branco, anel verde 10% opaco |
| **Preenchido** | Sem distinção visual (a definir) |
| **Erro** | Usar classe adicional `border-rose-400 focus:border-rose-400 focus:ring-rose-500/10` |
| **Desabilitado** | `opacity-50 cursor-not-allowed bg-slate-100` |

#### 4.2.2 Campo com Ícone (Login, Busca)

```css
/* Mesmo padrão, com padding-left aumentado para acomodar o ícone */
pl-10 pr-3 (ícone à esquerda)
```

O ícone é posicionado com `absolute left-3 top-1/2 -translate-y-1/2` e
colorido com `text-slate-400`.

#### 4.2.3 Select

```css
rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm
text-slate-700
focus:border-emerald-500 focus:outline-none
focus:ring-4 focus:ring-emerald-500/10
transition-all appearance-none cursor-pointer
```

Ícone de chevron posicionado à direita com `absolute right-3`.

#### 4.2.4 Textarea

Mesmo padrão do campo de texto, acrescido de:
```css
resize-none
```
Para evitar redimensionamento que quebraria o layout.

---

### 4.3 Cards

O card é o componente fundamental de agrupamento de conteúdo no sistema.

#### 4.3.1 Card Padrão

```css
bg-white rounded-2xl border border-slate-100 shadow-sm
```

| Propriedade | Valor |
|---|---|
| Fundo | `#ffffff` |
| Borda | `#f1f5f9` (slate-100) |
| Arredondamento | `rounded-2xl` (16px) |
| Sombra | `shadow-sm` (0 1px 2px rgba(0,0,0,0.05)) |
| Padding interno | `p-4` (16px), `p-5` (20px) ou `p-6` (24px) conforme densidade |

#### 4.3.2 KPI Card (Dashboard)

Estrutura típica:
```
┌─────────────────────────────────────┐
│  ┌────┐                             │
│  │ 🏢 │  Total de Obras              │  ← ícone em container colorido (h-10 w-10 rounded-xl)
│  └────┘                              │
│                                      │
│  342                                 │  ← valor: text-3xl font-bold
│  +12% este mês                      │  ← sub: text-xs text-slate-500
└─────────────────────────────────────┘
```

Cores dos containers de ícone por tipo de KPI:
- Obras: `bg-emerald-100 text-emerald-600`
- Contratos: `bg-sky-100 text-sky-600`
- Em andamento: `bg-amber-100 text-amber-600`
- Concluídas: `bg-emerald-100 text-emerald-600`
- Pendências: `bg-rose-100 text-rose-600`

#### 4.3.3 Obra Card (Lista de Obras)

```
┌──────────────────────────────────────────┐
│  Ponte Nova          ● EM EXECUÇÃO       │  ← título + badge de status
│  RN-2024-0152                            │  ← ID em font-mono
│                                           │
│  ████████████░░░░░░░ 76%                │  ← barra de progresso (h-1.5 rounded-full)
│                                           │
│  📍 Natal, RN    📅 Jun/2024   💰 R$2.4M │  ← metadados com ícones
└──────────────────────────────────────────┘
```

#### 4.3.4 Card com Hover Elevation

Alguns cards interativos (como ações de navegação) adicionam:
```css
hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer
```

#### 4.3.5 Card Colapsável (Seção de Detalhe)

```css
bg-white rounded-2xl border border-slate-100 shadow-sm
```
Com cabeçalho contendo ícone + título + Chevron animado, e corpo colapsável
com `space-y-4`.

---

### 4.4 Tabelas

O sistema utiliza tabelas leves, sem linhas zebradas, com bordas sutis.
*(Implementação atual é baseada em grids, não em `<table>`.)*

**Quando implementar tabelas nativas, seguir este padrão:**

```css
/* Cabeçalho */
bg-slate-50 border-b border-slate-200
text-xs font-semibold text-slate-500 uppercase tracking-wider
px-4 py-3

/* Célula */
px-4 py-3 text-sm text-slate-700
border-b border-slate-100

/* Linha hover */
hover:bg-slate-50/50 transition-colors
```

---

### 4.5 Barra de Navegação Superior (Header)

```css
h-16 shrink-0 bg-white/80 backdrop-blur-md
border-b border-slate-200 px-8
flex items-center shadow-sm z-10
```

| Propriedade | Valor |
|---|---|
| Altura | `h-16` (64px) |
| Fundo | Branco com 80% de opacidade + desfoque (glass effect) |
| Borda inferior | `#e2e8f0` |
| Padding horizontal | `px-8` (32px) |
| Título | `text-xl font-semibold text-slate-800` |
| Sombra | `shadow-sm` |
| z-index | `z-10` |

**Atualmente o título é estático ("Painel de Controle").** O breadcrumb contextual
deve ser implementado em versões futuras.

---

### 4.6 Sidebar (Navegação Esquerda)

```css
flex h-full w-64 flex-col
bg-slate-900 text-slate-300
shadow-2xl transition-all duration-300
```

| Propriedade | Valor |
|---|---|
| Largura | `w-64` (256px) fixo |
| Fundo | `#0f172a` (slate-900) |
| Sombra | `shadow-2xl` |
| Logo area | `h-16`, fundo `#020617` 50% opaco, blur |
| Logo container | `h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600` |
| Logo texto | `text-xl font-bold tracking-tight text-white` |

**Itens de navegação:**

| Estado | Estilo |
|---|---|
| Inativo | `text-slate-400 hover:bg-white/5 hover:text-white` |
| Ativo | `bg-emerald-500/10 text-emerald-400 shadow-[inset_4px_0_0_0_#10b981]` |
| Ícones | `h-5 w-5 shrink-0` |
| Texto | `text-sm font-medium` |

**Seções:** Separadas por labels `text-[10px] font-bold text-slate-500 uppercase tracking-wider`.

**Perfil (área inferior):**
- Fundo: `bg-slate-950/30 border-t border-white/5`
- Avatar: `h-9 w-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600`
- Logout: `text-slate-400 hover:bg-rose-500/10 hover:text-rose-400`

---

### 4.7 Alertas e Mensagens do Sistema

O sistema utiliza **banners inline** (sem sistema de toast) posicionados no
topo da área de conteúdo relevante.

#### 4.7.1 Alerta de Erro

```css
rounded-xl bg-rose-50 border border-rose-100
px-4 py-3 text-sm text-rose-700
flex items-center gap-3
```
Ícone: `AlertCircle` ou `XCircle` em `rose-500`.

#### 4.7.2 Alerta de Atenção / Aviso

```css
rounded-xl bg-amber-50 border border-amber-100
px-4 py-3 text-sm text-amber-800
```
Ícone: `AlertTriangle` em `amber-500`.

#### 4.7.3 Aviso Informativo (sem borda)

```css
rounded-xl bg-amber-50 px-3 py-3 text-sm text-amber-700 leading-relaxed
```
*(Usado como "nota importante" dentro de cards de detalhe.)*

#### 4.7.4 Alerta de Sucesso

**A definir.** O sistema atual não implementa banners de sucesso explícitos.
Sugestão de design:
```css
rounded-xl bg-emerald-50 border border-emerald-100
px-4 py-3 text-sm text-emerald-700
flex items-center gap-3
```
Ícone: `CheckCircle2` em `emerald-500`.

---

### 4.8 Modal / Diálogo

```css
/* Overlay */
fixed inset-0 z-50 flex items-center justify-center p-4
bg-black/40 backdrop-blur-sm

/* Card do modal */
bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5
```

| Propriedade | Valor |
|---|---|
| Overlay | Preto 40% opaco + desfoque |
| Card | Branco, `rounded-2xl`, `shadow-2xl` |
| Largura máxima | `max-w-md` (448px) |
| Padding | `p-6` (24px) |
| Título | `text-lg font-bold text-slate-900` |
| Espaçamento vertical | `space-y-5` entre elementos |

---

### 4.9 Glass Panel (Utilitário Customizado)

Utilitário definido no `index.css` para painéis com efeito vidro:

```css
/* Claro — cards sobre fundo claro */
.glass-panel → bg-white/80 backdrop-blur-md border border-white/20 shadow-xl

/* Escuro — componentes sobre fundo escuro */
.glass-dark → bg-slate-900/80 backdrop-blur-md border border-slate-700/50 shadow-xl
```

---

## 5. Wireframes das Principais Páginas

### 5.1 Login

```
┌──────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────┐ ┌──────────────────────────┐│
│ │                              │ │                          ││
│ │   [Logo SIN-Obras]           │ │                          ││
│ │   SIN-Obras                  │ │                          ││
│ │   Sistema Integrado de       │ │     Imagem de fundo      ││
│ │   Obras do RN                │ │     (login_bg.jpeg)      ││
│ │                              │ │                          ││
│ │   ┌──────────────────────┐   │ │     + overlay multiply   ││
│ │   │ 🔒  │ usuario       │   │ │                          ││
│ │   └──────────────────────┘   │ │                          ││
│ │                              │ │                          ││
│ │   ┌──────────────────────┐   │ │                          ││
│ │   │ 🔒  │ senha         │   │ │                          ││
│ │   └──────────────────────┘   │ │                          ││
│ │                              │ │                          ││
│ │   [ █████ Entrar █████ ]    │ │                          ││
│ │                              │ │                          ││
│ └──────────────────────────────┘ └──────────────────────────┘│
│                                                              │
│                    © 2026 SIN-Obras — Governo do RN           │
└──────────────────────────────────────────────────────────────┘
```

**Layout:** Duas colunas.
- **Coluna esquerda (40%):** Fundo `bg-white`. Logo centralizada no topo (SIN
  vertical + brasão). Subtítulo institucional. Formulário com campos
  `py-3 pl-10` (ícone à esquerda). Botão `py-3.5 w-full`. Link "Esqueceu a
  senha?" abaixo.
- **Coluna direita (60%):** Imagem de fundo `login_bg.jpeg` com `mix-blend-multiply`
  overlay. Visível apenas em `lg:` (≥1024px). Abaixo disso, apenas a coluna
  esquerda ocupa a tela inteira.

---

### 5.2 Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│ [Sidebar 256px] │ Painel de Controle       [Header 64px]     │
│                 ├────────────────────────────────────────────┤
│ ┌──────────┐    │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│ │  SIN     │    │ │ 342  │ │  58  │ │  12  │ │ 89%  │      │
│ │ Obras    │    │ │Obras │ │Ativas│ │Alerta│ │Saúde │      │
│ └──────────┘    │ └──────┘ └──────┘ └──────┘ └──────┘      │
│                 │                                            │
│ 📊 Principal    │ ┌──────────────────────────────────────┐  │
│   Dashboard     │ │ Acesso Rápido                        │  │
│   Obras         │ │ ┌──────┐ ┌──────┐ ┌──────┐          │  │
│   Contratos     │ │ │+ Nova│ │ Busca│ │Relat.│          │  │
│   Quadro        │ │ │ Obra │ │ Obra │ │      │          │  │
│                 │ │ └──────┘ └──────┘ └──────┘          │  │
│ ─────────────── │ └──────────────────────────────────────┘  │
│   (label)       │                                            │
│                 │ ┌──────────────────────────────────────┐  │
│ 🔔 Notificações │ │ Obras Recentes                       │  │
│                 │ │ ┌──────────┐ ┌──────────┐ ┌───────┐ │  │
│                 │ │ │Ponte Nova│ │Estrada X │ │Escola │ │  │
│                 │ │ │Em dia    │ │Atenção   │ │Crítico│ │  │
│ ─────────────── │ │ └──────────┘ └──────────┘ └───────┘ │  │
│ 👤 Diego S.     │ └──────────────────────────────────────┘  │
│   Fiscal        │                                            │
│   [Sair]        │                                            │
└──────────────────────────────────────────────────────────────┘
```

**Layout:**
- **Topo:** 4 KPI Cards em grid `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4`.
  Cada card: ícone em caixa colorida (`h-10 w-10 rounded-xl`), valor (`text-3xl
  font-bold`), label + subtítulo com variação.
- **Acesso Rápido:** 3 cards de ação em grid `sm:grid-cols-3`. Ícone grande +
  título + seta. Efeito hover com elevação de sombra.
- **Obras Recentes:** Grid `sm:grid-cols-2 xl:grid-cols-3` de ObraCards com
  indicador de saúde (dot colorido), título, status badge e metadados.

---

### 5.3 Página de Obras (Lista)

```
┌──────────────────────────────────────────────────────────────┐
│ [Sidebar] │ Obras                 [+ Nova Obra]  │ Header   │
│           ├──────────────────────────────────────────────────┤
│           │ ┌────────────────────┐ ┌──────────────────────┐ │
│           │ │ 🔍 Buscar obra... │ │ Status: [Todos ▼]   │ │
│           │ └────────────────────┘ └──────────────────────┘ │
│           │                                                  │
│           │ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│           │ │ 🟢 Em dia│ │ 🟡Atenção│ │ 🔴Crítico│        │
│           │ │ Ponte N. │ │ Estrada  │ │ Hospital │        │
│           │ │ EM EXEC. │ │PARALISADA│ │ EM EXEC. │        │
│           │ │ 📍 Natal │ │ 📍 Moss. │ │ 📍 Parn. │        │
│           │ │ 76%      │ │ 45%      │ │ 22%      │        │
│           │ └──────────┘ └──────────┘ └──────────┘        │
│           │ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│           │ │ 🟢 Em dia│ │ 🟡Atenção│ │ 🟢 Em dia│        │
│           │ │ Escola N.│ │ Viaduto  │ │ Paviment.│        │
│           │ │ CONCLUÍDA│ │ EM EXEC. │ │PLANEJADA │        │
│           │ │ ...      │ │ ...      │ │ ...      │        │
│           │ └──────────┘ └──────────┘ └──────────┘        │
│           │                                                  │
└──────────────────────────────────────────────────────────────┘
```

**Layout:**
- **Topo:** Título + botão "Nova Obra" (primário, `shadow-lg`).
- **Filtros:** Barra de busca (`w-full`, ícone `Search` à esquerda) + Select de
  status lado a lado em `flex gap-3`.
- **Grid de Cards:** `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4`.
  Cada card (ObraCard) é um link para `/obras/:id`.
- **Pagination:** A definir (atualmente não implementada — scroll infinito ou
  paginação numérica a decidir).

---

### 5.4 Página de Relatórios

```
┌──────────────────────────────────────────────────────────────┐
│ [Sidebar] │ Relatórios                             │ Header  │
│           ├──────────────────────────────────────────────────┤
│           │                                                  │
│           │  ┌─────────────────────────────────────────┐    │
│           │  │ 📊 Gerar Relatório                      │    │
│           │  │                                         │    │
│           │  │ Tipo: [Selecione o tipo ▼]             │    │
│           │  │                                         │    │
│           │  │ Período: [01/01/2026] a [31/12/2026]   │    │
│           │  │                                         │    │
│           │  │ Obra: [Todas ▼]                        │    │
│           │  │                                         │    │
│           │  │ Formato: ( ) PDF  (●) Excel  ( ) CSV   │    │
│           │  │                                         │    │
│           │  │ [ Gerar Relatório ]                    │    │
│           │  └─────────────────────────────────────────┘    │
│           │                                                  │
│           │  ┌─────────────────────────────────────────┐    │
│           │  │ 📋 Relatórios Recentes                   │    │
│           │  │                                         │    │
│           │  │ 📄 Relatório Mensal - Jan/2026  [Baixar]│    │
│           │  │ 📄 Relatório por Obra - Ponte N. [Baixar]│   │
│           │  │ 📄 Financeiro - 1º Trim/2026   [Baixar]│    │
│           │  └─────────────────────────────────────────┘    │
│           │                                                  │
└──────────────────────────────────────────────────────────────┘
```

**Layout:**
- **Card de geração:** Campo select para tipo de relatório, date pickers para
  período, select de obra, radio buttons para formato (PDF/Excel/CSV). Botão
  primário "Gerar Relatório".
- **Lista de recentes:** Cards com ícone de documento, nome do relatório e
  botão outline "Baixar".
- *(Nota: Esta página ainda não existe no sistema atual; o wireframe é uma
  proposta baseada na arquitetura existente.)*

---

### 5.5 Página de Configurações

```
┌──────────────────────────────────────────────────────────────┐
│ [Sidebar] │ Configurações                          │ Header  │
│           ├──────────────────────────────────────────────────┤
│           │                                                  │
│           │  ┌─────────────────────────────────────────┐    │
│           │  │ 👤 Perfil do Usuário                    │    │
│           │  │                                         │    │
│           │  │ Nome:  [Diego Silva                  ] │    │
│           │  │ Email: [diego@sinobras.rn.gov.br     ] │    │
│           │  │ Cargo: Fiscal                            │    │
│           │  │                                         │    │
│           │  │ [ Alterar Senha ]  [ Salvar ]           │    │
│           │  └─────────────────────────────────────────┘    │
│           │                                                  │
│           │  ┌─────────────────────────────────────────┐    │
│           │  │ 🔔 Preferências de Notificação          │    │
│           │  │                                         │    │
│           │  │ [✓] Medições                             │    │
│           │  │ [✓] Vistorias                             │    │
│           │  │ [ ] Alertas do Sistema                    │    │
│           │  │ [✓] Resumo Semanal por Email              │    │
│           │  └─────────────────────────────────────────┘    │
│           │                                                  │
│           │  ┌─────────────────────────────────────────┐    │
│           │  │ 🎨 Aparência                            │    │
│           │  │                                         │    │
│           │  │ Tema: (●) Claro  ( ) Escuro             │    │
│           │  │ Idioma: [Português ▼]                   │    │
│           │  └─────────────────────────────────────────┘    │
│           │                                                  │
└──────────────────────────────────────────────────────────────┘
```

**Layout:**
- Seções em cards independentes com `space-y-6`.
- Cada seção: card padrão (`bg-white rounded-2xl border border-slate-100 shadow-sm`)
  com título (`text-lg font-bold`) e conteúdo.
- Toggle switches: a definir estilo (atualmente não implementados no design system).
- *(Nota: Esta página ainda não existe no sistema atual; o wireframe é uma
  proposta.)*

---

## 6. Elementos Gráficos Adicionais

### 6.1 Grid e Espaçamentos

O sistema adota a escala de espaçamento padrão do Tailwind (base 4px):

| Token | Valor | Uso Principal |
|---|---|---|
| `p-4` / `gap-4` | 16px | Padding padrão de cards, gaps de grid |
| `p-6` / `gap-6` | 24px | Seções e modais |
| `p-8` | 32px | Padding da área de conteúdo principal |
| `space-y-1.5` | 6px | Agrupamento compacto (labels + inputs) |
| `space-y-4` | 16px | Listas de cards |
| `space-y-6` | 24px | Seções de página |
| `space-y-8` | 32px | Separação de seções maiores |

**Grids responsivos padrão:**

| Contexto | Classes |
|---|---|
| KPIs (4 colunas) | `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4` |
| Cards (3 colunas) | `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4` |
| Cards (2 colunas) | `grid grid-cols-1 lg:grid-cols-2 gap-4` |
| Detalhe (2/3 + 1/3) | `grid grid-cols-1 lg:grid-cols-3 gap-6` (col-span-2 + col-span-1) |
| Kanban (3 colunas) | `grid grid-cols-1 md:grid-cols-3 gap-4` |
| Ações rápidas (3 colunas) | `grid grid-cols-1 sm:grid-cols-3 gap-4` |
| Formulário (2 colunas) | `grid grid-cols-1 sm:grid-cols-2 gap-4` |

---

### 6.2 Bordas e Arredondamentos

| Raio | Classe | Uso |
|---|---|---|
| 4px | `rounded-lg` | Badges pequenos, botões compactos, sidebar nav items |
| 8px | `rounded-xl` | **Padrão** — inputs, botões, campos de formulário |
| 16px | `rounded-2xl` | **Cards**, modais, painéis, FAB |
| 9999px | `rounded-full` | Badges, dots de status, avatares |

**Regra de consistência:**
- Elementos interativos (inputs, botões) usam `rounded-xl`.
- Contêineres de conteúdo (cards, modais) usam `rounded-2xl`.
- Indicadores inline (badges, dots) usam `rounded-full`.
- Nunca misturar raios diferentes no mesmo componente.

**Bordas:**

| Espessura | Classe | Cor | Uso |
|---|---|---|---|
| 1px | `border` | `slate-200` (`#e2e8f0`) | Inputs, cards, separadores |
| 1px | `border` | `slate-100` (`#f1f5f9`) | Cards (mais suave) |
| 1px | `border` | `white/20` | Glass panels (claro) |
| 1px | `border` | `white/5` | Sidebar separators |
| 0px | — | — | Nunca usar `border-0` sem alternativa visual |

---

### 6.3 Sombras e Profundidade

| Nível | Classe | Valor Aproximado | Uso |
|---|---|---|---|
| 0 | (sem shadow) | — | Elementos planos (fundo de página) |
| 1 | `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Cards, header |
| 2 | `shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Botões primários, cards hover |
| 3 | `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Botões CTA, glass panels |
| 4 | `shadow-xl` | `0 20px 25px rgba(0,0,0,0.1)` | Glass panels, sidebar inferior |
| 5 | `shadow-2xl` | `0 25px 50px rgba(0,0,0,0.15)` | Sidebar, modais, FAB |

**Sombras coloridas (botões):**
- Botão primário: `shadow-md shadow-emerald-200` (padrão) ou `shadow-lg shadow-emerald-500/30` (login)
- Botão primário (CTA): `shadow-lg shadow-emerald-200`

**Princípio:** Use sombras com moderação. A profundidade deve reforçar a
hierarquia, não decorar. Elementos sobrepostos (modais, sidebar, FAB) recebem
as sombras mais elevadas.

---

### 6.4 Efeitos de Vidro (Glassmorphism)

Dois utilitários definidos no `index.css`:

```css
.glass-panel  /* claro  → bg-white/80 + backdrop-blur-md + border-white/20 + shadow-xl */
.glass-dark   /* escuro → bg-slate-900/80 + backdrop-blur-md + border-slate-700/50 + shadow-xl */
```

**Uso:**
- `.glass-panel` → Header superior (já aplicado como `bg-white/80 backdrop-blur-md`)
- `.glass-dark` → Overlays sobre sidebar, indicadores flutuantes

---

### 6.5 Estilo de Ilustrações

O sistema **não utiliza ilustrações customizadas**. A comunicação visual de
apoio é feita exclusivamente por:

- Ícones Lucide em tamanhos grandes (até `h-20 w-20`) com `text-slate-300` para
  empty states.
- Gradientes sutis (`bg-gradient-to-br from-emerald-400 to-green-600`) para
  elementos de destaque como o logo na sidebar.
- Caso ilustrações sejam necessárias no futuro, recomenda-se um estilo flat
  com cores da paleta brand, linha limpa e proporções amigáveis — consistente
  com o caráter governamental e técnico do sistema.

---

### 6.6 Regras de Responsividade

**Breakpoints (Tailwind padrão):**

| Prefixo | Largura mínima | Comportamento |
|---|---|---|
| (base) | 0px | Mobile vertical — 1 coluna |
| `sm:` | 640px | 2 colunas para KPIs e cards |
| `md:` | 768px | Kanban 3 colunas, login revela imagem direita |
| `lg:` | 1024px | Detalhe com sidebar, navegação mais ampla |
| `xl:` | 1280px | KPIs em 4 colunas, cards em 3 colunas |

**Regras gerais:**
- Todo layout inicia em 1 coluna (mobile-first).
- O sidebar é fixo (`w-64`) e visível em todos os breakpoints (não colapsa em
  mobile — requer autenticação, portanto uso em desktop é presumido).
- Modais limitados a `max-w-md` (448px) com margem `p-4`.
- Textos não devem truncar; usar `truncate` ou `line-clamp-*` apenas quando
  estritamente necessário.
- Touch targets mínimos de 44px (seguindo Apple HIG) para elementos interativos
  em breakpoints mobile.

---

## 7. Aplicações Práticas

### 7.1 Telas do Sistema

Todas as interfaces do SIN-Obras devem seguir estritamente os tokens e componentes
definidos neste documento. Consulte a seção 4 (Componentes Visuais) e 5 (Wireframes)
para a especificação completa de cada tela.

**Exemplo de código — Botão primário:**
```jsx
<button className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600
  text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-200
  hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/30
  disabled:opacity-70 disabled:cursor-not-allowed transition-all">
  <Plus className="h-4 w-4" />
  Nova Obra
</button>
```

**Exemplo de código — Card padrão:**
```jsx
<div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
  <h3 className="text-lg font-bold text-slate-900">Título da Seção</h3>
  <p className="mt-2 text-sm text-slate-600">Descrição do conteúdo.</p>
</div>
```

**Exemplo de código — Alerta de erro:**
```jsx
<div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3
  flex items-center gap-3 text-sm text-rose-700">
  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
  <span>Erro ao processar a solicitação. Tente novamente.</span>
</div>
```

---

### 7.2 Materiais Institucionais

**Documentos oficiais (PDF, ofícios, relatórios impressos):**

| Elemento | Especificação |
|---|---|
| Papel | A4, margens 2.5cm |
| Cabeçalho | Brasão do RN à esquerda, logotipo SIN-Obras à direita |
| Fonte | Inter (títulos: Bold 16pt; corpo: Regular 11pt) |
| Cor primária | `#15803d` para títulos, linhas e elementos gráficos |
| Cor de apoio | `#0f172a` para texto |
| Rodapé | Linha em `#15803d`, texto centralizado "SIN-Obras — Governo do RN" |

**Cartão de visita digital:**
```
┌──────────────────────────────────────┐
│  [Brasão RN]          SIN·Obras      │
│                                      │
│  Diego Silva                         │
│  Fiscal de Obras                     │
│                                      │
│  diego@sinobras.rn.gov.br            │
│  sinobras.rn.gov.br                  │
│                                      │
│  ██████████████████████████████████  │  ← barra verde brand-700
└──────────────────────────────────────┘
```

---

### 7.3 Assinaturas de E-mail

**Modelo corporativo — padrão SIN-Obras:**

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Atenciosamente,                                         │
│                                                          │
│  Diego Silva                                             │
│  Fiscal de Obras | SIN-Obras                             │
│  Governo do Estado do Rio Grande do Norte                │
│                                                          │
│  📧 diego@sinobras.rn.gov.br                             │
│  🌐 sinobras.rn.gov.br                                   │
│                                                          │
│  ─────────────────────────────────────                   │
│  [Logo SIN-Obras]  Sistema Integrado de Obras do RN      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Especificações técnicas:**
- Fonte: Inter, 14px para nome, 12px para dados, cor `#0f172a`
- Separador: linha 1px `#e2e8f0`
- Logo: 120px de largura, alinhado ao final da assinatura
- Cores de links: `#16a34a` (brand-600)
- Fundo: branco. Sem imagens de fundo ou gradientes.

**Texto para clientes de email sem suporte a HTML:**
```
Atenciosamente,
Diego Silva
Fiscal de Obras | SIN-Obras
Governo do Estado do Rio Grande do Norte
diego@sinobras.rn.gov.br | sinobras.rn.gov.br
```

---

### 7.4 Apresentações

**Template de slides (PowerPoint / Google Slides):**

| Elemento | Especificação |
|---|---|
| Slide mestre — fundo | Branco `#ffffff` |
| Barra superior | Faixa horizontal de 8px em `#15803d` (brand-700) no topo |
| Título | Inter Bold, 32pt, `#0f172a` |
| Subtítulo | Inter Semi Bold, 18pt, `#475569` |
| Corpo | Inter Regular, 16pt, `#334155` |
| Destaques | Caixas com fundo `#f0fdf4` (brand-50), borda `#bbf7d0` (brand-200) |
| Rodapé | Linha `#e2e8f0`, texto 10pt `#64748b`: "SIN-Obras | Governo do RN" |
| Logo | Brasão RN (canto superior direito) + logo SIN-Obras (canto inferior direito) |

**Gráficos e dados:**
- Use a paleta semântica do sistema (verde para metas atingidas, âmbar para
  atenção, rose para crítico).
- Gráficos de barra/linha em tons da escala brand (brand-600, brand-400, brand-200).
- Nunca usar gradientes ou 3D nos gráficos — mantenha estilo flat e limpo.

---

### 7.5 Redes Sociais

**Avatar / Foto de perfil:**
- Fundo `#15803d` (brand-700)
- Logo SIN-Obras centralizado em branco
- Dimensão: 1080×1080px (Instagram/Facebook) ou 400×400px (Twitter/X)

**Posts institucionais:**
| Elemento | Especificação |
|---|---|
| Fundo | Branco ou `#f8fafc` (surface-50) |
| Margem interna | 80px em cada borda (para 1080×1080) |
| Título | Inter Bold, 72pt, `#15803d` |
| Corpo | Inter Regular, 36pt, `#0f172a` |
| Rodapé | Faixa inferior de 120px em `#15803d` com logo SIN-Obras em branco |
| Hashtags | `#SINObras #GovernoDoRN #ObrasPublicas` |

**Stories (1080×1920):**
- Background com gradiente sutil `from-brand-900 to-brand-700`
- Texto branco, Inter Bold
- Logo no topo
- CTA no rodapé com `bg-white text-brand-700 rounded-xl`

---

## 8. Tom de Voz e Diretrizes de Comunicação

### 8.1 Personalidade do Sistema

O SIN-Obras se comunica como um **servidor público técnico e confiável**:

- **Profissional**, mas não frio
- **Claro**, mas não simplista
- **Preciso**, mas não burocrático
- **Respeitoso**, mas não submisso

O tom deve inspirar confiança no cidadão e eficiência para o servidor que opera
o sistema. A linguagem é institucional sem ser impessoal — o usuário deve sentir
que está interagindo com um sistema moderno, bem projetado e que respeita seu
tempo.

### 8.2 Princípios de Comunicação

1. **Seja conciso.** Mensagens devem ser compreendidas em uma leitura rápida.
2. **Seja útil.** Toda mensagem deve responder "o que aconteceu" e "o que fazer agora".
3. **Seja respeitoso.** Nunca culpe, ironize ou menospreze o usuário. Erros são do
   sistema, não da pessoa.
4. **Seja consistente.** Use os mesmos termos em todas as telas. "Obra" é sempre
   "obra", nunca "projeto". "Medição" é "medição", nunca "leitura" ou "aferição".
5. **Evite jargão técnico** desnecessário. Prefira "Não foi possível salvar" a
   "Erro 500 — Internal Server Error".

### 8.3 Glossário de Termos Padronizados

| Termo | Uso | Não usar |
|---|---|---|
| Obra | Projeto de construção pública | Projeto, empreendimento |
| Medição | Registro de avanço físico-financeiro | Leitura, aferição |
| Contrato | Vínculo formal com empresa executora | Acordo, ajuste |
| Empresa | Pessoa jurídica contratada | Construtora, firma, terceirizada |
| Cronograma | Linha do tempo de metas e eventos | Timeline, agenda |
| Diário de Obras | Registro diário de atividades | Log, bitácora |
| Vistoria | Inspeção técnica presencial | Fiscalização, auditoria |
| Saúde | Indicador composto de prazo e orçamento | Health, status geral |
| Quadro | Quadro Kanban de tarefas | Board, kanban board |

### 8.4 Exemplos de Mensagens

#### Mensagens de Erro

| ❌ Incorreto | ✅ Correto |
|---|---|
| "Erro 403: Forbidden" | "Você não tem permissão para acessar esta página. Solicite acesso ao coordenador." |
| "Falha na requisição" | "Não foi possível carregar as obras. Verifique sua conexão e tente novamente." |
| "Senha inválida!" | "Credenciais incorretas. Verifique seu usuário e senha." |
| "Campo obrigatório!" | "O nome da obra é obrigatório. Preencha este campo para continuar." |

#### Mensagens de Sucesso

| ❌ Incorreto | ✅ Correto |
|---|---|
| "OK" | "Obra cadastrada com sucesso." |
| "Dados salvos com sucesso." | "Medição registrada. O contrato foi atualizado." |
| "Sucesso!" | "Arquivo enviado. A equipe técnica será notificada." |

#### Estados Vazios (Empty States)

| ❌ Incorreto | ✅ Correto |
|---|---|
| "Nenhum resultado." | "Nenhuma obra encontrada com esses filtros. Tente ampliar os critérios de busca." |
| "Sem dados." | "Você ainda não possui notificações. As notificações aparecerão aqui quando houver atualizações nas suas obras." |
| "Lista vazia." | "Nenhum contrato cadastrado. Clique em 'Novo Contrato' para começar." |

#### Rótulos e Labels

| ❌ Incorreto | ✅ Correto |
|---|---|
| "Nome da Obra:" | "Nome da obra" (sem dois-pontos no label, usar `font-medium`) |
| "Clique aqui" | "Acessar detalhes da obra" (descreva o destino, não a ação) |
| "Submit" | "Entrar" / "Salvar" / "Confirmar" (use verbos em português no imperativo) |

### 8.5 Voz por Contexto

| Contexto | Tom | Exemplo |
|---|---|---|
| **Títulos de página** | Direto, informativo | "Obras", "Relatório Mensal", "Nova Medição" |
| **Instruções** | Gentil, orientativo | "Preencha os campos abaixo para cadastrar uma nova obra." |
| **Confirmações** | Seguro, tranquilizador | "Tem certeza que deseja excluir esta medição? Esta ação não pode ser desfeita." |
| **Erros** | Objetivo, sem alarmismo | "O arquivo enviado excede o tamanho máximo de 10 MB." |
| **Notificações** | Conciso, acionável | "Nova medição registrada na obra RN-2024-0152. Acesse para revisar." |
| **Empty states** | Encorajador, orientador | "Nenhuma obra cadastrada ainda. Comece criando sua primeira obra." |
| **Logout** | Neutro, formal | "Você saiu do sistema. Até logo." |

---

## Anexos

### A. Arquivos de Logo

Disponíveis na pasta `identidade_visual_sinRN/`:

| Arquivo | Descrição | Uso |
|---|---|---|
| `SIN.png` | Logo horizontal | Header de documentos, assinaturas de e-mail |
| `SIN_vertical.png` | Logo vertical (empilhado) | Telas de login, splash screen |
| `brasao_RN.png` | Brasão oficial do RN | Documentos oficiais, cabeçalhos institucionais |

*(Para acesso à versão vetorial, solicitar ao núcleo de comunicação.)*

### B. Implementação Técnica (Frontend)

- **Tailwind CSS v4** com tokens definidos via `@theme` no arquivo
  `frontend/src/index.css`.
- **Classes customizadas:** `.glass-panel` e `.glass-dark` definidas em
  `@layer utilities`.
- **Ícones:** Lucide React v1.20.0, importados individualmente.
- **Fontes:** Inter via Google Fonts CDN, pesos `400,500,600,700,800`.

### C. Versionamento

| Versão | Data | Alterações |
|---|---|---|
| 1.0 | Dez/2025 | Documento inicial com pasta de logos |
| **2.0** | **Jun/2026** | **Reconstrução completa: paleta, tipografia, iconografia, componentes, wireframes, tom de voz** |

---

> **SIN-Obras — Sistema Integrado de Obras do Rio Grande do Norte**
>
> Governo do Estado do RN
>
> Para dúvidas ou solicitações de assets: comunicação@sinobras.rn.gov.br
