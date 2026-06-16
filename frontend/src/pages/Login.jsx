import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Building2, Lock, User, Loader2 } from 'lucide-react';
import api from '../services/api';

const Login = () => {
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Endpoint to be created in the backend
      const response = await api.post('/auth/login', { identificador, senha });
      login(response.data.user, response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError('Credenciais inválidas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50">
      {/* Left Column - Form */}
      <div className="flex w-full flex-col justify-center px-8 sm:px-16 md:px-24 lg:w-[480px] xl:w-[560px] 2xl:px-32 z-10 bg-white shadow-2xl relative">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          {/* Logo Area */}
          <div className="mb-10 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 shadow-xl shadow-green-500/30">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">SIN-Obras</h1>
              <p className="text-sm font-medium text-emerald-600">Governo do Estado do RN</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Bem-vindo de volta</h2>
            <p className="mt-2 text-sm text-slate-500">Acesse o sistema unificado de obras com sua Matrícula ou CNPJ.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-rose-50 p-4 text-sm font-medium text-rose-600 border border-rose-100 flex items-center gap-2">
                <span className="flex-1">{error}</span>
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="identificador">
                Matrícula ou CNPJ
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="identificador"
                  type="text"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  placeholder="000.000 ou 00.000.000/0000-00"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700" htmlFor="senha">
                  Senha
                </label>
                <a href="#" className="text-sm font-medium text-emerald-600 hover:text-emerald-500">
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="senha"
                  type="password"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/50 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column - Image Background */}
      <div className="relative hidden w-full flex-1 lg:block overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-emerald-900/40 mix-blend-multiply z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent z-10" />
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="/login_bg.webp" 
          alt="Construção Moderna"
        />
        <div className="absolute bottom-12 left-12 right-12 z-20 text-white">
          <h2 className="text-4xl font-bold tracking-tight mb-4">Gestão inteligente e transparente.</h2>
          <p className="text-lg text-emerald-100 max-w-xl">
            Acompanhe o cronograma físico-financeiro, valide ARTs e realize inspeções georreferenciadas em tempo real.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
