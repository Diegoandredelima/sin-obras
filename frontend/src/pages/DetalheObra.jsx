import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Building2, Calendar, TrendingUp, User,
  Briefcase, FileText, Clock, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Activity, Pause,
} from 'lucide-react';
import api from '../services/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmt = (v, fallback = '—') =>
  v != null ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : fallback;

const fmtDate = (d) =>
  d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—';

const fmtPct = (v) =>
  v != null ? `${Number(v).toFixed(1)}%` : '—';

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

const STATUS_CONFIG = {
  PLANEJADA:   { label: 'Planejada',   icon: Clock,          cls: 'text-slate-600 bg-slate-50 border-slate-200' },
  EM_EXECUCAO: { label: 'Em Execução', icon: Activity,       cls: 'text-sky-700 bg-sky-50 border-sky-200' },
  PARALISADA:  { label: 'Paralisada',  icon: Pause,          cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  CONCLUIDA:   { label: 'Concluída',   icon: CheckCircle2,   cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
};

const SAUDE_CONFIG = {
  VERDE:    { dot: 'bg-emerald-400', label: 'Em dia',   bar: 'bg-emerald-400' },
  AMARELO:  { dot: 'bg-amber-400',  label: 'Atenção',  bar: 'bg-amber-400' },
  VERMELHO: { dot: 'bg-rose-400',   label: 'Crítico',  bar: 'bg-rose-400' },
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

const Row = ({ label, value, mono = false }) => (
  <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3 py-2.5 border-b border-slate-50 last:border-0">
    <span className="text-xs font-medium text-slate-400 sm:w-44 shrink-0">{label}</span>
    <span className={`text-sm text-slate-800 ${mono ? 'font-mono' : ''} break-words`}>
      {value || '—'}
    </span>
  </div>
);

const KPI = ({ label, value, sub, color = 'slate' }) => {
  const colors = {
    slate:   'text-slate-900',
    emerald: 'text-emerald-700',
    sky:     'text-sky-700',
    amber:   'text-amber-700',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <span className={`text-xl font-bold ${colors[color]} leading-tight`}>{value}</span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
    </div>
  );
};

const PrazoRow = ({ label, inicio, dias, fim }) => (
  <div className="py-3 border-b border-slate-50 last:border-0">
    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">{label}</p>
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="bg-slate-50 rounded-xl p-3">
        <p className="text-[10px] text-slate-400 mb-0.5">Início</p>
        <p className="text-sm font-semibold text-slate-800">{fmtDate(inicio)}</p>
      </div>
      <div className="bg-slate-50 rounded-xl p-3">
        <p className="text-[10px] text-slate-400 mb-0.5">Dias</p>
        <p className="text-sm font-semibold text-slate-800">{dias ?? '—'}</p>
      </div>
      <div className="bg-slate-50 rounded-xl p-3">
        <p className="text-[10px] text-slate-400 mb-0.5">Fim</p>
        <p className="text-sm font-semibold text-slate-800">{fmtDate(fim)}</p>
      </div>
    </div>
  </div>
);

const ObservacoesBlock = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) return <p className="text-sm text-slate-400 italic">Nenhuma observação registrada.</p>;

  const lines = text.split('\n').filter(Boolean);
  const preview = lines.slice(0, 4);
  const hasMore = lines.length > 4;

  const renderLines = (ls) =>
    ls.map((line, i) => {
      const colon = line.indexOf(':');
      if (colon > 0) {
        const label = line.slice(0, colon);
        const val = line.slice(colon + 1).trim();
        return (
          <div key={i} className="py-2.5 border-b border-slate-50 last:border-0">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
            <p className="text-xs text-slate-700 leading-relaxed break-words">{val}</p>
          </div>
        );
      }
      return <p key={i} className="text-xs text-slate-700 py-1">{line}</p>;
    });

  return (
    <div>
      {renderLines(expanded ? lines : preview)}
      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
        >
          {expanded ? (
            <><ChevronUp className="h-3.5 w-3.5" /> Mostrar menos</>
          ) : (
            <><ChevronDown className="h-3.5 w-3.5" /> Ver mais {lines.length - 4} itens</>
          )}
        </button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Page skeleton
// ---------------------------------------------------------------------------
const Skeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-slate-100 rounded-xl w-2/3" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="h-64 bg-slate-100 rounded-2xl" />
        <div className="h-48 bg-slate-100 rounded-2xl" />
      </div>
      <div className="space-y-6">
        <div className="h-48 bg-slate-100 rounded-2xl" />
        <div className="h-32 bg-slate-100 rounded-2xl" />
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const DetalheObra = () => {
  const { id } = useParams();
  const [obra, setObra] = useState(null);
  const [contrato, setContrato] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/obras/${id}`)
      .then((r) => {
        setObra(r.data);
        if (r.data.contrato_id) {
          return api.get(`/contratos/${r.data.contrato_id}`);
        }
        return null;
      })
      .then((r) => { if (r) setContrato(r.data); })
      .catch(() => setError('Obra não encontrada.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton />;
  if (error) return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <AlertTriangle className="h-12 w-12 text-amber-400 mb-4" />
      <p className="text-lg font-semibold text-slate-700">{error}</p>
      <Link to="/obras" className="mt-4 text-sm text-emerald-600 hover:underline">← Voltar para obras</Link>
    </div>
  );

  const saude = SAUDE_CONFIG[obra.saude] || SAUDE_CONFIG.VERDE;
  const statusCfg = STATUS_CONFIG[obra.status] || STATUS_CONFIG.PLANEJADA;
  const StatusIcon = statusCfg.icon;
  const situacaoCfg = obra.situacao ? (SITUACAO_LABEL[obra.situacao] || {}) : {};

  const pct = Number(obra.percentual_executado || 0);
  const prazoLabel = obra.vigencia_fim
    ? (() => {
        const today = new Date();
        const fim = new Date(obra.vigencia_fim + 'T00:00:00');
        const diff = Math.ceil((fim - today) / 86400000);
        if (diff < 0) return { text: `${Math.abs(diff)}d vencido`, cls: 'text-rose-600' };
        if (diff <= 30) return { text: `${diff}d restantes`, cls: 'text-amber-600' };
        return { text: `${diff}d restantes`, cls: 'text-slate-500' };
      })()
    : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        to="/obras"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Obras
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusCfg.cls}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            {statusCfg.label}
          </span>
          {obra.situacao && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${situacaoCfg.cls || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              {situacaoCfg.label || obra.situacao}
              {obra.ano_referencia ? ` / ${obra.ano_referencia}` : ''}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className={`h-2 w-2 rounded-full ${saude.dot}`} />
            {saude.label}
          </span>
        </div>

        <h1 className="text-xl font-bold text-slate-900 leading-snug">
          {obra.titulo}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
          {obra.municipio && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-slate-400" />
              {obra.municipio}
            </span>
          )}
          {obra.orgao && (
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-slate-400" />
              {obra.orgao}
            </span>
          )}
          {contrato && (
            <span className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-slate-400" />
              Contrato {contrato.numero_contrato}
            </span>
          )}
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Progresso de execução</span>
          <span className="text-lg font-bold text-slate-900">{fmtPct(obra.percentual_executado)}</span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${saude.bar}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        {prazoLabel && (
          <p className={`text-xs mt-2 font-medium ${prazoLabel.cls}`}>{prazoLabel.text}</p>
        )}
      </div>

      {/* KPIs financeiros */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          label="Valor Inicial"
          value={fmt(contrato?.valor_global ?? obra.valor_contrato)}
          color="slate"
        />
        <KPI
          label="Valor Final"
          value={fmt(contrato?.valor_final ?? obra.valor_contrato)}
          sub={contrato?.valor_aditivo ? `+ ${fmt(contrato.valor_aditivo)} aditivo` : null}
          color={contrato?.valor_final > contrato?.valor_global ? 'amber' : 'slate'}
        />
        <KPI
          label="Valor Medido"
          value={fmt(obra.valor_medido, 'Não informado')}
          color="emerald"
        />
        <KPI
          label="Saldo a Medir"
          value={fmt(obra.saldo_a_medir, 'Não informado')}
          color="sky"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Coluna esquerda (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Contrato */}
          {contrato && (
            <Section title="Contrato" icon={Briefcase}>
              <Row label="Nº do Contrato"   value={contrato.numero_contrato} mono />
              <Row label="Nº do Processo"   value={contrato.numero_processo} mono />
              <Row label="Empresa Executora" value={contrato.empresa_ref?.razao_social} />
              <Row label="Órgão Demandante" value={
                contrato.orgao_ref
                  ? `${contrato.orgao_ref.sigla} — ${contrato.orgao_ref.nome || ''}`
                  : contrato.orgao
              } />
              <Row label="Fiscal"           value={contrato.fiscal_nome} />
              <Row label="Gestor"           value={contrato.gestor_nome} />
              {contrato.tipo_licitacao && (
                <Row label="Tipo de Licitação" value={contrato.tipo_licitacao} />
              )}
              {contrato.data_assinatura && (
                <Row label="Data de Assinatura" value={fmtDate(contrato.data_assinatura)} />
              )}
              {contrato.data_vigencia && (
                <Row label="Vigência Contratual" value={fmtDate(contrato.data_vigencia)} />
              )}
            </Section>
          )}

          {/* Prazos */}
          <Section title="Prazos" icon={Calendar}>
            {obra.prazo_inicial_dias && (
              <div className="py-2.5 border-b border-slate-50">
                <Row label="Prazo inicial" value={`${obra.prazo_inicial_dias} dias`} />
              </div>
            )}
            <PrazoRow
              label="Vigência"
              inicio={obra.vigencia_inicio}
              dias={obra.vigencia_dias}
              fim={obra.vigencia_fim}
            />
            <PrazoRow
              label="Execução"
              inicio={obra.execucao_inicio}
              dias={obra.execucao_dias}
              fim={obra.execucao_fim}
            />
          </Section>

          {/* Financeiro detalhado */}
          {contrato && (contrato.valor_aditivo || contrato.valor_reajustado || contrato.recurso_federal || contrato.recurso_estadual) && (
            <Section title="Financeiro detalhado" icon={TrendingUp}>
              <Row label="Valor Inicial (contrato)" value={fmt(contrato.valor_global)} />
              {contrato.valor_aditivo     && <Row label="Aditivo de valor"   value={fmt(contrato.valor_aditivo)} />}
              {contrato.valor_reajustado  && <Row label="Valor reajustado"   value={fmt(contrato.valor_reajustado)} />}
              <Row label="Valor Final"              value={fmt(contrato.valor_final)} />
              {obra.valor_medido          && <Row label="Valor medido"       value={fmt(obra.valor_medido)} />}
              {obra.saldo_a_medir         && <Row label="Saldo a medir"      value={fmt(obra.saldo_a_medir)} />}
              {contrato.recurso_federal   && <Row label="Recurso Federal"    value={fmt(contrato.recurso_federal)} />}
              {contrato.recurso_estadual  && <Row label="Recurso Estadual"   value={fmt(contrato.recurso_estadual)} />}
            </Section>
          )}

          {/* Histórico */}
          {obra.historico && (
            <Section title="Histórico" icon={FileText}>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{obra.historico}</p>
            </Section>
          )}

          {/* Observações (textos brutos preservados) */}
          {obra.observacoes && (
            <Section title="Informações complementares" icon={FileText}>
              <ObservacoesBlock text={obra.observacoes} />
            </Section>
          )}
        </div>

        {/* Coluna direita (1/3) */}
        <div className="space-y-6">

          {/* Situação oficial */}
          <Section title="Situação oficial">
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Status operacional</p>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border ${statusCfg.cls}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {statusCfg.label}
                </span>
              </div>
              {obra.situacao && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Situação (planilha oficial)</p>
                  <span className={`inline-flex text-xs font-semibold px-2.5 py-1.5 rounded-xl border ${situacaoCfg.cls || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {situacaoCfg.label || obra.situacao}
                    {obra.ano_referencia ? ` / ${obra.ano_referencia}` : ''}
                  </span>
                  {obra.situacao_origem && (
                    <p className="text-xs text-slate-400 mt-1.5 italic">"{obra.situacao_origem}"</p>
                  )}
                </div>
              )}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Saúde</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  <span className={`h-2.5 w-2.5 rounded-full ${saude.dot}`} />
                  {saude.label}
                </span>
              </div>
            </div>
          </Section>

          {/* Importante */}
          {obra.importante && (
            <Section title="Importante" icon={AlertTriangle}>
              <p className="text-sm text-amber-700 bg-amber-50 rounded-xl p-3 leading-relaxed">
                {obra.importante}
              </p>
            </Section>
          )}

          {/* Ações */}
          <Section title="Ações">
            <div className="space-y-2">
              <Link
                to={`/empresa/obras/${obra.id}/diario`}
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700 transition-all"
              >
                Diário de Obras
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
              <Link
                to={`/empresa/obras/${obra.id}/medicoes`}
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700 transition-all"
              >
                Medições
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </div>
          </Section>

          {/* Metas / Cronograma */}
          {obra.metas && obra.metas.length > 0 && (
            <Section title={`Metas (${obra.metas.length})`} icon={CheckCircle2}>
              <div className="space-y-2">
                {obra.metas.map((meta) => (
                  <div key={meta.id} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-700 mb-1">{meta.descricao}</p>
                    <p className="text-xs text-slate-500">{fmt(meta.valor)}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalheObra;
