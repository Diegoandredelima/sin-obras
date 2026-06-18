/**
 * Sidebar.jsx — Navegação Lateral da Aplicação
 *
 * Barra de navegação vertical fixa (largura 256px) com tema escuro slate.
 * Composta por 3 seções:
 *   1. LOGO: marca SIN-Obras com ícone gradiente verde
 *   2. NAVEGAÇÃO: links para as seções principais do sistema
 *   3. PERFIL/LOGOUT: dados do usuário logado + botão de saída
 *
 * Comportamento de rota ativa:
 *   - Usa `useLocation()` para comparar o pathname atual com cada item
 *   - Item ativo recebe destaque verde + borda lateral (inset box-shadow)
 *   - Usa `startsWith` para que sub-rotas (ex: /obras/123) também ativem "Obras"
 *
 * TODO Bloco 2: implementar navegação condicional por role (RBAC no frontend).
 *   Ex: usuário EMPRESA só vê "Diário de Obras" e "Medições".
 *   Basta filtrar o array `navigation` com base em user?.tipo.
 *
 * TODO Bloco 2: o link do Diário e Medições ainda usa obraId fixo = '1'.
 *   Substituir pelo obraId real quando o portal da empresa for implementado.
 */
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  KanbanSquare,
  BookOpen,
  FileText,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';

const Sidebar = () => {
  // pathname atual para destacar o item de menu ativo
  const location = useLocation();
  // Dados do usuário logado vindos do store Zustand
  const { user, logout } = useAuthStore();

  // ---------------------------------------------------------------------------
  // Definição dos itens de navegação
  // ---------------------------------------------------------------------------
  // Cada item tem: nome exibido, rota de destino, e ícone do lucide-react.
  // TODO: adicionar campo `roles` para filtrar por perfil quando implementar RBAC.
  const navigation = [
    { name: 'Dashboard',       href: '/dashboard',                  icon: LayoutDashboard },
    { name: 'Obras',           href: '/obras',                      icon: Building2 },
    { name: 'Contratos',       href: '/contratos',                  icon: Briefcase },
    { name: 'Quadro de Tarefas', href: '/quadro',                   icon: KanbanSquare },
    { name: 'Diário de Obras', href: '/empresa/obras/1/diario',     icon: BookOpen },   // TODO: obraId dinâmico
    { name: 'Medições',        href: '/empresa/obras/1/medicoes',   icon: FileText },   // TODO: obraId dinâmico
  ];

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-slate-300 shadow-2xl transition-all duration-300">

      {/* ------------------------------------------------------------------ */}
      {/* Área do logo — fundo ainda mais escuro com blur sutil              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex h-16 shrink-0 items-center px-6 bg-slate-950/50 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          {/* Ícone da marca — gradiente verde com a letra "S" */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 shadow-lg shadow-green-500/20">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">SIN-Obras</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Navegação principal — lista de links com destaque de rota ativa    */}
      {/* ------------------------------------------------------------------ */}
      <nav className="flex flex-1 flex-col px-4 py-6 overflow-y-auto">
        <ul className="flex flex-col gap-2">
          {navigation.map((item) => {
            // Destaca o item se a rota atual começa com o href do item
            // (ex: /obras/nova também ativa o item "Obras")
            const isActive = location.pathname.startsWith(item.href);

            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      // Ativo: fundo verde translúcido + borda lateral (inset shadow)
                      ? 'bg-emerald-500/10 text-emerald-400 shadow-[inset_4px_0_0_0_#10b981]'
                      // Inativo: hover suave branco translúcido
                      : 'hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 shrink-0 transition-colors ${
                      isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* Área inferior — perfil do usuário e botão de logout               */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-4 bg-slate-950/30 border-t border-white/5">
        {/* Avatar com inicial do nome + dados do usuário */}
        <div className="flex items-center gap-3 mb-4 px-2">
          {/* Avatar circular com inicial do nome (fallback: 'U') */}
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-white font-semibold shadow-inner">
            {user?.nome?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col overflow-hidden">
            {/* Nome do usuário — truncado se longo */}
            <span className="truncate text-sm font-medium text-white">{user?.nome || 'Usuário'}</span>
            {/* Perfil/role do usuário */}
            <span className="truncate text-xs text-slate-500">{user?.role || 'Perfil'}</span>
          </div>
        </div>

        {/* Botão de logout — chama store.logout() que limpa o estado e redireciona */}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
        >
          <LogOut className="h-5 w-5" />
          Sair do sistema
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
