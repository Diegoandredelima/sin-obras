"""
SIN-Obras — Schemas do Portal da Empresa (Diário de Obras, Medições, Notificações)
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.portal import CanalNotificacao, CondicaoTempo, OrigemMedicao, StatusMedicao


# ---------------------------------------------------------------------------
# Diário de Obras (RDO)
# ---------------------------------------------------------------------------
# Quantidades como float: vão para colunas JSONB (devem ser JSON-serializáveis).
class EquipamentoLinha(BaseModel):
    nome: str
    quantidade: float = Field(default=0, ge=0)

class MaoDeObraLinha(BaseModel):
    funcao: str
    quantidade: float = Field(default=0, ge=0)

class DiarioCreate(BaseModel):
    data_registro: date
    clima: str | None = Field(None, max_length=100)
    qtd_funcionarios: int = Field(default=0, ge=0)
    equipamentos: str | None = None
    ocorrencias: str | None = None
    atividades_realizadas: str | None = None
    # RDO estruturado
    tempo_manha: CondicaoTempo | None = None
    tempo_tarde: CondicaoTempo | None = None
    pluviometria_mm: Decimal | None = Field(default=None, ge=0)
    equipamentos_lista: list[EquipamentoLinha] | None = None
    mao_de_obra: list[MaoDeObraLinha] | None = None
    observacoes_fiscal: str | None = None

class DiarioUpdate(BaseModel):
    clima: str | None = None
    qtd_funcionarios: int | None = None
    equipamentos: str | None = None
    ocorrencias: str | None = None
    atividades_realizadas: str | None = None
    tempo_manha: CondicaoTempo | None = None
    tempo_tarde: CondicaoTempo | None = None
    pluviometria_mm: Decimal | None = Field(default=None, ge=0)
    equipamentos_lista: list[EquipamentoLinha] | None = None
    mao_de_obra: list[MaoDeObraLinha] | None = None
    observacoes_fiscal: str | None = None

class DiarioResponse(DiarioCreate):
    id: UUID
    objeto_id: UUID
    usuario_id: UUID
    criado_em: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Medição
# ---------------------------------------------------------------------------
# --- Linhas de memória de cálculo (C/P × L × H × N = A/V) ---
class MemoriaLinhaCreate(BaseModel):
    ordem: int = 0
    descricao: str | None = None
    comprimento: Decimal | None = None  # C/P
    largura: Decimal | None = None       # L
    altura: Decimal | None = None        # H
    percentual: Decimal | None = None    # %
    n_repeticoes: Decimal = Field(default=Decimal("1"))  # N
    quantidade: Decimal = Field(default=Decimal("0"))    # A/V resultante

class MemoriaLinhaResponse(MemoriaLinhaCreate):
    id: UUID
    medicao_item_id: UUID

    model_config = {"from_attributes": True}


# --- Itens do boletim ---
class MedicaoItemCreate(BaseModel):
    evento_id: UUID
    quantidade_periodo: Decimal = Field(default=Decimal("0"), ge=0)
    # Se omitido, congela o preço unitário atual do evento.
    valor_unitario: Decimal | None = Field(default=None, ge=0)
    desconto_vaos: Decimal = Field(default=Decimal("0"), ge=0)
    observacao: str | None = None
    memoria: list[MemoriaLinhaCreate] = []

class MedicaoItemUpdate(BaseModel):
    quantidade_periodo: Decimal | None = Field(default=None, ge=0)
    valor_unitario: Decimal | None = Field(default=None, ge=0)
    desconto_vaos: Decimal | None = Field(default=None, ge=0)
    observacao: str | None = None
    # Se enviado, substitui todas as linhas de memória do item (replace-all).
    memoria: list[MemoriaLinhaCreate] | None = None

class MedicaoItemResponse(BaseModel):
    id: UUID
    medicao_id: UUID
    evento_id: UUID
    quantidade_periodo: Decimal
    valor_unitario: Decimal
    desconto_vaos: Decimal
    observacao: str | None
    memoria: list[MemoriaLinhaResponse] = []

    model_config = {"from_attributes": True}


# --- Medição (cabeçalho do boletim) ---
class MedicaoCreate(BaseModel):
    # Definido pelo path da rota (/objetos/{objeto_id}/medicoes); opcional no corpo.
    objeto_id: UUID | None = None
    contrato_id: UUID | None = None
    data_inicio_periodo: date | None = None
    data_fim_periodo: date | None = None
    # Se omitido, herda o percentual de retenção do contrato.
    percentual_retencao: Decimal | None = Field(default=None, ge=0, le=100)
    valor_faturamento_direto: Decimal = Field(default=Decimal("0"), ge=0)
    itens: list[MedicaoItemCreate] = []

class MedicaoUpdate(BaseModel):
    data_inicio_periodo: date | None = None
    data_fim_periodo: date | None = None
    percentual_retencao: Decimal | None = Field(default=None, ge=0, le=100)
    valor_faturamento_direto: Decimal | None = Field(default=None, ge=0)

class MedicaoAssinarRequest(BaseModel):
    """Confirmação de assinatura pela empresa"""
    confirmado: bool = True

class MedicaoConcluirRequest(BaseModel):
    """Conclusão (atesto) de uma medição de origem fiscal"""
    observacao: str | None = None

class MedicaoFiscalRequest(BaseModel):
    """Ação do fiscal: aprovar ou reprovar"""
    aprovada: bool
    observacao_fiscal: str | None = None

class FotoMedicaoResponse(BaseModel):
    id: UUID
    medicao_id: UUID
    medicao_item_id: UUID | None
    url_storage: str | None
    filename: str | None
    hash_sha256: str | None
    carimbo_servidor: datetime | None
    criado_em: datetime

    model_config = {"from_attributes": True}

class MedicaoResponse(BaseModel):
    id: UUID
    objeto_id: UUID
    contrato_id: UUID | None
    empresa_usuario_id: UUID | None
    autor_id: UUID | None
    origem: OrigemMedicao
    numero_medicao: int
    status: StatusMedicao
    valor_medido: Decimal
    percentual_retencao: Decimal
    valor_faturamento_direto: Decimal
    data_inicio_periodo: date | None
    data_fim_periodo: date | None
    eventos_declarados: Any | None
    itens: list[MedicaoItemResponse] = []
    fotos: list[FotoMedicaoResponse] = []
    assinada_em: datetime | None
    enviada_em: datetime | None
    hash_assinatura: str | None
    observacao_fiscal: str | None
    criado_em: datetime

    model_config = {"from_attributes": True}


# --- Boletim calculado ---
class BoletimItemResponse(BaseModel):
    id: UUID
    evento_id: UUID
    descricao: str | None
    unidade: str | None
    quantidade_periodo: Decimal
    desconto_vaos: Decimal
    valor_unitario: Decimal
    valor_bruto: Decimal
    acumulado_anterior: Decimal
    acumulado_atual: Decimal
    total_contratado: Decimal
    saldo: Decimal
    observacao: str | None
    # Colunas de quantidade e percentual (espelham a aba PLANILHA do boletim)
    quantidade_prevista: Decimal
    quantidade_acumulada: Decimal
    quantidade_saldo: Decimal
    percentual_periodo: Decimal
    percentual_acumulado: Decimal

class MedicaoBoletimResponse(BaseModel):
    medicao_id: UUID
    numero_medicao: int
    status: StatusMedicao
    percentual_retencao: Decimal
    itens: list[BoletimItemResponse]
    valor_bruto_total: Decimal
    valor_faturamento_direto: Decimal
    retencao: Decimal
    valor_liquido: Decimal


# ---------------------------------------------------------------------------
# Notificação
# ---------------------------------------------------------------------------
class NotificacaoResponse(BaseModel):
    id: UUID
    usuario_id: UUID
    titulo: str
    mensagem: str | None
    canal: CanalNotificacao
    lida: bool
    criado_em: datetime

    model_config = {"from_attributes": True}
