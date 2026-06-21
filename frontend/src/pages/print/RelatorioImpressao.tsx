import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import PrintLayout from "@/components/print/PrintLayout";
import RelatorioCharts from "@/components/RelatorioCharts";
import { fmtCurrency, fmtDate } from "@/utils/format";
import type { RelatorioObraRow, RelatorioResumo } from "@/types";

const SITUACAO_LABEL: Record<string, string> = {
  A_INICIAR: "A Iniciar", EM_ANDAMENTO: "Em Andamento", PARALISADA: "Paralisada",
  INACABADA: "Inacabada", CONCLUIDA: "Concluída", RESCINDIDA: "Rescindida",
  ARQUIVADA: "Arquivada", EXTINTA: "Extinta", CEDIDA: "Cedida",
};

const STATUS_LABEL: Record<string, string> = {
  EM_EXECUCAO: "Em Execução", PARALISADA: "Paralisada",
  CONCLUIDA: "Concluída", PLANEJADA: "Planejada",
};

const SAUDE_LABEL: Record<string, string> = {
  VERDE: "Em dia", AMARELO: "Atenção", VERMELHO: "Crítico",
};

const valorObra = (o: RelatorioObraRow) =>
  Number(o.valor_final ?? o.valor_global ?? o.valor_contrato ?? 0);

/**
 * Agrega o conjunto JÁ filtrado para alimentar os gráficos do modo completo.
 * Assim os gráficos refletem exatamente os filtros aplicados (e não o total geral).
 */
function agregar(lista: RelatorioObraRow[]): RelatorioResumo {
  const statusMap = new Map<string, number>();
  const orgaoMap = new Map<string, { total: number; valor: number }>();
  let valorTotal = 0;

  for (const o of lista) {
    valorTotal += valorObra(o);
    const st = o.status || "PLANEJADA";
    statusMap.set(st, (statusMap.get(st) ?? 0) + 1);
    const org = o.orgao || "Não informado";
    const cur = orgaoMap.get(org) ?? { total: 0, valor: 0 };
    cur.total += 1;
    cur.valor += valorObra(o);
    orgaoMap.set(org, cur);
  }

  return {
    total_obras: lista.length,
    total_contratos: lista.length,
    total_empresas: 0,
    valor_total_contratos: valorTotal,
    obras_por_status: [...statusMap.entries()]
      .map(([status, total]) => ({ status, label: STATUS_LABEL[status] || status, total }))
      .sort((a, b) => b.total - a.total),
    obras_por_orgao: [...orgaoMap.entries()]
      .map(([orgao, v]) => ({ orgao, total_obras: v.total, valor_total: v.valor }))
      .sort((a, b) => b.total_obras - a.total_obras)
      .slice(0, 12),
  };
}

const RelatorioImpressao = () => {
  const [params] = useSearchParams();
  const modo = params.get("modo") === "completo" ? "completo" : "resumido";

  // Repassa TODOS os filtros recebidos na URL (exceto "modo") para a API.
  const apiParams: Record<string, string> = {};
  params.forEach((v, k) => {
    if (k !== "modo" && v) apiParams[k] = v;
  });
  const filtrosAtivos = Object.keys(apiParams).length;

  const { data: obras, isLoading } = useQuery<RelatorioObraRow[]>({
    queryKey: ["rel-impressao", apiParams],
    queryFn: async () => {
      const { data } = await api.get("/relatorios/obras", { params: apiParams });
      return data;
    },
  });

  const lista = obras ?? [];
  const ready = !isLoading;

  const totalValor = lista.reduce((acc, o) => acc + valorObra(o), 0);
  const execMedia = lista.length
    ? (lista.reduce((a, o) => a + Number(o.percentual_executado ?? 0), 0) / lista.length).toFixed(1)
    : "—";
  const resumo = modo === "completo" ? agregar(lista) : null;

  return (
    <PrintLayout
      title={modo === "completo" ? "Relatório Completo de Obras" : "Relatório Resumido de Obras"}
      subtitle={`${lista.length} obra(s)${filtrosAtivos ? ` · ${filtrosAtivos} filtro(s) aplicado(s)` : " · sem filtros"}`}
      ready={ready}
      orientation="landscape"
    >
      {/* Indicadores do conjunto */}
      <div className="grid grid-cols-3 gap-4 print-avoid-break">
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Obras no relatório</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{lista.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Valor total</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{fmtCurrency(totalValor)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Execução média</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{execMedia === "—" ? "—" : `${execMedia}%`}</p>
        </div>
      </div>

      {/* Gráficos do conjunto filtrado (apenas no modo completo) */}
      {modo === "completo" && resumo && lista.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">Visão geral do conjunto filtrado</h2>
          <RelatorioCharts data={resumo} print />
        </section>
      )}

      {/* Tabela de obras */}
      <section>
        <h2 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">Relação de obras</h2>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-left">
              <th className="border border-slate-200 px-2 py-1.5 font-semibold">Obra</th>
              <th className="border border-slate-200 px-2 py-1.5 font-semibold">Município</th>
              <th className="border border-slate-200 px-2 py-1.5 font-semibold">Órgão</th>
              <th className="border border-slate-200 px-2 py-1.5 font-semibold">Empresa</th>
              <th className="border border-slate-200 px-2 py-1.5 font-semibold">Contrato</th>
              <th className="border border-slate-200 px-2 py-1.5 font-semibold text-right">Valor</th>
              <th className="border border-slate-200 px-2 py-1.5 font-semibold">Situação</th>
              <th className="border border-slate-200 px-2 py-1.5 font-semibold text-right">% Exec.</th>
              <th className="border border-slate-200 px-2 py-1.5 font-semibold">Vigência</th>
              <th className="border border-slate-200 px-2 py-1.5 font-semibold">Saúde</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((o) => (
              <tr key={o.obra_id} className="print-avoid-break">
                <td className="border border-slate-200 px-2 py-1.5 font-medium text-slate-800">{o.titulo}</td>
                <td className="border border-slate-200 px-2 py-1.5">{o.municipio || "—"}</td>
                <td className="border border-slate-200 px-2 py-1.5">{o.orgao || "—"}</td>
                <td className="border border-slate-200 px-2 py-1.5">{o.empresa_razao_social || "—"}</td>
                <td className="border border-slate-200 px-2 py-1.5">{o.contrato_numero || "—"}</td>
                <td className="border border-slate-200 px-2 py-1.5 text-right whitespace-nowrap">
                  {fmtCurrency(o.valor_final ?? o.valor_global ?? o.valor_contrato)}
                </td>
                <td className="border border-slate-200 px-2 py-1.5">
                  {o.situacao ? SITUACAO_LABEL[o.situacao] || o.situacao : "—"}
                </td>
                <td className="border border-slate-200 px-2 py-1.5 text-right">
                  {Number(o.percentual_executado ?? 0).toFixed(0)}%
                </td>
                <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap">
                  {o.vigencia_fim ? fmtDate(o.vigencia_fim) : "—"}
                </td>
                <td className="border border-slate-200 px-2 py-1.5">
                  {o.saude ? SAUDE_LABEL[o.saude] || o.saude : "—"}
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={10} className="border border-slate-200 px-2 py-6 text-center text-slate-400">
                  Nenhuma obra encontrada para os filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </PrintLayout>
  );
};

export default RelatorioImpressao;
