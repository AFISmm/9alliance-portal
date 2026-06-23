import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clients } from '../data/clients';

export default function ClientesExternos() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState('');

  const selected = clients.find(c => c.id === selectedId);

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold text-cream-100">Clientes</h1>

      <div>
        <label className="block text-sm text-cream-200/60 mb-1.5">{t('clientes.seleccionar')}</label>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="w-full bg-navy-800 border border-white/10 rounded-lg px-4 py-2.5 text-cream-100 focus:outline-none focus:border-gold-500/50 transition"
        >
          <option value="">{t('clientes.placeholder')}</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.nombre} — {c.nit}</option>
          ))}
        </select>
      </div>

      {!selected && (
        <p className="text-cream-200/40 text-sm">{t('clientes.sin')}</p>
      )}

      {selected && (
        <div className="bg-navy-800/50 border border-white/10 rounded-xl p-6 space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold text-cream-100">{selected.nombre}</h2>
              <p className="text-gold-400 text-sm mt-0.5">NIT: {selected.nit}</p>
            </div>
            <button
              onClick={() => navigate(`/cliente/${selected.id}`)}
              className="text-xs bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold px-4 py-2 rounded-lg transition shrink-0"
            >
              {t('clientes.verDetalle')}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {selected.contacto && selected.contacto !== '(por confirmar)' && (
              <div>
                <span className="block text-cream-200/40 text-xs mb-0.5">{t('cliente.contacto')}</span>
                <p className="text-cream-100">{selected.contacto}</p>
              </div>
            )}
            {selected.email && selected.email !== '(por confirmar)' && (
              <div>
                <span className="block text-cream-200/40 text-xs mb-0.5">{t('cliente.email')}</span>
                <p className="text-cream-100">{selected.email}</p>
              </div>
            )}
            {selected.telefono && selected.telefono !== '(por confirmar)' && (
              <div>
                <span className="block text-cream-200/40 text-xs mb-0.5">{t('cliente.telefono')}</span>
                <p className="text-cream-100">{selected.telefono}</p>
              </div>
            )}
            {selected.sector && (
              <div>
                <span className="block text-cream-200/40 text-xs mb-0.5">{t('cliente.sector')}</span>
                <p className="text-cream-100">{selected.sector}</p>
              </div>
            )}
          </div>

          <div>
            <span className="block text-cream-200/40 text-xs mb-2">{t('clientes.obligaciones')}</span>
            <div className="flex flex-wrap gap-2">
              {selected.obligaciones.map(ob => (
                <span key={ob} className="text-xs bg-gold-500/10 text-gold-300 border border-gold-500/20 px-2.5 py-1 rounded-full">
                  {ob.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          {selected.fechaInicioVencimientos && (
            <p className="text-xs text-amber-400/60 border border-amber-500/15 bg-amber-500/5 rounded-lg px-3 py-2">
              Vencimientos desde: {selected.fechaInicioVencimientos}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
