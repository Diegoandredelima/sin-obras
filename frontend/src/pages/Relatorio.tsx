import { useQuery } from "@tanstack/react-query";
import { Building2, Briefcase, DollarSign, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import api from "@/services/api";
import { fmtCurrency } from "@/utils/format";

interface ResumoPorStatus {
  status: string;
  label: string;
  total: number;
}

interface ResumoPorOrgao {
  orgao: string;
  total_obras: number;
  valor_total: number;
}

interface RelatorioResumo {
  total_obras: number;
  total_contratos: number;
  total_empresas: number;
  obras_por_status: ResumoPorStatus[];
  obras_por_orgao: ResumoPorOrgao[];
  valor_total_contratos: number;
}

const STATUS_COLORS: Record<string, string> = {
  EM_EXECUCAO: "bg-sky-400",
  PARALISADA: "bg-amber-400",
  CONCLUIDA: "bg-emerald-400",
  PLANEJADA: "bg-slate-300",
};

const Relatorio = () => {
  const { data, isLoading, isError } = useQuery<RelatorioResumo>({
    queryKey: ["relatorio", "resumo"],
    queryFn: async () => {
      const { data } = await api.get("/relatorios/resumo");
      return data;
    },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="h-8 w-8 text-slate-300 animate-spin" />
    </div>
  );

  if (isError || !data) return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <AlertCircle className="h-12 w-12 text-rose-300 mb-4" />
      <p className="text-lg font-semibold text-slate-700">Erro ao carregar relatório.</p>
    </div>
  );

  const maxStatus = Math.max(...data.obras_por_status.map((s) => s.total), 1);
  const maxOrgao = Math.max(...data.obras_por_orgao.map((o) => o.total_obras), 1);
  const valorMax = Math.max(...data.obras_por_orgao.map((o) => o.valor_total), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={Building2} label="Total de Obras" value={data.total_obras} color="emerald" />
        <KPI icon={Briefcase} label="Total de Contratos" value={data.total_contratos} color="sky" />
        <KPI icon={Briefcase} label="Empresas" value={data.total_empresas} color="violet" />
        <KPI icon={DollarSign} label="Valor Total" value={fmtCurrency(data.valor_total_contratos)} color="amber" large />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-slate-400" />
            Obras por Status
          </h3>
          <div className="space-y-3">
            {data.obras_por_status.map((s) => (
              <div key={s.status} className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-600 w-24 shrink-0">{s.label}</span>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${STATUS_COLORS[s.status] || "bg-slate-300"}`}
                    style={{ width: `${(s.total / maxStatus) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-8 text-right">{s.total}</span>
              </div>
            ))}
            {data.obras_por_status.length === 0 && (
              <p className="text-sm text-slate-400 italic">Nenhum dado disponível.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400" />
            Obras por Órgão
          </h3>
          <div className="space-y-3">
            {data.obras_por_orgao.map((o, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-600 w-24 shrink-0 truncate" title={o.orgao}>
                  {o.orgao}
                </span>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-700"
                    style={{ width: `${(o.total_obras / maxOrgao) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-8 text-right">{o.total_obras}</span>
              </div>
            ))}
            {data.obras_por_orgao.length === 0 && (
              <p className="text-sm text-slate-400 italic">Nenhum dado disponível.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-slate-400" />
          Valor por Órgão (R$)
        </h3>
        <div className="space-y-3">
          {data.obras_por_orgao.map((o, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-600 w-24 shrink-0 truncate" title={o.orgao}>
                {o.orgao}
              </span>
              <div className="flex-1 relative">
                <div className="h-7 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min((o.valor_total / valorMax) * 100, 100)}%` }}
                  />
                </div>
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-semibold text-slate-700">
                  {fmtCurrency(o.valor_total)}
                </span>
              </div>
            </div>
          ))}
          {data.obras_por_orgao.length === 0 && (
            <p className="text-sm text-slate-400 italic">Nenhum dado disponível.</p>
          )}
        </div>
      </div>
    </div>
  );
};

interface KPIProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  large?: boolean;
}

const KPI = ({ icon: Icon, label, value, color, large }: KPIProps) => {
  const colors: Record<string, string> = {
    emerald: "bg-brand-50 text-brand-700 border-brand-100",
    sky: "bg-sky-50 text-sky-600 border-sky-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg border ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-medium text-slate-400">{label}</span>
      </div>
      <p className={`font-bold text-slate-900 ${large ? "text-xl" : "text-2xl"}`}>{value}</p>
    </div>
  );
};

export default Relatorio;
