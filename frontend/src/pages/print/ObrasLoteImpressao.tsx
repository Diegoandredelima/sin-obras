import { useSearchParams } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import api from "@/services/api";
import PrintLayout from "@/components/print/PrintLayout";
import ObraReportBody, { type ObraDetalhe } from "@/components/print/ObraReportBody";

/**
 * Impressão em lote: gera o relatório individual de cada obra selecionada,
 * uma por página, num único documento. Recebe os ids via querystring
 * (`?ids=a,b,c`). Reaproveita `ObraReportBody`.
 */
const ObrasLoteImpressao = () => {
  const [params] = useSearchParams();
  const ids = (params.get("ids") || "").split(",").map((s) => s.trim()).filter(Boolean);

  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["obra-impressao", id],
      queryFn: async () => {
        const { data } = await api.get(`/obras/${id}`);
        return data as ObraDetalhe;
      },
      enabled: !!id,
    })),
  });

  const ready = ids.length > 0 && results.every((r) => !r.isLoading);
  const obras = results.map((r) => r.data).filter((o): o is ObraDetalhe => !!o);

  // Mais obras → mais timelines aninhadas carregando; aumenta o atraso até 6s.
  const printDelay = Math.min(1200 + ids.length * 150, 6000);

  return (
    <PrintLayout
      title="Relatórios Individuais de Obras"
      subtitle={`${obras.length} obra(s) selecionada(s)`}
      ready={ready}
      printDelay={printDelay}
    >
      {ids.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma obra selecionada.</p>
      ) : !ready ? (
        <p className="text-sm text-slate-400">Carregando {ids.length} obra(s)...</p>
      ) : (
        obras.map((o, i) => (
          <div key={o.id} className={i > 0 ? "print-page-break pt-2" : ""}>
            <ObraReportBody o={o} showTitulo />
          </div>
        ))
      )}
    </PrintLayout>
  );
};

export default ObrasLoteImpressao;
