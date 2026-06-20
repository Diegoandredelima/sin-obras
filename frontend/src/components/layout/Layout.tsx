import { Outlet, Navigate, useLocation, Link } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import NotificacoesBell from "@/components/NotificacoesBell";
import { useAuthStore } from "@/store/auth";

const TITLES: Record<string, string> = {
  "/dashboard": "Painel de Controle",
  "/obras": "Obras",
  "/obras/nova": "Cadastrar Obra",
  "/contratos": "Contratos",
  "/quadro": "Quadro de Tarefas",
  "/relatorio": "Relatórios",
};

function getPageTitle(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith("/obras/") && pathname !== "/obras/nova") return "Detalhe da Obra";
  if (pathname.startsWith("/contratos/")) return "Detalhe do Contrato";
  if (pathname.startsWith("/empresas/")) return "Detalhe da Empresa";
  if (pathname.includes("/diario")) return "Diário de Obras";
  if (pathname.includes("/medicoes")) return "Medições";
  return "Painel de Controle";
}

const Layout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-50/50 dark:bg-slate-950 overflow-hidden">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="h-16 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between shadow-sm z-10">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            {getPageTitle(location.pathname)}
          </h1>
          <NotificacoesBell />
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50 p-8">
          <Outlet />
        </main>

        <footer className="shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-8 py-3 text-center text-xs text-slate-500 dark:text-slate-400">
          2023 &copy; Governo do Estado do Rio Grande do Norte &nbsp;|&nbsp;
          Desenvolvimento: Assessoria de Informática - infra-RN &nbsp;|&nbsp;
          <Link to="/privacidade" className="underline hover:text-brand-700 transition-colors">
            Política de Privacidade
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
