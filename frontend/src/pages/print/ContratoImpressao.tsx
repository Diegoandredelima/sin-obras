import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import PrintLayout from "@/components/print/PrintLayout";
import MarcosContratuais from "@/components/print/MarcosContratuais";
import { fmtCurrency, fmtDate, fmtPercent } from "@/utils/format";

interface ContratoDetalhe {
  id: string; numero_contrato: string; numero_processo?: string; link_processo?: string; objeto?: string;
  orgao?: string; valor_global?: number; valor_final?: number; valor_aditivo?: number;
  valor_reajustado?: number; recurso_federal?: number; recurso_estadual?: number; percentual_retencao?: number;
  data_assinatura?: string; data_vigencia?: string; matricula_cei?: string;
  numero_licitacao?: string; tipo_licitacao?: string; fiscal_nome?: string; gestor_nome?: string;
  empresa_ref?: { id: string; razao_social: string; cnpj?: string };
  orgao_ref?: { sigla: string; nome?: string };
}

interface ObjetoVinc {
  id: string; titulo: string; descricao?: string; municipio?: string; status?: string; situacao?: string;
  ano_referencia?: number; saude?: string; percentual_executado?: number;
  valor_medido?: number; saldo_a_medir?: number;
  cep?: string; logradouro?: string; numero?: string; conjunto?: string; bairro?: string; uf?: string; endereco?: string;
  data_inicio?: string; data_fim_prevista?: string;
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

// Compõe o logradouro a partir das partes estruturadas; cai para o texto livre.
const enderecoLinha = (o?: ObjetoVinc | null): string | null => {
  if (!o) return null;
  const partes = [
    o.logradouro,
    o.numero && `nº ${o.numero}`,
    o.conjunto,
    o.bairro,
  ].filter(Boolean).join(", ");
  return partes || o.endereco || null;
};
const temEndereco = (o?: ObjetoVinc | null) =>
  !!(o && (o.cep || o.logradouro || o.bairro || o.municipio || o.uf || o.endereco));

const Field = ({ label, value, href }: { label: string; value?: string | number | null; href?: string | null }) => (
  <div className="flex gap-3 py-1.5 border-b border-slate-100 last:border-0">
    <span className="text-xs font-medium text-slate-400 w-44 shrink-0">{label}</span>
    {href ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-700 underline break-all">{value === 0 || value ? value : href}</a>
    ) : (
      <span className="text-sm text-slate-800">{value === 0 || value ? value : "—"}</span>
    )}
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

  // Contrato 1—N Objeto: imprime todos os objetos vinculados.
  const { data: objetos = [], isLoading: objetosLoading } = useQuery<ObjetoVinc[]>({
    queryKey: ["contrato-impressao-objetos", id],
    queryFn: async () => {
      const { data } = await api.get(`/contratos/${id}/objetos`);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!id && !!c,
  });

  const principal = objetos[0];
  const ready = !cLoading && !!c && !objetosLoading;

  return (
    <PrintLayout
      title="Relatório do Contrato"
      subtitle={c ? `Nº ${c.numero_contrato}${principal?.titulo ? ` — ${principal.titulo}` : ""}` : undefined}
      ready={ready}
    >
      {!c ? (
        <p className="text-sm text-slate-400">Carregando dados do contrato...</p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 print-avoid-break">
            <KPI label="Valor inicial" value={fmtCurrency(c.valor_global)} />
            <KPI label="Valor final" value={fmtCurrency(c.valor_final ?? c.valor_global)} />
            <KPI label="Valor medido" value={fmtCurrency(principal?.valor_medido, "—")} />
            <KPI label="Execução" value={fmtPercent(principal?.percentual_executado)} />
          </div>

          <Card title="Dados do Contrato">
            <Field label="Nº do contrato" value={c.numero_contrato} />
            <Field label="Nº da licitação" value={c.numero_licitacao} />
            <Field label="Tipo de licitação" value={c.tipo_licitacao} />
            <Field label="Nº do processo" value={c.numero_processo} href={c.link_processo} />
            {c.link_processo && <Field label="Link do processo" value={c.link_processo} href={c.link_processo} />}
            <Field label="Órgão" value={c.orgao_ref ? `${c.orgao_ref.sigla}${c.orgao_ref.nome ? ` — ${c.orgao_ref.nome}` : ""}` : c.orgao} />
            <Field label="Matrícula CEI" value={c.matricula_cei} />
            <Field label="Data de assinatura" value={fmtDate(c.data_assinatura ?? null)} />
            <Field label="Vigência contratual" value={fmtDate(c.data_vigencia ?? null)} />
          </Card>

          {temEndereco(principal) && (
            <Card title="Endereço da Obra">
              <Field label="Logradouro" value={enderecoLinha(principal)} />
              <Field label="Cidade / UF" value={[principal?.municipio, principal?.uf].filter(Boolean).join(" / ") || "—"} />
              <Field label="CEP" value={principal?.cep} />
            </Card>
          )}

          {c.objeto && (
            <Card title="Resumo">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{c.objeto}</p>
            </Card>
          )}

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
            <Field label="Percentual de retenção" value={c.percentual_retencao != null ? fmtPercent(c.percentual_retencao) : "—"} />
          </Card>

          {objetos.length === 0 ? (
            <Card title="Objetos do Contrato">
              <p className="text-sm text-slate-400">Nenhum objeto vinculado a este contrato.</p>
            </Card>
          ) : (
            objetos.map((o, idx) => (
              <Card key={o.id} title={`Objeto ${idx + 1} — ${o.titulo}`}>
                {o.descricao && <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mb-3">{o.descricao}</p>}
                <Field label="Município" value={o.municipio} />
                <Field label="Status" value={o.status ? STATUS_LABEL[o.status] || o.status : "—"} />
                <Field
                  label="Situação"
                  value={o.situacao
                    ? `${SITUACAO_LABEL[o.situacao] || o.situacao}${o.ano_referencia ? ` / ${o.ano_referencia}` : ""}`
                    : "—"}
                />
                <Field label="Execução" value={fmtPercent(o.percentual_executado)} />
                <Field label="Datas (início → previsão fim)" value={`${fmtDate(o.data_inicio ?? null)} → ${fmtDate(o.data_fim_prevista ?? null)}`} />
                <Field label="Vigência (início → fim)" value={`${fmtDate(o.vigencia_inicio ?? null)} → ${fmtDate(o.vigencia_fim ?? null)}`} />
                <Field label="Execução (início → fim)" value={`${fmtDate(o.execucao_inicio ?? null)} → ${fmtDate(o.execucao_fim ?? null)}`} />
                <Field label="Valor medido" value={fmtCurrency(o.valor_medido, "—")} />
                <Field label="Saldo a medir" value={fmtCurrency(o.saldo_a_medir, "—")} />
                <div className="mt-3">
                  <MarcosContratuais objetoId={o.id} contratoId={c.id} />
                </div>
              </Card>
            ))
          )}
        </>
      )}
    </PrintLayout>
  );
};

export default ContratoImpressao;
