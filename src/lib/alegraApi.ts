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

function toList(data: unknown): any[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.data)) return d.data;
  }
  return [];
}

export interface AlegraAccount {
  id: number;
  name: string;
  code: string;
  type: string;
  balance: number;
  description?: string;
  nature?: string;
  readOnly?: boolean;
  categoryRule?: { id: number; name: string };
}

export interface AlegraContact {
  id: number;
  name: string;
  identificationObject?: { number: string };
  email?: string;
  phonePrimary?: string;
  type?: string[];
}

export interface AlegraJournal {
  id: number;
  date: string;
  description: string;
  numberTemplate?: { fullNumber?: string };
  total: number;
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

export interface AlegraExpense {
  id: number;
  date: string;
  description?: string;
  total: number;
  status: string;
  issuer?: { name: string };
  numberTemplate?: { fullNumber?: string };
}

export interface AlegraItem {
  id: number;
  name: string;
  price: Array<{ idPriceList: number; name: string; price: number }>;
  type: string;
  status: string;
  inventory?: { quantity: number };
}

// ── Plan de cuentas ──
export async function getAccounts(): Promise<AlegraAccount[]> {
  const data = await proxy('accounting-account?limit=500');
  return toList(data);
}

// ── Comprobantes de diario ──
export async function getJournals(limit = 50): Promise<AlegraJournal[]> {
  const data = await proxy(`journal-voucher?limit=${limit}&order_field=date&order_direction=desc`);
  return toList(data);
}

// ── Facturas de venta ──
export async function getInvoices(limit = 50): Promise<AlegraInvoice[]> {
  const data = await proxy(`invoices?limit=${limit}&order_field=date&order_direction=desc`);
  return toList(data);
}

// ── Gastos / compras ──
export async function getExpenses(limit = 50): Promise<AlegraExpense[]> {
  const data = await proxy(`bill?limit=${limit}&order_field=date&order_direction=desc`);
  return toList(data);
}

// ── Productos / servicios ──
export async function getItems(limit = 100): Promise<AlegraItem[]> {
  const data = await proxy(`items?limit=${limit}`);
  return toList(data);
}

// ── Contactos ──
export async function getContacts(): Promise<AlegraContact[]> {
  const data = await proxy('contacts?limit=200');
  return toList(data);
}

// ── Crear comprobante de diario ──
export async function createJournal(payload: {
  date: string;
  description: string;
  entries: Array<{ account: { id: number }; debit: number; credit: number }>;
}): Promise<AlegraJournal> {
  return await proxy('journal-voucher', 'POST', payload);
}
