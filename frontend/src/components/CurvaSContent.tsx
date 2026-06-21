import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import api from "@/services/api";
import { fmtDate, fmtCurrency } from "@/utils/format";
import type { CurvaSData } from "@/types";

export const CurvaSContent = ({ obraId }: { obraId: string }) => {
  const { data, isLoading, error } = useQuery<CurvaSData>({
    queryKey: ["curva-s", obraId],
    queryFn: async () => {
      const { data } = await api.get(`/curva-s/obras/${obraId}`);
      return data;
    },
    enabled: !!obraId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (error || !data || data.error) {
    return (
      <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4">
        <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
        <p className="text-sm text-rose-700">Erro ao carregar Curva S.</p>
      </div>
    );
  }

  const allValues = [...data.planejado, ...data.realizado, ...data.preditivo];
  const maxVal = Math.max(...allValues, 1);
  const chartHeight = 300;
  const points = data.datas.length;

  const toX = (i: number) => `${(i / Math.max(points - 1, 1)) * 100}%`;
  const toY = (v: number) => `${100 - (v / maxVal) * 100}%`;

  const realizacaoPct = data.valor_total_planejado > 0
    ? ((data.valor_total_realizado / data.valor_total_planejado) * 100).toFixed(1)
    : "0.0";

  const temAtraso = data.prazo_predito && data.prazo_contratual && data.prazo_predito > data.prazo_contratual;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Curva S Preditiva</h2>
          <p className="text-sm text-slate-500 mt-0.5">Planejado vs. Realizado vs. Preditivo</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400 font-medium">Planejado</p>
          <p className="text-lg font-bold text-slate-900">{fmtCurrency(data.valor_total_planejado)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400 font-medium">Realizado</p>
          <p className="text-lg font-bold text-emerald-700">{fmtCurrency(data.valor_total_realizado)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400 font-medium">Execução</p>
          <p className="text-lg font-bold text-sky-700">{realizacaoPct}%</p>
        </div>
        <div className={`bg-white rounded-2xl border shadow-sm p-4 ${temAtraso ? "border-rose-200" : "border-slate-100"}`}>
          <p className="text-xs text-slate-400 font-medium">Prazo Predito</p>
          <p className={`text-lg font-bold ${temAtraso ? "text-rose-700" : "text-emerald-700"}`}>
            {data.prazo_predito ? fmtDate(data.prazo_predito) : "—"}
          </p>
        </div>
      </div>

      {temAtraso && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Tendência de atraso detectada</p>
            <p className="text-xs text-amber-700 mt-0.5">
              A projeção indica conclusão em {fmtDate(data.prazo_predito!)} — após o prazo contratual de {fmtDate(data.prazo_contratual)}.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Evolução do valor acumulado</h3>

        <div className="mt-6 relative" style={{ height: `${chartHeight}px` }}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <div key={pct} className="absolute left-0 right-0 border-t border-slate-100" style={{ top: `${100 - pct}%` }}>
              <span className="absolute -top-2.5 -left-1 text-[10px] text-slate-300">{pct > 0 ? `${Math.round(maxVal * pct / 100 / 1000)}k` : ""}</span>
            </div>
          ))}

          {/* SVG chart */}
          <svg className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
            {/* Planejado */}
            <polyline
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="6,4"
              points={data.planejado.map((v, i) => `${toX(i)},${toY(v)}`).join(" ")}
            />
            {/* Realizado */}
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              points={data.realizado.map((v, i) => `${toX(i)},${toY(v)}`).join(" ")}
            />
            {/* Preditivo */}
            <polyline
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4,3"
              points={data.preditivo.map((v, i) => `${toX(i)},${toY(v)}`).join(" ")}
            />
            {/* Dots on realizado */}
            {data.realizado.map((v, i) =>
              v > 0 ? (
                <circle key={i} cx={toX(i)} cy={toY(v)} r="3" fill="#10b981" stroke="white" strokeWidth="1.5" />
              ) : null
            )}
          </svg>
        </div>

        <div className="flex items-center justify-center gap-6 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-slate-400" style={{ borderTop: "2px dashed #94a3b8" }} />
            <span className="text-xs text-slate-500">Planejado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-emerald-500" />
            <span className="text-xs text-slate-500">Realizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-amber-500" style={{ borderTop: "2px dashed #f59e0b" }} />
            <span className="text-xs text-slate-500">Preditivo</span>
          </div>
        </div>
      </div>
    </div>
  );
};
