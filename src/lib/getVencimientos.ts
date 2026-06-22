import type { Client } from '../data/clients';
import type { Obligacion } from '../data/obligaciones';
import { allTaxEvents2026 } from '../data/taxCalendar';
import type { TaxEvent } from '../data/taxCalendar';
import { pila2026 } from '../data/socialSecurity';
import type { PilaEvent } from '../data/socialSecurity';
import { parseISO, isAfter, isBefore, addDays, isWithinInterval, startOfDay } from 'date-fns';

export type Estado = 'pendiente' | 'proximo' | 'presentado' | 'vencido';

export interface Vencimiento {
  id: string;
  clienteId: string;
  obligacionId: string;
  periodo: string;
  rangoFechas: string;
  fechaInicio: string;
  fechaFin: string;
  exacta: boolean;
  nota?: string;
  estado: Estado;
  fechaPresentacion?: string;
  notaUsuario?: string;
}

export interface VencimientoEstadoDB {
  cliente_id: string;
  event_id: string;
  estado: Estado;
  fecha_presentacion?: string;
  nota?: string;
}

function computeEstado(
  fechaFin: string,
  overrideEstado?: Estado,
  fechaPresentacion?: string
): Estado {
  if (fechaPresentacion || overrideEstado === 'presentado') return 'presentado';
  if (overrideEstado && overrideEstado !== 'pendiente') return overrideEstado;
  const today = startOfDay(new Date());
  const fin = parseISO(fechaFin);
  if (isBefore(fin, today)) return 'vencido';
  if (isWithinInterval(fin, { start: today, end: addDays(today, 7) })) return 'proximo';
  return 'pendiente';
}

export function getVencimientos(
  client: Client,
  obligaciones: Obligacion[],
  dbEstados: VencimientoEstadoDB[] = []
): Vencimiento[] {
  const corte = client.fechaInicioVencimientos
    ? parseISO(client.fechaInicioVencimientos)
    : null;

  const estadosMap = new Map<string, VencimientoEstadoDB>();
  dbEstados.forEach(e => estadosMap.set(e.event_id, e));

  const result: Vencimiento[] = [];

  for (const obId of client.obligaciones) {
    const ob = obligaciones.find(o => o.id === obId);
    if (!ob) continue;

    let events: Array<{ id: string; obligacionId: string; periodo: string; rangoFechas: string; fechaInicio: string; fechaFin: string; exacta: boolean; nota?: string }> = [];

    if (obId === 'pila') {
      events = pila2026.map((e: PilaEvent) => ({
        id: e.id, obligacionId: e.obligacionId, periodo: e.periodo,
        rangoFechas: e.rangoFechas, fechaInicio: e.fechaInicio,
        fechaFin: e.fechaFin, exacta: false, nota: e.nota,
      }));
    } else {
      events = allTaxEvents2026.filter((e: TaxEvent) => e.obligacionId === obId);
    }

    for (const ev of events) {
      if (corte && isBefore(parseISO(ev.fechaFin), corte)) continue;
      const db = estadosMap.get(ev.id);
      const estado = computeEstado(ev.fechaFin, db?.estado, db?.fecha_presentacion);
      result.push({
        id: ev.id,
        clienteId: client.id,
        obligacionId: obId,
        periodo: ev.periodo,
        rangoFechas: ev.rangoFechas,
        fechaInicio: ev.fechaInicio,
        fechaFin: ev.fechaFin,
        exacta: ev.exacta,
        nota: ev.nota,
        estado,
        fechaPresentacion: db?.fecha_presentacion,
        notaUsuario: db?.nota,
      });
    }
  }

  return result.sort((a, b) => a.fechaFin.localeCompare(b.fechaFin));
}

export function getAllVencimientos(
  clientes: Client[],
  obligaciones: Obligacion[],
  dbEstados: VencimientoEstadoDB[] = []
): Vencimiento[] {
  return clientes.flatMap(c => getVencimientos(c, obligaciones, dbEstados));
}

export function filterByDate(vencimientos: Vencimiento[], from: Date, to: Date): Vencimiento[] {
  return vencimientos.filter(v => {
    const fi = parseISO(v.fechaInicio);
    const ff = parseISO(v.fechaFin);
    return !isAfter(fi, to) && !isBefore(ff, from);
  });
}
