import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ShieldCheck, ShieldOff, Plus, AlertTriangle, Loader2, FileText, Calendar, Hash,
} from "lucide-react";
import api from "@/services/api";
import type { ArtRrt } from "@/types";
import { fmtDate } from "@/utils/format";

const artRrtSchema = z.object({
  numero: z.string().min(1, "Número obrigatório").max(100, "Máximo 100 caracteres"),
  tipo: z.enum(["ART", "RRT"], { message: "Selecione ART ou RRT" }),
  data_emissao: z.string().nullable().optional(),
  data_validade: z.string().nullable().optional(),
});

type ArtRrtFormData = z.infer<typeof artRrtSchema>;

const ArtRrtModal = ({
  open,
  onClose,
  obraId,
}: {
  open: boolean;
  onClose: () => void;
  obraId: string;
}) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ArtRrtFormData>({
    resolver: zodResolver(artRrtSchema),
    defaultValues: { numero: "", tipo: "ART", data_emissao: null, data_validade: null },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ArtRrtFormData) => {
      await api.post("/art-rrt", {
        numero: data.numero,
        tipo: data.tipo,
        obra_id: obraId,
        data_emissao: data.data_emissao || undefined,
        data_validade: data.data_validade || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["art-rrt", obraId] });
      reset();
      onClose();
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <h3 className="text-lg font-bold text-slate-900">Cadastrar ART/RRT</h3>
        <form
          onSubmit={handleSubmit((data) => createMutation.mutate(data))}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Número <span className="text-rose-500">*</span>
            </label>
            <input
              {...register("numero")}
              placeholder="Nº do documento"
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all"
            />
            {errors.numero && (
              <p className="text-xs text-rose-500">{errors.numero.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Tipo <span className="text-rose-500">*</span>
            </label>
            <select
              {...register("tipo")}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all"
            >
              <option value="ART">ART</option>
              <option value="RRT">RRT</option>
            </select>
            {errors.tipo && (
              <p className="text-xs text-rose-500">{errors.tipo.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Data de Emissão</label>
            <input
              type="date"
              {...register("data_emissao")}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Data de Validade</label>
            <input
              type="date"
              {...register("data_validade")}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-brand-700 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-700/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Cadastrar
            </button>
          </div>
          {createMutation.isError && (
            <p className="text-xs text-rose-500 text-center">
              Erro ao cadastrar. Tente novamente.
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

const ArtRrtCard = ({ art, onInativar }: { art: ArtRrt; onInativar: (id: string) => void }) => {
  const hoje = useMemo(() => new Date(new Date().toDateString()), []);
  const isVencida = art.data_validade && new Date(art.data_validade + "T00:00:00") < hoje;
  const isVencendo = art.ativa && art.data_validade && !isVencida && (() => {
    const diff = Math.ceil((new Date(art.data_validade + "T00:00:00").getTime() - hoje.getTime()) / 86400000);
    return diff <= 30;
  })();
  const daysToExpire = art.data_validade
    ? Math.ceil((new Date(art.data_validade + "T00:00:00").getTime() - hoje.getTime()) / 86400000)
    : null;

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {art.tipo === "ART" ? (
            <FileText className="h-4 w-4 text-sky-500" />
          ) : (
            <FileText className="h-4 w-4 text-purple-500" />
          )}
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {art.tipo} Nº {art.numero}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {art.ativa ? (
            isVencida ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full">
                <ShieldOff className="h-2.5 w-2.5" />
                Vencida
              </span>
            ) : isVencendo ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
                <AlertTriangle className="h-2.5 w-2.5" />
                {daysToExpire}d
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full">
                <ShieldCheck className="h-2.5 w-2.5" />
                Ativa
              </span>
            )
          ) : (
            <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">
              Inativa
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {art.data_emissao && (
          <div className="flex items-center gap-1.5 text-slate-500">
            <Calendar className="h-3 w-3 text-slate-400" />
            <span>Emissão: {fmtDate(art.data_emissao)}</span>
          </div>
        )}
        {art.data_validade && (
          <div className={`flex items-center gap-1.5 ${isVencida ? "text-rose-600 font-semibold" : "text-slate-500"}`}>
            <Calendar className="h-3 w-3" />
            <span>Validade: {fmtDate(art.data_validade)}</span>
          </div>
        )}
      </div>

      {art.ativa && (
        <button
          onClick={() => onInativar(art.id)}
          className="text-xs text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
        >
          <ShieldOff className="h-3 w-3" />
          Inativar
        </button>
      )}
    </div>
  );
};

export const ArtRrtContent = ({ obraId }: { obraId: string }) => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: arts = [], isLoading, error } = useQuery<ArtRrt[]>({
    queryKey: ["art-rrt", obraId],
    queryFn: async () => {
      const { data } = await api.get(`/art-rrt/obra/${obraId}`);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!obraId,
  });

  const inativarMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/art-rrt/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["art-rrt", obraId] });
    },
  });

  const hasArtAtiva = arts.some((a) => a.ativa);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">ART / RRT</h2>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-700/20 hover:bg-brand-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          Cadastrar
        </button>
      </div>

      {!hasArtAtiva && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Nenhuma ART/RRT ativa</p>
            <p className="text-xs text-amber-700 mt-0.5">
              O sistema bloqueia a assinatura de medições sem ART ativa vinculada.
            </p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
          <p className="text-sm text-rose-700">Erro ao carregar documentos.</p>
        </div>
      )}

      {!isLoading && !error && arts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-300">
          <Hash className="h-12 w-12 mb-3" />
          <p className="text-sm font-medium">Nenhum documento cadastrado</p>
          <p className="text-xs mt-1">Cadastre uma ART ou RRT para esta obra.</p>
        </div>
      )}

      {!isLoading && !error && arts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {arts.map((art) => (
            <ArtRrtCard
              key={art.id}
              art={art}
              onInativar={(id) => inativarMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      <ArtRrtModal
        open={showModal}
        onClose={() => setShowModal(false)}
        obraId={obraId}
      />
    </div>
  );
};
