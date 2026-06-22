export interface TaxEvent {
  id: string;
  obligacionId: string;
  periodo: string;
  rangoFechas: string;
  fechaInicio: string;
  fechaFin: string;
  exacta: boolean;
  dependeNit: 'ultimo' | 'dos_ultimos' | null;
  nota?: string;
}

export const renta2026: TaxEvent[] = [
  {
    id: 'renta_2026_c1',
    obligacionId: 'renta_pj',
    periodo: 'Año gravable 2025 — Primera cuota',
    rangoFechas: '12 al 26 de mayo de 2026',
    fechaInicio: '2026-05-12',
    fechaFin: '2026-05-26',
    exacta: true,
    dependeNit: 'ultimo',
  },
  {
    id: 'renta_2026_c2',
    obligacionId: 'renta_pj',
    periodo: 'Año gravable 2025 — Segunda cuota',
    rangoFechas: '9 al 23 de julio de 2026',
    fechaInicio: '2026-07-09',
    fechaFin: '2026-07-23',
    exacta: true,
    dependeNit: 'ultimo',
  },
];

export const ivaBimestral2026: TaxEvent[] = [
  {
    id: 'iva_2026_b1',
    obligacionId: 'iva_bimestral',
    periodo: 'Enero–Febrero 2026',
    rangoFechas: '10 al 24 de marzo de 2026',
    fechaInicio: '2026-03-10',
    fechaFin: '2026-03-24',
    exacta: true,
    dependeNit: 'ultimo',
  },
  {
    id: 'iva_2026_b2',
    obligacionId: 'iva_bimestral',
    periodo: 'Marzo–Abril 2026',
    rangoFechas: '12 al 26 de mayo de 2026',
    fechaInicio: '2026-05-12',
    fechaFin: '2026-05-26',
    exacta: true,
    dependeNit: 'ultimo',
  },
  {
    id: 'iva_2026_b3',
    obligacionId: 'iva_bimestral',
    periodo: 'Mayo–Junio 2026',
    rangoFechas: '9 al 23 de julio de 2026',
    fechaInicio: '2026-07-09',
    fechaFin: '2026-07-23',
    exacta: true,
    dependeNit: 'ultimo',
  },
  {
    id: 'iva_2026_b4',
    obligacionId: 'iva_bimestral',
    periodo: 'Julio–Agosto 2026',
    rangoFechas: 'Septiembre 2026',
    fechaInicio: '2026-09-01',
    fechaFin: '2026-09-30',
    exacta: false,
    dependeNit: 'ultimo',
    nota: 'Fecha exacta por confirmar según NIT — verificar calendario oficial DIAN',
  },
  {
    id: 'iva_2026_b5',
    obligacionId: 'iva_bimestral',
    periodo: 'Septiembre–Octubre 2026',
    rangoFechas: 'Noviembre 2026',
    fechaInicio: '2026-11-01',
    fechaFin: '2026-11-30',
    exacta: false,
    dependeNit: 'ultimo',
    nota: 'Fecha exacta por confirmar según NIT — verificar calendario oficial DIAN',
  },
  {
    id: 'iva_2026_b6',
    obligacionId: 'iva_bimestral',
    periodo: 'Noviembre–Diciembre 2026',
    rangoFechas: 'Enero 2027',
    fechaInicio: '2027-01-01',
    fechaFin: '2027-01-31',
    exacta: false,
    dependeNit: 'ultimo',
    nota: 'Fecha exacta por confirmar según NIT — verificar calendario oficial DIAN',
  },
];

export const retencionFuente2026: TaxEvent[] = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
].map((mes, i) => {
  const year = 2026;
  const month = i + 2 > 12 ? 1 : i + 2;
  const y = month === 1 ? 2027 : year;
  return {
    id: `ret_2026_m${i + 1}`,
    obligacionId: 'retencion',
    periodo: `${mes} 2026`,
    rangoFechas: `Segundo y tercer decenio de ${month === 1 ? 'enero 2027' : `${['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][month-1]} ${y}`}`,
    fechaInicio: `${y}-${String(month).padStart(2,'0')}-10`,
    fechaFin: `${y}-${String(month).padStart(2,'0')}-23`,
    exacta: false,
    dependeNit: 'dos_ultimos',
    nota: 'Vencimiento según los dos últimos dígitos del NIT — verificar calendario oficial DIAN',
  };
});

export const allTaxEvents2026: TaxEvent[] = [
  ...renta2026,
  ...ivaBimestral2026,
  ...retencionFuente2026,
];
