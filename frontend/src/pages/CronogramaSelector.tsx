/**
 * CronogramaSelector — rota /cronograma
 *
 * Lista todos os contratos e seus objetos. Para cada objeto exibe o badge
 * da versão ativa do cronograma (ou "Sem cronograma") e um botão de ação
 * para criar a Linha de Base ou um Novo Replanejamento.
 *
 * "Cadastrar" (objeto sem versão) abre o editor em modo novo
 * (/cronograma/novo/:objetoId); a versão só é criada ao salvar o grid.
 * "Editar / Replanejar" (objeto com versão ativa) abre o editor já populado
 * pela versão ativa (/cronograma/:versaoId/editar); salvar cria a próxima versão.
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays, ChevronRight,
  Calendar, Plus, Briefcase, Building2,
} from "lucide-react";
import api from "@/services/api";
import { fmtCurrency } from "@/utils/format";

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface ContratoItem {
  id: string;
  numero_contrato: string;
  objeto?: string;
  orgao?: string;
  valor_global?: number;
  empresa_ref?: { id: string; razao_social: string };
}

interface ObjetoItem {
  id: string;
  titulo: string;
  status?: string;
  contrato_id: string;
}

interface CronogramaVersaoInfo {
  id: string;
  numero_versao: number;
  ativa: boolean;
  linha_de_base: boolean;
  criado_em: string;
  total_periodos: number;
}

// ─── Sub-componente: badge de versão ───────────────────────────────────────

const VersionBadge = ({ versao }: { versao: CronogramaVersaoInfo | null }) => {
  if (!versao) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
        Sem cronograma
      </span>
    );
  }
  const isBase = versao.linha_de_base;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
      isBase
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-sky-50 text-sky-700 border-sky-200"
    }`}>
      <CalendarDays className="h-3 w-3" />
      V{String(versao.numero_versao).padStart(2, "0")} — {isBase ? "Linha de Base" : "Replanejamento"}
      <span className="text-[10px] opacity-70">({versao.total_periodos} meses)</span>
    </span>
  );
};

// ─── Sub-componente: linha de objeto ───────────────────────────────────────

const ObjetoRow = ({ objeto, contratoId }: { objeto: ObjetoItem; contratoId: string }) => {
  const navigate = useNavigate();

  const { data: versaoAtiva, isLoading: versaoLoading } = useQuery<CronogramaVersaoInfo | null>({
    queryKey: ["cronograma-versao-ativa", objeto.id],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/cronograma/objetos/${objeto.id}/versoes/ativa`);
        return data;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  // "Cadastrar": abre o editor em modo novo (a versão V01 só é criada ao salvar).
  // "Editar / Replanejar": abre o editor populado pela versão ativa; salvar cria
  // a próxima versão (replanejamento).
  const handleAcao = () => {
    if (versaoAtiva) {
      navigate(`/cronograma/${versaoAtiva.id}/editar`);
    } else {
      navigate(`/cronograma/novo/${objeto.id}`);
    }
  };

  return (
    <div className="px-4 py-3 border-t border-slate-50 first:border-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        {/* Info do objeto */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Link
              to={`/contratos/${contratoId}?objeto=${objeto.id}&tab=cronograma`}
              className="text-sm font-semibold text-slate-800 hover:text-brand-700 transition-colors line-clamp-1"
            >
              {objeto.titulo}
            </Link>
            {versaoLoading ? (
              <span className="h-4 w-24 bg-slate-100 rounded animate-pulse inline-block" />
            ) : (
              <VersionBadge versao={versaoAtiva ?? null} />
            )}
          </div>
        </div>

        {/* Botão de ação */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAcao}
            disabled={versaoLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-700 rounded-lg hover:bg-brand-500 shadow-sm shadow-brand-700/20 disabled:opacity-50 transition-all"
          >
            {versaoAtiva ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {versaoAtiva ? "Editar / Replanejar" : "Cadastrar"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Página principal ───────────────────────────────────────────────────────

const CronogramaSelector = () => {
  const [search, setSearch] = useState("");

  const { data: contratos = [], isLoading: contratosLoading } = useQuery<ContratoItem[]>({
    queryKey: ["contratos-cronograma"],
    queryFn: async () => {
      const { data } = await api.get("/contratos?limit=200");
      return Array.isArray(data) ? data : (data?.items ?? []);
    },
  });

  // Para cada contrato, carregamos os objetos
  const { data: objetosPorContrato = {} } = useQuery<Record<string, ObjetoItem[]>>({
    queryKey: ["objetos-por-contrato", contratos.map((c) => c.id)],
    queryFn: async () => {
      const result: Record<string, ObjetoItem[]> = {};
      await Promise.all(
        contratos.map(async (c) => {
          try {
            const { data } = await api.get(`/contratos/${c.id}/objetos`);
            result[c.id] = Array.isArray(data) ? data : [];
          } catch {
            result[c.id] = [];
          }
        })
      );
      return result;
    },
    enabled: contratos.length > 0,
  });

  const contratosFiltrados = contratos.filter((c) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      c.numero_contrato?.toLowerCase().includes(q) ||
      c.objeto?.toLowerCase().includes(q) ||
      c.orgao?.toLowerCase().includes(q) ||
      c.empresa_ref?.razao_social?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cronograma Físico-Financeiro</h1>
          <p className="text-sm text-slate-500 mt-1">
            Selecione um objeto para cadastrar ou editar o cronograma de execução.
          </p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar contrato, objeto, órgão..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72 pl-4 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all"
          />
        </div>
      </div>

      {/* Legenda de badges */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" /> Linha de Base (V01)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-sky-400" /> Replanejamento (V02+)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-slate-300" /> Sem cronograma
        </span>
      </div>

      {/* Lista de contratos */}
      {contratosLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : contratosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Calendar className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">Nenhum contrato encontrado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contratosFiltrados.map((c) => {
            const objetos = objetosPorContrato[c.id] ?? [];
            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                {/* Cabeçalho do contrato */}
                <div className="flex items-start gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200">
                    <Briefcase className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      Contrato Nº {c.numero_contrato}
                      {c.orgao && (
                        <span className="ml-2 text-xs font-normal text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                          {c.orgao}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                      {c.empresa_ref?.razao_social && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {c.empresa_ref.razao_social}
                        </span>
                      )}
                      {c.valor_global && (
                        <span className="text-xs text-slate-400">
                          {fmtCurrency(c.valor_global)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Objetos do contrato */}
                {objetos.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-slate-400 italic">
                    Nenhum objeto vinculado.
                  </p>
                ) : (
                  objetos.map((obj) => (
                    <ObjetoRow key={obj.id} objeto={obj} contratoId={c.id} />
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CronogramaSelector;
