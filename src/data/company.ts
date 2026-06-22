export interface Company {
  razonSocial: string;
  tipo: string;
  nit: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  email: string;
  representante: string;
}

export const company: Company = {
  razonSocial: '9 Alliance',
  tipo: 'Firma de abogados',
  nit: '900.524.213-6',
  direccion: 'Calle 100 # 19-61, Oficina 802',
  ciudad: 'Bogotá D.C.',
  telefono: '(601) 743 9000',
  email: 'contacto@9alliance.co',
  representante: '',
};
