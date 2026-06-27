import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, Plus, Trash2, Camera, Shield, Loader2, CheckCircle2,
  ArrowLeft, AlertCircle, Ruler, ChevronDown, ChevronRight, CalendarDays,
} from "lucide-react";
import api from "@/services/api";
import { fmtCurrency } from "@/utils/format";
import { useAuthStore } from "@/store/auth";

interface EventoOpt {
  id: string;
  descricao: string;
  unidade: string;
  valor_unitario: string;
  quantidade: string;
}

// Linha da memória de cálculo: C/P × L × H × N (ajustada por %) = quantidade.
interface MemoriaLinhaForm {
  descricao: string;
  comprimento: string; // C/P
  largura: string;     // L
  altura: string;      // H
  percentual: string;  // %
  n_repeticoes: string; // N
}

const novaMemoriaLinha = (): MemoriaLinhaForm => ({
  descricao: "", comprimento: "", largura: "", altura: "", percentual: "", n_repeticoes: "1",
});

/** Quantidade resultante de uma linha de memória (área/volume). */
function calcLinhaQtd(l: MemoriaLinhaForm): number {
  // Sem nenhuma dimensão preenchida, a linha não contribui.
  if (l.comprimento === "" && l.largura === "" && l.altura === "") return 0;
  const f = (v: string) => (v === "" ? 1 : Number(v) || 0);
  const pct = l.percentual === "" ? 1 : (Number(l.percentual) || 0) / 100;
  return f(l.comprimento) * f(l.largura) * f(l.altura) * f(l.n_repeticoes) * pct;
}

const memoriaTotal = (linhas: MemoriaLinhaForm[]) =>
  linhas.reduce((s, l) => s + calcLinhaQtd(l), 0);

interface ItemLinha {
  evento_id: string;
  quantidade_periodo: string;
  desconto_vaos: string;
  observacao: string;
  memoria: MemoriaLinhaForm[];
}

interface BoletimItem {
  id: string;
  evento_id: string;
  descricao: string | null;
  unidade: string | null;
  quantidade_periodo: string;
  desconto_vaos: string;
  valor_unitario: string;
  valor_bruto: string;
  acumulado_anterior: string;
  acumulado_atual: string;
  total_contratado: string;
  saldo: string;
}

interface Boletim {
  medicao_id: string;
  numero_medicao: number;
  status: string;
  percentual_retencao: string;
  itens: BoletimItem[];
  valor_bruto_total: string;
  valor_faturamento_direto: string;
  retencao: string;
  valor_liquido: string;
}

interface MedicaoCriada {
  id: string;
  numero_medicao: number;
  itens: { id: string; evento_id: string }[];
}

