import {
  Building2, CheckCircle2, AlertTriangle,
  Briefcase, KanbanSquare, ArrowRight, Activity,
  Search, Filter,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import api from "@/services/api";
import type { Obra, ObraStats, PaginatedResponse, RelatorioResumo } from "@/types";
import { useState } from "react";
import RelatorioCharts from "@/components/RelatorioCharts";

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub: string;
  color?: "brand" | "amber" | "rose" | "sky" | "success";
  loading?: boolean;
}

const KPICard = ({ icon: Icon, label, value, sub, color = "brand", loading }: KPICardProps) => {
  const colors: Record<string, string> = {
    brand:   "bg-brand-50 text-brand-700 border-brand-200",
    success: "bg-success-50 text-success-500 border-success-200",
    amber:   "bg-amber-50 text-amber-600 border-amber-100",
    rose:    "bg-rose-50 text-rose-600 border-rose-100",
    sky:     "bg-sky-50 text-sky-600 border-sky-100",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl border ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">{sub}</span>
      </div>
      {loading ? (
        <div className="h-9 w-16 bg-slate-100 animate-pulse rounded-lg mb-1" />
      ) : (
        <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
      )}
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
};

const SAUDE_CONFIG = {
  VERDE:    { label: "Em dia", dot: "bg-emerald-400", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  AMARELO:  { label: "Atenção", dot: "bg-amber-400", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  VERMELHO: { label: "Crítico", dot: "bg-rose-400", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};

const SITUACAO_LABEL: Record<string, string> = {
  EM_ANDAMENTO: "Em Andamento",
  CONCLUIDA:    "Concluída",
  PARALISADA:   "Paralisada",
  A_INICIAR:    "A Iniciar",
  INACABADA:    "Inacabada",
  RESCINDIDA:   "Rescindida",
  ARQUIVADA:    "Arquivada",
  EXTINTA:      "Extinta",
  CEDIDA:       "Cedida",
};

const Dashboard = () => {
  const { user } = useAuthStore();
  const [filtroSituacao, setFiltroSituacao] = useState<string | null>(null);
  const [filtroSaude, setFiltroSaude] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<ObraStats>({
    queryKey: ["obras", "stats"],
    queryFn: async () => {
      const { data } = await api.get("/obras/stats");
      return data;
    },
  });

  const { data: resumo } = useQuery<RelatorioResumo>({
    queryKey: ["relatorio", "resumo"],
    queryFn: async () => {
      const { data } = await api.get("/relatorios/resumo");
      return data;
    },
  });

  const { data: obrasData, isLoading: obrasLoading } = useQuery<PaginatedResponse<Obra>>({
    queryKey: ["obras", "dashboard", filtroSituacao, filtroSaude],
    queryFn: async () => {
      const params: Record<string, unknown> = { limit: 20, sort: "criado_em", order: "desc" };
      if (filtroSituacao) params.situacao = filtroSituacao;
      if (filtroSaude) params.saude = filtroSaude;
      const { data } = await api.get("/obras", { params });
      return data;
    },
  });

  const obras = obrasData?.items ?? [];
  const loading = statsLoading || obrasLoading;
  const s = stats?.por_situacao || {};
  const emExecucao = (s.EM_ANDAMENTO || 0) + (stats?.por_status?.EM_EXECUCAO || 0);
  const atencao = (s.PARALISADA || 0) + (s.INACABADA || 0);
  const concluidas = s.CONCLUIDA || 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="rounded-2xl bg-gradient-to-r from-brand-700 to-brand-500 p-8 text-white shadow-xl shadow-brand-700/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-64 opacity-10">
          <Building2 className="h-full w-full" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-1 sin-stripe opacity-70" />
        <div className="relative">
          <p className="text-sm font-medium text-white/70 mb-1">Bem-vindo ao painel,</p>
          <h2 className="text-3xl font-bold mb-2">{user?.nome || "Usuário"}</h2>
          <p className="text-white/65 text-sm">Confira o resumo dos contratos e obras sob sua responsabilidade.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard icon={Briefcase}      label="Contratos Ativos"   value={stats?.total ?? "—"}  sub="total"       color="sky"     loading={loading} />
        <KPICard icon={Activity}       label="Em Execução"        value={emExecucao || "—"}     sub="ativas"      color="brand"   loading={loading} />
        <KPICard icon={AlertTriangle}  label="Paralisadas"        value={atencao || "—"}        sub="alertas"     color="amber"   loading={loading} />
        <KPICard icon={CheckCircle2}   label="Concluídas"         value={concluidas || "—"}     sub="total"       color="success" loading={loading} />
      </div>

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Distribuição por situação oficial</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.por_situacao || {}).sort((a, b) => b[1] - a[1]).map(([sit, n]) => (
                <button
                  key={sit}
                  onClick={() => setFiltroSituacao(filtroSituacao === sit ? null : sit)}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                    filtroSituacao === sit
                      ? "bg-brand-50 text-brand-700 border-brand-300"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="font-semibold">{n}</span>
                  <span>{SITUACAO_LABEL[sit] || sit}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Saúde do portfólio</h3>
            <div className="flex gap-3">
              {(["VERDE", "AMARELO", "VERMELHO"] as const).map((saude) => {
                const cfg = SAUDE_CONFIG[saude];
                return (
                  <button
                    key={saude}
                    onClick={() => setFiltroSaude(filtroSaude === saude ? null : saude)}
                    className={`flex-1 rounded-xl p-4 text-center border-2 transition-all ${
                      filtroSaude === saude
                        ? `${cfg.bg} ${cfg.text} ${cfg.border} shadow-sm`
                        : "bg-slate-50 border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <span className={`inline-block h-3 w-3 rounded-full ${cfg.dot} mb-2`} />
                    <p className="text-lg font-bold">{saude === "VERDE" ? emExecucao || "—" : saude === "AMARELO" ? atencao || "—" : 0}</p>
                    <p className="text-[10px] font-semibold uppercase mt-1">{cfg.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Obras Recentes</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {(filtroSituacao || filtroSaude) ? "Filtro ativo" : "Últimas obras cadastradas"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(filtroSituacao || filtroSaude) && (
              <button
                onClick={() => { setFiltroSituacao(null); setFiltroSaude(null); }}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <Filter className="h-3 w-3" />
                Limpar filtros
              </button>
            )}
            <Link
              to="/obras"
              className="flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-500 transition-colors"
            >
              Ver todas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-slate-100 animate-pulse rounded w-2/3" />
                    <div className="h-3 bg-slate-100 animate-pulse rounded w-1/3" />
                  </div>
                </div>
              ))
            : obras.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-400">
                  <Search className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Nenhuma obra encontrada com os filtros atuais.</p>
                </div>
              )
            : obras.map((obra) => (
                <Link
                  key={obra.id}
                  to={`/obras/${obra.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/80 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate group-hover:text-brand-700">{obra.titulo}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{obra.municipio}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="hidden sm:block w-28">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-slate-500">{Number(obra.percentual_executado || 0).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full bg-brand-500 transition-all"
                          style={{ width: `${obra.percentual_executado || 0}%` }}
                        />
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${SAUDE_CONFIG[(obra.saude || "VERDE") as keyof typeof SAUDE_CONFIG]?.bg || "bg-slate-50"} ${SAUDE_CONFIG[(obra.saude || "VERDE") as keyof typeof SAUDE_CONFIG]?.text || "text-slate-500"} ${SAUDE_CONFIG[(obra.saude || "VERDE") as keyof typeof SAUDE_CONFIG]?.border || "border-slate-200"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${SAUDE_CONFIG[(obra.saude || "VERDE") as keyof typeof SAUDE_CONFIG]?.dot || "bg-slate-400"}`} />
                      {SAUDE_CONFIG[(obra.saude || "VERDE") as keyof typeof SAUDE_CONFIG]?.label || obra.saude}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
                  </div>
                </Link>
              ))
          }
        </div>
      </div>

      {resumo && (resumo.obras_por_status.length > 0 || resumo.obras_por_orgao.length > 0) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Análise gráfica</h3>
              <p className="text-xs text-slate-400 mt-0.5">Distribuição de obras e valores por status e órgão</p>
            </div>
            <Link
              to="/relatorio"
              className="flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-500 transition-colors"
            >
              Gerar relatório
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <RelatorioCharts data={resumo} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: "/obras/nova",  icon: Briefcase,    title: "Novo Contrato",    desc: "Cadastre um novo contrato de obra",    color: "text-brand-700 bg-brand-50" },
          { to: "/contratos",  icon: Briefcase,    title: "Ver Contratos",     desc: `${stats?.total ?? "—"} contratos no sistema`,          color: "text-sky-600 bg-sky-50" },
          { to: "/quadro",     icon: KanbanSquare, title: "Quadro de Tarefas", desc: "Acompanhe as tarefas Kanban",           color: "text-violet-600 bg-violet-50" },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group"
          >
            <div className={`p-3 rounded-xl ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">{item.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
