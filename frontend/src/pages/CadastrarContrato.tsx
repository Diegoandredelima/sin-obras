import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, Briefcase, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { AxiosError } from "axios";
import api from "@/services/api";
import type { EmpresaListItem } from "@/types";

interface OrgaoOption {
  id: string;
  sigla: string;
  nome?: string | null;
}

interface UsuarioOption {
  id: string;
  nome: string;
}

const Field = ({ label, id, type = "text", placeholder, required, error, registration, step }: any) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-slate-700">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {type === "textarea" ? (
      <textarea
        id={id}
        placeholder={placeholder}
        rows={4}
        {...registration}
        className={`block w-full rounded-xl border ${error ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-slate-50"} py-2.5 px-3 text-sm placeholder:text-slate-400 focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all resize-none`}
      />
    ) : (
      <input
        id={id}
        type={type}
        step={step}
        placeholder={placeholder}
        {...registration}
        className={`block w-full rounded-xl border py-2.5 px-3 text-sm placeholder:text-slate-400 transition-all focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-700/10 ${error ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-slate-50 focus:bg-white"}`}
      />
    )}
    {error && <p className="text-xs text-rose-600 mt-0.5">{error}</p>}
  </div>
);

const Section = ({ title, children, defaultOpen = true }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        {isOpen ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
      </button>
      {isOpen && <div className="p-5 border-t border-slate-200 space-y-4">{children}</div>}
    </div>
  );
};

