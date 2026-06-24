import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import PrintLayout from "@/components/print/PrintLayout";
import { fmtDate } from "@/utils/format";

interface LinhaQtd { nome?: string; funcao?: string; quantidade: number }
interface Diario {
  id: string; data_registro: string;
  tempo_manha?: string | null; tempo_tarde?: string | null; pluviometria_mm?: number | string | null;
  equipamentos_lista?: LinhaQtd[] | null; mao_de_obra?: LinhaQtd[] | null;
  atividades_realizadas?: string | null; ocorrencias?: string | null; observacoes_fiscal?: string | null;
}
interface Objeto { titulo: string; orgao?: string; municipio?: string; data_inicio?: string; data_fim_prevista?: string }

const TEMPO_LABEL: Record<string, string> = { BOM: "Bom", CHUVA_FRACA: "Chuva fraca", CHUVA_FORTE: "Chuva forte" };

const diasEntre = (a?: string, b?: string): number | null => {
  if (!a || !b) return null;
  const d = (new Date(b + "T12:00:00").getTime() - new Date(a + "T12:00:00").getTime()) / 86400000;
  return Math.round(d);
};

const TabelaQtd = ({ titulo, campo, linhas }: { titulo: string; campo: "nome" | "funcao"; linhas?: LinhaQtd[] | null }) => (
  <table className="w-full text-xs border-collapse">
    <thead>
      <tr className="bg-slate-100 text-slate-600 text-left">
        <th className="border border-slate-200 px-2 py-1.5 font-semibold">{titulo}</th>
        <th className="border border-slate-200 px-2 py-1.5 font-semibold text-right w-20">Quant.</th>
      </tr>
    </thead>
    <tbody>
      {(linhas && linhas.length > 0) ? linhas.map((l, i) => (
        <tr key={i}>
          <td className="border border-slate-200 px-2 py-1.5">{l[campo]}</td>
          <td className="border border-slate-200 px-2 py-1.5 text-right">{l.quantidade}</td>
        </tr>
      )) : (
        <tr><td colSpan={2} className="border border-slate-200 px-2 py-1.5 text-slate-400">—</td></tr>
      )}
    </tbody>
  </table>
);

const Bloco = ({ titulo, texto }: { titulo: string; texto?: string | null }) => (
  <section className="rounded-xl border border-slate-200 p-4 print-card">
    <h2 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wide">{titulo}</h2>
    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{texto || "—"}</p>
  </section>
);

const RdoImpressao = () => {
  const { objetoId, diarioId } = useParams<{ objetoId: string; diarioId: string }>();

  const { data: diarios, isLoading: l1 } = useQuery<Diario[]>({
    queryKey: ["rdo-diario", objetoId],
    queryFn: async () => (await api.get(`/empresa/objetos/${objetoId}/diario`)).data,
    enabled: !!objetoId,
  });
  const { data: objeto, isLoading: l2 } = useQuery<Objeto>({
    queryKey: ["rdo-objeto", objetoId],
    queryFn: async () => (await api.get(`/objetos/${objetoId}`)).data,
    enabled: !!objetoId,
  });

  const d = diarios?.find((x) => x.id === diarioId);
  const decorrido = diasEntre(objeto?.data_inicio, d?.data_registro);
  const restante = diasEntre(d?.data_registro, objeto?.data_fim_prevista);

  return (
    <PrintLayout title="Relatório Diário de Obra (RDO)" subtitle={objeto?.titulo} ready={!l1 && !l2 && !!d}>
      {!d ? (
        <p className="text-sm text-slate-400">Carregando registro...</p>
      ) : (
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 print-avoid-break">
            <Info label="Cliente" value={objeto?.orgao || "PM-RN / SIN"} />
            <Info label="Data" value={fmtDate(d.data_registro)} />
            <Info label="Prazo decorrido" value={decorrido != null ? `${decorrido} dias` : "—"} />
            <Info label="Prazo restante" value={restante != null ? `${restante} dias` : "—"} />
            <Info label="Tempo (manhã)" value={TEMPO_LABEL[d.tempo_manha || ""] || "—"} />
            <Info label="Tempo (tarde)" value={TEMPO_LABEL[d.tempo_tarde || ""] || "—"} />
            <Info label="Pluviometria" value={d.pluviometria_mm != null ? `${Number(d.pluviometria_mm)} mm` : "—"} />
            <Info label="Município" value={objeto?.municipio || "—"} />
          </section>

          <div className="grid grid-cols-2 gap-4 print-avoid-break">
            <TabelaQtd titulo="Equipamento" campo="nome" linhas={d.equipamentos_lista} />
            <TabelaQtd titulo="Mão de objeto" campo="funcao" linhas={d.mao_de_obra} />
          </div>

          <Bloco titulo="Atividades realizadas" texto={d.atividades_realizadas} />
          <Bloco titulo="Ocorrências" texto={d.ocorrencias} />
          <Bloco titulo="Observações da fiscalização" texto={d.observacoes_fiscal} />

          <div className="grid grid-cols-2 gap-8 pt-10 print-avoid-break">
            <Assinatura label="Empresa" />
            <Assinatura label="Fiscalização" />
          </div>
        </div>
      )}
    </PrintLayout>
  );
};

const Info = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{label}</p>
    <p className="text-sm font-semibold text-slate-800">{value || "—"}</p>
  </div>
);

const Assinatura = ({ label }: { label: string }) => (
  <div className="text-center">
    <div className="border-t border-slate-400 pt-1 mt-8 mx-4" />
    <p className="text-xs font-medium text-slate-600">{label}</p>
  </div>
);

export default RdoImpressao;
