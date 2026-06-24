import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users, UserPlus, Briefcase, Trash2, Loader2, AlertTriangle,
  ShieldCheck, Eye, UserCheck, UserCog, Power, Mail, IdCard,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { fmtDate } from "@/utils/format";
import type { Objeto, Usuario, PaginatedResponse, Role } from "@/types";

interface Delegacao {
  id: string;
  objeto_id: string;
  usuario_id: string;
  delegado_por_id: string | null;
  funcao: string;
  data_inicio: string;
  data_fim: string | null;
  observacao: string | null;
  ativo: boolean;
  criado_em: string;
}

const FUNCAO_LABEL: Record<string, string> = {
  FISCAL: "Fiscal",
  APOIO_N2: "Apoio N2",
  APOIO_N1: "Apoio N1",
};

// Roles que um gestor pode cadastrar/atribuir pela tela de equipe.
const ROLE_LABEL: Record<string, string> = {
  FISCAL: "Fiscal",
  APOIO_N1: "Apoio N1",
  APOIO_N2: "Apoio N2",
  COORDENADOR: "Coordenador",
  SECRETARIO: "Secretário",
  ENGENHEIRO: "Engenheiro (legado)",
  EMPRESA: "Empresa",
};

const ROLES_ATRIBUIVEIS: Role[] = ["FISCAL", "APOIO_N1", "APOIO_N2", "COORDENADOR", "SECRETARIO"];

