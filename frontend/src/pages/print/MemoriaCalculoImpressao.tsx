import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import PrintLayout from "@/components/print/PrintLayout";

interface MemoriaLinha {
  id: string; descricao: string | null;
  comprimento: string | null; largura: string | null; altura: string | null;
  percentual: string | null; n_repeticoes: string; quantidade: string;
}
interface ItemMedicao { id: string; quantidade_periodo: string; memoria: MemoriaLinha[] }
interface Medicao { objeto_id: string; numero_medicao: number; itens: ItemMedicao[] }
interface BoletimItem { id: string; descricao: string | null; unidade: string | null }
interface Boletim { itens: BoletimItem[] }
interface Objeto { titulo: string }

const n = (v: string | null) => (v == null || v === "" ? "" : Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 4 }));

const MemoriaCalculoImpressao = () => {
  const { medicaoId } = useParams<{ medicaoId: string }>();

  const { data: medicao, isLoading } = useQuery<Medicao>({
    queryKey: ["mem-medicao", medicaoId],
    queryFn: async () => (await api.get(`/empresa/medicoes/${medicaoId}`)).data,
    enabled: !!medicaoId,
  });
  const { data: boletim } = useQuery<Boletim>({
    queryKey: ["mem-boletim", medicaoId],
    queryFn: async () => (await api.get(`/empresa/medicoes/${medicaoId}/boletim`)).data,
    enabled: !!medicaoId,
  });
  const { data: objeto } = useQuery<Objeto>({
    queryKey: ["mem-objeto", medicao?.objeto_id],
    queryFn: async () => (await api.get(`/objetos/${medicao!.objeto_id}`)).data,
    enabled: !!medicao?.objeto_id,
  });

  const descById = Object.fromEntries((boletim?.itens || []).map((i) => [i.id, i]));
  const itensComMemoria = (medicao?.itens || []).filter((it) => it.memoria.length > 0);

  return (
    <PrintLayout
      title={`Memória de Cálculo — ${medicao ? String(medicao.numero_medicao).padStart(2, "0") : ""}ª Medição`}
      subtitle={objeto?.titulo} ready={!isLoading && !!medicao}
    >
      {!medicao ? (
        <p className="text-sm text-slate-400">Carregando...</p>
      ) : (
        <div className="space-y-4">
          <p className="text-[10px] text-slate-500">
            LEGENDA: C/P = comprimento/perímetro; L = largura; H = altura; N = nº de repetições; A/V = área/volume.
          </p>
          {itensComMemoria.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma linha de memória de cálculo cadastrada nesta medição.</p>
          ) : (
            itensComMemoria.map((it, idx) => {
              const info = descById[it.id];
              return (
                <section key={it.id} className="rounded-xl border border-slate-200 p-3 print-card">
                  <h2 className="text-xs font-bold text-slate-800 mb-2">
                    {idx + 1}. {info?.descricao || "Item"} {info?.unidade ? <span className="text-slate-400">({info.unidade})</span> : null}
                  </h2>
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600">
                        <th className="border border-slate-300 px-1.5 py-1 text-left">Descrição</th>
                        <th className="border border-slate-300 px-1.5 py-1 w-16">C/P</th>
                        <th className="border border-slate-300 px-1.5 py-1 w-16">L</th>
                        <th className="border border-slate-300 px-1.5 py-1 w-16">H</th>
                        <th className="border border-slate-300 px-1.5 py-1 w-12">N</th>
                        <th className="border border-slate-300 px-1.5 py-1 w-12">%</th>
                        <th className="border border-slate-300 px-1.5 py-1 w-20">A/V</th>
                      </tr>
                    </thead>
                    <tbody>
                      {it.memoria.map((m) => (
                        <tr key={m.id}>
                          <td className="border border-slate-200 px-1.5 py-1">{m.descricao || "—"}</td>
                          <td className="border border-slate-200 px-1.5 py-1 text-right">{n(m.comprimento)}</td>
                          <td className="border border-slate-200 px-1.5 py-1 text-right">{n(m.largura)}</td>
                          <td className="border border-slate-200 px-1.5 py-1 text-right">{n(m.altura)}</td>
                          <td className="border border-slate-200 px-1.5 py-1 text-right">{n(m.n_repeticoes)}</td>
                          <td className="border border-slate-200 px-1.5 py-1 text-right">{n(m.percentual)}</td>
                          <td className="border border-slate-200 px-1.5 py-1 text-right font-semibold">{n(m.quantidade)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50">
                        <td className="border border-slate-200 px-1.5 py-1 text-right font-semibold" colSpan={6}>Total medido no período</td>
                        <td className="border border-slate-200 px-1.5 py-1 text-right font-bold">{n(it.quantidade_periodo)}</td>
                      </tr>
                    </tbody>
                  </table>
                </section>
              );
            })
          )}
        </div>
      )}
    </PrintLayout>
  );
};

export default MemoriaCalculoImpressao;
