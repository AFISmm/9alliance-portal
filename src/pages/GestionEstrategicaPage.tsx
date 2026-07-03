import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Building2, Wallet, FileText, Users } from 'lucide-react';
import { realClients, clientsMap } from '../data/clients';
import { obligaciones } from '../data/obligaciones';
import { getAllVencimientos } from '../lib/getVencimientos';
import { allTaxEvents2026 } from '../data/taxCalendar';
import { pila2026 } from '../data/socialSecurity';
import type { TaxEvent } from '../data/taxCalendar';
import type { Estado } from '../lib/getVencimientos';
import { WarningModal } from '../components/WarningModal';
import { parseISO, isAfter, startOfDay } from 'date-fns';
import { fechaPorUltimoDigito, fechaPorDosUltimosDigitos, formatFechaExacta } from '../lib/nitFechas';

const SESSION_KEY = 'warning_shown';

interface SummaryCard {
  estado: Estado; labelKey: string;
  color: string; dot: string; bg: string; border: string; hoverBorder: string;
}

const cards: SummaryCard[] = [
  { estado: 'pendiente',  labelKey: 'home.pendientes',  color: 'text-slate-300',   dot: 'bg-slate-400',   bg: 'bg-slate-500/8',   border: 'border-slate-500/20',   hoverBorder: 'hover:border-slate-400/40'   },
  { estado: 'proximo',    labelKey: 'home.proximos',    color: 'text-amber-300',   dot: 'bg-amber-400',   bg: 'bg-amber-500/8',   border: 'border-amber-500/20',   hoverBorder: 'hover:border-amber-400/40'   },
  { estado: 'presentado', labelKey: 'home.presentados', color: 'text-emerald-300', dot: 'bg-emerald-400', bg: 'bg-emerald-500/8', border: 'border-emerald-500/20', hoverBorder: 'hover:border-emerald-400/40' },
  { estado: 'vencido',    labelKey: 'home.vencidos',    color: 'text-red-300',     dot: 'bg-red-400',     bg: 'bg-red-500/8',     border: 'border-red-500/20',     hoverBorder: 'hover:border-red-400/40'     },
];

const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const OBLIG_ICON: Record<string, React.ReactElement> = {
  renta_pj:      <FileText size={11} strokeWidth={1.75} />,
  iva_bimestral: <Wallet size={11} strokeWidth={1.75} />,
  retencion:     <Building2 size={11} strokeWidth={1.75} />,
  pila:          <Users size={11} strokeWidth={1.75} />,
};
const OBLIG_COLOR: Record<string, string> = {
  renta_pj:      '#60A5FA',
  iva_bimestral: '#C9A84C',
  retencion:     '#34D399',
  pila:          '#F472B6',
};
const OBLIG_LABEL: Record<string, string> = {
  renta_pj:      'Renta PJ',
  iva_bimestral: 'IVA Bimestral',
  retencion:     'Retención',
  pila:          'Nómina / PILA',
};

// Group events by month for the tax calendar
interface CalEvent {
  id: string;
  obligacionId: string;
  periodo: string;
  rangoFechas: string;
  fechaFin: string;
  clienteDates: { nombre: string; fechaExacta: string }[];
}

