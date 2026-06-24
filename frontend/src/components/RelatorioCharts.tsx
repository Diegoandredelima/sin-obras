import { TrendingUp, Building2, DollarSign } from "lucide-react";
import { fmtCurrency } from "@/utils/format";
import type { RelatorioResumo } from "@/types";

const STATUS_CHART_COLORS: Record<string, string> = {
  EM_EXECUCAO: "bg-sky-400",
  PARALISADA:  "bg-amber-400",
  CONCLUIDA:   "bg-emerald-400",
  PLANEJADA:   "bg-slate-300",
};

interface Props {
  data: RelatorioResumo;
  /** Em impressão, evita transições/animações das barras. */
  print?: boolean;
}

/**
 * Bloco de gráficos CSS do relatório (Objetos por Status, Objetos por Órgão,
 * Valor por Órgão). Componente apresentacional — o pai busca os dados.
 * Reutilizado no Dashboard e no template de impressão "completo".
 */
const RelatorioCharts = ({ data, print = false }: Props) => {
  const maxStatus = Math.max(...data.objetos_por_status.map((s) => s.total), 1);
  const maxOrgao  = Math.max(...data.objetos_por_orgao.map((o) => o.total_objetos), 1);
  const maxValor  = Math.max(...data.objetos_por_orgao.map((o) => o.valor_total), 1);
  const trans = print ? "" : "transition-all duration-700";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Objetos por Status */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 print-card print-avoid-break">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-slate-400" />
            Objetos por Status
          </h3>
          <div className="space-y-3">
            {data.objetos_por_status.map((s) => (
              <div key={s.status} className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-600 w-28 shrink-0">{s.label}</span>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${trans} ${STATUS_CHART_COLORS[s.status] ?? "bg-slate-300"}`}
                    style={{ width: `${(s.total / maxStatus) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-6 text-right">{s.total}</span>
              </div>
            ))}
            {data.objetos_por_status.length === 0 && (
              <p className="text-sm text-slate-400 italic">Nenhum dado disponível.</p>
            )}
          </div>
        </div>

        {/* Objetos por Órgão */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 print-card print-avoid-break">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400" />
            Objetos por Órgão
          </h3>
          <div className="space-y-3">
            {data.objetos_por_orgao.map((o, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-600 w-28 shrink-0 truncate" title={o.orgao}>
                  {o.orgao}
                </span>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-brand-500 rounded-full ${trans}`}
                    style={{ width: `${(o.total_objetos / maxOrgao) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-6 text-right">{o.total_objetos}</span>
              </div>
            ))}
            {data.objetos_por_orgao.length === 0 && (
              <p className="text-sm text-slate-400 italic">Nenhum dado disponível.</p>
            )}
          </div>
        </div>
      </div>

      {/* Valor por Órgão */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 print-card print-avoid-break">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-slate-400" />
          Valor Contratado por Órgão (R$)
        </h3>
        <div className="space-y-3">
          {data.objetos_por_orgao.map((o, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-600 w-28 shrink-0 truncate" title={o.orgao}>
                {o.orgao}
              </span>
              <div className="flex-1 relative">
                <div className="h-7 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-amber-400 rounded-full ${trans}`}
                    style={{ width: `${Math.min((o.valor_total / maxValor) * 100, 100)}%` }}
                  />
                </div>
                <span className="absolute inset-y-0 left-3 flex items-center text-xs font-semibold text-slate-700">
                  {fmtCurrency(o.valor_total)}
                </span>
              </div>
            </div>
          ))}
          {data.objetos_por_orgao.length === 0 && (
            <p className="text-sm text-slate-400 italic">Nenhum dado disponível.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelatorioCharts;
