import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "@/services/api";

const RedirectObra = () => {
  const { id } = useParams<{ id: string }>();
  const [contratoId, setContratoId] = useState<string | null | undefined>(undefined);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    api.get(`/obras/${id}`)
      .then(({ data }) => setContratoId(data.contrato_id || null))
      .catch(() => setErro(true));
  }, [id]);

  if (erro) return <Navigate to="/contratos" replace />;
  if (contratoId === null) return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <p className="text-lg font-semibold text-slate-700">Obra sem contrato vinculado.</p>
      <a href="/contratos" className="mt-4 text-sm text-brand-700 hover:underline">← Ir para Contratos</a>
    </div>
  );
  if (contratoId) return <Navigate to={`/contratos/${contratoId}`} replace />;

  return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="h-8 w-8 text-slate-300 animate-spin" />
    </div>
  );
};

export default RedirectObra;
