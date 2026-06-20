export type Role = "EMPRESA" | "FISCAL" | "ENGENHEIRO" | "COORDENADOR" | "SECRETARIO";

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
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}
