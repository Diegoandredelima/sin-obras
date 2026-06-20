import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, Briefcase, Hash, Calendar, ArrowLeft, Loader2, AlertCircle, HardHat } from "lucide-react";
import api from "@/services/api";
import { fmtCurrency, fmtDate } from "@/utils/format";

interface EmpresaDetalhe {
  id: string;
  razao_social: string;
  cnpj: string | null;
  criado_em: string;
  total_contratos: number;
  total_obras: number;
}

interface ContratoResumo {
  id: string;
  numero_contrato: string;
  numero_processo: string;
  valor_global: number;
  data_assinatura: string | null;
  data_vigencia: string | null;
  objeto: string | null;
  orgao: string | null;
}

const DetalheEmpresa = () => {
  const { id } = useParams<{ id: string }>();

  const { data: empresa, isLoading, isError } = useQuery<EmpresaDetalhe>({
    queryKey: ["empresa", id],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const { data: contratos = [] } = useQuery<ContratoResumo[]>({
    queryKey: ["empresa", id, "contratos"],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${id}/contratos`);
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="h-8 w-8 text-slate-300 animate-spin" />
    </div>
  );

  if (isError || !empresa) return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <AlertCircle className="h-12 w-12 text-rose-300 mb-4" />
      <p className="text-lg font-semibold text-slate-700">Empresa não encontrada.</p>
      <Link to="/contratos" className="mt-4 text-sm text-emerald-600 hover:underline">← Voltar para Contratos</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/contratos" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors">
        <ArrowLeft className="h-4 w-4" />Contratos
      </Link>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-sky-600 to-sky-800 h-20" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-8 mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg ring-4 ring-white">
              <Building2 className="h-8 w-8 text-sky-600" />
            </div>
            <div className="min-w-0 pb-1">
              <h1 className="text-xl font-bold text-slate-800 truncate">{empresa.razao_social}</h1>
              <p className="text-sm text-slate-500">
                {empresa.cnpj ? `CNPJ: ${empresa.cnpj}` : "CNPJ não informado"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-sky-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-sky-700">{empresa.total_contratos}</p>
              <p className="text-xs text-sky-600 font-medium">Contratos</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">{empresa.total_obras}</p>
              <p className="text-xs text-emerald-600 font-medium">Obras</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-700">{contratos.length}</p>
              <p className="text-xs text-slate-500 font-medium">Ativos</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Contratos vinculados</h2>
            <span className="text-xs text-slate-400">({contratos.length})</span>
          </div>

          {contratos.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-4">Nenhum contrato vinculado.</p>
          ) : (
            <div className="divide-y divide-slate-50 border border-slate-100 rounded-xl overflow-hidden">
              {contratos.map((c) => (
                <Link
                  key={c.id}
                  to={`/contratos/${c.id}`}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      Contrato Nº {c.numero_contrato}
                      {c.orgao && <span className="ml-2 text-xs font-normal bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{c.orgao}</span>}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Processo: {c.numero_processo}
                      {c.data_assinatura && ` • Assinado em ${fmtDate(c.data_assinatura)}`}
                    </p>
                    {c.objeto && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{c.objeto}</p>}
                  </div>
                  <div className="text-sm font-semibold text-slate-700 shrink-0">
                    {fmtCurrency(c.valor_global)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalheEmpresa;
