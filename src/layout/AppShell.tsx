import { Outlet }        from 'react-router-dom';
import { Sidebar }        from './Sidebar';
import { TopBar }         from './TopBar';
import { CompanyFooter }  from '../components/CompanyFooter';
import Chatbot            from '../components/Chatbot';

export function AppShell() {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
        <CompanyFooter />
      </div>
      {/* Chatbot fuera del flujo principal para evitar problemas de stacking */}
      <Chatbot />
    </div>
  );
}
