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

// ── Export to CSV ──────────────────────────────────────────────────────────────
export function exportToCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(r =>
      headers.map(h => {
        const v = r[h] ?? '';
        const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
        return `"${s.replace(/"/g, '""')}"`;
      }).join(',')
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Parse CSV file → array of objects ─────────────────────────────────────────
export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values = line.match(/("(?:[^"]|"")*"|[^,]*)/g) ?? [];
    return Object.fromEntries(
      headers.map((h, i) => [h, (values[i] ?? '').replace(/^"|"$/g, '').replace(/""/g, '"')])
    );
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────
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
  identificationObject?: { number: string; type?: string };
  email?: string;
  phonePrimary?: string;
  type?: string[];
  status?: string;
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

// ── READ ──────────────────────────────────────────────────────────────────────

export async function getAccounts(): Promise<AlegraAccount[]> {
  const data = await proxy('categories?limit=500');
  return flattenCategories(toList(data));
}

export async function getJournals(limit = 30): Promise<AlegraJournal[]> {
  const data = await proxy(`journals?limit=${limit}&order_field=date&order_direction=desc`);
  return toList(data);
}

export async function getInvoices(limit = 30): Promise<AlegraInvoice[]> {
  const data = await proxy(`invoices?limit=${limit}&order_field=date&order_direction=desc`);
  return toList(data);
}

export async function getExpenses(limit = 30): Promise<AlegraExpense[]> {
  const data = await proxy(`bills?limit=${limit}&order_field=date&order_direction=desc`);
  return toList(data);
}

export async function getItems(limit = 100): Promise<AlegraItem[]> {
  const data = await proxy(`items?limit=${limit}`);
  return toList(data);
}

export async function getContacts(): Promise<AlegraContact[]> {
  const data = await proxy('contacts?limit=200');
  return toList(data);
}

// ── WRITE ─────────────────────────────────────────────────────────────────────

export async function createJournal(payload: {
  date: string;
  description: string;
  entries: Array<{ account: { id: string }; debit: number; credit: number }>;
}): Promise<AlegraJournal> {
  return await proxy('journals', 'POST', payload);
}

export async function createContact(payload: {
  name: string;
  identification?: string;
  identificationType?: string;
  email?: string;
  phonePrimary?: string;
  type: string[];
}): Promise<AlegraContact> {
  const body: Record<string, unknown> = {
    name: payload.name,
    type: payload.type,
  };
  if (payload.identification) {
    body.identificationObject = {
      type: payload.identificationType ?? 'NIT',
      number: payload.identification,
    };
  }
  if (payload.email) body.email = payload.email;
  if (payload.phonePrimary) body.phonePrimary = payload.phonePrimary;
  return await proxy('contacts', 'POST', body);
}

export async function createItem(payload: {
  name: string;
  type: 'product' | 'service';
  price: number;
  description?: string;
}): Promise<AlegraItem> {
  return await proxy('items', 'POST', {
    name: payload.name,
    type: payload.type,
    description: payload.description ?? '',
    price: [{ idPriceList: 1, price: payload.price }],
  });
}
