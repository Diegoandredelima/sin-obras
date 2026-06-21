import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Obras from "@/pages/Obras";
import NovaObra from "@/pages/NovaObra";
import Contratos from "@/pages/Contratos";
import Quadro from "@/pages/Quadro";
import DiarioObras from "@/pages/DiarioObras";
import Medicoes from "@/pages/Medicoes";
import RedirectObra from "@/pages/RedirectObra";
import DetalheContrato from "@/pages/DetalheContrato";
import Relatorio from "@/pages/Relatorio";
import DetalheEmpresa from "@/pages/DetalheEmpresa";
import Gestao from "@/pages/Gestao";
import Alertas from "@/pages/Alertas";
import Privacidade from "@/pages/Privacidade";
import NotFound from "@/pages/NotFound";
import CookieBanner from "@/components/CookieBanner";
import RelatorioImpressao from "@/pages/print/RelatorioImpressao";
import ObraImpressao from "@/pages/print/ObraImpressao";
import ObrasLoteImpressao from "@/pages/print/ObrasLoteImpressao";
import ContratoImpressao from "@/pages/print/ContratoImpressao";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/obras" element={<Obras />} />
          <Route path="/obras/:id" element={<RedirectObra />} />
          <Route path="/obras/nova" element={<NovaObra />} />
          <Route path="/contratos" element={<Contratos />} />
          <Route path="/contratos/:id" element={<DetalheContrato />} />
          <Route path="/quadro" element={<Quadro />} />
          <Route path="/empresa/obras/:obraId/diario" element={<DiarioObras />} />
          <Route path="/empresa/obras/:obraId/medicoes" element={<Medicoes />} />
          <Route path="/relatorio" element={<Relatorio />} />
          <Route path="/gestao" element={<Gestao />} />
          <Route path="/alertas" element={<Alertas />} />
          <Route path="/empresas/:id" element={<DetalheEmpresa />} />
        </Route>

        {/* Rotas de impressão — standalone, sem o Layout (sidebar) */}
        <Route path="/relatorio/imprimir" element={<RelatorioImpressao />} />
        <Route path="/relatorio/imprimir-obras" element={<ObrasLoteImpressao />} />
        <Route path="/obras/:id/relatorio" element={<ObraImpressao />} />
        <Route path="/contratos/:id/relatorio" element={<ContratoImpressao />} />

        <Route path="/privacidade" element={<Privacidade />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <CookieBanner />
    </BrowserRouter>
  );
}

export default App;
