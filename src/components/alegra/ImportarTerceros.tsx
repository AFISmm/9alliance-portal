import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  getAllContactsMap, createTercero, exportToCSV, parseCSV,
  type TerceroInput,
} from '../../lib/alegraApi';

interface TerceroRow extends TerceroInput {
  key: string;
  status?: 'ok' | 'exists' | 'error';
  msg?: string;
}

type Phase = 'idle' | 'preview' | 'checking' | 'running' | 'done';

function detectIdType(nit: string): { tipo: string; persona: string } {
  const digits = nit.replace(/[^0-9]/g, '');
  if ((digits.length === 9 || digits.length === 10) && (digits.startsWith('8') || digits.startsWith('9'))) {
    return { tipo: 'NIT', persona: 'Empresa' };
  }
  if (digits.length === 10 && digits.startsWith('1')) {
    return { tipo: 'CC', persona: 'Persona natural' };
  }
  if (digits.length <= 7) {
    return { tipo: 'CC', persona: 'Persona natural' };
  }
  return { tipo: 'CC', persona: 'Persona natural' };
}

function parseAuxiliarNits(buf: ArrayBuffer): TerceroInput[] {
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });

  // Find header row
  let headerIdx = -1;
  for (let i = 0; i < Math.min(15, raw.length); i++) {
    const joined = raw[i].map((c: any) => String(c).toUpperCase()).join('|');
    if (joined.includes('COMPROBANTE') || joined.includes('NIT')) { headerIdx = i; break; }
  }
  if (headerIdx < 0) throw new Error('Formato no reconocido. Usa un AUXILIAR de Siigo o un CSV con columnas NIT,NOMBRE.');

  const nitMap = new Map<string, string>();
  for (let i = headerIdx + 1; i < raw.length; i++) {
    const r = raw[i];
    const nit    = String(r[4] ?? '').trim().replace(/[^0-9]/g, '');
    const nombre = String(r[7] ?? '').trim();
    if (!nit || nit === '0') continue;
    if (!nitMap.has(nit)) nitMap.set(nit, nombre);
  }
  return Array.from(nitMap.entries()).map(([nit, nombre]) => ({ nit, nombre }));
}

function parseCsvOrSimpleXlsx(buf: ArrayBuffer, fileName: string): TerceroInput[] {
  if (fileName.toLowerCase().endsWith('.csv')) {
    const text = new TextDecoder().decode(buf);
    const rows = parseCSV(text);
    return rows
      .map(r => ({
        nit: (r.nit ?? r.NIT ?? r.identificacion ?? r.IDENTIFICACION ?? '').replace(/[^0-9]/g, ''),
        nombre: (r.nombre ?? r.NOMBRE ?? r.name ?? r.NAME ?? '').trim(),
      }))
      .filter(r => r.nit && r.nombre);
  }
  // xlsx: read by position (col 0 = NIT/ID, col 1 = nombre) — ignores header name variants
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });
  if (raw.length < 2) return [];
  // Skip header row (row 0), read col 0 = nit, col 1 = nombre
  return raw.slice(1)
    .map((r: any[]) => ({
      nit:    String(r[0] ?? '').replace(/[^0-9]/g, ''),
      nombre: String(r[1] ?? '').trim(),
    }))
    .filter((r: TerceroInput) => r.nit && r.nombre);
}

