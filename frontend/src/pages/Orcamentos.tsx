/**
 * Orcamentos — rota /orcamentos
 *
 * Lista e busca os orçamentos-template (banco de dados técnico). O código legível
 * (ORC-AAAA-NNNN) é o que se busca no momento de vincular a um Objeto.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calculator, Plus, Search, FileText } from "lucide-react";
import api from "@/services/api";
import type { OrcamentoResumo } from "@/types";

const fmtData = (d?: string | null) => {
  if (!d) return "—";
  const [ano, mes] = d.split("-");
  return `${mes}/${ano}`;
};

const Orcamentos = () => {
  const [search, setSearch] = useState("");

  const { data: orcamentos = [], isLoading } = useQuery<OrcamentoResumo[]>({
    queryKey: ["orcamentos", search],
    queryFn: async () => {
      const { data } = await api.get(`/orcamentos${search ? `?q=${encodeURIComponent(search)}` : ""}`);
      return Array.isArray(data) ? data : [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orçamentos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Banco de dados técnico da obra. Crie um orçamento e depois vincule-o a um objeto pelo código.
          </p>
        </div>
        <Link
          to="/orcamentos/novo"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-700/20 transition-all"
        >
          <Plus className="h-4 w-4" /> Novo Orçamento
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por código (ORC-...) ou título"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : orcamentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Calculator className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">Nenhum orçamento encontrado.</p>
          <Link to="/orcamentos/novo" className="mt-3 text-sm font-semibold text-brand-700 hover:underline">Criar o primeiro orçamento</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orcamentos.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  <FileText className="h-3 w-3" /> {o.codigo}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${o.status === "FINALIZADO" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {o.status === "FINALIZADO" ? "Finalizado" : "Rascunho"}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800 line-clamp-2">{o.titulo}</p>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>Data-base: {fmtData(o.data_base)}</span>
                <span>BDI: {Number(o.bdi_percentual)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orcamentos;
