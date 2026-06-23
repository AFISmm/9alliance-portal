// All calls go through the /api/alegra proxy so credentials stay server-side

async function proxy(endpoint: string, method = 'GET', body?: unknown) {
  const res = await fetch('/api/alegra', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, method, body }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `Alegra error ${res.status}`);
  }
  return res.json();
}

export interface AlegraAccount {
  id: number;
  name: string;
  code: string;
  type: string;
  balance: number;
  description?: string;
  nature?: string;
}

export interface AlegraContact {
  id: number;
  name: string;
  identificationObject?: { number: string };
}

export interface AlegraJournal {
  id: number;
  date: string;
  description: string;
  numberTemplate?: { fullNumber?: string };
  total: number;
  account?: { name: string; code: string };
}

export interface AlegraInvoice {
  id: number;
  date: string;
  dueDate?: string;
  numberTemplate?: { fullNumber?: string };
  status: string;
  total: number;
  balance?: number;
  client?: { name: string };
}

// Plan de cuentas
export async function getAccounts(): Promise<AlegraAccount[]> {
  const data = await proxy('accounts?limit=200');
  return Array.isArray(data) ? data : (data?.data ?? []);
}

// Comprobantes contables (diario)
export async function getJournals(limit = 50): Promise<AlegraJournal[]> {
  const data = await proxy(`journals?limit=${limit}&order_field=date&order_direction=desc`);
  return Array.isArray(data) ? data : (data?.data ?? []);
}

// Facturas / recibos
export async function getInvoices(limit = 50): Promise<AlegraInvoice[]> {
  const data = await proxy(`invoices?limit=${limit}&order_field=date&order_direction=desc`);
  return Array.isArray(data) ? data : (data?.data ?? []);
}

// Contactos (para crear comprobantes)
export async function getContacts(): Promise<AlegraContact[]> {
  const data = await proxy('contacts?limit=100');
  return Array.isArray(data) ? data : (data?.data ?? []);
}

// Crear comprobante de diario
export async function createJournal(payload: {
  date: string;
  description: string;
  entries: Array<{ account: { id: number }; debit: number; credit: number }>;
}): Promise<AlegraJournal> {
  return proxy('journals', 'POST', payload);
}
