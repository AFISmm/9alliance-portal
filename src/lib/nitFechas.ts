import { parseISO, addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

function nthWorkingDay(from: Date, n: number): Date {
  let count = 0;
  let d = new Date(from);
  while (count <= n + 20) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) {
      if (count === n) return new Date(d);
      count++;
    }
    d = addDays(d, 1);
  }
  return from;
}

// Extracts the last digit of the NIT number (before the dash)
export function lastNitDigit(nit: string): string {
  const num = nit.replace(/\./g, '').split('-')[0];
  return num.slice(-1);
}

// Extracts the last 2 digits of the NIT number (before the dash)
export function lastTwoNitDigits(nit: string): string {
  const num = nit.replace(/\./g, '').split('-')[0];
  return num.slice(-2);
}

// Maps last NIT digit to 0-based working day index (DIAN order: 1,2,...,9,0)
const DIGIT_ORDER: Record<string, number> = {
  '1': 0, '2': 1, '3': 2, '4': 3, '5': 4,
  '6': 5, '7': 6, '8': 7, '9': 8, '0': 9,
};

// Returns ISO date string for the specific day within range based on last NIT digit
export function fechaPorUltimoDigito(fechaInicio: string, nit: string): string {
  const digit = lastNitDigit(nit);
  const wdIndex = DIGIT_ORDER[digit] ?? 0;
  const date = nthWorkingDay(parseISO(fechaInicio), wdIndex);
  return format(date, 'yyyy-MM-dd');
}

// Returns ISO date for retención based on last 2 NIT digits (groups of 10)
export function fechaPorDosUltimosDigitos(fechaInicio: string, nit: string): string {
  const raw = lastTwoNitDigits(nit);
  const n = parseInt(raw) || 0;
  const norm = n === 0 ? 100 : n;
  const groupIndex = Math.min(Math.floor((norm - 1) / 10), 9);
  const date = nthWorkingDay(parseISO(fechaInicio), groupIndex);
  return format(date, 'yyyy-MM-dd');
}

// Returns a human-readable date label
export function formatFechaExacta(iso: string): string {
  return format(parseISO(iso), "d 'de' MMMM yyyy", { locale: es });
}
