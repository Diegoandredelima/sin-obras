import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, Building2, AlertTriangle, Activity, MapPin } from "lucide-react";
import api from "@/services/api";
import { fmtCurrency } from "@/utils/format";

interface DistItem { situacao?: string; municipio?: string; orgao?: string; total: number; valor: number; }
interface DashExec {
  total_objetos: number;
  em_execucao: number;
  valor_investido: number;
  valor_medido: number;
  pct_execucao_global: number;
  obras_criticas: number;
  obras_atencao: number;
  por_situacao: DistItem[];
  por_saude: Record<string, number>;
  top_municipios: DistItem[];
  top_orgaos: DistItem[];
}

const TONES: Record<string, { box: string; icon: string }> = {
  brand: { box: "bg-brand-50 border-brand-100", icon: "text-brand-600" },
  emerald: { box: "bg-emerald-50 border-emerald-100", icon: "text-emerald-600" },
  sky: { box: "bg-sky-50 border-sky-100", icon: "text-sky-600" },
  rose: { box: "bg-rose-50 border-rose-100", icon: "text-rose-600" },
};

const Kpi = ({ icon: Icon, label, value, tone = "brand" }: { icon: typeof Activity; label: string; value: string; tone?: keyof typeof TONES }) => {
  const t = TONES[tone] ?? TONES.brand;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${t.box}`}>
        <Icon className={`h-6 w-6 ${t.icon}`} />
      </div>
      <div>
        <p className="text-xs text-slate-400 uppercase font-semibold">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
};

const Bars = ({ title, rows, labelKey }: { title: string; rows: DistItem[]; labelKey: "municipio" | "orgao" | "situacao" }) => {
  const max = Math.max(1, ...rows.map((r) => r.valor));
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">{title}</h3>
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-xs text-slate-400">Sem dados.</p>}
        {rows.map((r) => (
          <div key={r[labelKey]}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600 truncate max-w-[60%]">{r[labelKey] || "—"}</span>
              <span className="text-slate-500">{r.total} obras · {fmtCurrency(r.valor)}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(r.valor / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Executivo = () => {
  const { data, isLoading, isError } = useQuery<DashExec>({
    queryKey: ["dashboard-executivo"],
    queryFn: async () => (await api.get("/dashboard/executivo")).data,
  });

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 text-slate-300 animate-spin" /></div>;
  if (isError || !data) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <AlertTriangle className="h-8 w-8 text-amber-400 mb-2" />
      <p className="text-sm text-slate-500">Não foi possível carregar o dashboard executivo.</p>
    </div>
  );

  const saude = data.por_saude || {};
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard Executivo</h2>
        <p className="text-sm text-slate-500 mt-0.5">Visão consolidada do portfólio de obras da COS</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Building2} label="Obras ativas" value={String(data.total_objetos)} tone="brand" />
        <Kpi icon={TrendingUp} label="Investimento ativo" value={fmtCurrency(data.valor_investido)} tone="emerald" />
        <Kpi icon={Activity} label="Execução global" value={`${data.pct_execucao_global}%`} tone="sky" />
        <Kpi icon={AlertTriangle} label="Obras críticas" value={String(data.obras_criticas)} tone="rose" />
      </div>

      {/* Saúde do portfólio */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Saúde do portfólio</h3>
        <div className="flex gap-3">
          {[
            { k: "VERDE", label: "No prazo", cls: "bg-emerald-500" },
            { k: "AMARELO", label: "Atenção", cls: "bg-amber-500" },
            { k: "VERMELHO", label: "Crítico", cls: "bg-rose-500" },
          ].map((s) => (
            <div key={s.k} className="flex-1 rounded-xl border border-slate-100 p-4 text-center">
              <div className={`h-2 w-full rounded-full ${s.cls} mb-2`} />
              <p className="text-2xl font-bold text-slate-900">{saude[s.k] || 0}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Bars title="Municípios mais impactados" rows={data.top_municipios} labelKey="municipio" />
        <Bars title="Órgãos demandantes" rows={data.top_orgaos} labelKey="orgao" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-3 text-sm text-slate-500">
        <MapPin className="h-4 w-4 text-brand-600" />
        Total medido acumulado: <b className="text-slate-800">{fmtCurrency(data.valor_medido)}</b>
        · Obras em execução: <b className="text-slate-800">{data.em_execucao}</b>
      </div>
    </div>
  );
};

export default Executivo;
