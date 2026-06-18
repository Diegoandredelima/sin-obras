/**
 * Layout.jsx — Componente de Layout Protegido (ProtectedRoute + Shell)
 *
 * Dupla responsabilidade:
 *   1. GUARDA DE AUTENTICAÇÃO: verifica se o usuário está autenticado via
 *      store Zustand. Se não estiver, redireciona para /login sem renderizar
 *      nada (evita flash de conteúdo privado).
 *
 *   2. SHELL DA APLICAÇÃO: renderiza a estrutura visual completa:
 *      [ Sidebar ] [ Header ] [ <Outlet /> ]
 *      O <Outlet /> é onde o React Router injeta o componente da rota ativa.
 *
 * Este componente é usado como "route wrapper" no App.jsx:
 *   <Route element={<Layout />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 *
 * TODO Bloco 2: o Header está com título estático "Painel de Controle".
 * Implementar título dinâmico baseado na rota atual (useLocation).
 */
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../store/auth';

const Layout = () => {
  // Lê isAuthenticated do store persistido no localStorage
  const { isAuthenticated } = useAuthStore();

  // Guarda de autenticação — redireciona para /login se não autenticado
  // `replace` substitui a entrada no histórico (botão Voltar não retorna aqui)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    // Layout de duas colunas: Sidebar fixa à esquerda, conteúdo à direita
    <div className="flex h-screen w-full bg-slate-50/50 overflow-hidden">
      {/* Sidebar de navegação — largura fixa 256px (w-64) */}
      <Sidebar />

      {/* Área de conteúdo — cresce para ocupar o espaço restante */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header superior fixo — TODO: título dinâmico por rota */}
        <header className="h-16 shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center shadow-sm z-10">
          <h1 className="text-xl font-semibold text-slate-800">Painel de Controle</h1>
        </header>

        {/* Área de conteúdo com scroll — <Outlet> renderiza a página atual */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
