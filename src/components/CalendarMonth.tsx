import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parseISO, isWithinInterval } from 'date-fns';
import type { Vencimiento } from '../lib/getVencimientos';
import { StatusBadge } from './StatusBadge';
import { obligacionesMap } from '../data/obligaciones';
import { clientsMap } from '../data/clients';

const DOW = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

interface Props {
  month: Date;
  vencimientos: Vencimiento[];
  onSelect: (v: Vencimiento) => void;
}

export function CalendarMonth({ month, vencimientos, onSelect }: Props) {
  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const firstDow = getDay(days[0]);

  function getForDay(day: Date) {
    return vencimientos.filter(v => {
      const fi = parseISO(v.fechaInicio);
      const ff = parseISO(v.fechaFin);
      return isWithinInterval(day, { start: fi, end: ff });
    });
  }

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DOW.map(d => (
          <div key={d} className="text-center text-xs text-cream-200/40 py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-xl overflow-hidden">
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-navy-900 min-h-[72px]" />
        ))}
        {days.map(day => {
          const dayVenc = getForDay(day);
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          return (
            <div
              key={format(day, 'yyyy-MM-dd')}
              className={`bg-navy-900 min-h-[72px] p-1.5 ${isToday ? 'ring-1 ring-inset ring-gold-500/40' : ''}`}
            >
              <span className={`text-xs font-medium ${isToday ? 'text-gold-400' : 'text-cream-200/50'}`}>
                {format(day, 'd')}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayVenc.slice(0, 3).map(v => {
                  const ob = obligacionesMap[v.obligacionId];
                  const cl = clientsMap[v.clienteId];
                  const dotColor = v.estado === 'vencido' ? 'bg-red-400' : v.estado === 'proximo' ? 'bg-amber-400' : v.estado === 'presentado' ? 'bg-green-400' : 'bg-gray-400';
                  return (
                    <button
                      key={v.id}
                      onClick={() => onSelect(v)}
                      className="w-full text-left flex items-center gap-1 hover:bg-white/5 rounded px-1 py-0.5 transition"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                      <span className="text-[10px] text-cream-200/70 truncate">{cl?.nombre.split(' ')[0]} · {ob?.nombre.split('—')[0].trim()}</span>
                    </button>
                  );
                })}
                {dayVenc.length > 3 && (
                  <p className="text-[10px] text-gold-400 px-1">+{dayVenc.length - 3}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DueItemDetail({ v, onClose }: {
  v: Vencimiento;
  onClose: () => void;
}) {
  const { obligacionId, clienteId } = v;
  const ob = obligacionesMap[obligacionId];
  const cl = clientsMap[clienteId];
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-navy-800 border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-cream-100 font-semibold text-lg">{ob?.nombre}</h3>
            <p className="text-gold-400 text-sm">{cl?.nombre}</p>
          </div>
          <button onClick={onClose} className="text-cream-200/40 hover:text-cream-100 text-xl">✕</button>
        </div>
        <div className="space-y-2 text-sm">
          <p><span className="text-cream-200/40">Período:</span> <span className="text-cream-100">{v.periodo}</span></p>
          <p><span className="text-cream-200/40">Fecha:</span> <span className="text-cream-100">{v.rangoFechas}</span></p>
          {v.nota && <p className="text-amber-300/80 text-xs">{v.nota}</p>}
          <div className="pt-2"><StatusBadge estado={v.estado} size="md" /></div>
          {v.fechaPresentacion && <p><span className="text-cream-200/40">Presentado:</span> <span className="text-green-300">{v.fechaPresentacion}</span></p>}
          {v.notaUsuario && <p className="bg-navy-900 rounded p-2 text-cream-200/70 text-xs">{v.notaUsuario}</p>}
        </div>
        <button onClick={onClose} className="mt-5 w-full bg-white/10 hover:bg-white/15 text-cream-100 py-2 rounded-lg transition text-sm">Cerrar</button>
      </div>
    </div>
  );
}
