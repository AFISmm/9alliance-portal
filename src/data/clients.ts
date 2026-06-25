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
}

export const clients: Client[] = [
  {
    id: 'c001',
    nombre: '9ALLIANCE SAS BIC',
    nit: '900.524.213-6',
    contacto: '(por confirmar)',
    email: '(por confirmar)',
    telefono: '(por confirmar)',
    sector: 'Servicios jurídicos',
    ultimoDigitoNit: '6',
    obligaciones: ['renta_pj', 'iva_bimestral', 'retencion', 'pila'],
    fechaInicioVencimientos: '2026-06-01',
    esReal: true,
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
  },
];

export const clientsMap: Record<string, Client> = Object.fromEntries(
  clients.map((c) => [c.id, c])
);

export const realClients = clients.filter(c => c.esReal);
