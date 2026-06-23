import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  excelSerialToISO, getAllAccountsMap, getAllContactsMap,
  createTercero, uploadJournal, exportToCSV,
  type JournalRow,
} from '../../lib/alegraApi';

interface AuxRow {
  cuenta: string;
  nit: string;
  nombre: string;
  comprobante: string;
  fecha: string;     // ISO
  detalle: string;
  debito: number;
  credito: number;
}

interface JournalGroup {
  key: string;       // comprobante + fecha
  comprobante: string;
  fecha: string;
  rows: AuxRow[];
}

type Phase = 'idle' | 'parsed' | 'loading' | 'running' | 'done';

interface Result {
  key: string;
  comprobante: string;
  fecha: string;
  status: 'ok' | 'error' | 'skip';
  msg: string;
}

function parseAuxiliar(buf: ArrayBuffer): AuxRow[] {
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });

  // Find header row: contains "CUENTA" and "COMPROBANTE"
  let headerIdx = -1;
  for (let i = 0; i < Math.min(15, raw.length); i++) {
    const row = raw[i];
    const joined = row.map((c: any) => String(c).toUpperCase()).join('|');
    if (joined.includes('COMPROBANTE') && joined.includes('DEBITO')) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) throw new Error('No se encontró fila de encabezados (COMPROBANTE / DEBITOS). Verifica el formato del archivo.');

  const rows: AuxRow[] = [];
  for (let i = headerIdx + 1; i < raw.length; i++) {
    const r = raw[i];
    const comp = String(r[8] ?? '').trim();
    const fechaRaw = r[9];
    if (!comp || !fechaRaw) continue; // saltar encabezados de sección

    const debito  = parseFloat(String(r[15] ?? '0').replace(',', '.')) || 0;
    const credito = parseFloat(String(r[16] ?? '0').replace(',', '.')) || 0;
    if (debito === 0 && credito === 0) continue;

    const fecha = typeof fechaRaw === 'number'
      ? excelSerialToISO(fechaRaw)
      : String(fechaRaw).trim();

    rows.push({
      cuenta:      String(r[1] ?? '').trim(),
      nit:         String(r[4] ?? '').trim(),
      nombre:      String(r[7] ?? '').trim(),
      comprobante: comp,
      fecha,
      detalle:     String(r[10] ?? '').trim(),
      debito,
      credito,
    });
  }
  return rows;
}

function groupByJournal(rows: AuxRow[]): JournalGroup[] {
  const map = new Map<string, JournalGroup>();
  for (const r of rows) {
    const key = `${r.comprobante}__${r.fecha}`;
    if (!map.has(key)) map.set(key, { key, comprobante: r.comprobante, fecha: r.fecha, rows: [] });
    map.get(key)!.rows.push(r);
  }
  return Array.from(map.values());
}

