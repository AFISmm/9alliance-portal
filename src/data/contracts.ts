// ── Tipos ──────────────────────────────────────────────────────────────────
export interface Contract {
  id: string;
  clienteId: string;
  nombre: string;
  descripcion?: string;
  costCenterId?: number;
  costCenterName?: string;
  valorContrato: number;
  fechaInicio: string;
  fechaFin?: string;
  estado: 'activo' | 'finalizado' | 'suspendido';
  responsable?: string;
  observaciones?: string;
  timestamp: number;
}

const LS_KEY = '9a_contracts_v1';

// ── CRUD localStorage ──────────────────────────────────────────────────────
export function loadContracts(): Contract[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); }
  catch { return []; }
}

export function saveContracts(list: Contract[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch {}
}

export function addContract(c: Omit<Contract, 'id' | 'timestamp'>): Contract {
  const newC: Contract = { ...c, id: `ct_${Date.now()}`, timestamp: Date.now() };
  saveContracts([...loadContracts(), newC]);
  return newC;
}

export function updateContract(id: string, patch: Partial<Contract>) {
  saveContracts(loadContracts().map(c => c.id === id ? { ...c, ...patch } : c));
}

export function deleteContract(id: string) {
  saveContracts(loadContracts().filter(c => c.id !== id));
}
