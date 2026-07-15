// ── Tipos ──────────────────────────────────────────────────────────────────
export interface CompanyAlertConfig {
  habilitado: boolean;
  anticipacionDias: number[];   // días antes del vencimiento para alertar
}

export interface AccionCompliance {
  id: string;
  vencimientoId: string;
  clienteId: string;
  obligacionId: string;
  periodo: string;
  responsable: string;
  nota: string;
  timestamp: number;
}

// ── Defaults ───────────────────────────────────────────────────────────────
export const DEFAULT_ALERT_CONFIG: CompanyAlertConfig = {
  habilitado: true,
  anticipacionDias: [30, 15, 5],
};

export const DIAS_OPCIONES = [30, 15, 10, 5, 1] as const;

// ── Claves localStorage ────────────────────────────────────────────────────
const ALERT_CFG_KEY  = '9a_alert_cfg_v1';
const COMPLIANCE_KEY = '9a_compliance_v1';
const NOTIFIED_KEY   = '9a_notified_v1';

// ── Alert config ───────────────────────────────────────────────────────────
export function loadAlertConfigs(): Record<string, CompanyAlertConfig> {
  try { return JSON.parse(localStorage.getItem(ALERT_CFG_KEY) ?? '{}'); }
  catch { return {}; }
}

export function getAlertConfig(clienteId: string): CompanyAlertConfig {
  return loadAlertConfigs()[clienteId] ?? DEFAULT_ALERT_CONFIG;
}

export function saveAlertConfig(clienteId: string, cfg: CompanyAlertConfig) {
  const all = loadAlertConfigs();
  all[clienteId] = cfg;
  try { localStorage.setItem(ALERT_CFG_KEY, JSON.stringify(all)); } catch {}
}

// ── Acciones de compliance ─────────────────────────────────────────────────
export function loadComplianceActions(): AccionCompliance[] {
  try { return JSON.parse(localStorage.getItem(COMPLIANCE_KEY) ?? '[]'); }
  catch { return []; }
}

export function saveComplianceActions(actions: AccionCompliance[]) {
  try { localStorage.setItem(COMPLIANCE_KEY, JSON.stringify(actions)); } catch {}
}

export function getActionsForVencimiento(vencimientoId: string): AccionCompliance[] {
  return loadComplianceActions().filter(a => a.vencimientoId === vencimientoId);
}

// ── Dedupe de notificaciones ───────────────────────────────────────────────
// Guardamos los IDs de vencimientos ya notificados para no spamear
export function loadNotifiedIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? '[]')); }
  catch { return new Set(); }
}

export function markNotified(vencimientoId: string) {
  const ids = loadNotifiedIds();
  ids.add(vencimientoId);
  try { localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...ids])); } catch {}
}

export function clearNotifiedForVencimiento(vencimientoId: string) {
  const ids = loadNotifiedIds();
  ids.delete(vencimientoId);
  try { localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...ids])); } catch {}
}
