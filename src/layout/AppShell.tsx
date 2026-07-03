import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { CompanyFooter } from '../components/CompanyFooter';

export function AppShell() {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
        <CompanyFooter />
      </div>
    </div>
  );
}
