import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Printer, Loader2, Building2 } from "lucide-react";
import api from "@/services/api";
import { fmtCurrency, fmtDate, fmtPercent } from "@/utils/format";
import type { ObjetoDetalhe } from "@/components/print/ObjetoReportBody";
import type { RelatorioObjetoRow } from "@/types";

interface ContratoDetalhe {
  id: string;
  numero_contrato: string;
  numero_processo?: string;
  objeto?: string;
  orgao?: string;
  valor_global?: number;
  valor_final?: number;
  valor_aditivo?: number;
  valor_reajustado?: number;
  recurso_federal?: number;
  recurso_estadual?: number;
  data_assinatura?: string;
  data_vigencia?: string;
  matricula_cei?: string;
  numero_licitacao?: string;
  tipo_licitacao?: string;
  fiscal_nome?: string;
  gestor_nome?: string;
  empresa_ref?: { id: string; razao_social: string; cnpj?: string };
  orgao_ref?: { sigla: string; nome?: string };
}

const SITUACAO_LABEL: Record<string, string> = {
  A_INICIAR: "A Iniciar", EM_ANDAMENTO: "Em Andamento", PARALISADA: "Paralisada",
  INACABADA: "Inacabada", CONCLUIDA: "Concluída", RESCINDIDA: "Rescindida",
  ARQUIVADA: "Arquivada", EXTINTA: "Extinta", CEDIDA: "Cedida",
};
const STATUS_LABEL: Record<string, string> = {
  PLANEJADA: "Planejada", EM_EXECUCAO: "Em Execução", PARALISADA: "Paralisada", CONCLUIDA: "Concluída",
};
const SAUDE_DOT: Record<string, string> = {
  VERDE: "bg-emerald-400", AMARELO: "bg-amber-400", VERMELHO: "bg-rose-400",
};
const SITUACAO_BADGE: Record<string, { label: string; cls: string }> = {
  A_INICIAR: { label: "A Iniciar", cls: "bg-slate-100 text-slate-600" },
  EM_ANDAMENTO: { label: "Em Andamento", cls: "bg-sky-100 text-sky-700" },
  PARALISADA: { label: "Paralisada", cls: "bg-amber-100 text-amber-700" },
  INACABADA: { label: "Inacabada", cls: "bg-orange-100 text-orange-700" },
  CONCLUIDA: { label: "Concluída", cls: "bg-emerald-100 text-emerald-700" },
  RESCINDIDA: { label: "Rescindida", cls: "bg-rose-100 text-rose-700" },
  ARQUIVADA: { label: "Arquivada", cls: "bg-slate-100 text-slate-400" },
};

const Field = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="flex gap-3 py-1.5 border-b border-slate-100 last:border-0">
    <span className="text-xs font-medium text-slate-400 w-40 shrink-0">{label}</span>
    <span className="text-sm text-slate-800">{value === 0 || value ? value : "—"}</span>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">{title}</h3>
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-1">
      {children}
    </div>
  </div>
);

const KPI = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="bg-white rounded-xl border border-slate-100 p-3">
    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide leading-tight">{label}</p>
    <p className="text-base font-bold text-slate-900 mt-1 leading-tight">{value}</p>
    {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
  </div>
);

interface Props {
  row: RelatorioObjetoRow;
  onClose: () => void;
}

