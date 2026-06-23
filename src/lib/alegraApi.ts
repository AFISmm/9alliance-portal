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

// Recursively flatten the nested categories tree
function flattenCategories(nodes: AlegraAccount[], depth = 0): AlegraAccount[] {
  const result: AlegraAccount[] = [];
  for (const node of nodes) {
    result.push({ ...node, _depth: depth });
    if (node.children?.length) {
      result.push(...flattenCategories(node.children, depth + 1));
    }
  }
  return result;
}

export interface AlegraAccount {
  id: string;
  name: string;
  code: string | null;
  type: string;
  balance?: number;
  description?: string;
  nature?: string;
  readOnly?: boolean;
  blocked?: string;
  categoryRule?: { id: string; key: string };
  children?: AlegraAccount[];
  _depth?: number;
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

// ── Plan de cuentas ── endpoint: /categories
export async function getAccounts(): Promise<AlegraAccount[]> {
  const data = await proxy('categories?limit=500');
  return flattenCategories(toList(data));
}

// ── Comprobantes de diario ── endpoint: /journals
export async function getJournals(limit = 50): Promise<AlegraJournal[]> {
  const data = await proxy(`journals?limit=${limit}&order_field=date&order_direction=desc`);
  return toList(data);
}

// ── Facturas de venta ── endpoint: /invoices
export async function getInvoices(limit = 50): Promise<AlegraInvoice[]> {
  const data = await proxy(`invoices?limit=${limit}&order_field=date&order_direction=desc`);
  return toList(data);
}

// ── Gastos / compras ── endpoint: /bills
export async function getExpenses(limit = 50): Promise<AlegraExpense[]> {
  const data = await proxy(`bills?limit=${limit}&order_field=date&order_direction=desc`);
  return toList(data);
}

// ── Productos / servicios ── endpoint: /items
export async function getItems(limit = 100): Promise<AlegraItem[]> {
  const data = await proxy(`items?limit=${limit}`);
  return toList(data);
}

// ── Contactos ── endpoint: /contacts
export async function getContacts(): Promise<AlegraContact[]> {
  const data = await proxy('contacts?limit=200');
  return toList(data);
}

// ── Crear comprobante de diario ── endpoint: POST /journals
export async function createJournal(payload: {
  date: string;
  description: string;
  entries: Array<{ account: { id: string }; debit: number; credit: number }>;
}): Promise<AlegraJournal> {
  return await proxy('journals', 'POST', payload);
}
