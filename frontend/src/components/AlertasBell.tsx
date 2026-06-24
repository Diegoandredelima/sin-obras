import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { fmtDate } from "@/utils/format";
import type { Role } from "@/types";

interface Alerta {
  id: string;
  objeto_id: string | null;
  tipo: string;
  prioridade: string;
  titulo: string;
  descricao: string | null;
  resolvido: boolean;
  criado_em: string;
}

const PRIORIDADE_CLS: Record<string, string> = {
  CRITICA: "bg-rose-100 text-rose-700 border-rose-200",
  ALTA: "bg-orange-100 text-orange-700 border-orange-200",
  MEDIA: "bg-amber-100 text-amber-700 border-amber-200",
  BAIXA: "bg-slate-100 text-slate-600 border-slate-200",
};

const ROLES_COM_ALERTAS: Role[] = ["APOIO_N2", "COORDENADOR", "SECRETARIO", "ENGENHEIRO"];

const AlertasBell = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const userRole = (user?.tipo as Role) || "EMPRESA";
  const podeVer = ROLES_COM_ALERTAS.includes(userRole);

  // Pendências persistem até serem concluídas (resolvido = false)
  const { data: alertas = [], isLoading } = useQuery<Alerta[]>({
    queryKey: ["alertas", "pendentes"],
    queryFn: async () => {
      const { data } = await api.get("/alertas", { params: { resolvido: false } });
      return Array.isArray(data) ? data : [];
    },
    enabled: podeVer,
    refetchInterval: 60000,
  });

  const resolverMutation = useMutation({
    mutationFn: async (id: string) => { await api.patch(`/alertas/${id}/resolver`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertas"] });
    },
  });

  if (!podeVer) return null;

  const count = alertas.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
        title="Alertas e pendências"
      >
        <AlertTriangle className={`h-5 w-5 ${count > 0 ? "text-amber-500" : "text-slate-500"}`} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white px-1 leading-none">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Alertas e pendências</h3>
              {count > 0 && (
                <span className="text-xs font-medium text-amber-600">{count} em aberto</span>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 text-slate-300 animate-spin" />
                </div>
              ) : count === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-300 mb-2" />
                  <p className="text-sm text-slate-400">Nenhuma pendência em aberto</p>
                </div>
              ) : (
                alertas.map((a) => {
                  const cls = PRIORIDADE_CLS[a.prioridade] || PRIORIDADE_CLS.MEDIA;
                  return (
                    <div
                      key={a.id}
                      className="px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`p-1.5 rounded-lg border ${cls} shrink-0`}>
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">{a.titulo}</p>
                          {a.descricao && (
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{a.descricao}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            <p className="text-[10px] text-slate-400">{fmtDate(a.criado_em)}</p>
                            {a.objeto_id && (
                              <Link
                                to={`/objetos/${a.objeto_id}`}
                                onClick={() => setOpen(false)}
                                className="text-[10px] font-medium text-brand-700 hover:text-brand-500"
                              >
                                Ver objeto →
                              </Link>
                            )}
                            <button
                              onClick={() => resolverMutation.mutate(a.id)}
                              disabled={resolverMutation.isPending}
                              className="text-[10px] font-medium text-emerald-600 hover:text-emerald-500 flex items-center gap-1 disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Concluir
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <Link
              to="/alertas"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-center text-xs font-semibold text-brand-700 hover:bg-slate-50 border-t border-slate-100 transition-colors"
            >
              Abrir central de alertas
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default AlertasBell;
