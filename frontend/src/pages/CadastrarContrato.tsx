import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Briefcase, ArrowLeft, Loader2, CheckCircle2, AlertCircle, HardHat } from "lucide-react";
import { AxiosError } from "axios";
import api from "@/services/api";
import type { EmpresaListItem, Obra } from "@/types";

interface OrgaoOption {
  id: string;
  sigla: string;
  nome?: string | null;
}

const schema = z.object({
  numero_contrato: z.string().min(1, "Informe o número do contrato"),
  numero_processo: z.string().min(1, "Informe o número do processo"),
  objeto: z.string().min(3, "Descreva o objeto do contrato"),
  valor_global: z.string().min(1, "Informe o valor global"),
  empresa_ref_id: z.string().optional(),
  orgao_id: z.string().optional(),
  data_assinatura: z.string().optional(),
  data_vigencia: z.string().optional(),
});

type CadastrarContratoValues = z.infer<typeof schema>;

interface FieldProps {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  registration: UseFormRegisterReturn;
}

const Field = ({ label, id, type = "text", placeholder, required, error, registration }: FieldProps) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-slate-700">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      {...registration}
      className={`block w-full rounded-xl border ${error ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-slate-50"} py-2.5 px-3 text-sm placeholder:text-slate-400 focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all`}
    />
    {error && <p className="text-xs text-rose-600 mt-0.5">{error}</p>}
  </div>
);

const CadastrarContrato = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { obraId } = useParams<{ obraId: string }>();
  const [apiError, setApiError] = useState("");

  const { data: obra } = useQuery<Obra>({
    queryKey: ["obra", obraId],
    queryFn: async () => {
      const { data } = await api.get(`/obras/${obraId}`);
      return data;
    },
    enabled: !!obraId,
  });

  const { data: empresas = [] } = useQuery<EmpresaListItem[]>({
    queryKey: ["empresas"],
    queryFn: async () => {
      const { data } = await api.get("/empresas");
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: orgaos = [] } = useQuery<OrgaoOption[]>({
    queryKey: ["orgaos"],
    queryFn: async () => {
      const { data } = await api.get("/orgaos");
      return Array.isArray(data) ? data : [];
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CadastrarContratoValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: CadastrarContratoValues) => {
    setApiError("");
    try {
      const { data: contrato } = await api.post("/contratos", {
        numero_contrato: data.numero_contrato,
        numero_processo: data.numero_processo,
        objeto: data.objeto,
        valor_global: Number(data.valor_global),
        empresa_ref_id: data.empresa_ref_id || null,
        orgao_id: data.orgao_id || null,
        data_assinatura: data.data_assinatura || null,
        data_vigencia: data.data_vigencia || null,
        obra_id: obraId,
      });
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      queryClient.invalidateQueries({ queryKey: ["obra", obraId, "contratos"] });
      navigate(`/contratos/${contrato.id}`);
    } catch (err) {
      const ax = err as AxiosError<{ detail?: string }>;
      setApiError(ax.response?.data?.detail || "Erro ao cadastrar o contrato. Tente novamente.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to={obraId ? `/obras/${obraId}` : "/obras"} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700 transition-colors">
        <ArrowLeft className="h-4 w-4" />Voltar para a obra
      </Link>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50">
            <Briefcase className="h-6 w-6 text-sky-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Cadastrar contrato</h1>
            <p className="text-sm text-slate-500">Vinculado a uma obra, referente a um objeto específico.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {obra && (
            <div className="flex items-start gap-2.5 bg-brand-50 border border-brand-100 rounded-xl p-3">
              <HardHat className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
              <p className="text-xs text-brand-800">
                Obra: <strong>{obra.titulo}</strong>
                {obra.municipio ? ` — ${obra.municipio}` : ""}
              </p>
            </div>
          )}

          {apiError && (
            <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl p-3">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
              <p className="text-sm text-rose-700">{apiError}</p>
            </div>
          )}

          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Identificação</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Número do contrato" id="numero_contrato" required placeholder="Ex.: 006/2026"
                error={errors.numero_contrato?.message} registration={register("numero_contrato")} />
              <Field label="Número do processo" id="numero_processo" required placeholder="Ex.: 06010043.002919/2024-93"
                error={errors.numero_processo?.message} registration={register("numero_processo")} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="objeto" className="block text-sm font-medium text-slate-700">
                Objeto do contrato<span className="text-rose-500 ml-0.5">*</span>
              </label>
              <textarea
                id="objeto"
                rows={3}
                placeholder="Ex.: Instalação do sistema de ar-condicionado do bloco A"
                {...register("objeto")}
                className={`block w-full rounded-xl border ${errors.objeto ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-slate-50"} py-2.5 px-3 text-sm placeholder:text-slate-400 focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all resize-y`}
              />
              {errors.objeto && <p className="text-xs text-rose-600 mt-0.5">{errors.objeto.message}</p>}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Empresa e órgão</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="empresa_ref_id" className="block text-sm font-medium text-slate-700">Empresa executora</label>
                <select
                  id="empresa_ref_id"
                  {...register("empresa_ref_id")}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all"
                >
                  <option value="">Selecione...</option>
                  {empresas.map((e) => (
                    <option key={e.id} value={e.id}>{e.razao_social}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="orgao_id" className="block text-sm font-medium text-slate-700">Órgão demandante</label>
                <select
                  id="orgao_id"
                  {...register("orgao_id")}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all"
                >
                  <option value="">Selecione...</option>
                  {orgaos.map((o) => (
                    <option key={o.id} value={o.id}>{o.sigla}{o.nome ? ` — ${o.nome}` : ""}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Valores e prazos</h2>
            <div className="space-y-1.5">
              <label htmlFor="valor_global" className="block text-sm font-medium text-slate-700">
                Valor global (R$)<span className="text-rose-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">R$</span>
                <input
                  id="valor_global"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...register("valor_global")}
                  className={`block w-full rounded-xl border ${errors.valor_global ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-slate-50"} py-2.5 pl-9 pr-3 text-sm focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all`}
                />
              </div>
              {errors.valor_global && <p className="text-xs text-rose-600 mt-0.5">{errors.valor_global.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Data de assinatura" id="data_assinatura" type="date"
                error={errors.data_assinatura?.message} registration={register("data_assinatura")} />
              <Field label="Vigência (fim)" id="data_vigencia" type="date"
                error={errors.data_vigencia?.message} registration={register("data_vigencia")} />
            </div>
          </section>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(obraId ? `/obras/${obraId}` : "/obras")}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-700/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Cadastrar contrato
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CadastrarContrato;