export function ImportarTerceros() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase]     = useState<Phase>('idle');
  const [fileName, setFileName] = useState('');
  const [terceros, setTerceros] = useState<TerceroRow[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0, ok: 0, exists: 0, errors: 0 });
  const [log, setLog]           = useState<string[]>([]);
  const [search, setSearch]     = useState('');
  const stopRef = useRef(false);
  // Manual form
  const [manualNit, setManualNit]     = useState('');
  const [manualNombre, setManualNombre] = useState('');
  const [manualSaving, setManualSaving] = useState(false);

  function addLog(m: string) { setLog(prev => [...prev.slice(-200), m]); }

  async function handleFile(file: File) {
    setPhase('idle'); setTerceros([]); setLog([]); stopRef.current = false;
    try {
      addLog(`Leyendo ${file.name}…`);
      const buf = await file.arrayBuffer();
      let parsed: TerceroInput[];
      const isAuxiliar = file.name.toLowerCase().includes('auxiliar');
      if (isAuxiliar) {
        parsed = parseAuxiliarNits(buf);
        addLog(`Formato AUXILIAR detectado. ${parsed.length} NITs únicos extraídos.`);
      } else {
        parsed = parseCsvOrSimpleXlsx(buf, file.name);
        addLog(`Formato tabla detectado. ${parsed.length} terceros.`);
      }
      if (!parsed.length) throw new Error('No se encontraron registros válidos.');
      setTerceros(parsed.map((t, i) => ({ ...t, key: `${i}-${t.nit}` })));
      setFileName(file.name);
      setPhase('preview');
    } catch (e: any) {
      addLog(`✗ ${e.message}`);
    }
  }

  async function checkExisting() {
    setPhase('checking');
    addLog('Cargando contactos existentes de Alegra…');
    try {
      const map = await getAllContactsMap();
      addLog(`✓ ${map.size} contactos en Alegra.`);
      setTerceros(prev => prev.map(t => ({
        ...t,
        status: map.has(t.nit.replace(/[^0-9]/g, '')) ? 'exists' : undefined,
        msg: map.has(t.nit.replace(/[^0-9]/g, '')) ? 'Ya existe en Alegra' : '',
      })));
      setPhase('preview');
    } catch (e: any) {
      addLog(`✗ Error: ${e.message}`); setPhase('preview');
    }
  }

  async function runImport() {
    setPhase('running');
    stopRef.current = false;
    const pending = terceros.filter(t => !t.status || t.status === 'error');
    const total = pending.length;
    setProgress({ done: 0, total, ok: 0, exists: 0, errors: 0 });
    let ok = 0, exists = 0, errors = 0;

    for (let i = 0; i < pending.length; i++) {
      if (stopRef.current) break;
      const t = pending[i];
      try {
        await createTercero({ nit: t.nit, nombre: t.nombre });
        ok++;
        setTerceros(prev => prev.map(r => r.key === t.key ? { ...r, status: 'ok', msg: 'Creado' } : r));
      } catch (e: any) {
        const msg = String(e.message ?? '');
        const isdup = msg.includes('422') || msg.toLowerCase().includes('ya existe') || msg.toLowerCase().includes('already');
        if (isdup) {
          exists++;
          setTerceros(prev => prev.map(r => r.key === t.key ? { ...r, status: 'exists', msg: 'Ya existe' } : r));
        } else {
          errors++;
          setTerceros(prev => prev.map(r => r.key === t.key ? { ...r, status: 'error', msg } : r));
          addLog(`✗ ${t.nombre} (${t.nit}): ${msg}`);
        }
      }
      setProgress({ done: i + 1, total, ok, exists, errors });
      if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
    }
    addLog(`Listo: ${ok} creados · ${exists} ya existían · ${errors} errores`);
    setPhase('done');
  }

  async function handleManualSave() {
    if (!manualNit || !manualNombre) return;
    setManualSaving(true);
    try {
      await createTercero({ nit: manualNit, nombre: manualNombre });
      addLog(`✓ Contacto creado: ${manualNombre} (${manualNit})`);
      setManualNit(''); setManualNombre('');
    } catch (e: any) {
      addLog(`✗ Error: ${e.message}`);
    }
    setManualSaving(false);
  }

  function handleExport() {
    exportToCSV(terceros.map(t => ({
      nit: t.nit, nombre: t.nombre,
      tipo: detectIdType(t.nit).tipo,
      persona: detectIdType(t.nit).persona,
      estado: t.status ?? 'pendiente',
      mensaje: t.msg ?? '',
    })), 'terceros-resultado.csv');
  }

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const filtered = terceros.filter(t =>
    !search ||
    t.nombre.toLowerCase().includes(search.toLowerCase()) ||
    t.nit.includes(search)
  );
  const nuevos   = terceros.filter(t => !t.status || t.status === 'error');
  const yaExisten = terceros.filter(t => t.status === 'exists');
  const conError  = terceros.filter(t => t.status === 'error');

  return (
    <div className="space-y-5">
      <div className="bg-navy-800/40 border border-white/8 rounded-xl p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-cream-100 font-semibold">Importar Terceros / Contactos</h3>
            <p className="text-cream-200/40 text-xs mt-0.5">Crea contactos en Alegra desde un AUXILIAR Siigo, CSV con NIT/Nombre, o manualmente</p>
          </div>
          <span className="text-2xl">👥</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs text-cream-200/50">
          <div className="bg-navy-900/60 rounded-lg p-3">
            <p className="font-medium text-cream-200/70 mb-1">Desde AUXILIAR Siigo (.xlsx)</p>
            <p>Extrae automáticamente todos los NITs únicos y sus nombres</p>
          </div>
          <div className="bg-navy-900/60 rounded-lg p-3">
            <p className="font-medium text-cream-200/70 mb-1">Desde CSV o Excel simple</p>
            <p>Columnas: <code className="text-gold-400/70">NIT, NOMBRE</code> (o nit, nombre)</p>
          </div>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        className="border-2 border-dashed border-white/15 hover:border-gold-500/40 rounded-xl p-7 flex flex-col items-center gap-2 cursor-pointer transition text-center group"
      >
        <span className="text-3xl group-hover:scale-110 transition">📂</span>
        <p className="text-cream-100 text-sm font-medium">{fileName || 'AUXILIAR.xlsx · tabla.xlsx · terceros.csv'}</p>
        <p className="text-cream-200/30 text-xs">Arrastra o haz clic para seleccionar</p>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      </div>

      {/* Manual entry */}
      <div className="border border-white/10 rounded-xl p-4">
        <p className="text-cream-200/50 text-xs font-medium mb-3">Agregar contacto manualmente</p>
        <div className="flex gap-2 flex-wrap">
          <input value={manualNit} onChange={e => setManualNit(e.target.value)} placeholder="NIT / CC"
            className="bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-cream-100 placeholder-cream-200/25 focus:outline-none focus:border-gold-500/50 w-40" />
          <input value={manualNombre} onChange={e => setManualNombre(e.target.value)} placeholder="Nombre / Razón social"
            className="bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-cream-100 placeholder-cream-200/25 focus:outline-none focus:border-gold-500/50 flex-1 min-w-[160px]" />
          <button onClick={handleManualSave} disabled={!manualNit || !manualNombre || manualSaving}
            className="bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/30 disabled:opacity-40 text-gold-300 text-sm font-medium px-4 py-2 rounded-lg transition">
            {manualSaving ? '…' : '+ Crear'}
          </button>
        </div>
        {manualNit && (
          <p className="text-cream-200/30 text-xs mt-2">
            Tipo detectado: <span className="text-gold-400/70">{detectIdType(manualNit).tipo}</span> — {detectIdType(manualNit).persona}
          </p>
        )}
      </div>

      {/* Preview */}
      {terceros.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Total',       value: terceros.length,    color: '' },
              { label: 'Nuevos',      value: nuevos.length,      color: 'text-green-400' },
              { label: 'Ya existen',  value: yaExisten.length,   color: 'text-cream-200/40' },
              { label: 'Errores',     value: conError.length,    color: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="bg-navy-800/50 border border-white/8 rounded-xl p-3 text-center">
                <p className={`text-xl font-bold ${s.color || 'text-gold-300'}`}>{s.value}</p>
                <p className="text-cream-200/35 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input type="text" placeholder="Buscar NIT o nombre…" value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-[160px] bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-cream-100 placeholder-cream-200/25 focus:outline-none focus:border-gold-500/50" />
            {phase === 'preview' && !terceros.some(t => t.status) && (
              <button onClick={checkExisting} className="text-xs border border-white/10 hover:border-blue-500/30 text-cream-200/50 hover:text-blue-300 px-3 py-1.5 rounded-lg transition">
                Verificar en Alegra
              </button>
            )}
            {phase === 'preview' && (
              <button onClick={runImport}
                className="bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/30 text-gold-300 text-sm font-medium px-4 py-2 rounded-lg transition">
                Importar {nuevos.length} nuevos →
              </button>
            )}
            {terceros.length > 0 && (
              <button onClick={handleExport} className="text-xs border border-white/10 hover:border-gold-500/30 text-cream-200/40 hover:text-gold-300 px-3 py-1.5 rounded-lg transition">
                ↓ Exportar CSV
              </button>
            )}
          </div>

          {/* Progress bar */}
          {(phase === 'running' || phase === 'checking') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-cream-200/50">
                <span>{phase === 'checking' ? 'Verificando en Alegra…' : `Importando… ${progress.done}/${progress.total}`}</span>
                <button onClick={() => { stopRef.current = true; }} className="text-red-400/60 hover:text-red-400">⏹ Detener</button>
              </div>
              <div className="w-full bg-navy-900 rounded-full h-2 overflow-hidden">
                <div className="bg-gold-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex gap-4 text-xs">
                <span className="text-green-400">✓ {progress.ok} creados</span>
                <span className="text-cream-200/40">= {progress.exists} ya existían</span>
                <span className="text-red-400">✗ {progress.errors} errores</span>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-white/10 max-h-72 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-navy-900">
                <tr className="border-b border-white/10 text-cream-200/35 uppercase tracking-wider">
                  <th className="text-left px-3 py-2 w-28">NIT / CC</th>
                  <th className="text-left px-3 py-2">Nombre</th>
                  <th className="text-left px-3 py-2 hidden md:table-cell">Tipo</th>
                  <th className="text-left px-3 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 500).map(t => (
                  <tr key={t.key} className="border-b border-white/5 hover:bg-white/2">
                    <td className="px-3 py-2 font-mono text-gold-400/70">{t.nit}</td>
                    <td className="px-3 py-2 text-cream-100">{t.nombre}</td>
                    <td className="px-3 py-2 text-cream-200/40 hidden md:table-cell">{detectIdType(t.nit).tipo}</td>
                    <td className="px-3 py-2">
                      {!t.status && <span className="text-cream-200/30">Pendiente</span>}
                      {t.status === 'ok'     && <span className="text-green-400">✓ Creado</span>}
                      {t.status === 'exists' && <span className="text-cream-200/35">= Ya existe</span>}
                      {t.status === 'error'  && <span className="text-red-400" title={t.msg}>✗ Error</span>}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-cream-200/30">Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 500 && <p className="text-cream-200/30 text-xs text-center">Mostrando 500 de {filtered.length}</p>}
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div className="bg-navy-900 border border-white/8 rounded-xl p-4 font-mono text-xs text-cream-200/50 max-h-36 overflow-y-auto space-y-0.5">
          {log.map((l, i) => <p key={i} className={l.startsWith('✗') ? 'text-red-400/70' : l.startsWith('✓') ? 'text-green-400/70' : ''}>{l}</p>)}
        </div>
      )}
    </div>
  );
}
