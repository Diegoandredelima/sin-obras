import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  Search, Filter, X, Printer, FileText, FileBarChart,
  Building2, AlertTriangle, Loader2, SlidersHorizontal, Play, RefreshCw,
  Download, ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";
import api from "@/services/api";
import { fmtCurrency } from "@/utils/format";
import type { RelatorioObjetoRow } from "@/types";
import RelatorioDetalhePanel from "@/components/RelatorioDetalhePanel";

// ================================================================
// Constants
// ================================================================

const SITUACAO_OPTS = [
  { value: "", label: "Todas as situações" },
  { value: "EM_ANDAMENTO", label: "Em Andamento" },
  { value: "CONCLUIDA", label: "Concluída" },
  { value: "PARALISADA", label: "Paralisada" },
  { value: "A_INICIAR", label: "A Iniciar" },
  { value: "INACABADA", label: "Inacabada" },
  { value: "RESCINDIDA", label: "Rescindida" },
  { value: "ARQUIVADA", label: "Arquivada" },
];

const STATUS_OPTS = [
  { value: "", label: "Todos os status" },
  { value: "EM_EXECUCAO", label: "Em Execução" },
  { value: "PARALISADA", label: "Paralisada" },
  { value: "CONCLUIDA", label: "Concluída" },
  { value: "PLANEJADA", label: "Planejada" },
];

const SAUDE_OPTS = [
  { value: "VERDE", label: "Em dia", cls: "bg-emerald-50 text-emerald-700 border-emerald-300", dot: "bg-emerald-400" },
  { value: "AMARELO", label: "Atenção", cls: "bg-amber-50 text-amber-700 border-amber-300", dot: "bg-amber-400" },
  { value: "VERMELHO", label: "Crítico", cls: "bg-rose-50 text-rose-700 border-rose-300", dot: "bg-rose-400" },
];

const PERIODO_OPTS = [
  { value: "", label: "Todos os períodos" },
  { value: "T1", label: "1º Trimestre" },
  { value: "T2", label: "2º Trimestre" },
  { value: "T3", label: "3º Trimestre" },
  { value: "T4", label: "4º Trimestre" },
  { value: "S1", label: "1º Semestre" },
  { value: "S2", label: "2º Semestre" },
];

const LOTE_AVISO = 20;
const LOTE_MAX = 50;

const SITUACAO_BADGE: Record<string, { label: string; cls: string }> = {
  A_INICIAR:   { label: "A Iniciar",    cls: "bg-slate-100 text-slate-600" },
  EM_ANDAMENTO:{ label: "Em Andamento", cls: "bg-sky-100 text-sky-700" },
  PARALISADA:  { label: "Paralisada",   cls: "bg-amber-100 text-amber-700" },
  INACABADA:   { label: "Inacabada",    cls: "bg-orange-100 text-orange-700" },
  CONCLUIDA:   { label: "Concluída",    cls: "bg-emerald-100 text-emerald-700" },
  RESCINDIDA:  { label: "Rescindida",   cls: "bg-rose-100 text-rose-700" },
  ARQUIVADA:   { label: "Arquivada",    cls: "bg-slate-100 text-slate-400" },
};

const SAUDE_DOT: Record<string, string> = {
  VERDE: "bg-emerald-400", AMARELO: "bg-amber-400", VERMELHO: "bg-rose-400",
};

const SELECT_CLS =
  "rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm text-slate-700 focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all";

// ================================================================
// Types
// ================================================================

interface Filtros {
  search: string; situacao: string; status: string; municipio: string;
  orgao: string; empresa: string; saude: string; valorMin: string; valorMax: string;
  ano: string; periodo: string;
}

const FILTROS_VAZIOS: Filtros = {
  search: "", situacao: "", status: "", municipio: "", orgao: "", empresa: "",
  saude: "", valorMin: "", valorMax: "", ano: "", periodo: "",
};

type SortKey = "titulo" | "orgao" | "empresa" | "valor" | "situacao" | "percentual";
type SortDir = "asc" | "desc";

function toApiParams(f: Filtros): Record<string, string> {
  const p: Record<string, string> = {};
  if (f.search)   p.search    = f.search;
  if (f.situacao) p.situacao  = f.situacao;
  if (f.status)   p.status    = f.status;
  if (f.municipio)p.municipio = f.municipio;
  if (f.orgao)    p.orgao     = f.orgao;
  if (f.empresa)  p.empresa   = f.empresa;
  if (f.saude)    p.saude     = f.saude;
  if (f.valorMin) p.valor_min = f.valorMin;
  if (f.valorMax) p.valor_max = f.valorMax;
  if (f.ano)      p.ano       = f.ano;
  if (f.periodo)  p.periodo   = f.periodo;
  return p;
}

