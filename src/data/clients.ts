export interface Responsables {
  contador?: string;
  coordinador?: string;
  senior?: string;
  junior?: string;
  revisorFiscal?: string;
  representanteFiscal?: string;
}

export interface Caracterizacion {
  tipoEntidad?: string;
  regimen?: string;
  granContribuyente?: boolean;
  superintendencia?: string;
  composicionAccionaria?: string;
  registroProponentes?: boolean;
}

export interface Client {
  id: string;
  nombre: string;
  nit: string;
  contacto: string;
  email: string;
  telefono: string;
  sector: string;
  ultimoDigitoNit: string;
  obligaciones: string[];
  notas?: string;
  fechaInicioVencimientos?: string;
  esReal?: boolean;
  representanteLegal?: string;
  responsables?: Responsables;
  caracterizacion?: Caracterizacion;
}

export const clients: Client[] = [
  // ── Clientes reales ──────────────────────────────────────────────────────
  {
    id: 'c001',
    nombre: '9ALLIANCE SAS BIC',
    nit: '900.524.213-6',
    contacto: '(por confirmar)',
    email: 'info@9alliance.co',
    telefono: '(por confirmar)',
    sector: 'Servicios jurídicos y contables',
    ultimoDigitoNit: '6',
    obligaciones: ['renta_pj', 'iva_bimestral', 'retencion', 'pila'],
    fechaInicioVencimientos: '2026-06-01',
    esReal: true,
    representanteLegal: '(por confirmar)',
    responsables: {
      contador: 'Felipe Serna',
      coordinador: '(por confirmar)',
    },
    caracterizacion: {
      tipoEntidad: 'SAS BIC',
      regimen: 'Común',
      granContribuyente: false,
      superintendencia: 'Sociedades',
    },
  },
  {
    id: 'c002',
    nombre: 'ILC SAS BIC',
    nit: '830.053.483-2',
    contacto: '(por confirmar)',
    email: '(por confirmar)',
    telefono: '(por confirmar)',
    sector: 'Servicios',
    ultimoDigitoNit: '2',
    obligaciones: ['renta_pj', 'iva_bimestral', 'retencion', 'pila'],
    fechaInicioVencimientos: '2026-06-01',
    esReal: true,
    representanteLegal: '(por confirmar)',
    responsables: {
      contador: 'Felipe Serna',
      coordinador: '(por confirmar)',
    },
    caracterizacion: {
      tipoEntidad: 'SAS BIC',
      regimen: 'Común',
      granContribuyente: false,
    },
  },
  // ── Empresas demo (datos ficticios) ─────────────────────────────────────
  {
    id: 'demo-001',
    nombre: 'TechVerde SAS',
    nit: '901.234.567-8',
    contacto: 'Laura Gómez',
    email: 'laura@techverde.co',
    telefono: '+57 300 123 4567',
    sector: 'Tecnología e Innovación',
    ultimoDigitoNit: '8',
    obligaciones: ['renta_pj', 'iva_bimestral', 'retencion', 'pila'],
    fechaInicioVencimientos: '2026-01-01',
    esReal: false,
    notas: 'Empresa demo — datos ficticios',
  },
  {
    id: 'demo-002',
    nombre: 'Constructora Altamira SA',
    nit: '800.456.789-3',
    contacto: 'Carlos Restrepo',
    email: 'crestrepo@altamira.com.co',
    telefono: '+57 311 987 6543',
    sector: 'Construcción y Obras',
    ultimoDigitoNit: '3',
    obligaciones: ['renta_pj', 'iva_bimestral', 'retencion', 'pila'],
    fechaInicioVencimientos: '2026-01-01',
    esReal: false,
    notas: 'Empresa demo — datos ficticios',
  },
  {
    id: 'demo-003',
    nombre: 'Café del Páramo Ltda',
    nit: '700.321.654-9',
    contacto: 'Sofía Herrera',
    email: 'sofia@cafelparamo.co',
    telefono: '+57 315 234 5678',
    sector: 'Alimentos y Bebidas',
    ultimoDigitoNit: '9',
    obligaciones: ['renta_pj', 'iva_bimestral', 'retencion', 'pila'],
    fechaInicioVencimientos: '2026-01-01',
    esReal: false,
    notas: 'Empresa demo — datos ficticios',
  },
  {
    id: 'demo-004',
    nombre: 'Distribuidora Central SAS',
    nit: '901.765.432-1',
    contacto: 'Andrés Morales',
    email: 'amorales@distcentral.co',
    telefono: '+57 301 567 8901',
    sector: 'Distribución y Logística',
    ultimoDigitoNit: '1',
    obligaciones: ['renta_pj', 'iva_bimestral', 'retencion', 'pila'],
    fechaInicioVencimientos: '2026-01-01',
    esReal: false,
    notas: 'Empresa demo — datos ficticios',
  },
  {
    id: 'demo-005',
    nombre: 'Clínica San José SA',
    nit: '830.987.654-5',
    contacto: 'Dra. María López',
    email: 'mlopez@clinicasanjose.co',
    telefono: '+57 304 890 1234',
    sector: 'Salud y Medicina',
    ultimoDigitoNit: '5',
    obligaciones: ['renta_pj', 'iva_bimestral', 'retencion', 'pila'],
    fechaInicioVencimientos: '2026-01-01',
    esReal: false,
    notas: 'Empresa demo — datos ficticios',
  },
];

export const clientsMap: Record<string, Client> = Object.fromEntries(
  clients.map((c) => [c.id, c])
);

export const realClients  = clients.filter(c => c.esReal === true);
export const demoClients  = clients.filter(c => c.esReal === false);
