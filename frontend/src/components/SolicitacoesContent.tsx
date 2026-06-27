import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pause, Clock, Loader2, Send } from "lucide-react";
import api from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { fmtDate } from "@/utils/format";

/**
 * SolicitacoesContent — Portal da Empresa (RF12 / US-E05)
 *
 * Permite à empresa formalizar paralisações e solicitar aditivos de prazo nos
 * seus contratos, acompanhando a tramitação (Recebida → Em Análise → Deferida /
 * Indeferida). Perfis internos (Apoio N2+) atualizam o status da tramitação.
 */

interface Tramitavel {
  id: string;
  status_tramitacao: string | null;
  solicitado_por_id: string | null;
  criado_em: string;
}
interface Paralisacao extends Tramitavel {
  tipo: string;
  data_evento: string;
  motivo: string | null;
}
interface AditivoPrazo extends Tramitavel {
  numero: number;
  dias_adicionados: number;
  nova_data_vigencia: string;
  nova_data_execucao: string;
  observacao: string | null;
}

const TRAMITACAO_CFG: Record<string, string> = {
  RECEBIDA: "bg-sky-100 text-sky-700",
  EM_ANALISE: "bg-amber-100 text-amber-700",
  DEFERIDA: "bg-emerald-100 text-emerald-700",
  INDEFERIDA: "bg-rose-100 text-rose-700",
};

const APOIO_ROLES = ["APOIO_N2", "COORDENADOR", "SECRETARIO", "ENGENHEIRO"];

