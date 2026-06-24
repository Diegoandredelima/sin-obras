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
  total_objetos: number;
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

export type SaudeObjeto = "VERDE" | "AMARELO" | "VERMELHO";

export type StatusObjeto = "PLANEJADA" | "EM_EXECUCAO" | "PARALISADA" | "CONCLUIDA";

export type SituacaoObjeto =
  | "EM_ANDAMENTO" | "CONCLUIDA" | "PARALISADA" | "A_INICIAR"
  | "INACABADA" | "RESCINDIDA" | "ARQUIVADA" | "EXTINTA" | "CEDIDA";

export interface Objeto {
  id: string;
  titulo: string;
  descricao?: string;
  endereco?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  conjunto?: string;
  uf?: string;
  municipio?: string;
  valor_contrato?: number;
  data_inicio?: string;
  data_fim_prevista?: string;
  data_ordem_servico?: string;
  status?: StatusObjeto;
  saude?: SaudeObjeto;
  situacao?: SituacaoObjeto;
  percentual_executado?: number;
  raio_geofencing_metros?: number;
  contrato_id?: string;
  responsavel_id?: string;
  gestor_id?: string;
  orgao?: string;
  vigencia_fim?: string;
  execucao_fim?: string;
  ano_referencia?: string;
  itens?: Item[];
}

/** Parte constitutiva de um objeto (Objeto 1—N Item). */
export interface Item {
  id: string;
  objeto_id: string;
  descricao: string;
  unidade?: string;
  quantidade?: number;
  valor_unitario?: number;
  ordem?: number;
  valor_total?: number;
}

export interface ItemCreatePayload {
  descricao: string;
  unidade?: string;
  quantidade?: number;
  valor_unitario?: number;
  ordem?: number;
}

export interface Contrato {
  id: string;
  numero_processo: string;
  link_processo?: string | null;
  numero_contrato: string;
  valor_global: number;
  valor_aditivo?: number;
  valor_reajustado?: number;
  valor_final?: number;
  recurso_federal?: number;
  recurso_estadual?: number;
  percentual_retencao?: number;
  data_assinatura?: string;
  data_vigencia?: string;
  empresa_id?: string;
  empresa_ref_id?: string;
  orgao_id?: string;
  orgao?: string;
  fiscal_nome?: string;
  gestor_nome?: string;
  fiscal_id?: string;
  gestor_id?: string;
  tipo_licitacao?: string;
  numero_licitacao?: string;
  matricula_cei?: string;
  objeto?: string;
  empresa_ref?: { id: string; razao_social: string; cnpj?: string };
  orgao_ref?: { id: string; sigla: string; nome?: string };
  /** Objetos vinculados a este contrato (Contrato 1—N Objeto). */
  objetos?: Objeto[];
}

export interface CatalogoClasse {
  id: string;
  codigo: number;
  nome: string;
}

export interface CatalogoItem {
  id: string;
  codigo_sistema: string;
  item: string;
  descricao?: string;
  unidade?: string;
  classe_id: string;
  classe_codigo: number;
  classe_nome: string;
}

export interface ObjetoStats {
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
  objeto_id: string | null;
  responsavel_id: string | null;
  criado_em: string;
}

export interface TarefaCreate {
  titulo: string;
  descricao?: string | null;
  prioridade?: TarefaPrioridade;
  prazo?: string | null;
  objeto_id?: string | null;
}

export interface TarefaMove {
  status: TarefaStatus;
}

export interface ArtRrt {
  id: string;
  numero: string;
  tipo: string;
  objeto_id: string;
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
  objeto_id: string;
  data_emissao?: string | null;
  data_validade?: string | null;
  arquivo_url?: string | null;
}

export interface EventoBase {
  id: string;
  criado_em: string;
}

export interface OrdemServico extends EventoBase {
  objeto_id: string;
  numero: string;
  data_emissao: string;
  data_inicio: string | null;
  processo_sei: string | null;
  observacao: string | null;
}

export interface AditivoPrazo extends EventoBase {
  objeto_id: string;
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
  objeto_id: string;
  tipo: string;
  data_evento: string;
  data_publicacao: string | null;
  saldo_dias_execucao: number | null;
  saldo_dias_vigencia: number | null;
  processo_sei: string | null;
  motivo: string | null;
}

export interface Readequacao extends EventoBase {
  objeto_id: string;
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
  objeto_id: string;
  tipo: string;
  numero: string;
  data_emissao: string;
  data_publicacao: string | null;
  processo_sei: string | null;
  observacao: string | null;
}

export interface NotificacaoExtrajudicial extends EventoBase {
  objeto_id: string;
  empresa_id: string;
  numero: string;
  data_emissao: string;
  data_recebimento: string | null;
  assunto: string;
  teor: string | null;
  processo_sei: string | null;
}

export interface PortariaEvento extends EventoBase {
  objeto_id: string;
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
  objeto_id: string;
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
  total_objetos: number;
  valor_total: number;
}

export interface RelatorioResumo {
  total_objetos: number;
  total_contratos: number;
  total_empresas: number;
  objetos_por_status: ResumoPorStatus[];
  objetos_por_orgao: ResumoPorOrgao[];
  valor_total_contratos: number;
}

/** Linha denormalizada da view `vw_relatorio_objetos` (GET /relatorios/objetos). */
export interface RelatorioObjetoRow {
  objeto_id: string;
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
