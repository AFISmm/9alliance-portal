import { useMemo, useState } from 'react';
import { format, addMonths, subMonths, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { realClients } from '../data/clients';
import { obligaciones } from '../data/obligaciones';
import { getAllVencimientos } from '../lib/getVencimientos';
import type { Estado, Vencimiento } from '../lib/getVencimientos';
import { CalendarMonth, DueItemDetail } from '../components/CalendarMonth';
import { StatusBadge } from '../components/StatusBadge';
import { obligacionesMap } from '../data/obligaciones';
import { clientsMap } from '../data/clients';

type Vista = 'calendario' | 'lista';
const ESTADOS: Estado[] = ['pendiente', 'proximo', 'presentado', 'vencido'];

export default function CalendarPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [vista, setVista] = useState<Vista>('calendario');
  const [clienteFilter, setClienteFilter] = useState('');
  const [obFilter, setObFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<Estado | ''>(
    (params.get('estado') as Estado) || ''
  );
  const [selected, setSelected] = useState<Vencimiento | null>(null);

  const allVenc = useMemo(() => getAllVencimientos(realClients, obligaciones), []);

  const filtered = useMemo(() => allVenc.filter(v =>
    (!clienteFilter || v.clienteId === clienteFilter) &&
    (!obFilter || v.obligacionId === obFilter) &&
    (!estadoFilter || v.estado === estadoFilter)
  ), [allVenc, clienteFilter, obFilter, estadoFilter]);

  const monthLabel = format(month, "MMMM yyyy", { locale: es });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-cream-100">{t('calendario.titulo')}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setVista('calendario')}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${vista === 'calendario' ? 'bg-gold-500 text-navy-900 font-semibold' : 'bg-white/10 text-cream-200 hover:bg-white/15'}`}
          >{t('calendario.vistaCalendario')}</button>
          <button
            onClick={() => setVista('lista')}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${vista === 'lista' ? 'bg-gold-500 text-navy-900 font-semibold' : 'bg-white/10 text-cream-200 hover:bg-white/15'}`}
          >{t('calendario.vistaCliente')}</button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <select
          value={clienteFilter}
          onChange={e => setClienteFilter(e.target.value)}
          className="bg-navy-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-cream-100 focus:outline-none focus:border-gold-500/50"
        >
          <option value="">{t('calendario.filtroCliente')}: {t('calendario.todos')}</option>
          {realClients.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select
          value={obFilter}
          onChange={e => setObFilter(e.target.value)}
          className="bg-navy-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-cream-100 focus:outline-none focus:border-gold-500/50"
        >
          <option value="">{t('calendario.filtroObligacion')}: {t('calendario.todos')}</option>
          {obligaciones.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
        </select>
        <select
          value={estadoFilter}
          onChange={e => setEstadoFilter(e.target.value as Estado | '')}
          className="bg-navy-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-cream-100 focus:outline-none focus:border-gold-500/50"
        >
          <option value="">{t('calendario.filtroEstado')}: {t('calendario.todos')}</option>
          {ESTADOS.map(s => <option key={s} value={s}>{t(`estado.${s}`)}</option>)}
        </select>
      </div>

      {vista === 'calendario' && (
        <>
          <div className="flex items-center gap-4">
            <button onClick={() => setMonth(m => subMonths(m, 1))} className="text-cream-200/60 hover:text-cream-100 transition px-2">←</button>
            <h2 className="text-cream-100 font-medium capitalize text-lg">{monthLabel}</h2>
            <button onClick={() => setMonth(m => addMonths(m, 1))} className="text-cream-200/60 hover:text-cream-100 transition px-2">→</button>
          </div>
          <CalendarMonth month={month} vencimientos={filtered} onSelect={setSelected} />
        </>
      )}

      {vista === 'lista' && (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-cream-200/40 text-center py-12">{t('calendario.sinVencimientos')}</p>
          ) : (
            filtered.map(v => {
              const ob = obligacionesMap[v.obligacionId];
              const cl = clientsMap[v.clienteId];
              return (
                <button
                  key={v.id}
                  onClick={() => setSelected(v)}
                  className="w-full text-left bg-navy-800/50 border border-white/5 rounded-xl p-4 hover:border-gold-500/30 transition flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-cream-100 font-medium truncate">{ob?.nombre}</p>
                    <p className="text-gold-400 text-sm">{cl?.nombre}</p>
                    <p className="text-cream-200/50 text-xs mt-0.5">{v.rangoFechas}</p>
                  </div>
                  <StatusBadge estado={v.estado} />
                </button>
              );
            })
          )}
        </div>
      )}

      <p className="text-xs text-cream-200/30 border-t border-white/10 pt-3">
        ⚖️ {t('calendario.notaFechas')}
      </p>

      {selected && (
        <DueItemDetail v={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
