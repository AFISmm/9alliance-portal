import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clientsMap } from '../data/clients';
import { obligaciones, obligacionesMap } from '../data/obligaciones';
import { getVencimientos } from '../lib/getVencimientos';
import type { Estado } from '../lib/getVencimientos';
import { StatusBadge } from '../components/StatusBadge';

const ESTADOS: Estado[] = ['pendiente', 'proximo', 'presentado', 'vencido'];

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const client = id ? clientsMap[id] : null;

  const [localEstados, setLocalEstados] = useState<Record<string, { estado: Estado; fecha: string; nota: string }>>({});

  const vencimientos = useMemo(() => {
    if (!client) return [];
    return getVencimientos(client, obligaciones);
  }, [client]);

  function handleChange(vId: string, field: 'estado' | 'fecha' | 'nota', value: string) {
    setLocalEstados(prev => {
      const current = prev[vId] ?? { estado: 'pendiente' as Estado, fecha: '', nota: '' };
      return { ...prev, [vId]: { ...current, [field]: value } };
    });
  }

  function downloadCSV() {
    if (!client) return;
    const header = 'Período,Obligación,Vencimiento,Estado,Fecha presentación,Nota\n';
    const rows = vencimientos.map(v => {
      const ob = obligacionesMap[v.obligacionId];
      const local = localEstados[v.id];
      return `"${v.periodo}","${ob?.nombre}","${v.rangoFechas}","${local?.estado || v.estado}","${local?.fecha || ''}","${local?.nota || ''}"`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${client.nombre.replace(/\s/g, '_')}_vencimientos.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  function handlePrint() { window.print(); }

  if (!client) {
    return (
      <div className="text-center py-20">
        <p className="text-cream-200/40 mb-4">Empresa no encontrada</p>
        <button onClick={() => navigate('/empresas')} className="text-gold-400 hover:underline text-sm">← Volver a Empresas</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-cream-100">{client.nombre}</h1>
          <p className="text-gold-400 text-sm mt-1">NIT {client.nit}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-cream-100 text-sm px-3 py-2 rounded-lg transition">
            🖨️ {t('cliente.imprimir')}
          </button>
          <button onClick={downloadCSV} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-cream-100 text-sm px-3 py-2 rounded-lg transition">
            ⬇️ {t('cliente.descargar')}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-navy-800/50 border border-white/5 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        {client.contacto && <div><p className="text-cream-200/40 text-xs">{t('cliente.contacto')}</p><p className="text-cream-100">{client.contacto}</p></div>}
        {client.email && <div><p className="text-cream-200/40 text-xs">{t('cliente.email')}</p><p className="text-cream-100">{client.email}</p></div>}
        {client.telefono && <div><p className="text-cream-200/40 text-xs">{t('cliente.telefono')}</p><p className="text-cream-100">{client.telefono}</p></div>}
        <div><p className="text-cream-200/40 text-xs">{t('cliente.sector')}</p><p className="text-cream-100">{client.sector}</p></div>
        {client.fechaInicioVencimientos && (
          <div><p className="text-cream-200/40 text-xs">Vencimientos desde</p><p className="text-cream-100">{client.fechaInicioVencimientos}</p></div>
        )}
      </div>

      {/* Obligaciones */}
      <div>
        <h2 className="text-cream-100 font-semibold mb-3">{t('cliente.vencimientos')}</h2>
        {vencimientos.length === 0 ? (
          <p className="text-cream-200/40 text-sm">{t('cliente.sinVencimientos')}</p>
        ) : (
          <div className="space-y-3">
            {vencimientos.map(v => {
              const ob = obligacionesMap[v.obligacionId];
              const local = localEstados[v.id];
              const estadoActual: Estado = (local?.estado as Estado) || v.estado;
              return (
                <div key={v.id} className="bg-navy-800/50 border border-white/5 rounded-xl p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-cream-100 font-medium">{ob?.nombre}</p>
                      <p className="text-cream-200/50 text-sm">{v.periodo}</p>
                      {v.fechaExactaLabel ? (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1.5 bg-gold-500/10 border border-gold-500/25 text-gold-300 text-xs px-2 py-0.5 rounded-full">
                            📅 Vence: {v.fechaExactaLabel}
                          </span>
                          <p className="text-cream-200/30 text-xs mt-0.5">Rango DIAN: {v.rangoFechas}</p>
                        </div>
                      ) : (
                        <p className="text-gold-300 text-xs mt-0.5">{v.rangoFechas}</p>
                      )}
                      {v.nota && <p className="text-amber-300/60 text-xs mt-1 italic">{v.nota}</p>}
                    </div>
                    <StatusBadge estado={estadoActual} size="md" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-cream-200/40 mb-1">{t('calendario.filtroEstado')}</label>
                      <select
                        value={local?.estado || v.estado}
                        onChange={e => handleChange(v.id, 'estado', e.target.value)}
                        className="w-full bg-navy-900 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-cream-100 focus:outline-none focus:border-gold-500/50"
                      >
                        {ESTADOS.map(s => <option key={s} value={s}>{t(`estado.${s}`)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-cream-200/40 mb-1">{t('cliente.fechaPresentacion')}</label>
                      <input
                        type="date"
                        value={local?.fecha || ''}
                        onChange={e => handleChange(v.id, 'fecha', e.target.value)}
                        className="w-full bg-navy-900 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-cream-100 focus:outline-none focus:border-gold-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-cream-200/40 mb-1">{t('cliente.notas')}</label>
                      <input
                        type="text"
                        placeholder="Nota interna..."
                        value={local?.nota || ''}
                        onChange={e => handleChange(v.id, 'nota', e.target.value)}
                        className="w-full bg-navy-900 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-cream-100 placeholder-cream-200/20 focus:outline-none focus:border-gold-500/50"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <p className="text-xs text-cream-200/30 border-t border-white/10 pt-3">
        ⚖️ {t('calendario.notaFechas')}
      </p>
    </div>
  );
}
