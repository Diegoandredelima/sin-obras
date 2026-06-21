import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle, Bell, CheckCircle2, Loader2, UserPlus,
  Clock, ShieldOff, Pause, FileText,
} from "lucide-react";
import api from "@/services/api";
import { fmtDate } from "@/utils/format";
import type { Usuario } from "@/types";

interface Alerta {
  id: string;
  obra_id: string | null;
  tipo: string;
  prioridade: string;
  titulo: string;
  descricao: string | null;
  resolvido: boolean;
  resolvido_em: string | null;
  delegado_para_id: string | null;
  prazo_acao: string | null;
  criado_em: string;
}

const PRIORIDADE_CONFIG: Record<string, { label: string; cls: string; order: number }> = {
  CRITICA: { label: "Crítica", cls: "bg-rose-100 text-rose-700 border-rose-200", order: 0 },
  ALTA: { label: "Alta", cls: "bg-orange-100 text-orange-700 border-orange-200", order: 1 },
  MEDIA: { label: "Média", cls: "bg-amber-100 text-amber-700 border-amber-200", order: 2 },
  BAIXA: { label: "Baixa", cls: "bg-slate-100 text-slate-600 border-slate-200", order: 3 },
};

const TIPO_ICON: Record<string, typeof AlertTriangle> = {
  PRAZO_VENCIDO: Clock,
  SEM_VISTORIA: AlertTriangle,
  ART_VENCENDO: ShieldOff,
  ART_VENCIDA: ShieldOff,
  PARALISADA: Pause,
  NOTIFICACAO_PENDENTE: FileText,
  MEDICAO_PENDENTE: FileText,
};

const AlertaCard = ({
  alerta,
  onDelegar,
  onResolver,
}: {
  alerta: Alerta;
  onDelegar: (id: string) => void;
  onResolver: (id: string) => void;
}) => {
  const pc = PRIORIDADE_CONFIG[alerta.prioridade] || PRIORIDADE_CONFIG.MEDIA;
  const Icon = TIPO_ICON[alerta.tipo] || Bell;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 space-y-3 ${alerta.resolvido ? "opacity-60 border-slate-100" : "border-slate-100 hover:shadow-md transition-shadow"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`p-2 rounded-xl ${alerta.resolvido ? "bg-slate-50" : pc.cls} shrink-0`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{alerta.titulo}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${pc.cls}`}>{pc.label}</span>
              <span className="text-[10px] text-slate-400">{fmtDate(alerta.criado_em)}</span>
              {alerta.resolvido && (
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Resolvido</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {alerta.descricao && (
        <p className="text-xs text-slate-500 leading-relaxed">{alerta.descricao}</p>
      )}

      {!alerta.resolvido && (
        <div className="flex items-center gap-2 pt-1">
          {alerta.obra_id && (
            <Link to={`/obras/${alerta.obra_id}`} className="text-xs text-brand-700 hover:text-brand-500 font-medium">Ver obra →</Link>
          )}
          <div className="flex-1" />
          <button onClick={() => onDelegar(alerta.id)} className="text-xs text-sky-600 hover:text-sky-500 font-medium flex items-center gap-1">
            <UserPlus className="h-3 w-3" /> Delegar
          </button>
          <button onClick={() => onResolver(alerta.id)} className="text-xs text-brand-700 hover:text-brand-500 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Resolver
          </button>
        </div>
      )}
    </div>
  );
};

const DelegarModal = ({
  alertaId,
  open,
  onClose,
}: {
  alertaId: string | null;
  open: boolean;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [prazo, setPrazo] = useState("");

  const { data: usuarios = [] } = useQuery<Usuario[]>({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const { data } = await api.get("/auth/usuarios");
      return Array.isArray(data) ? data : [];
    },
  });

  const delegarMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/alertas/${alertaId}/delegar`, {
        delegado_para_id: userId,
        prazo_acao: prazo || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertas"] });
      onClose();
      setUserId("");
      setPrazo("");
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <h3 className="text-lg font-bold text-slate-900">Delegar Alerta</h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Servidor responsável</label>
            <select value={userId} onChange={(e) => setUserId(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none">
              <option value="">Selecione...</option>
              {usuarios.filter((u) => ["FISCAL", "APOIO_N1", "APOIO_N2"].includes(u.tipo)).map((u) => (
                <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Prazo para ação</label>
            <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">Cancelar</button>
            <button onClick={() => delegarMutation.mutate()} disabled={!userId || delegarMutation.isPending}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-700/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {delegarMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delegar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Alertas = () => {
  const queryClient = useQueryClient();
  const [filtroPrioridade, setFiltroPrioridade] = useState<string | null>(null);
  const [mostrarResolvidos, setMostrarResolvidos] = useState(false);
  const [delegarId, setDelegarId] = useState<string | null>(null);

  const { data: alertas = [], isLoading, error } = useQuery<Alerta[]>({
    queryKey: ["alertas", filtroPrioridade, mostrarResolvidos],
    queryFn: async () => {
      const params: Record<string, unknown> = {};
      if (filtroPrioridade) params.prioridade = filtroPrioridade;
      if (!mostrarResolvidos) params.resolvido = false;
      const { data } = await api.get("/alertas", { params });
      return Array.isArray(data) ? data : [];
    },
  });

  const gerarMutation = useMutation({
    mutationFn: async () => { await api.post("/alertas/gerar"); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["alertas"] }); },
  });

  const resolverMutation = useMutation({
    mutationFn: async (id: string) => { await api.patch(`/alertas/${id}/resolver`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["alertas"] }); },
  });

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 p-8 text-white shadow-xl shadow-amber-700/20">
        <p className="text-sm font-medium text-white/70 mb-1">Central de Alertas</p>
        <h2 className="text-3xl font-bold mb-2">Alertas e Pendências</h2>
        <p className="text-white/65 text-sm">Monitore riscos, delegue ações e mantenha o portfólio sob controle.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Filtrar:</span>
          {["CRITICA", "ALTA", "MEDIA", "BAIXA"].map((p) => {
            const pc = PRIORIDADE_CONFIG[p];
            return (
              <button key={p} onClick={() => setFiltroPrioridade(filtroPrioridade === p ? null : p)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${filtroPrioridade === p ? pc.cls : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"}`}>
                {pc.label}
              </button>
            );
          })}
          <button onClick={() => setMostrarResolvidos(!mostrarResolvidos)}
            className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${mostrarResolvidos ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
            Resolvidos
          </button>
        </div>
        <button onClick={() => gerarMutation.mutate()} disabled={gerarMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-amber-200 hover:bg-amber-500 transition-all disabled:opacity-50">
          {gerarMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
          Gerar Alertas
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-slate-300 animate-spin" /></div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          <p className="text-sm text-rose-700">Erro ao carregar alertas.</p>
        </div>
      )}

      {!isLoading && !error && alertas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-300">
          <Bell className="h-12 w-12 mb-3" />
          <p className="text-sm font-medium">Nenhum alerta</p>
          <p className="text-xs mt-1">Clique em "Gerar Alertas" para analisar o portfólio.</p>
        </div>
      )}

      {!isLoading && !error && alertas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alertas.map((a) => (
            <AlertaCard key={a.id} alerta={a} onDelegar={setDelegarId} onResolver={(id) => resolverMutation.mutate(id)} />
          ))}
        </div>
      )}

      <DelegarModal alertaId={delegarId} open={!!delegarId} onClose={() => setDelegarId(null)} />
    </div>
  );
};

export default Alertas;
