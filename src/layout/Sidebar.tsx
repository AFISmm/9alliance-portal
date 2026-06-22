import { CompanyCard } from '../components/CompanyCard';
import { ClientList } from '../components/ClientList';

export function Sidebar() {
  return (
    <aside className="w-64 min-w-[240px] bg-navy-950 border-r border-white/10 flex flex-col overflow-y-auto shrink-0 min-h-screen">
      <CompanyCard />
      <ClientList />
      <div className="flex-1" />
    </aside>
  );
}
