import { 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Briefcase,
  KanbanSquare,
  ArrowRight,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

const KPICard = ({ icon: Icon, label, value, sub, color = 'emerald' }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl border ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">{sub}</span>
      </div>
      <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    VERDE: { label: 'Em dia', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    AMARELO: { label: 'Atenção', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    VERMELHO: { label: 'Crítico', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  };
  const item = map[status] || map.VERDE;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${item.cls}`}>
      {item.label}
    </span>
  );
};

// Mock data — will be replaced by API calls
const mockObras = [
  { id: '1', titulo: 'Construção do CRAS Cidade Nova', municipio: 'Natal', percentual_executado: 68, saude: 'VERDE', status: 'EM_EXECUCAO' },
  { id: '2', titulo: 'Recuperação da RN-160', municipio: 'Mossoró', percentual_executado: 30, saude: 'AMARELO', status: 'EM_EXECUCAO' },
  { id: '3', titulo: 'Pavimentação Bairro Alecrim', municipio: 'Natal', percentual_executado: 5, saude: 'VERMELHO', status: 'PARALISADA' },
];

const Dashboard = () => {
  const { user } = useAuthStore();

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
        <KPICard icon={Building2}    label="Obras Cadastradas"  value="24"  sub="total"  color="sky" />
        <KPICard icon={Activity}     label="Em Execução"        value="17"  sub="ativas" color="emerald" />
        <KPICard icon={AlertTriangle} label="Em Atenção/Crítico" value="5"   sub="alertas" color="amber" />
        <KPICard icon={CheckCircle2} label="Concluídas"         value="2"   sub="este mês" color="sky" />
      </div>

      {/* Table of Obras Recentes */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Obras Recentes</h3>
            <p className="text-xs text-slate-400 mt-0.5">Últimas obras atualizadas</p>
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
          {mockObras.map((obra) => (
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
                {/* Progress Bar */}
                <div className="hidden sm:block w-28">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">{obra.percentual_executado}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100">
                    <div
                      className="h-1.5 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${obra.percentual_executado}%` }}
                    />
                  </div>
                </div>
                <StatusBadge status={obra.saude} />
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/obras/nova', icon: Building2, title: 'Cadastrar Obra', desc: 'Registre uma nova obra no sistema', color: 'text-emerald-600 bg-emerald-50' },
          { to: '/contratos', icon: Briefcase, title: 'Ver Contratos', desc: 'Consulte e gerencie contratos', color: 'text-sky-600 bg-sky-50' },
          { to: '/quadro', icon: KanbanSquare, title: 'Quadro de Tarefas', desc: 'Acompanhe as tarefas Kanban', color: 'text-violet-600 bg-violet-50' },
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
