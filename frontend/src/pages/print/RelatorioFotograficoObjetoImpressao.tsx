import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import PrintLayout from "@/components/print/PrintLayout";
import { fmtDate } from "@/utils/format";

interface Foto {
  id: string;
  url_storage: string | null;
  filename: string | null;
  carimbo_servidor: string | null;
  item_descricao: string | null;
}
interface MedicaoGrupo {
  medicao_id: string;
  numero_medicao: number;
  data_fim_periodo: string | null;
  fotos: Foto[];
}
interface RelatorioFotos {
  objeto_id: string;
  objeto_titulo: string;
  medicoes: MedicaoGrupo[];
  total_fotos: number;
}

const RelatorioFotograficoObjetoImpressao = () => {
  const { objetoId } = useParams<{ objetoId: string }>();

  const { data, isLoading } = useQuery<RelatorioFotos>({
    queryKey: ["rel-fotos-objeto", objetoId],
    queryFn: async () => (await api.get(`/relatorios/fotos/${objetoId}`)).data,
    enabled: !!objetoId,
  });

  return (
    <PrintLayout
      title="Relatório Fotográfico do Objeto"
      subtitle={data?.objeto_titulo}
      ready={!isLoading && !!data}
      printDelay={900}
    >
      {!data ? (
        <p className="text-sm text-slate-400">Carregando...</p>
      ) : data.total_fotos === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma foto registrada nas medições deste objeto.</p>
      ) : (
        <div className="space-y-6">
          {data.medicoes.map((m) => (
            <section key={m.medicao_id} className="space-y-3 print-card">
              <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-1">
                {String(m.numero_medicao).padStart(2, "0")}ª Medição
                {m.data_fim_periodo ? ` · ${fmtDate(m.data_fim_periodo)}` : ""}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {m.fotos.map((f) => (
                  <figure key={f.id} className="rounded-xl border border-slate-200 overflow-hidden print-avoid-break">
                    {f.url_storage && f.url_storage.startsWith("http") ? (
                      <img src={f.url_storage} alt={f.filename || "Foto da medição"} className="w-full h-56 object-cover" />
                    ) : (
                      <div className="w-full h-56 flex items-center justify-center bg-slate-50 text-xs text-slate-400">
                        Imagem indisponível
                      </div>
                    )}
                    <figcaption className="px-2 py-1 text-[10px] text-slate-500">
                      {f.item_descricao || "Registro geral"}
                      {" · "}
                      {f.carimbo_servidor ? fmtDate(f.carimbo_servidor) : "—"}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </PrintLayout>
  );
};

export default RelatorioFotograficoObjetoImpressao;
