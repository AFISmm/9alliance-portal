import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clients } from '../data/clients';

export function ClientList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState('');

  const filtered = clients.filter(c =>
    c.nombre.toLowerCase().includes(query.toLowerCase()) ||
    c.nit.includes(query)
  );

  return (
    <div className="border-t border-white/10 mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-cream-200/80 hover:text-cream-100 transition"
        aria-expanded={open}
      >
        <span className="font-medium">
          {t('nav.clientesExternos')}
          <span className="ml-1.5 text-xs text-gold-400 bg-gold-500/10 px-1.5 py-0.5 rounded-full">
            {clients.length}
          </span>
        </span>
        <span className="text-gold-400 text-xs">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="px-3 pb-3">
          <input
            type="search"
            placeholder={t('sidebar.buscarCliente')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-navy-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-cream-100 placeholder-cream-200/30 focus:outline-none focus:border-gold-500/50 mb-2"
          />
          {filtered.length === 0 ? (
            <p className="text-xs text-cream-200/40 text-center py-2">{t('sidebar.sinResultados')}</p>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map(c => (
                <li key={c.id}>
                  <button
                    onClick={() => navigate(`/cliente/${c.id}`)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition text-xs
                      ${id === c.id
                        ? 'bg-gold-500/15 text-gold-300'
                        : 'text-cream-200/70 hover:bg-white/5 hover:text-cream-100'
                      }`}
                  >
                    <p className="font-medium truncate">{c.nombre}</p>
                    <p className="text-cream-200/40 mt-0.5">{c.nit}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
