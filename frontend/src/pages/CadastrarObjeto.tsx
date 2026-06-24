import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseFormRegisterReturn } from "react-hook-form";
import { HardHat, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { AxiosError } from "axios";
import api from "@/services/api";
import type { Contrato } from "@/types";

const schema = z.object({
  titulo: z.string().min(3, "Informe o título do objeto"),
  descricao: z.string().min(10, "Descreva o escopo do objeto (mínimo 10 caracteres)"),
  orgao: z.string().optional(),
  municipio: z.string().min(2, "Informe o município"),
  endereco: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  raio_geofencing_metros: z.string().optional(),
  status: z.enum(["PLANEJADA", "EM_EXECUCAO", "PARALISADA", "CONCLUIDA"]),
  data_inicio: z.string().optional(),
  data_fim_prevista: z.string().optional(),
});

type CadastrarObjetoValues = z.infer<typeof schema>;

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

const CadastrarObjeto = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const contratoId = searchParams.get("contrato_id");
  const [apiError, setApiError] = useState("");

  // Quando vindo do detalhe de um contrato, exibe a qual documento-mãe o objeto
  // será vinculado.
  const { data: contrato } = useQuery<Contrato>({
    queryKey: ["contrato", contratoId],
    queryFn: async () => {
      const { data } = await api.get(`/contratos/${contratoId}`);
      return data;
    },
    enabled: !!contratoId,
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
    formState: { errors, isSubmitting },
  } = useForm<CadastrarObjetoValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "PLANEJADA", raio_geofencing_metros: "200" },
  });

  const onSubmit = async (data: CadastrarObjetoValues) => {
    setApiError("");
    try {
      const { data: objeto } = await api.post("/objetos", {
        titulo: data.titulo,
        descricao: data.descricao,
        orgao: data.orgao || null,
        municipio: data.municipio,
        endereco: data.endereco || null,
        latitude: data.latitude ? Number(data.latitude) : null,
        longitude: data.longitude ? Number(data.longitude) : null,
        raio_geofencing_metros: data.raio_geofencing_metros ? Number(data.raio_geofencing_metros) : 200,
        status: data.status,
        data_inicio: data.data_inicio || null,
        data_fim_prevista: data.data_fim_prevista || null,
        contrato_id: contratoId || null,
      });
      queryClient.invalidateQueries({ queryKey: ["objetos"] });
      if (contratoId) {
        // Volta ao documento-mãe, que passa a listar este objeto.
        queryClient.invalidateQueries({ queryKey: ["contrato-objetos", contratoId] });
        navigate(`/contratos/${contratoId}`);
      } else {
        navigate(`/objetos/${objeto.id}`);
      }
    } catch (err) {
      const ax = err as AxiosError<{ detail?: string }>;
      setApiError(ax.response?.data?.detail || "Erro ao cadastrar o objeto. Tente novamente.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to={contratoId ? `/contratos/${contratoId}` : "/objetos"} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700 transition-colors">
        <ArrowLeft className="h-4 w-4" />{contratoId ? "Voltar para o contrato" : "Voltar para Objetos"}
      </Link>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
            <HardHat className="h-6 w-6 text-brand-700" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Cadastrar novo objeto</h1>
            <p className="text-sm text-slate-500">Ex.: construção de uma escola, ginásio, unidade de saúde.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {apiError && (
            <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl p-3">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
              <p className="text-sm text-rose-700">{apiError}</p>
            </div>
          )}

          <div className="flex items-start gap-2.5 bg-sky-50 border border-sky-100 rounded-xl p-3">
            <Info className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
            <p className="text-xs text-sky-700">
              {contrato ? (
                <>Este objeto será vinculado ao contrato <strong>Nº {contrato.numero_contrato}</strong> (documento-mãe).
                Um contrato pode ter vários objetos (obra, serviço, atividades correlatas).</>
              ) : (
                <>O <strong>objeto</strong> é aquilo que está sendo contratado — uma obra, um serviço ou um conjunto
                de atividades. Ele pode ser vinculado a um contrato (documento-mãe) agora ou depois.</>
              )}
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Identificação</h2>
            <Field label="Título do objeto" id="titulo" required placeholder="Ex.: Construção da Escola Estadual Cidade Nova"
              error={errors.titulo?.message} registration={register("titulo")} />
            <div className="space-y-1.5">
              <label htmlFor="descricao" className="block text-sm font-medium text-slate-700">
                Descrição (objeto)<span className="text-rose-500 ml-0.5">*</span>
              </label>
              <textarea
                id="descricao"
                rows={3}
                placeholder="Descreva o escopo geral do objeto — será usado como objeto do contrato..."
                {...register("descricao")}
                className={`block w-full rounded-xl border ${errors.descricao ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-slate-50"} py-2.5 px-3 text-sm placeholder:text-slate-400 focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all resize-y`}
              />
              {errors.descricao && <p className="text-xs text-rose-600 mt-0.5">{errors.descricao.message}</p>}
            </div>
            <Field label="Órgão demandante" id="orgao" placeholder="Ex.: SEEC, SESAP, DER"
              error={errors.orgao?.message} registration={register("orgao")} />
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Localização</h2>
            <div className="space-y-1.5">
              <label htmlFor="municipio" className="block text-sm font-medium text-slate-700">
                Município<span className="text-rose-500 ml-0.5">*</span>
              </label>
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
            <Field label="Endereço" id="endereco" placeholder="Rua, número, bairro"
              error={errors.endereco?.message} registration={register("endereco")} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Latitude" id="latitude" type="number" placeholder="-5.7945"
                error={errors.latitude?.message} registration={register("latitude")} />
              <Field label="Longitude" id="longitude" type="number" placeholder="-35.2110"
                error={errors.longitude?.message} registration={register("longitude")} />
              <Field label="Raio de geofencing (m)" id="raio_geofencing_metros" type="number" placeholder="200"
                error={errors.raio_geofencing_metros?.message} registration={register("raio_geofencing_metros")} />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cronograma e situação</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="status" className="block text-sm font-medium text-slate-700">Status</label>
                <select
                  id="status"
                  {...register("status")}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all"
                >
                  <option value="PLANEJADA">Planejada</option>
                  <option value="EM_EXECUCAO">Em execução</option>
                  <option value="PARALISADA">Paralisada</option>
                  <option value="CONCLUIDA">Concluída</option>
                </select>
              </div>
              <Field label="Data de início" id="data_inicio" type="date"
                error={errors.data_inicio?.message} registration={register("data_inicio")} />
              <Field label="Conclusão prevista" id="data_fim_prevista" type="date"
                error={errors.data_fim_prevista?.message} registration={register("data_fim_prevista")} />
            </div>
          </section>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/objetos")}
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
              Cadastrar objeto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CadastrarObjeto;
