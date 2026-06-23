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

// ── Bulk helpers ───────────────────────────────────────────────────────────────

export function excelSerialToISO(serial: number): string {
  const date = new Date(Math.round((serial - 25569) * 86400000));
  return date.toISOString().slice(0, 10);
}

export async function getAllContactsMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let start = 0;
  const limit = 30;
  while (true) {
    const data = await proxy(`contacts?limit=${limit}&start=${start}`);
    const batch = toList(data);
    if (!batch.length) break;
    for (const c of batch) {
      const num = c.identificationObject?.number ?? c.identification ?? '';
      if (num) map.set(String(num).trim(), String(c.id));
    }
    if (batch.length < limit) break;
    start += limit;
  }
  return map;
}

export interface AccountDetail {
  id: string;
  code: string;
  name: string;
  blocked: boolean;
}

export async function getAllAccountsMap(): Promise<{
  codeToId: Map<string, string>;
  details: Map<string, AccountDetail>;
}> {
  const codeToId = new Map<string, string>();
  const details  = new Map<string, AccountDetail>();
  const data = await proxy('categories?limit=5000');
  const flat = flattenCategories(toList(data));
  for (const a of flat) {
    if (!a.code) continue;
    const code = a.code.trim();
    const blocked = !!(a.blocked || a.readOnly);
    codeToId.set(code, a.id);
    details.set(code, { id: a.id, code, name: a.name, blocked });
  }
  return { codeToId, details };
}

export function findActiveParent(code: string, details: Map<string, AccountDetail>): AccountDetail | undefined {
  let c = code;
  while (c.length > 1) {
    c = c.slice(0, -1);
    const parent = details.get(c);
    if (parent && !parent.blocked) return parent;
  }
  return undefined;
}

export interface TerceroInput {
  nit: string;
  nombre: string;
}

export async function createTercero(t: TerceroInput): Promise<AlegraContact> {
  const digits = t.nit.replace(/[^0-9]/g, '');
  const isEmpresa = digits.length >= 8 && (digits.startsWith('8') || digits.startsWith('9'));
  return proxy('contacts', 'POST', {
    name: t.nombre.trim() || digits,
    identificationObject: {
      type: isEmpresa ? 'NIT' : 'CC',
      number: digits,
    },
    kindOfPerson: isEmpresa ? 'LEGAL_ENTITY' : 'PERSON_ENTITY',
    type: ['client', 'vendor'],
  });
}

export interface JournalRow {
  accountCode: string;
  accountId?: string;
  nit: string;
  contactId?: string;
  detalle: string;
  debito: number;
  credito: number;
}

export async function uploadJournal(params: {
  date: string;
  comprobante: string;
  entries: JournalRow[];
}): Promise<AlegraJournal> {
  return proxy('journals', 'POST', {
    date: params.date,
    observations: params.comprobante,
    entries: params.entries.map(e => ({
      account: { id: e.accountId },
      debit: e.debito,
      credit: e.credito,
      description: e.detalle || params.comprobante,
      ...(e.contactId ? { contact: { id: e.contactId } } : {}),
    })),
  });
}
