# DESIGN.md — Guia de Design SIN-Obras

> **Identidade Visual v3** · Junho 2026  
> Fonte canônica: `Docs/Identidade-Visual-SIN-RN-Completa/identidade-visual-sin-v3.html`

---

## 1. Filosofia

O SIN-Obras é um sistema institucional do Governo do Estado do RN. A interface deve transmitir **autoridade, clareza e confiança**. Toda decisão de cor, tipografia e espaçamento parte da identidade visual oficial da Secretaria de Infraestrutura (infra-RN).

**Regra de ouro:** cor é semântica, não decorativa. Cada token tem um papel fixo — usá-lo fora do papel quebra a hierarquia visual.

---

## 2. Tokens de Cor

Definidos em `frontend/src/index.css` via `@theme`. Use sempre as classes utilitárias Tailwind geradas por eles — nunca escreva `#1B3C73` diretamente no JSX.

### 2.1 Brand — Azul Institucional

| Token | Classe Tailwind | Hex | Pantone | Uso |
|---|---|---|---|---|
| `brand-700` | `bg-brand-700` / `text-brand-700` | `#1B3C73` | 648 C | **Cor primária** — fundos de seção, botões principais, sidebar |
| `brand-500` | `bg-brand-500` / `text-brand-500` | `#2457A4` | — | Hover interativo de elementos brand |
| `brand-50` | `bg-brand-50` | `#EBF0F8` | — | Background de badges e cards de destaque |
| `brand-200` | `border-brand-200` | `#B8CAED` | — | Bordas de campos com foco |

**Padrão de botão primário:**
```tsx
className="bg-brand-700 text-white hover:bg-brand-500 shadow-brand-700/20 rounded-xl"
```

**Padrão de input com foco:**
```tsx
className="focus:border-brand-700 focus:ring-4 focus:ring-brand-700/10"
```

**Padrão de link de navegação:**
```tsx
className="text-brand-700 hover:text-brand-500"
```

---

### 2.2 Accent — Laranja Potiguar

| Token | Hex | Pantone | Uso |
|---|---|---|---|
| `accent-500` | `#C84918` | 1665 C | Acento de destaque — avatar de usuário, borda ativa do nav, badge de alerta crítico |
| `accent-50` | `#FEF0EB` | — | Background de mensagens de erro de formulário |
| `accent-700` | `#9A3412` | — | Texto de erro em fundo accent-50 |

> **Laranja ≠ botão destrutivo.** Para ações destrutivas use `rose-*`. Laranja é acento institucional.

**Active nav item (sidebar):**
```tsx
className="bg-white/10 text-white shadow-[inset_3px_0_0_0_#C84918]"
```

**Mensagem de erro de formulário:**
```tsx
className="bg-accent-50 text-accent-700 border border-accent-200"
```

---

### 2.3 Success — Verde RN

| Token | Hex | Pantone | Uso **permitido** |
|---|---|---|---|
| `success-500` | `#2A7A3E` | 7728 C | Badges de status CONCLUÍDA, APROVADA, VERDE saúde |
| `success-50` | `#E6F4EA` | — | Background de badges de sucesso |

> **Verde é semântico.** Só use para estados de conclusão/aprovação. Nunca como cor de ação primária.

Equivalência com classes Tailwind `emerald-*` do projeto:

| Estado semântico | Uso correto |
|---|---|
| Badge CONCLUÍDA / APROVADA | `bg-emerald-100 text-emerald-700` |
| Indicador saúde VERDE | `bg-emerald-400` |
| ART "Válida" | `bg-emerald-50 text-emerald-600` |
| `dentro_raio = true` | `text-emerald-600` |
| Coluna CONCLUÍDO (Kanban) | `bg-emerald-50 text-emerald-700` |
| Alerta "Resolvido" | `text-emerald-600 bg-emerald-50` |

---

### 2.4 Warning — Amarelo Potiguar

