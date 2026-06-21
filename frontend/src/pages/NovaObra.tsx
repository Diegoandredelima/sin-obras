import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Building2, MapPin, DollarSign, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import api from "@/services/api";

const steps = ["Dados Gerais", "Localização", "Contrato"];

const schema = z.object({
  titulo: z.string().min(3, "Título deve ter ao menos 3 caracteres"),
  descricao: z.string().optional(),
  municipio: z.string().min(2, "Informe o município"),
  endereco: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  raio_geofencing_metros: z.string(),
  valor_contrato: z.string().min(1, "Informe o valor do contrato"),
  data_inicio: z.string().optional(),
  data_fim_prevista: z.string().optional(),
});

type NovaObraData = z.infer<typeof schema>;

const STEP_FIELDS: (keyof NovaObraData)[][] = [
  ["titulo", "municipio"],
  [],
  ["valor_contrato"],
];

interface ObraFormFieldProps {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  registration: UseFormRegisterReturn;
}

const ObraFormField = ({ label, id, type = "text", placeholder, required, error, registration }: ObraFormFieldProps) => (
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

const NovaObra = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<NovaObraData>({
    resolver: zodResolver(schema),
    defaultValues: { raio_geofencing_metros: "200" },
  });

  const handleNext = async () => {
    const fields = STEP_FIELDS[step];
    if (fields.length > 0) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    setStep(step + 1);
  };

  const onSubmit = async (data: NovaObraData) => {
    setApiError("");
    try {
      await api.post("/obras", {
        titulo: data.titulo,
        descricao: data.descricao ?? "",
        municipio: data.municipio,
        endereco: data.endereco ?? "",
        latitude: data.latitude ? Number(data.latitude) : null,
        longitude: data.longitude ? Number(data.longitude) : null,
        raio_geofencing_metros: Number(data.raio_geofencing_metros),
        valor_contrato: Number(data.valor_contrato),
        data_inicio: data.data_inicio ?? null,
        data_fim_prevista: data.data_fim_prevista ?? null,
      });
      navigate("/obras");
    } catch (err: unknown) {
      const detail =
        err && typeof err === "object" && "response" in err
          ? (err.response as { data?: { detail?: string } })?.data?.detail
          : undefined;
      setApiError(detail || "Erro ao cadastrar a obra.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => step > 0 ? setStep(step - 1) : navigate("/obras")}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {step > 0 ? "Etapa anterior" : "Voltar para obras"}
      </button>

      <div>
        <h2 className="text-2xl font-bold text-slate-900">Cadastrar Nova Obra</h2>
        <p className="text-sm text-slate-400 mt-0.5">Preencha os dados em {steps.length} etapas</p>
      </div>

      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex-1 flex flex-col gap-1.5">
            <div className={`h-1.5 rounded-full transition-all ${i <= step ? "bg-brand-700" : "bg-slate-200"}`} />
            <span className={`text-xs font-medium ${i === step ? "text-brand-700" : i < step ? "text-slate-500" : "text-slate-300"}`}>
              {i + 1}. {s}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          {step === 0 && <Building2 className="h-5 w-5 text-brand-700" />}
          {step === 1 && <MapPin className="h-5 w-5 text-brand-700" />}
          {step === 2 && <DollarSign className="h-5 w-5 text-brand-700" />}
          <h3 className="text-base font-semibold text-slate-900">{steps[step]}</h3>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {apiError && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm font-medium text-rose-600">{apiError}</div>
          )}

          {step === 0 && (
            <>
              <ObraFormField
                label="Título da Obra"
                id="titulo"
                placeholder="Ex: Construção do CRAS Cidade Nova"
                required
                error={errors.titulo?.message}
                registration={register("titulo")}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Descreva o escopo da obra..."
                  {...register("descricao")}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm placeholder:text-slate-400 focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all resize-none"
                />
              </div>
              <ObraFormField
                label="Município"
                id="municipio"
                placeholder="Ex: Natal"
                required
                error={errors.municipio?.message}
                registration={register("municipio")}
              />
            </>
          )}

          {step === 1 && (
            <>
              <ObraFormField
                label="Endereço Completo"
                id="endereco"
                placeholder="Rua, número, bairro"
                registration={register("endereco")}
              />
              <div className="grid grid-cols-2 gap-4">
                <ObraFormField
                  label="Latitude"
                  id="latitude"
                  type="number"
                  placeholder="-5.7945"
                  registration={register("latitude")}
                />
                <ObraFormField
                  label="Longitude"
                  id="longitude"
                  type="number"
                  placeholder="-35.2110"
                  registration={register("longitude")}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Raio de Geofencing (metros)</label>
                <input
                  type="number"
                  min="50"
                  max="2000"
                  {...register("raio_geofencing_metros")}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all"
                />
                <p className="text-xs text-slate-400">Raio máximo para check-in dos fiscais (padrão: 200m)</p>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Valor do Contrato (R$) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    {...register("valor_contrato")}
                    className={`block w-full rounded-xl border ${errors.valor_contrato ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-slate-50"} py-2.5 pl-9 pr-3 text-sm focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all`}
                  />
                </div>
                {errors.valor_contrato && (
                  <p className="text-xs text-rose-600 mt-0.5">{errors.valor_contrato.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ObraFormField
                  label="Data de Início"
                  id="data_inicio"
                  type="date"
                  registration={register("data_inicio")}
                />
                <ObraFormField
                  label="Data de Conclusão Prevista"
                  id="data_fim_prevista"
                  type="date"
                  registration={register("data_fim_prevista")}
                />
              </div>
            </>
          )}

          <div className="flex justify-end pt-2">
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-brand-700/20 hover:bg-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-700/30 transition-all"
              >
                Próxima Etapa →
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-brand-700/20 hover:bg-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-700/30 disabled:opacity-70 transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <><CheckCircle2 className="h-4 w-4" /> Cadastrar Obra</>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default NovaObra;
