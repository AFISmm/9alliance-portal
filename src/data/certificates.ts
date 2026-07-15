export interface CertificateRequest {
  id: string;
  tipo: string;
  empleado: string;
  fechaSolicitud: string; // ISO date
  estado: 'solicitado' | 'en_proceso' | 'entregado';
  timestamp: number;
}

const LS_KEY = '9a_certificates_v1';

export function loadCertificates(): CertificateRequest[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); }
  catch { return []; }
}

export function saveCertificates(list: CertificateRequest[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch {}
}

export function addCertificateRequest(tipo: string, empleado: string): CertificateRequest {
  const list = loadCertificates();
  const entry: CertificateRequest = {
    id: `cert_${Date.now()}`,
    tipo,
    empleado,
    fechaSolicitud: new Date().toISOString().slice(0, 10),
    estado: 'solicitado',
    timestamp: Date.now(),
  };
  saveCertificates([entry, ...list]);
  return entry;
}

export function updateCertificateStatus(id: string, estado: CertificateRequest['estado']) {
  saveCertificates(loadCertificates().map(c => c.id === id ? { ...c, estado } : c));
}
