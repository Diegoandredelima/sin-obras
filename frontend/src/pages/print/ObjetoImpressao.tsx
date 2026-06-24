import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import PrintLayout from "@/components/print/PrintLayout";
import ObjetoReportBody, { type ObjetoDetalhe } from "@/components/print/ObjetoReportBody";

const ObjetoImpressao = () => {
  const { id } = useParams<{ id: string }>();
  const { data: o, isLoading } = useQuery<ObjetoDetalhe>({
    queryKey: ["objeto-impressao", id],
    queryFn: async () => {
      const { data } = await api.get(`/objetos/${id}`);
      return data;
    },
    enabled: !!id,
  });

  return (
    <PrintLayout title="Relatório do Objeto" subtitle={o?.titulo} ready={!isLoading && !!o}>
      {!o ? (
        <p className="text-sm text-slate-400">Carregando dados do objeto...</p>
      ) : (
        <ObjetoReportBody o={o} />
      )}
    </PrintLayout>
  );
};

export default ObjetoImpressao;
