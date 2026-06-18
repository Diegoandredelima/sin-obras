/**
 * App.jsx — Configuração de Roteamento da Aplicação
 *
 * Define TODAS as rotas da aplicação usando React Router v7.
 * A estrutura é dividida em:
 *
 *   - Rotas públicas: acessíveis sem autenticação (ex: /login)
 *   - Rotas protegidas: envoltas pelo <Layout>, que verifica se o usuário
 *     está autenticado. Se não estiver, redireciona para /login.
 *
 * O Layout funciona como um "ProtectedRoute" implícito: ele lê o store
 * Zustand e decide se renderiza o <Outlet> (conteúdo da rota) ou redireciona.
 *
 * Para adicionar uma nova página protegida:
 *   1. Crie o componente em src/pages/
 *   2. Importe aqui
 *   3. Adicione um <Route> dentro do bloco de rotas protegidas
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Obras from './pages/Obras';
import NovaObra from './pages/NovaObra';
import Contratos from './pages/Contratos';
import Quadro from './pages/Quadro';
import DiarioObras from './pages/DiarioObras';
import Medicoes from './pages/Medicoes';
import DetalheObra from './pages/DetalheObra';
import DetalheContrato from './pages/DetalheContrato';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ---------------------------------------------------------------- */}
        {/* Rotas PÚBLICAS — sem autenticação                               */}
        {/* ---------------------------------------------------------------- */}
        <Route path="/login" element={<Login />} />

        {/* ---------------------------------------------------------------- */}
        {/* Rotas PROTEGIDAS — dentro do Layout (verifica auth no Zustand)  */}
        {/* O Layout renderiza Sidebar + Header + <Outlet> para o conteúdo  */}
        {/* ---------------------------------------------------------------- */}
        <Route element={<Layout />}>
          {/* Redireciona / para /dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Painel principal com KPIs e resumo de obras */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Listagem de todas as obras cadastradas */}
          <Route path="/obras" element={<Obras />} />

          {/* Detalhe de uma obra específica */}
          <Route path="/obras/:id" element={<DetalheObra />} />

          {/* Formulário multi-step para cadastrar nova obra */}
          <Route path="/obras/nova" element={<NovaObra />} />

          {/* Lista e busca de contratos */}
          <Route path="/contratos" element={<Contratos />} />

          {/* Detalhe de um contrato específico */}
          <Route path="/contratos/:id" element={<DetalheContrato />} />

          {/* Quadro Kanban de tarefas (A Fazer / Em Andamento / Concluído) */}
          <Route path="/quadro" element={<Quadro />} />

          {/* Portal da Empresa — Diário de Obras (por obraId) */}
          <Route path="/empresa/obras/:obraId/diario" element={<DiarioObras />} />

          {/* Portal da Empresa — Medições e assinatura digital (por obraId) */}
          <Route path="/empresa/obras/:obraId/medicoes" element={<Medicoes />} />
        </Route>

        {/* ---------------------------------------------------------------- */}
        {/* Fallback — qualquer rota não mapeada cai aqui                   */}
        {/* ---------------------------------------------------------------- */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
