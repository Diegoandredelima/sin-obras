import { useSearchParams } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import api from "@/services/api";
import PrintLayout from "@/components/print/PrintLayout";
import ObjetoReportBody, { type ObjetoDetalhe } from "@/components/print/ObjetoReportBody";

/**
 * Impressão em lote: gera o relatório individual de cado objeto selecionada,
 * uma por página, num único documento. Recebe os ids via querystring
 * (`?ids=a,b,c`). Reaproveita `ObjetoReportBody`.
 */
const ObjetosLoteImpressao = () => {
  const [params] = useSearchParams();
  const ids = (params.get("ids") || "").split(",").map((s) => s.trim()).filter(Boolean);

  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["objeto-impressao", id],
      queryFn: async () => {
        const { data } = await api.get(`/objetos/${id}`);
        return data as ObjetoDetalhe;
      },
      enabled: !!id,
    })),
  });

  const ready = ids.length > 0 && results.every((r) => !r.isLoading);
  const objetos = results.map((r) => r.data).filter((o): o is ObjetoDetalhe => !!o);

  // Mais objetos → mais timelines aninhadas carregando; aumenta o atraso até 6s.
  const printDelay = Math.min(1200 + ids.length * 150, 6000);

  return (
    <PrintLayout
      title="Relatórios Individuais de Objetos"
      subtitle={`${objetos.length} objeto(s) selecionada(s)`}
      ready={ready}
      printDelay={printDelay}
    >
      {ids.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum objeto selecionada.</p>
      ) : !ready ? (
        <p className="text-sm text-slate-400">Carregando {ids.length} objeto(s)...</p>
      ) : (
        objetos.map((o, i) => (
          <div key={o.id} className={i > 0 ? "print-page-break pt-2" : ""}>
            <ObjetoReportBody o={o} showTitulo />
          </div>
        ))
      )}
    </PrintLayout>
  );
};

export default ObjetosLoteImpressao;
