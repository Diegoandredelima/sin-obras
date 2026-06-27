/**
 * EditarCronograma — rota /cronograma/:versaoId/editar
 *
 * Editor visual em formato planilha/grid.
 * Linhas = Eventos (agrupados por Meta > Submeta).
 * Colunas = Mês 1 … Mês N (editável; N é configurável pelo usuário).
 *
 * Cada célula = quantidade prevista naquele mês para aquele evento.
 * Validação: soma das quantidades de um evento não pode exceder evento.quantidade.
 *
 * Botão "Salvar como Versão X":
 *  - V01 (linha de base): sem justificativa.
 *  - V02+: campo de justificativa obrigatório.
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Save, AlertTriangle, Loader2, CheckCircle2,
  CalendarDays, Plus, Minus,
} from "lucide-react";
import api from "@/services/api";
import { fmtCurrency } from "@/utils/format";

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface EventoMeta {
  id: string;
  descricao: string;
  unidade: string;
  quantidade: string;
  valor_unitario: string;
  valor_total: string;
}

interface Submeta {
  id: string;
  descricao: string;
  eventos: EventoMeta[];
}

interface Meta {
  id: string;
  descricao: string;
  submetas: Submeta[];
}

interface CronogramaVersaoInfo {
  id: string;
  objeto_id: string;
  numero_versao: number;
  ativa: boolean;
  linha_de_base: boolean;
  total_periodos: number;
  justificativa?: string | null;
  parcelas: {
    id: string;
    evento_id: string;
    periodo_numero: number;
    quantidade_prevista: string;
  }[];
}

// ─── Células do grid ────────────────────────────────────────────────────────

// Mapa: eventoId → mês → quantidade
type GridCell = Record<string, Record<number, string>>;

// ─── Utilitários ─────────────────────────────────────────────────────────────

function somaEvento(cells: GridCell, eventoId: string, numMeses: number): number {
  let total = 0;
  for (let m = 1; m <= numMeses; m++) {
    total += Number(cells[eventoId]?.[m] || 0);
  }
  return total;
}

function somaColuna(cells: GridCell, mes: number, eventos: EventoMeta[]): number {
  return eventos.reduce((acc, ev) => acc + Number(cells[ev.id]?.[mes] || 0), 0);
}

// ─── Componente principal ───────────────────────────────────────────────────

const EditarCronograma = () => {
  // A rota tem duas formas:
  //  - /cronograma/novo/:objetoId  → modo novo (cria a V01 ao salvar)
  //  - /cronograma/:versaoId/editar → modo editar (popula a partir da versão)
  const { versaoId, objetoId: objetoIdParam } = useParams<{ versaoId?: string; objetoId?: string }>();
  const modoNovo = !!objetoIdParam;
  const navigate = useNavigate();

  const [numMeses, setNumMeses] = useState(6);
  const [cells, setCells] = useState<GridCell>({});
  const [cellsIniciados, setCellsIniciados] = useState(false);
  const [justificativa, setJustificativa] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  // Modo editar: busca a versão pelo ID para obter o objeto_id e as parcelas.
  const { data: versaoAtual, isLoading: versaoLoading } = useQuery<CronogramaVersaoInfo>({
    queryKey: ["cronograma-versao-detalhe", versaoId],
    queryFn: async (): Promise<CronogramaVersaoInfo> => {
      const { data } = await api.get(`/cronograma/versoes/${versaoId}`);
      return data as CronogramaVersaoInfo;
    },
    enabled: !!versaoId,
  });

  // Pré-popula o grid com as parcelas da versão carregada (modo editar).
  useEffect(() => {
    if (modoNovo || !versaoAtual || cellsIniciados) return;
    const initialCells: GridCell = {};
    const maxMes = versaoAtual.parcelas.reduce(
      (max: number, p: { periodo_numero: number }) => Math.max(max, p.periodo_numero),
      0
    );
    if (maxMes > 0) setNumMeses(maxMes);
    for (const p of versaoAtual.parcelas) {
      if (!initialCells[p.evento_id]) initialCells[p.evento_id] = {};
      initialCells[p.evento_id][p.periodo_numero] = String(p.quantidade_prevista);
    }
    setCells(initialCells);
    setCellsIniciados(true);
  }, [modoNovo, versaoAtual, cellsIniciados]);

  const objetoId = objetoIdParam ?? versaoAtual?.objeto_id ?? "";

  // Buscamos metas do objeto para montar o grid
  const { data: metas = [], isLoading: metasLoading } = useQuery<Meta[]>({
    queryKey: ["cronograma-metas", objetoId],
    queryFn: async () => {
      const { data } = await api.get(`/cronograma/objetos/${objetoId}/metas`);
      return data;
    },
    enabled: !!objetoId,
  });

  // Quantas versões existem para este objeto (para saber se é V01 ou V02+)
  const { data: todasVersoes = [] } = useQuery<CronogramaVersaoInfo[]>({
    queryKey: ["cronograma-versoes-lista", objetoId],
    queryFn: async () => {
      const { data } = await api.get(`/cronograma/objetos/${objetoId}/versoes`);
      return data;
    },
    enabled: !!objetoId,
  });

  // Lock preventivo (Passo 3): medições EM ANDAMENTO bloqueiam o replanejamento.
  // Mesmo conjunto de status do backend (check_medicoes_lock).
  const { data: medicoes = [] } = useQuery<{ id: string; status: string }[]>({
    queryKey: ["cronograma-medicoes-status", objetoId],
    queryFn: async () => {
      const { data } = await api.get(`/empresa/objetos/${objetoId}/medicoes`);
      return Array.isArray(data) ? data : (data?.items ?? []);
    },
    enabled: !!objetoId,
  });

  const STATUS_BLOQUEIA = ["ASSINADA", "EM_FISCALIZACAO", "AGUARDANDO_CHEFE"];
  const bloqueado = medicoes.some((m) => STATUS_BLOQUEIA.includes(m.status));

  const todosEventos = useMemo(
    () => metas.flatMap((m) => m.submetas.flatMap((s) => s.eventos)),
    [metas]
  );

  const updateCell = useCallback((eventoId: string, mes: number, value: string) => {
    setCells((prev) => ({
      ...prev,
      [eventoId]: { ...(prev[eventoId] ?? {}), [mes]: value },
    }));
  }, []);

  // Nova versão que será criada ao salvar (=ultima versão + 1)
  const proximaVersaoNum = todasVersoes.length > 0
    ? Math.max(...todasVersoes.map((v) => v.numero_versao)) + 1
    : 1;
  const isLinhaDBase = todasVersoes.length === 0 || proximaVersaoNum === 1;

  const handleSalvar = async () => {
    setErro(null);
    setSalvando(true);
    setSucesso(false);

    if (bloqueado) {
      setErro("Não é possível alterar o cronograma. Finalize ou aprove a medição em andamento.");
      setSalvando(false);
      return;
    }

    if (!isLinhaDBase && !justificativa.trim()) {
      setErro("Justificativa é obrigatória para replanejamentos (V02+).");
      setSalvando(false);
      return;
    }

    // Monta parcelas a partir do grid
    const parcelas: { evento_id: string; periodo_numero: number; quantidade_prevista: number }[] = [];
    for (const ev of todosEventos) {
      for (let m = 1; m <= numMeses; m++) {
        const qtd = Number(cells[ev.id]?.[m] || 0);
        if (qtd > 0) {
          parcelas.push({ evento_id: ev.id, periodo_numero: m, quantidade_prevista: qtd });
        }
      }
    }

    try {
      await api.post(`/cronograma/objetos/${objetoId}/versoes`, {
        justificativa: justificativa.trim() || null,
        parcelas,
      });
      setSucesso(true);
      setTimeout(() => navigate(`/cronograma`), 1500);
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setErro(detail ?? "Erro ao salvar o cronograma.");
    } finally {
      setSalvando(false);
    }
  };

  // ─── Totais de validação por evento ────────────────────────────────────────

  const getTotaisEvento = (ev: EventoMeta) => {
    const total = somaEvento(cells, ev.id, numMeses);
    const previsto = Number(ev.quantidade);
    const excede = total > previsto;
    const pct = previsto > 0 ? (total / previsto) * 100 : 0;
    return { total, previsto, excede, pct };
  };

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (versaoLoading || metasLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-700" />
      </div>
    );
  }

  if (!objetoId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-400 mb-3" />
        <p className="text-slate-700 font-medium">Objeto não identificado.</p>
        <Link to="/cronograma" className="mt-3 text-sm text-brand-700 hover:underline">
          ← Voltar ao seletor
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/cronograma" className="text-slate-400 hover:text-slate-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-brand-700" />
              <h1 className="text-xl font-bold text-slate-900">
                Editor de Cronograma
              </h1>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                isLinhaDBase
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-sky-50 text-sky-700 border-sky-200"
              }`}>
                V{String(proximaVersaoNum).padStart(2, "0")} — {isLinhaDBase ? "Linha de Base" : "Replanejamento"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribua as quantidades de cada evento ao longo dos meses de execução.
            </p>
          </div>
        </div>

        {/* Controle de meses + salvar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
            <button
              onClick={() => setNumMeses((n) => Math.max(1, n - 1))}
              className="text-slate-400 hover:text-slate-700"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-slate-700 min-w-[4ch] text-center">
              {numMeses} {numMeses === 1 ? "mês" : "meses"}
            </span>
            <button
              onClick={() => setNumMeses((n) => Math.min(60, n + 1))}
              className="text-slate-400 hover:text-slate-700"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleSalvar}
            disabled={salvando || sucesso || bloqueado}
            title={bloqueado ? "Há medição em andamento — cronograma bloqueado." : undefined}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-700/20 disabled:opacity-50 transition-all"
          >
            {salvando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : sucesso ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {sucesso ? "Salvo!" : `Salvar como V${String(proximaVersaoNum).padStart(2, "0")}`}
          </button>
        </div>
      </div>

      {/* Banner de bloqueio (Passo 3): medição em andamento trava o cronograma */}
      {bloqueado && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            <b>Cronograma bloqueado.</b> Existe uma medição em andamento para este objeto.
            Finalize ou aprove a medição antes de criar uma nova versão do cronograma.
          </span>
        </div>
      )}

      {/* Alertas */}
      {erro && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {erro}
        </div>
      )}

      {/* Justificativa (V02+) */}
      {!isLinhaDBase && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
            Justificativa do Replanejamento (obrigatória)
          </p>
          <textarea
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            rows={2}
            placeholder="Descreva o motivo do replanejamento..."
            className="block w-full rounded-xl border border-amber-200 bg-white py-2 px-3 text-sm focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all"
          />
        </div>
      )}

      {/* Grid */}
      {metas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarDays className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">
            Este objeto não tem metas/eventos cadastrados.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Acesse a aba "Cronograma" do contrato para cadastrar a estrutura EAP primeiro.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide sticky left-0 bg-slate-50 min-w-[200px] max-w-[260px] z-10">
                  Evento
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                  Unid.
                </th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                  Qtd. total
                </th>
                {[...Array(numMeses)].map((_, i) => (
                  <th
                    key={i + 1}
                    className="text-center px-2 py-3 text-xs font-semibold text-brand-700 whitespace-nowrap min-w-[80px]"
                  >
                    Mês {i + 1}
                  </th>
                ))}
                <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                  Distribuído
                </th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                  Saldo
                </th>
              </tr>
            </thead>
            <tbody>
              {metas.map((meta) => (
                <>
                  {/* Linha de Meta */}
                  <tr key={`meta-${meta.id}`} className="bg-brand-50/40 border-t border-brand-100">
                    <td
                      colSpan={3 + numMeses + 2}
                      className="px-4 py-2 text-xs font-bold text-brand-800 uppercase tracking-wide sticky left-0 bg-brand-50/40"
                    >
                      {meta.descricao}
                    </td>
                  </tr>

                  {meta.submetas.map((sub) => (
                    <>
                      {/* Linha de Submeta */}
                      <tr key={`sub-${sub.id}`} className="bg-slate-50/60 border-t border-slate-100">
                        <td
                          colSpan={3 + numMeses + 2}
                          className="px-6 py-1.5 text-xs font-semibold text-slate-600 sticky left-0 bg-slate-50/60"
                        >
                          ↳ {sub.descricao}
                        </td>
                      </tr>

                      {/* Linhas de Evento */}
                      {sub.eventos.map((ev) => {
                        const { total, previsto, excede, pct } = getTotaisEvento(ev);
                        const saldo = previsto - total;
                        return (
                          <tr
                            key={ev.id}
                            className={`border-t border-slate-50 hover:bg-slate-50/50 transition-colors ${
                              excede ? "bg-rose-50/30" : ""
                            }`}
                          >
                            {/* Nome do evento */}
                            <td className="px-8 py-2 text-xs text-slate-700 sticky left-0 bg-white min-w-[200px] max-w-[260px] truncate">
                              {ev.descricao}
                              {excede && (
                                <span className="ml-1 text-rose-500">⚠</span>
                              )}
                            </td>

                            {/* Unidade */}
                            <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
                              {ev.unidade}
                            </td>

                            {/* Qtd. total */}
                            <td className="px-3 py-2 text-xs text-right font-semibold text-slate-700 whitespace-nowrap">
                              {Number(ev.quantidade).toLocaleString("pt-BR")}
                            </td>

                            {/* Células editáveis por mês */}
                            {[...Array(numMeses)].map((_, i) => {
                              const mes = i + 1;
                              const val = cells[ev.id]?.[mes] ?? "";
                              return (
                                <td key={mes} className="px-1 py-1">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.0001"
                                    value={val}
                                    onChange={(e) => updateCell(ev.id, mes, e.target.value)}
                                    className={`block w-full text-right rounded-lg border py-1.5 px-2 text-xs focus:outline-none focus:ring-2 transition-all ${
                                      excede
                                        ? "border-rose-300 bg-rose-50 focus:ring-rose-500/20 focus:border-rose-500"
                                        : "border-slate-200 bg-white focus:ring-brand-700/10 focus:border-brand-700"
                                    }`}
                                    placeholder="0"
                                  />
                                </td>
                              );
                            })}

                            {/* Distribuído (com %) */}
                            <td className="px-3 py-2 text-xs text-right whitespace-nowrap">
                              <span className={excede ? "text-rose-600 font-semibold" : "text-slate-600"}>
                                {total.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}
                              </span>
                              {previsto > 0 && (
                                <span className="text-slate-400 ml-1">
                                  ({pct.toFixed(0)}%)
                                </span>
                              )}
                            </td>

                            {/* Saldo */}
                            <td className="px-3 py-2 text-xs text-right whitespace-nowrap">
                              <span className={saldo < 0 ? "text-rose-600 font-semibold" : "text-emerald-600"}>
                                {saldo.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  ))}
                </>
              ))}

              {/* Linha de totais por coluna */}
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                <td
                  className="px-4 py-2 text-xs text-slate-600 sticky left-0 bg-slate-50"
                  colSpan={3}
                >
                  Total por mês
                </td>
                {[...Array(numMeses)].map((_, i) => {
                  const mes = i + 1;
                  const somaQtd = somaColuna(cells, mes, todosEventos);
                  const valor = todosEventos.reduce((acc, ev) => {
                    return acc + Number(cells[ev.id]?.[mes] || 0) * Number(ev.valor_unitario);
                  }, 0);
                  return (
                    <td key={mes} className="px-1 py-2 text-center">
                      <div className="text-xs font-bold text-slate-700">
                        {somaQtd.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {fmtCurrency(valor)}
                      </div>
                    </td>
                  );
                })}
                <td colSpan={2} className="px-3 py-2 text-xs text-right text-slate-500">
                  {fmtCurrency(
                    todosEventos.reduce((acc, ev) => {
                      let total = 0;
                      for (let m = 1; m <= numMeses; m++) {
                        total += Number(cells[ev.id]?.[m] || 0) * Number(ev.valor_unitario);
                      }
                      return acc + total;
                    }, 0)
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Legenda de validação */}
      <div className="text-xs text-slate-500 flex flex-wrap gap-4">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-rose-100 border border-rose-200 inline-block" />
          Excede a quantidade total contratada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-100 border border-emerald-200 inline-block" />
          Distribuição válida
        </span>
      </div>
    </div>
  );
};

export default EditarCronograma;
