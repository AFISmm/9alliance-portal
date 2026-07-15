import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clientsMap } from '../data/clients';
import type { Responsables, Caracterizacion } from '../data/clients';
import { obligaciones, obligacionesMap } from '../data/obligaciones';
import { getVencimientos } from '../lib/getVencimientos';
import type { Estado } from '../lib/getVencimientos';
import { StatusBadge } from '../components/StatusBadge';
import { Pencil, Check, X, Bell, BellOff, ShieldCheck, Plus, ChevronDown, ChevronUp, ScrollText } from 'lucide-react';
import {
  getAlertConfig, saveAlertConfig, DIAS_OPCIONES,
  loadComplianceActions, saveComplianceActions,
  clearNotifiedForVencimiento, getLogForCliente,
} from '../data/alertConfig';
import type { AccionCompliance, LogEnvio } from '../data/alertConfig';

const META_KEY = '9a_client_meta_v1';

interface ClientMeta {
  representanteLegal?: string;
  responsables?: Responsables;
  caracterizacion?: Caracterizacion;
}

function loadMeta(): Record<string, ClientMeta> {
  try { return JSON.parse(localStorage.getItem(META_KEY) ?? '{}'); }
  catch { return {}; }
}
function saveMeta(data: Record<string, ClientMeta>) {
  try { localStorage.setItem(META_KEY, JSON.stringify(data)); } catch {}
}

