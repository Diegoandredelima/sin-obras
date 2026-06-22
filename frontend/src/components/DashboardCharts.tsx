import { useMemo } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { HeartPulse, TrendingUp, Building2, DollarSign } from "lucide-react";
import { fmtCurrency } from "@/utils/format";
import type { RelatorioResumo } from "@/types";

/* Paleta alinhada à identidade visual (DESIGN.md) — recharts exige hex. */
const SAUDE_META: Record<string, { label: string; color: string }> = {
  VERDE:    { label: "Em dia",  color: "#34d399" },
  AMARELO:  { label: "Atenção", color: "#fbbf24" },
  VERMELHO: { label: "Crítico", color: "#fb7185" },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  EM_EXECUCAO: { label: "Em Execução", color: "#38bdf8" },
  PARALISADA:  { label: "Paralisada",  color: "#fbbf24" },
  CONCLUIDA:   { label: "Concluída",   color: "#34d399" },
  PLANEJADA:   { label: "Planejada",   color: "#cbd5e1" },
};

const BRAND = "#2457A4";
const AMBER = "#fbbf24";

const Card = ({ icon: Icon, title, children }: {
  icon: typeof HeartPulse; title: string; children: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
    <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
      <Icon className="h-4 w-4 text-slate-400" />
      {title}
    </h3>
    {children}
  </div>
);

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 12px rgb(15 23 42 / 0.08)",
  fontSize: 12,
};

interface Props {
  porStatus: Record<string, number>;
  porSaude: Record<string, number>;
  filtroSaude: string | null;
  onToggleSaude: (saude: string) => void;
  /** Análise por órgão (apenas FISCAL+, quando o resumo está disponível). */
  resumo?: RelatorioResumo;
}

const DashboardCharts = ({ porStatus, porSaude, filtroSaude, onToggleSaude, resumo }: Props) => {
  const saudeData = useMemo(
    () => (["VERDE", "AMARELO", "VERMELHO"] as const)
      .map((k) => ({ key: k, name: SAUDE_META[k].label, value: porSaude[k] || 0, color: SAUDE_META[k].color }))
      .filter((d) => d.value > 0),
    [porSaude],
  );
  const totalSaude = saudeData.reduce((acc, d) => acc + d.value, 0);

  const statusData = useMemo(
    () => Object.entries(porStatus)
      .map(([k, v]) => ({ key: k, name: STATUS_META[k]?.label ?? k, value: v, color: STATUS_META[k]?.color ?? "#cbd5e1" }))
      .sort((a, b) => b.value - a.value),
    [porStatus],
  );

  const orgaoData = useMemo(
    () => (resumo?.obras_por_orgao ?? []).map((o) => ({
      orgao: o.orgao.length > 18 ? o.orgao.slice(0, 17) + "…" : o.orgao,
      orgaoFull: o.orgao,
      obras: o.total_obras,
      valor: o.valor_total,
    })),
    [resumo],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Saúde do portfólio — donut interativo */}
        <Card icon={HeartPulse} title="Saúde do portfólio">
          {totalSaude === 0 ? (
            <p className="text-sm text-slate-400 italic py-12 text-center">Nenhum dado disponível.</p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="relative h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={saudeData} dataKey="value" nameKey="name"
                      innerRadius={52} outerRadius={76} paddingAngle={2}
                      strokeWidth={0}
                      onClick={(_, index: number) => { const d = saudeData[index]; if (d) onToggleSaude(d.key); }}
                    >
                      {saudeData.map((d) => (
                        <Cell
                          key={d.key} fill={d.color}
                          opacity={filtroSaude && filtroSaude !== d.key ? 0.3 : 1}
                          className="cursor-pointer focus:outline-none"
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${v} obras`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-slate-900">{totalSaude}</span>
                  <span className="text-[10px] uppercase tracking-wide text-slate-400">obras</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {saudeData.map((d) => {
                  const ativo = filtroSaude === d.key;
                  return (
                    <button
                      key={d.key}
                      onClick={() => onToggleSaude(d.key)}
                      className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2 border transition-all ${
                        ativo ? "border-slate-300 bg-slate-50 shadow-sm" : "border-transparent hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.name}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {d.value}
                        <span className="text-xs font-normal text-slate-400 ml-1">
                          {Math.round((d.value / totalSaude) * 100)}%
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Obras por status operacional */}
        <Card icon={TrendingUp} title="Obras por status">
          {statusData.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-12 text-center">Nenhum dado disponível.</p>
          ) : (
            <ResponsiveContainer width="100%" height={176}>
              <BarChart data={statusData} layout="vertical" margin={{ left: 4, right: 24 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category" dataKey="name" width={92} axisLine={false} tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f1f5f9" }} formatter={(v: unknown) => [`${v} obras`, ""]} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                  {statusData.map((d) => <Cell key={d.key} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {resumo && orgaoData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card icon={Building2} title="Obras por órgão">
            <ResponsiveContainer width="100%" height={Math.max(176, orgaoData.length * 32)}>
              <BarChart data={orgaoData} layout="vertical" margin={{ left: 4, right: 24 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="orgao" width={120} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f1f5f9" }}
                  formatter={(v: unknown) => [`${v} obras`, ""]}
                  labelFormatter={(_: unknown, p?: ReadonlyArray<{ payload?: { orgaoFull?: string } }>) => p?.[0]?.payload?.orgaoFull ?? ""} />
                <Bar dataKey="obras" fill={BRAND} radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card icon={DollarSign} title="Valor contratado por órgão">
            <ResponsiveContainer width="100%" height={Math.max(176, orgaoData.length * 32)}>
              <BarChart data={orgaoData} layout="vertical" margin={{ left: 4, right: 24 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="orgao" width={120} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f1f5f9" }}
                  formatter={(v: unknown) => [fmtCurrency(v), ""]}
                  labelFormatter={(_: unknown, p?: ReadonlyArray<{ payload?: { orgaoFull?: string } }>) => p?.[0]?.payload?.orgaoFull ?? ""} />
                <Bar dataKey="valor" fill={AMBER} radius={[0, 6, 6, 0]} barSize={18} />
                <Legend wrapperStyle={{ display: "none" }} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DashboardCharts;
