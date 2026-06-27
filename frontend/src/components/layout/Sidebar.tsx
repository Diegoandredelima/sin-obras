import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Gauge,
  Briefcase,
  Building2,
  BookOpen,
  KanbanSquare,
  ChartBar,
  FolderDown,
  Users,
  LogOut,
  PlusCircle,
  FileSignature,
  ChevronDown,
  Calendar,
  Calculator,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/auth";
import PerfilModal from "@/components/layout/PerfilModal";

import type { Role } from "@/types";

interface NavChild {
  name: string;
  href: string;
  icon?: LucideIcon;
  roles?: Role[];
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles?: Role[];
  children?: NavChild[];
}

// Perfis que podem criar contratos (ENGENHEIRO/APOIO_N2) e empresas (APOIO_N2):
// ambos exigem nível mínimo APOIO_N2 no backend (rank 3).
const CADASTRO_ROLES: Role[] = ["APOIO_N2", "ENGENHEIRO", "COORDENADOR", "SECRETARIO"];

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [perfilOpen, setPerfilOpen] = useState(false);

  const objetoMatch = location.pathname.match(/\/objetos\/([^/]+)/);
  const contratoMatch = location.pathname.match(/\/contratos\/([^/]+)/);
  const ctxId = objetoMatch ? objetoMatch[1] : contratoMatch ? contratoMatch[1] : "1";
  const isContratoCtx = !!contratoMatch && !objetoMatch;

  // O submenu "Cadastrar" abre automaticamente quando se está numa de suas rotas.
  const isCadastroRoute =
    location.pathname === "/contratos/novo" || location.pathname === "/empresas/nova" || location.pathname.startsWith("/cronograma");
  const [cadastrarOpen, setCadastrarOpen] = useState(isCadastroRoute);

  const allNav: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    {
      name: "Executivo",
      href: "/executivo",
      icon: Gauge,
      roles: ["COORDENADOR", "SECRETARIO"],
    },
    {
      name: "Cadastrar",
      href: "#cadastrar",
      icon: PlusCircle,
      roles: CADASTRO_ROLES,
      children: [
        { name: "Novo Contrato", href: "/contratos/novo", icon: FileSignature, roles: CADASTRO_ROLES },
        { name: "Orçamento", href: "/orcamentos", icon: Calculator, roles: CADASTRO_ROLES },
        { name: "Cronograma", href: "/cronograma", icon: Calendar, roles: CADASTRO_ROLES },
        { name: "Empresa", href: "/empresas/nova", icon: Building2, roles: CADASTRO_ROLES },
      ],
    },
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
    {
      name: "Diário de Obras",
      href: isContratoCtx ? `/contratos/${ctxId}?tab=diario` : `/empresa/objetos/${ctxId}/diario`,
      icon: BookOpen,
      // Medições e Diário são exclusivos de EMPRESA (executora) e APOIO_N2+.
      // APOIO_N1 e FISCAL não acessam.
      roles: ["EMPRESA", "APOIO_N2", "COORDENADOR", "SECRETARIO", "ENGENHEIRO"],
    },
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
    {
      name: "Gestão",
      href: "/gestao",
      icon: Users,
      roles: ["COORDENADOR", "SECRETARIO"],
    },
  ];

  const userRole = (user?.tipo as Role) || "EMPRESA";
  const canSee = (roles?: Role[]) => !roles || roles.includes(userRole);
  const navigation = allNav
    .filter((item) => canSee(item.roles))
    .map((item) =>
      item.children
        ? { ...item, children: item.children.filter((c) => canSee(c.roles)) }
        : item
    );

  const isItemActive = (item: NavItem): boolean => {
    // Itens com ?tab= — só ativo quando exatamente aquele tab está na URL
    if (item.href.includes("?tab=")) {
      return location.pathname + location.search === item.href;
    }
    // Contratos — ativo na listagem OU no detalhe sem tab (ou tab=detalhes),
    // mas NUNCA em /contratos/novo (essa rota pertence ao "Cadastrar").
    if (item.href === "/contratos") {
      if (location.pathname === "/contratos/novo") return false;
      const tab = new URLSearchParams(location.search).get("tab");
      return (
        location.pathname === "/contratos" ||
        (location.pathname.startsWith("/contratos/") && (!tab || tab === "detalhes"))
      );
    }
    // Empresas — ativo na listagem/detalhe, mas não em /empresas/nova (Cadastrar).
    if (item.href === "/empresas") {
      if (location.pathname === "/empresas/nova") return false;
      return location.pathname.startsWith("/empresas");
    }
    // Demais itens — match simples por prefixo
    return location.pathname.startsWith(item.href);
  };

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
            // Item expansível (ex: "Cadastrar") — renderiza um grupo com submenu.
            if (item.children) {
              if (item.children.length === 0) return null;
              const childActive = item.children.some((c) => location.pathname === c.href);
              return (
                <li key={item.name} className="relative">
                  <button
                    type="button"
                    onClick={() => setCadastrarOpen((v) => !v)}
                    className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 overflow-hidden ${
                      childActive
                        ? "bg-gradient-to-r from-white/[0.13] to-white/[0.04] text-white"
                        : "text-white/60 hover:bg-white/[0.07] hover:text-white/90"
                    }`}
                  >
                    <item.icon
                      className={`h-5 w-5 shrink-0 transition-all duration-200 ${
                        childActive
                          ? "text-accent-400 drop-shadow-[0_0_6px_rgba(200,73,24,0.7)]"
                          : "text-white/40 group-hover:text-white/70"
                      }`}
                    />
                    <span className={`flex-1 text-left ${childActive ? "font-semibold" : ""}`}>
                      {item.name}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-white/40 transition-transform duration-200 ${
                        cadastrarOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {cadastrarOpen && (
                    <ul className="mt-1 ml-4 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                      {item.children.map((child) => {
                        const active = location.pathname === child.href;
                        return (
                          <li key={child.name}>
                            <Link
                              to={child.href}
                              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                                active
                                  ? "bg-white/[0.1] text-white font-semibold"
                                  : "text-white/55 hover:bg-white/[0.06] hover:text-white/90"
                              }`}
                            >
                              {child.icon && (
                                <child.icon
                                  className={`h-4 w-4 shrink-0 ${
                                    active ? "text-accent-400" : "text-white/40"
                                  }`}
                                />
                              )}
                              {child.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            const isActive = isItemActive(item);
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
