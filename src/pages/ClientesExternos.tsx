import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, X, CheckCircle, AlertCircle,
  Mail, Phone, MapPin, User, FileText,
} from 'lucide-react';
import { realClients, demoClients } from '../data/clients';
import type { Client } from '../data/clients';
import { obligaciones, obligacionesMap } from '../data/obligaciones';
import { getVencimientos } from '../lib/getVencimientos';
import { useDemo } from '../context/DemoContext';
import { useLayout } from '../context/LayoutContext';

const NAVY950 = '#0d1829';
const NAVY900 = '#1B2A4A';
const NAVY800 = '#243560';
const GOLD    = '#C9A84C';

const LOCAL_KEY = '9a_custom_clients';

function loadCustom(): Client[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]'); }
  catch { return []; }
}
function saveCustom(list: Client[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
}

function extractUltimoDigito(nit: string): string {
  const digits = nit.replace(/\D/g, '');
  return digits.slice(-1) || '0';
}

interface ExtClient extends Client {
  direccion?: string;
  emailRepresentante?: string;
}

// ── Obligation badges ─────────────────────────────────────────────────────────
const OBLIG_LABELS: Record<string, string> = {
  renta_pj:      'Renta',
  iva_bimestral: 'IVA',
  retencion:     'Retención',
  pila:          'PILA',
};

// ── Company detail panel ──────────────────────────────────────────────────────
function CompanyDetail({ company }: { company: ExtClient }) {
  const navigate = useNavigate();
  const vencimientos = useMemo(() => getVencimientos(company, obligaciones), [company]);
  const proximos = vencimientos
    .filter(v => v.estado === 'proximo' || v.estado === 'vencido')
    .sort((a, b) => (a.fechaExactaNit ?? a.fechaFin).localeCompare(b.fechaExactaNit ?? b.fechaFin))
    .slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,${NAVY950} 0%,${NAVY900} 100%)`, borderRadius: 14, padding: '20px 24px', border: `1px solid ${NAVY800}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#F8F7F4', fontFamily: 'Inter, sans-serif' }}>{company.nombre}</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: GOLD, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>NIT {company.nit}</p>
            {company.sector && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#7C8A9C' }}>{company.sector}</p>}
          </div>
          <button
            onClick={() => navigate(`/empresa/${company.id}`)}
            style={{ padding: '8px 16px', borderRadius: 9, background: `rgba(201,168,76,.1)`, border: `1px solid rgba(201,168,76,.25)`, color: GOLD, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}
          >
            Ver detalle completo →
          </button>
        </div>
      </div>

      {/* Info grid */}
      <div style={{ background: NAVY900, border: `1px solid ${NAVY800}`, borderRadius: 14, padding: '16px 20px' }}>
        <h2 style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#7C8A9C', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>Información de contacto</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {[
            { Icon: User,    label: 'Representante',     value: company.contacto },
            { Icon: Mail,    label: 'Correo empresa',     value: company.email },
            { Icon: Phone,   label: 'Teléfono',           value: company.telefono },
            ...(company.direccion     ? [{ Icon: MapPin, label: 'Dirección',       value: company.direccion }]          : []),
            ...((company as ExtClient).emailRepresentante ? [{ Icon: Mail,  label: 'Correo representante', value: (company as ExtClient).emailRepresentante! }] : []),
          ].map(({ Icon, label, value }) => value && value !== '(por confirmar)' ? (
            <div key={label}>
              <p style={{ margin: '0 0 3px', fontSize: 10.5, color: '#7C8A9C', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>{label}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Icon size={13} strokeWidth={1.75} style={{ color: '#AEBCCD', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 13, color: '#F8F7F4', fontFamily: "'DM Sans', sans-serif" }}>{value}</p>
              </div>
            </div>
          ) : null)}
        </div>
      </div>

      {/* Obligations */}
      <div style={{ background: NAVY900, border: `1px solid ${NAVY800}`, borderRadius: 14, padding: '16px 20px' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#7C8A9C', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>Obligaciones tributarias</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {company.obligaciones.map(ob => (
            <span key={ob} style={{ fontSize: 11.5, background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.25)', color: GOLD, padding: '4px 12px', borderRadius: 20, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
              {OBLIG_LABELS[ob] ?? ob.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Upcoming payments */}
      <div style={{ background: NAVY900, border: `1px solid ${NAVY800}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${NAVY800}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#7C8A9C', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>Próximos pagos</h2>
          <button onClick={() => navigate(`/empresa/${company.id}`)} style={{ fontSize: 11, color: `rgba(201,168,76,.6)`, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            Ver todos →
          </button>
        </div>
        {proximos.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <CheckCircle size={18} strokeWidth={1.75} style={{ color: '#34D399' }} />
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#7C8A9C', fontFamily: "'DM Sans', sans-serif" }}>Sin vencimientos próximos</p>
          </div>
        ) : (
          <div>
            {proximos.map((v, i) => {
              const oblig = obligacionesMap[v.obligacionId];
              const isVenc = v.estado === 'vencido';
              const fecha = v.fechaExactaLabel ?? v.rangoFechas;
              return (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < proximos.length - 1 ? `1px solid rgba(36,53,96,.5)` : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: isVenc ? '#F87171' : '#FBBF24', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#F8F7F4', fontFamily: "'DM Sans', sans-serif" }}>{oblig?.nombre ?? v.obligacionId}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#7C8A9C' }}>{v.periodo}</p>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: isVenc ? '#FCA5A5' : '#FCD34D', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>{fecha}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add company modal ─────────────────────────────────────────────────────────
interface FormData {
  nombre: string; nit: string; email: string; contacto: string;
  direccion: string; telefono: string; emailRepresentante: string;
}

function AddCompanyModal({ onClose, onSave }: { onClose: () => void; onSave: (c: Client) => void }) {
  const [form, setForm] = useState<FormData>({
    nombre: '', nit: '', email: '', contacto: '',
    direccion: '', telefono: '', emailRepresentante: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [saved, setSaved] = useState(false);

  function set(k: keyof FormData, v: string) {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: '' }));
  }

  function validate() {
    const e: Partial<FormData> = {};
    if (!form.nombre.trim())   e.nombre   = 'El nombre es obligatorio';
    if (!form.nit.trim())      e.nit      = 'El NIT es obligatorio';
    if (!form.email.trim())    e.email    = 'El correo es obligatorio';
    if (!form.contacto.trim()) e.contacto = 'El nombre del representante legal es obligatorio';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const newClient: Client & { direccion?: string; emailRepresentante?: string } = {
      id:               `custom-${Date.now()}`,
      nombre:           form.nombre.trim(),
      nit:              form.nit.trim(),
      email:            form.email.trim(),
      contacto:         form.contacto.trim(),
      telefono:         form.telefono.trim(),
      sector:           'Cliente',
      ultimoDigitoNit:  extractUltimoDigito(form.nit),
      obligaciones:     ['retencion', 'pila'],
      esReal:           true,
      ...(form.direccion.trim()          ? { direccion:           form.direccion.trim()          } : {}),
      ...(form.emailRepresentante.trim() ? { emailRepresentante:  form.emailRepresentante.trim() } : {}),
    };
    setSaved(true);
    setTimeout(() => { onSave(newClient as Client); }, 700);
  }

  const fields: { key: keyof FormData; label: string; required: boolean; type?: string; placeholder: string }[] = [
    { key: 'nombre',            label: 'Nombre de la empresa',          required: true,  placeholder: 'Ej: Empresa XYZ SAS' },
    { key: 'nit',               label: 'NIT',                           required: true,  placeholder: 'Ej: 900.123.456-7' },
    { key: 'email',             label: 'Correo electrónico de la empresa', required: true, type: 'email', placeholder: 'contacto@empresa.co' },
    { key: 'contacto',          label: 'Nombre del representante legal', required: true,  placeholder: 'Nombre completo' },
    { key: 'direccion',         label: 'Dirección',                     required: false, placeholder: 'Calle 123 #45-67, Bogotá' },
    { key: 'telefono',          label: 'Número de celular',             required: false, type: 'tel', placeholder: '+57 300 000 0000' },
    { key: 'emailRepresentante',label: 'Correo del representante legal',required: false, type: 'email', placeholder: 'representante@empresa.co' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: NAVY900, border: `1px solid ${NAVY800}`, borderRadius: 16, padding: 28, width: 500, maxHeight: '90vh', overflowY: 'auto', fontFamily: "'DM Sans', sans-serif" }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `rgba(201,168,76,.1)`, border: `1px solid rgba(201,168,76,.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={18} strokeWidth={2} style={{ color: GOLD }} />
            </div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#F8F7F4', fontFamily: 'Inter, sans-serif' }}>Agregar empresa</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7C8A9C', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
        </div>

        {saved ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircle size={40} strokeWidth={1.5} style={{ color: '#34D399', margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: 14, color: '#6EE7B7', fontWeight: 600 }}>Empresa agregada correctamente</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: '#7C8A9C' }}>Los campos marcados con <span style={{ color: '#FCA5A5' }}>*</span> son obligatorios.</p>

            {fields.map(f => (
              <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#AEBCCD', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {f.label} {f.required && <span style={{ color: '#FCA5A5' }}>*</span>}
                </label>
                <input type={f.type ?? 'text'} value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder}
                  style={{ background: NAVY950, border: `1px solid ${errors[f.key] ? 'rgba(248,113,113,.5)' : NAVY800}`, borderRadius: 9, padding: '10px 14px', color: '#F8F7F4', fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
                {errors[f.key] && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <AlertCircle size={12} style={{ color: '#F87171' }} />
                    <span style={{ fontSize: 11, color: '#FCA5A5' }}>{errors[f.key]}</span>
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="button" onClick={onClose}
                style={{ flex: 1, padding: '10px 0', borderRadius: 9, background: 'rgba(255,255,255,.05)', border: `1px solid ${NAVY800}`, color: '#AEBCCD', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit"
                style={{ flex: 2, padding: '10px 0', borderRadius: 9, background: GOLD, border: 'none', color: NAVY950, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <FileText size={14} strokeWidth={2} />
                Agregar empresa
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ClientesExternos() {
  const { isDemoMode } = useDemo();
  const { setSidebarCollapsed } = useLayout();

  const [customClients, setCustomClients] = useState<Client[]>(loadCustom);
  const [selectedId,    setSelectedId]    = useState<string | null>(null);
  const [showAdd,       setShowAdd]       = useState(false);

  const allCompanies = useMemo<ExtClient[]>(() => {
    const base = isDemoMode ? demoClients : realClients;
    return isDemoMode ? base : [...base, ...customClients] as ExtClient[];
  }, [isDemoMode, customClients]);

  // Auto-select first company on load / demo switch
  useEffect(() => {
    setSelectedId(allCompanies[0]?.id ?? null);
  }, [isDemoMode]);

  const selected = allCompanies.find(c => c.id === selectedId) ?? null;

  function handleSelect(id: string) {
    setSelectedId(id);
    setSidebarCollapsed(true);
  }

  function handleAddSave(c: Client) {
    const updated = [...customClients, c];
    setCustomClients(updated);
    saveCustom(updated);
    setShowAdd(false);
    setSelectedId(c.id);
    setSidebarCollapsed(true);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, minHeight: 'calc(100vh - 44px - 128px)' }}>

      {/* ── Sub-sidebar ── */}
      <div style={{ width: 210, flexShrink: 0, background: NAVY900, border: `1px solid ${NAVY800}`, borderRadius: 12, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, alignSelf: 'flex-start', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid ${NAVY800}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Building2 size={13} strokeWidth={1.8} style={{ color: GOLD }} />
            <h1 style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#F8F7F4', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>Empresas</h1>
          </div>
          <p style={{ margin: '5px 0 0', fontSize: 10.5, color: '#7C8A9C' }}>{allCompanies.length} empresa{allCompanies.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Company list */}
        <nav style={{ flex: 1, padding: '8px 6px', overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
          {allCompanies.map(c => {
            const active = c.id === selectedId;
            return (
              <button key={c.id} onClick={() => handleSelect(c.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '9px 10px', borderRadius: 8, border: 'none',
                  background: active ? 'rgba(201,168,76,.12)' : 'transparent',
                  cursor: 'pointer', transition: 'background 0.15s', marginBottom: 1,
                  boxShadow: active ? 'inset 0 0 0 1px rgba(201,168,76,.2)' : 'none',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,.05)'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: active ? `rgba(201,168,76,.15)` : `rgba(255,255,255,.06)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Building2 size={12} strokeWidth={1.75} style={{ color: active ? GOLD : '#7C8A9C' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: active ? 600 : 500, color: active ? GOLD : 'rgba(174,188,205,.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'DM Sans', sans-serif" }}>
                      {c.nombre}
                    </p>
                    <p style={{ margin: '1px 0 0', fontSize: 10, color: '#7C8A9C', fontFamily: "'JetBrains Mono', monospace" }}>{c.nit}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Add company button */}
        {!isDemoMode && (
          <div style={{ padding: '8px 6px 10px', borderTop: `1px solid ${NAVY800}` }}>
            <button onClick={() => setShowAdd(true)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 0', borderRadius: 8, background: `rgba(201,168,76,.08)`, border: `1px solid rgba(201,168,76,.2)`, color: GOLD, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              <Plus size={14} strokeWidth={2} />
              Agregar empresa
            </button>
          </div>
        )}
      </div>

      {/* ── Separator ── */}
      <div style={{ width: 1, background: NAVY800, flexShrink: 0 }} />

      {/* ── Content ── */}
      <div style={{ flex: 1, minWidth: 0, paddingLeft: 28 }}>
        {selected ? (
          <CompanyDetail company={selected} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12, color: '#7C8A9C', textAlign: 'center' }}>
            <Building2 size={36} strokeWidth={1} style={{ opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>Selecciona una empresa del panel izquierdo</p>
          </div>
        )}
      </div>

      {showAdd && <AddCompanyModal onClose={() => setShowAdd(false)} onSave={handleAddSave} />}
    </div>
  );
}
