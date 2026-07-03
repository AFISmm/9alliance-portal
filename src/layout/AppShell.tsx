import { Outlet }        from 'react-router-dom';
import { Sidebar }        from './Sidebar';
import { TopBar }         from './TopBar';
import { CompanyFooter }  from '../components/CompanyFooter';
import Chatbot            from '../components/Chatbot';
import { useLayout }      from '../context/LayoutContext';

export function AppShell() {
  const { sidebarCollapsed } = useLayout();

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar wrapper — animates width to hide/show */}
      <div
        style={{
          width: sidebarCollapsed ? 0 : 240,
          overflow: 'hidden',
          transition: 'width 0.25s ease',
          flexShrink: 0,
        }}
      >
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto py-6 px-8">
          <Outlet />
        </main>
        <CompanyFooter />
      </div>

      {/* Chatbot fuera del flujo principal para evitar problemas de stacking */}
      <Chatbot />
    </div>
  );
}
