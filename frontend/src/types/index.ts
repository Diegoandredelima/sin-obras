export type Role = "EMPRESA" | "FISCAL" | "APOIO_N1" | "APOIO_N2" | "COORDENADOR" | "SECRETARIO" | "ENGENHEIRO";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  matricula_cnpj: string;
  tipo: Role;
  cargo?: string;
  ativo: boolean;
  orgao_id?: string;
}

export interface Empresa {
  id: string;
  razao_social: string;
  cnpj?: string | null;
  nome_fantasia?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  municipio?: string | null;
  uf?: string | null;
  representante_legal?: string | null;
  observacoes?: string | null;
}

export interface EmpresaListItem extends Empresa {
  criado_em: string;
  total_contratos: number;
  total_obras: number;
}

export type EmpresaDetalhe = EmpresaListItem;

export interface EmpresaFormData {
  razao_social: string;
  cnpj?: string | null;
  nome_fantasia?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  municipio?: string | null;
  uf?: string | null;
  representante_legal?: string | null;
  observacoes?: string | null;
}

export type SaudeObra = "VERDE" | "AMARELO" | "VERMELHO";

export type StatusObra = "PLANEJADA" | "EM_EXECUCAO" | "PARALISADA" | "CONCLUIDA";

export type SituacaoObra =
  | "EM_ANDAMENTO" | "CONCLUIDA" | "PARALISADA" | "A_INICIAR"
  | "INACABADA" | "RESCINDIDA" | "ARQUIVADA" | "EXTINTA" | "CEDIDA";

export interface Obra {
  id: string;
  titulo: string;
  descricao?: string;
  endereco?: string;
  municipio?: string;
  valor_contrato?: number;
  data_inicio?: string;
  data_fim_prevista?: string;
  data_ordem_servico?: string;
  status?: StatusObra;
  saude?: SaudeObra;
  situacao?: SituacaoObra;
  percentual_executado?: number;
  raio_geofencing_metros?: number;
  contrato_id?: string;
  responsavel_id?: string;
  gestor_id?: string;
  orgao?: string;
  vigencia_fim?: string;
  execucao_fim?: string;
  ano_referencia?: string;
}