export default function GestionEstrategicaPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [calFilter, setCalFilter] = useState<string>('all');

  const allVenc = useMemo(() => getAllVencimientos(realClients, obligaciones), []);

  const counts: Record<Estado, number> = useMemo(() => ({
    pendiente:  allVenc.filter(v => v.estado === 'pendiente').length,
    proximo:    allVenc.filter(v => v.estado === 'proximo').length,
    presentado: allVenc.filter(v => v.estado === 'presentado').length,
    vencido:    allVenc.filter(v => v.estado === 'vencido').length,
  }), [allVenc]);

  const proximos = useMemo(() =>
    allVenc
      .filter(v => v.estado === 'proximo' || v.estado === 'vencido')
      .sort((a, b) => (a.fechaExactaNit ?? a.fechaFin).localeCompare(b.fechaExactaNit ?? b.fechaFin))
  , [allVenc]);

  // Build calendar: future tax events + PILA grouped by month
  const calendarByMonth = useMemo(() => {
    const today = startOfDay(new Date());

    // ── Tax events ──
    const taxCalEvents: CalEvent[] = allTaxEvents2026
      .filter(e => isAfter(parseISO(e.fechaFin), today) || e.fechaFin >= today.toISOString().slice(0, 10))
      .map((e: TaxEvent) => {
        const clienteDates = realClients
          .filter(c => c.obligaciones.includes(e.obligacionId))
          .map(c => {
            let fecha = e.fechaFin;
            if (e.dependeNit === 'ultimo') {
              fecha = fechaPorUltimoDigito(e.fechaInicio, c.nit) || fecha;
            } else if (e.dependeNit === 'dos_ultimos') {
              fecha = fechaPorDosUltimosDigitos(e.fechaInicio, c.nit) || fecha;
            }
            return { nombre: c.nombre, fechaExacta: formatFechaExacta(fecha) || e.rangoFechas };
          });
        return { id: e.id, obligacionId: e.obligacionId, periodo: e.periodo, rangoFechas: e.rangoFechas, fechaFin: e.fechaFin, clienteDates };
      });

    // ── PILA events ──
    const pilaEvents: CalEvent[] = pila2026
      .filter(e => isAfter(parseISO(e.fechaFin), today) || e.fechaFin >= today.toISOString().slice(0, 10))
      .map(e => {
        const clienteDates = realClients
          .filter(c => c.obligaciones.includes('pila'))
          .map(c => ({
            nombre: c.nombre,
            fechaExacta: e.rangoFechas,
          }));
        return { id: e.id, obligacionId: 'pila', periodo: e.periodo, rangoFechas: e.rangoFechas, fechaFin: e.fechaFin, clienteDates: clienteDates };
      });

    const all = [...taxCalEvents, ...pilaEvents]
      .sort((a, b) => a.fechaFin.localeCompare(b.fechaFin));

    // Group by year-month
    const groups: Record<string, { label: string; events: CalEvent[] }> = {};
    for (const ev of all) {
      const d = parseISO(ev.fechaFin);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) {
        groups[key] = { label: `${MESES_ES[d.getMonth()]} ${d.getFullYear()}`, events: [] };
      }
      groups[key].events.push(ev);
    }
    return Object.entries(groups).slice(0, 8); // next 8 months max
  }, []);

  const filteredCalendar = useMemo(() => {
    if (calFilter === 'all') return calendarByMonth;
    return calendarByMonth.map(([k, g]) => [k, {
      ...g,
      events: g.events.filter(e => e.obligacionId === calFilter),
    }] as [string, { label: string; events: CalEvent[] }]).filter(([, g]) => g.events.length > 0);
  }, [calendarByMonth, calFilter]);

  useMemo(() => {
    const upcoming = allVenc.filter(v => v.estado === 'proximo');
    if (upcoming.length > 0 && !sessionStorage.getItem(SESSION_KEY)) {
      setTimeout(() => setShowModal(true), 400);
    }
  }, [allVenc]);

  function handleCloseModal() {
    sessionStorage.setItem(SESSION_KEY, '1');
    setShowModal(false);
  }

  return (
    <>
      {showModal && (
        <WarningModal
          vencimientos={allVenc.filter(v => v.estado === 'proximo')}
          onClose={handleCloseModal}
        />
      )}

      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-cream-100">Tablero de Obligaciones</h1>
          <p className="text-cream-200/35 text-xs mt-0.5">Resumen en tiempo real · {realClients.length} empresas</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map(card => (
            <button key={card.estado}
              onClick={() => navigate(`/informacion-general?tab=calendario&estado=${card.estado}`)}
              className={`${card.bg} ${card.border} ${card.hoverBorder} border rounded-xl px-4 py-3.5 text-left transition group`}>
              <p className={`text-3xl font-bold tabular-nums ${card.color}`}>{counts[card.estado]}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${card.dot}`} />
                <p className="text-cream-200/45 text-[10px] uppercase tracking-wider font-medium">{t(card.labelKey)}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Upcoming list */}
        <div className="bg-navy-800/40 border border-white/8 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
            <h2 className="text-cream-100 text-sm font-semibold">Próximos vencimientos</h2>
            {proximos.length > 0 && (
              <button onClick={() => navigate('/informacion-general?tab=calendario')}
                className="text-gold-400/60 hover:text-gold-400 text-xs transition">
                Ver calendario →
              </button>
            )}
          </div>
          {proximos.length === 0 ? (
            <div className="px-4 py-10 flex flex-col items-center gap-2 text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm">✓</div>
              <p className="text-cream-200/40 text-sm">Sin vencimientos próximos</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {proximos.slice(0, 10).map(v => {
                const cliente  = clientsMap[v.clienteId];
                const oblig    = obligaciones.find(o => o.id === v.obligacionId);
                const isVencido = v.estado === 'vencido';
                return (
                  <button key={v.id} onClick={() => navigate(`/empresa/${v.clienteId}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition text-left group">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-0.5 ${isVencido ? 'bg-red-400' : 'bg-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-cream-100 text-xs font-medium truncate leading-snug">{cliente?.nombre ?? v.clienteId}</p>
                      <p className="text-cream-200/40 text-[10.5px] truncate mt-0.5">{oblig?.nombre ?? v.obligacionId}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-xs font-medium tabular-nums ${isVencido ? 'text-red-300' : 'text-amber-300'}`}>
                        {v.fechaExactaLabel ?? v.rangoFechas}
                      </p>
                      <p className="text-cream-200/25 text-[10px] mt-0.5">{v.periodo}</p>
                    </div>
                    <span className="text-cream-200/20 group-hover:text-gold-400/60 text-xs transition shrink-0">→</span>
                  </button>
                );
              })}
              {proximos.length > 10 && (
                <button onClick={() => navigate('/informacion-general?tab=calendario')}
                  className="w-full px-4 py-3 text-center text-xs text-cream-200/35 hover:text-gold-400 transition">
                  Ver {proximos.length - 10} más en el calendario →
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Calendario Tributario y Nómina ── */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CalendarDays size={16} strokeWidth={1.75} className="text-gold-400" />
              <h2 className="text-cream-100 text-sm font-semibold">Calendario Tributario y Nómina 2026</h2>
            </div>
            {/* Filter pills */}
            <div className="flex gap-1.5 flex-wrap">
              {[
                { id: 'all',          label: 'Todos' },
                { id: 'retencion',    label: 'Retención' },
                { id: 'iva_bimestral',label: 'IVA' },
                { id: 'renta_pj',     label: 'Renta' },
                { id: 'pila',         label: 'Nómina / PILA' },
              ].map(f => (
                <button key={f.id} onClick={() => setCalFilter(f.id)}
                  className={`px-3 py-1 rounded-full text-[10.5px] font-semibold transition border ${
                    calFilter === f.id
                      ? 'bg-gold-500/15 text-gold-300 border-gold-500/30'
                      : 'text-cream-200/40 border-white/10 hover:text-cream-100 hover:border-white/20'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredCalendar.length === 0 ? (
            <div className="bg-navy-800/40 border border-white/8 rounded-xl px-6 py-10 text-center">
              <p className="text-cream-200/30 text-sm">Sin eventos futuros para este filtro</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCalendar.map(([monthKey, group]) => (
                <div key={monthKey} className="bg-navy-800/40 border border-white/8 rounded-xl overflow-hidden">
                  {/* Month header */}
                  <div className="px-4 py-2.5 border-b border-white/8 flex items-center gap-2"
                    style={{ background: 'rgba(201,168,76,.05)' }}>
                    <CalendarDays size={12} strokeWidth={2} className="text-gold-400 shrink-0" />
                    <h3 className="text-gold-300 text-xs font-semibold tracking-wide">{group.label}</h3>
                    <span className="text-cream-200/25 text-[10px]">· {group.events.length} evento{group.events.length !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Events in this month */}
                  <div className="divide-y divide-white/5">
                    {group.events.map(ev => {
                      const color  = OBLIG_COLOR[ev.obligacionId] ?? '#AEBCCD';
                      const icon   = OBLIG_ICON[ev.obligacionId];
                      const label  = OBLIG_LABEL[ev.obligacionId] ?? ev.obligacionId;
                      return (
                        <div key={ev.id} className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            {/* Obligation chip */}
                            <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 mt-0.5"
                              style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}>
                              {icon} {label}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-cream-100 text-xs font-medium leading-snug">{ev.periodo}</p>
                              <p className="text-cream-200/40 text-[10.5px] mt-0.5">{ev.rangoFechas}</p>
                            </div>
                          </div>

                          {/* Per-client exact dates */}
                          {ev.clienteDates.length > 0 && (
                            <div className="mt-2 pl-2 flex flex-wrap gap-x-5 gap-y-1.5">
                              {ev.clienteDates.map(cd => (
                                <div key={cd.nombre} className="flex items-center gap-2">
                                  <div className="w-1 h-1 rounded-full bg-white/20 shrink-0" />
                                  <span className="text-cream-200/55 text-[10.5px]">{cd.nombre}</span>
                                  <span className="text-amber-300/80 text-[10.5px] font-medium tabular-nums">{cd.fechaExacta}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legal note */}
        <p className="text-[10px] text-cream-200/25 border-t border-white/8 pt-3">
          {t('home.notaLegal')}
        </p>
      </div>
    </>
  );
}
