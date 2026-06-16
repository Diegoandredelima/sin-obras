import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Briefcase, ArrowRight, Calendar, DollarSign } from 'lucide-react';
import api from '../services/api';

const mockContratos = [
  { id: '1', numero_contrato: '2024/001', numero_processo: 'PROC-2024-001', objeto: 'Construção do CRAS Cidade Nova', valor_global: 2450000, data_assinatura: '2024-01-15', data_vigencia: '2026-12-31' },
  { id: '2', numero_contrato: '2024/012', numero_processo: 'PROC-2024-012', objeto: 'Recuperação da RN-160', valor_global: 8700000, data_assinatura: '2024-03-01', data_vigencia: '2026-09-15' },
  { id: '3', numero_contrato: '2023/045', numero_processo: 'PROC-2023-045', objeto: 'Pavimentação e Drenagem Bairro Alecrim', valor_global: 1230000, data_assinatura: '2023-11-10', data_vigencia: '2026-07-01' },
];

const Contratos = () => {
  const [contratos, setContratos] = useState(mockContratos);
  const [search, setSearch] = useState('');

  const filtered = contratos.filter((c) =>
    c.numero_contrato.includes(search) ||
    c.objeto?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Contratos</h2>
          <p className="text-sm text-slate-500 mt-0.5">{contratos.length} contratos cadastrados</p>
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
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por número ou objeto..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Lista de Contratos</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {filtered.map((c) => (
            <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 hover:bg-slate-50/70 transition-colors group">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 border border-sky-100">
                  <Briefcase className="h-5 w-5 text-sky-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">Contrato nº {c.numero_contrato}</p>
                  <p className="text-xs text-slate-500 truncate">{c.objeto}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 pl-13 sm:pl-0 shrink-0 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span className="font-semibold text-slate-700">
                    R$ {Number(c.valor_global).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Vence: {new Date(c.data_vigencia).toLocaleDateString('pt-BR')}</span>
                </div>
                <button className="flex items-center gap-1 font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
                  Ver <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Contratos;
