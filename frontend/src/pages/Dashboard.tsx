import {
  Building2, CheckCircle2, AlertTriangle, HeartPulse,
  Briefcase, KanbanSquare, ArrowRight, Activity, Bell,
  FileBarChart, ListChecks, Settings2, PlusCircle, Hourglass,
  Search, Filter, type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import api from "@/services/api";
import type { Objeto, ObjetoStats, PaginatedResponse, RelatorioResumo, Role } from "@/types";
import { lazy, Suspense, useState } from "react";

// recharts é pesado (~700 KB); carregamos os gráficos sob demanda.
const DashboardCharts = lazy(() => import("@/components/DashboardCharts"));

// ---------------------------------------------------------------------------
// Config por papel — cada usuário tem o seu painel
// ---------------------------------------------------------------------------
const RANK: Record<string, number> = {
  EMPRESA: 0, FISCAL: 1, APOIO_N1: 2, APOIO_N2: 3, ENGENHEIRO: 3, COORDENADOR: 4, SECRETARIO: 5,
};

const ROLE_LABEL: Record<string, string> = {
  EMPRESA: "Empresa", FISCAL: "Fiscal", APOIO_N1: "Apoio N1", APOIO_N2: "Apoio N2",
  ENGENHEIRO: "Engenharia", COORDENADOR: "Coordenação", SECRETARIO: "Secretaria",
};

const SAUDACAO: Record<string, string> = {
  EMPRESA:    "Acompanhe o andamento das objetos dos seus contratos.",
  FISCAL:     "Acompanhe a saúde e a execução das objetos sob sua fiscalização.",
  APOIO_N1:   "Resumo das objetos que você cadastrou e acompanha.",
  APOIO_N2:   "Visão técnica do portfólio de objetos.",
  ENGENHEIRO: "Visão técnica do portfólio de objetos.",
  COORDENADOR:"Visão consolidada do portfólio de objetos do estado.",
  SECRETARIO: "Panorama executivo das objetos e contratos da Secretaria.",
};

interface Metricas {
  total: number; emExecucao: number; paralisadas: number; concluidas: number;
  planejadas: number; aIniciar: number; critico: number; atencao: number; emDia: number;
}

interface KPIDef {
  icon: LucideIcon; label: string; value: number; sub: string;
  color: "brand" | "amber" | "rose" | "sky" | "success";
}

function kpisDoPapel(role: string, m: Metricas): KPIDef[] {
  switch (role) {
    case "EMPRESA":
      return [
        { icon: Briefcase,     label: "Minhas Objetos",  value: m.total,       sub: "total",   color: "sky" },
        { icon: Activity,      label: "Em Execução",   value: m.emExecucao,  sub: "ativas",  color: "brand" },
        { icon: HeartPulse,    label: "Saúde Crítica", value: m.critico,     sub: "alertas", color: "rose" },
        { icon: CheckCircle2,  label: "Concluídas",    value: m.concluidas,  sub: "total",   color: "success" },
      ];
    case "FISCAL":
      return [
        { icon: Building2,     label: "Sob Fiscalização", value: m.total,      sub: "objetos",   color: "sky" },
        { icon: Activity,      label: "Em Execução",      value: m.emExecucao, sub: "ativas",  color: "brand" },
        { icon: AlertTriangle, label: "Atenção",          value: m.atencao,    sub: "amarelo", color: "amber" },
        { icon: HeartPulse,    label: "Crítico",          value: m.critico,    sub: "vermelho",color: "rose" },
      ];
    case "APOIO_N1":
      return [
        { icon: Briefcase,    label: "Cadastradas", value: m.total,       sub: "por você", color: "sky" },
        { icon: Activity,     label: "Em Execução", value: m.emExecucao,  sub: "ativas",   color: "brand" },
        { icon: Hourglass,    label: "A Iniciar",   value: m.aIniciar,    sub: "pendentes",color: "amber" },
        { icon: CheckCircle2, label: "Concluídas",  value: m.concluidas,  sub: "total",    color: "success" },
      ];
    default: // APOIO_N2, ENGENHEIRO, COORDENADOR, SECRETARIO
      return [
        { icon: Briefcase,     label: "Total de Objetos", value: m.total,       sub: "portfólio", color: "sky" },
        { icon: Activity,      label: "Em Execução",    value: m.emExecucao,  sub: "ativas",    color: "brand" },
        { icon: AlertTriangle, label: "Paralisadas",    value: m.paralisadas, sub: "alertas",   color: "amber" },
        { icon: CheckCircle2,  label: "Concluídas",     value: m.concluidas,  sub: "total",     color: "success" },
      ];
  }
}

interface AcaoDef { to: string; icon: LucideIcon; title: string; desc: string; color: string; }

function acoesDoPapel(role: string, total: number): AcaoDef[] {
  const objetos: AcaoDef    = { to: "/objetos",      icon: Building2,    title: "Objetos",            desc: `${total} no seu painel`,        color: "text-sky-600 bg-sky-50" };
  const quadro: AcaoDef   = { to: "/quadro",     icon: KanbanSquare, title: "Quadro de Tarefas",desc: "Acompanhe as tarefas Kanban",   color: "text-violet-600 bg-violet-50" };
  const alertas: AcaoDef  = { to: "/alertas",    icon: Bell,         title: "Alertas",          desc: "Pendências e notificações",     color: "text-rose-600 bg-rose-50" };
  const contratos: AcaoDef= { to: "/contratos",  icon: Briefcase,    title: "Contratos",        desc: "Gerir contratos (documento-mãe)", color: "text-brand-700 bg-brand-50" };
  const novoContrato: AcaoDef = { to: "/contratos/novo", icon: PlusCircle, title: "Novo Contrato",    desc: "Cadastrar contrato e seus objetos", color: "text-brand-700 bg-brand-50" };
  const relatorio: AcaoDef= { to: "/relatorio",  icon: FileBarChart, title: "Relatórios",       desc: "Gerar e exportar relatórios",   color: "text-emerald-600 bg-emerald-50" };
  const gestao: AcaoDef   = { to: "/gestao",     icon: Settings2,    title: "Gestão",           desc: "Usuários, órgãos e delegações",  color: "text-slate-600 bg-slate-100" };
  const tarefas: AcaoDef  = { to: "/quadro",     icon: ListChecks,   title: "Minhas Tarefas",   desc: "Pendências atribuídas a você",  color: "text-violet-600 bg-violet-50" };

  switch (role) {
    case "EMPRESA":   return [objetos, tarefas, alertas];
    case "FISCAL":    return [objetos, alertas, relatorio];
    case "APOIO_N1":  return [objetos, contratos, quadro];
    case "COORDENADOR":
    case "SECRETARIO":return [novoContrato, relatorio, gestao];
    default:          return [novoContrato, contratos, quadro];
  }
}

// ---------------------------------------------------------------------------
const KPICard = ({ icon: Icon, label, value, sub, color, loading }: KPIDef & { loading?: boolean }) => {
  const colors: Record<string, string> = {
    brand:   "bg-brand-50 text-brand-700 border-brand-200",
    success: "bg-emerald-50 text-emerald-600 border-emerald-100",
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
        <p className="text-3xl font-bold text-slate-900 mb-1">{value || "—"}</p>
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
  EM_ANDAMENTO: "Em Andamento", CONCLUIDA: "Concluída", PARALISADA: "Paralisada",
  A_INICIAR: "A Iniciar", INACABADA: "Inacabada", RESCINDIDA: "Rescindida",
  ARQUIVADA: "Arquivada", EXTINTA: "Extinta", CEDIDA: "Cedida",
  SEM_SITUACAO: "Sem situação",
};

// Placeholder enquanto o bundle dos gráficos (recharts) carrega — reserva a
// altura para evitar salto de layout.
const SkeletonBloco = () => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
    <div className="h-4 w-40 bg-slate-100 animate-pulse rounded mb-4" />
    <div className="h-44 bg-slate-50 animate-pulse rounded-xl" />
  </div>
);

const ChartsSkeleton = ({ dupla }: { dupla: boolean }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><SkeletonBloco /><SkeletonBloco /></div>
    {dupla && <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><SkeletonBloco /><SkeletonBloco /></div>}
  </div>
);

const Dashboard = () => {
  const { user } = useAuthStore();
  const [filtroSituacao, setFiltroSituacao] = useState<string | null>(null);
  const [filtroSaude, setFiltroSaude] = useState<string | null>(null);

  const role = (user?.tipo as Role) ?? "EMPRESA";
  const podeVerOrgaos = (RANK[role] ?? 0) >= RANK.FISCAL;

  const { data: stats, isLoading: statsLoading } = useQuery<ObjetoStats>({
    queryKey: ["objetos", "stats"],
    queryFn: async () => (await api.get("/objetos/stats")).data,
  });

  const { data: resumo } = useQuery<RelatorioResumo>({
    queryKey: ["relatorio", "resumo"],
    queryFn: async () => (await api.get("/relatorios/resumo")).data,
    enabled: podeVerOrgaos, // EMPRESA não tem acesso (evita 403)
  });

  const { data: objetosData, isLoading: objetosLoading } = useQuery<PaginatedResponse<Objeto>>({
    queryKey: ["objetos", "dashboard", filtroSituacao, filtroSaude],
    queryFn: async () => {
      const params: Record<string, unknown> = { limit: 20, sort: "criado_em", order: "desc" };
      if (filtroSituacao) params.situacao = filtroSituacao;
      if (filtroSaude) params.saude = filtroSaude;
      return (await api.get("/objetos", { params })).data;
    },
  });

  const objetos = objetosData?.items ?? [];
  const loading = statsLoading || objetosLoading;

  const ps = stats?.por_status ?? {};
  const psit = stats?.por_situacao ?? {};
  const psaude = stats?.por_saude ?? {};
  const m: Metricas = {
    total:       stats?.total ?? 0,
    emExecucao:  ps.EM_EXECUCAO ?? 0,
    paralisadas: ps.PARALISADA ?? 0,
    concluidas:  ps.CONCLUIDA ?? 0,
    planejadas:  ps.PLANEJADA ?? 0,
    aIniciar:    psit.A_INICIAR ?? 0,
    critico:     psaude.VERMELHO ?? 0,
    atencao:     psaude.AMARELO ?? 0,
    emDia:       psaude.VERDE ?? 0,
  };

  const kpis = kpisDoPapel(role, m);
  const acoes = acoesDoPapel(role, m.total);
  const temFiltro = Boolean(filtroSituacao || filtroSaude);

  const toggleSaude = (s: string) => setFiltroSaude((cur) => (cur === s ? null : s));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="rounded-2xl bg-slate-800 p-8 text-white shadow-xl shadow-slate-900/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-64 opacity-10">
          <Building2 className="h-full w-full" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-1.5 sin-stripe" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-white/70">Bem-vindo ao painel,</p>
            <span className="text-[11px] font-semibold uppercase tracking-wide bg-white/15 px-2 py-0.5 rounded-full">
              {ROLE_LABEL[role] ?? role}
            </span>
          </div>
          <h2 className="text-3xl font-bold mb-2">{user?.nome || "Usuário"}</h2>
          <p className="text-white/65 text-sm">{SAUDACAO[role] ?? "Confira o resumo das objetos sob sua responsabilidade."}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => <KPICard key={kpi.label} {...kpi} loading={loading} />)}
      </div>

      {stats && (
        <Suspense fallback={<ChartsSkeleton dupla={podeVerOrgaos} />}>
          <DashboardCharts
            porStatus={ps}
            porSaude={psaude}
            filtroSaude={filtroSaude}
            onToggleSaude={toggleSaude}
            resumo={podeVerOrgaos ? resumo : undefined}
          />
        </Suspense>
      )}

      {Object.keys(psit).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Distribuição por situação oficial</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(psit).sort((a, b) => b[1] - a[1]).map(([sit, n]) => (
              <button
                key={sit}
                disabled={sit === "SEM_SITUACAO"}
                onClick={() => setFiltroSituacao(filtroSituacao === sit ? null : sit)}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all disabled:cursor-default disabled:opacity-60 ${
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
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Objetos Recentes</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {temFiltro ? "Filtro ativo" : "Últimas objetos do seu painel"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {temFiltro && (
              <button
                onClick={() => { setFiltroSituacao(null); setFiltroSaude(null); }}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <Filter className="h-3 w-3" />
                Limpar filtros
              </button>
            )}
            <Link to="/objetos" className="flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-500 transition-colors">
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
            : objetos.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-400">
                  <Search className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Nenhum objeto encontrada com os filtros atuais.</p>
                </div>
              )
            : objetos.map((objeto) => {
                const cfg = SAUDE_CONFIG[(objeto.saude || "VERDE") as keyof typeof SAUDE_CONFIG];
                return (
                  <Link
                    key={objeto.id}
                    to={`/objetos/${objeto.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/80 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate group-hover:text-brand-700">{objeto.titulo}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{objeto.municipio}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="hidden sm:block w-28">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-slate-500">{Number(objeto.percentual_executado || 0).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100">
                          <div className="h-1.5 rounded-full bg-brand-500 transition-all" style={{ width: `${objeto.percentual_executado || 0}%` }} />
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
                    </div>
                  </Link>
                );
              })
          }
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {acoes.map((item) => (
          <Link
            key={item.to + item.title}
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
