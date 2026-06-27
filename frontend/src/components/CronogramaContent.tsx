import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import {
  ChevronRight, ChevronDown, Plus, Loader2,
  AlertTriangle, Target, Layers, Box, BarChart3,
  CalendarDays, History, ExternalLink,
} from "lucide-react";
import api from "@/services/api";
import type { Meta, Submeta, Evento } from "@/types";
import { fmtCurrency } from "@/utils/format";

const metaSchema = z.object({
  descricao: z.string().min(1, "Obrigatório").max(500),
  valor: z.coerce.number().min(0, "Valor deve ser ≥ 0"),
});

const submetaSchema = z.object({
  descricao: z.string().min(1, "Obrigatório").max(500),
  valor: z.coerce.number().min(0, "Valor deve ser ≥ 0"),
  percentual_previsto: z.coerce.number().min(0).max(100),
});

const eventoSchema = z.object({
  descricao: z.string().min(1, "Obrigatório").max(500),
  quantidade: z.coerce.number().min(0, "Quantidade deve ser ≥ 0"),
  unidade: z.string().min(1, "Unidade obrigatória").max(20),
  valor_unitario: z.coerce.number().min(0, "Valor unitário deve ser ≥ 0"),
});

type MetaFormData = z.infer<typeof metaSchema>;
type SubmetaFormData = z.infer<typeof submetaSchema>;
type EventoFormData = z.infer<typeof eventoSchema>;

// Memória de cálculo CONTRATADA: justificativa matemática da quantidade do
// orçamento (C/P × L × H × N ajustado por %). Espelha a memória executada da medição.
interface MemoriaLinha {
  descricao: string;
  comprimento: string; // C/P
  largura: string;     // L
  altura: string;      // H
  percentual: string;  // %
  n_repeticoes: string; // N
}

const novaMemoriaLinha = (): MemoriaLinha => ({
  descricao: "", comprimento: "", largura: "", altura: "", percentual: "", n_repeticoes: "1",
});

function calcMemoriaLinha(l: MemoriaLinha): number {
  if (l.comprimento === "" && l.largura === "" && l.altura === "") return 0;
  const f = (v: string) => (v === "" ? 1 : Number(v) || 0);
  const pct = l.percentual === "" ? 1 : (Number(l.percentual) || 0) / 100;
  return f(l.comprimento) * f(l.largura) * f(l.altura) * f(l.n_repeticoes) * pct;
}

const memoriaTotalContratada = (linhas: MemoriaLinha[]) =>
  linhas.reduce((s, l) => s + calcMemoriaLinha(l), 0);

const EventoRow = ({ evento }: { evento: Evento }) => (
  <div className="flex items-center gap-3 py-2 px-3 rounded-lg border border-slate-100 bg-white ml-8">
    <Box className="h-3.5 w-3.5 text-slate-300 shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-slate-700 truncate">{evento.descricao}</p>
      <div className="flex gap-3 mt-0.5 text-[10px] text-slate-400">
        <span>Qtd: {Number(evento.quantidade)}</span>
        <span>{evento.unidade}</span>
        <span>Unit: {fmtCurrency(Number(evento.valor_unitario))}</span>
      </div>
    </div>
    <span className="text-xs font-semibold text-brand-700 shrink-0">{fmtCurrency(Number(evento.valor_total))}</span>
  </div>
);