| Token | Hex | Pantone | Uso |
|---|---|---|---|
| `warning-500` | `#D9A812` | 7549 C | Badges PARALISADA, AMARELO saúde, alertas de atenção |
| `warning-50` | `#FEF8E6` | — | Background de badges de atenção |

---

### 2.5 Surface — Neutros do Sistema

| Token | Classe | Hex | Uso |
|---|---|---|---|
| `surface-50` | `bg-surface-50` | `#F3F5FA` | Background geral da aplicação |
| `surface-100` | — | `#FFFFFF` | Surface de cards e modais |
| `surface-200` | `border-surface-200` | `#DDE2EC` | Bordas de separação |
| `surface-600` | `text-surface-600` | `#6B7080` | Texto secundário / muted |
| `surface-950` | `text-surface-950` | `#1A1E2A` | Texto principal (quase preto) |

---

## 3. Hierarquia de Cores — Resumo

```
Azul (brand)   → Ação, navegação, CTA, foco de campo, gradientes de hero
Laranja (accent) → Acento institucional, avatar, borda ativa, erros de formulário
Verde (success)  → Estados de conclusão e aprovação APENAS
Amarelo (warning)→ Estados de atenção e alerta APENAS
Rose/Red         → Ações destrutivas, reprovações, erros críticos
Sky              → Informação secundária, ícones auxiliares
```

---

## 4. Tipografia

### Fontes

| Família | Variante | Peso | Uso |
|---|---|---|---|
| **Barlow Condensed** | `font-condensed` | 800 (`font-black`) | Logo, títulos de hero, sigla SIN-Obras |
| **Barlow** | `font-sans` (padrão) | 700 (`font-bold`) | Headings H2/H3 |
| **Barlow** | `font-sans` | 600 (`font-semibold`) | Labels de UI, botões, badges |
| **Barlow** | `font-sans` | 400 (`font-normal`) | Corpo de texto, descrições |

Importação em `frontend/index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Barlow+Condensed:wght@600;700;800&display=swap" rel="stylesheet" />
```

### Aplicação da fonte condensada

Barlow Condensed não está mapeada como `font-condensed` no Tailwind por limitação do v4 — use via `style` inline ou CSS:

```tsx
// Logo / título de hero
<span
  className="text-xl font-black tracking-wider text-white uppercase"
  style={{ fontFamily: "var(--font-condensed)" }}
>
  SIN-Obras
</span>
```

---

## 5. Motivo Stripe — Faixa Cromática

A faixa de quatro cores é o elemento mais reconhecível da identidade SIN/RN. Representa as cores do Rio Grande do Norte na ordem oficial.

**Ordem obrigatória:** Laranja → Verde → Amarelo → Azul  
**Nunca inverta ou altere a ordem.**

Classe utilitária definida em `index.css`:
```css
.sin-stripe {
  background: linear-gradient(
    to right,
    #C84918 25%,        /* Laranja Potiguar */
    #2A7A3E 25% 50%,    /* Verde RN         */
    #D9A812 50% 75%,    /* Amarelo Potiguar */
    #2457A4 75%         /* Azul Institucional */
  );
}
```

**Onde usar:**
- Rodapé do sistema: `<div className="h-0.5 w-full sin-stripe" />`
- Logo no sidebar: `<div className="h-1 w-6 sin-stripe rounded-full opacity-90" />`
- Topo da página de login (base do painel azul)

**Onde não usar:** botões, badges, links, ícones — a stripe é elemento de identidade corporativa, não de UI genérica.

---

## 6. Padrões de Componentes

### Botão Primário
```tsx
<button className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-700/20 hover:bg-brand-500 transition-all">
  Ação
</button>
```

### Botão Secundário
```tsx
<button className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
  Cancelar
</button>
```

### Botão Destrutivo
```tsx
<button className="px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-rose-200 transition-all">
  Excluir
</button>
```

### Input / Select
```tsx
<input className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all" />
```

### Badge de Status

