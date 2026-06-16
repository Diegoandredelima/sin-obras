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
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected — all under Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/obras" element={<Obras />} />
          <Route path="/obras/nova" element={<NovaObra />} />
          <Route path="/contratos" element={<Contratos />} />
          <Route path="/quadro" element={<Quadro />} />
          <Route path="/empresa/obras/:obraId/diario" element={<DiarioObras />} />
          <Route path="/empresa/obras/:obraId/medicoes" element={<Medicoes />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
