import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users, UserPlus, Briefcase, Trash2, Loader2, AlertTriangle,
  ShieldCheck, Eye, UserCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { fmtDate } from "@/utils/format";
import type { Obra, Usuario, PaginatedResponse } from "@/types";

interface Delegacao {
  id: string;
  obra_id: string;
  usuario_id: string;
  delegado_por_id: string | null;
  funcao: string;
  data_inicio: string;
  data_fim: string | null;
  observacao: string | null;
  ativo: boolean;
  criado_em: string;
}

const FUNCAO_LABEL: Record<string, string> = {
  FISCAL: "Fiscal",
  APOIO_N2: "Apoio N2",
  APOIO_N1: "Apoio N1",
};

const delegacaoSchema = z.object({
  obra_id: z.string().min(1, "Selecione uma obra"),
  usuario_id: z.string().min(1, "Selecione um servidor"),
  funcao: z.string().min(1, "Selecione a função"),
  data_inicio: z.string().min(1, "Data obrigatória"),
  data_fim: z.string().nullable().optional(),
  observacao: z.string().nullable().optional(),
});

type DelegacaoFormData = z.infer<typeof delegacaoSchema>;

const DelegacaoModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DelegacaoFormData>({
    resolver: zodResolver(delegacaoSchema),
    defaultValues: { obra_id: "", usuario_id: "", funcao: "FISCAL", data_inicio: new Date().toISOString().split("T")[0], data_fim: null, observacao: null },
  });

  const { data: obrasData } = useQuery<PaginatedResponse<Obra>>({
    queryKey: ["obras", "all"],
    queryFn: async () => { const { data } = await api.get("/obras", { params: { limit: 100 } }); return data; },
  });

  const { data: usuarios = [] } = useQuery<Usuario[]>({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const { data } = await api.get("/auth/usuarios");
      return Array.isArray(data) ? data : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: DelegacaoFormData) => {
      await api.post("/delegacoes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delegacoes"] });
      reset();
      onClose();
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <h3 className="text-lg font-bold text-slate-900">Nova Delegação</h3>
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Obra <span className="text-rose-500">*</span></label>
            <select {...register("obra_id")} className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none">
              <option value="">Selecione...</option>
              {(obrasData?.items || []).slice(0, 50).map((o) => (
                <option key={o.id} value={o.id}>{o.titulo.slice(0, 60)}</option>
              ))}
            </select>
            {errors.obra_id && <p className="text-xs text-rose-500">{errors.obra_id.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Servidor <span className="text-rose-500">*</span></label>
            <select {...register("usuario_id")} className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none">
              <option value="">Selecione...</option>
              {usuarios.filter((u) => ["FISCAL", "APOIO_N1", "APOIO_N2"].includes(u.tipo)).map((u) => (
                <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
              ))}
            </select>
            {errors.usuario_id && <p className="text-xs text-rose-500">{errors.usuario_id.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Função</label>
            <select {...register("funcao")} className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none">
              <option value="FISCAL">Fiscal</option>
              <option value="APOIO_N2">Apoio N2</option>
              <option value="APOIO_N1">Apoio N1</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Data início <span className="text-rose-500">*</span></label>
              <input type="date" {...register("data_inicio")} className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Data fim</label>
              <input type="date" {...register("data_fim")} className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">Cancelar</button>
            <button type="submit" disabled={createMutation.isPending} className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-700/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delegar
            </button>
          </div>
          {createMutation.isError && <p className="text-xs text-rose-500 text-center">Erro ao criar delegação.</p>}
        </form>
      </div>
    </div>
  );
};

const Gestao = () => {
  const queryClient = useQueryClient();
  const [showDelegModal, setShowDelegModal] = useState(false);

  const { data: delegacoes = [], isLoading, error } = useQuery<Delegacao[]>({
    queryKey: ["delegacoes"],
    queryFn: async () => {
      const { data } = await api.get("/delegacoes");
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: obrasGestao } = useQuery<PaginatedResponse<Obra>>({
    queryKey: ["obras", "gestao"],
    queryFn: async () => { const { data } = await api.get("/obras", { params: { limit: 10 } }); return data; },
  });

  const revogarMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/delegacoes/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["delegacoes"] }); },
  });

  const ativas = delegacoes.filter((d) => d.ativo);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-brand-700 to-brand-500 p-8 text-white shadow-xl shadow-brand-700/20">
        <p className="text-sm font-medium text-white/70 mb-1">Painel do Chefe de Setor</p>
        <h2 className="text-3xl font-bold mb-2">Gestão de Obras e Equipe</h2>
        <p className="text-white/65 text-sm">Delegue obras para fiscais e apoios, acompanhe o status e aprove ações críticas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200"><Briefcase className="h-5 w-5 text-sky-600" /></div>
            <span className="text-xs text-slate-400">Total de obras</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{obrasGestao?.total ?? "—"}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-brand-50 border border-brand-200"><UserCheck className="h-5 w-5 text-brand-700" /></div>
            <span className="text-xs text-slate-400">Delegações ativas</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{ativas.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
            <span className="text-xs text-slate-400">Obras sem fiscal</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{(obrasGestao?.total || 0) - ativas.filter((d) => d.funcao === "FISCAL").length}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Delegações Ativas</h3>
        <button onClick={() => setShowDelegModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-700/20 hover:bg-brand-500 transition-all">
          <UserPlus className="h-4 w-4" />Nova Delegação
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 text-slate-300 animate-spin" /></div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
          <p className="text-sm text-rose-700">Erro ao carregar delegações.</p>
        </div>
      )}

      {!isLoading && !error && ativas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-300">
          <Users className="h-12 w-12 mb-3" />
          <p className="text-sm font-medium">Nenhuma delegação ativa</p>
          <p className="text-xs mt-1">Comece delegando obras para fiscais e apoios.</p>
        </div>
      )}

      {!isLoading && !error && ativas.length > 0 && (
        <div className="space-y-3">
          {ativas.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${d.funcao === "FISCAL" ? "bg-amber-50 border border-amber-200" : "bg-sky-50 border border-sky-200"}`}>
                {d.funcao === "FISCAL" ? <ShieldCheck className="h-5 w-5 text-amber-600" /> : <Eye className="h-5 w-5 text-sky-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{FUNCAO_LABEL[d.funcao] || d.funcao}</span>
                  <span className="text-sm font-medium text-slate-800">{d.usuario_id?.slice(0, 8)}...</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Desde {fmtDate(d.data_inicio)}{d.data_fim ? ` até ${fmtDate(d.data_fim)}` : " (sem data fim)"}</p>
              </div>
              <Link to={`/contratos/${d.obra_id}`} className="text-xs text-brand-700 hover:text-brand-500">Ver obra →</Link>
              <button onClick={() => revogarMutation.mutate(d.id)} className="text-slate-300 hover:text-rose-500 transition-colors" title="Revogar">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <DelegacaoModal open={showDelegModal} onClose={() => setShowDelegModal(false)} />
    </div>
  );
};

export default Gestao;
