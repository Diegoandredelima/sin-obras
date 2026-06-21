import { useQuery } from "@tanstack/react-query";
import {
  FileText, Clock, Pause, RefreshCw, DollarSign,
  CheckCheck, AlertTriangle, UserCheck, History, Loader2,
} from "lucide-react";
import api from "@/services/api";
import type {
  EventosContratuais,
  OrdemServico,
  AditivoPrazo,
  Paralisacao,
  Readequacao,
  Apostilamento,
  Reajuste,
  TermoRecebimento,
  NotificacaoExtrajudicial,
  PortariaEvento,
} from "@/types";
import { fmtDate, fmtCurrency } from "@/utils/format";

const EVENT_CONFIG = {
  ordem_servico: { label: "Ordem de Serviço", icon: FileText, color: "border-sky-400 bg-sky-50 text-sky-700" },
  aditivo_prazo: { label: "Aditivo de Prazo", icon: Clock, color: "border-amber-400 bg-amber-50 text-amber-700" },
  paralisacao: { label: "Paralisação", icon: Pause, color: "border-orange-400 bg-orange-50 text-orange-700" },
  readequacao: { label: "Readequação", icon: RefreshCw, color: "border-purple-400 bg-purple-50 text-purple-700" },
  apostilamento: { label: "Apostilamento", icon: DollarSign, color: "border-brand-300 bg-brand-50 text-brand-700" },
  reajuste: { label: "Reajuste", icon: DollarSign, color: "border-amber-300 bg-amber-50 text-amber-700" },
  termo_recebimento: { label: "Termo de Recebimento", icon: CheckCheck, color: "border-emerald-400 bg-emerald-50 text-emerald-700" },
  notificacao_extrajudicial: { label: "Notificação Extrajudicial", icon: AlertTriangle, color: "border-rose-400 bg-rose-50 text-rose-700" },
  portaria: { label: "Portaria", icon: UserCheck, color: "border-violet-400 bg-violet-50 text-violet-700" },
} as const;

const TimelineItem = ({
  date,
  title,
  subtitle,
  config,
  body,
}: {
  date: string;
  title: string;
  subtitle?: string;
  config: typeof EVENT_CONFIG[keyof typeof EVENT_CONFIG];
  body?: React.ReactNode;
}) => {
  const Icon = config.icon;
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-9 h-9 rounded-full border-2 ${config.color} flex items-center justify-center bg-white`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="w-0.5 flex-1 bg-slate-100 mt-1" />
      </div>
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-semibold uppercase text-slate-400">{fmtDate(date)}</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${config.color}`}>
            {config.label}
          </span>
        </div>
        <p className="text-sm font-semibold text-slate-800 leading-snug">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        {body && <div className="mt-2 text-xs text-slate-600">{body}</div>}
      </div>
    </div>
  );
};

