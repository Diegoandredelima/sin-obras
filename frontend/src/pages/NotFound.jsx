import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center px-4">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-50 border border-emerald-100 mb-6">
        <span className="text-5xl font-black text-emerald-400">4</span>
        <span className="text-5xl font-black text-slate-300">0</span>
        <span className="text-5xl font-black text-emerald-400">4</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Página não encontrada</h1>
      <p className="text-slate-400 mb-8 max-w-sm">A rota que você tentou acessar não existe ou foi removida.</p>
      <button
        onClick={() => navigate('/dashboard')}
        className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-500 transition-all"
      >
        Voltar ao Dashboard
      </button>
    </div>
  );
};

export default NotFound;