const RelatorioDetalhePanel = ({ row, onClose }: Props) => {
  const { data: objeto, isLoading: objetoLoading } = useQuery<ObjetoDetalhe>({
    queryKey: ["rel-detalhe-objeto", row.objeto_id],
    queryFn: async () => { const { data } = await api.get(`/objetos/${row.objeto_id}`); return data; },
    staleTime: 2 * 60 * 1000,
  });

  const { data: contrato, isLoading: contratoLoading } = useQuery<ContratoDetalhe | null>({
    queryKey: ["rel-detalhe-contrato", row.contrato_id],
    queryFn: async () => {
      if (!row.contrato_id) return null;
      const { data } = await api.get(`/contratos/${row.contrato_id}`);
      return data;
    },
    enabled: !!row.contrato_id,
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll while panel is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const isLoading = objetoLoading || (!!row.contrato_id && contratoLoading);

  const printUrl = row.contrato_id
    ? `/contratos/${row.contrato_id}/relatorio`
    : `/objetos/${row.objeto_id}/relatorio`;

  const sit = row.situacao ? SITUACAO_BADGE[row.situacao] : null;
  const valorExibido = row.valor_final ?? row.valor_global ?? row.valor_contrato;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Painel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Cabeçalho do painel */}
        <div className="flex items-start gap-4 px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {row.saude && (
                <span className={`h-2 w-2 rounded-full shrink-0 ${SAUDE_DOT[row.saude] ?? "bg-slate-300"}`} />
              )}
              {sit && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sit.cls}`}>
                  {sit.label}
                </span>
              )}
              {row.contrato_numero && (
                <span className="text-[10px] font-medium text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full">
                  Contrato {row.contrato_numero}
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">{row.titulo}</h2>
            {row.municipio && <p className="text-sm text-slate-500 mt-0.5">{row.municipio}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => window.open(printUrl, "_blank", "noopener")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-700 text-white text-sm font-semibold rounded-xl hover:bg-brand-500 transition-all"
            >
              <Printer className="h-4 w-4" /> Gerar PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-slate-300 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KPI label="Valor" value={fmtCurrency(valorExibido)} />
              <KPI label="Execução" value={fmtPercent(row.percentual_executado)} />
              <KPI label="Valor medido" value={fmtCurrency(row.valor_medido, "—")} />
              <KPI label="Saldo a medir" value={fmtCurrency(row.saldo_a_medir, "—")} />
            </div>

            {/* ── Objeto ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-brand-700 shrink-0" />
                <span className="text-sm font-bold text-slate-800">Objeto</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <Section title="Identificação">
                <Field label="Título" value={objeto?.titulo ?? row.titulo} />
                <Field label="Órgão" value={objeto?.orgao ?? row.orgao} />
                <Field label="Município" value={objeto?.municipio ?? row.municipio} />
                {objeto?.endereco && <Field label="Endereço" value={objeto.endereco} />}
                <Field
                  label="Status operacional"
                  value={objeto?.status ? STATUS_LABEL[objeto.status] ?? objeto.status : "—"}
                />
                <Field
                  label="Situação"
                  value={
                    objeto?.situacao
                      ? `${SITUACAO_LABEL[objeto.situacao] ?? objeto.situacao}${objeto.ano_referencia ? ` / ${objeto.ano_referencia}` : ""}`
                      : "—"
                  }
                />
              </Section>

              <Section title="Prazos">
                {objeto?.prazo_inicial_dias && (
                  <Field label="Prazo inicial" value={`${objeto.prazo_inicial_dias} dias`} />
                )}
                <Field label="Ordem de serviço" value={fmtDate(objeto?.data_inicio ?? null)} />
                <Field
                  label="Vigência"
                  value={`${fmtDate(objeto?.vigencia_inicio ?? null)} → ${fmtDate(objeto?.vigencia_fim ?? null)}`}
                />
                <Field
                  label="Execução"
                  value={`${fmtDate(objeto?.execucao_inicio ?? null)} → ${fmtDate(objeto?.execucao_fim ?? null)}`}
                />
              </Section>

              {objeto?.metas && objeto.metas.length > 0 && (
                <Section title={`Metas (${objeto.metas.length})`}>
                  {objeto.metas.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 gap-3">
                      <span className="text-sm text-slate-700 min-w-0 truncate">{m.descricao}</span>
                      <span className="text-sm font-semibold text-slate-900 shrink-0">{fmtCurrency(m.valor)}</span>
                    </div>
                  ))}
                </Section>
              )}

              {(objeto?.historico || objeto?.observacoes || objeto?.importante) && (
                <Section title="Observações">
                  {objeto.importante && <Field label="Importante" value={objeto.importante} />}
                  {objeto.historico && <Field label="Histórico" value={objeto.historico} />}
                  {objeto.observacoes && <Field label="Observações" value={objeto.observacoes} />}
                </Section>
              )}
            </div>

            {/* ── Contrato ── */}
            {row.contrato_id && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <svg className="h-4 w-4 text-brand-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10,9 9,9 8,9" />
                  </svg>
                  <span className="text-sm font-bold text-slate-800">Contrato</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                {contratoLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 text-slate-300 animate-spin" />
                  </div>
                ) : contrato ? (
                  <>
                    <Section title="Identificação">
                      <Field label="Nº do contrato" value={contrato.numero_contrato} />
                      <Field label="Nº do processo" value={contrato.numero_processo} />
                      <Field
                        label="Órgão"
                        value={contrato.orgao_ref
                          ? `${contrato.orgao_ref.sigla}${contrato.orgao_ref.nome ? ` — ${contrato.orgao_ref.nome}` : ""}`
                          : contrato.orgao}
                      />
                      <Field label="Licitação" value={contrato.numero_licitacao} />
                      <Field label="Tipo de licitação" value={contrato.tipo_licitacao} />
                      <Field label="Matrícula CEI" value={contrato.matricula_cei} />
                      <Field label="Data de assinatura" value={fmtDate(contrato.data_assinatura ?? null)} />
                      <Field label="Vigência contratual" value={fmtDate(contrato.data_vigencia ?? null)} />
                    </Section>

                    <Section title="Empresa executora">
                      <Field label="Razão social" value={contrato.empresa_ref?.razao_social} />
                      <Field label="CNPJ" value={contrato.empresa_ref?.cnpj} />
                    </Section>

                    <Section title="Responsáveis">
                      <Field label="Fiscal" value={contrato.fiscal_nome} />
                      <Field label="Gestor" value={contrato.gestor_nome} />
                    </Section>

                    <Section title="Financeiro">
                      <Field label="Valor inicial" value={fmtCurrency(contrato.valor_global)} />
                      {contrato.valor_aditivo && (
                        <Field label="Aditivo de valor" value={fmtCurrency(contrato.valor_aditivo)} />
                      )}
                      {contrato.valor_reajustado && (
                        <Field label="Valor reajustado" value={fmtCurrency(contrato.valor_reajustado)} />
                      )}
                      <Field label="Valor final" value={fmtCurrency(contrato.valor_final ?? contrato.valor_global)} />
                      {contrato.recurso_federal && (
                        <Field label="Recurso federal" value={fmtCurrency(contrato.recurso_federal)} />
                      )}
                      {contrato.recurso_estadual && (
                        <Field label="Recurso estadual" value={fmtCurrency(contrato.recurso_estadual)} />
                      )}
                    </Section>

                    {contrato.objeto && (
                      <Section title="Objeto">
                        <p className="text-sm text-slate-700 leading-relaxed py-1.5">{contrato.objeto}</p>
                      </Section>
                    )}
                  </>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* Rodapé */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/60">
          <button
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </>
  );
};

export default RelatorioDetalhePanel;