const CadastrarContrato = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState("");

  // O contrato é o documento-mãe. Os objetos são cadastrados em separado
  // (tela "Cadastrar objeto"), vinculando este contrato já criado.
  const [createdId, setCreatedId] = useState<string | null>(null);

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

  const { data: usuarios = [] } = useQuery<UsuarioOption[]>({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const { data } = await api.get("/auth/usuarios");
      return Array.isArray(data) ? data : [];
    },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<any>({
    defaultValues: { bloquear_quantidade_negativa: true, bloquear_acima_contratado: true },
  });

  const buildContratoPayload = (data: any) => ({
    numero_processo: data.numero_processo,
    link_processo: data.link_processo || null,
    numero_contrato: data.numero_contrato,
    valor_global: Number(data.valor_global),
    data_assinatura: data.data_assinatura || null,
    data_vigencia: data.data_vigencia || null,
    empresa_ref_id: data.empresa_ref_id || null,
    orgao_id: data.orgao_id || null,
    objeto: data.objeto || null,
    fiscal_id: data.fiscal_id || null,
    gestor_id: data.gestor_id || null,
    valor_reajustado: data.valor_reajustado ? Number(data.valor_reajustado) : null,
    valor_final: data.valor_final ? Number(data.valor_final) : null,
    recurso_federal: data.recurso_federal ? Number(data.recurso_federal) : null,
    recurso_estadual: data.recurso_estadual ? Number(data.recurso_estadual) : null,
    percentual_retencao: data.percentual_retencao ? Number(data.percentual_retencao) : null,
    numero_licitacao: data.numero_licitacao || null,
    // Regras de trava do lançamento de medição (Decisão 1). Default rígido.
    bloquear_quantidade_negativa: data.bloquear_quantidade_negativa ?? true,
    bloquear_acima_contratado: data.bloquear_acima_contratado ?? true,
  });

  const onSubmit = async (data: any) => {
    setApiError("");
    try {
      if (!createdId) {
        // Fase 1: cria SOMENTE o contrato e continua na mesma tela.
        const { data: contrato } = await api.post("/contratos", buildContratoPayload(data));
        queryClient.invalidateQueries({ queryKey: ["contratos"] });
        setCreatedId(contrato.id);
      } else {
        // Fase 2: salva alterações dos dados do contrato.
        await api.put(`/contratos/${createdId}`, buildContratoPayload(data));
        queryClient.invalidateQueries({ queryKey: ["contrato", createdId] });
      }
    } catch (err) {
      const ax = err as AxiosError<{ detail?: string }>;
      setApiError(ax.response?.data?.detail || "Erro ao salvar o contrato. Tente novamente.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <Link to="/contratos" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700 transition-colors">
        <ArrowLeft className="h-4 w-4" />Voltar para Contratos
      </Link>

      <div className="flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50">
          <Briefcase className="h-6 w-6 text-sky-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Cadastrar Contrato</h1>
          <p className="text-sm text-slate-500">O documento-mãe que formaliza a execução de um ou mais objetos. Os objetos são cadastrados à parte e vinculados a este contrato.</p>
        </div>
      </div>

      {createdId && (
        <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-700">
            Contrato criado. Agora cadastre os <strong>objetos</strong> deste contrato pelo botão
            <strong> "Cadastrar objeto"</strong>, ou clique em <strong>Concluir</strong> para abrir o contrato.
          </p>
        </div>
      )}

      {apiError && (
        <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl p-4">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          <p className="text-sm text-rose-700">{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <Section title="1. Dados do Contrato">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Número do contrato" id="numero_contrato" required error={errors.numero_contrato?.message as string} registration={register("numero_contrato", { required: "Informe o número do contrato" })} />
            <Field label="Número Licitação" id="numero_licitacao" registration={register("numero_licitacao")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Número do processo SEI" id="numero_processo" required error={errors.numero_processo?.message as string} registration={register("numero_processo", { required: "Informe o número do processo" })} />
            <Field label="Link do processo (SEI)" id="link_processo" type="url" placeholder="https://sei.exemplo.gov.br/..." registration={register("link_processo")} />
          </div>
          <Field label="Resumo do objeto contratado" id="objeto" type="textarea" placeholder="Descrição livre do objeto do contrato (texto)." registration={register("objeto")} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Data de assinatura" id="data_assinatura" type="date" registration={register("data_assinatura")} />
            <Field label="Vigência (fim)" id="data_vigencia" type="date" registration={register("data_vigencia")} />
          </div>
        </Section>

        <Section title="2. Empresa e Responsáveis">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Empresa executora</label>
              <select {...register("empresa_ref_id")} className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700">
                <option value="">Selecione...</option>
                {empresas.map((e) => <option key={e.id} value={e.id}>{e.razao_social}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Órgão demandante</label>
              <select {...register("orgao_id")} className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700">
                <option value="">Selecione...</option>
                {orgaos.map((o) => <option key={o.id} value={o.id}>{o.sigla}{o.nome ? ` — ${o.nome}` : ""}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Fiscal</label>
              <select {...register("fiscal_id")} className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700">
                <option value="">Selecione...</option>
                {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Gestor</label>
              <select {...register("gestor_id")} className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700">
                <option value="">Selecione...</option>
                {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
          </div>
        </Section>

        <Section title="3. Financeiro">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Valor global inicial (R$)" id="valor_global" type="number" step="0.01" required error={errors.valor_global?.message as string} registration={register("valor_global", { required: "Informe o valor global" })} />
            <Field label="Valor reajustado (R$)" id="valor_reajustado" type="number" step="0.01" registration={register("valor_reajustado")} />
            <Field label="Valor final (R$)" id="valor_final" type="number" step="0.01" registration={register("valor_final")} />
            <Field label="Recurso Federal (R$)" id="recurso_federal" type="number" step="0.01" registration={register("recurso_federal")} />
            <Field label="Recurso Estadual (R$)" id="recurso_estadual" type="number" step="0.01" registration={register("recurso_estadual")} />
            <Field label="Percentual Retenção (%)" id="percentual_retencao" type="number" step="0.01" registration={register("percentual_retencao")} />
          </div>
        </Section>

        <Section title="4. Regras de Medição (Travas)">
          <p className="text-xs text-slate-500">
            Controlam o lançamento de medições. Recomenda-se manter ambas ativas: em obra pública
            não se paga volume acima do contratado sem aditivo formal.
          </p>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" {...register("bloquear_acima_contratado")} className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-brand-700 cursor-pointer" />
            <span className="text-sm text-slate-700">
              <span className="font-medium">Bloquear quantidade acima do contratado</span>
              <span className="block text-xs text-slate-500">Impede que o acumulado de um item ultrapasse o saldo contratado já no lançamento.</span>
            </span>
          </label>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" {...register("bloquear_quantidade_negativa")} className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-brand-700 cursor-pointer" />
            <span className="text-sm text-slate-700">
              <span className="font-medium">Bloquear quantidade negativa</span>
              <span className="block text-xs text-slate-500">Impede o lançamento de quantidades negativas em qualquer item.</span>
            </span>
          </label>
        </Section>

        <div className="flex items-center gap-3 pt-6 border-t border-slate-200 mt-6">
          {!createdId ? (
            <>
              <button
                type="button"
                onClick={() => navigate("/contratos")}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-2.5 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-700/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Cadastrar
              </button>
            </>
          ) : (
            <>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Salvar alterações
              </button>
              <button
                type="button"
                onClick={() => navigate(`/objetos/nova?contrato_id=${createdId}`)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-brand-700 bg-brand-50 border border-brand-200 hover:bg-brand-100 rounded-xl transition-all"
              >
                <Plus className="h-4 w-4" />
                Cadastrar objeto
              </button>
              <button
                type="button"
                onClick={() => navigate(`/contratos/${createdId}`)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-2.5 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-700/20 transition-all"
              >
                <CheckCircle2 className="h-4 w-4" />
                Concluir
              </button>
            </>
          )}
        </div>

      </form>
    </div>
  );
};

export default CadastrarContrato;
