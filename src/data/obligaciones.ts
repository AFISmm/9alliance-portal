export interface Obligacion {
  id: string;
  nombre: string;
  nombreEn: string;
  periodicidad: 'mensual' | 'bimestral' | 'anual';
  categoria: 'tributaria' | 'laboral';
}

export const obligaciones: Obligacion[] = [
  {
    id: 'renta_pj',
    nombre: 'Declaración de Renta — Persona Jurídica',
    nombreEn: 'Corporate Income Tax Return',
    periodicidad: 'anual',
    categoria: 'tributaria',
  },
  {
    id: 'iva_bimestral',
    nombre: 'IVA Bimestral',
    nombreEn: 'Bimonthly VAT',
    periodicidad: 'bimestral',
    categoria: 'tributaria',
  },
  {
    id: 'retencion',
    nombre: 'Retención en la Fuente',
    nombreEn: 'Withholding Tax',
    periodicidad: 'mensual',
    categoria: 'tributaria',
  },
  {
    id: 'pila',
    nombre: 'Seguridad Social (PILA)',
    nombreEn: 'Social Security (PILA)',
    periodicidad: 'mensual',
    categoria: 'laboral',
  },
];

export const obligacionesMap: Record<string, Obligacion> = Object.fromEntries(
  obligaciones.map((o) => [o.id, o])
);
