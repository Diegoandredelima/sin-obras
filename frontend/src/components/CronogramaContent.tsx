import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronRight, ChevronDown, Plus, Loader2,
  AlertTriangle, Target, Layers, Box,
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
  quantidade: z.coerce.number().min(0).optional(),
  unidade: z.string().max(20).optional(),
  valor_unitario: z.coerce.number().min(0).optional(),
});

type MetaFormData = z.infer<typeof metaSchema>;
type SubmetaFormData = z.infer<typeof submetaSchema>;
type EventoFormData = z.infer<typeof eventoSchema>;

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
  obraId,
}: {
  submeta: Submeta;
  obraId: string;
}) => {
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<EventoFormData>({
    resolver: zodResolver(eventoSchema),
    defaultValues: { descricao: "", quantidade: 0, unidade: "un", valor_unitario: 0 },
  });

  const createMutation = useMutation({
    mutationFn: async (data: EventoFormData) => {
      await api.post(`/cronograma/submetas/${submeta.id}/eventos`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cronograma", obraId] });
      reset();
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
                className="flex items-center gap-2 py-1"
              >
                <input
                  {...register("descricao")}
                  placeholder="Descrição do evento"
                  className="flex-1 text-xs rounded-lg border border-slate-200 px-2 py-1 focus:border-sky-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="text-[10px] font-semibold text-white bg-sky-500 hover:bg-sky-400 px-2 py-1 rounded-lg disabled:opacity-50"
                >
                  Salvar
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
        </div>
      )}
    </div>
  );
};

const MetaSection = ({
  meta,
  obraId,
}: {
  meta: Meta;
  obraId: string;
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
      queryClient.invalidateQueries({ queryKey: ["cronograma", obraId] });
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
            <SubmetaSection key={sub.id} submeta={sub} obraId={obraId} />
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

export const CronogramaContent = ({ obraId }: { obraId: string }) => {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data: metas = [], isLoading, error } = useQuery<Meta[]>({
    queryKey: ["cronograma", obraId],
    queryFn: async () => {
      const { data } = await api.get(`/cronograma/obras/${obraId}/metas`);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!obraId,
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
      await api.post(`/cronograma/obras/${obraId}/metas`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cronograma", obraId] });
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
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-700/20 hover:bg-brand-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nova Meta
        </button>
      </div>

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
          <p className="text-xs mt-1">Estruture metas, submetas e eventos para esta obra.</p>
        </div>
      )}

      {!isLoading && !error && metas.length > 0 && (
        <div className="space-y-3">
          {metas.map((meta) => (
            <MetaSection key={meta.id} meta={meta} obraId={obraId} />
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