const NovaMedicao = () => {
  const { objetoId } = useParams<{ objetoId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isFiscal = user?.tipo !== "EMPRESA";

  // --- Cabeçalho ---
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [retencao, setRetencao] = useState("0");
  const [faturamentoDireto, setFaturamentoDireto] = useState("0");
  const [itens, setItens] = useState<ItemLinha[]>([
    { evento_id: "", quantidade_periodo: "", desconto_vaos: "0", observacao: "", memoria: [] },
  ]);
  const [memoriaAberta, setMemoriaAberta] = useState<Record<number, boolean>>({});

  // --- Estado pós-criação (rascunho) ---
  const [medicao, setMedicao] = useState<MedicaoCriada | null>(null);
  const [boletim, setBoletim] = useState<Boletim | null>(null);
  const [fotos, setFotos] = useState<Record<string, string>>({}); // item_id -> filename
  const [fotoMeta, setFotoMeta] = useState<Record<string, { titulo: string; descricao: string }>>({}); // item_id -> legenda
  const [error, setError] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  const { data: eventos = [] } = useQuery<EventoOpt[]>({
    queryKey: ["cronograma-eventos", objetoId],
    queryFn: async () => {
      const { data } = await api.get(`/cronograma/objetos/${objetoId}/metas`);
      const flat: EventoOpt[] = [];
      for (const meta of data) {
        for (const sub of meta.submetas || []) {
          for (const ev of sub.eventos || []) flat.push(ev);
        }
      }
      return flat;
    },
    enabled: !!objetoId,
  });

  // Previsão do cronograma ativo (para o botão "Preencher conforme previsto")
  // O período = número da próxima medição. Buscamos pelo endpoint de previsão.
  const [previsaoUsada, setPrevisaoUsada] = useState(false);
  const [previsaoPeriodo, setPrevisaoPeriodo] = useState<number | null>(null);

  // Detecta quantas medições já existem para descobrir o próximo número
  const { data: medicoesExistentes = [] } = useQuery<{ id: string; numero_medicao: number }[]>({
    queryKey: ["medicoes-list", objetoId],
    queryFn: async (): Promise<{ id: string; numero_medicao: number }[]> => {
      const { data } = await api.get(`/empresa/objetos/${objetoId}/medicoes`);
      return (Array.isArray(data) ? data : (data?.items ?? [])) as { id: string; numero_medicao: number }[];
    },
    enabled: !!objetoId,
  });

  // Sincroniza o período após carregar as medições
  useEffect(() => {
    if (previsaoPeriodo === null && medicoesExistentes.length >= 0) {
      const maxNum = medicoesExistentes.reduce(
        (max: number, m: { numero_medicao: number }) => Math.max(max, m.numero_medicao),
        0
      );
      setPrevisaoPeriodo(maxNum + 1);
    }
  }, [medicoesExistentes, previsaoPeriodo]);


  const previsaoPeriodoFinal = previsaoPeriodo ?? (medicoesExistentes.reduce((max, m) => Math.max(max, m.numero_medicao), 0) + 1);

  const { data: previsaoCronograma } = useQuery<{
    periodo: number;
    versao_id?: string;
    parcelas: { evento_id: string; quantidade_prevista: string }[];
  }>({
    queryKey: ["cronograma-previsao", objetoId, previsaoPeriodoFinal],
    queryFn: async () => {
      const { data } = await api.get(`/cronograma/objetos/${objetoId}/previsao?periodo=${previsaoPeriodoFinal}`);
      return data;
    },
    enabled: !!objetoId && previsaoPeriodoFinal > 0,
  });

  const handlePreencherPrevisto = () => {
    if (!previsaoCronograma || previsaoCronograma.parcelas.length === 0) return;
    // Monta os itens a partir das parcelas do cronograma
    const novosItens = previsaoCronograma.parcelas
      .filter((p) => eventoById[p.evento_id]) // só os eventos que existem
      .map((p) => ({
        evento_id: p.evento_id,
        quantidade_periodo: String(p.quantidade_prevista),
        desconto_vaos: "0",
        observacao: "",
        memoria: [],
      }));
    if (novosItens.length > 0) {
      setItens(novosItens);
      setPrevisaoUsada(true);
    }
  };

  const eventoById = useMemo(
    () => Object.fromEntries(eventos.map((e) => [e.id, e])),
    [eventos]
  );

  // Previsto do período por evento (para os alertas de desvio).
  const previstoByEvento = useMemo<Record<string, number>>(
    () => Object.fromEntries(
      (previsaoCronograma?.parcelas ?? []).map((p) => [p.evento_id, Number(p.quantidade_prevista)])
    ),
    [previsaoCronograma]
  );

  // Diagnóstico por item: trava de lançamento (Decisão 1) + alerta de desvio
  // (Passo 4). A trava é client-side para feedback imediato; o servidor é a
  // autoridade final. O alerta compara o líquido lançado com o previsto do período.
  const diagnosticos = useMemo(
    () => itens.map((it) => {
      const ev = eventoById[it.evento_id];
      if (!ev || it.quantidade_periodo === "") {
        return { travaErro: null as string | null, alerta: null as { tipo: "abaixo" | "excedente"; msg: string } | null };
      }
      const contratado = Number(ev.quantidade);
      const liquido = Number(it.quantidade_periodo || 0) - Number(it.desconto_vaos || 0);
      let travaErro: string | null = null;
      if (Number(it.quantidade_periodo) < 0 || liquido < 0) {
        travaErro = "Quantidade negativa não é permitida.";
      } else if (contratado > 0 && liquido > contratado) {
        travaErro = `Quantidade superior ao saldo contratado (${contratado} ${ev.unidade}).`;
      }
      let alerta: { tipo: "abaixo" | "excedente"; msg: string } | null = null;
      const previsto = previstoByEvento[it.evento_id];
      if (!travaErro && previsto !== undefined && previsto > 0 && liquido > 0) {
        if (liquido < previsto) {
          alerta = { tipo: "abaixo", msg: `Medição abaixo do previsto (${previsto} ${ev.unidade}) para o período.` };
        } else if (liquido > previsto) {
          alerta = { tipo: "excedente", msg: `Medição excedente acima do previsto (${previsto} ${ev.unidade}) para o período.` };
        }
      }
      return { travaErro, alerta };
    }),
    [itens, eventoById, previstoByEvento]
  );

  const temTrava = diagnosticos.some((d) => d.travaErro);

  // Prévia client-side dos totais (antes de salvar)
  const previa = useMemo(() => {
    let bruto = 0;
    for (const it of itens) {
      const ev = eventoById[it.evento_id];
      if (!ev) continue;
      const q = Number(it.quantidade_periodo || 0) - Number(it.desconto_vaos || 0);
      bruto += q * Number(ev.valor_unitario);
    }
    const ret = (bruto * Number(retencao || 0)) / 100;
    const liquido = bruto - Number(faturamentoDireto || 0) - ret;
    return { bruto, ret, liquido };
  }, [itens, eventoById, retencao, faturamentoDireto]);

  const updateItem = (idx: number, patch: Partial<ItemLinha>) =>
    setItens((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const addLinha = () =>
    setItens((prev) => [...prev, { evento_id: "", quantidade_periodo: "", desconto_vaos: "0", observacao: "", memoria: [] }]);

  const removeLinha = (idx: number) =>
    setItens((prev) => prev.filter((_, i) => i !== idx));

  // --- Memória de cálculo por item ---
  const addMemoriaLinha = (idx: number) =>
    setItens((prev) => prev.map((it, i) => (i === idx ? { ...it, memoria: [...it.memoria, novaMemoriaLinha()] } : it)));
  const updateMemoriaLinha = (idx: number, mIdx: number, patch: Partial<MemoriaLinhaForm>) =>
    setItens((prev) => prev.map((it, i) =>
      i === idx ? { ...it, memoria: it.memoria.map((m, j) => (j === mIdx ? { ...m, ...patch } : m)) } : it));
  const removeMemoriaLinha = (idx: number, mIdx: number) =>
    setItens((prev) => prev.map((it, i) =>
      i === idx ? { ...it, memoria: it.memoria.filter((_, j) => j !== mIdx) } : it));
  const aplicarMemoria = (idx: number) =>
    updateItem(idx, { quantidade_periodo: String(Number(memoriaTotal(itens[idx].memoria).toFixed(4))) });

  const itensValidos = itens.filter((it) => it.evento_id && Number(it.quantidade_periodo) > 0);

  const handleCriarRascunho = async () => {
    setError(null);
    if (itensValidos.length === 0) {
      setError("Adicione ao menos um item com quantidade maior que zero.");
      return;
    }
    setSalvando(true);
    try {
      const endpoint = isFiscal
        ? `/empresa/objetos/${objetoId}/medicoes/fiscal`
        : `/empresa/objetos/${objetoId}/medicoes`;
      const { data } = await api.post<MedicaoCriada>(endpoint, {
        data_inicio_periodo: dataInicio || null,
        data_fim_periodo: dataFim || null,
        percentual_retencao: Number(retencao || 0),
        valor_faturamento_direto: Number(faturamentoDireto || 0),
        itens: itensValidos.map((it) => ({
          evento_id: it.evento_id,
          quantidade_periodo: Number(it.quantidade_periodo),
          desconto_vaos: Number(it.desconto_vaos || 0),
          observacao: it.observacao || null,
          memoria: it.memoria
            .filter((m) => calcLinhaQtd(m) > 0)
            .map((m, ordem) => ({
              ordem,
              descricao: m.descricao || null,
              comprimento: m.comprimento === "" ? null : Number(m.comprimento),
              largura: m.largura === "" ? null : Number(m.largura),
              altura: m.altura === "" ? null : Number(m.altura),
              percentual: m.percentual === "" ? null : Number(m.percentual),
              n_repeticoes: m.n_repeticoes === "" ? 1 : Number(m.n_repeticoes),
              quantidade: Number(calcLinhaQtd(m).toFixed(4)),
            })),
        })),
      });
      setMedicao(data);
      const { data: bol } = await api.get<Boletim>(`/empresa/medicoes/${data.id}/boletim`);
      setBoletim(bol);
    } catch (e: unknown) {
      setError(extractError(e) || "Erro ao criar a medição.");
    } finally {
      setSalvando(false);
    }
  };

  const handleUploadFoto = async (itemId: string, file: File) => {
    if (!medicao) return;
    setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("medicao_item_id", itemId);
    const meta = fotoMeta[itemId];
    if (meta?.titulo) form.append("titulo", meta.titulo);
    if (meta?.descricao) form.append("descricao", meta.descricao);
    try {
      await api.post(`/empresa/medicoes/${medicao.id}/fotos`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFotos((prev) => ({ ...prev, [itemId]: file.name }));
    } catch (e: unknown) {
      setError(extractError(e) || "Erro ao enviar a foto.");
    }
  };

  const handleFinalizar = async () => {
    if (!medicao) return;
    setError(null);
    setFinalizando(true);
    try {
      if (isFiscal) {
        await api.post(`/empresa/medicoes/${medicao.id}/concluir`, {});
      } else {
        await api.post(`/empresa/medicoes/${medicao.id}/assinar`, { confirmado: true });
      }
      navigate(`/empresa/objetos/${objetoId}/medicoes`);
    } catch (e: unknown) {
      setError(extractError(e) || "Erro ao finalizar a medição.");
    } finally {
      setFinalizando(false);
    }
  };

  const itensComAvanco = boletim?.itens.filter((it) => Number(it.quantidade_periodo) > 0) ?? [];
  const todasComFoto = itensComAvanco.every((it) => fotos[it.id]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-700">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Nova Medição {isFiscal && <span className="text-sm font-medium text-amber-600">(fiscal)</span>}
          </h2>
          <p className="text-sm text-slate-500">Boletim de Medição físico-financeiro</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* ----- Etapa 1: edição do boletim (antes de salvar) ----- */}
      {!medicao && (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Campo label="Início do período">
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className={inputCls} />
            </Campo>
            <Campo label="Fim do período">
              <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className={inputCls} />
            </Campo>
            <Campo label="Retenção (%)">
              <input type="number" min="0" step="0.01" value={retencao} onChange={(e) => setRetencao(e.target.value)} className={inputCls} />
            </Campo>
            <Campo label="Faturamento direto (R$)">
              <input type="number" min="0" step="0.01" value={faturamentoDireto} onChange={(e) => setFaturamentoDireto(e.target.value)} className={inputCls} />
            </Campo>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Itens do boletim</h3>
              <div className="flex items-center gap-2">
                {/* Botão Preencher conforme previsto */}
                {previsaoCronograma && previsaoCronograma.parcelas.length > 0 && (
                  <button
                    onClick={handlePreencherPrevisto}
                    disabled={previsaoUsada}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title={`Preencher com as quantidades previstas para o Mês/Período ${previsaoPeriodoFinal}`}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    Preencher conforme previsto
                    <span className="text-[10px] opacity-70">(Mês {previsaoPeriodoFinal})</span>
                  </button>
                )}
                <button onClick={addLinha} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-3 py-1.5 rounded-xl">
                  <Plus className="h-3.5 w-3.5" /> Adicionar item
                </button>
              </div>
            </div>
            {eventos.length === 0 && (
              <p className="text-xs text-amber-600">Esta objeto ainda não tem eventos cadastrados no cronograma.</p>
            )}
            <div className="space-y-2">
              {itens.map((it, idx) => {
                const ev = eventoById[it.evento_id];
                const bruto = ev
                  ? (Number(it.quantidade_periodo || 0) - Number(it.desconto_vaos || 0)) * Number(ev.valor_unitario)
                  : 0;
                const aberta = !!memoriaAberta[idx];
                const totalMemoria = memoriaTotal(it.memoria);
                return (
                  <div key={idx} className="border-b border-slate-50 dark:border-slate-700 pb-2 space-y-2">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-12 sm:col-span-5">
                        <label className="text-[11px] text-slate-400">Evento</label>
                        <select value={it.evento_id} onChange={(e) => updateItem(idx, { evento_id: e.target.value })} className={inputCls}>
                          <option value="">Selecione...</option>
                          {eventos.map((e) => (
                            <option key={e.id} value={e.id}>{e.descricao} ({e.unidade})</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <label className="text-[11px] text-slate-400">Qtd.</label>
                        <input type="number" min="0" step="0.0001" value={it.quantidade_periodo} onChange={(e) => updateItem(idx, { quantidade_periodo: e.target.value })} className={inputCls} />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <label className="text-[11px] text-slate-400">Desc. vãos</label>
                        <input type="number" min="0" step="0.0001" value={it.desconto_vaos} onChange={(e) => updateItem(idx, { desconto_vaos: e.target.value })} className={inputCls} />
                      </div>
                      <div className="col-span-3 sm:col-span-2 text-right">
                        <label className="text-[11px] text-slate-400">Valor bruto</label>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 py-2">{fmtCurrency(bruto)}</p>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        {itens.length > 1 && (
                          <button onClick={() => removeLinha(idx)} className="text-slate-300 hover:text-rose-500 py-2">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Trava de lançamento / alerta de desvio do item */}
                    {diagnosticos[idx]?.travaErro ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-rose-600">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {diagnosticos[idx].travaErro}
                      </div>
                    ) : diagnosticos[idx]?.alerta ? (
                      <div className={`flex items-center gap-1.5 text-[11px] font-medium ${
                        diagnosticos[idx].alerta!.tipo === "abaixo" ? "text-sky-600" : "text-amber-600"
                      }`}>
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {diagnosticos[idx].alerta!.msg}
                      </div>
                    ) : null}

                    {/* Memória de cálculo do item */}
                    <button type="button"
                      onClick={() => setMemoriaAberta((p) => ({ ...p, [idx]: !aberta }))}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-brand-700 transition-colors">
                      {aberta ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      <Ruler className="h-3.5 w-3.5" /> Memória de cálculo
                      {it.memoria.length > 0 && <span className="text-slate-400">({it.memoria.length} {it.memoria.length === 1 ? "linha" : "linhas"})</span>}
                    </button>

                    {aberta && (
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-3 space-y-2">
                        {it.memoria.length === 0 ? (
                          <p className="text-[11px] text-slate-400">Nenhuma linha. Adicione medições (C/P × L × H × N).</p>
                        ) : (
                          <>
                            <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] uppercase text-slate-400 px-1">
                              <span className="col-span-3">Descrição</span>
                              <span className="col-span-2">C/P</span>
                              <span className="col-span-2">Largura</span>
                              <span className="col-span-1">Altura</span>
                              <span className="col-span-1">N</span>
                              <span className="col-span-1">%</span>
                              <span className="col-span-2 text-right">Qtd.</span>
                            </div>
                            {it.memoria.map((m, mIdx) => (
                              <div key={mIdx} className="grid grid-cols-12 gap-2 items-center">
                                <input value={m.descricao} placeholder="Ex: Parede A" onChange={(e) => updateMemoriaLinha(idx, mIdx, { descricao: e.target.value })} className={inputCls + " col-span-12 sm:col-span-3"} />
                                <input type="number" step="0.0001" value={m.comprimento} onChange={(e) => updateMemoriaLinha(idx, mIdx, { comprimento: e.target.value })} className={inputCls + " col-span-3 sm:col-span-2"} />
                                <input type="number" step="0.0001" value={m.largura} onChange={(e) => updateMemoriaLinha(idx, mIdx, { largura: e.target.value })} className={inputCls + " col-span-3 sm:col-span-2"} />
                                <input type="number" step="0.0001" value={m.altura} onChange={(e) => updateMemoriaLinha(idx, mIdx, { altura: e.target.value })} className={inputCls + " col-span-2 sm:col-span-1"} />
                                <input type="number" step="0.0001" value={m.n_repeticoes} onChange={(e) => updateMemoriaLinha(idx, mIdx, { n_repeticoes: e.target.value })} className={inputCls + " col-span-2 sm:col-span-1"} />
                                <input type="number" step="0.01" value={m.percentual} onChange={(e) => updateMemoriaLinha(idx, mIdx, { percentual: e.target.value })} className={inputCls + " col-span-2 sm:col-span-1"} />
                                <div className="col-span-2 flex items-center justify-end gap-1">
                                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{Number(calcLinhaQtd(m).toFixed(4))}</span>
                                  <button type="button" onClick={() => removeMemoriaLinha(idx, mIdx)} className="text-slate-300 hover:text-rose-500">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                        <div className="flex items-center justify-between pt-1">
                          <button type="button" onClick={() => addMemoriaLinha(idx)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:text-brand-500">
                            <Plus className="h-3.5 w-3.5" /> Adicionar linha
                          </button>
                          {it.memoria.length > 0 && (
                            <div className="flex items-center gap-3 text-[11px]">
                              <span className="text-slate-500">Total: <b className="text-slate-700 dark:text-slate-200">{Number(totalMemoria.toFixed(4))}</b></span>
                              <button type="button" onClick={() => aplicarMemoria(idx)}
                                className="font-semibold text-brand-700 hover:text-brand-500 hover:underline">
                                Aplicar à quantidade
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <TotaisResumo bruto={previa.bruto} retencao={previa.ret} faturamento={Number(faturamentoDireto || 0)} liquido={previa.liquido} />
          </div>

          <div className="flex items-center justify-end gap-3">
            {temTrava && (
              <span className="text-xs text-rose-600">Corrija os itens acima do saldo contratado para continuar.</span>
            )}
            <button onClick={() => navigate(-1)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl">
              Cancelar
            </button>
            <button onClick={handleCriarRascunho} disabled={salvando || temTrava}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-700/20 disabled:opacity-50">
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Criar rascunho
            </button>
          </div>
        </>
      )}

      {/* ----- Etapa 2: fotos por item + finalização ----- */}
      {medicao && boletim && (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Boletim da Medição #{boletim.numero_medicao} — valide cada item com foto
              </h3>
              <p className="text-xs text-slate-500">Cada item com avanço precisa de ao menos uma foto.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 text-[11px] uppercase text-slate-400">
                  <tr>
                    <th className="text-left p-3">Item</th>
                    <th className="text-right p-3">Qtd</th>
                    <th className="text-right p-3">Vlr unit.</th>
                    <th className="text-right p-3">Bruto</th>
                    <th className="text-right p-3">Acum. ant.</th>
                    <th className="text-right p-3">Acum. atual</th>
                    <th className="text-right p-3">Saldo</th>
                    <th className="text-center p-3">Foto</th>
                  </tr>
                </thead>
                <tbody>
                  {boletim.itens.map((it) => (
                    <tr key={it.id} className="border-t border-slate-50 dark:border-slate-700">
                      <td className="p-3 text-slate-700 dark:text-slate-200">{it.descricao} <span className="text-slate-400">({it.unidade})</span></td>
                      <td className="p-3 text-right">{Number(it.quantidade_periodo)}</td>
                      <td className="p-3 text-right">{fmtCurrency(it.valor_unitario)}</td>
                      <td className="p-3 text-right font-semibold">{fmtCurrency(it.valor_bruto)}</td>
                      <td className="p-3 text-right text-slate-500">{fmtCurrency(it.acumulado_anterior)}</td>
                      <td className="p-3 text-right text-slate-500">{fmtCurrency(it.acumulado_atual)}</td>
                      <td className="p-3 text-right text-slate-500">{fmtCurrency(it.saldo)}</td>
                      <td className="p-3 text-center">
                        {Number(it.quantidade_periodo) > 0 ? (
                          fotos[it.id] ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Enviada</span>
                          ) : (
                            <div className="flex flex-col items-stretch gap-1.5 min-w-[180px]">
                              <input
                                value={fotoMeta[it.id]?.titulo ?? ""}
                                placeholder="Título da foto"
                                onChange={(e) => setFotoMeta((p) => ({ ...p, [it.id]: { titulo: e.target.value, descricao: p[it.id]?.descricao ?? "" } }))}
                                className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 py-1 px-2 text-xs focus:border-brand-700 focus:outline-none"
                              />
                              <input
                                value={fotoMeta[it.id]?.descricao ?? ""}
                                placeholder="Descrição (opcional)"
                                onChange={(e) => setFotoMeta((p) => ({ ...p, [it.id]: { titulo: p[it.id]?.titulo ?? "", descricao: e.target.value } }))}
                                className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 py-1 px-2 text-xs focus:border-brand-700 focus:outline-none"
                              />
                              <label className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-brand-700 cursor-pointer hover:underline">
                                <Camera className="h-4 w-4" /> Anexar foto
                                <input type="file" accept="image/*" capture="environment" className="hidden"
                                  onChange={(e) => e.target.files?.[0] && handleUploadFoto(it.id, e.target.files[0])} />
                              </label>
                            </div>
                          )
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-700">
              <TotaisResumo
                bruto={Number(boletim.valor_bruto_total)}
                retencao={Number(boletim.retencao)}
                faturamento={Number(boletim.valor_faturamento_direto)}
                liquido={Number(boletim.valor_liquido)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            {!todasComFoto && (
              <span className="text-xs text-amber-600">Anexe a foto de cada item com avanço para continuar.</span>
            )}
            <button onClick={handleFinalizar} disabled={!todasComFoto || finalizando}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-700/20 disabled:opacity-50">
              {finalizando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              {isFiscal ? "Concluir medição" : "Assinar e enviar"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const inputCls =
  "block w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 py-2 px-3 text-sm focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all";

const Campo = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-slate-500">{label}</label>
    {children}
  </div>
);

const TotaisResumo = ({ bruto, retencao, faturamento, liquido }: { bruto: number; retencao: number; faturamento: number; liquido: number }) => (
  <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-sm">
    <span className="text-slate-500">Bruto: <b className="text-slate-700 dark:text-slate-200">{fmtCurrency(bruto)}</b></span>
    <span className="text-slate-500">Faturamento direto: <b className="text-slate-700 dark:text-slate-200">- {fmtCurrency(faturamento)}</b></span>
    <span className="text-slate-500">Retenção: <b className="text-slate-700 dark:text-slate-200">- {fmtCurrency(retencao)}</b></span>
    <span className="text-base text-slate-700 dark:text-slate-200">Líquido: <b className="text-emerald-600">{fmtCurrency(liquido)}</b></span>
  </div>
);

function extractError(e: unknown): string | undefined {
  if (e && typeof e === "object" && "response" in e) {
    const detail = (e.response as { data?: { detail?: unknown } })?.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return undefined;
}

export default NovaMedicao;
