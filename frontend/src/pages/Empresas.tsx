import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, Briefcase, HardHat, Plus, Pencil, Search,
  Loader2, AlertCircle, Mail, Phone, MapPin,
} from "lucide-react";
import api from "@/services/api";
import { useAuthStore } from "@/store/auth";
import type { EmpresaListItem, Role } from "@/types";

const ROLES_EDICAO: Role[] = ["APOIO_N2", "COORDENADOR", "SECRETARIO", "ENGENHEIRO"];

const Card = ({ icon: Icon, label, value, cls }: { icon: typeof Building2; label: string; value: number; cls: string }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${cls}`}>
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  </div>
);

const Empresas = () => {
  const [busca, setBusca] = useState("");
  const user = useAuthStore((s) => s.user);
  const podeEditar = ROLES_EDICAO.includes((user?.tipo as Role) || "EMPRESA");

  const { data: empresas = [], isLoading, isError } = useQuery<EmpresaListItem[]>({
    queryKey: ["empresas"],
    queryFn: async () => {
      const { data } = await api.get("/empresas");
      return Array.isArray(data) ? data : [];
    },
  });

  const totais = useMemo(() => ({
    empresas: empresas.length,
    contratos: empresas.reduce((s, e) => s + (e.total_contratos || 0), 0),
    objetos: empresas.reduce((s, e) => s + (e.total_objetos || 0), 0),
  }), [empresas]);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return empresas;
    return empresas.filter((e) =>
      e.razao_social.toLowerCase().includes(q) ||
      (e.nome_fantasia || "").toLowerCase().includes(q) ||
      (e.cnpj || "").toLowerCase().includes(q) ||
      (e.municipio || "").toLowerCase().includes(q)
    );
  }, [empresas, busca]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">Cadastro</p>
          <h2 className="text-2xl font-bold text-slate-800">Empresas Executoras</h2>
          <p className="text-sm text-slate-500 mt-1">Empresas contratadas para execução das objetos.</p>
        </div>
        {podeEditar && (
          <Link
            to="/empresas/nova"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-700/20 hover:bg-brand-500 transition-all"
          >
            <Plus className="h-4 w-4" /> Nova empresa
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card icon={Building2} label="Empresas cadastradas" value={totais.empresas} cls="bg-sky-50 text-sky-600" />
        <Card icon={Briefcase} label="Contratos vinculados" value={totais.contratos} cls="bg-brand-50 text-brand-700" />
        <Card icon={HardHat} label="Objetos executadas" value={totais.objetos} cls="bg-accent-50 text-accent-600" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Empresas cadastradas <span className="text-slate-400">({filtradas.length})</span></h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar empresa..."
              className="w-56 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-slate-300 animate-spin" /></div>
        ) : isError ? (
          <div className="flex items-center gap-3 m-5 bg-rose-50 border border-rose-200 rounded-xl p-4">
            <AlertCircle className="h-5 w-5 text-rose-500" />
            <p className="text-sm text-rose-700">Erro ao carregar empresas.</p>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-300">
            <Building2 className="h-12 w-12 mb-3" />
            <p className="text-sm font-medium">{busca ? "Nenhuma empresa encontrada" : "Nenhuma empresa cadastrada"}</p>
            {podeEditar && !busca && (
              <Link to="/empresas/nova" className="mt-3 text-sm text-brand-700 hover:underline">Cadastrar a primeira →</Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtradas.map((e) => (
              <div key={e.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <Link to={`/empresas/${e.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 shrink-0">
                    <Building2 className="h-5 w-5 text-sky-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{e.razao_social}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400 mt-0.5">
                      {e.cnpj && <span>CNPJ: {e.cnpj}</span>}
                      {e.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{e.email}</span>}
                      {e.telefone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{e.telefone}</span>}
                      {e.municipio && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.municipio}{e.uf ? `/${e.uf}` : ""}</span>}
                    </div>
                  </div>
                </Link>
                <div className="hidden md:flex items-center gap-4 text-center shrink-0">
                  <div>
                    <p className="text-sm font-bold text-slate-700">{e.total_contratos}</p>
                    <p className="text-[10px] text-slate-400">contratos</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{e.total_objetos}</p>
                    <p className="text-[10px] text-slate-400">objetos</p>
                  </div>
                </div>
                {podeEditar && (
                  <Link
                    to={`/empresas/${e.id}/editar`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors shrink-0"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Empresas;
