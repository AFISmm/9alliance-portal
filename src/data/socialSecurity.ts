export interface PilaEvent {
  id: string;
  obligacionId: string;
  periodo: string;
  mes: string;
  anio: number;
  rangoFechas: string;
  fechaInicio: string;
  fechaFin: string;
  nota: string;
}

const meses = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

export const pila2026: PilaEvent[] = meses.map((mes, i) => {
  const mesPago = i + 2;
  const year = mesPago > 12 ? 2027 : 2026;
  const m = mesPago > 12 ? 1 : mesPago;
  const mesNombre = meses[m - 1];
  return {
    id: `pila_2026_m${i + 1}`,
    obligacionId: 'pila',
    periodo: `${mes} 2026`,
    mes,
    anio: 2026,
    rangoFechas: `${mesNombre} ${year} (fecha exacta según NIT)`,
    fechaInicio: `${year}-${String(m).padStart(2, '0')}-01`,
    fechaFin: `${year}-${String(m).padStart(2, '0')}-28`,
    nota: 'El día de vencimiento depende de los dos últimos dígitos del NIT/documento del aportante. Confirmar con el operador PILA (Aportes en Línea / SOI).',
  };
});

export const seguridadSocial2026 = {
  periodicidad: 'Mensual (PILA)',
  regla: 'El día de vencimiento depende de los dos últimos dígitos del NIT/documento del aportante.',
  nota: 'Los aportes del mes se pagan en el mes siguiente. Confirmar días exactos con el operador de información (Aportes en Línea / SOI).',
  eventos: pila2026,
};