const SubmetaSection = ({
  submeta,
  objetoId,
}: {
  submeta: Submeta;
  objetoId: string;
}) => {
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [memoria, setMemoria] = useState<MemoriaLinha[]>([]);
  const [memoriaAberta, setMemoriaAberta] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EventoFormData>({
    resolver: zodResolver(eventoSchema),
    defaultValues: { descricao: "", quantidade: 0, unidade: "un", valor_unitario: 0 },
  });

  const resetForm = () => {
    reset();
    setMemoria([]);
    setMemoriaAberta(false);
  };

  const createMutation = useMutation({
    mutationFn: async (data: EventoFormData) => {
      const memoriaPayload = memoria
        .filter((m) => calcMemoriaLinha(m) > 0)
        .map((m, ordem) => ({
          ordem,
          descricao: m.descricao || null,
          comprimento: m.comprimento === "" ? null : Number(m.comprimento),
          largura: m.largura === "" ? null : Number(m.largura),
          altura: m.altura === "" ? null : Number(m.altura),
          percentual: m.percentual === "" ? null : Number(m.percentual),
          n_repeticoes: m.n_repeticoes === "" ? 1 : Number(m.n_repeticoes),
          quantidade: Number(calcMemoriaLinha(m).toFixed(4)),
        }));
      await api.post(`/cronograma/submetas/${submeta.id}/eventos`, {
        ...data,
        memoria: memoriaPayload.length > 0 ? memoriaPayload : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cronograma", objetoId] });
      resetForm();
      setShowAdd(false);
    },
  });

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors text-left"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
        <Layers className="h-3.5 w-3.5 text-sky-400" />
        <span className="text-xs font-medium text-slate-700 truncate flex-1">{submeta.descricao}</span>
        <span className="text-xs text-slate-500 shrink-0">{fmtCurrency(Number(submeta.valor))}</span>
        <span className="text-[10px] text-slate-400 shrink-0">{Number(submeta.percentual_previsto)}%</span>
      </button>

      {open && (
        <div className="space-y-1">
          {submeta.eventos.map((evt) => (
            <EventoRow key={evt.id} evento={evt} />
          ))}
          <div className="ml-8">
            {!showAdd ? (
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-1 text-[10px] text-sky-500 hover:text-sky-600 py-1"
              >
                <Plus className="h-3 w-3" />
                Adicionar evento
              </button>
            ) : (
              <form
                onSubmit={handleSubmit((data) => createMutation.mutate(data))}
                className="flex flex-wrap items-center gap-2 py-1 w-full"
              >
                <input
                  {...register("descricao")}
                  placeholder="Descrição do evento"
                  className={`flex-1 min-w-[200px] text-xs rounded-lg border px-2 py-1 focus:outline-none ${
                    errors.descricao
                      ? "border-rose-500 focus:border-rose-500 bg-rose-50/25"
                      : "border-slate-200 focus:border-sky-400"
                  }`}
                  title={errors.descricao?.message}
                />
                <input
                  {...register("quantidade")}
                  type="number"
                  step="any"
                  placeholder="Qtd"
                  className={`w-16 text-xs rounded-lg border px-2 py-1 focus:outline-none ${
                    errors.quantidade
                      ? "border-rose-500 focus:border-rose-500 bg-rose-50/25"
                      : "border-slate-200 focus:border-sky-400"
                  }`}
                  title={errors.quantidade?.message}
                />
                <input
                  {...register("unidade")}
                  placeholder="Un"
                  className={`w-12 text-xs rounded-lg border px-2 py-1 focus:outline-none ${
                    errors.unidade
                      ? "border-rose-500 focus:border-rose-500 bg-rose-50/25"
                      : "border-slate-200 focus:border-sky-400"
                  }`}
                  title={errors.unidade?.message}
                />
                <input
                  {...register("valor_unitario")}
                  type="number"
                  step="0.01"
                  placeholder="Unit (R$)"
                  className={`w-24 text-xs rounded-lg border px-2 py-1 focus:outline-none ${
                    errors.valor_unitario
                      ? "border-rose-500 focus:border-rose-500 bg-rose-50/25"
                      : "border-slate-200 focus:border-sky-400"
                  }`}
                  title={errors.valor_unitario?.message}
                />

                {/* Memória de cálculo contratada (justifica a quantidade) */}
                <div className="w-full rounded-lg border border-slate-100 bg-slate-50/60 p-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => setMemoriaAberta((v) => !v)}
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-sky-600"
                  >
                    {memoriaAberta ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    Memória de cálculo
                    {memoria.length > 0 && <span className="text-slate-400">({memoria.length})</span>}
                  </button>
                  {memoriaAberta && (
                    <div className="space-y-1.5">
                      {memoria.length === 0 && (
                        <p className="text-[10px] text-slate-400">Nenhuma linha. Adicione medições (C/P × L × H × N × %).</p>
                      )}
                      {memoria.map((m, mIdx) => (
                        <div key={mIdx} className="flex flex-wrap items-center gap-1.5">
                          <input value={m.descricao} placeholder="Descrição" onChange={(e) => setMemoria((p) => p.map((x, j) => j === mIdx ? { ...x, descricao: e.target.value } : x))} className="flex-1 min-w-[120px] text-[11px] rounded border border-slate-200 px-1.5 py-1 focus:outline-none focus:border-sky-400" />
                          <input type="number" step="any" value={m.comprimento} placeholder="C/P" onChange={(e) => setMemoria((p) => p.map((x, j) => j === mIdx ? { ...x, comprimento: e.target.value } : x))} className="w-14 text-[11px] rounded border border-slate-200 px-1.5 py-1 focus:outline-none focus:border-sky-400" />
                          <input type="number" step="any" value={m.largura} placeholder="L" onChange={(e) => setMemoria((p) => p.map((x, j) => j === mIdx ? { ...x, largura: e.target.value } : x))} className="w-12 text-[11px] rounded border border-slate-200 px-1.5 py-1 focus:outline-none focus:border-sky-400" />
                          <input type="number" step="any" value={m.altura} placeholder="H" onChange={(e) => setMemoria((p) => p.map((x, j) => j === mIdx ? { ...x, altura: e.target.value } : x))} className="w-12 text-[11px] rounded border border-slate-200 px-1.5 py-1 focus:outline-none focus:border-sky-400" />
                          <input type="number" step="any" value={m.n_repeticoes} placeholder="N" onChange={(e) => setMemoria((p) => p.map((x, j) => j === mIdx ? { ...x, n_repeticoes: e.target.value } : x))} className="w-12 text-[11px] rounded border border-slate-200 px-1.5 py-1 focus:outline-none focus:border-sky-400" />
                          <input type="number" step="any" value={m.percentual} placeholder="%" onChange={(e) => setMemoria((p) => p.map((x, j) => j === mIdx ? { ...x, percentual: e.target.value } : x))} className="w-12 text-[11px] rounded border border-slate-200 px-1.5 py-1 focus:outline-none focus:border-sky-400" />
                          <span className="text-[11px] font-semibold text-slate-600 w-14 text-right">{Number(calcMemoriaLinha(m).toFixed(4))}</span>
                          <button type="button" onClick={() => setMemoria((p) => p.filter((_, j) => j !== mIdx))} className="text-slate-300 hover:text-rose-500 text-[10px]">✕</button>
                        </div>
                      ))}
                      <div className="flex items-center justify-between">
                        <button type="button" onClick={() => setMemoria((p) => [...p, novaMemoriaLinha()])} className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-600 hover:text-sky-500">
                          <Plus className="h-3 w-3" /> Adicionar linha
                        </button>
                        {memoria.length > 0 && (
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-slate-500">Total: <b className="text-slate-700">{Number(memoriaTotalContratada(memoria).toFixed(4))}</b></span>
                            <button type="button" onClick={() => setValue("quantidade", Number(memoriaTotalContratada(memoria).toFixed(4)))} className="font-semibold text-sky-600 hover:underline">
                              Aplicar à quantidade
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="text-[10px] font-semibold text-white bg-sky-500 hover:bg-sky-400 px-2 py-1 rounded-lg disabled:opacity-50"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => { resetForm(); setShowAdd(false); }}
                    className="text-[10px] text-slate-400 hover:text-slate-600"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MetaSection = ({
  meta,
  objetoId,
}: {
  meta: Meta;
  objetoId: string;
}) => {
  const [open, setOpen] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<SubmetaFormData>({
    resolver: zodResolver(submetaSchema),
    defaultValues: { descricao: "", valor: 0, percentual_previsto: 0 },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SubmetaFormData) => {
      await api.post(`/cronograma/metas/${meta.id}/submetas`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cronograma", objetoId] });
      reset();
      setShowAdd(false);
    },
  });

  const totalSubmeta = meta.submetas.reduce((acc, s) => acc + Number(s.valor), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50/50 transition-colors rounded-2xl"
      >
        {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
        <Target className="h-4 w-4 text-brand-500" />
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{meta.descricao}</p>
          <p className="text-[10px] text-slate-400">{meta.submetas.length} submeta{meta.submetas.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-slate-900">{fmtCurrency(Number(meta.valor))}</p>
          <p className="text-[10px] text-slate-400">{fmtCurrency(totalSubmeta)} em submetas</p>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-4 space-y-1">
          {meta.submetas.map((sub) => (
            <SubmetaSection key={sub.id} submeta={sub} objetoId={objetoId} />
          ))}

          {!showAdd ? (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 text-xs text-brand-700 hover:text-brand-500 font-medium py-2"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar submeta
            </button>
          ) : (
            <form
              onSubmit={handleSubmit((data) => createMutation.mutate(data))}
              className="flex items-center gap-2 py-2"
            >
              <input
                {...register("descricao")}
                placeholder="Descrição da submeta"
                className="flex-1 text-xs rounded-lg border border-slate-200 px-2 py-1.5 focus:border-brand-700 focus:outline-none"
              />
              <input
                {...register("valor")}
                type="number"
                step="0.01"
                placeholder="Valor"
                className="w-24 text-xs rounded-lg border border-slate-200 px-2 py-1.5 focus:border-brand-700 focus:outline-none"
              />
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="text-[10px] font-semibold text-white bg-brand-700 hover:bg-brand-500 px-2 py-1.5 rounded-lg disabled:opacity-50"
              >
                {createMutation.isPending ? "..." : "Salvar"}
              </button>
              <button
                type="button"
                onClick={() => { reset(); setShowAdd(false); }}
                className="text-[10px] text-slate-400 hover:text-slate-600"
              >
                Cancelar
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export const CronogramaContent = ({ objetoId }: { objetoId: string }) => {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);

  // Versão ativa do cronograma (física-financeira)
  const { data: versaoAtiva } = useQuery<{
    id: string; numero_versao: number; linha_de_base: boolean;
    total_periodos: number; criado_em: string; justificativa?: string | null;
  } | null>({
    queryKey: ["cronograma-versao-ativa", objetoId],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/cronograma/objetos/${objetoId}/versoes/ativa`);
        return data;
      } catch {
        return null;
      }
    },
    retry: false,
    enabled: !!objetoId,
  });

  // Lista de todas as versões (para o modal de histórico)
  const { data: todasVersoes = [] } = useQuery<{
    id: string; numero_versao: number; linha_de_base: boolean;
    total_periodos: number; criado_em: string; justificativa?: string | null;
  }[]>({
    queryKey: ["cronograma-versoes-lista", objetoId],
    queryFn: async () => {
      const { data } = await api.get(`/cronograma/objetos/${objetoId}/versoes`);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!objetoId && showHistorico,
  });

  const { data: metas = [], isLoading, error } = useQuery<Meta[]>({
    queryKey: ["cronograma", objetoId],
    queryFn: async () => {
      const { data } = await api.get(`/cronograma/objetos/${objetoId}/metas`);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!objetoId,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MetaFormData>({
    resolver: zodResolver(metaSchema),
    defaultValues: { descricao: "", valor: 0 },
  });

  const createMetaMutation = useMutation({
    mutationFn: async (data: MetaFormData) => {
      await api.post(`/cronograma/objetos/${objetoId}/metas`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cronograma", objetoId] });
      reset();
      setShowAdd(false);
    },
  });

  const totalGeral = metas.reduce((acc, m) => acc + Number(m.valor), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Cronograma Físico-Financeiro</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {metas.length} meta{metas.length !== 1 ? "s" : ""} · Total: {fmtCurrency(totalGeral)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Badge de versão ativa */}
          {versaoAtiva ? (
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
                versaoAtiva.linha_de_base
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-sky-50 text-sky-700 border-sky-200"
              }`}>
                <CalendarDays className="h-3.5 w-3.5" />
                V{String(versaoAtiva.numero_versao).padStart(2, "0")} —{" "}
                {versaoAtiva.linha_de_base ? "Linha de Base" : "Replanejamento"}
                <span className="opacity-60">({versaoAtiva.total_periodos} meses)</span>
              </span>
              <button
                onClick={() => setShowHistorico((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brand-700 transition-colors"
                title="Ver histórico de versões"
              >
                <History className="h-3.5 w-3.5" />
              </button>
              <Link
                to={`/cronograma/${versaoAtiva.id}/editar`}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-500 transition-colors"
                title="Editar cronograma"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <Link
              to="/cronograma"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand-700 px-2.5 py-1 rounded-full border border-slate-200 hover:border-brand-200 transition-all"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Cadastrar cronograma
            </Link>
          )}
          <button
            onClick={() => window.open(`/objetos/${objetoId}/cronograma-progresso`, "_blank", "noopener")}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-600 text-sm font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
          >
            <BarChart3 className="h-4 w-4" />
            Progresso (PDF)
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-700/20 hover:bg-brand-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            Nova Meta
          </button>
        </div>
      </div>

      {/* Modal de Histórico de Versões */}
      {showHistorico && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-800">Histórico de Versões</span>
            </div>
            <button
              onClick={() => setShowHistorico(false)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Fechar
            </button>
          </div>
          {todasVersoes.length === 0 ? (
            <p className="px-5 py-4 text-sm text-slate-400 italic">Nenhuma versão encontrada.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {todasVersoes.map((v) => (
                <div key={v.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      v.linha_de_base
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-sky-50 text-sky-700 border-sky-200"
                    }`}>
                      V{String(v.numero_versao).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-slate-700">
                        {v.linha_de_base ? "Linha de Base" : "Replanejamento"}
                        <span className="ml-2 text-slate-400">{v.total_periodos} meses</span>
                      </p>
                      {v.justificativa && (
                        <p className="text-[11px] text-slate-400 italic mt-0.5">{v.justificativa}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">
                      {new Date(v.criado_em).toLocaleDateString("pt-BR")}
                    </span>
                    <Link
                      to={`/cronograma/${v.id}/editar`}
                      className="text-xs text-brand-700 hover:text-brand-500 font-medium flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" /> Ver
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
          <p className="text-sm text-rose-700">Erro ao carregar cronograma.</p>
        </div>
      )}

      {!isLoading && !error && metas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-300">
          <Target className="h-12 w-12 mb-3" />
          <p className="text-sm font-medium">Nenhuma meta cadastrada</p>
          <p className="text-xs mt-1">Estruture metas, submetas e eventos para este objeto.</p>
        </div>
      )}

      {!isLoading && !error && metas.length > 0 && (
        <div className="space-y-3">
          {metas.map((meta) => (
            <MetaSection key={meta.id} meta={meta} objetoId={objetoId} />
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <h3 className="text-lg font-bold text-slate-900">Nova Meta</h3>
            <form
              onSubmit={handleSubmit((data) => createMetaMutation.mutate(data))}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Descrição <span className="text-rose-500">*</span>
                </label>
                <input
                  {...register("descricao")}
                  placeholder="Nome da meta"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all"
                />
                {errors.descricao && (
                  <p className="text-xs text-rose-500">{errors.descricao.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Valor</label>
                <input
                  {...register("valor")}
                  type="number"
                  step="0.01"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { reset(); setShowAdd(false); }}
                  className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMetaMutation.isPending}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-700/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createMetaMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Criar Meta
                </button>
              </div>
              {createMetaMutation.isError && (
                <p className="text-xs text-rose-500 text-center">Erro ao criar meta.</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
