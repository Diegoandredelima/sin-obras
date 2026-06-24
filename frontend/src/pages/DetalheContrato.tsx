import { useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Briefcase, Building2, User, MapPin,
  TrendingUp, Calendar, FileText, Hash, AlertTriangle,
  Activity, CheckCircle2, Pause, Clock, BookOpen, ChartBar,
  ChevronDown, ChevronUp, ExternalLink, ShieldCheck, History, CalendarDays, Pencil,
  Boxes, Printer,
  type LucideIcon,
} from "lucide-react";
import api from "@/services/api";
import type { SaudeObjeto } from "@/types";
import { useAuthStore } from "@/store/auth";
import { fmtCurrency, fmtDate, fmtPercent } from "@/utils/format";
import { DiarioContent } from "@/pages/DiarioObras";
import { MedicoesContent } from "@/pages/Medicoes";
import { ArtRrtContent } from "@/components/ArtRrtContent";
import { EventosContratuaisContent } from "@/components/EventosContratuaisContent";
import { CronogramaContent } from "@/components/CronogramaContent";
import { CurvaSContent } from "@/components/CurvaSContent";

interface LabelConfig { label: string; cls: string }
interface StatusConfig { label: string; icon: LucideIcon; cls: string }

const STATUS_CONFIG: Record<string, StatusConfig> = {
  PLANEJADA:   { label: "Planejada",   icon: Clock,        cls: "text-slate-600 bg-slate-50 border-slate-200" },
  EM_EXECUCAO: { label: "Em Execução", icon: Activity,     cls: "text-sky-700 bg-sky-50 border-sky-200" },
  PARALISADA:  { label: "Paralisada",  icon: Pause,        cls: "text-amber-700 bg-amber-50 border-amber-200" },
  CONCLUIDA:   { label: "Concluída",   icon: CheckCircle2, cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
};

const SITUACAO_LABEL: Record<string, LabelConfig> = {
  A_INICIAR: { label: "A Iniciar", cls: "bg-slate-100 text-slate-700 border-slate-200" },
  EM_ANDAMENTO: { label: "Em Andamento", cls: "bg-sky-100 text-sky-700 border-sky-200" },
  PARALISADA: { label: "Paralisada", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  INACABADA: { label: "Inacabada", cls: "bg-orange-100 text-orange-700 border-orange-200" },
  CONCLUIDA: { label: "Concluída", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  RESCINDIDA: { label: "Rescindida", cls: "bg-rose-100 text-rose-700 border-rose-200" },
  ARQUIVADA: { label: "Arquivada", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  EXTINTA: { label: "Extinta", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  CEDIDA: { label: "Cedida", cls: "bg-purple-100 text-purple-700 border-purple-200" },
};

interface SaudeConfig { dot: string; bar: string; label: string }
const SAUDE_CONFIG: Record<SaudeObjeto, SaudeConfig> = {
  VERDE: { dot: "bg-emerald-400", bar: "bg-emerald-400", label: "Em dia" },
  AMARELO: { dot: "bg-amber-400", bar: "bg-amber-400", label: "Atenção" },
  VERMELHO: { dot: "bg-rose-400", bar: "bg-rose-400", label: "Crítico" },
};

interface SectionProps { title: string; icon?: LucideIcon; children: React.ReactNode; className?: string }
const Section = ({ title, icon: Icon, children, className = "" }: SectionProps) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}>
    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">{Icon && <Icon className="h-4 w-4 text-slate-400 shrink-0" />}<h3 className="text-sm font-semibold text-slate-800">{title}</h3></div>
    <div className="p-6">{children}</div>
  </div>
);

interface RowProps { label: string; value: string | null | undefined; mono?: boolean; highlight?: boolean; href?: string | null }
const Row = ({ label, value, mono = false, highlight = false, href }: RowProps) => (
  <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3 py-2.5 border-b border-slate-50 last:border-0">
    <span className="text-xs font-medium text-slate-400 sm:w-44 shrink-0">{label}</span>
    {href ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 text-sm break-words text-brand-700 hover:text-brand-500 hover:underline ${mono ? "font-mono" : ""}`}>
        {value || "—"}<ExternalLink className="h-3.5 w-3.5 shrink-0" />
      </a>
    ) : (
      <span className={`text-sm break-words ${mono ? "font-mono" : ""} ${highlight ? "font-semibold text-slate-900" : "text-slate-800"}`}>{value || "—"}</span>
    )}
  </div>
);

interface KPIProps { label: string; value: string; sub?: string | null; color?: string; note?: string | null }
const KPI = ({ label, value, sub, color = "slate", note }: KPIProps) => {
  const colors: Record<string, string> = { slate: "text-slate-900", brand: "text-brand-700", emerald: "text-emerald-700", sky: "text-sky-700", amber: "text-amber-700", rose: "text-rose-700" };
  return <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-1"><span className="text-xs font-medium text-slate-400">{label}</span><span className={`text-xl font-bold leading-tight ${colors[color]}`}>{value}</span>{sub && <span className="text-xs text-slate-400">{sub}</span>}{note && <span className="text-xs font-medium text-amber-600 mt-1">{note}</span>}</div>;
};

interface PrazoRowProps { label: string; inicio?: string | null; dias?: number | null; fim?: string | null }
const PrazoRow = ({ label, inicio, dias, fim }: PrazoRowProps) => (
  <div className="py-3 border-b border-slate-50 last:border-0">
    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">{label}</p>
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] text-slate-400 mb-0.5">Início</p><p className="text-sm font-semibold text-slate-800">{fmtDate(inicio ?? null)}</p></div>
      <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] text-slate-400 mb-0.5">Dias</p><p className="text-sm font-semibold text-slate-800">{dias ?? "—"}</p></div>
      <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] text-slate-400 mb-0.5">Fim</p><p className="text-sm font-semibold text-slate-800">{fmtDate(fim ?? null)}</p></div>
    </div>
  </div>
);

const ObservacoesBlock = ({ text }: { text: string }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) return <p className="text-sm text-slate-400 italic">Nenhuma observação registrada.</p>;
  const lines = text.split("\n").filter(Boolean);
  const preview = lines.slice(0, 4);
  const hasMore = lines.length > 4;
  const renderLines = (ls: string[]) =>
    ls.map((line, i) => {
      const colon = line.indexOf(":");
      if (colon > 0) return <div key={i} className="py-2.5 border-b border-slate-50 last:border-0"><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{line.slice(0, colon)}</p><p className="text-xs text-slate-700 leading-relaxed break-words">{line.slice(colon + 1).trim()}</p></div>;
      return <p key={i} className="text-xs text-slate-700 py-1">{line}</p>;
    });
  return (
    <div>
      {renderLines(expanded ? lines : preview)}
      {hasMore && <button onClick={() => setExpanded((v) => !v)} className="mt-3 flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-500 transition-colors">{expanded ? <><ChevronDown className="h-3.5 w-3.5" /> Mostrar menos</> : <><ChevronUp className="h-3.5 w-3.5" /> Ver mais {lines.length - 4} itens</>}</button>}
    </div>
  );
};

const Skeleton = () => (
  <div className="space-y-6 animate-pulse"><div className="h-6 bg-slate-100 rounded w-32" /><div className="h-8 bg-slate-100 rounded-xl w-3/4" /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl" />)}</div><div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2 space-y-6"><div className="h-64 bg-slate-100 rounded-2xl" /><div className="h-40 bg-slate-100 rounded-2xl" /></div><div className="space-y-6"><div className="h-48 bg-slate-100 rounded-2xl" /></div></div></div>
);

interface ContratoDetail {
  id: string; numero_contrato: string; numero_processo?: string; link_processo?: string; objeto?: string;
  orgao?: string; valor_global?: number; valor_final?: number;
  valor_reajustado?: number; recurso_federal?: number; recurso_estadual?: number;
  data_assinatura?: string; data_vigencia?: string;
  numero_licitacao?: string; fiscal_nome?: string; gestor_nome?: string;
  empresa_ref?: { id: string; razao_social: string; cnpj?: string };
  orgao_ref?: { sigla: string; nome?: string };
}

interface ObjetoDetail {
  id: string; titulo: string; descricao?: string; endereco?: string;
  municipio?: string; valor_contrato?: number;
  data_inicio?: string; data_fim_prevista?: string; data_ordem_servico?: string;
  status?: string; saude?: string; situacao?: string;
  percentual_executado?: number; raio_geofencing_metros?: number;
  contrato_id?: string; responsavel_id?: string; gestor_id?: string;
  orgao?: string; vigencia_fim?: string; execucao_fim?: string; ano_referencia?: string;
  valor_medido?: number; saldo_a_medir?: number;
  prazo_inicial_dias?: number;
  vigencia_inicio?: string; vigencia_dias?: number;
  execucao_inicio?: string; execucao_dias?: number;
  historico?: string; observacoes?: string; importante?: string;
  situacao_origem?: string;
  metas?: { id: string; descricao: string; valor: number }[];
  itens?: { id: string; descricao: string; unidade?: string; quantidade?: number; valor_unitario?: number; valor_total?: number }[];
}

const DetalheContrato = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const isApoioN1 = user?.tipo === "APOIO_N1";
  const podeEditarContrato = ["APOIO_N1", "APOIO_N2", "ENGENHEIRO", "COORDENADOR", "SECRETARIO"].includes(user?.tipo || "");
  const initialTab = (searchParams.get("tab") as "detalhes" | "diario" | "medicoes" | "art-rrt" | "eventos" | "cronograma" | "curva-s") || "detalhes";
  const [activeTab, setActiveTab] = useState<"detalhes" | "diario" | "medicoes" | "art-rrt" | "eventos" | "cronograma" | "curva-s">(initialTab);

  const handleTabChange = (tab: "detalhes" | "diario" | "medicoes" | "art-rrt" | "eventos" | "cronograma" | "curva-s") => {
    setActiveTab(tab);
    if (tab === "detalhes") {
      searchParams.delete("tab");
    } else {
      searchParams.set("tab", tab);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const [selectedObjetoId, setSelectedObjetoId] = useState<string | null>(searchParams.get("objeto"));

  const { data: contrato, isLoading: contratoLoading, error: contratoError } = useQuery<ContratoDetail>({
    queryKey: ["contrato", id],
    queryFn: async () => {
      const { data } = await api.get(`/contratos/${id}`);
      return data;
    },
    enabled: !!id,
  });

  // Contrato 1—N Objeto: lista dos objetos vinculados (para o seletor).
  const { data: objetos = [] } = useQuery<ObjetoDetail[]>({
    queryKey: ["contrato-objetos", id],
    queryFn: async () => {
      const { data } = await api.get(`/contratos/${id}/objetos`);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!id && !!contrato,
  });

  // Objeto em foco: o selecionado no seletor (ou o primeiro). Busca-se o detalhe
  // completo (metas, prazos, históricos, itens) só do objeto em foco.
  const activeObjetoId = selectedObjetoId ?? objetos[0]?.id ?? null;
  const { data: objeto } = useQuery<ObjetoDetail>({
    queryKey: ["objeto", activeObjetoId],
    queryFn: async () => {
      const { data } = await api.get(`/objetos/${activeObjetoId}`);
      return data;
    },
    enabled: !!activeObjetoId,
  });

  if (contratoLoading) return <Skeleton />;
  if (contratoError) return (
    <div className="flex flex-col items-center justify-center py-32 text-center"><AlertTriangle className="h-12 w-12 text-amber-400 mb-4" /><p className="text-lg font-semibold text-slate-700">Contrato não encontrado.</p><Link to="/contratos" className="mt-4 text-sm text-brand-700 hover:underline">← Voltar para contratos</Link></div>
  );
  if (!contrato) return null;

  const c = contrato;
  const variacao = c.valor_final && c.valor_global ? Number(c.valor_final) - Number(c.valor_global) : null;
  const variacaoPct = variacao && c.valor_global ? ((variacao / Number(c.valor_global)) * 100) : null;

  const objetoSaude = SAUDE_CONFIG[(objeto?.saude as SaudeObjeto) || "VERDE"];
  const objetoStatusCfg = STATUS_CONFIG[objeto?.status || ""] || STATUS_CONFIG.PLANEJADA;
  const ObjetoStatusIcon = objetoStatusCfg.icon;
  const objetoSitCfg = objeto?.situacao ? (SITUACAO_LABEL[objeto.situacao] || null) : null;
  const objetoPct = Number(objeto?.percentual_executado || 0);
  const objetoPrazoLabel = objeto?.vigencia_fim ? (() => {
    const today = new Date();
    const fim = new Date(objeto.vigencia_fim + "T00:00:00");
    const diff = Math.ceil((fim.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return { text: `${Math.abs(diff)}d vencido`, cls: "text-rose-600" };
    if (diff <= 30) return { text: `${diff}d restantes`, cls: "text-amber-600" };
    return { text: `${diff}d restantes`, cls: "text-slate-500" };
  })() : null;

  const visibleTabs: ("detalhes" | "cronograma" | "diario" | "medicoes" | "art-rrt" | "eventos" | "curva-s")[] = ["detalhes", "cronograma"];
  if (!isApoioN1) { visibleTabs.push("diario", "medicoes"); }
  visibleTabs.push("art-rrt", "eventos", "curva-s");
  const tabIcons: Record<string, LucideIcon> = { detalhes: FileText, cronograma: CalendarDays, diario: BookOpen, medicoes: ChartBar, "art-rrt": ShieldCheck, eventos: History, "curva-s": TrendingUp };
  const tabLabels: Record<string, string> = { detalhes: "Detalhes", cronograma: "Cronograma", diario: "Diário", medicoes: "Medições", "art-rrt": "ART/RRT", eventos: "Eventos", "curva-s": "Curva S" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link to="/contratos" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors"><ArrowLeft className="h-4 w-4" />Contratos</Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.open(`/contratos/${c.id}/relatorio`, "_blank", "noopener")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-all"
          >
            <Printer className="h-3.5 w-3.5" /> Imprimir
          </button>
          {objeto && podeEditarContrato && (
            <Link
              to={`/contratos/${c.id}/editar`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-700 rounded-lg shadow-sm shadow-brand-700/20 hover:bg-brand-500 transition-all"
            >
              <Pencil className="h-3.5 w-3.5" /> Editar contrato
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {c.orgao && <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-1 rounded-full"><Building2 className="h-3.5 w-3.5" />{c.orgao}</span>}
          {objeto && <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${objetoStatusCfg.cls}`}><ObjetoStatusIcon className="h-3.5 w-3.5" />{objetoStatusCfg.label}</span>}
          {objeto?.situacao && <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${objetoSitCfg?.cls || "bg-slate-100 text-slate-600 border-slate-200"}`}>{objetoSitCfg?.label || objeto.situacao}{objeto.ano_referencia ? ` / ${objeto.ano_referencia}` : ""}</span>}
          {objeto && <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className={`h-2 w-2 rounded-full ${objetoSaude.dot}`} />{objetoSaude.label}</span>}
        </div>
        <h1 className="text-xl font-bold text-slate-900">
          Contrato Nº {c.numero_contrato}
          {objeto?.titulo && <span className="text-slate-500 font-normal"> — {objeto.titulo}</span>}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
          {c.link_processo ? (
            <a href={c.link_processo} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-brand-700 hover:text-brand-500 hover:underline"><Hash className="h-4 w-4" />Processo SEI: {c.numero_processo || "—"}<ExternalLink className="h-3.5 w-3.5" /></a>
          ) : (
            <span className="flex items-center gap-1.5"><Hash className="h-4 w-4 text-slate-400" />Processo SEI: {c.numero_processo || "—"}</span>
          )}
          {c.empresa_ref?.razao_social && <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-slate-400" />{c.empresa_ref.razao_social}</span>}
          {objeto?.municipio && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-slate-400" />{objeto.municipio}</span>}
        </div>
        {c.objeto && <p className="text-sm text-slate-600 leading-relaxed mt-1 line-clamp-2">{c.objeto}</p>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Valor Inicial" value={fmtCurrency(c.valor_global)} color="slate" />
        <KPI label="Valor Final" value={fmtCurrency(c.valor_final ?? c.valor_global)} color={variacao && variacao > 0 ? "amber" : "slate"} note={variacaoPct != null && variacao != null && variacao !== 0 ? `${variacao > 0 ? "+" : ""}${variacaoPct.toFixed(1)}% vs. inicial` : null} />
        <KPI label="Valor Medido" value={fmtCurrency(objeto?.valor_medido, "Não informado")} color="emerald" />
        <KPI label="Saldo a Medir" value={fmtCurrency(objeto?.saldo_a_medir, "Não informado")} color="sky" />
      </div>

      {objeto && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4">
          <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-slate-700">Progresso de execução</span><span className="text-lg font-bold text-slate-900">{fmtPercent(objeto.percentual_executado)}</span></div>
          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden"><div className={`h-3 rounded-full transition-all duration-700 ${objetoSaude.bar}`} style={{ width: `${Math.min(objetoPct, 100)}%` }} /></div>
          {objetoPrazoLabel && <p className={`text-xs mt-2 font-medium ${objetoPrazoLabel.cls}`}>{objetoPrazoLabel.text}</p>}
        </div>
      )}

      {objeto && (
        <div className="flex border-b border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden">
          {visibleTabs.map((tab) => {
            const TabIcon = tabIcons[tab];
            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                  activeTab === tab ? "text-brand-700 border-brand-600 bg-brand-50/50" : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <TabIcon className="h-4 w-4" />{tabLabels[tab]}
              </button>
            );
          })}
        </div>
      )}

      {activeTab === "detalhes" && (
      <><div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Dados do Contrato" icon={FileText}><Row label="Nº do Contrato" value={c.numero_contrato} mono highlight /><Row label="Nº do Processo" value={c.numero_processo} mono href={c.link_processo} />{c.numero_licitacao && <Row label="Nº da Licitação" value={c.numero_licitacao} mono />}<Row label="Data de Assinatura" value={fmtDate(c.data_assinatura ?? null)} /><Row label="Vigência Contratual" value={fmtDate(c.data_vigencia ?? null)} /></Section>

          <Section title="Empresa Executora" icon={Briefcase}>
            {c.empresa_ref ? <>
              <div className="flex items-center justify-between py-2.5 border-b border-slate-50">
                <span className="text-xs font-medium text-slate-400 sm:w-44 shrink-0">Razão Social</span>
                <Link to={`/empresas/${c.empresa_ref.id}`} className="text-sm font-semibold text-sky-700 hover:text-sky-500 transition-colors flex items-center gap-1.5">
                  {c.empresa_ref.razao_social}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
              {c.empresa_ref.cnpj && <Row label="CNPJ" value={c.empresa_ref.cnpj} mono />}
            </> : <p className="text-sm text-slate-400 italic">Empresa não vinculada ao sistema.</p>}
          </Section>

          <Section title="Responsáveis" icon={User}><Row label="Fiscal" value={c.fiscal_nome} /><Row label="Gestor" value={c.gestor_nome} />{c.orgao_ref && <Row label="Órgão demandante" value={`${c.orgao_ref.sigla}${c.orgao_ref.nome ? ` — ${c.orgao_ref.nome}` : ""}`} />}</Section>

          <Section title="Financeiro" icon={TrendingUp}><Row label="Valor Inicial (global)" value={fmtCurrency(c.valor_global)} />{c.valor_reajustado && <Row label="Valor reajustado" value={fmtCurrency(c.valor_reajustado)} />}<Row label="Valor Final" value={fmtCurrency(c.valor_final ?? c.valor_global)} highlight />{c.recurso_federal && <Row label="Recurso Federal" value={fmtCurrency(c.recurso_federal)} />}{c.recurso_estadual && <Row label="Recurso Estadual" value={fmtCurrency(c.recurso_estadual)} />}<div className="mt-4 pt-4 border-t border-slate-100"><div className="flex justify-between text-xs text-slate-500 mb-1.5"><span>Valor inicial</span><span className={((c.valor_final || 0) > (c.valor_global || 1)) ? "font-semibold text-amber-600" : "font-semibold text-slate-700"}>{c.valor_global ? (((c.valor_final || 0) / c.valor_global) * 100).toFixed(1) : "—"}% do inicial</span></div><div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden"><div className={`h-2 rounded-full ${((c.valor_final || 0) > (c.valor_global || 1)) ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${Math.min(((c.valor_final || 0) / (c.valor_global || 1)) * 100, 100)}%` }} /></div></div></Section>

          {c.objeto && <Section title="Objeto do Contrato" icon={FileText}><p className="text-sm text-slate-700 leading-relaxed">{c.objeto}</p></Section>}

          {objeto && (
            <>
              <Section title="Prazos do Objeto" icon={Calendar}>
                {objeto.prazo_inicial_dias && <div className="py-2.5 border-b border-slate-50"><Row label="Prazo inicial" value={`${objeto.prazo_inicial_dias} dias`} /></div>}
                <PrazoRow label="Vigência" inicio={objeto.vigencia_inicio} dias={objeto.vigencia_dias} fim={objeto.vigencia_fim || undefined} />
                <PrazoRow label="Execução" inicio={objeto.execucao_inicio} dias={objeto.execucao_dias} fim={objeto.execucao_fim || undefined} />
              </Section>

              {objeto.historico && <Section title="Histórico do Objeto" icon={FileText}><p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{objeto.historico}</p></Section>}
              {objeto.observacoes && <Section title="Informações complementares" icon={FileText}><ObservacoesBlock text={objeto.observacoes} /></Section>}
            </>
          )}
        </div>

        <div className="space-y-6">
          <Section title="Prazos Contratuais" icon={Calendar}>
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-xl p-4 text-center"><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Assinatura</p><p className="text-base font-bold text-slate-800">{fmtDate(c.data_assinatura ?? null)}</p></div>
              <div className="bg-slate-50 rounded-xl p-4 text-center"><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Vigência</p><p className="text-base font-bold text-slate-800">{fmtDate(c.data_vigencia ?? null)}</p>{c.data_vigencia && (() => { const diff = Math.ceil((new Date(c.data_vigencia + "T00:00:00").getTime() - Date.now()) / 86400000); if (diff < 0) return <p className="text-xs font-medium text-rose-600 mt-1">{Math.abs(diff)}d vencido</p>; if (diff <= 60) return <p className="text-xs font-medium text-amber-600 mt-1">{diff}d restantes</p>; return <p className="text-xs text-slate-400 mt-1">{diff}d restantes</p>; })()}</div>
            </div>
          </Section>

          {objeto && (
            <Section title="Situação do Objeto">
              <div className="space-y-3">
                <div><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Status operacional</p><span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border ${objetoStatusCfg.cls}`}><ObjetoStatusIcon className="h-3.5 w-3.5" />{objetoStatusCfg.label}</span></div>
                {objeto.situacao && <div><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Situação (planilha oficial)</p><span className={`inline-flex text-xs font-semibold px-2.5 py-1.5 rounded-xl border ${objetoSitCfg?.cls || "bg-slate-100 text-slate-600 border-slate-200"}`}>{objetoSitCfg?.label || objeto.situacao}{objeto.ano_referencia ? ` / ${objeto.ano_referencia}` : ""}</span>{objeto.situacao_origem && <p className="text-xs text-slate-400 mt-1.5 italic">&quot;{objeto.situacao_origem}&quot;</p>}</div>}
                <div><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Saúde</p><span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600"><span className={`h-2.5 w-2.5 rounded-full ${objetoSaude.dot}`} />{objetoSaude.label}</span></div>
              </div>
            </Section>
          )}

          {objeto?.importante && <Section title="Importante" icon={AlertTriangle}><p className="text-sm text-amber-700 bg-amber-50 rounded-xl p-3 leading-relaxed">{objeto.importante}</p></Section>}

          {objeto?.metas && objeto.metas.length > 0 && (
            <Section title={`Metas (${objeto.metas.length})`} icon={CheckCircle2}>
              <div className="space-y-2">{objeto.metas.map((meta) => <div key={meta.id} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-700 mb-1">{meta.descricao}</p><p className="text-xs text-slate-500">{fmtCurrency(meta.valor)}</p></div>)}</div>
            </Section>
          )}

          {objeto?.itens && objeto.itens.length > 0 && (
            <Section title={`Itens do objeto (${objeto.itens.length})`} icon={Boxes}>
              <div className="space-y-2">{objeto.itens.map((item) => (
                <div key={item.id} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-700 mb-1">{item.descricao}</p>
                  <p className="text-xs text-slate-500">
                    {(item.quantidade ?? 0)} {item.unidade || "un"} × {fmtCurrency(item.valor_unitario)}
                    <span className="font-semibold text-slate-700"> = {fmtCurrency(item.valor_total)}</span>
                  </p>
                </div>
              ))}</div>
            </Section>
          )}
        </div>
      </div>
      </>)}

      {activeTab === "cronograma" && objeto && <CronogramaContent objetoId={objeto.id} />}
      {activeTab === "diario" && objeto && <DiarioContent objetoId={objeto.id} />}
      {activeTab === "medicoes" && objeto && <MedicoesContent objetoId={objeto.id} />}
      {activeTab === "art-rrt" && objeto && <ArtRrtContent objetoId={objeto.id} />}
      {activeTab === "eventos" && objeto && <EventosContratuaisContent objetoId={objeto.id} />}
      {activeTab === "curva-s" && objeto && <CurvaSContent objetoId={objeto.id} />}
    </div>
  );
};

export default DetalheContrato;
