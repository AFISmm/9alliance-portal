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
    contacto: '(por confirmar)',
    email: '(por confirmar)',
    telefono: '(por confirmar)',
    sector: 'Servicios jurídicos',
    ultimoDigitoNit: '6',
    obligaciones: ['renta_pj', 'iva_bimestral', 'retencion', 'pila'],
    fechaInicioVencimientos: '2026-06-01',
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
  },
  {
    id: 'c003',
    nombre: 'Andina Comercial S.A.S.',
    nit: '901.234.567-3',
    contacto: 'María Restrepo',
    email: 'maria.restrepo@andinacomercial.test',
    telefono: '(601) 745 1102',
    sector: 'Comercio',
    ultimoDigitoNit: '3',
    obligaciones: ['renta_pj', 'iva_bimestral', 'retencion', 'pila'],
  },
  {
    id: 'c004',
    nombre: 'Tequendama Logística Ltda.',
    nit: '830.456.789-1',
    contacto: 'Carlos Páez',
    email: 'carlos.paez@tequendamalog.test',
    telefono: '(601) 612 8890',
    sector: 'Transporte',
    ultimoDigitoNit: '1',
    obligaciones: ['renta_pj', 'iva_bimestral', 'retencion', 'pila'],
  },
  {
    id: 'c005',
    nombre: 'Quimbaya Servicios Profesionales S.A.S.',
    nit: '901.987.654-0',
    contacto: 'Laura Gómez',
    email: 'laura.gomez@quimbayasp.test',
    telefono: '(604) 388 2274',
    sector: 'Servicios',
    ultimoDigitoNit: '0',
    obligaciones: ['renta_pj', 'iva_bimestral', 'retencion', 'pila'],
  },
  {
    id: 'c006',
    nombre: 'Pacífico Alimentos S.A.',
    nit: '800.321.654-7',
    contacto: 'Andrés Vélez',
    email: 'andres.velez@pacificoalimentos.test',
    telefono: '(602) 555 4417',
    sector: 'Alimentos',
    ultimoDigitoNit: '7',
    obligaciones: ['renta_pj', 'iva_bimestral', 'retencion', 'pila'],
  },
  {
    id: 'c007',
    nombre: 'Sabana Tech Solutions S.A.S.',
    nit: '901.555.222-9',
    contacto: 'Daniela Cruz',
    email: 'daniela.cruz@sabanatech.test',
    telefono: '(601) 901 3360',
    sector: 'Tecnología',
    ultimoDigitoNit: '9',
    obligaciones: ['renta_pj', 'iva_bimestral', 'retencion', 'pila'],
  },
];

export const clientsMap: Record<string, Client> = Object.fromEntries(
  clients.map((c) => [c.id, c])
);
