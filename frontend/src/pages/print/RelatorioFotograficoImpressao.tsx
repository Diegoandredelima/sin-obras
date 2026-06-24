import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import PrintLayout from "@/components/print/PrintLayout";
import { fmtDate } from "@/utils/format";

interface Foto {
  id: string; medicao_item_id: string | null; url_storage: string | null;
  filename: string | null; carimbo_servidor: string | null;
}
interface Medicao { objeto_id: string; numero_medicao: number; data_fim_periodo?: string; fotos: Foto[] }
interface BoletimItem { id: string; descricao: string | null; unidade: string | null }
interface Boletim { itens: BoletimItem[] }
interface Objeto { titulo: string }

const RelatorioFotograficoImpressao = () => {
  const { medicaoId } = useParams<{ medicaoId: string }>();

  const { data: medicao, isLoading } = useQuery<Medicao>({
    queryKey: ["foto-medicao", medicaoId],
    queryFn: async () => (await api.get(`/empresa/medicoes/${medicaoId}`)).data,
    enabled: !!medicaoId,
  });
  const { data: boletim } = useQuery<Boletim>({
    queryKey: ["foto-boletim", medicaoId],
    queryFn: async () => (await api.get(`/empresa/medicoes/${medicaoId}/boletim`)).data,
    enabled: !!medicaoId,
  });
  const { data: objeto } = useQuery<Objeto>({
    queryKey: ["foto-objeto", medicao?.objeto_id],
    queryFn: async () => (await api.get(`/objetos/${medicao!.objeto_id}`)).data,
    enabled: !!medicao?.objeto_id,
  });

  const descById = Object.fromEntries((boletim?.itens || []).map((i) => [i.id, i]));

  // Agrupa as fotos por item/meta construtiva; fotos sem item vão para "Gerais".
  const grupos = new Map<string, Foto[]>();
  for (const f of medicao?.fotos || []) {
    const key = f.medicao_item_id || "__geral__";
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key)!.push(f);
  }

  return (
    <PrintLayout
      title={`Relatório Fotográfico — ${medicao ? String(medicao.numero_medicao).padStart(2, "0") : ""}ª Medição`}
      subtitle={objeto?.titulo} ready={!isLoading && !!medicao} printDelay={900}
    >
      {!medicao ? (
        <p className="text-sm text-slate-400">Carregando...</p>
      ) : (
        <div className="space-y-5">
          <p className="text-xs text-slate-500">Data da medição: {fmtDate(medicao.data_fim_periodo ?? null)}</p>
          {grupos.size === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma foto vinculada a esta medição.</p>
          ) : (
            [...grupos.entries()].map(([itemId, fotos]) => {
              const info = descById[itemId];
              return (
                <section key={itemId} className="space-y-2 print-card">
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-1">
                    {itemId === "__geral__" ? "Registros gerais" : `${info?.descricao || "Item"}${info?.unidade ? ` (${info.unidade})` : ""}`}
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {fotos.map((f) => (
                      <figure key={f.id} className="rounded-xl border border-slate-200 overflow-hidden print-avoid-break">
                        {f.url_storage && f.url_storage.startsWith("http") ? (
                          <img src={f.url_storage} alt={f.filename || "Foto da medição"} className="w-full h-56 object-cover" />
                        ) : (
                          <div className="w-full h-56 flex items-center justify-center bg-slate-50 text-xs text-slate-400">
                            Imagem indisponível
                          </div>
                        )}
                        <figcaption className="px-2 py-1 text-[10px] text-slate-500">
                          {f.filename || "Foto"} · {f.carimbo_servidor ? fmtDate(f.carimbo_servidor) : "—"}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>
      )}
    </PrintLayout>
  );
};

export default RelatorioFotograficoImpressao;
