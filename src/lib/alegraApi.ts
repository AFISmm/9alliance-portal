// All calls go through the /api/alegra proxy so credentials stay server-side

async function proxy(endpoint: string, method = 'GET', body?: unknown) {
  const res = await fetch('/api/alegra', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, method, body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || data?.description || `Error ${res.status} — ${endpoint}`);
  }
  return data;
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

// Plan de cuentas — Alegra usa "accounting-account" en v1 Colombia
export async function getAccounts(): Promise<AlegraAccount[]> {
  // Try the most common Alegra Colombia endpoint names
  for (const ep of ['accounting-account?limit=500', 'account?limit=500', 'accounts?limit=500']) {
    try {
      const data = await proxy(ep);
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      if (list.length > 0 || ep.startsWith('accounts')) return list;
    } catch {
      // try next endpoint
    }
  }
  return [];
}

// Comprobantes contables (diario)
export async function getJournals(limit = 50): Promise<AlegraJournal[]> {
  // Alegra Colombia: journal-voucher or journal-entry or journals
  for (const ep of [
    `journal-voucher?limit=${limit}&order_field=date&order_direction=desc`,
    `journal-entry?limit=${limit}&order_field=date&order_direction=desc`,
    `journals?limit=${limit}&order_field=date&order_direction=desc`,
  ]) {
    try {
      const data = await proxy(ep);
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      return list;
    } catch {
      // try next
    }
  }
  return [];
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