export const EventosContratuaisContent = ({ obraId }: { obraId: string }) => {
  const { data, isLoading, error } = useQuery<EventosContratuais>({
    queryKey: ["eventos-contratuais", obraId],
    queryFn: async () => {
      const { data } = await api.get(`/acompanhamento/obras/${obraId}/eventos`);
      return data;
    },
    enabled: !!obraId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4">
        <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
        <p className="text-sm text-rose-700">Erro ao carregar eventos contratuais.</p>
      </div>
    );
  }

  if (!data) return null;

  const events = [
    ...data.ordens_servico.map((e: OrdemServico) => ({
      type: "ordem_servico" as const, date: e.data_emissao || e.criado_em, title: `OS Nº ${e.numero}`,
      subtitle: e.data_inicio ? `Início previsto: ${fmtDate(e.data_inicio)}` : undefined,
      body: e.processo_sei ? <span>Processo SEI: {e.processo_sei}</span> : undefined,
    })),
    ...data.aditivos_prazo.map((e: AditivoPrazo) => ({
      type: "aditivo_prazo" as const, date: e.data_assinatura || e.criado_em, title: `Aditivo Nº ${e.numero}`,
      subtitle: `+${e.dias_adicionados} dias · Vigência até ${fmtDate(e.nova_data_vigencia)}`,
      body: e.observacao ? <span>{e.observacao}</span> : undefined,
    })),
    ...data.paralisacoes.map((e: Paralisacao) => ({
      type: "paralisacao" as const, date: e.data_evento || e.criado_em, title: e.tipo === "PARALISACAO" ? "Paralisação" : "Reinício",
      subtitle: e.motivo ? `Motivo: ${e.motivo.slice(0, 80)}${e.motivo.length > 80 ? "..." : ""}` : undefined,
      body: e.saldo_dias_execucao != null ? <span>Saldo: {e.saldo_dias_execucao} dias (execução)</span> : undefined,
    })),
    ...data.readequacoes.map((e: Readequacao) => ({
      type: "readequacao" as const, date: e.data_assinatura || e.criado_em, title: `Readequação Nº ${e.numero}`,
      subtitle: e.tipo === "COM_REFLEXO" ? "Com reflexo financeiro" : "Sem reflexo financeiro",
      body: e.valor ? <span>Valor: {fmtCurrency(Number(e.valor))}</span> : e.percentual != null ? <span>Percentual: {Number(e.percentual)}%</span> : undefined,
    })),
    ...data.apostilamentos.map((e: Apostilamento) => ({
      type: "apostilamento" as const, date: e.data_assinatura || e.criado_em, title: "Apostilamento",
      subtitle: `Valor: ${fmtCurrency(Number(e.valor))}`,
      body: undefined as React.ReactNode | undefined,
    })),
    ...data.reajustes.map((e: Reajuste) => ({
      type: "reajuste" as const, date: e.data_assinatura || e.criado_em, title: "Reajuste de medição",
      subtitle: `Valor: ${fmtCurrency(Number(e.valor))}`,
      body: undefined as React.ReactNode | undefined,
    })),
    ...data.termos_recebimento.map((e: TermoRecebimento) => ({
      type: "termo_recebimento" as const, date: e.data_emissao || e.criado_em, title: `Termo de Recebimento ${e.tipo === "PROVISORIO" ? "Provisório" : "Definitivo"}`,
      subtitle: `Nº ${e.numero}`,
      body: undefined as React.ReactNode | undefined,
    })),
    ...data.notificacoes_extrajudiciais.map((e: NotificacaoExtrajudicial) => ({
      type: "notificacao_extrajudicial" as const, date: e.data_emissao || e.criado_em, title: `Notificação Nº ${e.numero}`,
      subtitle: e.assunto,
      body: undefined as React.ReactNode | undefined,
    })),
    ...data.portarias.map((e: PortariaEvento) => ({
      type: "portaria" as const, date: e.data_emissao || e.criado_em, title: `Portaria Nº ${e.numero}`,
      subtitle: `${e.tipo === "FISCAL" ? "Designação de Fiscal" : e.tipo === "GESTOR" ? "Designação de Gestor" : "Outros"}`,
      body: undefined as React.ReactNode | undefined,
    })),
  ].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalEvents = events.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Eventos Contratuais</h2>
        <span className="text-sm text-slate-400">{totalEvents} evento{totalEvents !== 1 ? "s" : ""}</span>
      </div>

      {totalEvents === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-300">
          <History className="h-12 w-12 mb-3" />
          <p className="text-sm font-medium">Nenhum evento registrado</p>
          <p className="text-xs mt-1">Os eventos contratuais desta obra aparecerão aqui.</p>
        </div>
      )}

      {totalEvents > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="space-y-0">
            {events.map((evt, i) => (
              <TimelineItem
                key={`${evt.type}-${i}`}
                date={evt.date}
                title={evt.title}
                subtitle={evt.subtitle}
                config={EVENT_CONFIG[evt.type]}
                body={evt.body}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
