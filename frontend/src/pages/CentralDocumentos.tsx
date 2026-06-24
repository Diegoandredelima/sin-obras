import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, FolderDown, FileText, FileSpreadsheet, Loader2, Building2,
  BookOpen, Camera, Ruler, ClipboardList, ChevronRight,
} from "lucide-react";
import api from "@/services/api";

/** Linha da view vw_relatorio_objetos (subconjunto usado aqui). */
interface ObjetoRow {
  objeto_id: string;
  titulo: string;
  municipio: string | null;
  contrato_numero: string | null;
  empresa_razao_social: string | null;
  ano_referencia: number | null;
}

interface MedicaoRow {
  id: string;
  numero_medicao: number;
  status: string;
}

interface DiarioRow {
  id: string;
  data_registro: string;
}

interface Filtros { search: string; ano: string; contrato: string }

const INPUT =
  "block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all";

/** Abre uma rota de impressão (gera PDF via navegador) em nova aba. */
const abrirPdf = (path: string) => window.open(path, "_blank", "noopener");

const CentralDocumentos = () => {
  const [filtros, setFiltros] = useState<Filtros>({ search: "", ano: "", contrato: "" });
  const [aplicado, setAplicado] = useState<Filtros | null>(null);
  const [objetoSel, setObjetoSel] = useState<ObjetoRow | null>(null);

  const { data: anos } = useQuery<{ ano_min: number; ano_max: number }>({
    queryKey: ["relatorio-anos"],
    queryFn: async () => (await api.get("/relatorios/anos")).data,
  });
  const anoOptions = useMemo(() => {
    if (!anos) return [];
    const out: number[] = [];
    for (let a = anos.ano_max; a >= anos.ano_min; a--) out.push(a);
    return out;
  }, [anos]);

  const { data: objetos = [], isFetching } = useQuery<ObjetoRow[]>({
    queryKey: ["central-objetos", aplicado],
    enabled: !!aplicado,
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (aplicado?.search) params.search = aplicado.search;
      if (aplicado?.ano) params.ano = aplicado.ano;
      const { data } = await api.get("/relatorios/objetos", { params });
      return data;
    },
  });

  // Filtro de nº de contrato é aplicado no cliente (a busca da API já cobre,
  // mas mantemos o campo dedicado pedido no fluxo).
  const objetosFiltradas = useMemo(() => {
    const c = aplicado?.contrato?.trim().toLowerCase();
    if (!c) return objetos;
    return objetos.filter((o) => (o.contrato_numero || "").toLowerCase().includes(c));
  }, [objetos, aplicado]);

  const buscar = () => { setObjetoSel(null); setAplicado({ ...filtros }); };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <FolderDown className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Central de Emissão de Documentos</h2>
          <p className="text-sm text-slate-500">Gere e baixe os documentos do objeto em PDF e XLS.</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="pointer-events-none absolute inset-y-0 left-3 flex items-center h-full w-4 text-slate-400" />
            <input
              value={filtros.search}
              onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
              placeholder="Buscar por objeto, município ou empresa..."
              className={INPUT + " pl-10"}
            />
          </div>
          <div className="sm:col-span-3">
            <input
              value={filtros.contrato}
              onChange={(e) => setFiltros({ ...filtros, contrato: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
              placeholder="Nº do contrato"
              className={INPUT}
            />
          </div>
          <div className="sm:col-span-2">
            <select value={filtros.ano} onChange={(e) => setFiltros({ ...filtros, ano: e.target.value })} className={INPUT}>
              <option value="">Ano</option>
              {anoOptions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="sm:col-span-1">
            <button onClick={buscar}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-700/20 transition-all">
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Resultado: tabela de objetos */}
      {aplicado && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Objetos encontradas</span>
            <span className="text-xs text-slate-400">{objetosFiltradas.length} resultado(s)</span>
          </div>
          {isFetching ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 text-slate-300 animate-spin" /></div>
          ) : objetosFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-8 w-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-500">Nenhum objeto encontrada com esses filtros.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase text-slate-400">
                  <tr>
                    <th className="text-left px-5 py-2.5 font-semibold">Objeto</th>
                    <th className="text-left px-5 py-2.5 font-semibold">Município</th>
                    <th className="text-left px-5 py-2.5 font-semibold">Contrato</th>
                    <th className="text-left px-5 py-2.5 font-semibold">Empresa</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {objetosFiltradas.map((o) => {
                    const sel = objetoSel?.objeto_id === o.objeto_id;
                    return (
                      <tr key={o.objeto_id}
                        onClick={() => setObjetoSel(o)}
                        className={`border-t border-slate-50 cursor-pointer transition-colors ${sel ? "bg-brand-50" : "hover:bg-slate-50"}`}>
                        <td className="px-5 py-3 font-medium text-slate-800">{o.titulo}</td>
                        <td className="px-5 py-3 text-slate-500">{o.municipio || "—"}</td>
                        <td className="px-5 py-3 text-slate-500">{o.contrato_numero || "—"}</td>
                        <td className="px-5 py-3 text-slate-500">{o.empresa_razao_social || "—"}</td>
                        <td className="px-5 py-3 text-right">
                          <ChevronRight className={`h-4 w-4 inline ${sel ? "text-brand-700" : "text-slate-300"}`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Painel de documentos do objeto selecionada */}
      {objetoSel && <PainelDocumentos objeto={objetoSel} />}
    </div>
  );
};

const STATUS_LABEL: Record<string, string> = {
  RASCUNHO: "Rascunho", ASSINADA: "Assinada", EM_FISCALIZACAO: "Em fiscalização",
  APROVADA: "Aprovada", REPROVADA: "Reprovada",
};

const PainelDocumentos = ({ objeto }: { objeto: ObjetoRow }) => {
  const [medicaoId, setMedicaoId] = useState("");
  const [diarioId, setDiarioId] = useState("");
  const [baixando, setBaixando] = useState<string | null>(null);

  const { data: medicoes = [] } = useQuery<MedicaoRow[]>({
    queryKey: ["central-medicoes", objeto.objeto_id],
    queryFn: async () => (await api.get(`/empresa/objetos/${objeto.objeto_id}/medicoes`)).data,
  });
  const { data: diarios = [] } = useQuery<DiarioRow[]>({
    queryKey: ["central-diario", objeto.objeto_id],
    queryFn: async () => (await api.get(`/empresa/objetos/${objeto.objeto_id}/diario`)).data,
  });

  /** Baixa um XLS de documento (formato=xls) seguindo o padrão de blob. */
  const baixarXls = async (id: string, path: string, filename: string) => {
    setBaixando(id);
    try {
      const res = await api.get(path, { params: { formato: "xls" }, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Erro ao gerar o documento. Verifique se há dados para emissão.");
    } finally {
      setBaixando(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{objeto.titulo}</h3>
        <p className="text-xs text-slate-500">Contrato {objeto.contrato_numero || "—"} · {objeto.municipio || "—"}</p>
      </div>

      {/* Documentos do objeto */}
      <section className="space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Documentos do objeto</p>
        <DocCard icon={<ClipboardList className="h-5 w-5" />} titulo="Relatório do Objeto"
          descricao="Resumo institucional do objeto.">
          <BtnPdf onClick={() => abrirPdf(`/objetos/${objeto.objeto_id}/relatorio`)} />
        </DocCard>
      </section>

      {/* Por medição */}
      <section className="space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Por medição</p>
        <select value={medicaoId} onChange={(e) => setMedicaoId(e.target.value)} className={INPUT + " sm:max-w-sm"}>
          <option value="">Selecione a medição...</option>
          {medicoes.map((m) => (
            <option key={m.id} value={m.id}>Medição #{m.numero_medicao} — {STATUS_LABEL[m.status] || m.status}</option>
          ))}
        </select>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <DocCard icon={<FileText className="h-5 w-5" />} titulo="Boletim de Medição" descricao="Boletim físico-financeiro.">
            <BtnPdf disabled={!medicaoId} onClick={() => abrirPdf(`/medicoes/${medicaoId}/boletim`)} />
            <BtnXls disabled={!medicaoId} loading={baixando === `bol-${medicaoId}`}
              onClick={() => baixarXls(`bol-${medicaoId}`, `/documentos/medicoes/${medicaoId}/boletim`, `boletim_${medicaoId}.xlsx`)} />
          </DocCard>
          <DocCard icon={<Ruler className="h-5 w-5" />} titulo="Memória de Cálculo" descricao="Dimensões medidas por item.">
            <BtnPdf disabled={!medicaoId} onClick={() => abrirPdf(`/medicoes/${medicaoId}/memoria-calculo`)} />
            <BtnXls disabled={!medicaoId} loading={baixando === `mem-${medicaoId}`}
              onClick={() => baixarXls(`mem-${medicaoId}`, `/documentos/medicoes/${medicaoId}/memoria-calculo`, `memoria_${medicaoId}.xlsx`)} />
          </DocCard>
          <DocCard icon={<Camera className="h-5 w-5" />} titulo="Relatório Fotográfico" descricao="Fotos por meta construtiva.">
            <BtnPdf disabled={!medicaoId} onClick={() => abrirPdf(`/medicoes/${medicaoId}/relatorio-fotografico`)} />
          </DocCard>
        </div>
      </section>

      {/* RDO / Livro de Ocorrência */}
      <section className="space-y-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Livro de Ocorrência (RDO)</p>
        <select value={diarioId} onChange={(e) => setDiarioId(e.target.value)} className={INPUT + " sm:max-w-sm"}>
          <option value="">Selecione o registro diário...</option>
          {diarios.map((d) => (
            <option key={d.id} value={d.id}>{new Date(d.data_registro + "T12:00:00").toLocaleDateString("pt-BR")}</option>
          ))}
        </select>
        <DocCard icon={<BookOpen className="h-5 w-5" />} titulo="RDO — Relatório Diário de Obra" descricao="Tempo, equipamentos, mão de obra e atividades.">
          <BtnPdf disabled={!diarioId} onClick={() => abrirPdf(`/objetos/${objeto.objeto_id}/diario/${diarioId}/rdo`)} />
          <BtnXls disabled={!diarioId} loading={baixando === `rdo-${diarioId}`}
            onClick={() => baixarXls(`rdo-${diarioId}`, `/documentos/diario/${diarioId}/rdo`, `rdo_${diarioId}.xlsx`)} />
        </DocCard>
      </section>
    </div>
  );
};

const DocCard = ({ icon, titulo, descricao, children }: { icon: React.ReactNode; titulo: string; descricao: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 flex flex-col gap-3">
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-100 text-brand-700 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{titulo}</p>
        <p className="text-xs text-slate-500">{descricao}</p>
      </div>
    </div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);

const BtnPdf = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
  <button onClick={onClick} disabled={disabled}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
    <FileText className="h-3.5 w-3.5" /> PDF
  </button>
);

const BtnXls = ({ onClick, disabled, loading }: { onClick: () => void; disabled?: boolean; loading?: boolean }) => (
  <button onClick={onClick} disabled={disabled || loading}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />} XLS
  </button>
);

export default CentralDocumentos;
