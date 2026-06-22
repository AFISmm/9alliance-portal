// VERIFICAR CONTRA NORMA VIGENTE 2026 antes de usar en producción

export const UVT_2026 = 52374;
export const SMMLV_2026 = 1750905;
export const AUX_TRANSPORTE_2026 = 249095;
export const IVA_TASA_GENERAL = 19;
export const VIGENCIA = 2026;

export interface TarifaRenta {
  concepto: string;
  grupoEs: string;
  baseUvt: number;
  tarifaPct: number;
}

export const TARIFAS_RENTA: TarifaRenta[] = [
  { concepto: 'Honorarios y comisiones — Persona natural', grupoEs: 'Honorarios y comisiones', baseUvt: 0, tarifaPct: 10.0 },
  { concepto: 'Honorarios y comisiones — Persona jurídica', grupoEs: 'Honorarios y comisiones', baseUvt: 0, tarifaPct: 11.0 },
  { concepto: 'Servicios generales', grupoEs: 'Servicios', baseUvt: 4, tarifaPct: 4.0 },
  { concepto: 'Servicios de aseo y vigilancia', grupoEs: 'Servicios', baseUvt: 4, tarifaPct: 2.0 },
  { concepto: 'Transporte nacional de carga', grupoEs: 'Servicios', baseUvt: 4, tarifaPct: 1.0 },
  { concepto: 'Transporte de pasajeros (nacional)', grupoEs: 'Servicios', baseUvt: 4, tarifaPct: 3.5 },
  { concepto: 'Compras en general', grupoEs: 'Compras', baseUvt: 27, tarifaPct: 2.5 },
  { concepto: 'Bienes agrícolas sin procesamiento industrial', grupoEs: 'Compras', baseUvt: 92, tarifaPct: 1.5 },
  { concepto: 'Vehículos', grupoEs: 'Compras', baseUvt: 0, tarifaPct: 1.0 },
  { concepto: 'Arrendamiento de bienes inmuebles', grupoEs: 'Arrendamientos', baseUvt: 27, tarifaPct: 3.5 },
  { concepto: 'Arrendamiento de bienes muebles', grupoEs: 'Arrendamientos', baseUvt: 0, tarifaPct: 4.0 },
  { concepto: 'Rendimientos financieros en general', grupoEs: 'Otros', baseUvt: 0, tarifaPct: 7.0 },
  { concepto: 'Contratos de construcción y urbanismo', grupoEs: 'Otros', baseUvt: 0, tarifaPct: 2.0 },
  { concepto: 'Loterías, rifas, apuestas y similares', grupoEs: 'Otros', baseUvt: 48, tarifaPct: 20.0 },
  { concepto: 'Enajenación de activos fijos — Persona natural', grupoEs: 'Otros', baseUvt: 0, tarifaPct: 1.0 },
];

export interface TarifaIca {
  actividad: string;
  tarifaXmil: number;
}

export const TARIFAS_ICA_BOGOTA: TarifaIca[] = [
  { actividad: 'Industria (fabricación)', tarifaXmil: 6.9 },
  { actividad: 'Comercio al por mayor', tarifaXmil: 9.66 },
  { actividad: 'Comercio al por menor', tarifaXmil: 11.04 },
  { actividad: 'Servicios en general', tarifaXmil: 9.66 },
  { actividad: 'Servicios financieros', tarifaXmil: 13.8 },
  { actividad: 'Servicios profesionales e independientes', tarifaXmil: 9.66 },
  { actividad: 'Actividades de la construcción', tarifaXmil: 4.14 },
  { actividad: 'Transporte terrestre', tarifaXmil: 9.66 },
  { actividad: 'Hoteles y restaurantes', tarifaXmil: 9.66 },
];

export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(value);
}
