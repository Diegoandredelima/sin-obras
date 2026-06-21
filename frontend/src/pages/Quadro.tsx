import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, KanbanSquare, Trash2, AlertCircle, Loader2 } from "lucide-react";
import api from "@/services/api";
import type { Tarefa, TarefaStatus, TarefaPrioridade } from "@/types";
import { fmtDate } from "@/utils/format";

const COLUMNS: { id: TarefaStatus; label: string; headerCls: string; dotCls: string }[] = [
  { id: "A_FAZER", label: "A Fazer", headerCls: "bg-slate-100 text-slate-600", dotCls: "bg-slate-400" },
  { id: "EM_ANDAMENTO", label: "Em Andamento", headerCls: "bg-amber-50 text-amber-700", dotCls: "bg-amber-400" },
  { id: "CONCLUIDO", label: "Concluído", headerCls: "bg-emerald-50 text-emerald-700", dotCls: "bg-emerald-400" },
];

const PRIORITY_CONFIG: Record<TarefaPrioridade, { label: string; cls: string }> = {
  BAIXA: { label: "Baixa", cls: "bg-slate-100 text-slate-500" },
  MEDIA: { label: "Média", cls: "bg-sky-100 text-sky-600" },
  ALTA: { label: "Alta", cls: "bg-orange-100 text-orange-600" },
  URGENTE: { label: "Urgente", cls: "bg-rose-100 text-rose-600" },
};

const tarefaSchema = z.object({
  titulo: z.string().min(1, "Obrigatório").max(200),
  prioridade: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]),
  prazo: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
});

type TarefaFormData = z.infer<typeof tarefaSchema>;

const TarefaCard = ({
  tarefa,
  onMove,
  onDelete,
}: {
  tarefa: Tarefa;
  onMove: (id: string, novoStatus: TarefaStatus) => void;
  onDelete: (id: string) => void;
}) => {
  const priority = PRIORITY_CONFIG[tarefa.prioridade];
  const cols = COLUMNS.map((c) => c.id);
  const currentIdx = cols.indexOf(tarefa.status);
  const isOverdue = tarefa.prazo && new Date(tarefa.prazo + "T00:00:00") < new Date(new Date().toDateString());

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow group space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800 leading-snug">{tarefa.titulo}</p>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${priority.cls}`}>
          {priority.label}
        </span>
      </div>
      {tarefa.descricao && (
        <p className="text-xs text-slate-400 leading-relaxed">{tarefa.descricao}</p>
      )}
      {tarefa.prazo && (
        <p className={`text-xs ${isOverdue ? "text-rose-600 font-semibold" : "text-slate-400"}`}>
          Prazo: <span className={isOverdue ? "text-rose-700" : "font-medium text-slate-600"}>{fmtDate(tarefa.prazo)}</span>
          {isOverdue && (
            <span className="inline-flex items-center gap-1 ml-1.5 bg-rose-50 text-rose-600 text-[10px] font-semibold px-1.5 py-0.5 rounded">
              <AlertCircle className="h-2.5 w-2.5" />
              Vencido
            </span>
          )}
        </p>
      )}
      <div className="flex gap-1 pt-1">
        {currentIdx > 0 && (
          <button
            onClick={() => onMove(tarefa.id, cols[currentIdx - 1])}
            className="text-xs text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-lg transition-all"
          >
            ← Voltar
          </button>
        )}
        {currentIdx < cols.length - 1 && (
          <button
            onClick={() => onMove(tarefa.id, cols[currentIdx + 1])}
            className="text-xs text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded-lg transition-all ml-auto"
          >
            Avançar →
          </button>
        )}
        <button
          onClick={() => onDelete(tarefa.id)}
          className="text-xs text-slate-300 hover:text-rose-500 hover:bg-rose-50 px-1.5 py-1 rounded-lg transition-all"
          title="Excluir"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

const TarefaModal = ({
  open,
  onClose,
  obraId,
}: {
  open: boolean;
  onClose: () => void;
  obraId?: string | null;
}) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TarefaFormData>({
    resolver: zodResolver(tarefaSchema),
    defaultValues: { titulo: "", prioridade: "MEDIA", prazo: null, descricao: null },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TarefaFormData) => {
      const payload = {
        titulo: data.titulo,
        prioridade: data.prioridade,
        prazo: data.prazo || undefined,
        descricao: data.descricao || undefined,
        obra_id: obraId || undefined,
      };
      await api.post("/tarefas", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarefas"] });
      reset();
      onClose();
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <h3 className="text-lg font-bold text-slate-900">Nova Tarefa</h3>
        <form
          onSubmit={handleSubmit((data) => createMutation.mutate(data))}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Título <span className="text-rose-500">*</span>
            </label>
            <input
              {...register("titulo")}
              placeholder="Descreva a tarefa..."
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all"
            />
            {errors.titulo && (
              <p className="text-xs text-rose-500">{errors.titulo.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Prioridade</label>
            <select
              {...register("prioridade")}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all"
            >
              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Prazo</label>
            <input
              type="date"
              {...register("prazo")}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Descrição</label>
            <textarea
              {...register("descricao")}
              rows={2}
              placeholder="Detalhes adicionais..."
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-700/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar Tarefa
            </button>
          </div>
          {createMutation.isError && (
            <p className="text-xs text-rose-500 text-center">
              Erro ao criar tarefa. Tente novamente.
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

const Quadro = () => {
  const [searchParams] = useSearchParams();
  const obraId = searchParams.get("obra_id");
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: tarefas = [], isLoading, error } = useQuery<Tarefa[]>({
    queryKey: ["tarefas", obraId],
    queryFn: async () => {
      const { data } = await api.get("/tarefas", {
        params: obraId ? { obra_id: obraId } : undefined,
      });
      return Array.isArray(data) ? data : [];
    },
  });

  const moveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TarefaStatus }) => {
      await api.patch(`/tarefas/${id}/mover`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarefas"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tarefas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarefas"] });
    },
  });

  return (
    <div className="space-y-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Quadro de Tarefas</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {tarefas.length} tarefas no total
            {obraId && <span className="text-slate-400"> (filtrado por obra)</span>}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-700/20 hover:bg-brand-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          <p className="text-sm text-rose-700">Erro ao carregar tarefas. Verifique sua conexão.</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {COLUMNS.map((col) => {
            const items = tarefas.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="flex flex-col gap-3">
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${col.headerCls}`}>
                  <span className={`h-2 w-2 rounded-full ${col.dotCls}`} />
                  <span className="text-sm font-semibold">{col.label}</span>
                  <span className="ml-auto text-xs font-medium bg-white/60 rounded-full px-2 py-0.5">
                    {items.length}
                  </span>
                </div>

                <div className="space-y-3 min-h-[200px]">
                  {items.map((t) => (
                    <TarefaCard
                      key={t.id}
                      tarefa={t}
                      onMove={(id, status) => moveMutation.mutate({ id, status })}
                      onDelete={(id) => deleteMutation.mutate(id)}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-slate-200 text-slate-300">
                      <KanbanSquare className="h-8 w-8 mb-1" />
                      <span className="text-xs">Sem tarefas</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TarefaModal open={showModal} onClose={() => setShowModal(false)} obraId={obraId} />
    </div>
  );
};

export default Quadro;
