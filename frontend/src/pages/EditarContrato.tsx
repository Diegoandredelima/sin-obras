import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, Briefcase, ChevronDown, ChevronRight, Plus, MapPin } from "lucide-react";
import { AxiosError } from "axios";
import api from "@/services/api";
import type { EmpresaListItem, Objeto, Contrato } from "@/types";

import CatalogoItensManager from "@/components/CatalogoItensManager";

interface OrgaoOption {
  id: string;
  sigla: string;
  nome?: string | null;
}

interface UsuarioOption {
  id: string;
  nome: string;
}

const Field = ({ label, id, type = "text", placeholder, required, error, registration, step, readOnly }: any) => (
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
        readOnly={readOnly}
        {...registration}
        className={`block w-full rounded-xl border py-2.5 px-3 text-sm placeholder:text-slate-400 transition-all focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-700/10 ${error ? "border-rose-400 bg-rose-50" : readOnly ? "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed" : "border-slate-200 bg-slate-50 focus:bg-white"}`}
      />
    )}
    {error && <p className="text-xs text-rose-600 mt-0.5">{error}</p>}
  </div>
);

const statusLabel = (s?: string) =>
  s === "EM_EXECUCAO" ? "Em Execução" : s === "PARALISADA" ? "Paralisada" : s === "CONCLUIDA" ? "Concluída" : "Planejada";

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

