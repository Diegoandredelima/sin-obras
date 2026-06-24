import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Save, X } from "lucide-react";
import api from "@/services/api";
import type { CatalogoClasse, CatalogoItem } from "@/types";

interface CatalogoItensManagerProps {
  objetoId: string;
}

const CatalogoItensManager = ({ objetoId }: CatalogoItensManagerProps) => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedClasse, setSelectedClasse] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [descricao, setDescricao] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState("");
  const [valorUnitario, setValorUnitario] = useState("");

  const { data: metas = [], isLoading: isLoadingMetas } = useQuery({
    queryKey: ["metas", objetoId],
    queryFn: async () => {
      const { data } = await api.get(`/cronograma/objetos/${objetoId}/metas`);
      return data;
    },
    enabled: !!objetoId,
  });

  const { data: classes = [] } = useQuery<CatalogoClasse[]>({
    queryKey: ["catalogo_classes"],
    queryFn: async () => {
      const { data } = await api.get("/catalogo/classes");
      return data;
    },
  });

  const { data: itensResponse } = useQuery({
    queryKey: ["catalogo_itens", selectedClasse],
    queryFn: async () => {
      const { data } = await api.get(`/catalogo/itens?classe_id=${selectedClasse}&limit=200`);
      return data;
    },
    enabled: !!selectedClasse,
  });
  const itens: CatalogoItem[] = itensResponse?.itens || [];

  const handleItemSelect = (itemId: string) => {
    setSelectedItem(itemId);
    const item = itens.find(i => i.id === itemId);
    if (item) {
      setDescricao(item.descricao || item.item);
      setUnidade(item.unidade || "UN");
    }
  };

  const getOrCreateSubmeta = async () => {
    let meta = metas[0];
    if (!meta) {
      const { data: novaMeta } = await api.post(`/cronograma/objetos/${objetoId}/metas`, {
        descricao: "Meta Única",
        ordem: 1,
        valor: 0
      });
      meta = novaMeta;
    }
    let submeta = meta.submetas?.[0];
    if (!submeta) {
      const { data: novaSubmeta } = await api.post(`/cronograma/metas/${meta.id}/submetas`, {
        descricao: "Submeta Única",
        valor: 0,
        percentual_previsto: 100
      });
      submeta = novaSubmeta;
    }
    return submeta.id;
  };

  const createEventoMutation = useMutation({
    mutationFn: async () => {
      const submetaId = await getOrCreateSubmeta();
      const payload = {
        catalogo_item_id: selectedItem,
        descricao,
        quantidade: Number(quantidade),
        unidade,
        valor_unitario: Number(valorUnitario)
      };
      await api.post(`/cronograma/submetas/${submetaId}/eventos`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas", objetoId] });
      setIsAdding(false);
      resetForm();
    }
  });

  const deleteEventoMutation = useMutation({
    mutationFn: async (eventoId: string) => {
      // Assuming a DELETE endpoint exists for Eventos, otherwise we will need to implement it
      await api.delete(`/cronograma/eventos/${eventoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas", objetoId] });
    }
  });

  const resetForm = () => {
    setSelectedClasse("");
    setSelectedItem("");
    setDescricao("");
    setQuantidade("");
    setUnidade("");
    setValorUnitario("");
  };

  if (isLoadingMetas) return <div className="p-4 text-center text-slate-500">Carregando itens...</div>;

  // Extrair todos os eventos das metas/submetas
  const todosEventos = metas.flatMap((m: any) => 
    (m.submetas || []).flatMap((sm: any) => sm.eventos || [])
  );

  return (
    <div className="space-y-4">
      {todosEventos.length > 0 ? (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Item do Catálogo</th>
                <th className="px-4 py-3 font-semibold">Qtd</th>
                <th className="px-4 py-3 font-semibold">Valor Unit.</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {todosEventos.map((ev: any) => (
                <tr key={ev.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{ev.descricao}</p>
                    {ev.catalogo_item && (
                      <p className="text-xs text-slate-500 mt-0.5">{ev.catalogo_item.codigo_sistema}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">{ev.quantidade} {ev.unidade}</td>
                  <td className="px-4 py-3">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(ev.valor_unitario)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(ev.valor_total || (ev.quantidade * ev.valor_unitario))}
                  </td>
                  <td className="px-4 py-3 text-right">
                     <button
                        onClick={() => {
                          if (confirm("Tem certeza que deseja remover este item?")) {
                            deleteEventoMutation.mutate(ev.id);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remover item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Nenhum item cadastrado no projeto.</p>
      )}

      {isAdding ? (
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-brand-800">Novo Item do Projeto</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-brand-700">Classe (Catálogo)</label>
              <select 
                value={selectedClasse} 
                onChange={e => { setSelectedClasse(e.target.value); setSelectedItem(""); }}
                className="w-full rounded-lg border border-brand-200 bg-white py-2 px-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Selecione uma classe...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-brand-700">Item do Catálogo</label>
              <select 
                value={selectedItem} 
                onChange={e => handleItemSelect(e.target.value)}
                disabled={!selectedClasse}
                className="w-full rounded-lg border border-brand-200 bg-white py-2 px-3 text-sm disabled:opacity-50 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Selecione um item...</option>
                {itens.map(i => <option key={i.id} value={i.id}>{i.codigo_sistema} - {i.item}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-brand-700">Descrição (Editável)</label>
            <textarea 
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-brand-200 bg-white py-2 px-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-brand-700">Quantidade</label>
              <input type="number" step="0.01" value={quantidade} onChange={e => setQuantidade(e.target.value)} className="w-full rounded-lg border border-brand-200 bg-white py-2 px-3 text-sm focus:border-brand-500" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-brand-700">Unidade</label>
              <input type="text" value={unidade} onChange={e => setUnidade(e.target.value)} className="w-full rounded-lg border border-brand-200 bg-white py-2 px-3 text-sm focus:border-brand-500" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-brand-700">Valor Unitário (R$)</label>
              <input type="number" step="0.01" value={valorUnitario} onChange={e => setValorUnitario(e.target.value)} className="w-full rounded-lg border border-brand-200 bg-white py-2 px-3 text-sm focus:border-brand-500" />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => { setIsAdding(false); resetForm(); }}
              className="px-4 py-2 text-sm font-medium text-brand-600 bg-white border border-brand-200 hover:bg-brand-50 rounded-lg"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={() => createEventoMutation.mutate()}
              disabled={createEventoMutation.isPending || !selectedItem || !quantidade || !valorUnitario}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50"
            >
              {createEventoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Item
            </button>
          </div>
        </div>
      ) : (
        <button 
          type="button" 
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-xl border-dashed transition-colors"
        >
          <Plus className="h-4 w-4" />
          Adicionar item do catálogo
        </button>
      )}
    </div>
  );
};

export default CatalogoItensManager;
