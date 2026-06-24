import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Building2, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { AxiosError } from "axios";
import api from "@/services/api";
import type { EmpresaDetalhe } from "@/types";

const schema = z.object({
  razao_social: z.string().min(2, "Informe a razão social"),
  cnpj: z.string().optional(),
  nome_fantasia: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  municipio: z.string().optional(),
  uf: z.string().max(2, "Use a sigla (2 letras)").optional().or(z.literal("")),
  representante_legal: z.string().optional(),
  observacoes: z.string().optional(),
});

type EmpresaFormValues = z.infer<typeof schema>;

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

const EmpresaForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const isEdicao = !!id;
  const [apiError, setApiError] = useState("");

  const { data: empresa, isLoading: carregando } = useQuery<EmpresaDetalhe>({
    queryKey: ["empresa", id],
    queryFn: async () => {
      const { data } = await api.get(`/empresas/${id}`);
      return data;
    },
    enabled: isEdicao,
  });

  const { data: municipios = [] } = useQuery<string[]>({
    queryKey: ["municipios"],
    queryFn: async () => {
      const { data } = await api.get("/objetos/municipios/lista");
      return Array.isArray(data) ? data : [];
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmpresaFormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (empresa) {
      reset({
        razao_social: empresa.razao_social ?? "",
        cnpj: empresa.cnpj ?? "",
        nome_fantasia: empresa.nome_fantasia ?? "",
        email: empresa.email ?? "",
        telefone: empresa.telefone ?? "",
        endereco: empresa.endereco ?? "",
        municipio: empresa.municipio ?? "",
        uf: empresa.uf ?? "",
        representante_legal: empresa.representante_legal ?? "",
        observacoes: empresa.observacoes ?? "",
      });
    }
  }, [empresa, reset]);

  const onSubmit = async (data: EmpresaFormValues) => {
    setApiError("");
    // Strings vazias viram null para não poluir o banco
    const payload = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === "" ? null : v])
    );
    try {
      let novoId = id;
      if (isEdicao) {
        await api.patch(`/empresas/${id}`, payload);
      } else {
        const { data: criada } = await api.post("/empresas", payload);
        novoId = criada.id;
      }
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
      if (id) queryClient.invalidateQueries({ queryKey: ["empresa", id] });
      navigate(`/empresas/${novoId}`);
    } catch (err) {
      const ax = err as AxiosError<{ detail?: string }>;
      setApiError(ax.response?.data?.detail || "Erro ao salvar a empresa. Tente novamente.");
    }
  };

  if (isEdicao && carregando) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 text-slate-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to={isEdicao ? `/empresas/${id}` : "/empresas"} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700 transition-colors">
        <ArrowLeft className="h-4 w-4" />{isEdicao ? "Voltar para a empresa" : "Voltar para Empresas"}
      </Link>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50">
            <Building2 className="h-6 w-6 text-sky-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              {isEdicao ? "Editar empresa" : "Cadastrar nova empresa"}
            </h1>
            <p className="text-sm text-slate-500">Dados cadastrais da empresa executora.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {apiError && (
            <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl p-3">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
              <p className="text-sm text-rose-700">{apiError}</p>
            </div>
          )}

          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Identificação</h2>
            <Field label="Razão social" id="razao_social" required placeholder="Ex.: Construtora Potiguar Ltda."
              error={errors.razao_social?.message} registration={register("razao_social")} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nome fantasia" id="nome_fantasia" placeholder="Nome fantasia"
                error={errors.nome_fantasia?.message} registration={register("nome_fantasia")} />
              <Field label="CNPJ" id="cnpj" placeholder="00.000.000/0000-00"
                error={errors.cnpj?.message} registration={register("cnpj")} />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Contato</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="E-mail" id="email" type="email" placeholder="contato@empresa.com.br"
                error={errors.email?.message} registration={register("email")} />
              <Field label="Telefone" id="telefone" placeholder="(84) 99999-9999"
                error={errors.telefone?.message} registration={register("telefone")} />
            </div>
            <Field label="Representante legal" id="representante_legal" placeholder="Nome do responsável"
              error={errors.representante_legal?.message} registration={register("representante_legal")} />
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Endereço</h2>
            <Field label="Logradouro" id="endereco" placeholder="Rua, número, bairro"
              error={errors.endereco?.message} registration={register("endereco")} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label htmlFor="municipio" className="block text-sm font-medium text-slate-700">Município</label>
                <select
                  id="municipio"
                  {...register("municipio")}
                  className={`block w-full rounded-xl border ${errors.municipio ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-slate-50"} py-2.5 px-3 text-sm focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all`}
                >
                  <option value="">Selecione...</option>
                  {municipios.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {errors.municipio && <p className="text-xs text-rose-600 mt-0.5">{errors.municipio.message}</p>}
              </div>
              <Field label="UF" id="uf" placeholder="RN"
                error={errors.uf?.message} registration={register("uf")} />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Observações</h2>
            <div className="space-y-1.5">
              <label htmlFor="observacoes" className="block text-sm font-medium text-slate-700">Anotações internas</label>
              <textarea
                id="observacoes"
                rows={3}
                placeholder="Informações complementares sobre a empresa..."
                {...register("observacoes")}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm placeholder:text-slate-400 focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all resize-y"
              />
            </div>
          </section>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(isEdicao ? `/empresas/${id}` : "/empresas")}
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
              {isEdicao ? "Salvar alterações" : "Cadastrar empresa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmpresaForm;
