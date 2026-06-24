import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  getAllAccountsMap, createAccount, exportToCSV, parseCSV,
  type AlegraAccount, type AccountDetail,
} from '../../lib/alegraApi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PucRow {
  code: string;
  name: string;
  type?: string;
  nature?: string;
}

type UploadStatus = 'ok' | 'exists' | 'error' | 'skip';

interface UploadResult {
  code: string;
  name: string;
  status: UploadStatus;
  msg: string;
  alegraId?: string;
}

type Phase = 'idle' | 'parsed' | 'loading_alegra' | 'uploading' | 'done';

// ─── PUC hierarchy derivation ─────────────────────────────────────────────────

function deriveAllCodes(rows: PucRow[]): PucRow[] {
  const map = new Map<string, PucRow>();
  for (const r of rows) map.set(r.code, r);

  // Derive parents: 10→8, 8→6, 6→4, 4→2, 2→(1-digit class)
  for (const r of rows) {
    let c = r.code;
    while (c.length > 2) {
      c = c.slice(0, c.length === 10 ? -2 : -2);
      if (!map.has(c)) {
        map.set(c, { code: c, name: `Grupo ${c}` });
      }
    }
    // 1-digit class
    const cls = r.code[0];
    if (!map.has(cls)) map.set(cls, { code: cls, name: `Clase ${cls}` });
  }

  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
}

function parentCode(code: string): string | null {
  if (code.length <= 2) return null;
  return code.slice(0, code.length - 2);
}

// ─── File parsers ─────────────────────────────────────────────────────────────

function parseAuxiliarPUC(buf: ArrayBuffer): PucRow[] {
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });

  // Find header row
  let headerIdx = -1;
  for (let i = 0; i < Math.min(15, raw.length); i++) {
    const joined = raw[i].map((c: any) => String(c).toUpperCase()).join('|');
    if (joined.includes('COMPROBANTE')) { headerIdx = i; break; }
  }
  if (headerIdx < 0) throw new Error('No se encontró fila de encabezados.');

  const codeMap = new Map<string, string>();
  for (let i = headerIdx + 1; i < raw.length; i++) {
    const code = String(raw[i][1] ?? '').trim();
    const name = String(raw[i][2] ?? '').trim();
    if (code && code.length >= 4 && /^\d+$/.test(code)) {
      if (!codeMap.has(code)) codeMap.set(code, name);
    }
  }
  return [...codeMap.entries()].map(([code, name]) => ({ code, name }));
}

function parseSimpleXlsx(buf: ArrayBuffer): PucRow[] {
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });
  return rows
    .map((r: any) => ({
      code:   String(r.CODIGO ?? r.codigo ?? r.CODE ?? r.code ?? '').trim(),
      name:   String(r.NOMBRE ?? r.nombre ?? r.NAME ?? r.name ?? '').trim(),
      type:   (r.TIPO ?? r.tipo ?? '').toLowerCase() || undefined,
      nature: (r.NATURALEZA ?? r.naturaleza ?? '').toLowerCase() || undefined,
    }))
    .filter((r: PucRow) => r.code && /^\d{2,}$/.test(r.code) && r.name);
}