| Status | Classes |
|---|---|
| CONCLUÍDA / APROVADA | `bg-emerald-100 text-emerald-700` |
| EM_EXECUCAO / ASSINADA | `bg-sky-100 text-sky-700` |
| PARALISADA / EM_FISCALIZACAO | `bg-amber-100 text-amber-700` |
| REPROVADA / RESCINDIDA | `bg-rose-100 text-rose-700` |
| PLANEJADA / RASCUNHO | `bg-slate-100 text-slate-600` |

### Card de Conteúdo
```tsx
<div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
  {/* conteúdo */}
</div>
```

### Hero de Página (gradiente brand)
```tsx
<div className="rounded-2xl bg-gradient-to-r from-brand-700 to-brand-500 p-8 text-white shadow-xl shadow-brand-700/20">
  <p className="text-sm font-medium text-white/70 mb-1">Subtítulo</p>
  <h2 className="text-3xl font-bold mb-2">Título Principal</h2>
</div>
```

### Modal
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
    {/* conteúdo */}
  </div>
</div>
```

---

## 7. Sidebar e Navegação

```
bg-brand-700        ← fundo da sidebar
bg-brand-800/60     ← cabeçalho com logo
border-white/10     ← separadores
bg-white/10         ← item ativo
shadow-[inset_3px_0_0_0_#C84918]  ← borda esquerda laranja no item ativo
bg-accent-500       ← avatar do usuário
hover:bg-accent-500/20  ← hover do botão "Sair"
```

O logo usa **Barlow Condensed 800** com um elemento `.sin-stripe` pequeno à esquerda:
```tsx
<div className="flex items-center gap-3">
  <div className="h-1 w-6 sin-stripe rounded-full opacity-90" />
  <span className="text-xl font-black tracking-wider text-white uppercase"
        style={{ fontFamily: "var(--font-condensed)" }}>
    SIN-Obras
  </span>
</div>
```

---

## 8. Página de Login

Estrutura de dois painéis:
- **Painel esquerdo** (`bg-brand-700`): logo + tagline + stripe na base
- **Painel direito** (`bg-surface-50`): formulário

```
hidden lg:flex  ← painel esquerdo, oculto em mobile
flex-1          ← painel direito, ocupa tela toda em mobile
```

---

## 9. Modo Escuro

O projeto usa a variante `dark:` do Tailwind (classe `.dark` no `<html>`). A identidade v3 **não define** paleta escura — o modo escuro usa os tokens `slate-*` do Tailwind como fallback:

```
dark:bg-slate-900/80   ← header / footer
dark:bg-slate-950      ← body
dark:border-slate-800  ← bordas
dark:text-slate-100    ← textos
```

Ao criar novos componentes, adicione variantes `dark:` para os elementos de fundo e texto principais.

---

## 10. Regras Proibidas

| ❌ Não faça | ✅ Faça |
|---|---|
| Usar `text-emerald-600` em botões de ação | `text-brand-700` |
| Usar `bg-emerald-600` em CTA primário | `bg-brand-700` |
| Escrever `#1B3C73` inline no JSX | `bg-brand-700` |
| Usar `accent` (laranja) como cor de botão | Reservar laranja para acento institucional |
| Inverter a ordem das cores da stripe | Sempre: laranja → verde → amarelo → azul |
| Usar `font-condensed` para corpo de texto | Só para logo e títulos de display |
| Aplicar `success-*` / `emerald-*` em links de navegação | `brand-*` |

---

## 11. Referências

| Arquivo | Conteúdo |
|---|---|
| `Docs/Identidade-Visual-SIN-RN-Completa/identidade-visual-sin-v3.html` | Brand guide completo — fonte canônica |
| `Docs/Identidade-Visual-SIN-RN-Completa/DESIGN-HANDOFF.md` | Handoff para design e dev |
| `Docs/Identidade-Visual-SIN-RN-Completa/DESIGN-MANIFEST.json` | Tokens em JSON (para ferramentas de design) |
| `frontend/src/index.css` | Tokens `@theme` e `.sin-stripe` |
| `frontend/index.html` | Import das fontes Google (Barlow) |
