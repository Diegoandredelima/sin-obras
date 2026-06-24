import { Outlet, Navigate, useLocation, Link } from "react-router-dom";
import { Calculator } from "lucide-react";
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import NotificacoesBell from "@/components/NotificacoesBell";
import AlertasBell from "@/components/AlertasBell";
import { CalculadoraDrawer } from "@/components/CalculadoraDrawer";
import { useAuthStore } from "@/store/auth";

const TITLES: Record<string, string> = {
  "/dashboard": "Painel de Controle",
  "/objetos": "Objetos",
  "/objetos/nova": "Cadastrar Objeto",
  "/contratos": "Contratos",
  "/contratos/novo": "Cadastrar Contrato",
  "/quadro": "Quadro de Tarefas",
  "/relatorio": "Relatórios",
  "/gestao": "Gestão de Objetos e Equipe",
  "/alertas": "Central de Alertas",
  "/empresas": "Empresas Executoras",
  "/empresas/nova": "Cadastrar Empresa",
};

function getPageTitle(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith("/objetos/") && pathname !== "/objetos/nova") return "Detalhe do Objeto";
  if (pathname.startsWith("/contratos/")) return "Detalhe do Contrato";
  if (pathname.endsWith("/editar") && pathname.startsWith("/empresas/")) return "Editar Empresa";
  if (pathname.startsWith("/empresas/")) return "Detalhe da Empresa";
  if (pathname.includes("/diario")) return "Diário de Obras";
  if (pathname.includes("/medicoes")) return "Medições";
  return "Painel de Controle";
}

const Layout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  const [calcOpen, setCalcOpen] = useState(false);

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCalcOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="Calculadora de Engenharia"
            >
              <Calculator className="h-5 w-5" />
            </button>
            <AlertasBell />
            <NotificacoesBell />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50 p-8">
          <Outlet />
        </main>

        <footer className="shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          <div className="h-0.5 w-full sin-stripe" />
          <div className="px-8 py-2.5">
            2026 &copy; Governo do Estado do Rio Grande do Norte &nbsp;|&nbsp;
            Secretaria de Infraestrutura — infra-RN &nbsp;|&nbsp;
            <Link to="/privacidade" className="underline hover:text-brand-700 transition-colors">
              Política de Privacidade
            </Link>
          </div>
        </footer>
      </div>

      <CalculadoraDrawer open={calcOpen} onClose={() => setCalcOpen(false)} />
    </div>
  );
};

export default Layout;
