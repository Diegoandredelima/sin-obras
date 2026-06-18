import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Building2, ArrowRight,
  MapPin, Calendar, TrendingUp,
} from 'lucide-react';
import api from '../services/api';

const STATUS_LABELS = {
  PLANEJADA:   { label: 'Planejada',   cls: 'bg-slate-100 text-slate-600' },
  EM_EXECUCAO: { label: 'Em Execução', cls: 'bg-sky-100 text-sky-700' },
  PARALISADA:  { label: 'Paralisada',  cls: 'bg-amber-100 text-amber-700' },
  CONCLUIDA:   { label: 'Concluída',   cls: 'bg-emerald-100 text-emerald-700' },
};

const SITUACAO_LABELS = {
  A_INICIAR:   'A Iniciar',
  EM_ANDAMENTO:'Em Andamento',
  PARALISADA:  'Paralisada',
  INACABADA:   'Inacabada',
  CONCLUIDA:   'Concluída',
  RESCINDIDA:  'Rescindida',
  ARQUIVADA:   'Arquivada',
  EXTINTA:     'Extinta',
  CEDIDA:      'Cedida',
};

const SAUDE_CONFIG = {
  VERDE:    { dot: 'bg-emerald-400', bar: 'bg-emerald-400', label: 'Em dia' },
  AMARELO:  { dot: 'bg-amber-400',   bar: 'bg-amber-400',   label: 'Atenção' },
  VERMELHO: { dot: 'bg-rose-400',    bar: 'bg-rose-400',    label: 'Crítico' },
};

const ObraCard = ({ obra }) => {
  const saude = SAUDE_CONFIG[obra.saude] || SAUDE_CONFIG.VERDE;
  const statusLabel = STATUS_LABELS[obra.status] || STATUS_LABELS.PLANEJADA;
  const prazo = obra.vigencia_fim || obra.execucao_fim || obra.data_fim_prevista;

  return (
    <Link
      to={`/obras/${obra.id}`}
      className="group bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-200 flex flex-col gap-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`h-2 w-2 rounded-full shrink-0 ${saude.dot}`} />
            <span className="text-xs font-medium text-slate-400">{saude.label}</span>
          </div>
          <h3 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 leading-snug transition-colors line-clamp-2">
            {obra.titulo}
          </h3>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusLabel.cls}`}>
          {statusLabel.label}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 text-xs text-slate-500">
        {obra.municipio && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{obra.municipio}</span>
          </div>
        )}
        {prazo && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>Prazo: {new Date(prazo).toLocaleDateString('pt-BR')}</span>
          </div>
        )}
        {obra.valor_contrato && (
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 shrink-0" />
            <span>R$ {Number(obra.valor_contrato).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        {obra.situacao && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="inline-block bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-xs">
              {SITUACAO_LABELS[obra.situacao] || obra.situacao}
              {obra.ano_referencia ? ` / ${obra.ano_referencia}` : ''}
            </span>
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-xs text-slate-500">Progresso</span>
          <span className="text-xs font-semibold text-slate-700">{obra.percentual_executado || 0}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${saude.bar}`}
            style={{ width: `${Math.min(obra.percentual_executado || 0, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-end pt-1">
        <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 group-hover:gap-2 transition-all">
          Ver detalhes
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
};

const CardSkeleton = () => (
  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col gap-4 animate-pulse">
    <div className="h-4 bg-slate-100 rounded w-3/4" />
    <div className="space-y-2">
      <div className="h-3 bg-slate-100 rounded w-1/2" />
      <div className="h-3 bg-slate-100 rounded w-2/3" />
    </div>
    <div className="h-1.5 bg-slate-100 rounded-full" />
  </div>
);

const SITUACOES = [
  { value: '', label: 'Todas as situações' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { value: 'CONCLUIDA',    label: 'Concluída' },
  { value: 'PARALISADA',   label: 'Paralisada' },
  { value: 'A_INICIAR',    label: 'A Iniciar' },
  { value: 'INACABADA',    label: 'Inacabada' },
  { value: 'RESCINDIDA',   label: 'Rescindida' },
  { value: 'ARQUIVADA',    label: 'Arquivada' },
];

const Obras = () => {
  const [obras, setObras] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [situacao, setSituacao] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchObras = useCallback(() => {
    setLoading(true);
    const params = { limit: 200 };
    if (debouncedSearch) params.search = debouncedSearch;
    if (situacao) params.situacao = situacao;

    api.get('/obras', { params })
      .then((r) => {
        setObras(r.data);
        setTotal(r.data.length);
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch, situacao]);

  useEffect(() => { fetchObras(); }, [fetchObras]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Obras</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {total !== null ? `${total} obras` : '...'}
          </p>
        </div>
        <Link
          to="/obras/nova"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          Cadastrar Obra
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 left-3 flex items-center h-full w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou município..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
          value={situacao}
          onChange={(e) => setSituacao(e.target.value)}
        >
          {SITUACOES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : obras.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {obras.map((obra) => <ObraCard key={obra.id} obra={obra} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
          <Building2 className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-lg font-semibold text-slate-600 mb-2">Nenhuma obra encontrada</p>
          <p className="text-sm text-slate-400">Tente ajustar os filtros ou cadastre uma nova obra.</p>
        </div>
      )}
    </div>
  );
};

export default Obras;