function fromUrlParams(sp: URLSearchParams): Filtros {
  return {
    search:   sp.get("search")    ?? "",
    situacao: sp.get("situacao")  ?? "",
    status:   sp.get("status")    ?? "",
    municipio:sp.get("municipio") ?? "",
    orgao:    sp.get("orgao")     ?? "",
    empresa:  sp.get("empresa")   ?? "",
    saude:    sp.get("saude")     ?? "",
    valorMin: sp.get("valor_min") ?? "",
    valorMax: sp.get("valor_max") ?? "",
    ano:      sp.get("ano")       ?? "",
    periodo:  sp.get("periodo")   ?? "",
  };
}

// ================================================================
// Sub-components
// ================================================================

const SortIcon = ({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey | null; sortDir: SortDir }) => {
  if (sortKey !== col) return <ChevronsUpDown className="h-3 w-3 opacity-25" />;
  return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
};

// ================================================================
// Component
// ================================================================

const Relatorio = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Inicializa draft e aplicado a partir da URL (persistência de filtros)
  const [draft, setDraft] = useState<Filtros>(() => fromUrlParams(searchParams));
  const [aplicado, setAplicado] = useState<Record<string, string> | null>(() => {
    const p = toApiParams(fromUrlParams(searchParams));
    return Object.keys(p).length > 0 ? p : null;
  });

  const [advancedOpen, setAdvancedOpen]   = useState(false);
  const [selecionadas, setSelecionadas]   = useState<Set<string>>(new Set());
  const [selectedRow, setSelectedRow]     = useState<RelatorioObjetoRow | null>(null);
  const [sortKey, setSortKey]             = useState<SortKey | null>(null);
  const [sortDir, setSortDir]             = useState<SortDir>("asc");

  const set = <K extends keyof Filtros>(k: K, v: Filtros[K]) => setDraft((d) => ({ ...d, [k]: v }));

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const draftParams  = useMemo(() => toApiParams(draft), [draft]);
  const draftFiltros = Object.keys(draftParams).length;
  const stale = aplicado !== null && JSON.stringify(draftParams) !== JSON.stringify(aplicado);

  // Anos disponíveis na base
  const { data: anosData } = useQuery<{ ano_min: number; ano_max: number }>({
    queryKey: ["rel-anos"],
    queryFn: async () => { const { data } = await api.get("/relatorios/anos"); return data; },
    staleTime: 30 * 60 * 1000,
  });
  const ANOS = useMemo(() => {
    if (!anosData) return [];
    return Array.from(
      { length: anosData.ano_max - anosData.ano_min + 1 },
      (_, i) => anosData.ano_min + i,
    ).reverse();
  }, [anosData]);

  // Empresas para dropdown
  const { data: empresasData } = useQuery<{ id: string; razao_social: string }[]>({
    queryKey: ["rel-empresas-lista"],
    queryFn: async () => { const { data } = await api.get("/relatorios/empresas-lista"); return data; },
    staleTime: 10 * 60 * 1000,
  });

  // Objetos filtradas
  const { data, isLoading, isError, isFetching } = useQuery<RelatorioObjetoRow[]>({
    queryKey: ["rel-builder", aplicado],
    queryFn: async () => {
      const { data } = await api.get("/relatorios/objetos", { params: aplicado ?? {} });
      return data;
    },
    enabled: aplicado !== null,
  });

  const objetos = data ?? [];
  const totalValor = objetos.reduce(
    (acc, o) => acc + Number(o.valor_final ?? o.valor_global ?? o.valor_contrato ?? 0), 0,
  );

  // Ordenação client-side
  const objetosOrdenadas = useMemo(() => {
    if (!sortKey) return objetos;
    return [...objetos].sort((a, b) => {
      let va: string | number = "";
      let vb: string | number = "";
      if (sortKey === "titulo")     { va = a.titulo ?? "";                    vb = b.titulo ?? ""; }
      if (sortKey === "orgao")      { va = a.orgao ?? "";                     vb = b.orgao ?? ""; }
      if (sortKey === "empresa")    { va = a.empresa_razao_social ?? "";       vb = b.empresa_razao_social ?? ""; }
      if (sortKey === "valor")      { va = Number(a.valor_final ?? a.valor_global ?? a.valor_contrato ?? 0); vb = Number(b.valor_final ?? b.valor_global ?? b.valor_contrato ?? 0); }
      if (sortKey === "situacao")   { va = a.situacao ?? "";                  vb = b.situacao ?? ""; }
      if (sortKey === "percentual") { va = Number(a.percentual_executado ?? 0); vb = Number(b.percentual_executado ?? 0); }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
  }, [objetos, sortKey, sortDir]);

  // Resumo por situação (cards)
  const resumoPorSituacao = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of objetos) {
      const sit = o.situacao ?? "—";
      counts[sit] = (counts[sit] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [objetos]);

  // ── Ações ──────────────────────────────────────────────────────

  function gerar() {
    setAplicado(draftParams);
    setSelecionadas(new Set());
    setSearchParams(draftParams);
  }

  function limparTudo() {
    setDraft(FILTROS_VAZIOS);
    setAplicado(null);
    setSelecionadas(new Set());
    setSearchParams({});
  }

  function toggleObjeto(id: string) {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleTodas() {
    setSelecionadas((prev) =>
      prev.size === objetos.length ? new Set() : new Set(objetos.map((o) => o.objeto_id)),
    );
  }

  function imprimirIndividuais() {
    const n = selecionadas.size;
    if (n === 0) return;
    if (n > LOTE_MAX) {
      alert(`Você selecionou ${n} objetos. O limite para impressão individual em lote é ${LOTE_MAX}.`);
      return;
    }
    if (n > LOTE_AVISO && !window.confirm(
      `Você selecionou ${n} objetos. Serão geradas ${n} páginas. Deseja continuar?`,
    )) return;
    window.open(`/relatorio/imprimir-objetos?ids=${[...selecionadas].join(",")}`, "_blank", "noopener");
  }

  function imprimir(modo: "resumido" | "completo") {
    const qs = new URLSearchParams({ modo, ...(aplicado ?? {}) });
    window.open(`/relatorio/imprimir?${qs.toString()}`, "_blank", "noopener");
  }

  async function exportarXlsx() {
    try {
      const response = await api.get("/relatorios/export-objetos", {
        params: aplicado ?? {},
        responseType: "blob",
      });
      const url  = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.download = `objetos_${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Erro ao exportar objetos.");
    }
  }

  const podeImprimir = aplicado !== null && objetos.length > 0 && !stale;

  // Header helper para colunas ordenáveis
  const Th = ({
    col, label, className = "",
  }: { col: SortKey; label: string; className?: string }) => (
    <th
      onClick={() => toggleSort(col)}
      className={`px-4 py-2.5 font-semibold cursor-pointer select-none hover:text-slate-700 transition-colors ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </th>
  );

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Relatórios</h2>
        <p className="text-sm text-slate-500 mt-0.5">Configure os filtros, gere o relatório e imprima.</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        {/* Busca */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-y-0 left-3 flex items-center h-full w-4 text-slate-400" />
            <input
              type="text"
              value={draft.search}
              onChange={(e) => set("search", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && gerar()}
              placeholder="Buscar por objeto, município, empresa ou nº de contrato..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm placeholder:text-slate-400 focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all"
            />
            {draft.search && (
              <button onClick={() => set("search", "")} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setAdvancedOpen((o) => !o)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all ${
              advancedOpen ? "bg-brand-50 text-brand-700 border-brand-200" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" /> Avançado
          </button>
        </div>

        {/* Filtros principais */}
        <div className="flex flex-wrap gap-3">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1.5">Situação</p>
            <select value={draft.situacao} onChange={(e) => set("situacao", e.target.value)} className={SELECT_CLS}>
              {SITUACAO_OPTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1.5">Ano</p>
            <select value={draft.ano} onChange={(e) => set("ano", e.target.value)} className={SELECT_CLS}>
              <option value="">Todos os anos</option>
              {ANOS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1.5">Período</p>
            <select value={draft.periodo} onChange={(e) => set("periodo", e.target.value)} className={SELECT_CLS}>
              {PERIODO_OPTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {/* Filtros avançados */}
        {advancedOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Status operacional</label>
              <select value={draft.status} onChange={(e) => set("status", e.target.value)} className={`w-full ${SELECT_CLS}`}>
                {STATUS_OPTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Saúde</label>
              <div className="flex flex-wrap gap-1.5">
                {SAUDE_OPTS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => set("saude", draft.saude === s.value ? "" : s.value)}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${
                      draft.saude === s.value ? s.cls : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Município</label>
              <input type="text" value={draft.municipio} onChange={(e) => set("municipio", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && gerar()}
                placeholder="Ex: Natal, Mossoró..." className={`w-full ${SELECT_CLS}`} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Órgão</label>
              <input type="text" value={draft.orgao} onChange={(e) => set("orgao", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && gerar()}
                placeholder="Ex: SEEC, DER..." className={`w-full ${SELECT_CLS}`} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Empresa</label>
              <select value={draft.empresa} onChange={(e) => set("empresa", e.target.value)} className={`w-full ${SELECT_CLS}`}>
                <option value="">Todas as empresas</option>
                {(empresasData ?? []).map((e) => (
                  <option key={e.id} value={e.razao_social}>{e.razao_social}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">Faixa de valor (R$)</label>
              <div className="flex items-center gap-2">
                <input type="number" value={draft.valorMin} onChange={(e) => set("valorMin", e.target.value)}
                  placeholder="mín." className={`w-full ${SELECT_CLS}`} />
                <span className="text-slate-400">–</span>
                <input type="number" value={draft.valorMax} onChange={(e) => set("valorMax", e.target.value)}
                  placeholder="máx." className={`w-full ${SELECT_CLS}`} />
              </div>
            </div>
          </div>
        )}

        {/* Ação principal */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            {draftFiltros > 0 ? `${draftFiltros} filtro(s) selecionado(s)` : "Nenhum filtro — gera todas as objetos"}
            {draftFiltros > 0 && (
              <button onClick={limparTudo} className="ml-3 text-slate-400 hover:text-slate-600 underline">limpar</button>
            )}
          </span>
          <button
            onClick={gerar}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-700/20 hover:bg-brand-500 disabled:opacity-60 transition-all"
          >
            {isFetching
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : stale ? <RefreshCw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {aplicado === null ? "Gerar relatório" : stale ? "Atualizar relatório" : "Gerar relatório"}
          </button>
        </div>
      </div>

      {/* Estado inicial */}
      {aplicado === null ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
          <FileBarChart className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-base font-semibold text-slate-600">Configure os filtros e clique em "Gerar relatório"</p>
          <p className="text-sm text-slate-400 mt-1">A pré-visualização e a impressão aparecem aqui após a geração.</p>
        </div>
      ) : (
        <>
          {/* Barra de resumo */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-brand-50/60 border border-brand-100 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-6 text-sm flex-wrap">
              <span className="text-slate-600">
                <span className="font-bold text-slate-900">{isLoading ? "…" : objetos.length}</span> objeto(s)
              </span>
              <span className="text-slate-600">
                Total: <span className="font-bold text-slate-900">{fmtCurrency(totalValor)}</span>
              </span>
              {stale && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                  <RefreshCw className="h-3 w-3" /> filtros alterados — gere novamente
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={exportarXlsx}
                disabled={!podeImprimir}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Exportar lista filtrada para XLSX"
              >
                <Download className="h-4 w-4" /> Exportar XLSX
              </button>
              <button
                onClick={imprimirIndividuais}
                disabled={selecionadas.size === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Imprime o relatório individual de cado objeto selecionada"
              >
                <Printer className="h-4 w-4" /> Imprimir individuais{selecionadas.size > 0 ? ` (${selecionadas.size})` : ""}
              </button>
              <button
                onClick={() => imprimir("resumido")}
                disabled={!podeImprimir}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <FileText className="h-4 w-4" /> Imprimir Resumido
              </button>
              <button
                onClick={() => imprimir("completo")}
                disabled={!podeImprimir}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-700/20 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <FileBarChart className="h-4 w-4" /> Imprimir Completo
              </button>
            </div>
          </div>

          {/* Cards de resumo por situação */}
          {!isLoading && resumoPorSituacao.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {resumoPorSituacao.map(([sit, count]) => {
                const badge = SITUACAO_BADGE[sit];
                return (
                  <span
                    key={sit}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer transition-all ${
                      badge?.cls ?? "bg-slate-100 text-slate-600"
                    } ${draft.situacao === sit ? "ring-2 ring-offset-1 ring-current" : "hover:opacity-80"}`}
                    onClick={() => {
                      set("situacao", draft.situacao === sit ? "" : sit);
                    }}
                    title="Clique para filtrar por esta situação"
                  >
                    <span className="font-bold text-sm">{count}</span>
                    {badge?.label ?? sit}
                  </span>
                );
              })}
            </div>
          )}

          {/* Aviso de seleção para lote */}
          {selecionadas.size > 0 && (
            <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm ${
              selecionadas.size > LOTE_MAX
                ? "bg-rose-50 border-rose-200 text-rose-700"
                : selecionadas.size > LOTE_AVISO
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "bg-slate-50 border-slate-200 text-slate-600"
            }`}>
              <span className="flex items-center gap-2">
                {selecionadas.size > LOTE_AVISO && <AlertTriangle className="h-4 w-4 shrink-0" />}
                <span>
                  <span className="font-semibold">{selecionadas.size}</span> objeto(s) selecionada(s) para impressão individual
                  {selecionadas.size > LOTE_MAX
                    ? ` — acima do limite de ${LOTE_MAX}. Use "Imprimir Completo".`
                    : selecionadas.size > LOTE_AVISO
                      ? ` — gerará ${selecionadas.size} páginas; pode demorar.`
                      : "."}
                </span>
              </span>
              <button onClick={() => setSelecionadas(new Set())} className="text-xs underline hover:no-underline shrink-0">
                limpar seleção
              </button>
            </div>
          )}

          {/* Tabela */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Pré-visualização</h3>
              <Filter className="h-4 w-4 text-slate-300" />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-7 w-7 text-slate-300 animate-spin" />
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <AlertTriangle className="h-10 w-10 text-rose-300 mb-3" />
                <p className="text-sm font-medium text-slate-500">Erro ao carregar dados.</p>
                <p className="text-xs text-slate-400 mt-1">Verifique se a migração da view foi aplicada (alembic upgrade head).</p>
              </div>
            ) : objetos.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <Building2 className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-500">Nenhum objeto encontrada para os filtros</p>
                <button onClick={limparTudo} className="mt-3 text-xs text-brand-700 hover:text-brand-500">Limpar filtros</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
                      <th className="px-4 py-2.5 font-semibold w-10">
                        <input
                          type="checkbox"
                          checked={objetos.length > 0 && selecionadas.size === objetos.length}
                          ref={(el) => { if (el) el.indeterminate = selecionadas.size > 0 && selecionadas.size < objetos.length; }}
                          onChange={toggleTodas}
                          className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-700/30 cursor-pointer"
                          title="Selecionar todas"
                        />
                      </th>
                      <Th col="titulo"     label="Objeto" />
                      <Th col="orgao"      label="Órgão"   className="hidden md:table-cell" />
                      <Th col="empresa"    label="Empresa" className="hidden lg:table-cell" />
                      <Th col="valor"      label="Valor"   className="text-right" />
                      <Th col="situacao"   label="Situação" className="hidden sm:table-cell" />
                      <Th col="percentual" label="% Exec." className="text-right hidden md:table-cell" />
                      <th className="px-4 py-2.5 font-semibold w-24" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {objetosOrdenadas.map((o) => {
                      const sit = o.situacao ? SITUACAO_BADGE[o.situacao] : null;
                      return (
                        <tr
                          key={o.objeto_id}
                          onClick={() => setSelectedRow(o)}
                          className={`cursor-pointer hover:bg-slate-50/70 transition-colors ${selecionadas.has(o.objeto_id) ? "bg-brand-50/40" : ""}`}
                        >
                          {/* Checkbox — stopPropagation para não abrir o painel */}
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selecionadas.has(o.objeto_id)}
                              onChange={() => toggleObjeto(o.objeto_id)}
                              className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-700/30 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full shrink-0 ${SAUDE_DOT[o.saude || "VERDE"] || "bg-slate-300"}`} />
                              <div className="min-w-0">
                                <p className="font-medium text-slate-800 truncate max-w-[260px]">{o.titulo}</p>
                                {o.municipio && <p className="text-xs text-slate-400">{o.municipio}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{o.orgao || "—"}</td>
                          <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">
                            <span className="truncate block max-w-[200px]" title={o.empresa_razao_social || ""}>
                              {o.empresa_razao_social || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-700 whitespace-nowrap">
                            {fmtCurrency(o.valor_final ?? o.valor_global ?? o.valor_contrato)}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            {sit
                              ? <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sit.cls}`}>{sit.label}</span>
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 hidden md:table-cell">
                            {Number(o.percentual_executado ?? 0).toFixed(0)}%
                          </td>
                          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedRow(o)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-all"
                            >
                              Detalhes
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {selectedRow && (
        <RelatorioDetalhePanel
          row={selectedRow}
          onClose={() => setSelectedRow(null)}
        />
      )}
    </div>
  );
};

export default Relatorio;
