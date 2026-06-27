"""
SIN-Obras — Schemas de Acompanhamento de Prazos e Contratos
"""
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class OrdemServicoBase(BaseModel):
    numero: str
    data_emissao: date
    data_inicio: date | None = None
    processo_sei: str | None = None
    observacao: str | None = None


class OrdemServicoCreate(OrdemServicoBase):
    pass


class OrdemServicoResponse(OrdemServicoBase):
    id: UUID
    objeto_id: UUID
    criado_em: datetime

    model_config = {"from_attributes": True}


class AditivoPrazoBase(BaseModel):
    numero: int
    dias_adicionados: int
    nova_data_vigencia: date
    nova_data_execucao: date
    processo_sei: str | None = None
    data_assinatura: date | None = None
    data_publicacao: date | None = None
    observacao: str | None = None


class AditivoPrazoCreate(AditivoPrazoBase):
    pass


class AditivoPrazoResponse(AditivoPrazoBase):
    id: UUID
    objeto_id: UUID
    status_tramitacao: str | None = None
    solicitado_por_id: UUID | None = None
    criado_em: datetime

    model_config = {"from_attributes": True}


class ParalisacaoBase(BaseModel):
    tipo: str
    data_evento: date
    data_publicacao: date | None = None
    saldo_dias_execucao: int | None = None
    saldo_dias_vigencia: int | None = None
    processo_sei: str | None = None
    motivo: str | None = None


class ParalisacaoCreate(ParalisacaoBase):
    pass


class ParalisacaoResponse(ParalisacaoBase):
    id: UUID
    objeto_id: UUID
    status_tramitacao: str | None = None
    solicitado_por_id: UUID | None = None
    criado_em: datetime

    model_config = {"from_attributes": True}


class ReadequacaoBase(BaseModel):
    numero: int
    tipo: str
    percentual: Decimal | None = None
    valor: Decimal | None = None
    processo_sei: str | None = None
    data_assinatura: date | None = None
    data_publicacao: date | None = None
    observacao: str | None = None


class ReadequacaoCreate(ReadequacaoBase):
    pass


class ReadequacaoResponse(ReadequacaoBase):
    id: UUID
    objeto_id: UUID
    criado_em: datetime

    model_config = {"from_attributes": True}


class ApostilamentoBase(BaseModel):
    valor: Decimal
    processo_sei: str | None = None
    data_assinatura: date | None = None
    data_publicacao: date | None = None
    descricao: str | None = None


class ApostilamentoCreate(ApostilamentoBase):
    pass


class ApostilamentoResponse(ApostilamentoBase):
    id: UUID
    contrato_id: UUID
    criado_em: datetime

    model_config = {"from_attributes": True}


class ReajusteBase(BaseModel):
    valor: Decimal
    processo_sei: str | None = None
    data_assinatura: date | None = None
    data_publicacao: date | None = None
    observacao: str | None = None


class ReajusteCreate(ReajusteBase):
    pass


class ReajusteResponse(ReajusteBase):
    id: UUID
    medicao_id: UUID
    criado_em: datetime

    model_config = {"from_attributes": True}


class TermoRecebimentoBase(BaseModel):
    tipo: str
    numero: str
    data_emissao: date
    data_publicacao: date | None = None
    processo_sei: str | None = None
    observacao: str | None = None


class TermoRecebimentoCreate(TermoRecebimentoBase):
    pass


class TermoRecebimentoResponse(TermoRecebimentoBase):
    id: UUID
    objeto_id: UUID
    criado_em: datetime

    model_config = {"from_attributes": True}


class NotificacaoExtrajudicialBase(BaseModel):
    numero: str
    data_emissao: date
    data_recebimento: date | None = None
    assunto: str
    teor: str | None = None
    processo_sei: str | None = None


class NotificacaoExtrajudicialCreate(NotificacaoExtrajudicialBase):
    empresa_id: UUID


class NotificacaoExtrajudicialResponse(NotificacaoExtrajudicialBase):
    id: UUID
    objeto_id: UUID
    empresa_id: UUID
    criado_em: datetime

    model_config = {"from_attributes": True}


class PortariaBase(BaseModel):
    usuario_id: UUID
    tipo: str
    numero: str
    data_emissao: date
    data_publicacao: date | None = None
    processo_sei: str | None = None
    observacao: str | None = None


class PortariaCreate(PortariaBase):
    pass


class PortariaResponse(PortariaBase):
    id: UUID
    objeto_id: UUID
    criado_em: datetime

    model_config = {"from_attributes": True}


class EventoContratualResponse(BaseModel):
    """
    Resposta consolidada com todos os eventos contratuais de uma obra,
    ordenados por data (mais recentes primeiro).
    Usado pela timeline do frontend.
    """
    ordens_servico: list[OrdemServicoResponse]
    aditivos_prazo: list[AditivoPrazoResponse]
    paralisacoes: list[ParalisacaoResponse]
    readequacoes: list[ReadequacaoResponse]
    apostilamentos: list[ApostilamentoResponse]
    reajustes: list[ReajusteResponse]
    termos_recebimento: list[TermoRecebimentoResponse]
    notificacoes_extrajudiciais: list[NotificacaoExtrajudicialResponse]
    portarias: list[PortariaResponse]
