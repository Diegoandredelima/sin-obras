import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../store/auth';

const Layout = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-50/50 overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Main Header (Optional) */}
        <header className="h-16 shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center shadow-sm z-10">
          <h1 className="text-xl font-semibold text-slate-800">Painel de Controle</h1>
        </header>
        
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