const StatusBadge = ({ status }: { status: string | null }) =>
  status ? (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TRAMITACAO_CFG[status] || "bg-slate-100 text-slate-600"}`}>
      {status.replace("_", " ")}
    </span>
  ) : (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">interno</span>
  );

export const SolicitacoesContent = ({ objetoId }: { objetoId: string }) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isEmpresa = user?.tipo === "EMPRESA";
  const isApoio = APOIO_ROLES.includes(user?.tipo ?? "");

  const [form, setForm] = useState<"none" | "paralisacao" | "aditivo">("none");
  const [par, setPar] = useState({ data_evento: "", motivo: "" });
  const [adi, setAdi] = useState({ numero: 1, dias_adicionados: 30, nova_data_vigencia: "", nova_data_execucao: "", observacao: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: paralisacoes = [], isLoading: lp } = useQuery<Paralisacao[]>({
    queryKey: ["paralisacoes", objetoId],
    queryFn: async () => (await api.get(`/acompanhamento/objetos/${objetoId}/paralisacoes`)).data,
    enabled: !!objetoId,
  });
  const { data: aditivos = [], isLoading: la } = useQuery<AditivoPrazo[]>({
    queryKey: ["aditivos", objetoId],
    queryFn: async () => (await api.get(`/acompanhamento/objetos/${objetoId}/aditivos-prazo`)).data,
    enabled: !!objetoId,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["paralisacoes", objetoId] });
    queryClient.invalidateQueries({ queryKey: ["aditivos", objetoId] });
  };

  const criarParalisacao = async () => {
    if (!par.data_evento) { setError("Informe a data do evento."); return; }
    setSaving(true); setError(null);
    try {
      await api.post(`/acompanhamento/objetos/${objetoId}/paralisacoes`, {
        tipo: "PARALISACAO", data_evento: par.data_evento, motivo: par.motivo || null,
      });
      setPar({ data_evento: "", motivo: "" }); setForm("none"); refresh();
    } catch { setError("Erro ao formalizar paralisação."); }
    finally { setSaving(false); }
  };

  const criarAditivo = async () => {
    if (!adi.nova_data_vigencia || !adi.nova_data_execucao) { setError("Informe as novas datas."); return; }
    setSaving(true); setError(null);
    try {
      await api.post(`/acompanhamento/objetos/${objetoId}/aditivos-prazo`, adi);
      setForm("none"); refresh();
    } catch { setError("Erro ao solicitar aditivo."); }
    finally { setSaving(false); }
  };

  const tramitar = async (tipo: "paralisacoes" | "aditivos-prazo", id: string, status: string) => {
    await api.patch(`/acompanhamento/${tipo}/${id}/tramitacao`, null, { params: { novo_status: status } });
    refresh();
  };

  const TramitacaoBtns = ({ tipo, id }: { tipo: "paralisacoes" | "aditivos-prazo"; id: string }) =>
    isApoio ? (
      <div className="flex gap-1.5 mt-2">
        {["EM_ANALISE", "DEFERIDA", "INDEFERIDA"].map((s) => (
          <button key={s} onClick={() => tramitar(tipo, id, s)}
            className="text-[10px] font-semibold px-2 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
            {s.replace("_", " ")}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      {isEmpresa && (
        <div className="flex gap-2">
          <button onClick={() => setForm(form === "paralisacao" ? "none" : "paralisacao")}
            className="inline-flex items-center gap-2 px-3 py-2 bg-orange-600 text-white text-xs font-semibold rounded-xl hover:bg-orange-500 transition-all">
            <Pause className="h-3.5 w-3.5" /> Formalizar Paralisação
          </button>
          <button onClick={() => setForm(form === "aditivo" ? "none" : "aditivo")}
            className="inline-flex items-center gap-2 px-3 py-2 bg-amber-600 text-white text-xs font-semibold rounded-xl hover:bg-amber-500 transition-all">
            <Clock className="h-3.5 w-3.5" /> Solicitar Aditivo de Prazo
          </button>
        </div>
      )}

      {form === "paralisacao" && (
        <div className="rounded-xl border border-slate-100 p-4 space-y-3 bg-slate-50/50">
          <input type="date" value={par.data_evento} onChange={(e) => setPar({ ...par, data_evento: e.target.value })}
            className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" />
          <textarea value={par.motivo} onChange={(e) => setPar({ ...par, motivo: e.target.value })} rows={2}
            placeholder="Motivo da paralisação" className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm resize-none" />
          {error && <p className="text-xs text-rose-500">{error}</p>}
          <button onClick={criarParalisacao} disabled={saving}
            className="inline-flex items-center gap-2 px-3 py-2 bg-brand-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Enviar
          </button>
        </div>
      )}

      {form === "aditivo" && (
        <div className="rounded-xl border border-slate-100 p-4 grid grid-cols-2 gap-3 bg-slate-50/50">
          <label className="text-xs text-slate-500">Dias adicionados
            <input type="number" value={adi.dias_adicionados} onChange={(e) => setAdi({ ...adi, dias_adicionados: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" />
          </label>
          <label className="text-xs text-slate-500">Nº do aditivo
            <input type="number" value={adi.numero} onChange={(e) => setAdi({ ...adi, numero: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" />
          </label>
          <label className="text-xs text-slate-500">Nova vigência
            <input type="date" value={adi.nova_data_vigencia} onChange={(e) => setAdi({ ...adi, nova_data_vigencia: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" />
          </label>
          <label className="text-xs text-slate-500">Nova execução
            <input type="date" value={adi.nova_data_execucao} onChange={(e) => setAdi({ ...adi, nova_data_execucao: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" />
          </label>
          <textarea value={adi.observacao} onChange={(e) => setAdi({ ...adi, observacao: e.target.value })} rows={2}
            placeholder="Justificativa" className="col-span-2 rounded-lg border border-slate-200 py-2 px-3 text-sm resize-none" />
          {error && <p className="col-span-2 text-xs text-rose-500">{error}</p>}
          <button onClick={criarAditivo} disabled={saving}
            className="col-span-2 inline-flex items-center justify-center gap-2 px-3 py-2 bg-brand-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Enviar solicitação
          </button>
        </div>
      )}

      <section>
        <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2"><Pause className="h-4 w-4 text-orange-500" /> Paralisações</h4>
        {lp ? <Loader2 className="h-5 w-5 text-slate-300 animate-spin" /> : paralisacoes.length === 0 ? (
          <p className="text-xs text-slate-400">Nenhuma paralisação registrada.</p>
        ) : (
          <div className="space-y-2">
            {paralisacoes.map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">{p.tipo} • {fmtDate(p.data_evento)}</span>
                  <StatusBadge status={p.status_tramitacao} />
                </div>
                {p.motivo && <p className="text-xs text-slate-500 mt-1">{p.motivo}</p>}
                {p.status_tramitacao && <TramitacaoBtns tipo="paralisacoes" id={p.id} />}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500" /> Aditivos de Prazo</h4>
        {la ? <Loader2 className="h-5 w-5 text-slate-300 animate-spin" /> : aditivos.length === 0 ? (
          <p className="text-xs text-slate-400">Nenhum aditivo registrado.</p>
        ) : (
          <div className="space-y-2">
            {aditivos.map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Aditivo #{a.numero} • +{a.dias_adicionados} dias</span>
                  <StatusBadge status={a.status_tramitacao} />
                </div>
                {a.observacao && <p className="text-xs text-slate-500 mt-1">{a.observacao}</p>}
                {a.status_tramitacao && <TramitacaoBtns tipo="aditivos-prazo" id={a.id} />}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default SolicitacoesContent;
