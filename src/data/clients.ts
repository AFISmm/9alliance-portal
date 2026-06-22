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
}

export const clients: Client[] = [
  {
    id: 'c001',
    nombre: '9ALLIANCE SAS BIC',
    nit: '900.524.213-6',
    contacto: '',
    email: '',
    telefono: '',
    sector: 'Servicios jurídicos',
    ultimoDigitoNit: '6',
    obligaciones: ['renta_pj', 'iva_bimestral', 'retencion', 'pila'],
    fechaInicioVencimientos: '2026-06-01',
  },
  {
    id: 'c002',
    nombre: 'ILC SAS BIC',
    nit: '830.053.483-2',
    contacto: '',
    email: '',
    telefono: '',
    sector: 'Servicios',
    ultimoDigitoNit: '2',
    obligaciones: ['renta_pj', 'iva_bimestral', 'retencion', 'pila'],
    fechaInicioVencimientos: '2026-06-01',
  },
];

export const clientsMap: Record<string, Client> = Object.fromEntries(
  clients.map((c) => [c.id, c])
);
