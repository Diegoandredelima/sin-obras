import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, BookOpen, CloudSun, AlertCircle, Users, Loader2, Trash2, Wrench, HardHat, CloudRain } from "lucide-react";
import api from "@/services/api";
import { fmtDate } from "@/utils/format";

// Condições de tempo do RDO (espelham o enum CondicaoTempo do backend).
const TEMPO_OPTIONS = [
  { value: "BOM", label: "Bom" },
  { value: "CHUVA_FRACA", label: "Chuva fraca" },
  { value: "CHUVA_FORTE", label: "Chuva forte" },
] as const;
const TEMPO_LABEL: Record<string, string> = Object.fromEntries(TEMPO_OPTIONS.map((o) => [o.value, o.label]));

const INPUT_CLS =
  "block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all";

interface EquipLinha { nome: string; quantidade: number }
interface MaoObraLinha { funcao: string; quantidade: number }

interface RegistroDiario {
  id: string;
  data_registro: string;
  clima?: string;
  qtd_funcionarios: number;
  atividades_realizadas?: string;
  ocorrencias?: string;
  equipamentos?: string;
  tempo_manha?: string | null;
  tempo_tarde?: string | null;
  pluviometria_mm?: number | string | null;
  equipamentos_lista?: EquipLinha[] | null;
  mao_de_obra?: MaoObraLinha[] | null;
  observacoes_fiscal?: string | null;
}

interface DiarioFormData {
  data_registro: string;
  tempo_manha: string;
  tempo_tarde: string;
  pluviometria_mm: string;
  equipamentos_lista: EquipLinha[];
  mao_de_obra: MaoObraLinha[];
  atividades_realizadas: string;
  ocorrencias: string;
  observacoes_fiscal: string;
}

