import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText, Plus, CheckCircle2, Clock, XCircle,
  AlertCircle, ChevronRight, Shield, Lock, Loader2, Eye, Table2,
  type LucideIcon,
} from "lucide-react";
import api from "@/services/api";
import { fmtCurrency, fmtDate } from "@/utils/format";

type MedicaoStatus = "RASCUNHO" | "ASSINADA" | "EM_FISCALIZACAO" | "AGUARDANDO_CHEFE" | "APROVADA" | "REPROVADA";

interface Medicao {
  id: string;
  numero_medicao: number;
  status: MedicaoStatus;
  origem?: "EMPRESA" | "FISCAL";
  valor_medido?: string;
  criado_em: string;
  hash_assinatura: string | null;
  assinada_em?: string;
}

interface BoletimItem {
  id: string;
  descricao: string | null;
  unidade: string | null;
  quantidade_periodo: string;
  valor_unitario: string;
  valor_bruto: string;
  acumulado_anterior: string;
  acumulado_atual: string;
  saldo: string;
}

interface Boletim {
  numero_medicao: number;
  itens: BoletimItem[];
  valor_bruto_total: string;
  valor_faturamento_direto: string;
  retencao: string;
  valor_liquido: string;
}

const BoletimModal = ({ medicaoId, numero, onClose }: { medicaoId: string; numero: number; onClose: () => void }) => {
  const { data: boletim, isLoading } = useQuery<Boletim>({
    queryKey: ["boletim", medicaoId],
    queryFn: async () => {
      const { data } = await api.get(`/empresa/medicoes/${medicaoId}/boletim`);
      return data;
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Boletim da Medição #{numero}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XCircle className="h-5 w-5" /></button>
        </div>
        {isLoading || !boletim ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 text-slate-300 animate-spin" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase text-slate-400">
                  <tr>
                    <th className="text-left p-3">Item</th>
                    <th className="text-right p-3">Qtd</th>
                    <th className="text-right p-3">Vlr unit.</th>
                    <th className="text-right p-3">Bruto</th>
                    <th className="text-right p-3">Acum. ant.</th>
                    <th className="text-right p-3">Acum. atual</th>
                    <th className="text-right p-3">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {boletim.itens.map((it) => (
                    <tr key={it.id} className="border-t border-slate-50">
                      <td className="p-3 text-slate-700">{it.descricao} <span className="text-slate-400">({it.unidade})</span></td>
                      <td className="p-3 text-right">{Number(it.quantidade_periodo)}</td>
                      <td className="p-3 text-right">{fmtCurrency(it.valor_unitario)}</td>
                      <td className="p-3 text-right font-semibold">{fmtCurrency(it.valor_bruto)}</td>
                      <td className="p-3 text-right text-slate-500">{fmtCurrency(it.acumulado_anterior)}</td>
                      <td className="p-3 text-right text-slate-500">{fmtCurrency(it.acumulado_atual)}</td>
                      <td className="p-3 text-right text-slate-500">{fmtCurrency(it.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap justify-end gap-x-6 gap-y-1 text-sm">
              <span className="text-slate-500">Bruto: <b className="text-slate-700">{fmtCurrency(boletim.valor_bruto_total)}</b></span>
              <span className="text-slate-500">Faturamento direto: <b className="text-slate-700">- {fmtCurrency(boletim.valor_faturamento_direto)}</b></span>
              <span className="text-slate-500">Retenção: <b className="text-slate-700">- {fmtCurrency(boletim.retencao)}</b></span>
              <span className="text-base text-slate-700">Líquido: <b className="text-emerald-600">{fmtCurrency(boletim.valor_liquido)}</b></span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const STATUS_CONFIG: Record<MedicaoStatus, { label: string; cls: string; icon: LucideIcon }> = {
  RASCUNHO: { label: "Rascunho", cls: "bg-slate-100 text-slate-600", icon: Clock },
  ASSINADA: { label: "Aguardando Fiscalização", cls: "bg-sky-100 text-sky-700", icon: Shield },
  EM_FISCALIZACAO: { label: "Em Fiscalização", cls: "bg-amber-100 text-amber-700", icon: AlertCircle },
  AGUARDANDO_CHEFE: { label: "Aguardando Chefe", cls: "bg-purple-100 text-purple-700", icon: Shield },
  APROVADA: { label: "Aprovada", cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  REPROVADA: { label: "Reprovada", cls: "bg-rose-100 text-rose-700", icon: XCircle },
};

interface VistoriaResumo {
  id: string;
  fiscal_id: string;
  resultado: string;
  checkin_em: string | null;
  dentro_raio: boolean;
  observacoes: string | null;
  finalizada_em: string | null;
}

interface AvaliarModalProps {
  medicao: Medicao;
  objetoId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AvaliarModal = ({ medicao, objetoId, onClose, onSuccess }: AvaliarModalProps) => {
  const queryClient = useQueryClient();
  const [aprovada, setAprovada] = useState<boolean>(true);
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Quantidade aprovada por item (RF23). Default = declarada; editável.
  const [aprovados, setAprovados] = useState<Record<string, string>>({});

  const { data: vistoria, isLoading: vistoriaLoading } = useQuery<VistoriaResumo | null>({
    queryKey: ["vistoria-medicao", medicao.id],
    queryFn: async () => {
      const { data } = await api.get(`/vistorias`, { params: { medicao_id: medicao.id, limit: 1 } });
      return Array.isArray(data) ? data[0] || null : null;
    },
    enabled: !!medicao.id,
  });

  const { data: boletim } = useQuery<Boletim>({
    queryKey: ["boletim", medicao.id],
    queryFn: async () => {
      const { data } = await api.get(`/empresa/medicoes/${medicao.id}/boletim`);
      return data;
    },
    enabled: !!medicao.id,
  });

  const itens = boletim?.itens ?? [];
  const aprovadoDe = (it: BoletimItem) =>
    aprovados[it.id] ?? String(Number(it.quantidade_periodo));
  const houvePartial = itens.some(
    (it) => Number(aprovadoDe(it)) !== Number(it.quantidade_periodo),
  );

  const handleSubmit = async () => {
    if (!observacao.trim()) {
      setError("A justificativa é obrigatória.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload: {
        aprovada: boolean;
        observacao_fiscal: string;
        itens?: { item_id: string; quantidade_aprovada: number }[];
      } = { aprovada, observacao_fiscal: observacao };
      if (aprovada && houvePartial) {
        payload.itens = itens.map((it) => ({
          item_id: it.id,
          quantidade_aprovada: Number(aprovadoDe(it)),
        }));
      }
      await api.post(`/empresa/medicoes/${medicao.id}/avaliar`, payload);
      queryClient.invalidateQueries({ queryKey: ["medicoes", objetoId] });
      onSuccess();
    } catch {
      setError("Erro ao avaliar medição. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Avaliar Medição #{medicao.numero_medicao}</h3>
              <p className="text-sm text-slate-500">Confronte o declarado pela empresa com a vistoria do fiscal</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-sky-100 flex items-center justify-center">
                <FileText className="h-4 w-4 text-sky-600" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">Declarado pela Empresa</h4>
            </div>
            <div className="bg-sky-50/50 rounded-xl border border-sky-100 p-4">
              <p className="text-xs text-slate-500 mb-2">Medição submetida com os seguintes eventos declarados:</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Status atual</span>
                  <span className="font-semibold text-sky-700">{STATUS_CONFIG[medicao.status]?.label || medicao.status}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Criada em</span>
                  <span className="text-slate-800">{fmtDate(medicao.criado_em)}</span>
                </div>
                {medicao.assinada_em && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Assinada em</span>
                    <span className="text-slate-800">{fmtDate(medicao.assinada_em)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Eye className="h-4 w-4 text-amber-600" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">Vistoria do Fiscal</h4>
            </div>
            {vistoriaLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
              </div>
            ) : vistoria ? (
              <div className="bg-amber-50/50 rounded-xl border border-amber-100 p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Check-in</span>
                    <span className="text-slate-800">{vistoria.checkin_em ? fmtDate(vistoria.checkin_em) : "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Dentro do raio</span>
                    <span className={`font-semibold ${vistoria.dentro_raio ? "text-emerald-600" : "text-rose-600"}`}>
                      {vistoria.dentro_raio ? "Sim" : "Não"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Resultado</span>
                    <span className="font-semibold text-slate-800">{vistoria.resultado}</span>
                  </div>
                  {vistoria.observacoes && (
                    <div className="pt-2 border-t border-amber-200">
                      <p className="text-xs text-slate-500 mb-1">Observações do fiscal:</p>
                      <p className="text-xs text-slate-700">{vistoria.observacoes}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 text-center">
                <p className="text-xs text-slate-400">Nenhuma vistoria vinculada a esta medição.</p>
              </div>
            )}
          </div>
        </div>

        {aprovada && itens.length > 0 && (
          <div className="px-6 pb-2">
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-2 bg-slate-50 text-[11px] uppercase text-slate-400 font-semibold">
                Aprovação por item (RF23) — ajuste a quantidade aprovada se necessário
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-[11px] uppercase text-slate-400">
                    <tr>
                      <th className="text-left p-2.5">Item</th>
                      <th className="text-right p-2.5">Declarada</th>
                      <th className="text-right p-2.5">Aprovada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((it) => (
                      <tr key={it.id} className="border-t border-slate-50">
                        <td className="p-2.5 text-slate-700">
                          {it.descricao} <span className="text-slate-400">({it.unidade})</span>
                        </td>
                        <td className="p-2.5 text-right text-slate-500">{Number(it.quantidade_periodo)}</td>
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            min={0}
                            max={Number(it.quantidade_periodo)}
                            step="0.0001"
                            value={aprovadoDe(it)}
                            onChange={(e) =>
                              setAprovados((prev) => ({ ...prev, [it.id]: e.target.value }))
                            }
                            className="w-24 text-right rounded-lg border border-slate-200 py-1 px-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/10"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setAprovada(true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                aprovada
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-300"
              }`}
            >
              <CheckCircle2 className="h-4 w-4 inline mr-1.5" />
              Aprovar
            </button>
            <button
              onClick={() => setAprovada(false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                !aprovada
                  ? "bg-rose-600 text-white shadow-md shadow-rose-200"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-rose-300"
              }`}
            >
              <XCircle className="h-4 w-4 inline mr-1.5" />
              Reprovar
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Justificativa <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
              placeholder="Descreva o motivo da aprovação ou reprovação..."
              className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-500">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-700/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar {aprovada ? (houvePartial ? "Aprovação Parcial" : "Aprovação") : "Reprovação"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ChefeModalProps {
  medicao: Medicao;
  objetoId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ChefeModal = ({ medicao, objetoId, onClose, onSuccess }: ChefeModalProps) => {
  const queryClient = useQueryClient();
  const [aprovada, setAprovada] = useState(true);
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!aprovada && !observacao.trim()) {
      setError("A justificativa é obrigatória ao reprovar.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post(`/empresa/medicoes/${medicao.id}/aprovar-chefe`, {
        aprovada,
        observacao_fiscal: observacao || null,
      });
      queryClient.invalidateQueries({ queryKey: ["medicoes", objetoId] });
      onSuccess();
    } catch {
      setError("Erro ao processar a aprovação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 border border-purple-100">
            <Shield className="h-6 w-6 text-purple-700" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Aprovação do Chefe — Medição #{medicao.numero_medicao}</h3>
            <p className="text-sm text-slate-500">Valor acima da alçada (RN08)</p>
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm flex justify-between">
          <span className="text-slate-500">Valor líquido</span>
          <b className="text-slate-800">{fmtCurrency(medicao.valor_medido ?? 0)}</b>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAprovada(true)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${aprovada ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-300"}`}>
            <CheckCircle2 className="h-4 w-4 inline mr-1.5" /> Aprovar
          </button>
          <button onClick={() => setAprovada(false)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${!aprovada ? "bg-rose-600 text-white shadow-md shadow-rose-200" : "bg-white border border-slate-200 text-slate-600 hover:border-rose-300"}`}>
            <XCircle className="h-4 w-4 inline mr-1.5" /> Reprovar
          </button>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">
            Justificativa {!aprovada && <span className="text-rose-500">*</span>}
          </label>
          <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={3}
            placeholder="Parecer do chefe de setor..."
            className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all resize-none" />
        </div>
        {error && <p className="text-xs text-rose-500">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-700/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar {aprovada ? "Aprovação" : "Reprovação"}
          </button>
        </div>
      </div>
    </div>
  );
};

interface AssinaturaModalProps {
  medicao: Medicao;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const AssinaturaModal = ({ medicao, onConfirm, onCancel, loading }: AssinaturaModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 border border-brand-100">
          <Shield className="h-6 w-6 text-brand-700" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Assinar Medição #{medicao.numero_medicao}</h3>
          <p className="text-sm text-slate-500">Esta ação é irreversível</p>
        </div>
      </div>
      <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800 space-y-1">
        <p className="font-semibold flex items-center gap-1.5"><Lock className="h-4 w-4" /> Verificações automáticas:</p>
        <ul className="list-disc list-inside space-y-0.5 pl-1">
          <li>ART/RRT ativa e vinculada ao objeto</li>
          <li>Geração de hash SHA-256 do conteúdo</li>
          <li>Registro de timestamp imutável</li>
        </ul>
      </div>
      <p className="text-sm text-slate-600">Ao assinar, a medição será enviada ao fiscal responsável para validação. Confirma a assinatura?</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
          Cancelar
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-700/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Assinando...</> : <><Shield className="h-4 w-4" /> Assinar e Enviar</>}
        </button>
      </div>
    </div>
  </div>
);

export const MedicoesContent = ({ objetoId }: { objetoId: string }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [assinarModal, setAssinarModal] = useState<Medicao | null>(null);
  const [avaliarModal, setAvaliarModal] = useState<Medicao | null>(null);
  const [chefeModal, setChefeModal] = useState<Medicao | null>(null);
  const [boletimModal, setBoletimModal] = useState<Medicao | null>(null);
  const [assinarLoading, setAssinarLoading] = useState(false);

  const { data: medicoes = [], isLoading, isError } = useQuery<Medicao[]>({
    queryKey: ["medicoes", objetoId],
    queryFn: async () => {
      const { data } = await api.get(`/empresa/objetos/${objetoId}/medicoes`);
      return data;
    },
    enabled: !!objetoId,
  });

  const handleAssinar = async () => {
    if (!assinarModal) return;
    setAssinarLoading(true);
    try {
      await api.post(`/empresa/medicoes/${assinarModal.id}/assinar`, { confirmado: true });
      queryClient.invalidateQueries({ queryKey: ["medicoes", objetoId] });
      setAssinarModal(null);
    } catch (e: unknown) {
      const detail =
        e && typeof e === "object" && "response" in e
          ? (e.response as { data?: { detail?: string } })?.data?.detail
          : undefined;
      alert(detail || "Erro ao assinar a medição.");
    } finally {
      setAssinarLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{medicoes.length} medições</span>
        <button onClick={() => navigate(`/empresa/objetos/${objetoId}/medicoes/nova`)}
          className="inline-flex items-center gap-2 px-3 py-2 bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-brand-700/20 hover:bg-brand-500 transition-all">
          <Plus className="h-3.5 w-3.5" />
          Nova Medição
        </button>
      </div>

      <div className="space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
          </div>
        )}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-8 w-8 text-rose-300 mb-2" />
            <p className="text-sm text-slate-500">Erro ao carregar medições</p>
          </div>
        )}
        {!isLoading && !isError && medicoes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-8 w-8 text-slate-200 mb-2" />
            <p className="text-sm text-slate-500">Nenhuma medição registrada</p>
          </div>
        )}
        {!isLoading && !isError && medicoes.map((m) => {
          const cfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.RASCUNHO;
          const StatusIcon = cfg.icon;
          return (
            <div key={m.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                  <FileText className="h-5 w-5 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">
                    Medição #{m.numero_medicao}
                    {m.origem === "FISCAL" && <span className="ml-2 text-[10px] font-semibold uppercase text-amber-600">fiscal</span>}
                  </p>
                  <p className="text-xs text-slate-400">
                    Criada em {fmtDate(m.criado_em)}
                    {m.assinada_em && ` • Assinada em ${fmtDate(m.assinada_em)}`}
                    {m.valor_medido != null && Number(m.valor_medido) > 0 && ` • Líquido ${fmtCurrency(m.valor_medido)}`}
                  </p>
                  {m.hash_assinatura && (
                    <p className="text-xs font-mono text-slate-300 truncate max-w-xs mt-0.5">
                      SHA-256: {m.hash_assinatura}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${cfg.cls}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {cfg.label}
                </span>
                {m.status === "RASCUNHO" && (
                  <button onClick={() => setAssinarModal(m)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-3 py-1.5 rounded-xl transition-all">
                    <Shield className="h-3.5 w-3.5" /> Assinar
                  </button>
                )}
                {(m.status === "ASSINADA" || m.status === "EM_FISCALIZACAO") && (
                  <button onClick={() => setAvaliarModal(m)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition-all">
                    <Eye className="h-3.5 w-3.5" /> Avaliar
                  </button>
                )}
                {m.status === "AGUARDANDO_CHEFE" && (
                  <button onClick={() => setChefeModal(m)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl transition-all">
                    <Shield className="h-3.5 w-3.5" /> Aprovar (Chefe)
                  </button>
                )}
                <button onClick={() => setBoletimModal(m)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-all">
                  <Table2 className="h-3.5 w-3.5" /> Boletim
                </button>
                <button className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {assinarModal && (
        <AssinaturaModal
          medicao={assinarModal}
          onConfirm={handleAssinar}
          onCancel={() => setAssinarModal(null)}
          loading={assinarLoading}
        />
      )}

      {avaliarModal && (
        <AvaliarModal
          medicao={avaliarModal}
          objetoId={objetoId}
          onClose={() => setAvaliarModal(null)}
          onSuccess={() => setAvaliarModal(null)}
        />
      )}

      {chefeModal && (
        <ChefeModal
          medicao={chefeModal}
          objetoId={objetoId}
          onClose={() => setChefeModal(null)}
          onSuccess={() => setChefeModal(null)}
        />
      )}

      {boletimModal && (
        <BoletimModal
          medicaoId={boletimModal.id}
          numero={boletimModal.numero_medicao}
          onClose={() => setBoletimModal(null)}
        />
      )}
    </div>
  );
};

const Medicoes = () => {
  const { objetoId } = useParams<{ objetoId: string }>();
  const id = objetoId || "1";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Medições</h2>
        <p className="text-sm text-slate-500 mt-0.5">Objeto: CRAS Cidade Nova</p>
      </div>
      <MedicoesContent objetoId={id} />
    </div>
  );
};

export default Medicoes;
