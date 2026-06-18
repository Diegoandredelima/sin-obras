import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Briefcase, ArrowRight, Calendar, DollarSign, User, Building } from 'lucide-react';
import api from '../services/api';

const fmt = (v) =>
  v ? Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : null;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : null;

const ContratoRow = ({ c }) => (
  <Link to={`/contratos/${c.id}`} className="flex flex-col sm:flex-row sm:items-start gap-3 px-6 py-4 hover:bg-slate-50/70 transition-colors group">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 border border-sky-100">
        <Briefcase className="h-5 w-5 text-sky-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">
          Nº {c.numero_contrato}
          {c.orgao && (
            <span className="ml-2 text-xs font-normal bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
              {c.orgao}
            </span>
          )}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{c.objeto || '—'}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
          {c.fiscal_nome && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <User className="h-3 w-3" /> {c.fiscal_nome}
            </span>
          )}
          {c.empresa_ref?.razao_social && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Building className="h-3 w-3" />
              <span className="truncate max-w-[200px]">{c.empresa_ref.razao_social}</span>
            </span>
          )}
        </div>
      </div>
    </div>

    <div className="flex flex-col sm:items-end gap-1 shrink-0 text-xs text-slate-500 pl-13 sm:pl-0">
      <div className="flex items-center gap-1 font-semibold text-slate-700">
        <DollarSign className="h-3.5 w-3.5" />
        R$ {fmt(c.valor_final || c.valor_global) || '—'}
      </div>
      {c.valor_final && c.valor_global && c.valor_final !== c.valor_global && (
        <span className="text-slate-400">Inicial: R$ {fmt(c.valor_global)}</span>
      )}
      {c.data_vigencia && (
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          Vigência: {fmtDate(c.data_vigencia)}
        </div>
      )}
      <span className="flex items-center gap-1 font-medium text-emerald-600 group-hover:text-emerald-500 mt-1">
        Ver <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </div>
  </Link>
);

const RowSkeleton = () => (
  <div className="flex items-center gap-3 px-6 py-4 animate-pulse">
    <div className="h-10 w-10 rounded-xl bg-slate-100 shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3.5 bg-slate-100 rounded w-1/3" />
      <div className="h-3 bg-slate-100 rounded w-2/3" />
    </div>
    <div className="h-4 bg-slate-100 rounded w-24" />
  </div>
);

const Contratos = () => {
  const [contratos, setContratos] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchContratos = useCallback(() => {
    setLoading(true);
    const params = { limit: 200 };
    if (debouncedSearch) params.search = debouncedSearch;

    api.get('/contratos', { params })
      .then((r) => {
        setContratos(r.data);
        setTotal(r.data.length);
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  useEffect(() => { fetchContratos(); }, [fetchContratos]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Contratos</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {total !== null ? `${total} contratos` : '...'}
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-500 transition-all">
          <Plus className="h-4 w-4" />
          Novo Contrato
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute inset-y-0 left-3 flex items-center h-full w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por número, objeto ou fiscal..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Lista de Contratos</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)
            : contratos.length > 0
              ? contratos.map((c) => <ContratoRow key={c.id} c={c} />)
              : (
                <div className="flex flex-col items-center justify-center p-16 text-center">
                  <Briefcase className="h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-500">Nenhum contrato encontrado</p>
                </div>
              )
          }
        </div>
      </div>
    </div>
  );
};

export default Contratos;
