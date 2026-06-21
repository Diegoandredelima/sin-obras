import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import PrintLayout from "@/components/print/PrintLayout";
import ObraReportBody, { type ObraDetalhe } from "@/components/print/ObraReportBody";

const ObraImpressao = () => {
  const { id } = useParams<{ id: string }>();
  const { data: o, isLoading } = useQuery<ObraDetalhe>({
    queryKey: ["obra-impressao", id],
    queryFn: async () => {
      const { data } = await api.get(`/obras/${id}`);
      return data;
    },
    enabled: !!id,
  });

  return (
    <PrintLayout title="Relatório da Obra" subtitle={o?.titulo} ready={!isLoading && !!o}>
      {!o ? (
        <p className="text-sm text-slate-400">Carregando dados da obra...</p>
      ) : (
        <ObraReportBody o={o} />
      )}
    </PrintLayout>
  );
};

export default ObraImpressao;
