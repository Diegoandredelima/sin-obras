import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText, Plus, CheckCircle2, Clock, XCircle,
  AlertCircle, ChevronRight, Shield, Lock, Loader2,
  type LucideIcon,
} from "lucide-react";
import api from "@/services/api";
import { fmtDate } from "@/utils/format";

type MedicaoStatus = "RASCUNHO" | "ASSINADA" | "EM_FISCALIZACAO" | "APROVADA" | "REPROVADA";

interface Medicao {
  id: string;
  numero_medicao: number;
  status: MedicaoStatus;
  criado_em: string;
  hash_assinatura: string | null;
  assinada_em?: string;
}

const STATUS_CONFIG: Record<MedicaoStatus, { label: string; cls: string; icon: LucideIcon }> = {
  RASCUNHO: { label: "Rascunho", cls: "bg-slate-100 text-slate-600", icon: Clock },
  ASSINADA: { label: "Aguardando Fiscalização", cls: "bg-sky-100 text-sky-700", icon: Shield },
  EM_FISCALIZACAO: { label: "Em Fiscalização", cls: "bg-amber-100 text-amber-700", icon: AlertCircle },
  APROVADA: { label: "Aprovada", cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  REPROVADA: { label: "Reprovada", cls: "bg-rose-100 text-rose-700", icon: XCircle },
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
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100">
          <Shield className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Assinar Medição #{medicao.numero_medicao}</h3>
          <p className="text-sm text-slate-500">Esta ação é irreversível</p>
        </div>
      </div>
      <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800 space-y-1">
        <p className="font-semibold flex items-center gap-1.5"><Lock className="h-4 w-4" /> Verificações automáticas:</p>
        <ul className="list-disc list-inside space-y-0.5 pl-1">
          <li>ART/RRT ativa e vinculada à obra</li>
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
          className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Assinando...</> : <><Shield className="h-4 w-4" /> Assinar e Enviar</>}
        </button>
      </div>
    </div>
  </div>
);

export const MedicoesContent = ({ obraId }: { obraId: string }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [assinarModal, setAssinarModal] = useState<Medicao | null>(null);
  const [assinarLoading, setAssinarLoading] = useState(false);

  const { data: medicoes = [], isLoading, isError } = useQuery<Medicao[]>({
    queryKey: ["medicoes", obraId],
    queryFn: async () => {
      const { data } = await api.get(`/empresa/obras/${obraId}/medicoes`);
      return data;
    },
    enabled: !!obraId,
  });

  const handleAssinar = async () => {
    if (!assinarModal) return;
    setAssinarLoading(true);
    try {
      await api.post(`/empresa/medicoes/${assinarModal.id}/assinar`, { confirmado: true });
      queryClient.invalidateQueries({ queryKey: ["medicoes", obraId] });
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
        <button onClick={() => navigate("/empresa/medicoes/nova")}
          className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-200 hover:bg-emerald-500 transition-all">
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
                  <p className="text-sm font-bold text-slate-900">Medição #{m.numero_medicao}</p>
                  <p className="text-xs text-slate-400">
                    Criada em {fmtDate(m.criado_em)}
                    {m.assinada_em && ` • Assinada em ${fmtDate(m.assinada_em)}`}
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
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all">
                    <Shield className="h-3.5 w-3.5" /> Assinar
                  </button>
                )}
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
    </div>
  );
};

const Medicoes = () => {
  const { obraId } = useParams<{ obraId: string }>();
  const id = obraId || "1";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Medições</h2>
        <p className="text-sm text-slate-500 mt-0.5">Obra: CRAS Cidade Nova</p>
      </div>
      <MedicoesContent obraId={id} />
    </div>
  );
};

export default Medicoes;