const ROLE_BADGE: Record<string, string> = {
  FISCAL: "bg-amber-50 text-amber-700 border-amber-200",
  APOIO_N1: "bg-sky-50 text-sky-700 border-sky-200",
  APOIO_N2: "bg-indigo-50 text-indigo-700 border-indigo-200",
  COORDENADOR: "bg-violet-50 text-violet-700 border-violet-200",
  SECRETARIO: "bg-rose-50 text-rose-700 border-rose-200",
  ENGENHEIRO: "bg-slate-50 text-slate-600 border-slate-200",
  EMPRESA: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

// ---------------------------------------------------------------------------
// Modal: Nova Delegação
// ---------------------------------------------------------------------------
const delegacaoSchema = z.object({
  objeto_id: z.string().min(1, "Selecione um objeto"),
  usuario_id: z.string().min(1, "Selecione um servidor"),
  funcao: z.string().min(1, "Selecione a função"),
  data_inicio: z.string().min(1, "Data obrigatória"),
  data_fim: z.string().nullable().optional(),
  observacao: z.string().nullable().optional(),
});

type DelegacaoFormData = z.infer<typeof delegacaoSchema>;

const DelegacaoModal = ({
  open,
  onClose,
  usuarios,
}: {
  open: boolean;
  onClose: () => void;
  usuarios: Usuario[];
}) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DelegacaoFormData>({
    resolver: zodResolver(delegacaoSchema),
    defaultValues: { objeto_id: "", usuario_id: "", funcao: "FISCAL", data_inicio: new Date().toISOString().split("T")[0], data_fim: null, observacao: null },
  });

  const { data: objetosData } = useQuery<PaginatedResponse<Objeto>>({
    queryKey: ["objetos", "all"],
    queryFn: async () => { const { data } = await api.get("/objetos", { params: { limit: 100 } }); return data; },
  });

  const createMutation = useMutation({
    mutationFn: async (data: DelegacaoFormData) => {
      await api.post("/delegacoes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delegacoes"] });
      reset();
      onClose();
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <h3 className="text-lg font-bold text-slate-900">Nova Delegação</h3>
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Objeto <span className="text-rose-500">*</span></label>
            <select {...register("objeto_id")} className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none">
              <option value="">Selecione...</option>
              {(objetosData?.items || []).slice(0, 50).map((o) => (
                <option key={o.id} value={o.id}>{o.titulo.slice(0, 60)}</option>
              ))}
            </select>
            {errors.objeto_id && <p className="text-xs text-rose-500">{errors.objeto_id.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Servidor <span className="text-rose-500">*</span></label>
            <select {...register("usuario_id")} className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none">
              <option value="">Selecione...</option>
              {usuarios.filter((u) => ["FISCAL", "APOIO_N1", "APOIO_N2"].includes(u.tipo)).map((u) => (
                <option key={u.id} value={u.id}>{u.nome} ({u.tipo})</option>
              ))}
            </select>
            {errors.usuario_id && <p className="text-xs text-rose-500">{errors.usuario_id.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Função</label>
            <select {...register("funcao")} className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none">
              <option value="FISCAL">Fiscal</option>
              <option value="APOIO_N2">Apoio N2</option>
              <option value="APOIO_N1">Apoio N1</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Data início <span className="text-rose-500">*</span></label>
              <input type="date" {...register("data_inicio")} className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Data fim</label>
              <input type="date" {...register("data_fim")} className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">Cancelar</button>
            <button type="submit" disabled={createMutation.isPending} className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-700/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delegar
            </button>
          </div>
          {createMutation.isError && <p className="text-xs text-rose-500 text-center">Erro ao criar delegação.</p>}
        </form>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Modal: Novo Usuário (equipe)
// ---------------------------------------------------------------------------
const usuarioSchema = z.object({
  nome: z.string().min(2, "Informe o nome completo"),
  email: z.string().email("E-mail inválido"),
  matricula_cnpj: z.string().min(5, "Mínimo de 5 caracteres"),
  senha: z.string().min(6, "Mínimo de 6 caracteres"),
  tipo: z.enum(["FISCAL", "APOIO_N1", "APOIO_N2", "COORDENADOR", "SECRETARIO"]),
  cargo: z.string().nullable().optional(),
  telefone: z.string().nullable().optional(),
});

type UsuarioFormData = z.infer<typeof usuarioSchema>;

const UsuarioModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: { nome: "", email: "", matricula_cnpj: "", senha: "", tipo: "APOIO_N1", cargo: null, telefone: null },
  });

  const createMutation = useMutation({
    mutationFn: async (data: UsuarioFormData) => {
      await api.post("/auth/registrar", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      reset();
      onClose();
    },
  });

  if (!open) return null;

  const conflito = createMutation.isError &&
    (createMutation.error as { response?: { status?: number } })?.response?.status === 409;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-slate-900">Novo Usuário</h3>
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Nome completo <span className="text-rose-500">*</span></label>
            <input {...register("nome")} className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none" placeholder="Ex.: Ana Lima de Souza" />
            {errors.nome && <p className="text-xs text-rose-500">{errors.nome.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Perfil <span className="text-rose-500">*</span></label>
              <select {...register("tipo")} className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none">
                {ROLES_ATRIBUIVEIS.map((r) => (
                  <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Matrícula <span className="text-rose-500">*</span></label>
              <input {...register("matricula_cnpj")} className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none" placeholder="Ex.: 10006" />
              {errors.matricula_cnpj && <p className="text-xs text-rose-500">{errors.matricula_cnpj.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">E-mail <span className="text-rose-500">*</span></label>
            <input type="email" {...register("email")} className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none" placeholder="usuario@sin.rn.gov.br" />
            {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Senha provisória <span className="text-rose-500">*</span></label>
              <input type="text" {...register("senha")} className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none" placeholder="mín. 6 caracteres" />
              {errors.senha && <p className="text-xs text-rose-500">{errors.senha.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Cargo</label>
              <input {...register("cargo")} className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none" placeholder="Ex.: Apoio — Cadastro" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Telefone</label>
            <input {...register("telefone")} className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none" placeholder="(84) 99999-0000" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">Cancelar</button>
            <button type="submit" disabled={createMutation.isPending} className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-700/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Cadastrar
            </button>
          </div>
          {createMutation.isError && (
            <p className="text-xs text-rose-500 text-center">
              {conflito ? "Matrícula/CNPJ ou e-mail já cadastrado." : "Erro ao cadastrar usuário."}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Seção: Equipe (gestão de usuários)
// ---------------------------------------------------------------------------
const EquipeSection = ({ usuarios, isLoading, error }: { usuarios: Usuario[]; isLoading: boolean; error: unknown }) => {
  const queryClient = useQueryClient();
  const [showUsuarioModal, setShowUsuarioModal] = useState(false);

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      await api.patch(`/auth/usuarios/${id}`, { ativo });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["usuarios"] }); },
  });

  // Servidores internos (exclui empresas) ordenados por perfil de maior privilégio.
  const servidores = usuarios.filter((u) => u.tipo !== "EMPRESA");
  const apoios = servidores.filter((u) => u.tipo === "APOIO_N1" || u.tipo === "APOIO_N2");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200"><UserCog className="h-5 w-5 text-indigo-600" /></div>
            <span className="text-xs text-slate-400">Servidores</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{servidores.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200"><UserCheck className="h-5 w-5 text-sky-600" /></div>
            <span className="text-xs text-slate-400">Equipe de apoio (N1 + N2)</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{apoios.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200"><Power className="h-5 w-5 text-amber-600" /></div>
            <span className="text-xs text-slate-400">Inativos</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{servidores.filter((u) => !u.ativo).length}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Membros da Equipe</h3>
        <button onClick={() => setShowUsuarioModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-700/20 hover:bg-brand-500 transition-all">
          <UserPlus className="h-4 w-4" />Novo Usuário
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 text-slate-300 animate-spin" /></div>
      )}

      {!!error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
          <p className="text-sm text-rose-700">Erro ao carregar usuários. Verifique se você tem permissão de Coordenador.</p>
        </div>
      )}

      {!isLoading && !error && servidores.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-300">
          <Users className="h-12 w-12 mb-3" />
          <p className="text-sm font-medium">Nenhum servidor cadastrado</p>
          <p className="text-xs mt-1">Cadastre fiscais e apoios para compor a equipe.</p>
        </div>
      )}

      {!isLoading && !error && servidores.length > 0 && (
        <div className="space-y-3">
          {servidores.map((u) => (
            <div key={u.id} className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 ${!u.ativo ? "opacity-60" : ""}`}>
              <div className="h-10 w-10 rounded-full bg-brand-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {u.nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800">{u.nome}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${ROLE_BADGE[u.tipo] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                    {ROLE_LABEL[u.tipo] || u.tipo}
                  </span>
                  {!u.ativo && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">Inativo</span>}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1"><IdCard className="h-3.5 w-3.5" />{u.matricula_cnpj}</span>
                  <span className="inline-flex items-center gap-1 truncate"><Mail className="h-3.5 w-3.5 shrink-0" />{u.email}</span>
                </div>
              </div>
              <button
                onClick={() => toggleAtivoMutation.mutate({ id: u.id, ativo: !u.ativo })}
                disabled={toggleAtivoMutation.isPending}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                  u.ativo
                    ? "text-rose-600 bg-rose-50 hover:bg-rose-100"
                    : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                }`}
                title={u.ativo ? "Desativar acesso" : "Reativar acesso"}
              >
                <Power className="h-3.5 w-3.5" />
                {u.ativo ? "Desativar" : "Reativar"}
              </button>
            </div>
          ))}
        </div>
      )}

      <UsuarioModal open={showUsuarioModal} onClose={() => setShowUsuarioModal(false)} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Seção: Delegações
// ---------------------------------------------------------------------------
const DelegacoesSection = ({ usuarios }: { usuarios: Usuario[] }) => {
  const queryClient = useQueryClient();
  const [showDelegModal, setShowDelegModal] = useState(false);

  const { data: delegacoes = [], isLoading, error } = useQuery<Delegacao[]>({
    queryKey: ["delegacoes"],
    queryFn: async () => {
      const { data } = await api.get("/delegacoes");
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: objetosGestao } = useQuery<PaginatedResponse<Objeto>>({
    queryKey: ["objetos", "gestao"],
    queryFn: async () => { const { data } = await api.get("/objetos", { params: { limit: 10 } }); return data; },
  });

  const revogarMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/delegacoes/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["delegacoes"] }); },
  });

  const ativas = delegacoes.filter((d) => d.ativo);
  const nomePorId = new Map(usuarios.map((u) => [u.id, u.nome]));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200"><Briefcase className="h-5 w-5 text-sky-600" /></div>
            <span className="text-xs text-slate-400">Total de objetos</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{objetosGestao?.total ?? "—"}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-brand-50 border border-brand-200"><UserCheck className="h-5 w-5 text-brand-700" /></div>
            <span className="text-xs text-slate-400">Delegações ativas</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{ativas.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
            <span className="text-xs text-slate-400">Objetos sem fiscal</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{(objetosGestao?.total || 0) - ativas.filter((d) => d.funcao === "FISCAL").length}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Delegações Ativas</h3>
        <button onClick={() => setShowDelegModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-700/20 hover:bg-brand-500 transition-all">
          <UserPlus className="h-4 w-4" />Nova Delegação
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 text-slate-300 animate-spin" /></div>
      )}

      {!!error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
          <p className="text-sm text-rose-700">Erro ao carregar delegações.</p>
        </div>
      )}

      {!isLoading && !error && ativas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-300">
          <Users className="h-12 w-12 mb-3" />
          <p className="text-sm font-medium">Nenhuma delegação ativa</p>
          <p className="text-xs mt-1">Comece delegando objetos para fiscais e apoios.</p>
        </div>
      )}

      {!isLoading && !error && ativas.length > 0 && (
        <div className="space-y-3">
          {ativas.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${d.funcao === "FISCAL" ? "bg-amber-50 border border-amber-200" : "bg-sky-50 border border-sky-200"}`}>
                {d.funcao === "FISCAL" ? <ShieldCheck className="h-5 w-5 text-amber-600" /> : <Eye className="h-5 w-5 text-sky-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{FUNCAO_LABEL[d.funcao] || d.funcao}</span>
                  <span className="text-sm font-medium text-slate-800">{nomePorId.get(d.usuario_id) || `${d.usuario_id?.slice(0, 8)}...`}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Desde {fmtDate(d.data_inicio)}{d.data_fim ? ` até ${fmtDate(d.data_fim)}` : " (sem data fim)"}</p>
              </div>
              <Link to={`/contratos/${d.objeto_id}`} className="text-xs text-brand-700 hover:text-brand-500">Ver objeto →</Link>
              <button onClick={() => revogarMutation.mutate(d.id)} className="text-slate-300 hover:text-rose-500 transition-colors" title="Revogar">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <DelegacaoModal open={showDelegModal} onClose={() => setShowDelegModal(false)} usuarios={usuarios} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------
type Aba = "delegacoes" | "equipe";

const Gestao = () => {
  const [aba, setAba] = useState<Aba>("delegacoes");

  // Carregado uma vez e compartilhado entre as abas (delegação + equipe).
  const { data: usuarios = [], isLoading, error } = useQuery<Usuario[]>({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const { data } = await api.get("/auth/usuarios", { params: { apenas_ativos: false } });
      return Array.isArray(data) ? data : [];
    },
  });

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-brand-700 to-brand-500 p-8 text-white shadow-xl shadow-brand-700/20">
        <p className="text-sm font-medium text-white/70 mb-1">Painel do Chefe de Setor</p>
        <h2 className="text-3xl font-bold mb-2">Gestão de Objetos e Equipe</h2>
        <p className="text-white/65 text-sm">Cadastre e administre a equipe de apoio e fiscais, delegue objetos e acompanhe o status.</p>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setAba("delegacoes")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            aba === "delegacoes" ? "border-brand-700 text-brand-700" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Delegações
        </button>
        <button
          onClick={() => setAba("equipe")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            aba === "equipe" ? "border-brand-700 text-brand-700" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Equipe
        </button>
      </div>

      {aba === "delegacoes"
        ? <DelegacoesSection usuarios={usuarios} />
        : <EquipeSection usuarios={usuarios} isLoading={isLoading} error={error} />}
    </div>
  );
};

export default Gestao;
