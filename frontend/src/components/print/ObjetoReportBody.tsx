import MarcosContratuais from "@/components/print/MarcosContratuais";
import { fmtCurrency, fmtDate, fmtPercent } from "@/utils/format";

export interface ObjetoDetalhe {
  id: string; titulo: string; descricao?: string; endereco?: string; municipio?: string;
  contrato_id?: string;
  valor_contrato?: number; status?: string; situacao?: string; situacao_origem?: string;
  saude?: string; percentual_executado?: number; ano_referencia?: number; orgao?: string;
  data_inicio?: string; data_fim_prevista?: string;
  vigencia_inicio?: string; vigencia_dias?: number; vigencia_fim?: string;
  execucao_inicio?: string; execucao_dias?: number; execucao_fim?: string;
  prazo_inicial_dias?: number; valor_medido?: number; saldo_a_medir?: number;
  historico?: string; observacoes?: string; importante?: string;
  metas?: { id: string; descricao: string; valor: number }[];
}

const SITUACAO_LABEL: Record<string, string> = {
  A_INICIAR: "A Iniciar", EM_ANDAMENTO: "Em Andamento", PARALISADA: "Paralisada",
  INACABADA: "Inacabada", CONCLUIDA: "Concluída", RESCINDIDA: "Rescindida",
  ARQUIVADA: "Arquivada", EXTINTA: "Extinta", CEDIDA: "Cedida",
};
const STATUS_LABEL: Record<string, string> = {
  PLANEJADA: "Planejada", EM_EXECUCAO: "Em Execução", PARALISADA: "Paralisada", CONCLUIDA: "Concluída",
};
const SAUDE_LABEL: Record<string, string> = { VERDE: "Em dia", AMARELO: "Atenção", VERMELHO: "Crítico" };

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

/**
 * Conteúdo do documento de um objeto (sem PrintLayout), reutilizado tanto na
 * impressão individual (`ObjetoImpressao`) quanto na impressão em lote
 * (`ObjetosLoteImpressao`).
 */
const ObjetoReportBody = ({ o, showTitulo = false }: { o: ObjetoDetalhe; showTitulo?: boolean }) => (
  <div className="space-y-6">
    {showTitulo && (
      <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">{o.titulo}</h2>
    )}

    {/* Indicadores */}
    <div className="grid grid-cols-4 gap-4 print-avoid-break">
      <KPI label="Valor do contrato" value={fmtCurrency(o.valor_contrato)} />
      <KPI label="Execução" value={fmtPercent(o.percentual_executado)} />
      <KPI label="Valor medido" value={fmtCurrency(o.valor_medido, "—")} />
      <KPI label="Saldo a medir" value={fmtCurrency(o.saldo_a_medir, "—")} />
    </div>

    <Card title="Identificação">
      <Field label="Título" value={o.titulo} />
      <Field label="Órgão" value={o.orgao} />
      <Field label="Município" value={o.municipio} />
      <Field label="Endereço" value={o.endereco} />
      <Field label="Status operacional" value={o.status ? STATUS_LABEL[o.status] || o.status : "—"} />
      <Field
        label="Situação (planilha)"
        value={o.situacao
          ? `${SITUACAO_LABEL[o.situacao] || o.situacao}${o.ano_referencia ? ` / ${o.ano_referencia}` : ""}`
          : "—"}
      />
      <Field label="Saúde" value={o.saude ? SAUDE_LABEL[o.saude] || o.saude : "—"} />
    </Card>

    <Card title="Prazos">
      <Field label="Prazo inicial" value={o.prazo_inicial_dias ? `${o.prazo_inicial_dias} dias` : "—"} />
      <Field label="Ordem de serviço / início" value={fmtDate(o.data_inicio ?? null)} />
      <Field label="Vigência (início → fim)" value={`${fmtDate(o.vigencia_inicio ?? null)} → ${fmtDate(o.vigencia_fim ?? null)}`} />
      <Field label="Execução (início → fim)" value={`${fmtDate(o.execucao_inicio ?? null)} → ${fmtDate(o.execucao_fim ?? null)}`} />
      <Field label="Previsão de término" value={fmtDate(o.data_fim_prevista ?? null)} />
    </Card>

    {o.metas && o.metas.length > 0 && (
      <Card title={`Metas (${o.metas.length})`}>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-left">
              <th className="border border-slate-200 px-2 py-1.5 font-semibold">Descrição</th>
              <th className="border border-slate-200 px-2 py-1.5 font-semibold text-right w-40">Valor</th>
            </tr>
          </thead>
          <tbody>
            {o.metas.map((m) => (
              <tr key={m.id}>
                <td className="border border-slate-200 px-2 py-1.5">{m.descricao}</td>
                <td className="border border-slate-200 px-2 py-1.5 text-right">{fmtCurrency(m.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    )}

    <MarcosContratuais objetoId={o.id} contratoId={o.contrato_id} />

    {o.importante && (
      <Card title="Importante">
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{o.importante}</p>
      </Card>
    )}
    {o.historico && (
      <Card title="Histórico">
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{o.historico}</p>
      </Card>
    )}
    {o.observacoes && (
      <Card title="Observações">
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{o.observacoes}</p>
      </Card>
    )}
  </div>
);

export default ObjetoReportBody;
