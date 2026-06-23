import { useNavigate } from 'react-router-dom';
import { realClients } from '../data/clients';

export default function ClientesExternos() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-cream-100">Empresas</h1>
        <p className="text-cream-200/40 text-sm mt-1">{realClients.length} empresas activas</p>
      </div>

      <div className="grid gap-4">
        {realClients.map(c => (
          <button
            key={c.id}
            onClick={() => navigate(`/empresa/${c.id}`)}
            className="text-left w-full bg-navy-800/50 hover:bg-navy-800 border border-white/10 hover:border-gold-500/30 rounded-xl p-5 transition group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 min-w-0">
                <h2 className="text-cream-100 font-semibold group-hover:text-gold-300 transition truncate">
                  {c.nombre}
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {c.obligaciones.slice(0, 4).map(ob => (
                    <span key={ob} className="text-xs bg-gold-500/8 text-gold-400/70 border border-gold-500/15 px-2 py-0.5 rounded-full">
                      {ob.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {c.obligaciones.length > 4 && (
                    <span className="text-xs text-cream-200/30">+{c.obligaciones.length - 4} más</span>
                  )}
                </div>
              </div>
              <span className="text-gold-400/40 group-hover:text-gold-400 text-lg shrink-0 transition">→</span>
            </div>

            {c.sector && (
              <p className="text-cream-200/35 text-xs mt-3">{c.sector}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
