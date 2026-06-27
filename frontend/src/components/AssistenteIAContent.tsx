import { useState } from "react";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";
import api from "@/services/api";

/**
 * AssistenteIAContent — Assistente de IA (RF21)
 *
 * Aciona a análise dos Diários de Obra pelo Claude e exibe os alertas de risco
 * em linguagem simples, cada um com o trecho originador. Quando a IA está
 * desabilitada no backend, mostra um aviso amigável.
 */
interface AlertaIA {
  titulo: string;
  gravidade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
  descricao: string;
  trecho: string;
}
interface RespostaIA {
  habilitado: boolean;
  total_diarios: number;
  alertas: AlertaIA[];
}

const GRAV_CLS: Record<string, string> = {
  BAIXA: "bg-slate-100 text-slate-600",
  MEDIA: "bg-amber-100 text-amber-700",
  ALTA: "bg-orange-100 text-orange-700",
  CRITICA: "bg-rose-100 text-rose-700",
};

export const AssistenteIAContent = ({ objetoId }: { objetoId: string }) => {
  const [data, setData] = useState<RespostaIA | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cientes, setCientes] = useState<Record<number, string>>({});

  const analisar = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/ia/objetos/${objetoId}/analisar-diarios`);
      setData(res.data);
    } catch {
      setError("Erro ao analisar os diários.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-600" />
          <h3 className="text-sm font-semibold text-slate-800">Análise de riscos por IA</h3>
        </div>
        <button onClick={analisar} disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 bg-brand-700 text-white text-xs font-semibold rounded-xl hover:bg-brand-500 transition-all disabled:opacity-50">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Analisar Diários
        </button>
      </div>

      {error && <p className="text-xs text-rose-500">{error}</p>}

      {data && !data.habilitado && (
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          O assistente de IA está desabilitado neste ambiente (defina <code className="font-mono">IA_ENABLED</code> e a chave da API).
        </div>
      )}

      {data && data.habilitado && (
        <p className="text-xs text-slate-500">{data.total_diarios} diário(s) analisado(s) · {data.alertas.length} alerta(s)</p>
      )}

      <div className="space-y-3">
        {data?.alertas.map((a, i) => (
          <div key={i} className={`rounded-xl border p-4 ${cientes[i] ? "opacity-50 border-slate-100" : "border-slate-100"}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">{a.titulo}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${GRAV_CLS[a.gravidade] || GRAV_CLS.BAIXA}`}>
                {a.gravidade}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-1">{a.descricao}</p>
            <p className="text-xs text-slate-400 mt-2 italic border-l-2 border-slate-200 pl-2">"{a.trecho}"</p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setCientes((p) => ({ ...p, [i]: "CIENTE" }))}
                className="text-[10px] font-semibold px-2 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                Ciente
              </button>
              <button onClick={() => setCientes((p) => ({ ...p, [i]: "FALSO" }))}
                className="text-[10px] font-semibold px-2 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                Falso Positivo
              </button>
              {cientes[i] && <span className="text-[10px] text-slate-400 self-center">marcado: {cientes[i]}</span>}
            </div>
          </div>
        ))}
        {data?.habilitado && data.alertas.length === 0 && (
          <p className="text-xs text-slate-400">Nenhum risco relevante identificado.</p>
        )}
      </div>
    </div>
  );
};

export default AssistenteIAContent;
