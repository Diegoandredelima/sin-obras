import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Plus, Search, Calendar, Users, 
  CloudSun, AlertCircle, ChevronRight, FileText
} from 'lucide-react';
import api from '../services/api';

const CLIMA_OPTIONS = ['Ensolarado', 'Nublado', 'Parcialmente nublado', 'Chuvoso', 'Tempestade', 'Ventoso'];

// Mock data
const mockDiario = [
  {
    id: '1',
    data_registro: '2026-06-15',
    clima: 'Ensolarado',
    qtd_funcionarios: 18,
    atividades_realizadas: 'Concretagem do pilar P7 e P8. Início da montagem da fôrma do pavimento tipo.',
    ocorrencias: 'Nenhuma ocorrência registrada.',
    equipamentos: '2 betoneiras, 1 grua, 1 vibrador de concreto',
  },
  {
    id: '2',
    data_registro: '2026-06-14',
    clima: 'Nublado',
    qtd_funcionarios: 15,
    atividades_realizadas: 'Armação das vigas do 2º pavimento. Revisão do projeto estrutural com o engenheiro.',
    ocorrencias: 'Paralisação de 2h por chuva no período da tarde.',
    equipamentos: '1 betoneira, ferramentas manuais',
  },
];

const DiarioForm = ({ obraId, onSuccess, onCancel }) => {
  const [form, setForm] = useState({
    data_registro: new Date().toISOString().split('T')[0],
    clima: '',
    qtd_funcionarios: 0,
    equipamentos: '',
    atividades_realizadas: '',
    ocorrencias: '',
  });
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/empresa/obras/${obraId}/diario`, form);
      onSuccess();
    } catch {
      /* TODO: error handling */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
      <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
        <Plus className="h-4 w-4 text-emerald-500" />
        Novo Registro — {new Date().toLocaleDateString('pt-BR')}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Data</label>
            <input type="date" value={form.data_registro} onChange={update('data_registro')} required
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Clima</label>
            <select value={form.clima} onChange={update('clima')}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
            >
              <option value="">Selecione</option>
              {CLIMA_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Nº de Funcionários</label>
            <input type="number" min="0" value={form.qtd_funcionarios} onChange={update('qtd_funcionarios')} required
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Atividades Realizadas <span className="text-rose-500">*</span></label>
          <textarea rows={3} required value={form.atividades_realizadas} onChange={update('atividades_realizadas')}
            placeholder="Descreva as atividades executadas hoje..."
            className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Equipamentos</label>
            <textarea rows={2} value={form.equipamentos} onChange={update('equipamentos')} placeholder="Ex: 1 betoneira, 1 grua..."
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Ocorrências</label>
            <textarea rows={2} value={form.ocorrencias} onChange={update('ocorrencias')} placeholder="Ocorrências, paralisações, acidentes..."
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-200 transition-all disabled:opacity-70">
            {loading ? 'Salvando...' : 'Salvar Registro'}
          </button>
        </div>
      </form>
    </div>
  );
};

const DiarioObras = () => {
  const obraId = '1'; // In real use: useParams().obraId
  const [registros, setRegistros] = useState(mockDiario);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Diário de Obras</h2>
          <p className="text-sm text-slate-500 mt-0.5">{registros.length} registros • Obra: CRAS Cidade Nova</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-500 transition-all">
            <Plus className="h-4 w-4" />
            Novo Registro
          </button>
        )}
      </div>

      {showForm && (
        <DiarioForm
          obraId={obraId}
          onSuccess={() => { setShowForm(false); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200" />
        <div className="space-y-6">
          {registros.map((r) => (
            <div key={r.id} className="relative flex gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white border-2 border-emerald-200 shadow-sm z-10">
                <BookOpen className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-bold text-slate-900">
                    {new Date(r.data_registro + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                  {r.clima && (
                    <span className="flex items-center gap-1 text-xs font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                      <CloudSun className="h-3.5 w-3.5" /> {r.clima}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                    <Users className="h-3.5 w-3.5" /> {r.qtd_funcionarios} funcionários
                  </span>
                </div>
                {r.atividades_realizadas && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Atividades</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{r.atividades_realizadas}</p>
                  </div>
                )}
                {r.ocorrencias && r.ocorrencias !== 'Nenhuma ocorrência registrada.' && (
                  <div className="flex gap-2 rounded-xl bg-amber-50 border border-amber-100 p-3">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">{r.ocorrencias}</p>
                  </div>
                )}
                {r.equipamentos && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-0.5 uppercase tracking-wide">Equipamentos</p>
                    <p className="text-xs text-slate-500">{r.equipamentos}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiarioObras;
