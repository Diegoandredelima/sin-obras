import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import PrintLayout from "@/components/print/PrintLayout";
import { fmtCurrency, fmtDate } from "@/utils/format";

interface BoletimItem {
  id: string; descricao: string | null; unidade: string | null;
  quantidade_prevista: string; quantidade_periodo: string; quantidade_acumulada: string; quantidade_saldo: string;
  percentual_periodo: string; percentual_acumulado: string;
  valor_unitario: string; valor_bruto: string; acumulado_atual: string; saldo: string;
}
interface Boletim {
  numero_medicao: number; percentual_retencao: string; itens: BoletimItem[];
  valor_bruto_total: string; valor_faturamento_direto: string; retencao: string; valor_liquido: string;
}
interface Medicao { objeto_id: string; data_inicio_periodo?: string; data_fim_periodo?: string }
interface Objeto { titulo: string }

const num = (v: string | number, dec = 2) =>
  Number(v).toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });

const BoletimImpressao = () => {
  const { medicaoId } = useParams<{ medicaoId: string }>();

  const { data: boletim, isLoading: l1 } = useQuery<Boletim>({
    queryKey: ["bol-doc", medicaoId],
    queryFn: async () => (await api.get(`/empresa/medicoes/${medicaoId}/boletim`)).data,
    enabled: !!medicaoId,
  });
  const { data: medicao } = useQuery<Medicao>({
    queryKey: ["bol-medicao", medicaoId],
    queryFn: async () => (await api.get(`/empresa/medicoes/${medicaoId}`)).data,
    enabled: !!medicaoId,
  });
  const { data: objeto } = useQuery<Objeto>({
    queryKey: ["bol-objeto", medicao?.objeto_id],
    queryFn: async () => (await api.get(`/objetos/${medicao!.objeto_id}`)).data,
    enabled: !!medicao?.objeto_id,
  });

  const periodo = medicao?.data_inicio_periodo
    ? `${fmtDate(medicao.data_inicio_periodo)} a ${fmtDate(medicao.data_fim_periodo ?? null)}`
    : "—";

  return (
    <PrintLayout
      title={`Boletim de Medição nº ${boletim ? String(boletim.numero_medicao).padStart(2, "0") : ""}`}
      subtitle={objeto?.titulo} orientation="landscape" ready={!l1 && !!boletim}
    >
      {!boletim ? (
        <p className="text-sm text-slate-400">Carregando boletim...</p>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Período: {periodo}</p>
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                <th className="border border-slate-300 px-1.5 py-1 text-left" rowSpan={2}>Descrição</th>
                <th className="border border-slate-300 px-1.5 py-1" rowSpan={2}>Unid.</th>
                <th className="border border-slate-300 px-1.5 py-1" colSpan={4}>Quantidade</th>
                <th className="border border-slate-300 px-1.5 py-1" colSpan={2}>Percentual</th>
                <th className="border border-slate-300 px-1.5 py-1" rowSpan={2}>Preço unit.</th>
                <th className="border border-slate-300 px-1.5 py-1" rowSpan={2}>No período</th>
                <th className="border border-slate-300 px-1.5 py-1" rowSpan={2}>Acumulado</th>
                <th className="border border-slate-300 px-1.5 py-1" rowSpan={2}>Saldo</th>
              </tr>
              <tr className="bg-slate-100 text-slate-600">
                <th className="border border-slate-300 px-1.5 py-1">Previsto</th>
                <th className="border border-slate-300 px-1.5 py-1">No período</th>
                <th className="border border-slate-300 px-1.5 py-1">Acumulado</th>
                <th className="border border-slate-300 px-1.5 py-1">Saldo</th>
                <th className="border border-slate-300 px-1.5 py-1">No período</th>
                <th className="border border-slate-300 px-1.5 py-1">Acumulado</th>
              </tr>
            </thead>
            <tbody>
              {boletim.itens.map((it, i) => (
                <tr key={it.id}>
                  <td className="border border-slate-200 px-1.5 py-1">{i + 1}. {it.descricao}</td>
                  <td className="border border-slate-200 px-1.5 py-1 text-center">{it.unidade}</td>
                  <td className="border border-slate-200 px-1.5 py-1 text-right">{num(it.quantidade_prevista, 2)}</td>
                  <td className="border border-slate-200 px-1.5 py-1 text-right">{num(it.quantidade_periodo, 2)}</td>
                  <td className="border border-slate-200 px-1.5 py-1 text-right">{num(it.quantidade_acumulada, 2)}</td>
                  <td className="border border-slate-200 px-1.5 py-1 text-right">{num(it.quantidade_saldo, 2)}</td>
                  <td className="border border-slate-200 px-1.5 py-1 text-right">{num(it.percentual_periodo, 1)}%</td>
                  <td className="border border-slate-200 px-1.5 py-1 text-right">{num(it.percentual_acumulado, 1)}%</td>
                  <td className="border border-slate-200 px-1.5 py-1 text-right">{fmtCurrency(it.valor_unitario)}</td>
                  <td className="border border-slate-200 px-1.5 py-1 text-right">{fmtCurrency(it.valor_bruto)}</td>
                  <td className="border border-slate-200 px-1.5 py-1 text-right">{fmtCurrency(it.acumulado_atual)}</td>
                  <td className="border border-slate-200 px-1.5 py-1 text-right">{fmtCurrency(it.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-col items-end gap-1 text-sm print-avoid-break">
            <span className="text-slate-500">Valor bruto: <b className="text-slate-800">{fmtCurrency(boletim.valor_bruto_total)}</b></span>
            <span className="text-slate-500">Faturamento direto: <b className="text-slate-800">- {fmtCurrency(boletim.valor_faturamento_direto)}</b></span>
            <span className="text-slate-500">Retenção ({num(boletim.percentual_retencao, 2)}%): <b className="text-slate-800">- {fmtCurrency(boletim.retencao)}</b></span>
            <span className="text-base text-slate-700">Valor líquido: <b className="text-brand-700">{fmtCurrency(boletim.valor_liquido)}</b></span>
          </div>
        </div>
      )}
    </PrintLayout>
  );
};

export default BoletimImpressao;
