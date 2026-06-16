import { useState } from 'react';
import { Plus, Trash2, KanbanSquare, Loader2 } from 'lucide-react';
import api from '../services/api';

const COLUMNS = [
  { id: 'A_FAZER', label: 'A Fazer', color: 'bg-slate-100', headerCls: 'bg-slate-100 text-slate-600', dotCls: 'bg-slate-400' },
  { id: 'EM_ANDAMENTO', label: 'Em Andamento', color: 'bg-amber-50', headerCls: 'bg-amber-50 text-amber-700', dotCls: 'bg-amber-400' },
  { id: 'CONCLUIDO', label: 'Concluído', color: 'bg-emerald-50', headerCls: 'bg-emerald-50 text-emerald-700', dotCls: 'bg-emerald-400' },
];

const PRIORITY_CONFIG = {
  BAIXA: { label: 'Baixa', cls: 'bg-slate-100 text-slate-500' },
  MEDIA: { label: 'Média', cls: 'bg-sky-100 text-sky-600' },
  ALTA: { label: 'Alta', cls: 'bg-orange-100 text-orange-600' },
  URGENTE: { label: 'Urgente', cls: 'bg-rose-100 text-rose-600' },
};

const mockTarefas = [
  { id: '1', titulo: 'Verificar ART do responsável técnico', descricao: 'Conferir validade e upload no sistema', status: 'A_FAZER', prioridade: 'ALTA', prazo: '2026-07-01' },
  { id: '2', titulo: 'Aprovar medição #2 da RN-160', descricao: 'Analisar documentação enviada pela empresa', status: 'A_FAZER', prioridade: 'URGENTE', prazo: '2026-06-20' },
  { id: '3', titulo: 'Agendar vistoria no CRAS', descricao: null, status: 'EM_ANDAMENTO', prioridade: 'MEDIA', prazo: '2026-06-25' },
  { id: '4', titulo: 'Importar cronograma XLSX', descricao: 'Receber da empresa e importar no sistema', status: 'EM_ANDAMENTO', prioridade: 'BAIXA', prazo: null },
  { id: '5', titulo: 'Revisar projeto executivo da ponte', descricao: null, status: 'CONCLUIDO', prioridade: 'ALTA', prazo: '2026-06-10' },
];

const TarefaCard = ({ tarefa, onMove }) => {
  const priority = PRIORITY_CONFIG[tarefa.prioridade];
  const cols = COLUMNS.map(c => c.id);
  const currentIdx = cols.indexOf(tarefa.status);

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow group space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800 leading-snug">{tarefa.titulo}</p>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${priority.cls}`}>{priority.label}</span>
      </div>
      {tarefa.descricao && <p className="text-xs text-slate-400 leading-relaxed">{tarefa.descricao}</p>}
      {tarefa.prazo && (
        <p className="text-xs text-slate-400">
          Prazo: <span className="font-medium text-slate-600">{new Date(tarefa.prazo).toLocaleDateString('pt-BR')}</span>
        </p>
      )}
      <div className="flex gap-1 pt-1">
        {currentIdx > 0 && (
          <button
            onClick={() => onMove(tarefa.id, cols[currentIdx - 1])}
            className="text-xs text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-lg transition-all"
          >← Voltar</button>
        )}
        {currentIdx < cols.length - 1 && (
          <button
            onClick={() => onMove(tarefa.id, cols[currentIdx + 1])}
            className="text-xs text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-all ml-auto"
          >Avançar →</button>
        )}
      </div>
    </div>
  );
};

const Quadro = () => {
  const [tarefas, setTarefas] = useState(mockTarefas);
  const [showModal, setShowModal] = useState(false);
  const [newTarefa, setNewTarefa] = useState({ titulo: '', prioridade: 'MEDIA' });

  const handleMove = (id, novoStatus) => {
    setTarefas((prev) => prev.map((t) => t.id === id ? { ...t, status: novoStatus } : t));
  };

  const handleAddTarefa = (e) => {
    e.preventDefault();
    const t = { id: String(Date.now()), ...newTarefa, status: 'A_FAZER', descricao: null, prazo: null };
    setTarefas((prev) => [...prev, t]);
    setNewTarefa({ titulo: '', prioridade: 'MEDIA' });
    setShowModal(false);
  };

  return (
    <div className="space-y-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Quadro de Tarefas</h2>
          <p className="text-sm text-slate-500 mt-0.5">{tarefas.length} tarefas no total</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {COLUMNS.map((col) => {
          const items = tarefas.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="flex flex-col gap-3">
              {/* Column Header */}
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${col.headerCls}`}>
                <span className={`h-2 w-2 rounded-full ${col.dotCls}`} />
                <span className="text-sm font-semibold">{col.label}</span>
                <span className="ml-auto text-xs font-medium bg-white/60 rounded-full px-2 py-0.5">
                  {items.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-3 min-h-[200px]">
                {items.map((t) => (
                  <TarefaCard key={t.id} tarefa={t} onMove={handleMove} />
                ))}
                {items.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-slate-200 text-slate-300">
                    <KanbanSquare className="h-8 w-8 mb-1" />
                    <span className="text-xs">Sem tarefas</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <h3 className="text-lg font-bold text-slate-900">Nova Tarefa</h3>
            <form onSubmit={handleAddTarefa} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Título <span className="text-rose-500">*</span></label>
                <input required value={newTarefa.titulo} onChange={(e) => setNewTarefa({ ...newTarefa, titulo: e.target.value })}
                  placeholder="Descreva a tarefa..."
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Prioridade</label>
                <select value={newTarefa.prioridade} onChange={(e) => setNewTarefa({ ...newTarefa, prioridade: e.target.value })}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                >
                  <option value="BAIXA">Baixa</option>
                  <option value="MEDIA">Média</option>
                  <option value="ALTA">Alta</option>
                  <option value="URGENTE">Urgente</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >Cancelar</button>
                <button type="submit"
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-200 transition-all"
                >Criar Tarefa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quadro;
