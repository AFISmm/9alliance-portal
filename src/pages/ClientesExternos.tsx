import { useNavigate } from 'react-router-dom';
import { realClients } from '../data/clients';
import { Logo9A } from '../components/Logo9A';

export default function ClientesExternos() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-full">

      {/* Watermark */}
      <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center" aria-hidden>
        <Logo9A size={340} className="opacity-[0.035]" />
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-semibold text-cream-100">Empresas</h1>
          <p className="text-cream-200/40 text-sm mt-1">{realClients.length} empresas activas</p>
        </div>

        <div className="grid gap-3">
          {realClients.map(c => (
            <button
              key={c.id}
              onClick={() => navigate(`/empresa/${c.id}`)}
              className="text-left w-full bg-navy-800/50 hover:bg-navy-800/80 border border-white/10 hover:border-gold-500/30 rounded-xl p-5 transition group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2.5 min-w-0">
                  <div>
                    <h2 className="text-cream-100 font-semibold group-hover:text-gold-300 transition text-base">
                      {c.nombre}
                    </h2>
                    {c.nit && (
                      <p className="text-cream-200/35 text-xs mt-0.5 font-mono">NIT {c.nit}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.obligaciones.slice(0, 4).map(ob => (
                      <span key={ob} className="text-[10px] bg-gold-500/8 text-gold-400/65 border border-gold-500/15 px-2 py-0.5 rounded-full tracking-wide">
                        {ob.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {c.obligaciones.length > 4 && (
                      <span className="text-xs text-cream-200/25">+{c.obligaciones.length - 4} más</span>
                    )}
                  </div>
                </div>
                <span className="text-gold-400/35 group-hover:text-gold-400 text-base shrink-0 transition mt-0.5">→</span>
              </div>

              {c.sector && (
                <p className="text-cream-200/30 text-xs mt-3 pt-3 border-t border-white/6">{c.sector}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
