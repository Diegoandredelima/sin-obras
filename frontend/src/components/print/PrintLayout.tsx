import { useEffect, useRef, type ReactNode } from "react";
import { Printer, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/auth";

interface Props {
  title: string;
  subtitle?: string;
  /** Quando true, dispara automaticamente o diálogo de impressão (uma vez). */
  ready: boolean;
  /** Orientação da página impressa. Lista de obras usa "landscape". */
  orientation?: "portrait" | "landscape";
  /** Atraso (ms) antes de abrir o diálogo de impressão. Maior em lotes. */
  printDelay?: number;
  children: ReactNode;
}

/**
 * Layout standalone para documentos imprimíveis (sem sidebar do app).
 * Renderiza cabeçalho institucional com brasão do RN, dispara `window.print()`
 * quando os dados terminam de carregar e registra quem emitiu o documento.
 * Reutilizado nos relatórios de lista, obra e contrato.
 */
const PrintLayout = ({ title, subtitle, ready, orientation = "portrait", printDelay = 500, children }: Props) => {
  const user = useAuthStore((s) => s.user);
  const printed = useRef(false);
  const landscape = orientation === "landscape";

  useEffect(() => {
    if (ready && !printed.current) {
      printed.current = true;
      // Atraso garante que layout/fontes/imagens/timelines terminem de renderizar.
      const t = setTimeout(() => window.print(), printDelay);
      return () => clearTimeout(t);
    }
  }, [ready, printDelay]);

  const hoje = new Date().toLocaleString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="bg-slate-100 print:bg-white">
      {/* Define a orientação/tamanho da página impressa */}
      <style>{`@page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: ${landscape ? "12mm" : "14mm"}; }`}</style>

      {/* Toolbar — não vai para o papel */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => window.close()}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Fechar
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-700 text-white text-sm font-semibold rounded-xl hover:bg-brand-500 transition-all"
        >
          <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
        </button>
      </div>

      {/* Documento */}
      <div className={`mx-auto bg-white shadow-sm print:shadow-none my-6 print:my-0 p-8 print:p-0 ${landscape ? "max-w-[297mm]" : "max-w-[210mm]"}`}>
        {/* Cabeçalho institucional */}
        <header className="mb-6 print-avoid-break">
          <div className="flex items-start gap-4">
            <img
              src="/brasao_RN.png"
              alt="Brasão do Estado do Rio Grande do Norte"
              className="h-20 w-auto shrink-0 object-contain"
            />
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase leading-tight">
                Governo do Estado do Rio Grande do Norte
              </p>
              <p className="text-[11px] font-semibold tracking-wide text-brand-700 uppercase leading-tight">
                Secretaria de Estado da Infraestrutura — SIN
              </p>
              <h1 className="text-xl font-bold text-slate-900 mt-2">{title}</h1>
              {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Emitido em</p>
              <p className="text-sm font-semibold text-slate-700">{hoje}</p>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mt-2">Emitido por</p>
              <p className="text-sm font-semibold text-slate-700">{user?.nome || "—"}</p>
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full sin-stripe mt-4" />
        </header>

        <main className="space-y-6">{children}</main>

        {/* Rodapé */}
        <footer className="mt-10 pt-4 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between print-avoid-break">
          <span>Documento gerado pelo sistema SIN-Obras{user?.nome ? ` por ${user.nome}` : ""}.</span>
          <span>{hoje}</span>
        </footer>
      </div>
    </div>
  );
};

export default PrintLayout;
