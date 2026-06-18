import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Briefcase, Building2, User, MapPin,
  TrendingUp, Calendar, FileText, Hash, AlertTriangle,
  ExternalLink, Activity, CheckCircle2, Pause, Clock,
} from 'lucide-react';
import api from '../services/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmt = (v, fallback = '—') =>
  v != null
    ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : fallback;

const fmtDate = (d) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—';

const STATUS_CONFIG = {
  PLANEJADA:   { label: 'Planejada',   icon: Clock,        cls: 'text-slate-600 bg-slate-50 border-slate-200' },
  EM_EXECUCAO: { label: 'Em Execução', icon: Activity,     cls: 'text-sky-700 bg-sky-50 border-sky-200' },
  PARALISADA:  { label: 'Paralisada',  icon: Pause,        cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  CONCLUIDA:   { label: 'Concluída',   icon: CheckCircle2, cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
};

const SITUACAO_LABEL = {
  A_INICIAR:    { label: 'A Iniciar',    cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  EM_ANDAMENTO: { label: 'Em Andamento', cls: 'bg-sky-100 text-sky-700 border-sky-200' },
  PARALISADA:   { label: 'Paralisada',   cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  INACABADA:    { label: 'Inacabada',    cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  CONCLUIDA:    { label: 'Concluída',    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  RESCINDIDA:   { label: 'Rescindida',   cls: 'bg-rose-100 text-rose-700 border-rose-200' },
  ARQUIVADA:    { label: 'Arquivada',    cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  EXTINTA:      { label: 'Extinta',      cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  CEDIDA:       { label: 'Cedida',       cls: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const SAUDE_CONFIG = {
  VERDE:    { dot: 'bg-emerald-400', bar: 'bg-emerald-400', label: 'Em dia' },
  AMARELO:  { dot: 'bg-amber-400',   bar: 'bg-amber-400',   label: 'Atenção' },
  VERMELHO: { dot: 'bg-rose-400',    bar: 'bg-rose-400',    label: 'Crítico' },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const Section = ({ title, icon: Icon, children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}>
    <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100">
      {Icon && <Icon className="h-4 w-4 text-slate-400 shrink-0" />}
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const Row = ({ label, value, mono = false, highlight = false }) => (
  <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3 py-2.5 border-b border-slate-50 last:border-0">
    <span className="text-xs font-medium text-slate-400 sm:w-44 shrink-0">{label}</span>
    <span className={`text-sm break-words ${mono ? 'font-mono' : ''} ${highlight ? 'font-semibold text-slate-900' : 'text-slate-800'}`}>
      {value || '—'}
    </span>
  </div>
);

const KPI = ({ label, value, sub, color = 'slate', note }) => {
  const colors = {
    slate:   'text-slate-900',
    emerald: 'text-emerald-700',
    sky:     'text-sky-700',
    amber:   'text-amber-700',
    rose:    'text-rose-700',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <span className={`text-xl font-bold leading-tight ${colors[color]}`}>{value}</span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
      {note && <span className="text-xs font-medium text-amber-600 mt-1">{note}</span>}
    </div>
  );
};

// Barra de evolução financeira: inicial → final
const FinanceBar = ({ inicial, final }) => {
  if (!inicial || !final) return null;
  const pct = Math.min((Number(final) / Number(inicial)) * 100, 200);
  const over = pct > 100;
  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
        <span>Valor inicial</span>
        <span className={over ? 'font-semibold text-amber-600' : 'font-semibold text-slate-700'}>
          {over ? `+${(pct - 100).toFixed(1)}% acima do inicial` : `${pct.toFixed(1)}% do inicial`}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-2 rounded-full ${over ? 'bg-amber-400' : 'bg-emerald-400'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
};

// Card da obra vinculada
const ObraCard = ({ obra }) => {
  const saude = SAUDE_CONFIG[obra.saude] || SAUDE_CONFIG.VERDE;
  const statusCfg = STATUS_CONFIG[obra.status] || STATUS_CONFIG.PLANEJADA;
  const SIcon = statusCfg.icon;
  const sitCfg = obra.situacao ? (SITUACAO_LABEL[obra.situacao] || {}) : null;
  const pct = Number(obra.percentual_executado || 0);
  const prazo = obra.vigencia_fim || obra.execucao_fim || obra.data_fim_prevista;

  return (
    <Link
      to={`/obras/${obra.id}`}
      className="group block bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-xl p-4 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`h-2 w-2 rounded-full shrink-0 ${saude.dot}`} />
            <span className="text-[10px] font-medium text-slate-400">{saude.label}</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
            {obra.titulo}
          </p>
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-500 shrink-0 mt-0.5 transition-colors" />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${statusCfg.cls}`}>
          <SIcon className="h-3 w-3" />
          {statusCfg.label}
        </span>
        {sitCfg && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${sitCfg.cls || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            {sitCfg.label || obra.situacao}
            {obra.ano_referencia ? ` / ${obra.ano_referencia}` : ''}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-3">
        {obra.municipio && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {obra.municipio}
          </span>
        )}
        {prazo && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Prazo: {fmtDate(prazo)}
          </span>
        )}
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <span className="text-xs text-slate-500">Progresso</span>
          <span className="text-xs font-semibold text-slate-700">{pct.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all ${saude.bar}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>
    </Link>
  );
};

// Skeleton
const Skeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-6 bg-slate-100 rounded w-32" />
    <div className="h-8 bg-slate-100 rounded-xl w-3/4" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="h-64 bg-slate-100 rounded-2xl" />
        <div className="h-40 bg-slate-100 rounded-2xl" />
      </div>
      <div className="space-y-6">
        <div className="h-48 bg-slate-100 rounded-2xl" />
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const DetalheContrato = () => {
  const { id } = useParams();
  const [contrato, setContrato] = useState(null);
  const [obra, setObra] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/contratos/${id}`)
      .then((r) => {
        setContrato(r.data);
        // Busca obra vinculada pelo contrato_id
        return api.get('/obras', { params: { contrato_id: id, limit: 1 } });
      })
      .then((r) => { if (r.data.length > 0) setObra(r.data[0]); })
      .catch(() => setError('Contrato não encontrado.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton />;
  if (error) return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <AlertTriangle className="h-12 w-12 text-amber-400 mb-4" />
      <p className="text-lg font-semibold text-slate-700">{error}</p>
      <Link to="/contratos" className="mt-4 text-sm text-emerald-600 hover:underline">← Voltar para contratos</Link>
    </div>
  );

  const c = contrato;
  const variacao = c.valor_final && c.valor_global
    ? Number(c.valor_final) - Number(c.valor_global)
    : null;
  const variacaoPct = variacao && c.valor_global
    ? ((variacao / Number(c.valor_global)) * 100)
    : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        to="/contratos"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Contratos
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {c.orgao && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-1 rounded-full">
              <Building2 className="h-3.5 w-3.5" />
              {c.orgao}
            </span>
          )}
          {c.tipo_licitacao && (
            <span className="text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full truncate max-w-xs">
              {c.tipo_licitacao}
            </span>
          )}
        </div>

        <h1 className="text-xl font-bold text-slate-900">
          Contrato Nº {c.numero_contrato}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <Hash className="h-4 w-4 text-slate-400" />
            Processo: {c.numero_processo || '—'}
          </span>
          {c.empresa_ref?.razao_social && (
            <span className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-slate-400" />
              {c.empresa_ref.razao_social}
            </span>
          )}
        </div>

        {c.objeto && (
          <p className="text-sm text-slate-600 leading-relaxed mt-1 line-clamp-3">
            {c.objeto}
          </p>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Valor Inicial"    value={fmt(c.valor_global)}  color="slate" />
        <KPI
          label="Valor Final"
          value={fmt(c.valor_final ?? c.valor_global)}
          color={variacao > 0 ? 'amber' : 'slate'}
          note={variacaoPct != null && variacao !== 0
            ? `${variacao > 0 ? '+' : ''}${variacaoPct.toFixed(1)}% vs. inicial`
            : null}
        />
        <KPI
          label="Recurso Federal"
          value={fmt(c.recurso_federal, 'Não informado')}
          color={c.recurso_federal ? 'sky' : 'slate'}
        />
        <KPI
          label="Recurso Estadual"
          value={fmt(c.recurso_estadual, 'Não informado')}
          color={c.recurso_estadual ? 'sky' : 'slate'}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Coluna principal (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Dados do contrato */}
          <Section title="Dados do Contrato" icon={FileText}>
            <Row label="Nº do Contrato"    value={c.numero_contrato} mono highlight />
            <Row label="Nº do Processo"    value={c.numero_processo} mono />
            {c.matricula_cei      && <Row label="Matrícula CEI"   value={c.matricula_cei} mono />}
            {c.numero_licitacao   && <Row label="Nº da Licitação" value={c.numero_licitacao} mono />}
            <Row label="Data de Assinatura" value={fmtDate(c.data_assinatura)} />
            <Row label="Vigência"           value={fmtDate(c.data_vigencia)} />
          </Section>

          {/* Empresa */}
          <Section title="Empresa Executora" icon={Briefcase}>
            {c.empresa_ref ? (
              <>
                <Row label="Razão Social" value={c.empresa_ref.razao_social} highlight />
                {c.empresa_ref.cnpj && <Row label="CNPJ" value={c.empresa_ref.cnpj} mono />}
              </>
            ) : (
              <p className="text-sm text-slate-400 italic">Empresa não vinculada ao sistema.</p>
            )}
          </Section>

          {/* Responsáveis */}
          <Section title="Responsáveis" icon={User}>
            <Row label="Fiscal"  value={c.fiscal_nome} />
            <Row label="Gestor"  value={c.gestor_nome} />
            {c.orgao_ref && (
              <Row
                label="Órgão demandante"
                value={`${c.orgao_ref.sigla}${c.orgao_ref.nome ? ` — ${c.orgao_ref.nome}` : ''}`}
              />
            )}
          </Section>

          {/* Financeiro */}
          <Section title="Financeiro" icon={TrendingUp}>
            <Row label="Valor Inicial (global)"  value={fmt(c.valor_global)} />
            {c.valor_aditivo    && <Row label="Aditivo de valor"   value={fmt(c.valor_aditivo)} />}
            {c.valor_reajustado && <Row label="Valor reajustado"   value={fmt(c.valor_reajustado)} />}
            <Row label="Valor Final"              value={fmt(c.valor_final ?? c.valor_global)} highlight />
            {c.recurso_federal  && <Row label="Recurso Federal"    value={fmt(c.recurso_federal)} />}
            {c.recurso_estadual && <Row label="Recurso Estadual"   value={fmt(c.recurso_estadual)} />}
            <FinanceBar inicial={c.valor_global} final={c.valor_final} />
          </Section>

          {/* Objeto */}
          {c.objeto && (
            <Section title="Objeto do Contrato" icon={FileText}>
              <p className="text-sm text-slate-700 leading-relaxed">{c.objeto}</p>
            </Section>
          )}
        </div>

        {/* Coluna lateral (1/3) */}
        <div className="space-y-6">

          {/* Datas / prazos rápidos */}
          <Section title="Prazos" icon={Calendar}>
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Assinatura</p>
                <p className="text-base font-bold text-slate-800">{fmtDate(c.data_assinatura)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Vigência</p>
                <p className="text-base font-bold text-slate-800">{fmtDate(c.data_vigencia)}</p>
                {c.data_vigencia && (() => {
                  const diff = Math.ceil((new Date(c.data_vigencia + 'T00:00:00') - new Date()) / 86400000);
                  if (diff < 0) return <p className="text-xs font-medium text-rose-600 mt-1">{Math.abs(diff)}d vencido</p>;
                  if (diff <= 60) return <p className="text-xs font-medium text-amber-600 mt-1">{diff}d restantes</p>;
                  return <p className="text-xs text-slate-400 mt-1">{diff}d restantes</p>;
                })()}
              </div>
            </div>
          </Section>

          {/* Obra vinculada */}
          <Section title="Obra vinculada" icon={Building2}>
            {obra ? (
              <ObraCard obra={obra} />
            ) : (
              <p className="text-sm text-slate-400 italic">Nenhuma obra vinculada encontrada.</p>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
};

export default DetalheContrato;
