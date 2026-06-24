import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  BookOpen,
  KanbanSquare,
  ChartBar,
  FileText,
  FolderDown,
  Users,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/auth";
import PerfilModal from "@/components/layout/PerfilModal";

import type { Role } from "@/types";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles?: Role[];
}

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [perfilOpen, setPerfilOpen] = useState(false);

  const objetoMatch = location.pathname.match(/\/objetos\/([^/]+)/);
  const contratoMatch = location.pathname.match(/\/contratos\/([^/]+)/);
  const ctxId = objetoMatch ? objetoMatch[1] : contratoMatch ? contratoMatch[1] : "1";
  const isContratoCtx = !!contratoMatch && !objetoMatch;

  const allNav: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    {
      name: "Contratos",
      href: "/contratos",
      icon: Briefcase,
      roles: ["FISCAL", "APOIO_N1", "APOIO_N2", "COORDENADOR", "SECRETARIO", "ENGENHEIRO"],
    },
    {
      name: "Empresas",
      href: "/empresas",
      icon: Building2,
      roles: ["FISCAL", "APOIO_N1", "APOIO_N2", "COORDENADOR", "SECRETARIO", "ENGENHEIRO"],
    },
    { name: "Diário de Obras", href: isContratoCtx ? `/contratos/${ctxId}?tab=diario` : `/empresa/objetos/${ctxId}/diario`, icon: BookOpen, roles: ["EMPRESA", "FISCAL", "APOIO_N1", "APOIO_N2", "COORDENADOR", "SECRETARIO", "ENGENHEIRO"] },
    {
      name: "Quadro de Tarefas",
      href: "/quadro",
      icon: KanbanSquare,
      roles: ["FISCAL", "APOIO_N1", "APOIO_N2", "COORDENADOR", "SECRETARIO", "ENGENHEIRO"],
    },
    {
      name: "Relatório",
      href: "/relatorio",
      icon: ChartBar,
      roles: ["FISCAL", "APOIO_N1", "APOIO_N2", "COORDENADOR", "SECRETARIO", "ENGENHEIRO"],
    },
    {
      name: "Documentos",
      href: "/documentos",
      icon: FolderDown,
      roles: ["FISCAL", "APOIO_N1", "APOIO_N2", "COORDENADOR", "SECRETARIO", "ENGENHEIRO"],
    },
    { name: "Medições", href: isContratoCtx ? `/contratos/${ctxId}?tab=medicoes` : `/empresa/objetos/${ctxId}/medicoes`, icon: FileText, roles: ["EMPRESA", "FISCAL", "APOIO_N1", "APOIO_N2", "COORDENADOR", "SECRETARIO", "ENGENHEIRO"] },
    {
      name: "Gestão",
      href: "/gestao",
      icon: Users,
      roles: ["COORDENADOR", "SECRETARIO"],
    },
  ];

  const userRole = (user?.tipo as Role) || "EMPRESA";
  const navigation = allNav.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <div className="flex h-full w-64 flex-col bg-brand-700 text-white/80 shadow-2xl transition-all duration-300">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 bg-brand-800/60 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <img
              src="/brasao_RN.png"
              alt="Brasão do Estado do Rio Grande do Norte"
              className="h-8 w-auto object-contain drop-shadow"
            />
            <div className="h-1 w-7 sin-stripe rounded-full opacity-90" />
          </div>
          <span
            className="text-xl font-black tracking-wider text-white uppercase"
            style={{ fontFamily: "var(--font-condensed)" }}
          >
            SIN-Obras
          </span>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex flex-1 flex-col px-3 py-5 overflow-y-auto">
        <ul className="flex flex-col gap-1">
          {navigation.map((item) => {
            const isActive = (() => {
              // Itens com ?tab= — só ativo quando exatamente aquele tab está na URL
              if (item.href.includes("?tab=")) {
                return location.pathname + location.search === item.href;
              }
              // Contratos — ativo na listagem OU no detalhe sem tab (ou tab=detalhes)
              if (item.href === "/contratos") {
                const tab = new URLSearchParams(location.search).get("tab");
                return (
                  location.pathname === "/contratos" ||
                  (location.pathname.startsWith("/contratos/") &&
                    (!tab || tab === "detalhes"))
                );
              }
              // Demais itens — match simples por prefixo
              return location.pathname.startsWith(item.href);
            })();
            return (
              <li key={item.name} className="relative">
                <Link
                  to={item.href}
                  className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 overflow-hidden ${
                    isActive
                      ? "bg-gradient-to-r from-white/[0.13] to-white/[0.04] text-white"
                      : "text-white/60 hover:bg-white/[0.07] hover:text-white/90"
                  }`}
                >
                  {/* Barra indicadora lateral animada */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-accent-500"
                      style={{
                        height: "60%",
                        animation: "sidebar-indicator 0.2s ease-out",
                      }}
                    />
                  )}

                  <item.icon
                    className={`h-5 w-5 shrink-0 transition-all duration-200 ${
                      isActive
                        ? "text-accent-400 drop-shadow-[0_0_6px_rgba(200,73,24,0.7)]"
                        : "text-white/40 group-hover:text-white/70"
                    }`}
                  />
                  <span className={`transition-all duration-200 ${isActive ? "font-semibold" : ""}`}>
                    {item.name}
                  </span>

                  {/* Brilho sutil no hover */}
                  {!isActive && (
                    <span className="pointer-events-none absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-r from-white/[0.04] to-transparent" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Rodapé do sidebar */}
      <div className="p-3 bg-brand-800/40 border-t border-white/10">
        <button
          onClick={() => setPerfilOpen(true)}
          className="flex w-full items-center gap-3 mb-3 px-2 py-1.5 rounded-lg hover:bg-white/8 transition-colors text-left"
        >
          <div className="h-9 w-9 rounded-full bg-accent-500 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
            {user?.nome?.charAt(0) || "U"}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-semibold text-white">{user?.nome || "Usuário"}</span>
            <span className="truncate text-xs text-white/50">{user?.tipo || "Perfil"}</span>
          </div>
        </button>

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/50 transition-colors hover:bg-accent-500/20 hover:text-accent-200"
        >
          <LogOut className="h-4 w-4" />
          Sair do sistema
        </button>
      </div>

      <PerfilModal open={perfilOpen} onClose={() => setPerfilOpen(false)} />
    </div>
  );
};

export default Sidebar;
