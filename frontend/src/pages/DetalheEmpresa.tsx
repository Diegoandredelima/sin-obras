import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, Briefcase, ArrowLeft, Loader2, AlertCircle, Pencil,
  Mail, Phone, MapPin, User, FileText,
} from "lucide-react";
import api from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { fmtCurrency, fmtDate } from "@/utils/format";
import type { EmpresaDetalhe as EmpresaDetalheType, Role } from "@/types";

type EmpresaDetalhe = EmpresaDetalheType;

const ROLES_EDICAO: Role[] = ["APOIO_N2", "COORDENADOR", "SECRETARIO", "ENGENHEIRO"];

const InfoRow = ({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value?: string | null }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm text-slate-700 break-words">{value}</p>
      </div>
    </div>
  );
};

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
  const user = useAuthStore((s) => s.user);
  const podeEditar = ROLES_EDICAO.includes((user?.tipo as Role) || "EMPRESA");

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
      <Link to="/empresas" className="mt-4 text-sm text-brand-700 hover:underline">← Voltar para Empresas</Link>
    </div>
  );

  const temContato = empresa.email || empresa.telefone || empresa.representante_legal;
  const temEndereco = empresa.endereco || empresa.municipio || empresa.uf;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/empresas" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700 transition-colors">
        <ArrowLeft className="h-4 w-4" />Empresas
      </Link>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-sky-600 to-sky-800 h-20" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-8 mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg ring-4 ring-white">
              <Building2 className="h-8 w-8 text-sky-600" />
            </div>
            <div className="min-w-0 pb-1 flex-1">
              <h1 className="text-xl font-bold text-slate-800 truncate">{empresa.razao_social}</h1>
              <p className="text-sm text-slate-500">
                {empresa.nome_fantasia ? `${empresa.nome_fantasia} • ` : ""}
                {empresa.cnpj ? `CNPJ: ${empresa.cnpj}` : "CNPJ não informado"}
              </p>
            </div>
            {podeEditar && (
              <Link
                to={`/empresas/${empresa.id}/editar`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors shrink-0 mb-1"
              >
                <Pencil className="h-4 w-4" /> Editar
              </Link>
            )}
          </div>

          {(temContato || temEndereco) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-6 bg-slate-50 rounded-xl p-4">
              <InfoRow icon={Mail} label="E-mail" value={empresa.email} />
              <InfoRow icon={Phone} label="Telefone" value={empresa.telefone} />
              <InfoRow icon={User} label="Representante legal" value={empresa.representante_legal} />
              <InfoRow icon={MapPin} label="Endereço" value={[empresa.endereco, [empresa.municipio, empresa.uf].filter(Boolean).join("/")].filter(Boolean).join(" — ") || null} />
              {empresa.observacoes && (
                <div className="sm:col-span-2">
                  <InfoRow icon={FileText} label="Observações" value={empresa.observacoes} />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-sky-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-sky-700">{empresa.total_contratos}</p>
              <p className="text-xs text-sky-600 font-medium">Contratos</p>
            </div>
            <div className="bg-brand-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-brand-700">{empresa.total_objetos}</p>
              <p className="text-xs text-brand-600 font-medium">Objetos</p>
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