export interface ObraStats {
  total: number;
  por_situacao: Record<string, number>;
  por_status?: Record<string, number>;
  por_saude?: Record<string, number>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export type TarefaStatus = "A_FAZER" | "EM_ANDAMENTO" | "CONCLUIDO";
export type TarefaPrioridade = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";

export interface Tarefa {
  id: string;
  titulo: string;
  descricao: string | null;
  status: TarefaStatus;
  prioridade: TarefaPrioridade;
  prazo: string | null;
  obra_id: string | null;
  responsavel_id: string | null;
  criado_em: string;
}

export interface TarefaCreate {
  titulo: string;
  descricao?: string | null;
  prioridade?: TarefaPrioridade;
  prazo?: string | null;
  obra_id?: string | null;
}

export interface TarefaMove {
  status: TarefaStatus;
}

export interface ArtRrt {
  id: string;
  numero: string;
  tipo: string;
  obra_id: string;
  data_emissao: string | null;
  data_validade: string | null;
  arquivo_url: string | null;
  ativa: boolean;
  usuario_id: string;
  criado_em: string;
}

export interface ArtRrtCreate {
  numero: string;
  tipo: string;
  obra_id: string;
  data_emissao?: string | null;
  data_validade?: string | null;
  arquivo_url?: string | null;
}

export interface EventoBase {
  id: string;
  criado_em: string;
}

export interface OrdemServico extends EventoBase {
  obra_id: string;
  numero: string;
  data_emissao: string;
  data_inicio: string | null;
  processo_sei: string | null;
  observacao: string | null;
}

export interface AditivoPrazo extends EventoBase {
  obra_id: string;
  numero: number;
  dias_adicionados: number;
  nova_data_vigencia: string;
  nova_data_execucao: string;
  processo_sei: string | null;
  data_assinatura: string | null;
  data_publicacao: string | null;
  observacao: string | null;
}

export interface Paralisacao extends EventoBase {
  obra_id: string;
  tipo: string;
  data_evento: string;
  data_publicacao: string | null;
  saldo_dias_execucao: number | null;
  saldo_dias_vigencia: number | null;
  processo_sei: string | null;
  motivo: string | null;
}

export interface Readequacao extends EventoBase {
  obra_id: string;
  numero: number;
  tipo: string;
  percentual: number | null;
  valor: number | null;
  processo_sei: string | null;
  data_assinatura: string | null;
  data_publicacao: string | null;
  observacao: string | null;
}

export interface Apostilamento extends EventoBase {
  contrato_id: string;
  valor: number;
  processo_sei: string | null;
  data_assinatura: string | null;
  data_publicacao: string | null;
  descricao: string | null;
}

export interface Reajuste extends EventoBase {
  medicao_id: string;
  valor: number;
  processo_sei: string | null;
  data_assinatura: string | null;
  data_publicacao: string | null;
  observacao: string | null;
}

export interface TermoRecebimento extends EventoBase {
  obra_id: string;
  tipo: string;
  numero: string;
  data_emissao: string;
  data_publicacao: string | null;
  processo_sei: string | null;
  observacao: string | null;
}

export interface NotificacaoExtrajudicial extends EventoBase {
  obra_id: string;
  empresa_id: string;
  numero: string;
  data_emissao: string;
  data_recebimento: string | null;
  assunto: string;
  teor: string | null;
  processo_sei: string | null;
}

export interface PortariaEvento extends EventoBase {
  obra_id: string;
  usuario_id: string;
  tipo: string;
  numero: string;
  data_emissao: string;
  data_publicacao: string | null;
  processo_sei: string | null;
  observacao: string | null;
}

export interface EventosContratuais {
  ordens_servico: OrdemServico[];
  aditivos_prazo: AditivoPrazo[];
  paralisacoes: Paralisacao[];
  readequacoes: Readequacao[];
  apostilamentos: Apostilamento[];
  reajustes: Reajuste[];
  termos_recebimento: TermoRecebimento[];
  notificacoes_extrajudiciais: NotificacaoExtrajudicial[];
  portarias: PortariaEvento[];
}

export interface Evento {
  id: string;
  submeta_id: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  valor_total: number;
}

export interface Submeta {
  id: string;
  meta_id: string;
  descricao: string;
  valor: number;
  percentual_previsto: number;
  eventos: Evento[];
}

export interface Meta {
  id: string;
  obra_id: string;
  descricao: string;
  valor: number;
  ordem: number;
  submetas: Submeta[];
}

export interface EventoCreatePayload {
  descricao: string;
  quantidade?: number;
  unidade?: string;
  valor_unitario?: number;
}

// ---------------------------------------------------------------------------
// Relatórios
// ---------------------------------------------------------------------------
export interface ResumoPorStatus {
  status: string;
  label: string;
  total: number;
}

export interface ResumoPorOrgao {
  orgao: string;
  total_obras: number;
  valor_total: number;
}

export interface RelatorioResumo {
  total_obras: number;
  total_contratos: number;
  total_empresas: number;
  obras_por_status: ResumoPorStatus[];
  obras_por_orgao: ResumoPorOrgao[];
  valor_total_contratos: number;
}

/** Linha denormalizada da view `vw_relatorio_obras` (GET /relatorios/obras). */
export interface RelatorioObraRow {
  obra_id: string;
  titulo: string;
  municipio?: string | null;
  status?: string | null;
  situacao?: string | null;
  situacao_origem?: string | null;
  ano_referencia?: number | null;
  saude?: string | null;
  percentual_executado?: number | null;
  orgao?: string | null;
  valor_contrato?: number | null;
  valor_medido?: number | null;
  saldo_a_medir?: number | null;
  data_inicio?: string | null;
  data_fim_prevista?: string | null;
  vigencia_inicio?: string | null;
  vigencia_fim?: string | null;
  execucao_fim?: string | null;
  contrato_id?: string | null;
  contrato_numero?: string | null;
  numero_processo?: string | null;
  valor_global?: number | null;
  valor_final?: number | null;
  fiscal_nome?: string | null;
  gestor_nome?: string | null;
  empresa_razao_social?: string | null;
  empresa_cnpj?: string | null;
  dias_restantes_vigencia?: number | null;
}

export interface CurvaSData {
  error?: string;
  datas: string[];
  planejado: number[];
  realizado: number[];
  preditivo: number[];
  valor_total_planejado: number;
  valor_total_realizado: number;
  prazo_contratual: string;
  prazo_predito: string | null;
}
