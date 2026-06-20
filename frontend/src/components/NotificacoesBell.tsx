import { useState } from "react";
import { Bell, CheckCircle2, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { fmtDate } from "@/utils/format";

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string | null;
  lida: boolean;
  criado_em: string;
  canal: string;
}

const NotificacoesBell = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: count = 0 } = useQuery<number>({
    queryKey: ["notificacoes", "count"],
    queryFn: async () => {
      const { data } = await api.get("/notificacoes/nao-lidas/count");
      return data.count;
    },
    refetchInterval: 30000,
  });

  const { data: notificacoes = [], isLoading } = useQuery<Notificacao[]>({
    queryKey: ["notificacoes"],
    queryFn: async () => {
      const { data } = await api.get("/notificacoes", { params: { limit: 20 } });
      return data;
    },
    enabled: open,
  });

  const marcarLida = async (id: string) => {
    try {
      await api.patch(`/notificacoes/${id}/lida`);
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
      queryClient.invalidateQueries({ queryKey: ["notificacoes", "count"] });
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Notificações"
      >
        <Bell className="h-5 w-5 text-slate-500" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white px-1 leading-none">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notificações</h3>
              {count > 0 && (
                <span className="text-xs font-medium text-rose-500">{count} não lidas</span>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 text-slate-300 animate-spin" />
                </div>
              ) : notificacoes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <Bell className="h-8 w-8 text-slate-200 mb-2" />
                  <p className="text-sm text-slate-400">Nenhuma notificação</p>
                </div>
              ) : (
                notificacoes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => !n.lida && marcarLida(n.id)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      !n.lida ? "bg-brand-50/50 dark:bg-brand-950/20" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {!n.lida && <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />}
                      <div className="min-w-0">
                        <p className={`text-sm truncate ${!n.lida ? "font-semibold text-slate-800 dark:text-slate-100" : "text-slate-600 dark:text-slate-300"}`}>
                          {n.titulo}
                        </p>
                        {n.mensagem && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.mensagem}</p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">{fmtDate(n.criado_em)}</p>
                      </div>
                      {n.lida && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-slate-300 shrink-0 mt-1" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificacoesBell;
