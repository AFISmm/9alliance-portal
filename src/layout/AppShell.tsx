import { Outlet }                  from 'react-router-dom';
import { Sidebar }                  from './Sidebar';
import { TopBar }                   from './TopBar';
import { CompanyFooter }            from '../components/CompanyFooter';
import Chatbot                      from '../components/Chatbot';
import { NotificationPanel }        from '../components/NotificationPanel';
import { useLayout }                from '../context/LayoutContext';

export function AppShell() {
  const { sidebarCollapsed, setSidebarCollapsed, isMobile } = useLayout();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', position: 'relative' }}>

      {/* Mobile overlay backdrop for sidebar */}
      {isMobile && !sidebarCollapsed && (
        <div
          onClick={() => setSidebarCollapsed(true)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 40 }}
        />
      )}

      {/* Sidebar wrapper */}
      <div style={isMobile ? {
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 240, zIndex: 50,
        transform: sidebarCollapsed ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 0.25s ease',
      } : {
        width: sidebarCollapsed ? 0 : 240,
        flexShrink: 0, overflow: 'hidden',
        transition: 'width 0.25s ease',
      }}>
        <Sidebar />
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <TopBar />
        <main style={{
          flex: 1, overflow: 'auto',
          padding: isMobile ? '14px 16px' : '24px 32px',
        }}>
          <Outlet />
        </main>
        <CompanyFooter />
      </div>

      <Chatbot />

      {/* Notification panel — always rendered, slides in/out */}
      <NotificationPanel />
    </div>
  );
}