export function MigradorComprobantes() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [fileName, setFileName] = useState('');
  const [journals, setJournals] = useState<JournalGroup[]>([]);
  const [_totalRows, setTotalRows]  = useState(0);
  const [uniqueNits, setUniqueNits] = useState<Set<string>>(new Set());
  const [uniqueCuentas, setUniqueCuentas] = useState<Set<string>>(new Set());
  const [progress, setProgress]     = useState({ done: 0, total: 0, ok: 0, errors: 0, skipped: 0 });
  const [results, setResults]       = useState<Result[]>([]);
  const [log, setLog]               = useState<string[]>([]);
  const stopRef = useRef(false);

  function addLog(msg: string) {
    setLog(prev => [...prev.slice(-200), msg]);
  }

  async function handleFile(file: File) {
    setPhase('idle');
    setResults([]);
    setLog([]);
    stopRef.current = false;
    try {
      addLog(`Leyendo ${file.name}…`);
      const buf = await file.arrayBuffer();
      const rows = parseAuxiliar(buf);
      const groups = groupByJournal(rows);
      const nits = new Set(rows.map(r => r.nit).filter(n => n && n !== '0'));
      const cuentas = new Set(rows.map(r => r.cuenta).filter(Boolean));
      setJournals(groups);
      setTotalRows(rows.length);
      setUniqueNits(nits);
      setUniqueCuentas(cuentas);
      setFileName(file.name);
      setPhase('parsed');
      addLog(`Listo: ${rows.length} líneas → ${groups.length} comprobantes, ${nits.size} NITs, ${cuentas.size} cuentas PUC.`);
    } catch (e: any) {
      addLog(`✗ Error al leer: ${e.message}`);
    }
  }

  async function runMigration() {
    setPhase('loading');
    setResults([]);
    stopRef.current = false;
    const newLog: string[] = [];
    const log = (m: string) => { newLog.push(m); setLog([...newLog]); };

    log('Cargando plan de cuentas de Alegra…');
    let accountsMap: Map<string, string>;
    let contactsMap: Map<string, string>;
    try {
      accountsMap = await getAllAccountsMap();
      log(`✓ ${accountsMap.size} cuentas cargadas.`);
    } catch (e: any) {
      log(`✗ Error al cargar cuentas: ${e.message}`); setPhase('parsed'); return;
    }

    log('Cargando contactos de Alegra…');
    try {
      contactsMap = await getAllContactsMap();
      log(`✓ ${contactsMap.size} contactos cargados.`);
    } catch (e: any) {
      log(`✗ Error al cargar contactos: ${e.message}`); setPhase('parsed'); return;
    }

    // Auto-crear contactos faltantes
    const nitsFaltantes = [...uniqueNits].filter(n => !contactsMap.has(n));
    if (nitsFaltantes.length > 0) {
      log(`Creando ${nitsFaltantes.length} contactos faltantes…`);
      // Build nit→nombre map
      const nitNombreMap = new Map<string, string>();
      for (const g of journals) {
        for (const r of g.rows) {
          if (r.nit && r.nit !== '0' && !nitNombreMap.has(r.nit)) nitNombreMap.set(r.nit, r.nombre);
        }
      }
      for (const nit of nitsFaltantes) {
        if (stopRef.current) break;
        const nombre = nitNombreMap.get(nit) ?? nit;
        try {
          const c = await createTercero({ nit, nombre });
          contactsMap.set(nit, String(c.id));
          log(`  ✓ Contacto creado: ${nombre} (${nit})`);
        } catch (e: any) {
          const msg = e.message ?? '';
          if (msg.includes('422') || msg.toLowerCase().includes('ya existe') || msg.toLowerCase().includes('already')) {
            log(`  = Ya existe: ${nit}`);
          } else {
            log(`  ✗ Error contacto ${nit}: ${msg}`);
          }
        }
      }
    }

    setPhase('running');
    const total = journals.length;
    setProgress({ done: 0, total, ok: 0, errors: 0, skipped: 0 });
    let ok = 0, errors = 0, skipped = 0;
    const allResults: Result[] = [];

    for (let i = 0; i < journals.length; i++) {
      if (stopRef.current) break;
      const g = journals[i];

      // Build entries
      const entries: JournalRow[] = [];
      const missingAccounts: string[] = [];
      for (const r of g.rows) {
        const accountId = accountsMap.get(r.cuenta);
        if (!accountId) { missingAccounts.push(r.cuenta); continue; }
        const contactId = (r.nit && r.nit !== '0') ? contactsMap.get(r.nit) : undefined;
        entries.push({ accountCode: r.cuenta, accountId, nit: r.nit, contactId, detalle: r.detalle, debito: r.debito, credito: r.credito });
      }

      if (missingAccounts.length > 0) {
        const msg = `Cuentas no encontradas en Alegra: ${[...new Set(missingAccounts)].join(', ')}`;
        allResults.push({ key: g.key, comprobante: g.comprobante, fecha: g.fecha, status: 'skip', msg });
        skipped++;
        log(`  ⚠ ${g.comprobante} (${g.fecha}): ${msg}`);
        setProgress({ done: i + 1, total, ok, errors, skipped });
        continue;
      }

      if (entries.length === 0) {
        allResults.push({ key: g.key, comprobante: g.comprobante, fecha: g.fecha, status: 'skip', msg: 'Sin líneas válidas' });
        skipped++;
        setProgress({ done: i + 1, total, ok, errors, skipped });
        continue;
      }

      try {
        await uploadJournal({ date: g.fecha, comprobante: g.comprobante, entries });
        allResults.push({ key: g.key, comprobante: g.comprobante, fecha: g.fecha, status: 'ok', msg: 'Creado' });
        ok++;
        if (ok % 10 === 0) log(`  ✓ ${ok} comprobantes migrados…`);
      } catch (e: any) {
        const msg = e.message ?? String(e);
        const isdup = msg.toLowerCase().includes('ya existe') || msg.includes('32006') || msg.includes('already') || msg.includes('422');
        allResults.push({
          key: g.key, comprobante: g.comprobante, fecha: g.fecha,
          status: isdup ? 'skip' : 'error',
          msg: isdup ? 'Ya existe en Alegra' : msg,
        });
        if (isdup) skipped++; else errors++;
        if (!isdup) log(`  ✗ ${g.comprobante}: ${msg}`);
      }
      setProgress({ done: i + 1, total, ok, errors, skipped });
      setResults([...allResults]);
      // Tiny delay to keep UI responsive
      if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
    }

    log(`\nMigración completa: ✓ ${ok} creados | ⚠ ${skipped} omitidos | ✗ ${errors} errores`);
    setResults(allResults);
    setPhase('done');
  }

  function handleExportErrors() {
    const failed = results.filter(r => r.status !== 'ok');
    exportToCSV(failed.map(r => ({ comprobante: r.comprobante, fecha: r.fecha, estado: r.status, mensaje: r.msg })), 'migrador-errores.csv');
  }

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="bg-navy-800/40 border border-white/8 rounded-xl p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-cream-100 font-semibold">Migrador de Comprobantes</h3>
            <p className="text-cream-200/40 text-xs mt-0.5">Sube un AUXILIAR .xlsx exportado de Siigo y lo migra a Alegra como comprobantes de diario</p>
          </div>
          <span className="text-2xl">📒</span>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-3 text-xs text-amber-200/60 space-y-0.5">
          <p className="font-medium text-amber-300">Formato esperado (exportación de Siigo)</p>
          <p>Fila 7: encabezados — CUENTA, NIT, NOMBRE, COMPROBANTE, FECHA, DETALLE, DEBITOS, CREDITOS</p>
          <p>Columnas B · E · H · I · J · K · P · Q</p>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        className="border-2 border-dashed border-white/15 hover:border-gold-500/40 rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer transition text-center group"
      >
        <span className="text-3xl group-hover:scale-110 transition">📤</span>
        <p className="text-cream-100 text-sm font-medium">{fileName || 'Arrastra el AUXILIAR aquí o haz clic'}</p>
        <p className="text-cream-200/30 text-xs">Archivos .xlsx exportados de Siigo</p>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      </div>

      {/* Preview */}
      {(phase === 'parsed' || phase === 'loading' || phase === 'running' || phase === 'done') && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Comprobantes', value: journals.length },
            { label: 'NITs únicos', value: uniqueNits.size },
            { label: 'Cuentas PUC', value: uniqueCuentas.size },
          ].map(s => (
            <div key={s.label} className="bg-navy-800/50 border border-white/8 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gold-300">{s.value.toLocaleString('es-CO')}</p>
              <p className="text-cream-200/40 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Start button */}
      {phase === 'parsed' && (
        <button onClick={runMigration}
          className="w-full bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/30 text-gold-300 font-semibold py-3 rounded-xl transition text-sm">
          Iniciar migración → {journals.length} comprobantes a Alegra
        </button>
      )}

      {/* Progress */}
      {(phase === 'loading' || phase === 'running') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-cream-200/50">
            <span>{phase === 'loading' ? 'Cargando datos de Alegra…' : `Subiendo comprobantes… ${progress.done}/${progress.total}`}</span>
            <button onClick={() => { stopRef.current = true; }} className="text-red-400/60 hover:text-red-400 transition">⏹ Detener</button>
          </div>
          <div className="w-full bg-navy-900 rounded-full h-2 overflow-hidden">
            <div className="bg-gold-500 h-2 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex gap-4 text-xs">
            <span className="text-green-400">✓ {progress.ok}</span>
            <span className="text-amber-400">⚠ {progress.skipped}</span>
            <span className="text-red-400">✗ {progress.errors}</span>
          </div>
        </div>
      )}

      {/* Done summary */}
      {phase === 'done' && (
        <div className="flex items-center gap-3 bg-navy-800/50 border border-white/10 rounded-xl p-4">
          <span className="text-2xl">✅</span>
          <div className="flex-1">
            <p className="text-cream-100 font-semibold text-sm">Migración completada</p>
            <p className="text-cream-200/50 text-xs mt-0.5">
              {progress.ok} creados · {progress.skipped} omitidos · {progress.errors} errores
            </p>
          </div>
          {results.some(r => r.status !== 'ok') && (
            <button onClick={handleExportErrors}
              className="text-xs border border-white/10 hover:border-gold-500/30 text-cream-200/50 hover:text-gold-300 px-3 py-1.5 rounded-lg transition">
              ↓ Informe errores
            </button>
          )}
          <button onClick={() => { setPhase('idle'); setFileName(''); setJournals([]); setResults([]); setLog([]); }}
            className="text-xs border border-white/10 hover:border-white/20 text-cream-200/40 hover:text-cream-100 px-3 py-1.5 rounded-lg transition">
            Nueva migración
          </button>
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div className="bg-navy-900 border border-white/8 rounded-xl p-4 font-mono text-xs text-cream-200/55 max-h-48 overflow-y-auto space-y-0.5">
          {log.map((l, i) => <p key={i} className={l.startsWith('✗') ? 'text-red-400/70' : l.startsWith('✓') ? 'text-green-400/70' : ''}>{l}</p>)}
        </div>
      )}

      {/* Results table */}
      {results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-cream-200/40 text-xs">Resultados ({results.length})</p>
            <button onClick={handleExportErrors} className="text-xs text-cream-200/30 hover:text-gold-300 transition">↓ CSV errores</button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10 max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-navy-900">
                <tr className="border-b border-white/10 text-cream-200/35 uppercase tracking-wider">
                  <th className="text-left px-3 py-2">Comprobante</th>
                  <th className="text-left px-3 py-2">Fecha</th>
                  <th className="text-left px-3 py-2">Estado</th>
                  <th className="text-left px-3 py-2">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {results.filter(r => r.status !== 'ok').slice(0, 200).map(r => (
                  <tr key={r.key} className="border-b border-white/5">
                    <td className="px-3 py-2 font-mono text-gold-400/70">{r.comprobante}</td>
                    <td className="px-3 py-2 text-cream-200/50">{r.fecha}</td>
                    <td className="px-3 py-2">
                      <span className={r.status === 'error' ? 'text-red-400' : 'text-amber-400'}>
                        {r.status === 'error' ? '✗ Error' : '⚠ Omitido'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-cream-200/40 max-w-xs truncate">{r.msg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
