import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { fmtCurrency, fmtDate } from "@/utils/format";
import type { EventosContratuais } from "@/types";

interface ContratoBase {
  data_assinatura?: string | null;
  valor_global?: number | null;
  valor_final?: number | null;
}

interface Props {
  obraId: string;
  /** Quando informado, busca o contrato para o marco de assinatura/valor. */
  contratoId?: string | null;
}

interface Marco {
  data: string | null;
  titulo: string;
  detalhe?: string;
  valor?: number | null;
  cor: string; // classe da bolinha
}

/**
 * Linha do tempo de marcos contratuais da obra: assinatura, ordem de serviço,
 * aditivos de prazo, readequações/aditivos de valor, apostilamentos,
 * paralisações e termos de recebimento. Fonte: contrato + eventos contratuais
 * (`/acompanhamento/obras/{id}/eventos`).
 */
const MarcosContratuais = ({ obraId, contratoId }: Props) => {
  const { data: eventos } = useQuery<EventosContratuais>({
    queryKey: ["marcos-eventos", obraId],
    queryFn: async () => {
      const { data } = await api.get(`/acompanhamento/obras/${obraId}/eventos`);
      return data;
    },
    enabled: !!obraId,
    retry: false,
  });

  const { data: contrato } = useQuery<ContratoBase>({
    queryKey: ["marcos-contrato", contratoId],
    queryFn: async () => {
      const { data } = await api.get(`/contratos/${contratoId}`);
      return data;
    },
    enabled: !!contratoId,
    retry: false,
  });

  const marcos: Marco[] = [];

  // 1) Assinatura do contrato (valor inicial)
  if (contrato?.data_assinatura) {
    marcos.push({
      data: contrato.data_assinatura,
      titulo: "Assinatura do contrato",
      valor: contrato.valor_global ?? null,
      detalhe: "Valor contratado inicial",
      cor: "bg-brand-500",
    });
  }

  if (eventos) {
    (eventos.ordens_servico ?? []).forEach((o) =>
      marcos.push({
        data: o.data_inicio || o.data_emissao,
        titulo: `Ordem de Serviço${o.numero ? ` Nº ${o.numero}` : ""}`,
        detalhe: "Início da execução",
        cor: "bg-sky-400",
      }),
    );
    (eventos.aditivos_prazo ?? []).forEach((a) =>
      marcos.push({
        data: a.data_assinatura || a.data_publicacao || a.criado_em,
        titulo: `Aditivo de Prazo Nº ${a.numero}`,
        detalhe: `+ ${a.dias_adicionados} dias${a.nova_data_vigencia ? ` · nova vigência ${fmtDate(a.nova_data_vigencia)}` : ""}`,
        cor: "bg-amber-400",
      }),
    );
    (eventos.readequacoes ?? []).forEach((r) =>
      marcos.push({
        data: r.data_assinatura || r.data_publicacao || r.criado_em,
        titulo: `Readequação Nº ${r.numero}${r.tipo ? ` (${r.tipo})` : ""}`,
        valor: r.valor,
        detalhe: r.percentual != null ? `${Number(r.percentual).toFixed(2)}% do contrato` : undefined,
        cor: "bg-purple-400",
      }),
    );
    (eventos.apostilamentos ?? []).forEach((ap) =>
      marcos.push({
        data: ap.data_assinatura || ap.data_publicacao || ap.criado_em,
        titulo: "Apostilamento",
        valor: ap.valor,
        detalhe: ap.descricao || undefined,
        cor: "bg-brand-400",
      }),
    );
    (eventos.paralisacoes ?? []).forEach((p) =>
      marcos.push({
        data: p.data_evento,
        titulo: `Paralisação${p.tipo ? ` (${p.tipo})` : ""}`,
        detalhe: p.motivo || undefined,
        cor: "bg-orange-400",
      }),
    );
    (eventos.termos_recebimento ?? []).forEach((t) =>
      marcos.push({
        data: t.data_emissao,
        titulo: `Termo de Recebimento${t.tipo ? ` (${t.tipo})` : ""}${t.numero ? ` Nº ${t.numero}` : ""}`,
        cor: "bg-emerald-400",
      }),
    );
  }

  // Ordena por data (sem data vai para o fim)
  const ordenados = marcos
    .filter((m) => m.data)
    .sort((a, b) => (a.data! < b.data! ? -1 : a.data! > b.data! ? 1 : 0));

  const temReajuste =
    contrato?.valor_final != null &&
    contrato?.valor_global != null &&
    Number(contrato.valor_final) !== Number(contrato.valor_global);

  if (ordenados.length === 0 && !temReajuste) {
    return (
      <section className="rounded-xl border border-slate-200 p-5 print-card">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-2">Linha do tempo — marcos contratuais</h2>
        <p className="text-sm text-slate-400">
          Nenhum marco contratual registrado (assinatura, ordem de serviço, aditivos…).
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 p-5 print-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Linha do tempo — marcos contratuais</h2>
        {temReajuste && (
          <span className="text-xs text-slate-500">
            Valor final: <span className="font-semibold text-slate-800">{fmtCurrency(contrato!.valor_final)}</span>
          </span>
        )}
      </div>

      <div className="relative pl-5">
        <span className="absolute left-[7px] top-1 bottom-1 w-px bg-slate-200" aria-hidden />
        <div className="space-y-3">
          {ordenados.map((m, i) => (
            <div key={i} className="relative print-avoid-break">
              <span className={`absolute -left-5 top-1 h-3 w-3 rounded-full border-2 border-white ring-1 ring-slate-200 ${m.cor}`} />
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold text-slate-800">{m.titulo}</span>
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">{fmtDate(m.data)}</span>
              </div>
              {(m.valor != null || m.detalhe) && (
                <div className="flex items-baseline justify-between gap-3 mt-0.5">
                  <span className="text-xs text-slate-500">{m.detalhe || ""}</span>
                  {m.valor != null && (
                    <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap">{fmtCurrency(m.valor)}</span>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Valor final consolidado, quando houve reajuste/aditivo de valor */}
          {temReajuste && (
            <div className="relative print-avoid-break">
              <span className="absolute -left-5 top-1 h-3 w-3 rounded-full border-2 border-white ring-1 ring-slate-200 bg-slate-700" />
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold text-slate-800">Valor final do contrato</span>
                <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap">{fmtCurrency(contrato!.valor_final)}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Variação sobre o valor inicial de {fmtCurrency(contrato!.valor_global)}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MarcosContratuais;
