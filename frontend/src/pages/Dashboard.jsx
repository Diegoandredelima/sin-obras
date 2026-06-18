import { useState, useEffect } from 'react';
import {
  Building2, Clock, CheckCircle2, AlertTriangle,
  TrendingUp, Briefcase, KanbanSquare, ArrowRight, Activity,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import api from '../services/api';

const KPICard = ({ icon: Icon, label, value, sub, color = 'emerald', loading }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber:   'bg-amber-50 text-amber-600 border-amber-100',
    rose:    'bg-rose-50 text-rose-600 border-rose-100',
    sky:     'bg-sky-50 text-sky-600 border-sky-100',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl border ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">{sub}</span>
      </div>
      {loading ? (
        <div className="h-9 w-16 bg-slate-100 animate-pulse rounded-lg mb-1" />
      ) : (
        <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
      )}
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    VERDE:    { label: 'Em dia',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    AMARELO:  { label: 'Atenção', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    VERMELHO: { label: 'Crítico', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  };
  const item = map[status] || map.VERDE;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${item.cls}`}>
      {item.label}
    </span>
  );
};

const SITUACAO_LABEL = {
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDA:    'Concluída',
  PARALISADA:   'Paralisada',
  A_INICIAR:    'A Iniciar',
  INACABADA:    'Inacabada',
  RESCINDIDA:   'Rescindida',
  ARQUIVADA:    'Arquivada',
  EXTINTA:      'Extinta',
  CEDIDA:       'Cedida',
};

const Dashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/obras/stats'),
      api.get('/obras', { params: { limit: 10 } }),
    ])
      .then(([statsRes, obrasRes]) => {
        setStats(statsRes.data);
        setObras(obrasRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const s = stats?.por_situacao || {};
  const emExecucao = (s.EM_ANDAMENTO || 0) + (stats?.por_status?.EM_EXECUCAO || 0);
  const atencao = (s.PARALISADA || 0) + (s.INACABADA || 0);
  const concluidas = s.CONCLUIDA || 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-500 p-8 text-white shadow-xl shadow-emerald-200 relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-64 opacity-10">
          <Building2 className="h-full w-full" />
        </div>
        <div className="relative">
          <p className="text-sm font-medium text-emerald-100 mb-1">Bem-vindo ao painel,</p>
          <h2 className="text-3xl font-bold mb-2">{user?.nome || 'Usuário'}</h2>
          <p className="text-emerald-100 text-sm">Confira o resumo das obras sob sua responsabilidade hoje.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard icon={Building2}     label="Obras Cadastradas"  value={stats?.total ?? '—'}  sub="total"       color="sky"     loading={loading} />
        <KPICard icon={Activity}      label="Em Execução"        value={emExecucao || '—'}     sub="ativas"      color="emerald" loading={loading} />
        <KPICard icon={AlertTriangle} label="Paralisadas"        value={atencao || '—'}        sub="alertas"     color="amber"   loading={loading} />
        <KPICard icon={CheckCircle2}  label="Concluídas"         value={concluidas || '—'}     sub="total"       color="sky"     loading={loading} />
      </div>

      {/* Distribuição por situação */}
      {stats && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Distribuição por situação oficial</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.por_situacao || {}).sort((a, b) => b[1] - a[1]).map(([sit, n]) => (
              <span key={sit} className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
                <span className="font-semibold text-slate-900">{n}</span>
                <span className="text-slate-500">{SITUACAO_LABEL[sit] || sit}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Obras recentes */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Obras Recentes</h3>
            <p className="text-xs text-slate-400 mt-0.5">Últimas obras cadastradas</p>
          </div>
          <Link
            to="/obras"
            className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
          >
            Ver todas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-slate-100 animate-pulse rounded w-2/3" />
                    <div className="h-3 bg-slate-100 animate-pulse rounded w-1/3" />
                  </div>
                </div>
              ))
            : obras.map((obra) => (
                <Link
                  key={obra.id}
                  to={`/obras/${obra.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/80 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate group-hover:text-emerald-700">{obra.titulo}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{obra.municipio}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="hidden sm:block w-28">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-slate-500">{obra.percentual_executado}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${obra.percentual_executado || 0}%` }}
                        />
                      </div>
                    </div>
                    <StatusBadge status={obra.saude} />
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </Link>
              ))
          }
        </div>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/obras/nova',  icon: Building2,    title: 'Cadastrar Obra',    desc: 'Registre uma nova obra no sistema',    color: 'text-emerald-600 bg-emerald-50' },
          { to: '/contratos',  icon: Briefcase,    title: 'Ver Contratos',     desc: `${stats?.total ?? '—'} contratos no sistema`,          color: 'text-sky-600 bg-sky-50' },
          { to: '/quadro',     icon: KanbanSquare, title: 'Quadro de Tarefas', desc: 'Acompanhe as tarefas Kanban',           color: 'text-violet-600 bg-violet-50' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group"
          >
            <div className={`p-3 rounded-xl ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">{item.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
