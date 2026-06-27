/**
 * CadastrarOrcamento — rota /orcamentos/novo
 *
 * Builder do orçamento-template (banco de dados técnico): cabeçalho (Bloco 1),
 * EAP Meta→Submeta (Bloco 2), eventos/serviços (Bloco 3) e memória de cálculo +
 * critério de medição por evento (Bloco 4, retrátil). No orçamento o valor é o
 * CUSTO DIRETO; o BDI é só informado aqui e embutido no preço ao vincular a um
 * objeto. O critério de medição é obrigatório em todo evento.
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Calculator, ArrowLeft, Plus, Trash2, Loader2, CheckCircle2, AlertCircle,
  ChevronDown, ChevronRight, Ruler, Target, Layers,
} from "lucide-react";
import { AxiosError } from "axios";
import api from "@/services/api";
import { fmtCurrency } from "@/utils/format";

// ─── Tipos de formulário ─────────────────────────────────────────────────────
interface MemLinha {
  descricao: string; comprimento: string; largura: string; altura: string; percentual: string; n_repeticoes: string;
}
interface EventoForm {
  codigo_referencia: string; descricao: string; unidade: string; quantidade: string;
  valor_unitario: string; criterio_medicao: string; memoria: MemLinha[]; memoriaAberta: boolean;
}
interface SubmetaForm { descricao: string; eventos: EventoForm[] }
interface MetaForm { descricao: string; submetas: SubmetaForm[] }

const novaMem = (): MemLinha => ({ descricao: "", comprimento: "", largura: "", altura: "", percentual: "", n_repeticoes: "1" });
const novoEvento = (): EventoForm => ({ codigo_referencia: "", descricao: "", unidade: "un", quantidade: "", valor_unitario: "", criterio_medicao: "", memoria: [], memoriaAberta: false });
const novaSubmeta = (): SubmetaForm => ({ descricao: "", eventos: [novoEvento()] });
const novaMeta = (): MetaForm => ({ descricao: "", submetas: [novaSubmeta()] });

function calcMem(l: MemLinha): number {
  if (l.comprimento === "" && l.largura === "" && l.altura === "") return 0;
  const f = (v: string) => (v === "" ? 1 : Number(v) || 0);
  const pct = l.percentual === "" ? 1 : (Number(l.percentual) || 0) / 100;
  return f(l.comprimento) * f(l.largura) * f(l.altura) * f(l.n_repeticoes) * pct;
}
const memTotal = (linhas: MemLinha[]) => linhas.reduce((s, l) => s + calcMem(l), 0);

const inputCls = "block w-full rounded-lg border border-slate-200 bg-white py-2 px-2.5 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/10 transition-all";

const CadastrarOrcamento = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Bloco 1 — cabeçalho
  const [titulo, setTitulo] = useState("");
  const [dataBase, setDataBase] = useState(""); // YYYY-MM (input month)
  const [bdi, setBdi] = useState("0");
  const [descricao, setDescricao] = useState("");

  // Bloco 2/3 — EAP
  const [metas, setMetas] = useState<MetaForm[]>([novaMeta()]);

  const bdiNum = Number(bdi || 0);
  const fator = 1 + bdiNum / 100;

  // ── Updaters imutáveis ──
  const updMetas = (fn: (m: MetaForm[]) => MetaForm[]) => setMetas((prev) => fn(prev.map((m) => ({ ...m, submetas: m.submetas.map((s) => ({ ...s, eventos: s.eventos.map((e) => ({ ...e, memoria: [...e.memoria] })) })) }))));

  const setEvento = (mi: number, si: number, ei: number, patch: Partial<EventoForm>) =>
    updMetas((ms) => { ms[mi].submetas[si].eventos[ei] = { ...ms[mi].submetas[si].eventos[ei], ...patch }; return ms; });
  const setMem = (mi: number, si: number, ei: number, li: number, patch: Partial<MemLinha>) =>
    updMetas((ms) => { ms[mi].submetas[si].eventos[ei].memoria[li] = { ...ms[mi].submetas[si].eventos[ei].memoria[li], ...patch }; return ms; });

  const handleSalvar = async () => {
    setApiError("");
    if (!titulo.trim()) { setApiError("Informe o título do orçamento."); return; }
    // Critério obrigatório em todo evento com descrição.
    for (const m of metas) for (const s of m.submetas) for (const e of s.eventos) {
      if (e.descricao.trim() && !e.criterio_medicao.trim()) {
        setApiError(`O serviço "${e.descricao}" precisa de um critério de medição.`);
        return;
      }
    }
    setSalvando(true);
    try {
      const payload = {
        titulo,
        data_base: dataBase ? `${dataBase}-01` : null,
        bdi_percentual: bdiNum,
        descricao: descricao || null,
        metas: metas
          .filter((m) => m.descricao.trim())
          .map((m, ordem) => ({
            descricao: m.descricao,
            ordem,
            submetas: m.submetas.filter((s) => s.descricao.trim()).map((s) => ({
              descricao: s.descricao,
              eventos: s.eventos.filter((e) => e.descricao.trim()).map((e) => ({
                codigo_referencia: e.codigo_referencia || null,
                descricao: e.descricao,
                unidade: e.unidade || "un",
                quantidade: Number(e.quantidade || 0),
                valor_unitario: Number(e.valor_unitario || 0),
                criterio_medicao: e.criterio_medicao,
                memoria: e.memoria.filter((l) => calcMem(l) > 0).map((l, o) => ({
                  ordem: o,
                  descricao: l.descricao || null,
                  comprimento: l.comprimento === "" ? null : Number(l.comprimento),
                  largura: l.largura === "" ? null : Number(l.largura),
                  altura: l.altura === "" ? null : Number(l.altura),
                  percentual: l.percentual === "" ? null : Number(l.percentual),
                  n_repeticoes: l.n_repeticoes === "" ? 1 : Number(l.n_repeticoes),
                  quantidade: Number(calcMem(l).toFixed(4)),
                })),
              })),
            })),
          })),
      };
      const { data } = await api.post("/orcamentos", payload);
      queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
      navigate(`/orcamentos`);
      void data;
    } catch (err) {
      const ax = err as AxiosError<{ detail?: unknown }>;
      const det = ax.response?.data?.detail;
      setApiError(typeof det === "string" ? det : "Erro ao salvar o orçamento.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <Link to="/orcamentos" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700 transition-colors">
        <ArrowLeft className="h-4 w-4" />Voltar para Orçamentos
      </Link>

      <div className="flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
          <Calculator className="h-6 w-6 text-brand-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Novo Orçamento</h1>
          <p className="text-sm text-slate-500">Banco de dados técnico — gera um código (ORC-AAAA-NNNN) para vincular ao objeto.</p>
        </div>
      </div>

      {apiError && (
        <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl p-3">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          <p className="text-sm text-rose-700">{apiError}</p>
        </div>
      )}

      {/* Bloco 1 — Cabeçalho */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-800">1. Dados Gerais</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Título do Orçamento *</label>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Orçamento Padrão – Escola Modelo" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Data-Base (mês/ano)</label>
            <input type="month" value={dataBase} onChange={(e) => setDataBase(e.target.value)} className={inputCls} />
            <p className="text-xs text-slate-400">Referência dos preços (marco legal para reajuste futuro).</p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Taxa de BDI (%)</label>
            <input type="number" step="0.01" min="0" value={bdi} onChange={(e) => setBdi(e.target.value)} className={inputCls} />
            <p className="text-xs text-slate-400">Embutido no preço unitário ao vincular o orçamento a um objeto.</p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Descrição / Observações</label>
            <textarea rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} className={inputCls + " resize-none"} />
          </div>
        </div>
      </div>

      {/* Bloco 2/3 — EAP */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">2. Estrutura (EAP) e Serviços</h2>
          <button onClick={() => updMetas((ms) => [...ms, novaMeta()])} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-3 py-1.5 rounded-xl">
            <Plus className="h-3.5 w-3.5" /> Adicionar meta
          </button>
        </div>

        {metas.map((meta, mi) => (
          <div key={mi} className="rounded-xl border border-slate-200 p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-brand-600 shrink-0" />
              <input value={meta.descricao} placeholder={`Meta ${mi + 1} (ex.: 1.0 – Superestrutura)`} onChange={(e) => updMetas((ms) => { ms[mi].descricao = e.target.value; return ms; })} className={inputCls + " font-semibold"} />
              {metas.length > 1 && (
                <button onClick={() => updMetas((ms) => ms.filter((_, i) => i !== mi))} className="text-slate-300 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
              )}
            </div>

            {meta.submetas.map((sub, si) => (
              <div key={si} className="ml-4 rounded-lg border border-slate-100 bg-slate-50/60 p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                  <input value={sub.descricao} placeholder={`Submeta ${mi + 1}.${si + 1} (ex.: Alvenaria)`} onChange={(e) => updMetas((ms) => { ms[mi].submetas[si].descricao = e.target.value; return ms; })} className={inputCls} />
                  {meta.submetas.length > 1 && (
                    <button onClick={() => updMetas((ms) => { ms[mi].submetas = ms[mi].submetas.filter((_, i) => i !== si); return ms; })} className="text-slate-300 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  )}
                </div>

                {/* Bloco 3 — eventos */}
                {sub.eventos.map((ev, ei) => {
                  const qtd = Number(ev.quantidade || 0);
                  const vu = Number(ev.valor_unitario || 0);
                  const total = qtd * vu;
                  const totalComBdi = total * fator;
                  return (
                    <div key={ei} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                      <div className="grid grid-cols-12 gap-2">
                        <input value={ev.codigo_referencia} placeholder="Código (SINAPI)" onChange={(e) => setEvento(mi, si, ei, { codigo_referencia: e.target.value })} className={inputCls + " col-span-6 sm:col-span-3"} />
                        <input value={ev.descricao} placeholder="Descrição do serviço" onChange={(e) => setEvento(mi, si, ei, { descricao: e.target.value })} className={inputCls + " col-span-6 sm:col-span-6"} />
                        <input value={ev.unidade} placeholder="Und" onChange={(e) => setEvento(mi, si, ei, { unidade: e.target.value })} className={inputCls + " col-span-3 sm:col-span-1"} />
                        <div className="col-span-9 sm:col-span-2 flex items-center justify-end gap-1">
                          {sub.eventos.length > 1 && (
                            <button onClick={() => updMetas((ms) => { ms[mi].submetas[si].eventos = ms[mi].submetas[si].eventos.filter((_, i) => i !== ei); return ms; })} className="text-slate-300 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                          )}
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <label className="text-[10px] text-slate-400">Quantidade</label>
                          <input type="number" step="any" value={ev.quantidade} onChange={(e) => setEvento(mi, si, ei, { quantidade: e.target.value })} className={inputCls} />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <label className="text-[10px] text-slate-400">Custo unit. (R$)</label>
                          <input type="number" step="any" value={ev.valor_unitario} onChange={(e) => setEvento(mi, si, ei, { valor_unitario: e.target.value })} className={inputCls} />
                        </div>
                        <div className="col-span-4 sm:col-span-3 text-right">
                          <label className="text-[10px] text-slate-400">Total (custo)</label>
                          <p className="text-sm font-semibold text-slate-700 py-1.5">{fmtCurrency(total)}</p>
                        </div>
                        <div className="col-span-12 sm:col-span-5 text-right">
                          <label className="text-[10px] text-slate-400">Total c/ BDI ({bdiNum}%)</label>
                          <p className="text-sm font-semibold text-brand-700 py-1.5">{fmtCurrency(totalComBdi)}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-slate-500">Critério de medição *</label>
                        <input value={ev.criterio_medicao} placeholder='Ex.: "Área líquida, descontando vãos de portas e janelas"' onChange={(e) => setEvento(mi, si, ei, { criterio_medicao: e.target.value })} className={inputCls} />
                      </div>

                      {/* Bloco 4 — memória de cálculo (retrátil) */}
                      <button type="button" onClick={() => setEvento(mi, si, ei, { memoriaAberta: !ev.memoriaAberta })} className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-brand-700">
                        {ev.memoriaAberta ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        <Ruler className="h-3.5 w-3.5" /> Memória de cálculo
                        {ev.memoria.length > 0 && <span className="text-slate-400">({ev.memoria.length})</span>}
                      </button>
                      {ev.memoriaAberta && (
                        <div className="rounded-lg bg-slate-50 border border-slate-100 p-2 space-y-1.5">
                          {ev.memoria.length === 0 && <p className="text-[10px] text-slate-400">Adicione linhas (C/P × L × H × N × %).</p>}
                          {ev.memoria.map((l, li) => (
                            <div key={li} className="flex flex-wrap items-center gap-1.5">
                              <input value={l.descricao} placeholder="Descrição" onChange={(e) => setMem(mi, si, ei, li, { descricao: e.target.value })} className="flex-1 min-w-[110px] text-[11px] rounded border border-slate-200 px-1.5 py-1 focus:outline-none focus:border-brand-700" />
                              <input type="number" step="any" value={l.comprimento} placeholder="C/P" onChange={(e) => setMem(mi, si, ei, li, { comprimento: e.target.value })} className="w-14 text-[11px] rounded border border-slate-200 px-1.5 py-1 focus:outline-none focus:border-brand-700" />
                              <input type="number" step="any" value={l.largura} placeholder="L" onChange={(e) => setMem(mi, si, ei, li, { largura: e.target.value })} className="w-12 text-[11px] rounded border border-slate-200 px-1.5 py-1 focus:outline-none focus:border-brand-700" />
                              <input type="number" step="any" value={l.altura} placeholder="H" onChange={(e) => setMem(mi, si, ei, li, { altura: e.target.value })} className="w-12 text-[11px] rounded border border-slate-200 px-1.5 py-1 focus:outline-none focus:border-brand-700" />
                              <input type="number" step="any" value={l.n_repeticoes} placeholder="N" onChange={(e) => setMem(mi, si, ei, li, { n_repeticoes: e.target.value })} className="w-12 text-[11px] rounded border border-slate-200 px-1.5 py-1 focus:outline-none focus:border-brand-700" />
                              <input type="number" step="any" value={l.percentual} placeholder="%" onChange={(e) => setMem(mi, si, ei, li, { percentual: e.target.value })} className="w-12 text-[11px] rounded border border-slate-200 px-1.5 py-1 focus:outline-none focus:border-brand-700" />
                              <span className="w-14 text-right text-[11px] font-semibold text-slate-600">{Number(calcMem(l).toFixed(4))}</span>
                              <button type="button" onClick={() => updMetas((ms) => { ms[mi].submetas[si].eventos[ei].memoria = ms[mi].submetas[si].eventos[ei].memoria.filter((_, j) => j !== li); return ms; })} className="text-slate-300 hover:text-rose-500 text-[10px]">✕</button>
                            </div>
                          ))}
                          <div className="flex items-center justify-between">
                            <button type="button" onClick={() => updMetas((ms) => { ms[mi].submetas[si].eventos[ei].memoria.push(novaMem()); return ms; })} className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-700 hover:text-brand-500"><Plus className="h-3 w-3" /> Adicionar linha</button>
                            {ev.memoria.length > 0 && (
                              <div className="flex items-center gap-2 text-[10px]">
                                <span className="text-slate-500">Total: <b className="text-slate-700">{Number(memTotal(ev.memoria).toFixed(4))}</b></span>
                                <button type="button" onClick={() => setEvento(mi, si, ei, { quantidade: String(Number(memTotal(ev.memoria).toFixed(4))) })} className="font-semibold text-brand-700 hover:underline">Aplicar à quantidade</button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <button onClick={() => updMetas((ms) => { ms[mi].submetas[si].eventos.push(novoEvento()); return ms; })} className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-500"><Plus className="h-3.5 w-3.5" /> Adicionar serviço</button>
              </div>
            ))}

            <button onClick={() => updMetas((ms) => { ms[mi].submetas.push(novaSubmeta()); return ms; })} className="ml-4 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:text-brand-500"><Plus className="h-3.5 w-3.5" /> Adicionar submeta</button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button onClick={() => navigate("/orcamentos")} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">Cancelar</button>
        <button onClick={handleSalvar} disabled={salvando} className="inline-flex items-center gap-2 px-8 py-2.5 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-700/20 transition-all disabled:opacity-50">
          {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Salvar Orçamento
        </button>
      </div>
    </div>
  );
};

export default CadastrarOrcamento;