/** Editor de linhas {label-field, quantidade} para Equipamento e Mão de Objeto. */
const ListaQuantidade = <T extends { quantidade: number }>({
  titulo, icon, linhas, campoNome, placeholder, onChange,
}: {
  titulo: string;
  icon: React.ReactNode;
  linhas: T[];
  campoNome: Exclude<keyof T, "quantidade"> & string;
  placeholder: string;
  onChange: (linhas: T[]) => void;
}) => {
  const setLinha = (i: number, patch: Partial<T>) =>
    onChange(linhas.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLinha = () => onChange([...linhas, { [campoNome]: "", quantidade: 1 } as unknown as T]);
  const removeLinha = (i: number) => onChange(linhas.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">{icon}{titulo}</label>
        <button type="button" onClick={addLinha}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-500 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Adicionar
        </button>
      </div>
      {linhas.length === 0 ? (
        <p className="text-xs text-slate-400">Nenhum item.</p>
      ) : (
        <div className="space-y-2">
          {linhas.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={String(l[campoNome] ?? "")} placeholder={placeholder}
                onChange={(e) => setLinha(i, { [campoNome]: e.target.value } as unknown as Partial<T>)}
                className={INPUT_CLS + " flex-1"}
              />
              <input type="number" min="0" step="1" value={Number(l.quantidade)} aria-label="Quantidade"
                onChange={(e) => setLinha(i, { quantidade: Number(e.target.value) } as Partial<T>)}
                className={INPUT_CLS + " w-24"}
              />
              <button type="button" onClick={() => removeLinha(i)}
                className="p-2 text-slate-400 hover:text-rose-500 transition-colors" aria-label="Remover">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DiarioForm = ({ objetoId, onSuccess, onCancel }: { objetoId: string; onSuccess: () => void; onCancel: () => void }) => {
  const [form, setForm] = useState<DiarioFormData>({
    data_registro: new Date().toISOString().split("T")[0],
    tempo_manha: "",
    tempo_tarde: "",
    pluviometria_mm: "",
    equipamentos_lista: [],
    mao_de_obra: [],
    atividades_realizadas: "",
    ocorrencias: "",
    observacoes_fiscal: "",
  });
  const [loading, setLoading] = useState(false);

  const update = (field: keyof DiarioFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const equipamentos = form.equipamentos_lista.filter((l) => l.nome.trim());
      const maoObra = form.mao_de_obra.filter((l) => l.funcao.trim());
      const payload = {
        data_registro: form.data_registro,
        tempo_manha: form.tempo_manha || null,
        tempo_tarde: form.tempo_tarde || null,
        pluviometria_mm: form.pluviometria_mm === "" ? null : Number(form.pluviometria_mm),
        // Soma da mão de obra mantém o campo legado qtd_funcionarios coerente.
        qtd_funcionarios: maoObra.reduce((s, l) => s + (Number(l.quantidade) || 0), 0),
        equipamentos_lista: equipamentos.length ? equipamentos : null,
        mao_de_obra: maoObra.length ? maoObra : null,
        atividades_realizadas: form.atividades_realizadas,
        ocorrencias: form.ocorrencias,
        observacoes_fiscal: form.observacoes_fiscal || null,
      };
      await api.post(`/empresa/objetos/${objetoId}/diario`, payload);
      onSuccess();
    } catch {
      /* TODO: error handling */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
      <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
        <Plus className="h-4 w-4 text-brand-500" />
        Novo Registro (RDO) — {new Date().toLocaleDateString("pt-BR")}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Data</label>
            <input type="date" value={form.data_registro} onChange={update("data_registro")} required className={INPUT_CLS} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Tempo (manhã)</label>
            <select value={form.tempo_manha} onChange={update("tempo_manha")} className={INPUT_CLS}>
              <option value="">Selecione</option>
              {TEMPO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Tempo (tarde)</label>
            <select value={form.tempo_tarde} onChange={update("tempo_tarde")} className={INPUT_CLS}>
              <option value="">Selecione</option>
              {TEMPO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Pluviometria (mm)</label>
            <input type="number" min="0" step="0.1" value={form.pluviometria_mm} onChange={update("pluviometria_mm")}
              placeholder="0" className={INPUT_CLS} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ListaQuantidade<EquipLinha>
            titulo="Equipamentos" icon={<Wrench className="h-4 w-4 text-slate-400" />}
            linhas={form.equipamentos_lista} campoNome="nome" placeholder="Ex: Betoneira"
            onChange={(linhas) => setForm({ ...form, equipamentos_lista: linhas })}
          />
          <ListaQuantidade<MaoObraLinha>
            titulo="Mão de objeto" icon={<HardHat className="h-4 w-4 text-slate-400" />}
            linhas={form.mao_de_obra} campoNome="funcao" placeholder="Ex: Pedreiro"
            onChange={(linhas) => setForm({ ...form, mao_de_obra: linhas })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Atividades Realizadas <span className="text-rose-500">*</span></label>
          <textarea rows={3} required value={form.atividades_realizadas} onChange={update("atividades_realizadas")}
            placeholder="Descreva as atividades executadas hoje..."
            className={INPUT_CLS + " resize-none"}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Ocorrências</label>
            <textarea rows={2} value={form.ocorrencias} onChange={update("ocorrencias")} placeholder="Ocorrências, paralisações, acidentes..."
              className={INPUT_CLS + " resize-none"}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Observações da Fiscalização</label>
            <textarea rows={2} value={form.observacoes_fiscal} onChange={update("observacoes_fiscal")} placeholder="Preenchimento do fiscal..."
              className={INPUT_CLS + " resize-none"}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-700/20 transition-all disabled:opacity-70">
            {loading ? "Salvando..." : "Salvar Registro"}
          </button>
        </div>
      </form>
    </div>
  );
};

export const DiarioContent = ({ objetoId }: { objetoId: string }) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: registros = [], isLoading, isError } = useQuery<RegistroDiario[]>({
    queryKey: ["diario", objetoId],
    queryFn: async () => {
      const { data } = await api.get(`/empresa/objetos/${objetoId}/diario`);
      return data;
    },
    enabled: !!objetoId,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{registros.length} registros</span>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-brand-700/20 hover:bg-brand-500 transition-all">
            <Plus className="h-3.5 w-3.5" />
            Novo Registro
          </button>
        )}
      </div>

      {showForm && (
        <DiarioForm
          objetoId={objetoId}
          onSuccess={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ["diario", objetoId] }); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-8 w-8 text-rose-300 mb-2" />
          <p className="text-sm text-slate-500">Erro ao carregar registros</p>
        </div>
      ) : registros.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-8 w-8 text-slate-200 mb-2" />
          <p className="text-sm text-slate-500">Nenhum registro no diário</p>
        </div>
      ) : (
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200" />
        <div className="space-y-6">
          {registros.map((r) => (
            <div key={r.id} className="relative flex gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white border-2 border-brand-200 shadow-sm z-10">
                <BookOpen className="h-5 w-5 text-brand-500" />
              </div>
              <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-bold text-slate-900">
                    {r.data_registro ? fmtDate(r.data_registro + "T12:00:00", new Date(r.data_registro + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })) : "—"}
                  </span>
                  {(r.tempo_manha || r.tempo_tarde) ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                      <CloudSun className="h-3.5 w-3.5" /> Manhã: {TEMPO_LABEL[r.tempo_manha || ""] || "—"} · Tarde: {TEMPO_LABEL[r.tempo_tarde || ""] || "—"}
                    </span>
                  ) : r.clima ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                      <CloudSun className="h-3.5 w-3.5" /> {r.clima}
                    </span>
                  ) : null}
                  {r.pluviometria_mm != null && Number(r.pluviometria_mm) > 0 && (
                    <span className="flex items-center gap-1 text-xs font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                      <CloudRain className="h-3.5 w-3.5" /> {Number(r.pluviometria_mm)} mm
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                    <Users className="h-3.5 w-3.5" /> {r.qtd_funcionarios} funcionários
                  </span>
                </div>
                {r.atividades_realizadas && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Atividades</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{r.atividades_realizadas}</p>
                  </div>
                )}
                {r.ocorrencias && r.ocorrencias !== "Nenhuma ocorrência registrada." && (
                  <div className="flex gap-2 rounded-xl bg-amber-50 border border-amber-100 p-3">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">{r.ocorrencias}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(r.equipamentos_lista?.length || r.equipamentos) && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 mb-0.5 uppercase tracking-wide">Equipamentos</p>
                      {r.equipamentos_lista?.length ? (
                        <ul className="text-xs text-slate-500 space-y-0.5">
                          {r.equipamentos_lista.map((e, i) => <li key={i}>{e.nome} — {e.quantidade}</li>)}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-500">{r.equipamentos}</p>
                      )}
                    </div>
                  )}
                  {r.mao_de_obra?.length ? (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 mb-0.5 uppercase tracking-wide">Mão de objeto</p>
                      <ul className="text-xs text-slate-500 space-y-0.5">
                        {r.mao_de_obra.map((m, i) => <li key={i}>{m.funcao} — {m.quantidade}</li>)}
                      </ul>
                    </div>
                  ) : null}
                </div>
                {r.observacoes_fiscal && (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <p className="text-xs font-semibold text-slate-400 mb-0.5 uppercase tracking-wide">Fiscalização</p>
                    <p className="text-sm text-slate-600">{r.observacoes_fiscal}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
};

const DiarioObras = () => {
  const { objetoId } = useParams<{ objetoId: string }>();
  const id = objetoId || "1";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Diário de Obras</h2>
        <p className="text-sm text-slate-500 mt-0.5">Objeto: CRAS Cidade Nova</p>
      </div>
      <DiarioContent objetoId={id} />
    </div>
  );
};

export default DiarioObras;
