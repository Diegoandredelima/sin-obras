import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import PrintLayout from "@/components/print/PrintLayout";
import MarcosContratuais from "@/components/print/MarcosContratuais";
import { fmtCurrency, fmtDate, fmtPercent } from "@/utils/format";

interface ContratoDetalhe {
  id: string; numero_contrato: string; numero_processo?: string; objeto?: string;
  orgao?: string; valor_global?: number; valor_final?: number; valor_aditivo?: number;
  valor_reajustado?: number; recurso_federal?: number; recurso_estadual?: number;
  data_assinatura?: string; data_vigencia?: string; matricula_cei?: string;
  numero_licitacao?: string; tipo_licitacao?: string; fiscal_nome?: string; gestor_nome?: string;
  empresa_ref?: { id: string; razao_social: string; cnpj?: string };
  orgao_ref?: { sigla: string; nome?: string };
}

interface ObraVinc {
  id: string; titulo: string; municipio?: string; status?: string; situacao?: string;
  ano_referencia?: number; saude?: string; percentual_executado?: number;
  valor_medido?: number; saldo_a_medir?: number;
  vigencia_inicio?: string; vigencia_fim?: string; execucao_inicio?: string; execucao_fim?: string;
}

const SITUACAO_LABEL: Record<string, string> = {
  A_INICIAR: "A Iniciar", EM_ANDAMENTO: "Em Andamento", PARALISADA: "Paralisada",
  INACABADA: "Inacabada", CONCLUIDA: "Concluída", RESCINDIDA: "Rescindida",
  ARQUIVADA: "Arquivada", EXTINTA: "Extinta", CEDIDA: "Cedida",
};
const STATUS_LABEL: Record<string, string> = {
  PLANEJADA: "Planejada", EM_EXECUCAO: "Em Execução", PARALISADA: "Paralisada", CONCLUIDA: "Concluída",
};

const Field = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="flex gap-3 py-1.5 border-b border-slate-100 last:border-0">
    <span className="text-xs font-medium text-slate-400 w-44 shrink-0">{label}</span>
    <span className="text-sm text-slate-800">{value === 0 || value ? value : "—"}</span>
  </div>
);

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-xl border border-slate-200 p-5 print-card">
    <h2 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">{title}</h2>
    {children}
  </section>
);

const KPI = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-slate-200 p-4">
    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{label}</p>
    <p className="text-lg font-bold text-slate-900 mt-1">{value}</p>
  </div>
);

const ContratoImpressao = () => {
  const { id } = useParams<{ id: string }>();

  const { data: c, isLoading: cLoading } = useQuery<ContratoDetalhe>({
    queryKey: ["contrato-impressao", id],
    queryFn: async () => {
      const { data } = await api.get(`/contratos/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const { data: obra, isLoading: obraLoading } = useQuery<ObraVinc | null>({
    queryKey: ["contrato-impressao-obra", id],
    queryFn: async () => {
      const { data } = await api.get("/obras", { params: { contrato_id: id, limit: 1 } });
      return data.items?.[0] ?? null;
    },
    enabled: !!id && !!c,
  });

  const ready = !cLoading && !!c && !obraLoading;

  return (
    <PrintLayout
      title="Relatório do Contrato"
      subtitle={c ? `Nº ${c.numero_contrato}${obra?.titulo ? ` — ${obra.titulo}` : ""}` : undefined}
      ready={ready}
    >
      {!c ? (
        <p className="text-sm text-slate-400">Carregando dados do contrato...</p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 print-avoid-break">
            <KPI label="Valor inicial" value={fmtCurrency(c.valor_global)} />
            <KPI label="Valor final" value={fmtCurrency(c.valor_final ?? c.valor_global)} />
            <KPI label="Valor medido" value={fmtCurrency(obra?.valor_medido, "—")} />
            <KPI label="Execução" value={fmtPercent(obra?.percentual_executado)} />
          </div>

          <Card title="Dados do Contrato">
            <Field label="Nº do contrato" value={c.numero_contrato} />
            <Field label="Nº do processo" value={c.numero_processo} />
            <Field label="Órgão" value={c.orgao_ref ? `${c.orgao_ref.sigla}${c.orgao_ref.nome ? ` — ${c.orgao_ref.nome}` : ""}` : c.orgao} />
            <Field label="Matrícula CEI" value={c.matricula_cei} />
            <Field label="Licitação" value={c.numero_licitacao} />
            <Field label="Tipo de licitação" value={c.tipo_licitacao} />
            <Field label="Data de assinatura" value={fmtDate(c.data_assinatura ?? null)} />
            <Field label="Vigência contratual" value={fmtDate(c.data_vigencia ?? null)} />
          </Card>

          <Card title="Empresa Executora">
            <Field label="Razão social" value={c.empresa_ref?.razao_social} />
            <Field label="CNPJ" value={c.empresa_ref?.cnpj} />
          </Card>

          <Card title="Responsáveis">
            <Field label="Fiscal" value={c.fiscal_nome} />
            <Field label="Gestor" value={c.gestor_nome} />
          </Card>

          <Card title="Financeiro">
            <Field label="Valor inicial (global)" value={fmtCurrency(c.valor_global)} />
            <Field label="Aditivo de valor" value={c.valor_aditivo ? fmtCurrency(c.valor_aditivo) : "—"} />
            <Field label="Valor reajustado" value={c.valor_reajustado ? fmtCurrency(c.valor_reajustado) : "—"} />
            <Field label="Valor final" value={fmtCurrency(c.valor_final ?? c.valor_global)} />
            <Field label="Recurso federal" value={c.recurso_federal ? fmtCurrency(c.recurso_federal) : "—"} />
            <Field label="Recurso estadual" value={c.recurso_estadual ? fmtCurrency(c.recurso_estadual) : "—"} />
          </Card>

          {c.objeto && (
            <Card title="Objeto do Contrato">
              <p className="text-sm text-slate-700 leading-relaxed">{c.objeto}</p>
            </Card>
          )}

          {obra && (
            <Card title="Obra Vinculada">
              <Field label="Título" value={obra.titulo} />
              <Field label="Município" value={obra.municipio} />
              <Field label="Status" value={obra.status ? STATUS_LABEL[obra.status] || obra.status : "—"} />
              <Field
                label="Situação"
                value={obra.situacao
                  ? `${SITUACAO_LABEL[obra.situacao] || obra.situacao}${obra.ano_referencia ? ` / ${obra.ano_referencia}` : ""}`
                  : "—"}
              />
              <Field label="Execução" value={fmtPercent(obra.percentual_executado)} />
              <Field label="Vigência (início → fim)" value={`${fmtDate(obra.vigencia_inicio ?? null)} → ${fmtDate(obra.vigencia_fim ?? null)}`} />
              <Field label="Execução (início → fim)" value={`${fmtDate(obra.execucao_inicio ?? null)} → ${fmtDate(obra.execucao_fim ?? null)}`} />
              <Field label="Saldo a medir" value={fmtCurrency(obra.saldo_a_medir, "—")} />
            </Card>
          )}

          {obra && <MarcosContratuais obraId={obra.id} contratoId={c.id} />}
        </>
      )}
    </PrintLayout>
  );
};

export default ContratoImpressao;