const ESTADOS: Estado[] = ['pendiente', 'proximo', 'presentado', 'vencido'];

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const client = id ? clientsMap[id] : null;

  const [localEstados, setLocalEstados] = useState<Record<string, { estado: Estado; fecha: string; nota: string }>>({});

  // Responsables + caracterización — persisted in localStorage
  const allMeta = loadMeta();
  const savedMeta: ClientMeta = id ? (allMeta[id] ?? {}) : {};
  const merged: ClientMeta = {
    representanteLegal: savedMeta.representanteLegal ?? client?.representanteLegal,
    responsables: { ...client?.responsables, ...savedMeta.responsables },
    caracterizacion: { ...client?.caracterizacion, ...savedMeta.caracterizacion },
  };

  const [editingMeta, setEditingMeta] = useState(false);
  const [draftMeta, setDraftMeta] = useState<ClientMeta>({});

  function startEdit() {
    setDraftMeta(JSON.parse(JSON.stringify(merged)));
    setEditingMeta(true);
  }
  function cancelEdit() { setEditingMeta(false); setDraftMeta({}); }
  function saveDraft() {
    if (!id) return;
    const updated = { ...allMeta, [id]: draftMeta };
    saveMeta(updated);
    setEditingMeta(false);
    setDraftMeta({});
  }
  function setResp(key: keyof Responsables, val: string) {
    setDraftMeta(p => ({ ...p, responsables: { ...p.responsables, [key]: val } }));
  }
  function setCarac(key: keyof Caracterizacion, val: string | boolean) {
    setDraftMeta(p => ({ ...p, caracterizacion: { ...p.caracterizacion, [key]: val } }));
  }

  // ── Configuración de alertas ─────────────────────────────────────────────
  const [alertCfg, setAlertCfg] = useState(() => id ? getAlertConfig(id) : { habilitado: true, anticipacionDias: [30, 15, 5] });

  function toggleAlerta() {
    const next = { ...alertCfg, habilitado: !alertCfg.habilitado };
    setAlertCfg(next);
    if (id) saveAlertConfig(id, next);
  }
  function toggleDia(d: number) {
    const dias = alertCfg.anticipacionDias.includes(d)
      ? alertCfg.anticipacionDias.filter(x => x !== d)
      : [...alertCfg.anticipacionDias, d].sort((a, b) => b - a);
    const next = { ...alertCfg, anticipacionDias: dias };
    setAlertCfg(next);
    if (id) saveAlertConfig(id, next);
  }

  // ── Acciones de compliance ────────────────────────────────────────────────
  const [complianceActions, setComplianceActions] = useState<AccionCompliance[]>(() => loadComplianceActions());
  const [notifLog] = useState<LogEnvio[]>(() => id ? getLogForCliente(id) : []);
  const [expandedVenc, setExpandedVenc] = useState<string | null>(null);
  const [registeringFor, setRegisteringFor] = useState<string | null>(null);
  const [draftAccion, setDraftAccion] = useState({ responsable: '', nota: '' });

  function getActionsFor(vId: string) {
    return complianceActions.filter(a => a.vencimientoId === vId);
  }

  function saveAccion(vId: string, obligacionId: string, periodo: string) {
    if (!draftAccion.responsable.trim() || !id) return;
    const newAction: AccionCompliance = {
      id: `ac_${Date.now()}`,
      vencimientoId: vId,
      clienteId: id,
      obligacionId,
      periodo,
      responsable: draftAccion.responsable.trim(),
      nota: draftAccion.nota.trim(),
      timestamp: Date.now(),
    };
    const updated = [...complianceActions, newAction];
    setComplianceActions(updated);
    saveComplianceActions(updated);
    // Marcar como presentado automáticamente
    handleChange(vId, 'estado', 'presentado');
    // Limpiar la deduplicación para que no re-alerte
    clearNotifiedForVencimiento(vId);
    setRegisteringFor(null);
    setDraftAccion({ responsable: '', nota: '' });
  }

  const vencimientos = useMemo(() => {
    if (!client) return [];
    return getVencimientos(client, obligaciones);
  }, [client]);

  function handleChange(vId: string, field: 'estado' | 'fecha' | 'nota', value: string) {
    setLocalEstados(prev => {
      const current = prev[vId] ?? { estado: 'pendiente' as Estado, fecha: '', nota: '' };
      return { ...prev, [vId]: { ...current, [field]: value } };
    });
  }

  function downloadCSV() {
    if (!client) return;
    const header = 'Período,Obligación,Vencimiento,Estado,Fecha presentación,Nota\n';
    const rows = vencimientos.map(v => {
      const ob = obligacionesMap[v.obligacionId];
      const local = localEstados[v.id];
      return `"${v.periodo}","${ob?.nombre}","${v.rangoFechas}","${local?.estado || v.estado}","${local?.fecha || ''}","${local?.nota || ''}"`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${client.nombre.replace(/\s/g, '_')}_vencimientos.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  function handlePrint() { window.print(); }

  if (!client) {
    return (
      <div className="text-center py-20">
        <p className="text-cream-200/40 mb-4">Empresa no encontrada</p>
        <button onClick={() => navigate('/empresas')} className="text-gold-400 hover:underline text-sm">← Volver a Empresas</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-cream-100">{client.nombre}</h1>
          <p className="text-gold-400 text-sm mt-1">NIT {client.nit}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-cream-100 text-sm px-3 py-2 rounded-lg transition">
            🖨️ {t('cliente.imprimir')}
          </button>
          <button onClick={downloadCSV} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-cream-100 text-sm px-3 py-2 rounded-lg transition">
            ⬇️ {t('cliente.descargar')}
          </button>
        </div>
      </div>

      {/* Info básica */}
      <div className="bg-navy-800/50 border border-white/5 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        {client.contacto && <div><p className="text-cream-200/40 text-xs">{t('cliente.contacto')}</p><p className="text-cream-100">{client.contacto}</p></div>}
        {client.email && <div><p className="text-cream-200/40 text-xs">{t('cliente.email')}</p><p className="text-cream-100">{client.email}</p></div>}
        {client.telefono && <div><p className="text-cream-200/40 text-xs">{t('cliente.telefono')}</p><p className="text-cream-100">{client.telefono}</p></div>}
        <div><p className="text-cream-200/40 text-xs">{t('cliente.sector')}</p><p className="text-cream-100">{client.sector}</p></div>
        {client.fechaInicioVencimientos && (
          <div><p className="text-cream-200/40 text-xs">Vencimientos desde</p><p className="text-cream-100">{client.fechaInicioVencimientos}</p></div>
        )}
      </div>

      {/* Responsables y caracterización */}
      <div className="bg-navy-800/50 border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-cream-100 text-sm font-semibold">Responsables y caracterización</h2>
          {!editingMeta ? (
            <button onClick={startEdit} className="flex items-center gap-1.5 text-gold-400/60 hover:text-gold-400 text-xs transition-colors">
              <Pencil size={11} strokeWidth={2} /> Editar
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={saveDraft} className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs transition-colors">
                <Check size={12} strokeWidth={2.5} /> Guardar
              </button>
              <button onClick={cancelEdit} className="flex items-center gap-1 text-cream-200/40 hover:text-cream-100 text-xs transition-colors">
                <X size={12} strokeWidth={2} /> Cancelar
              </button>
            </div>
          )}
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Responsables */}
          <div>
            <p className="text-cream-200/40 text-[10px] font-semibold tracking-widest uppercase mb-3">Equipo responsable</p>
            <div className="space-y-2.5">
              {([
                { key: 'representanteLegal', label: 'Representante legal', top: true },
                { key: 'contador',           label: 'Contador' },
                { key: 'coordinador',        label: 'Coordinador' },
                { key: 'senior',             label: 'Contador senior' },
                { key: 'junior',             label: 'Auxiliar contable' },
                { key: 'revisorFiscal',      label: 'Revisor fiscal' },
                { key: 'representanteFiscal', label: 'Representante fiscal' },
              ] as { key: string; label: string; top?: boolean }[]).map(({ key, label, top }) => {
                const value = top
                  ? (editingMeta ? draftMeta.representanteLegal : merged.representanteLegal)
                  : (editingMeta
                    ? (draftMeta.responsables as Record<string, string> | undefined)?.[key]
                    : (merged.responsables as Record<string, string> | undefined)?.[key]);
                return (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <span className="text-cream-200/40 text-xs w-36 shrink-0">{label}</span>
                    {editingMeta ? (
                      <input
                        value={value ?? ''}
                        onChange={e => top
                          ? setDraftMeta(p => ({ ...p, representanteLegal: e.target.value }))
                          : setResp(key as keyof Responsables, e.target.value)
                        }
                        placeholder="—"
                        className="flex-1 bg-navy-900 border border-white/10 rounded px-2 py-1 text-xs text-cream-100 placeholder-cream-200/20 focus:outline-none focus:border-gold-500/40"
                      />
                    ) : (
                      <span className="text-cream-100 text-xs flex-1 text-right">{value || <span className="text-cream-200/20">—</span>}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Caracterización */}
          <div>
            <p className="text-cream-200/40 text-[10px] font-semibold tracking-widest uppercase mb-3">Caracterización</p>
            <div className="space-y-2.5">
              {/* Tipo de entidad */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-cream-200/40 text-xs w-36 shrink-0">Tipo de entidad</span>
                {editingMeta ? (
                  <select
                    value={draftMeta.caracterizacion?.tipoEntidad ?? ''}
                    onChange={e => setCarac('tipoEntidad', e.target.value)}
                    className="flex-1 bg-navy-900 border border-white/10 rounded px-2 py-1 text-xs text-cream-100 focus:outline-none focus:border-gold-500/40"
                  >
                    <option value="">—</option>
                    {['SAS', 'SAS BIC', 'SA', 'Ltda', 'ESAL', 'EP', 'Persona Natural'].map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <span className="text-cream-100 text-xs flex-1 text-right">{merged.caracterizacion?.tipoEntidad || <span className="text-cream-200/20">—</span>}</span>
                )}
              </div>
              {/* Régimen */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-cream-200/40 text-xs w-36 shrink-0">Régimen</span>
                {editingMeta ? (
                  <select
                    value={draftMeta.caracterizacion?.regimen ?? ''}
                    onChange={e => setCarac('regimen', e.target.value)}
                    className="flex-1 bg-navy-900 border border-white/10 rounded px-2 py-1 text-xs text-cream-100 focus:outline-none focus:border-gold-500/40"
                  >
                    <option value="">—</option>
                    {['Común', 'Simplificado', 'Especial', 'Simple'].map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <span className="text-cream-100 text-xs flex-1 text-right">{merged.caracterizacion?.regimen || <span className="text-cream-200/20">—</span>}</span>
                )}
              </div>
              {/* Gran contribuyente */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-cream-200/40 text-xs w-36 shrink-0">Gran contribuyente</span>
                {editingMeta ? (
                  <select
                    value={draftMeta.caracterizacion?.granContribuyente ? 'Sí' : 'No'}
                    onChange={e => setCarac('granContribuyente', e.target.value === 'Sí')}
                    className="flex-1 bg-navy-900 border border-white/10 rounded px-2 py-1 text-xs text-cream-100 focus:outline-none focus:border-gold-500/40"
                  >
                    <option>No</option><option>Sí</option>
                  </select>
                ) : (
                  <span className={`text-xs flex-1 text-right ${merged.caracterizacion?.granContribuyente ? 'text-amber-400' : 'text-cream-200/40'}`}>
                    {merged.caracterizacion?.granContribuyente ? 'Sí' : 'No'}
                  </span>
                )}
              </div>
              {/* Superintendencia */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-cream-200/40 text-xs w-36 shrink-0">Superintendencia</span>
                {editingMeta ? (
                  <input
                    value={draftMeta.caracterizacion?.superintendencia ?? ''}
                    onChange={e => setCarac('superintendencia', e.target.value)}
                    placeholder="—"
                    className="flex-1 bg-navy-900 border border-white/10 rounded px-2 py-1 text-xs text-cream-100 placeholder-cream-200/20 focus:outline-none focus:border-gold-500/40"
                  />
                ) : (
                  <span className="text-cream-100 text-xs flex-1 text-right">{merged.caracterizacion?.superintendencia || <span className="text-cream-200/20">—</span>}</span>
                )}
              </div>
              {/* Composición accionaria */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-cream-200/40 text-xs w-36 shrink-0">Comp. accionaria</span>
                {editingMeta ? (
                  <input
                    value={draftMeta.caracterizacion?.composicionAccionaria ?? ''}
                    onChange={e => setCarac('composicionAccionaria', e.target.value)}
                    placeholder="—"
                    className="flex-1 bg-navy-900 border border-white/10 rounded px-2 py-1 text-xs text-cream-100 placeholder-cream-200/20 focus:outline-none focus:border-gold-500/40"
                  />
                ) : (
                  <span className="text-cream-100 text-xs flex-1 text-right">{merged.caracterizacion?.composicionAccionaria || <span className="text-cream-200/20">—</span>}</span>
                )}
              </div>
              {/* Registro proponentes */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-cream-200/40 text-xs w-36 shrink-0">Reg. proponentes</span>
                {editingMeta ? (
                  <select
                    value={draftMeta.caracterizacion?.registroProponentes ? 'Sí' : 'No'}
                    onChange={e => setCarac('registroProponentes', e.target.value === 'Sí')}
                    className="flex-1 bg-navy-900 border border-white/10 rounded px-2 py-1 text-xs text-cream-100 focus:outline-none focus:border-gold-500/40"
                  >
                    <option>No</option><option>Sí</option>
                  </select>
                ) : (
                  <span className="text-cream-100 text-xs flex-1 text-right">{merged.caracterizacion?.registroProponentes ? 'Sí' : 'No'}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuración de alertas */}
      <div className="bg-navy-800/50 border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {alertCfg.habilitado
              ? <Bell size={14} strokeWidth={1.8} className="text-gold-400" />
              : <BellOff size={14} strokeWidth={1.8} className="text-cream-200/30" />}
            <h2 className="text-cream-100 text-sm font-semibold">Configuración de alertas</h2>
          </div>
          <button
            onClick={toggleAlerta}
            className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${
              alertCfg.habilitado
                ? 'bg-gold-500/15 text-gold-400 hover:bg-gold-500/25'
                : 'bg-white/5 text-cream-200/40 hover:bg-white/10'
            }`}>
            {alertCfg.habilitado ? 'Habilitado' : 'Deshabilitado'}
          </button>
        </div>
        {alertCfg.habilitado && (
          <div className="px-4 py-3 flex flex-wrap items-center gap-3">
            <span className="text-cream-200/40 text-xs">Alertar con anticipación de:</span>
            {DIAS_OPCIONES.map(d => {
              const active = alertCfg.anticipacionDias.includes(d);
              return (
                <button key={d} onClick={() => toggleDia(d)}
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                    active
                      ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30'
                      : 'bg-white/5 text-cream-200/30 border border-white/8 hover:bg-white/10'
                  }`}>
                  {d}d
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Obligaciones */}
      <div>
        <h2 className="text-cream-100 font-semibold mb-3">{t('cliente.vencimientos')}</h2>
        {vencimientos.length === 0 ? (
          <p className="text-cream-200/40 text-sm">{t('cliente.sinVencimientos')}</p>
        ) : (
          <div className="space-y-3">
            {vencimientos.map(v => {
              const ob = obligacionesMap[v.obligacionId];
              const local = localEstados[v.id];
              const estadoActual: Estado = (local?.estado as Estado) || v.estado;
              return (
                <div key={v.id} className="bg-navy-800/50 border border-white/5 rounded-xl p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-cream-100 font-medium">{ob?.nombre}</p>
                      <p className="text-cream-200/50 text-sm">{v.periodo}</p>
                      {v.fechaExactaLabel ? (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1.5 bg-gold-500/10 border border-gold-500/25 text-gold-300 text-xs px-2 py-0.5 rounded-full">
                            📅 Vence: {v.fechaExactaLabel}
                          </span>
                          <p className="text-cream-200/30 text-xs mt-0.5">Rango DIAN: {v.rangoFechas}</p>
                        </div>
                      ) : (
                        <p className="text-gold-300 text-xs mt-0.5">{v.rangoFechas}</p>
                      )}
                      {v.nota && <p className="text-amber-300/60 text-xs mt-1 italic">{v.nota}</p>}
                    </div>
                    <StatusBadge estado={estadoActual} size="md" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-cream-200/40 mb-1">{t('calendario.filtroEstado')}</label>
                      <select
                        value={local?.estado || v.estado}
                        onChange={e => handleChange(v.id, 'estado', e.target.value)}
                        className="w-full bg-navy-900 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-cream-100 focus:outline-none focus:border-gold-500/50"
                      >
                        {ESTADOS.map(s => <option key={s} value={s}>{t(`estado.${s}`)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-cream-200/40 mb-1">{t('cliente.fechaPresentacion')}</label>
                      <input
                        type="date"
                        value={local?.fecha || ''}
                        onChange={e => handleChange(v.id, 'fecha', e.target.value)}
                        className="w-full bg-navy-900 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-cream-100 focus:outline-none focus:border-gold-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-cream-200/40 mb-1">{t('cliente.notas')}</label>
                      <input
                        type="text"
                        placeholder="Nota interna..."
                        value={local?.nota || ''}
                        onChange={e => handleChange(v.id, 'nota', e.target.value)}
                        className="w-full bg-navy-900 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-cream-100 placeholder-cream-200/20 focus:outline-none focus:border-gold-500/50"
                      />
                    </div>
                  </div>

                  {/* ── Acciones de compliance ─────────────────────────────── */}
                  <div className="border-t border-white/5 pt-3 mt-1">
                    {/* Acciones registradas */}
                    {getActionsFor(v.id).length > 0 && (
                      <div className="mb-2">
                        <button
                          onClick={() => setExpandedVenc(expandedVenc === v.id ? null : v.id)}
                          className="flex items-center gap-1.5 text-emerald-400/80 text-xs font-semibold mb-1.5"
                        >
                          <ShieldCheck size={12} strokeWidth={2} />
                          {getActionsFor(v.id).length} acción{getActionsFor(v.id).length !== 1 ? 'es' : ''} registrada{getActionsFor(v.id).length !== 1 ? 's' : ''}
                          {expandedVenc === v.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>
                        {expandedVenc === v.id && (
                          <div className="space-y-1.5 mb-2">
                            {getActionsFor(v.id).map(a => (
                              <div key={a.id} className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-3 py-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-emerald-300 text-xs font-semibold">{a.responsable}</span>
                                  <span className="text-cream-200/30 text-[10px]">
                                    {new Date(a.timestamp).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                {a.nota && <p className="text-cream-200/55 text-xs mt-0.5">{a.nota}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Formulario registrar acción */}
                    {registeringFor === v.id ? (
                      <div className="bg-white/3 border border-white/8 rounded-lg p-3 space-y-2">
                        <p className="text-cream-200/50 text-[10px] font-semibold uppercase tracking-wide">Registrar acción ejecutada</p>
                        <input
                          placeholder="Responsable *"
                          value={draftAccion.responsable}
                          onChange={e => setDraftAccion(p => ({ ...p, responsable: e.target.value }))}
                          className="w-full bg-navy-900 border border-white/10 rounded px-2 py-1.5 text-xs text-cream-100 placeholder-cream-200/20 focus:outline-none focus:border-gold-500/40"
                        />
                        <input
                          placeholder="Nota o evidencia (opcional)"
                          value={draftAccion.nota}
                          onChange={e => setDraftAccion(p => ({ ...p, nota: e.target.value }))}
                          className="w-full bg-navy-900 border border-white/10 rounded px-2 py-1.5 text-xs text-cream-100 placeholder-cream-200/20 focus:outline-none focus:border-gold-500/40"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveAccion(v.id, v.obligacionId, v.periodo)}
                            disabled={!draftAccion.responsable.trim()}
                            className="flex items-center gap-1.5 bg-gold-500 hover:bg-gold-400 disabled:opacity-40 text-navy-900 text-xs font-bold px-3 py-1.5 rounded transition-colors"
                          >
                            <Check size={11} strokeWidth={2.5} /> Guardar y marcar como presentado
                          </button>
                          <button
                            onClick={() => { setRegisteringFor(null); setDraftAccion({ responsable: '', nota: '' }); }}
                            className="text-cream-200/40 hover:text-cream-100 text-xs px-2 py-1.5 rounded transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRegisteringFor(v.id)}
                        className="flex items-center gap-1.5 text-gold-400/60 hover:text-gold-400 text-xs transition-colors"
                      >
                        <Plus size={12} strokeWidth={2.5} /> Registrar acción ejecutada
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <p className="text-xs text-cream-200/30 border-t border-white/10 pt-3">
        ⚖️ {t('calendario.notaFechas')}
      </p>

      {/* ── Bitácora de alertas enviadas ── */}
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
          <ScrollText size={15} strokeWidth={1.7} style={{ color: '#C9A84C' }} />
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, color: '#F4F7FB', margin: 0 }}>
            Bitácora de alertas enviadas
          </h2>
          {notifLog.length > 0 && (
            <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: '#7C8A9C' }}>
              {notifLog.length} registro{notifLog.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {notifLog.length === 0 ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: '#566375', margin: 0 }}>
            Aún no se han enviado alertas para esta empresa. Cuando se detecte un vencimiento próximo o vencido, quedará registrado aquí.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
              <thead>
                <tr>
                  {['Fecha', 'Canal', 'Destinatario', 'Asunto', 'Estado'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#7C8A9C', background: 'rgba(255,255,255,.02)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {notifLog.map(entry => (
                  <tr key={entry.id}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '8px 10px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#7C8A9C', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                      {new Date(entry.timestamp).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, background: 'rgba(201,168,76,.1)', color: '#C9A84C', fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600 }}>
                        {entry.canal}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#AEBCCD', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                      {entry.destinatario}
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#F4F7FB', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,.04)' }} title={entry.asunto}>
                      {entry.asunto}
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, background: entry.estado === 'enviado' ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)', color: entry.estado === 'enviado' ? '#22c55e' : '#ef4444', fontSize: 11, fontWeight: 600 }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }} />
                        {entry.estado === 'enviado' ? 'Enviado' : 'Fallido'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