function parseCsvPUC(text: string): PucRow[] {
  const rows = parseCSV(text);
  return rows
    .map(r => ({
      code:   (r.CODIGO ?? r.codigo ?? r.code ?? '').trim(),
      name:   (r.NOMBRE ?? r.nombre ?? r.name ?? '').trim(),
      type:   (r.TIPO ?? r.tipo ?? '').toLowerCase() || undefined,
      nature: (r.NATURALEZA ?? r.naturaleza ?? '').toLowerCase() || undefined,
    }))
    .filter((r: PucRow) => r.code && /^\d{2,}$/.test(r.code) && r.name);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PlanCuentasUploader() {
  const fileRef = useRef<HTMLInputElement>(null);

  // Alegra current state
  const [alegraAccounts, setAlegraAccounts] = useState<AlegraAccount[]>([]);
  const [alegraLoaded, setAlegraLoaded]     = useState(false);
  const [alegraLoading, setAlegraLoading]   = useState(false);
  const [lastSync, setLastSync]             = useState('');
  const [search, setSearch]                 = useState('');
  const [catalogError, setCatalogError]     = useState(false);

  // Upload state
  const [phase, setPhase]       = useState<Phase>('idle');
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed]     = useState<PucRow[]>([]);
  const [withHierarchy, setWithHierarchy] = useState<PucRow[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0, ok: 0, exists: 0, errors: 0 });
  const [results, setResults]   = useState<UploadResult[]>([]);
  const [log, setLog]           = useState<string[]>([]);
  const stopRef = useRef(false);

  const addLog = (m: string) => setLog(prev => [...prev.slice(-300), m]);

  // ── Load from Alegra ────────────────────────────────────────────────────────

  const loadFromAlegra = useCallback(async () => {
    setAlegraLoading(true); setCatalogError(false);
    try {
      const { details } = await getAllAccountsMap();
      const list = [...details.values()].sort((a, b) => a.code.localeCompare(b.code));
      // Convert to AlegraAccount shape for display
      setAlegraAccounts(list.map(d => ({
        id: d.id, code: d.code, name: d.name, type: '',
        blocked: d.blocked ? 'yes' : undefined,
      })));
      setLastSync(new Date().toLocaleTimeString('es-CO'));
      setAlegraLoaded(true);
    } catch (e: any) {
      addLog(`✗ Error cargando cuentas: ${e.message}`);
    }
    setAlegraLoading(false);
  }, []);

  // ── Parse file ──────────────────────────────────────────────────────────────

  async function handleFile(file: File) {
    setPhase('idle'); setResults([]); setLog([]); stopRef.current = false;
    try {
      addLog(`Leyendo ${file.name}…`);
      const buf = await file.arrayBuffer();
      let rows: PucRow[];

      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = new TextDecoder().decode(buf);
        rows = parseCsvPUC(text);
        addLog(`Formato CSV detectado. ${rows.length} cuentas.`);
      } else if (file.name.toLowerCase().includes('auxiliar')) {
        rows = parseAuxiliarPUC(buf);
        addLog(`Formato AUXILIAR Siigo detectado. ${rows.length} códigos PUC únicos extraídos.`);
      } else {
        rows = parseSimpleXlsx(buf);
        addLog(`Formato tabla detectado. ${rows.length} cuentas.`);
      }

      if (!rows.length) throw new Error('No se encontraron códigos PUC válidos. Columnas esperadas: CODIGO, NOMBRE');

      const hierarchy = deriveAllCodes(rows);
      setParsed(rows);
      setWithHierarchy(hierarchy);
      setFileName(file.name);
      setPhase('parsed');
      addLog(`Con jerarquía derivada: ${hierarchy.length} cuentas (padres incluidos).`);
    } catch (e: any) {
      addLog(`✗ ${e.message}`);
    }
  }

  // ── Upload to Alegra ─────────────────────────────────────────────────────────

  async function runUpload() {
    setPhase('loading_alegra'); stopRef.current = false; setResults([]);

    addLog('Cargando cuentas actuales de Alegra…');
    let codeToId: Map<string, string>;
    let details: Map<string, AccountDetail>;
    try {
      const res = await getAllAccountsMap();
      codeToId = res.codeToId;
      details = res.details;
      addLog(`✓ ${codeToId.size} cuentas en Alegra.`);
    } catch (e: any) {
      addLog(`✗ ${e.message}`); setPhase('parsed'); return;
    }

    setPhase('uploading');
    const toUpload = withHierarchy;
    const total = toUpload.length;
    setProgress({ done: 0, total, ok: 0, exists: 0, errors: 0 });
    let ok = 0, exists = 0, errors = 0;
    const allResults: UploadResult[] = [];

    for (let i = 0; i < toUpload.length; i++) {
      if (stopRef.current) break;
      const row = toUpload[i];

      // Already exists?
      if (codeToId.has(row.code)) {
        exists++;
        allResults.push({ code: row.code, name: row.name, status: 'exists', msg: 'Ya existe', alegraId: codeToId.get(row.code) });
        setProgress({ done: i + 1, total, ok, exists, errors });
        continue;
      }

      // Find parent ID
      const pCode = parentCode(row.code);
      const parentId = pCode ? codeToId.get(pCode) : undefined;

      // Top-level (1-digit) codes must already exist in Alegra
      if (!pCode && !codeToId.has(row.code)) {
        errors++;
        const msg = `Clase raíz ${row.code} no encontrada en Alegra. Configura el catálogo PUC primero.`;
        allResults.push({ code: row.code, name: row.name, status: 'error', msg });
        addLog(`  ✗ ${row.code}: ${msg}`);
        setProgress({ done: i + 1, total, ok, exists, errors });
        continue;
      }

      try {
        const acc = await createAccount({
          name: row.name, code: row.code,
          type: row.type, nature: row.nature,
          ...(parentId ? { idParent: parentId } : {}),
        });
        const newId = String(acc.id);
        codeToId.set(row.code, newId);
        details.set(row.code, { id: newId, code: row.code, name: row.name, blocked: false });
        ok++;
        allResults.push({ code: row.code, name: row.name, status: 'ok', msg: 'Creada', alegraId: newId });
        if (ok % 20 === 0) addLog(`  ✓ ${ok} cuentas creadas…`);
      } catch (e: any) {
        const msg = String(e.message ?? e);
        const isdup = msg.includes('422') || msg.toLowerCase().includes('ya existe') || msg.includes('32006');
        const isCatalogError = msg.includes('31113') || msg.toLowerCase().includes('catálogo') || msg.toLowerCase().includes('catalogo');

        if (isCatalogError) {
          setCatalogError(true);
          addLog('⚠ Catálogo PUC no configurado en Alegra. Ve a Configuración → Catálogo de cuentas.');
          // Stop — can't proceed without catalog
          setResults(allResults);
          setPhase('done');
          return;
        } else if (isdup) {
          exists++;
          allResults.push({ code: row.code, name: row.name, status: 'exists', msg: 'Ya existe' });
        } else {
          errors++;
          allResults.push({ code: row.code, name: row.name, status: 'error', msg: msg.slice(0, 120) });
          addLog(`  ✗ ${row.code}: ${msg.slice(0, 100)}`);
        }
      }
      setProgress({ done: i + 1, total, ok, exists, errors });
      if (i % 10 === 0) {
        setResults([...allResults]);
        await new Promise(r => setTimeout(r, 0));
      }
    }

    addLog(`\nFin: ✓ ${ok} creadas · = ${exists} ya existían · ✗ ${errors} errores`);
    setResults(allResults);
    setPhase('done');
    // Reload from Alegra
    loadFromAlegra();
  }

  function handleExportErrors() {
    const failed = results.filter(r => r.status === 'error');
    exportToCSV(failed.map(r => ({ codigo: r.code, nombre: r.name, estado: r.status, mensaje: r.msg })), 'cuentas-errores.csv');
  }

  function handleExportAll() {
    exportToCSV(alegraAccounts.map(a => ({ codigo: a.code ?? '', nombre: a.name, id: a.id })), 'plan-cuentas-alegra.csv');
  }

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const filteredAccounts = alegraAccounts.filter(a =>
    !search || a.code?.includes(search) || a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">

      {/* Catalog error banner */}
      {catalogError && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3">
          <span className="text-2xl shrink-0">⚙️</span>
          <div className="space-y-1">
            <p className="text-amber-300 font-semibold text-sm">Catálogo PUC no configurado en Alegra</p>
            <p className="text-cream-200/55 text-xs">
              Antes de subir el plan de cuentas, debes seleccionar el catálogo PUC en Alegra:
            </p>
            <p className="text-cream-200/55 text-xs font-mono">
              Alegra → Configuración → Contabilidad → Catálogo de cuentas → PUC
            </p>
          </div>
        </div>
      )}

      {/* Header + Sync button */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-cream-100 font-semibold">Plan de Cuentas</h3>
          <p className="text-cream-200/40 text-xs mt-0.5">
            Cuentas actuales en Alegra · Sube PUC desde Excel/CSV · Jerarquía automática
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastSync && <span className="text-cream-200/25 text-xs">Última sync: {lastSync}</span>}
          <button
            onClick={loadFromAlegra}
            disabled={alegraLoading}
            className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 hover:border-blue-500/40 text-blue-300 text-xs font-medium px-3 py-2 rounded-lg transition disabled:opacity-40"
          >
            <span className={alegraLoading ? 'animate-spin inline-block' : ''}>↺</span>
            {alegraLoading ? 'Sincronizando…' : 'Sincronizar con Alegra'}
          </button>
        </div>
      </div>

      {/* Current Alegra accounts */}
      {!alegraLoaded ? (
        <div className="bg-navy-800/40 border border-white/8 rounded-xl p-8 flex flex-col items-center gap-3 text-center">
          <span className="text-3xl">🔄</span>
          <p className="text-cream-200/50 text-sm">Carga las cuentas actuales de Alegra para ver el estado del Plan de Cuentas</p>
          <button
            onClick={loadFromAlegra}
            disabled={alegraLoading}
            className="bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-sm font-medium px-5 py-2.5 rounded-xl transition disabled:opacity-40"
          >
            {alegraLoading ? 'Cargando…' : 'Cargar Plan de Cuentas de Alegra'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Buscar por código o nombre…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-[160px] bg-navy-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-cream-100 placeholder-cream-200/25 focus:outline-none focus:border-gold-500/50"
            />
            <span className="text-cream-200/30 text-xs whitespace-nowrap">{filteredAccounts.length} cuentas</span>
            <button
              onClick={handleExportAll}
              className="text-xs border border-white/10 hover:border-gold-500/30 text-cream-200/40 hover:text-gold-300 px-3 py-1.5 rounded-lg transition"
            >
              ↓ Exportar CSV
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10 max-h-60 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-navy-900">
                <tr className="border-b border-white/10 text-cream-200/35 uppercase tracking-wider">
                  <th className="text-left px-3 py-2 w-28">Código PUC</th>
                  <th className="text-left px-3 py-2">Nombre</th>
                  <th className="text-left px-3 py-2 hidden md:table-cell w-20">ID Alegra</th>
                  <th className="text-left px-3 py-2 hidden md:table-cell w-20">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.slice(0, 400).map(a => (
                  <tr key={a.id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="px-3 py-2 font-mono text-gold-400/70">{a.code ?? <span className="text-cream-200/20">—</span>}</td>
                    <td className="px-3 py-2 text-cream-100">{a.name}</td>
                    <td className="px-3 py-2 text-cream-200/30 hidden md:table-cell">{a.id}</td>
                    <td className="px-3 py-2 hidden md:table-cell">
                      {a.blocked === 'yes'
                        ? <span className="text-amber-400/60 text-xs">bloqueada</span>
                        : <span className="text-green-400/50 text-xs">activa</span>}
                    </td>
                  </tr>
                ))}
                {filteredAccounts.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-cream-200/30">Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredAccounts.length > 400 && (
            <p className="text-cream-200/25 text-xs text-center">Mostrando 400 de {filteredAccounts.length}</p>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-white/8 pt-5 space-y-4">
        <div>
          <h4 className="text-cream-100 font-medium text-sm">Subir Plan de Cuentas</h4>
          <p className="text-cream-200/35 text-xs mt-0.5">
            Acepta: AUXILIAR.xlsx (extrae PUC) · Excel simple (CODIGO, NOMBRE) · CSV (CODIGO, NOMBRE)
          </p>
        </div>

        {/* Upload zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className="border-2 border-dashed border-white/12 hover:border-gold-500/35 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition text-center group"
        >
          <span className="text-2xl group-hover:scale-110 transition">📋</span>
          <p className="text-cream-100 text-sm">{fileName || 'Arrastra el archivo aquí o haz clic'}</p>
          <p className="text-cream-200/25 text-xs">PUC.xlsx · AUXILIAR.xlsx · puc.csv</p>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
        </div>

        {/* Preview */}
        {phase !== 'idle' && withHierarchy.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'En archivo', value: parsed.length },
              { label: 'Con jerarquía', value: withHierarchy.length },
              { label: 'Nuevas (estimado)', value: withHierarchy.filter(r => !alegraAccounts.some(a => a.code === r.code)).length },
            ].map(s => (
              <div key={s.label} className="bg-navy-800/50 border border-white/8 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-gold-300">{s.value}</p>
                <p className="text-cream-200/35 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        {phase === 'parsed' && (
          <button
            onClick={runUpload}
            className="w-full bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/30 text-gold-300 font-semibold py-3 rounded-xl transition text-sm"
          >
            Subir {withHierarchy.length} cuentas a Alegra →
          </button>
        )}

        {/* Progress */}
        {(phase === 'loading_alegra' || phase === 'uploading') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-cream-200/50">
              <span>
                {phase === 'loading_alegra'
                  ? 'Cargando plan de cuentas de Alegra…'
                  : `Subiendo… ${progress.done}/${progress.total} (${pct}%)`}
              </span>
              <button onClick={() => { stopRef.current = true; }} className="text-red-400/60 hover:text-red-400">⏹ Detener</button>
            </div>
            <div className="w-full bg-navy-900 rounded-full h-2 overflow-hidden">
              <div className="bg-gold-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex gap-4 text-xs">
              <span className="text-green-400">✓ {progress.ok} creadas</span>
              <span className="text-cream-200/35">= {progress.exists} ya existían</span>
              <span className="text-red-400">✗ {progress.errors} errores</span>
            </div>
          </div>
        )}

        {/* Done */}
        {phase === 'done' && (
          <div className="bg-navy-800/50 border border-white/10 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">{progress.errors > 0 ? '⚠️' : '✅'}</span>
            <div className="flex-1">
              <p className="text-cream-100 font-semibold text-sm">Proceso completado</p>
              <p className="text-cream-200/40 text-xs">{progress.ok} creadas · {progress.exists} ya existían · {progress.errors} errores</p>
            </div>
            <div className="flex gap-2">
              {progress.errors > 0 && (
                <button onClick={handleExportErrors}
                  className="text-xs border border-white/10 hover:border-gold-500/30 text-cream-200/40 hover:text-gold-300 px-3 py-1.5 rounded-lg transition">
                  ↓ Errores CSV
                </button>
              )}
              <button onClick={() => { setPhase('idle'); setFileName(''); setParsed([]); setWithHierarchy([]); setResults([]); setLog([]); }}
                className="text-xs border border-white/10 text-cream-200/35 hover:text-cream-100 px-3 py-1.5 rounded-lg transition">
                Nueva carga
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div className="bg-navy-900 border border-white/8 rounded-xl p-4 font-mono text-xs max-h-44 overflow-y-auto space-y-0.5">
          {log.map((l, i) => (
            <p key={i} className={
              l.startsWith('✗') || l.startsWith('  ✗') ? 'text-red-400/70' :
              l.startsWith('✓') || l.startsWith('  ✓') ? 'text-green-400/70' :
              l.startsWith('⚠') ? 'text-amber-400/70' :
              'text-cream-200/45'
            }>{l}</p>
          ))}
        </div>
      )}
    </div>
  );
}