const EditarContrato = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [apiError, setApiError] = useState("");

  const { data: contrato, isLoading: isContratoLoading } = useQuery<Contrato>({
    queryKey: ["contrato", id],
    queryFn: async () => {
      const { data } = await api.get(`/contratos/${id}`);
      return data;
    },
    enabled: !!id,
  });

  // Contrato 1—N Objeto: edita-se o objeto principal (primeiro) do contrato.
  const { data: objetos = [], isLoading: isObjetoLoading } = useQuery<Objeto[]>({
    queryKey: ["contrato-objetos", id],
    queryFn: async () => {
      const { data } = await api.get(`/contratos/${id}/objetos`);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!id,
  });

  const objeto = objetos[0];
  const objetoId = objeto?.id;

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

  const { data: municipios = [] } = useQuery<string[]>({
    queryKey: ["municipios"],
    queryFn: async () => {
      const { data } = await api.get("/objetos/municipios/lista");
      return Array.isArray(data) ? data : [];
    },
  });

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm();

  // Autocompletar endereço pelo CEP (ViaCEP). CEP = 8 dígitos.
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "error">("idle");
  // Regra: ao preencher pelo CEP, os campos de endereço ficam travados
  // (read-only). Para editá-los, o usuário precisa apagar o CEP.
  const [enderecoTravado, setEnderecoTravado] = useState(false);
  const [incluirEndereco, setIncluirEndereco] = useState(false);

  // Cadastro inline de objetos adicionais do contrato (Contrato 1—N Objeto).
  const NOVO_OBJETO_VAZIO = { titulo: "", descricao: "", municipio: "", status: "PLANEJADA", data_inicio: "", data_fim_prevista: "" };
  const [addingObjeto, setAddingObjeto] = useState(false);
  const [savingObjeto, setSavingObjeto] = useState(false);
  const [novoObjeto, setNovoObjeto] = useState(NOVO_OBJETO_VAZIO);

  const buscarCep = async (raw: string) => {
    const cep = (raw || "").replace(/\D/g, "");
    if (cep.length !== 8) {
      if (cep.length > 0) setCepStatus("error");
      return;
    }
    setCepStatus("loading");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepStatus("error");
        return;
      }
      setCepStatus("idle");
      if (data.logradouro) setValue("objeto_logradouro", data.logradouro);
      if (data.bairro) setValue("objeto_bairro", data.bairro);
      if (data.localidade) setValue("objeto_municipio", data.localidade);
      if (data.uf) setValue("objeto_uf", data.uf);
      setEnderecoTravado(true);
    } catch {
      setCepStatus("error");
    }
  };

  // Ao alterar/apagar o CEP, destrava os campos para edição manual.
  const handleCepChange = (value: string) => {
    if ((value || "").replace(/\D/g, "").length < 8) {
      setEnderecoTravado(false);
      if (cepStatus !== "idle") setCepStatus("idle");
    }
  };

  useEffect(() => {
    if (contrato && objeto) {
      reset({
        // Contrato
        numero_contrato: contrato.numero_contrato,
        numero_processo: contrato.numero_processo,
        link_processo: contrato.link_processo || "",
        objeto: contrato.objeto || "",
        numero_licitacao: contrato.numero_licitacao || "",
        data_assinatura: contrato.data_assinatura || "",
        data_vigencia: contrato.data_vigencia || "",
        // Empresa/Resps
        empresa_ref_id: contrato.empresa_ref_id || "",
        orgao_id: contrato.orgao_id || "",
        fiscal_id: contrato.fiscal_id || "",
        gestor_id: contrato.gestor_id || "",
        // Objeto
        objeto_titulo: objeto.titulo,
        objeto_cep: objeto.cep || "",
        objeto_logradouro: objeto.logradouro || "",
        objeto_numero: objeto.numero || "",
        objeto_bairro: objeto.bairro || "",
        objeto_conjunto: objeto.conjunto || "",
        objeto_uf: objeto.uf || "",
        objeto_municipio: objeto.municipio || "",
        objeto_descricao: objeto.descricao || "",
        objeto_status: objeto.status || "PLANEJADA",
        objeto_data_inicio: objeto.data_inicio || "",
        objeto_data_fim_prevista: objeto.data_fim_prevista || "",
        // Financeiro
        valor_global: contrato.valor_global,
        valor_reajustado: contrato.valor_reajustado || "",
        valor_final: contrato.valor_final || "",
        recurso_federal: contrato.recurso_federal || "",
        recurso_estadual: contrato.recurso_estadual || "",
        percentual_retencao: contrato.percentual_retencao || "",
      });
      const temEndereco = !!(objeto.cep || objeto.logradouro || objeto.endereco);
      setIncluirEndereco(temEndereco);
      setEnderecoTravado((objeto.cep || "").replace(/\D/g, "").length === 8);
    }
  }, [contrato, objeto, reset]);

  const onSubmit = async (data: any) => {
    setApiError("");
    try {
      // 1. Update Contrato
      const contratoPayload = {
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
      };

      // 2. Update Objeto
      // Compõe o `endereco` legado (exibido em detalhes/impressão) a partir das
      // partes estruturadas; preserva o texto livre antigo se nada for informado.
      const enderecoComposto = [
        data.objeto_logradouro,
        data.objeto_numero && `nº ${data.objeto_numero}`,
        data.objeto_conjunto,
        data.objeto_bairro,
      ].filter(Boolean).join(", ");

      const objetoPayload = {
        titulo: data.objeto_titulo,
        descricao: data.objeto_descricao || null,
        cep: data.objeto_cep || null,
        logradouro: data.objeto_logradouro || null,
        numero: data.objeto_numero || null,
        bairro: data.objeto_bairro || null,
        conjunto: data.objeto_conjunto || null,
        uf: (data.objeto_uf || "").toUpperCase() || null,
        endereco: enderecoComposto || objeto.endereco || null,
        municipio: data.objeto_municipio || null,
        status: data.objeto_status || null,
        data_inicio: data.objeto_data_inicio || null,
        data_fim_prevista: data.objeto_data_fim_prevista || null,
      };

      await Promise.all([
        api.put(`/contratos/${id}`, contratoPayload),
        api.put(`/objetos/${objetoId}`, objetoPayload)
      ]);

      queryClient.invalidateQueries({ queryKey: ["contrato", id] });
      queryClient.invalidateQueries({ queryKey: ["objeto", objetoId] });
      navigate(`/contratos/${id}`);
    } catch (err) {
      const ax = err as AxiosError<{ detail?: string }>;
      setApiError(ax.response?.data?.detail || "Erro ao atualizar o contrato. Tente novamente.");
    }
  };

  // Cria um novo objeto vinculado ao contrato e o anexa ao núcleo da Section 3.
  const salvarNovoObjeto = async () => {
    if (!novoObjeto.titulo.trim()) return;
    setSavingObjeto(true);
    setApiError("");
    try {
      await api.post("/objetos", {
        titulo: novoObjeto.titulo,
        descricao: novoObjeto.descricao || null,
        municipio: novoObjeto.municipio || null,
        status: novoObjeto.status,
        data_inicio: novoObjeto.data_inicio || null,
        data_fim_prevista: novoObjeto.data_fim_prevista || null,
        contrato_id: id,
      });
      queryClient.invalidateQueries({ queryKey: ["contrato-objetos", id] });
      queryClient.invalidateQueries({ queryKey: ["objetos"] });
      setNovoObjeto(NOVO_OBJETO_VAZIO);
      setAddingObjeto(false);
    } catch (err) {
      const ax = err as AxiosError<{ detail?: string }>;
      setApiError(ax.response?.data?.detail || "Erro ao adicionar o objeto. Tente novamente.");
    } finally {
      setSavingObjeto(false);
    }
  };

  if (isContratoLoading || isObjetoLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;
  }

  if (!contrato || !objeto) {
    return <div className="p-6 text-center text-rose-600">Erro: Contrato ou Objeto não encontrados.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <Link to={`/contratos/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700 transition-colors">
        <ArrowLeft className="h-4 w-4" />Voltar para o contrato
      </Link>

      <div className="flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50">
          <Briefcase className="h-6 w-6 text-sky-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Editar Contrato e Objeto</h1>
          <p className="text-sm text-slate-500">Contrato {contrato.numero_contrato} — {objeto.titulo}</p>
        </div>
      </div>

      {apiError && (
        <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl p-4">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          <p className="text-sm text-rose-700">{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        <Section title="1. Dados do Contrato">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Número do contrato" id="numero_contrato" required registration={register("numero_contrato")} />
            <Field label="Número Licitação" id="numero_licitacao" registration={register("numero_licitacao")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Número do processo SEI" id="numero_processo" required registration={register("numero_processo")} />
            <Field label="Link do processo (SEI)" id="link_processo" type="url" placeholder="https://sei.exemplo.gov.br/..." registration={register("link_processo")} />
          </div>
          <Field label="Resumo" id="objeto" type="textarea" registration={register("objeto")} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Data de assinatura" id="data_assinatura" type="date" registration={register("data_assinatura")} />
            <Field label="Vigência (fim)" id="data_vigencia" type="date" registration={register("data_vigencia")} />
          </div>

          <div className="pt-2 space-y-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <MapPin className="h-4 w-4 text-slate-400" />Endereço da obra
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="s1-objeto_cep" className="block text-sm font-medium text-slate-700">CEP</label>
                  <div className="relative">
                    {(() => {
                      const cepReg = register("objeto_cep");
                      return (
                        <input
                          id="s1-objeto_cep"
                          inputMode="numeric"
                          maxLength={9}
                          placeholder="00000-000"
                          {...cepReg}
                          onChange={(e) => { cepReg.onChange(e); handleCepChange(e.target.value); }}
                          onBlur={(e) => { cepReg.onBlur(e); buscarCep(e.target.value); }}
                          className={`block w-full rounded-xl border ${cepStatus === "error" ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-slate-50"} py-2.5 px-3 text-sm placeholder:text-slate-400 focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all`}
                        />
                      );
                    })()}
                    {cepStatus === "loading" && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />}
                  </div>
                  {cepStatus === "error"
                    ? <p className="text-xs text-rose-600 mt-0.5">CEP inválido ou não encontrado.</p>
                    : enderecoTravado
                      ? <p className="text-xs text-slate-500 mt-0.5">Endereço preenchido pelo CEP. Apague o CEP para editar.</p>
                      : <p className="text-xs text-slate-400 mt-0.5">8 dígitos — preenche o endereço automaticamente.</p>}
                </div>
                <div className="sm:col-span-2">
                  <Field label="Logradouro" id="s1-objeto_logradouro" placeholder="Rua, avenida, etc." readOnly={enderecoTravado} registration={register("objeto_logradouro")} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Número" id="s1-objeto_numero" registration={register("objeto_numero")} />
                <Field label="Conjunto" id="s1-objeto_conjunto" placeholder="Bloco, quadra, lote..." registration={register("objeto_conjunto")} />
                <Field label="Bairro" id="s1-objeto_bairro" readOnly={enderecoTravado} registration={register("objeto_bairro")} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="s1-objeto_municipio" className="block text-sm font-medium text-slate-700">Cidade</label>
                  <input
                    id="s1-objeto_municipio"
                    list="municipios-list-s1"
                    readOnly={enderecoTravado}
                    {...register("objeto_municipio")}
                    className={`block w-full rounded-xl border py-2.5 px-3 text-sm placeholder:text-slate-400 transition-all focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-700/10 ${enderecoTravado ? "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed" : "border-slate-200 bg-slate-50 focus:bg-white"}`}
                  />
                  <datalist id="municipios-list-s1">
                    {municipios.map((m) => <option key={m} value={m} />)}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="s1-objeto_uf" className="block text-sm font-medium text-slate-700">Estado (UF)</label>
                  <input
                    id="s1-objeto_uf"
                    maxLength={2}
                    placeholder="UF"
                    readOnly={enderecoTravado}
                    {...register("objeto_uf")}
                    className={`block w-full rounded-xl border py-2.5 px-3 text-sm uppercase placeholder:text-slate-400 placeholder:normal-case transition-all focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-700/10 ${enderecoTravado ? "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed" : "border-slate-200 bg-slate-50 focus:bg-white"}`}
                  />
                </div>
              </div>
            </div>
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
                {orgaos.map((o) => <option key={o.id} value={o.id}>{o.sigla}</option>)}
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

        <Section title="3. Dados do Objeto">
          {/* Núcleo do objeto principal: campos + itens deste objeto */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">1</span>
              <h3 className="text-sm font-bold text-slate-800">Objeto principal</h3>
            </div>

          <Field label="Título do objeto" id="objeto_titulo" required registration={register("objeto_titulo")} />
          <Field label="Descrição do objeto" id="objeto_descricao" type="textarea" registration={register("objeto_descricao")} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Status</label>
              <select {...register("objeto_status")} className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700">
                <option value="PLANEJADA">Planejada</option>
                <option value="EM_EXECUCAO">Em Execução</option>
                <option value="PARALISADA">Paralisada</option>
                <option value="CONCLUIDA">Concluída</option>
              </select>
            </div>
            <Field label="Data Início" id="objeto_data_inicio" type="date" registration={register("objeto_data_inicio")} />
            <Field label="Previsão Fim" id="objeto_data_fim_prevista" type="date" registration={register("objeto_data_fim_prevista")} />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={incluirEndereco}
              onChange={(e) => setIncluirEndereco(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 accent-brand-700 cursor-pointer"
            />
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <MapPin className="h-4 w-4 text-slate-400" />
              Incluir endereço
            </span>
          </label>

          {incluirEndereco && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="objeto_cep" className="block text-sm font-medium text-slate-700">CEP</label>
                  <div className="relative">
                    {(() => {
                      const cepReg = register("objeto_cep");
                      return (
                        <input
                          id="objeto_cep"
                          inputMode="numeric"
                          maxLength={9}
                          placeholder="00000-000"
                          {...cepReg}
                          onChange={(e) => { cepReg.onChange(e); handleCepChange(e.target.value); }}
                          onBlur={(e) => { cepReg.onBlur(e); buscarCep(e.target.value); }}
                          className={`block w-full rounded-xl border ${cepStatus === "error" ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-slate-50"} py-2.5 px-3 text-sm placeholder:text-slate-400 focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all`}
                        />
                      );
                    })()}
                    {cepStatus === "loading" && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />}
                  </div>
                  {cepStatus === "error"
                    ? <p className="text-xs text-rose-600 mt-0.5">CEP inválido ou não encontrado.</p>
                    : enderecoTravado
                      ? <p className="text-xs text-slate-500 mt-0.5">Endereço preenchido pelo CEP. Apague o CEP para editar.</p>
                      : <p className="text-xs text-slate-400 mt-0.5">8 dígitos — preenche o endereço automaticamente.</p>}
                </div>
                <div className="sm:col-span-2">
                  <Field label="Logradouro" id="objeto_logradouro" placeholder="Rua, avenida, etc." readOnly={enderecoTravado} registration={register("objeto_logradouro")} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Número" id="objeto_numero" registration={register("objeto_numero")} />
                <Field label="Conjunto" id="objeto_conjunto" placeholder="Bloco, quadra, lote..." registration={register("objeto_conjunto")} />
                <Field label="Bairro" id="objeto_bairro" readOnly={enderecoTravado} registration={register("objeto_bairro")} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="objeto_municipio" className="block text-sm font-medium text-slate-700">Cidade</label>
                  <input
                    id="objeto_municipio"
                    list="municipios-list"
                    readOnly={enderecoTravado}
                    {...register("objeto_municipio")}
                    className={`block w-full rounded-xl border py-2.5 px-3 text-sm placeholder:text-slate-400 transition-all focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-700/10 ${enderecoTravado ? "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed" : "border-slate-200 bg-slate-50 focus:bg-white"}`}
                  />
                  <datalist id="municipios-list">
                    {municipios.map((m) => <option key={m} value={m} />)}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="objeto_uf" className="block text-sm font-medium text-slate-700">Estado (UF)</label>
                  <input
                    id="objeto_uf"
                    maxLength={2}
                    placeholder="UF"
                    readOnly={enderecoTravado}
                    {...register("objeto_uf")}
                    className={`block w-full rounded-xl border py-2.5 px-3 text-sm uppercase placeholder:text-slate-400 placeholder:normal-case transition-all focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-700/10 ${enderecoTravado ? "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed" : "border-slate-200 bg-slate-50 focus:bg-white"}`}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-800 mb-4">Itens deste objeto</h4>
            <CatalogoItensManager objetoId={objetoId} />
          </div>
          </div>

          {/* Núcleos dos demais objetos do contrato (cada um com seus itens) */}
          {objetos.slice(1).map((obj, idx) => (
            <div key={obj.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">{idx + 2}</span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 truncate">{obj.titulo}</h3>
                    {obj.municipio && <p className="text-xs text-slate-500">{obj.municipio}</p>}
                  </div>
                </div>
                <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-600">
                  {statusLabel(obj.status)}
                </span>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-800 mb-4">Itens deste objeto</h4>
                <CatalogoItensManager objetoId={obj.id} />
              </div>
            </div>
          ))}

          {/* Cadastro inline de novo objeto */}
          {addingObjeto ? (
            <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700">{objetos.length + 1}</span>
                <h3 className="text-sm font-bold text-brand-800">Novo objeto do contrato</h3>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="novo_objeto_titulo" className="block text-sm font-medium text-slate-700">Título do objeto<span className="text-rose-500 ml-0.5">*</span></label>
                <input
                  id="novo_objeto_titulo"
                  value={novoObjeto.titulo}
                  onChange={(e) => setNovoObjeto({ ...novoObjeto, titulo: e.target.value })}
                  className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm placeholder:text-slate-400 focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="novo_objeto_descricao" className="block text-sm font-medium text-slate-700">Descrição do objeto</label>
                <textarea
                  id="novo_objeto_descricao"
                  rows={3}
                  value={novoObjeto.descricao}
                  onChange={(e) => setNovoObjeto({ ...novoObjeto, descricao: e.target.value })}
                  className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm placeholder:text-slate-400 focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="novo_objeto_municipio" className="block text-sm font-medium text-slate-700">Cidade</label>
                  <input
                    id="novo_objeto_municipio"
                    list="municipios-list-novo"
                    value={novoObjeto.municipio}
                    onChange={(e) => setNovoObjeto({ ...novoObjeto, municipio: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all"
                  />
                  <datalist id="municipios-list-novo">
                    {municipios.map((m) => <option key={m} value={m} />)}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="novo_objeto_status" className="block text-sm font-medium text-slate-700">Status</label>
                  <select
                    id="novo_objeto_status"
                    value={novoObjeto.status}
                    onChange={(e) => setNovoObjeto({ ...novoObjeto, status: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm focus:border-brand-700"
                  >
                    <option value="PLANEJADA">Planejada</option>
                    <option value="EM_EXECUCAO">Em Execução</option>
                    <option value="PARALISADA">Paralisada</option>
                    <option value="CONCLUIDA">Concluída</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="novo_objeto_data_inicio" className="block text-sm font-medium text-slate-700">Data Início</label>
                  <input
                    id="novo_objeto_data_inicio"
                    type="date"
                    value={novoObjeto.data_inicio}
                    onChange={(e) => setNovoObjeto({ ...novoObjeto, data_inicio: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="novo_objeto_data_fim" className="block text-sm font-medium text-slate-700">Previsão Fim</label>
                  <input
                    id="novo_objeto_data_fim"
                    type="date"
                    value={novoObjeto.data_fim_prevista}
                    onChange={(e) => setNovoObjeto({ ...novoObjeto, data_fim_prevista: e.target.value })}
                    className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-500">Salve o objeto para liberar o cadastro dos itens dele.</p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setAddingObjeto(false); setNovoObjeto(NOVO_OBJETO_VAZIO); }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={salvarNovoObjeto}
                  disabled={savingObjeto || !novoObjeto.titulo.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-xl disabled:opacity-50 transition-colors"
                >
                  {savingObjeto ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Salvar objeto
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingObjeto(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-brand-700 hover:text-brand-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Adicionar objeto ao contrato
            </button>
          )}
        </Section>

        <Section title="4. Financeiro">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Valor global inicial (R$)" id="valor_global" type="number" step="0.01" required registration={register("valor_global")} />
            <Field label="Valor reajustado (R$)" id="valor_reajustado" type="number" step="0.01" registration={register("valor_reajustado")} />
            <Field label="Valor final (R$)" id="valor_final" type="number" step="0.01" registration={register("valor_final")} />
            <Field label="Recurso Federal (R$)" id="recurso_federal" type="number" step="0.01" registration={register("recurso_federal")} />
            <Field label="Recurso Estadual (R$)" id="recurso_estadual" type="number" step="0.01" registration={register("recurso_estadual")} />
            <Field label="Percentual Retenção (%)" id="percentual_retencao" type="number" step="0.01" registration={register("percentual_retencao")} />
          </div>
        </Section>

        <div className="flex items-center gap-3 pt-6 border-t border-slate-200 mt-6">
          <button
            type="button"
            onClick={() => navigate(`/contratos/${id}`)}
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
            Salvar alterações
          </button>
        </div>

      </form>
    </div>
  );
};

export default EditarContrato;
