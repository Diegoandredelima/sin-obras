import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Upload, Loader2, AlertTriangle, History } from "lucide-react";
import api from "@/services/api";
import { fmtDate } from "@/utils/format";

/**
 * DocumentosContent — Documentos Contratuais (RF11)
 *
 * Upload com versionamento e listagem dos documentos do objeto (ART, plantas,
 * licenças, garantias, seguros), com destaque de vencimento.
 */
type TipoDoc = "ART" | "PLANTA" | "LICENCA" | "GARANTIA" | "SEGURO" | "OUTRO";
interface Documento {
  id: string;
  tipo: TipoDoc;
  nome: string;
  url_storage: string | null;
  data_validade: string | null;
  versao: number;
  ativo: boolean;
  criado_em: string;
}

const TIPOS: TipoDoc[] = ["ART", "PLANTA", "LICENCA", "GARANTIA", "SEGURO", "OUTRO"];

function statusVencimento(validade: string | null): { label: string; cls: string } | null {
  if (!validade) return null;
  const dias = Math.ceil((new Date(validade + "T00:00:00").getTime() - Date.now()) / 86400000);
  if (dias < 0) return { label: "Vencido", cls: "bg-rose-100 text-rose-700" };
  if (dias <= 30) return { label: `Vence em ${dias}d`, cls: "bg-amber-100 text-amber-700" };
  return { label: "Em dia", cls: "bg-emerald-100 text-emerald-700" };
}

export const DocumentosContent = ({ objetoId }: { objetoId: string }) => {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tipo, setTipo] = useState<TipoDoc>("ART");
  const [nome, setNome] = useState("");
  const [validade, setValidade] = useState("");
  const [historico, setHistorico] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const { data: docs = [], isLoading } = useQuery<Documento[]>({
    queryKey: ["documentos", objetoId, historico],
    queryFn: async () =>
      (await api.get(`/documentos-contratuais/objetos/${objetoId}`, { params: { incluir_historico: historico } })).data,
    enabled: !!objetoId,
  });

  const enviar = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !nome.trim()) { setErro("Informe o nome e selecione um arquivo."); return; }
    setEnviando(true);
    setErro(null);
    try {
      const fd = new FormData();
      fd.append("tipo", tipo);
      fd.append("nome", nome);
      if (validade) fd.append("data_validade", validade);
      fd.append("file", file);
      await api.post(`/documentos-contratuais/objetos/${objetoId}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNome(""); setValidade("");
      if (fileRef.current) fileRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["documentos", objetoId] });
    } catch {
      setErro("Erro ao enviar o documento.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs text-slate-500">Tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoDoc)}
            className="mt-1 w-full rounded-lg border border-slate-200 py-2 px-3 text-sm bg-white">
            {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-500">Nome
          <input value={nome} onChange={(e) => setNome(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" placeholder="Ex.: ART principal" />
        </label>
        <label className="text-xs text-slate-500">Validade (opcional)
          <input type="date" value={validade} onChange={(e) => setValidade(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 py-2 px-3 text-sm" />
        </label>
        <label className="text-xs text-slate-500">Arquivo (PDF)
          <input ref={fileRef} type="file" accept="application/pdf,image/*"
            className="mt-1 w-full text-sm" />
        </label>
        {erro && <p className="col-span-full text-xs text-rose-500">{erro}</p>}
        <button onClick={enviar} disabled={enviando}
          className="col-span-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-brand-700 text-white text-xs font-semibold rounded-xl hover:bg-brand-500 transition-all disabled:opacity-50">
          {enviando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Enviar nova versão
        </button>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{docs.length} documento(s)</span>
        <button onClick={() => setHistorico((h) => !h)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-700">
          <History className="h-3.5 w-3.5" /> {historico ? "Ocultar histórico" : "Mostrar histórico"}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 text-slate-300 animate-spin" /></div>
      ) : docs.length === 0 ? (
        <p className="text-xs text-slate-400">Nenhum documento cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => {
            const venc = statusVencimento(d.data_validade);
            return (
              <div key={d.id} className={`rounded-xl border p-3 flex items-center justify-between gap-3 ${d.ativo ? "border-slate-100" : "border-slate-100 opacity-60"}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {d.nome} <span className="text-xs text-slate-400">v{d.versao} · {d.tipo}</span>
                      {!d.ativo && <span className="ml-2 text-[10px] text-slate-400">(histórico)</span>}
                    </p>
                    <p className="text-xs text-slate-400">
                      {d.data_validade ? `Validade ${fmtDate(d.data_validade)}` : "Sem validade"} · enviado {fmtDate(d.criado_em)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {venc && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${venc.cls}`}>{venc.label}</span>}
                  {d.url_storage && !d.url_storage.startsWith("mock://") && (
                    <a href={d.url_storage} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand-700 hover:underline">Abrir</a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {docs.some((d) => statusVencimento(d.data_validade)?.label === "Vencido") && (
        <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Há documentos vencidos — providencie a regularização.
        </div>
      )}
    </div>
  );
};

export default DocumentosContent;
