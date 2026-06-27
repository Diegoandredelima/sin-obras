import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Executivo from "@/pages/Executivo";
import MapaCalor from "@/pages/MapaCalor";
import Objetos from "@/pages/Objetos";
import CadastrarObjeto from "@/pages/CadastrarObjeto";
import Orcamentos from "@/pages/Orcamentos";
import CadastrarOrcamento from "@/pages/CadastrarOrcamento";
import CadastrarContrato from "@/pages/CadastrarContrato";
import Contratos from "@/pages/Contratos";
import Quadro from "@/pages/Quadro";
import DiarioObras from "@/pages/DiarioObras";
import Medicoes from "@/pages/Medicoes";
import NovaMedicao from "@/pages/NovaMedicao";
import RedirectObjeto from "@/pages/RedirectObjeto";
import DetalheContrato from "@/pages/DetalheContrato";
import EditarContrato from "@/pages/EditarContrato";
import Relatorio from "@/pages/Relatorio";
import CentralDocumentos from "@/pages/CentralDocumentos";
import DetalheEmpresa from "@/pages/DetalheEmpresa";
import Empresas from "@/pages/Empresas";
import EmpresaForm from "@/pages/EmpresaForm";
import Gestao from "@/pages/Gestao";
import Alertas from "@/pages/Alertas";
import Privacidade from "@/pages/Privacidade";
import NotFound from "@/pages/NotFound";
import CronogramaSelector from "@/pages/CronogramaSelector";
import EditarCronograma from "@/pages/EditarCronograma";
import CookieBanner from "@/components/CookieBanner";
import RelatorioImpressao from "@/pages/print/RelatorioImpressao";
import ObjetoImpressao from "@/pages/print/ObjetoImpressao";
import ObjetosLoteImpressao from "@/pages/print/ObjetosLoteImpressao";
import ContratoImpressao from "@/pages/print/ContratoImpressao";
import RdoImpressao from "@/pages/print/RdoImpressao";
import BoletimImpressao from "@/pages/print/BoletimImpressao";
import MemoriaCalculoImpressao from "@/pages/print/MemoriaCalculoImpressao";
import RelatorioFotograficoImpressao from "@/pages/print/RelatorioFotograficoImpressao";
import CronogramaProgressoImpressao from "@/pages/print/CronogramaProgressoImpressao";
import RelatorioFotograficoObjetoImpressao from "@/pages/print/RelatorioFotograficoObjetoImpressao";

/**
 * Redirect de compatibilidade: URLs legadas com "/obras" passam a apontar para
 * "/objetos" (renomeação Obra → Objeto), preservando o restante do caminho e a
 * query string. Cobre tanto "/obras/..." quanto "/empresa/obras/...".
 */
function LegacyObrasRedirect() {
  const loc = useLocation();
  const target = loc.pathname.replace("/obras", "/objetos") + loc.search;
  return <Navigate to={target} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/executivo" element={<Executivo />} />
          <Route path="/mapa" element={<MapaCalor />} />
          <Route path="/objetos" element={<Objetos />} />
          <Route path="/objetos/nova" element={<CadastrarObjeto />} />
          <Route path="/orcamentos" element={<Orcamentos />} />
          <Route path="/orcamentos/novo" element={<CadastrarOrcamento />} />
          <Route path="/objetos/:id" element={<RedirectObjeto />} />
          <Route path="/contratos" element={<Contratos />} />
          <Route path="/contratos/novo" element={<CadastrarContrato />} />
          <Route path="/contratos/:id" element={<DetalheContrato />} />
          <Route path="/contratos/:id/editar" element={<EditarContrato />} />
          <Route path="/quadro" element={<Quadro />} />
          <Route path="/empresa/objetos/:objetoId/diario" element={<DiarioObras />} />
          <Route path="/empresa/objetos/:objetoId/medicoes" element={<Medicoes />} />
          <Route path="/empresa/objetos/:objetoId/medicoes/nova" element={<NovaMedicao />} />
          <Route path="/relatorio" element={<Relatorio />} />
          <Route path="/documentos" element={<CentralDocumentos />} />
          <Route path="/gestao" element={<Gestao />} />
          <Route path="/alertas" element={<Alertas />} />
          <Route path="/empresas" element={<Empresas />} />
          <Route path="/empresas/nova" element={<EmpresaForm />} />
          <Route path="/empresas/:id" element={<DetalheEmpresa />} />
          <Route path="/empresas/:id/editar" element={<EmpresaForm />} />
          <Route path="/cronograma" element={<CronogramaSelector />} />
          <Route path="/cronograma/novo/:objetoId" element={<EditarCronograma />} />
          <Route path="/cronograma/:versaoId/editar" element={<EditarCronograma />} />
        </Route>

        {/* Rotas de impressão — standalone, sem o Layout (sidebar) */}
        <Route path="/relatorio/imprimir" element={<RelatorioImpressao />} />
        <Route path="/relatorio/imprimir-objetos" element={<ObjetosLoteImpressao />} />
        <Route path="/objetos/:id/relatorio" element={<ObjetoImpressao />} />
        <Route path="/contratos/:id/relatorio" element={<ContratoImpressao />} />
        <Route path="/objetos/:objetoId/diario/:diarioId/rdo" element={<RdoImpressao />} />
        <Route path="/objetos/:objetoId/cronograma-progresso" element={<CronogramaProgressoImpressao />} />
        <Route path="/objetos/:objetoId/relatorio-fotografico" element={<RelatorioFotograficoObjetoImpressao />} />
        <Route path="/medicoes/:medicaoId/boletim" element={<BoletimImpressao />} />
        <Route path="/medicoes/:medicaoId/memoria-calculo" element={<MemoriaCalculoImpressao />} />
        <Route path="/medicoes/:medicaoId/relatorio-fotografico" element={<RelatorioFotograficoImpressao />} />

        <Route path="/privacidade" element={<Privacidade />} />

        {/* Compatibilidade: rotas antigas /obras → /objetos */}
        <Route path="/obras/*" element={<LegacyObrasRedirect />} />
        <Route path="/empresa/obras/*" element={<LegacyObrasRedirect />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <CookieBanner />
    </BrowserRouter>
  );
}

export default App;
