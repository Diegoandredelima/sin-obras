import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import PrintLayout from "@/components/print/PrintLayout";
import { fmtCurrency } from "@/utils/format";

interface ProgressoMeta {
  meta_id: string;
  descricao: string;
  ordem: number;
  valor_planejado: string;
  valor_realizado: string;
  percentual: string;
}
interface RelatorioCronograma {
  objeto_id: string;
  objeto_titulo: string;
  metas: ProgressoMeta[];
  valor_planejado_total: string;
  valor_realizado_total: string;
  percentual_total: string;
}

const pct = (v: string) => `${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

const barColor = (p: number) => (p >= 80 ? "bg-emerald-500" : p >= 50 ? "bg-amber-500" : "bg-rose-500");

const CronogramaProgressoImpressao = () => {
  const { objetoId } = useParams<{ objetoId: string }>();

  const { data, isLoading } = useQuery<RelatorioCronograma>({
    queryKey: ["rel-cronograma", objetoId],
    queryFn: async () => (await api.get(`/relatorios/cronograma/${objetoId}`)).data,
    enabled: !!objetoId,
  });

  return (
    <PrintLayout
      title="Progresso do Cronograma por Meta"
      subtitle={data?.objeto_titulo}
      ready={!isLoading && !!data}
    >
      {!data ? (
        <p className="text-sm text-slate-400">Carregando relatório...</p>
      ) : (
        <div className="space-y-4">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="border border-slate-300 px-2 py-1 text-left">Meta</th>
                <th className="border border-slate-300 px-2 py-1 text-right">Planejado</th>
                <th className="border border-slate-300 px-2 py-1 text-right">Realizado</th>
                <th className="border border-slate-300 px-2 py-1 text-right">% Avanço</th>
                <th className="border border-slate-300 px-2 py-1 text-left w-40">Progresso</th>
              </tr>
            </thead>
            <tbody>
              {data.metas.map((m) => {
                const p = Number(m.percentual);
                return (
                  <tr key={m.meta_id}>
                    <td className="border border-slate-200 px-2 py-1">{m.descricao}</td>
                    <td className="border border-slate-200 px-2 py-1 text-right">{fmtCurrency(m.valor_planejado)}</td>
                    <td className="border border-slate-200 px-2 py-1 text-right">{fmtCurrency(m.valor_realizado)}</td>
                    <td className="border border-slate-200 px-2 py-1 text-right">{pct(m.percentual)}</td>
                    <td className="border border-slate-200 px-2 py-1">
                      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full ${barColor(p)}`} style={{ width: `${Math.min(p, 100)}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {data.metas.length === 0 && (
                <tr>
                  <td colSpan={5} className="border border-slate-200 px-2 py-3 text-center text-slate-400">
                    Cronograma sem metas cadastradas.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-semibold text-slate-700">
                <td className="border border-slate-300 px-2 py-1">Total</td>
                <td className="border border-slate-300 px-2 py-1 text-right">{fmtCurrency(data.valor_planejado_total)}</td>
                <td className="border border-slate-300 px-2 py-1 text-right">{fmtCurrency(data.valor_realizado_total)}</td>
                <td className="border border-slate-300 px-2 py-1 text-right">{pct(data.percentual_total)}</td>
                <td className="border border-slate-300 px-2 py-1" />
              </tr>
            </tfoot>
          </table>
          <p className="text-[10px] text-slate-400">
            Planejado = soma dos eventos do cronograma por meta. Realizado = medições aprovadas
            (quantidade aprovada × preço unitário) cujos itens pertencem à meta.
          </p>
        </div>
      )}
    </PrintLayout>
  );
};

export default CronogramaProgressoImpressao;
