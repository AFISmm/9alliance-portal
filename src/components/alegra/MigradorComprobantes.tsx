import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  excelSerialToISO, getAllAccountsMap, getAllContactsMap,
  createTercero, uploadJournal, exportToCSV,
  type JournalRow, type AccountDetail,
} from '../../lib/alegraApi';

interface AuxRow {
  cuenta: string;
  nit: string;
  nombre: string;
  comprobante: string;
  fecha: string;
  detalle: string;
  debito: number;
  credito: number;
}

interface JournalGroup {
  key: string;
  comprobante: string;
  fecha: string;
  rows: AuxRow[];
}

type Phase = 'idle' | 'parsed' | 'loading' | 'running' | 'done';
type ResultStatus = 'ok' | 'error' | 'skip' | 'inverted' | 'substituted';

interface Result {
  key: string;
  comprobante: string;
  fecha: string;
  status: ResultStatus;
  msg: string;
}

// ── Parser ────────────────────────────────────────────────────────────────────

// Normaliza texto: quita acentos, espacios y pasa a mayúsculas para comparar headers
function norm(s: string): string {
  return String(s).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

function parseAuxiliar(buf: ArrayBuffer): AuxRow[] {
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });

  // Busca fila de encabezados: debe tener COMPROBANTE y DEBITO(S)
  let headerIdx = -1;
  for (let i = 0; i < Math.min(15, raw.length); i++) {
    const joined = raw[i].map((c: any) => norm(String(c))).join('|');
    if (joined.includes('COMPROBANTE') && joined.includes('DEBIT')) {
      headerIdx = i; break;
    }
  }
  if (headerIdx < 0) throw new Error('No se encontró fila de encabezados (COMPROBANTE / DEBITOS). Verifica el formato del archivo.');

  // Detecta columnas dinámicamente por nombre
  const headers = raw[headerIdx].map((c: any) => norm(String(c)));
  const col = (frag: string) => headers.findIndex(h => h.includes(frag));

  const fechaCol   = col('FECHA');
  const compCol    = col('COMPROBANTE');
  const numeroCol  = col('NUMERO');
  const nitCol     = col('NIT');
  const nombreCol  = col('SOCIAL') >= 0 ? col('SOCIAL') : col('NOMBRE');
  const cuentaCol  = col('CUENTA');
  const detalleCol = col('DETALLE');
  const debitoCol  = col('DEBIT');
  const creditoCol = col('CREDIT');

  const rows: AuxRow[] = [];
  for (let i = headerIdx + 1; i < raw.length; i++) {
    const r = raw[i];

    const compType = compCol >= 0 ? String(r[compCol] ?? '').trim() : '';
    const numero   = numeroCol >= 0 ? String(r[numeroCol] ?? '').trim() : '';
    // Clave única por documento: tipo+numero (e.g. "F-003-00000001984")
    const comprobanteKey = numero ? `${compType}-${numero}` : compType;

    const fechaRaw = fechaCol >= 0 ? r[fechaCol] : r[9];
    if (!comprobanteKey || !fechaRaw) continue;

    const debito  = debitoCol  >= 0 ? parseFloat(String(r[debitoCol]  ?? '0').replace(',', '.')) || 0 : 0;
    const credito = creditoCol >= 0 ? parseFloat(String(r[creditoCol] ?? '0').replace(',', '.')) || 0 : 0;
    if (debito === 0 && credito === 0) continue;

    const fecha = typeof fechaRaw === 'number'
      ? excelSerialToISO(fechaRaw)
      : String(fechaRaw).trim();

    rows.push({
      cuenta:      cuentaCol  >= 0 ? String(r[cuentaCol]  ?? '').trim() : '',
      nit:         nitCol     >= 0 ? String(r[nitCol]      ?? '').replace(/\s+/g, '') : '',
      nombre:      nombreCol  >= 0 ? String(r[nombreCol]   ?? '').trim() : '',
      comprobante: comprobanteKey,
      fecha,
      detalle:     detalleCol >= 0 ? String(r[detalleCol]  ?? '').trim() : '',
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

// ── Balance helpers ───────────────────────────────────────────────────────────

function isBalanced(entries: JournalRow[]): boolean {
  const d = entries.reduce((s, e) => s + e.debito, 0);
  const c = entries.reduce((s, e) => s + e.credito, 0);
  return Math.abs(d - c) < 0.01 && d > 0 && c > 0;
}

function invertEntries(entries: JournalRow[]): JournalRow[] {
  return entries.map(e => ({ ...e, debito: e.credito, credito: e.debito }));
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MigradorComprobantes() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase]         = useState<Phase>('idle');
  const [fileName, setFileName]   = useState('');
  const [journals, setJournals]   = useState<JournalGroup[]>([]);
  const [uniqueNits, setUniqueNits]         = useState<Set<string>>(new Set());
  const [uniqueCuentas, setUniqueCuentas]   = useState<Set<string>>(new Set());
  const [progress, setProgress]   = useState({ done: 0, total: 0, ok: 0, errors: 0, skipped: 0, inverted: 0, substituted: 0 });
  const [results, setResults]     = useState<Result[]>([]);
  const [log, setLog]             = useState<string[]>([]);
  const stopRef = useRef(false);
  const logBuf  = useRef<string[]>([]);

  function addLog(msg: string) {
    logBuf.current = [...logBuf.current.slice(-300), msg];
    setLog([...logBuf.current]);
  }

  async function handleFile(file: File) {
    setPhase('idle'); setResults([]); setLog([]); logBuf.current = []; stopRef.current = false;
    try {
      addLog(`Leyendo ${file.name}…`);
      const buf = await file.arrayBuffer();
      const rows = parseAuxiliar(buf);
      const groups = groupByJournal(rows);
      const nits    = new Set(rows.map(r => r.nit).filter(n => n && n !== '0'));
      const cuentas = new Set(rows.map(r => r.cuenta).filter(Boolean));
      setJournals(groups);
      setUniqueNits(nits);
      setUniqueCuentas(cuentas);
      setFileName(file.name);
      setPhase('parsed');
      addLog(`OK: ${rows.length.toLocaleString('es-CO')} líneas → ${groups.length.toLocaleString('es-CO')} comprobantes · ${nits.size} NITs · ${cuentas.size} cuentas PUC`);
    } catch (e: any) { addLog(`✗ ${e.message}`); }
  }

  async function runMigration() {
    setPhase('loading'); setResults([]); stopRef.current = false;
    logBuf.current = [];

    // ── 1. Cargar cuentas ────────────────────────────────────────────────
    addLog('Cargando plan de cuentas de Alegra…');
    let codeToId: Map<string, string>;
    let accDetails: Map<string, AccountDetail>;
    try {
      const res = await getAllAccountsMap();
      codeToId   = res.codeToId;
      accDetails = res.details;
      const blocked = [...accDetails.values()].filter(a => a.blocked).length;
      addLog(`✓ ${codeToId.size} cuentas cargadas (${blocked} deshabilitadas)`);
    } catch (e: any) { addLog(`✗ ${e.message}`); setPhase('parsed'); return; }

    // ── 2. Cargar contactos ──────────────────────────────────────────────
    addLog('Cargando contactos de Alegra…');
    let contactsMap: Map<string, string>;
    try {
      contactsMap = await getAllContactsMap();
      addLog(`✓ ${contactsMap.size} contactos cargados`);
    } catch (e: any) { addLog(`✗ ${e.message}`); setPhase('parsed'); return; }

    // ── 3. Crear contactos faltantes ─────────────────────────────────────
    const nitsFaltantes = [...uniqueNits].filter(n => !contactsMap.has(n));
    if (nitsFaltantes.length > 0) {
      addLog(`Creando ${nitsFaltantes.length} contactos faltantes…`);
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
        } catch (e: any) {
          const m = String(e.message ?? '');
          if (!m.includes('422') && !m.toLowerCase().includes('ya existe')) {
            addLog(`  ✗ Contacto ${nit}: ${m}`);
          }
        }
      }
    }

    // ── 4. Migrar comprobantes ───────────────────────────────────────────
    setPhase('running');
    const total = journals.length;
    setProgress({ done: 0, total, ok: 0, errors: 0, skipped: 0, inverted: 0, substituted: 0 });
    let ok = 0, errors = 0, skipped = 0, inverted = 0, substituted = 0;
    const allResults: Result[] = [];

    for (let i = 0; i < journals.length; i++) {
      if (stopRef.current) break;
      const g = journals[i];

      // Build entries with account lookup + substitution for disabled accounts
      const entriesRaw: JournalRow[] = [];
      const missingAccounts: string[] = [];
      const substitutions: string[] = [];

      for (const r of g.rows) {
        let accCode = r.cuenta;
        let accId   = codeToId.get(accCode);

        if (!accId) {
          // Código exacto no existe (ej: 10 dígitos Siigo → truncar a 8/6/4/2)
          let truncated = accCode;
          while (truncated.length > 2) {
            truncated = truncated.length % 2 === 0
              ? truncated.slice(0, -2)
              : truncated.slice(0, -1);
            if (codeToId.has(truncated)) {
              substitutions.push(`${accCode} → ${truncated}`);
              accCode = truncated;
              accId   = codeToId.get(truncated)!;
              break;
            }
          }
          if (!accId) { missingAccounts.push(r.cuenta); continue; }
        }

        const contactId = (r.nit && r.nit !== '0') ? contactsMap.get(r.nit) : undefined;
        entriesRaw.push({ accountCode: accCode, accountId: accId, nit: r.nit, contactId, detalle: r.detalle, debito: r.debito, credito: r.credito });
      }

      // All accounts missing → skip
      if (entriesRaw.length === 0) {
        const msg = `Sin cuentas válidas${missingAccounts.length ? ` — faltantes: ${[...new Set(missingAccounts)].slice(0, 3).join(', ')}` : ''}`;
        allResults.push({ key: g.key, comprobante: g.comprobante, fecha: g.fecha, status: 'skip', msg });
        skipped++;
        setProgress({ done: i + 1, total, ok, errors, skipped, inverted, substituted });
        continue;
      }

      // Balance check
      let entries = entriesRaw;
      let wasInverted = false;

      if (!isBalanced(entries)) {
        const totalD = entries.reduce((s, e) => s + e.debito, 0);
        const totalC = entries.reduce((s, e) => s + e.credito, 0);

        if (totalD === 0 || totalC === 0) {
          // Single-sided: try inversion
          const inv = invertEntries(entries);
          if (isBalanced(inv)) {
            entries = inv;
            wasInverted = true;
          } else {
            const msg = totalD === 0
              ? 'Sin débito — inversión también falló (comprobante unilateral)'
              : 'Sin crédito — inversión también falló (comprobante unilateral)';
            allResults.push({ key: g.key, comprobante: g.comprobante, fecha: g.fecha, status: 'skip', msg });
            skipped++;
            addLog(`  ⚠ ${g.comprobante}: ${msg}`);
            setProgress({ done: i + 1, total, ok, errors, skipped, inverted, substituted });
            continue;
          }
        } else {
          // Imbalanced debits ≠ credits
          const msg = `Desbalanceado: D=${totalD.toFixed(2)} C=${totalC.toFixed(2)}`;
          allResults.push({ key: g.key, comprobante: g.comprobante, fecha: g.fecha, status: 'skip', msg });
          skipped++;
          setProgress({ done: i + 1, total, ok, errors, skipped, inverted, substituted });
          continue;
        }
      }

      // Upload
      if (i === 0) {
        addLog(`[DEBUG] ${g.comprobante} | ${g.fecha} | ${entries.length} líneas`);
        const e0 = entries[0];
        addLog(`[DEBUG] entrada[0]: accId=${e0.accountId} d=${e0.debito} c=${e0.credito} nit=${e0.nit}`);
      }
      try {
        await uploadJournal({ date: g.fecha, comprobante: g.comprobante, entries });

        let status: ResultStatus = 'ok';
        let msg = 'Creado';
        if (wasInverted && substitutions.length) { status = 'substituted'; msg = `Invertido + sustituido: ${substitutions.join(', ')}`; }
        else if (wasInverted)         { status = 'inverted';    msg = 'Invertido (débito↔crédito)'; inverted++; }
        else if (substitutions.length){ status = 'substituted'; msg = `Cuenta sustituida: ${substitutions.join(', ')}`; substituted++; }
        else ok++;

        allResults.push({ key: g.key, comprobante: g.comprobante, fecha: g.fecha, status, msg });
        if ((ok + inverted + substituted) % 25 === 0) addLog(`  ✓ ${ok + inverted + substituted} comprobantes migrados…`);
      } catch (e: any) {
        const msg = String(e.message ?? e);
        const isdup = msg.includes('422') || msg.toLowerCase().includes('ya existe') || msg.includes('32006') || msg.toLowerCase().includes('already');
        if (isdup) {
          skipped++;
          allResults.push({ key: g.key, comprobante: g.comprobante, fecha: g.fecha, status: 'skip', msg: 'Ya existe en Alegra' });
        } else {
          errors++;
          allResults.push({ key: g.key, comprobante: g.comprobante, fecha: g.fecha, status: 'error', msg });
          addLog(`  ✗ ${g.comprobante} (${g.fecha}): ${msg.slice(0, 120)}`);
        }
      }

      setProgress({ done: i + 1, total, ok, errors, skipped, inverted, substituted });
      if (i % 5 === 0) {
        setResults([...allResults]);
        await new Promise(r => setTimeout(r, 0));
      }
    }

    addLog(`\nFin: ✓ ${ok} creados · ↔ ${inverted} invertidos · ⚙ ${substituted} sustituidos · ⚠ ${skipped} omitidos · ✗ ${errors} errores`);
    setResults(allResults);
    setPhase('done');
  }

  function handleExportErrors() {
    const failed = results.filter(r => r.status !== 'ok' && r.status !== 'inverted' && r.status !== 'substituted');
    exportToCSV(failed.map(r => ({ comprobante: r.comprobante, fecha: r.fecha, estado: r.status, mensaje: r.msg })), 'migrador-errores.csv');
  }

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const successCount = progress.ok + progress.inverted + progress.substituted;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-navy-800/40 border border-white/8 rounded-xl p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-cream-100 font-semibold">Migrador de Comprobantes</h3>
            <p className="text-cream-200/40 text-xs mt-0.5">Sube un AUXILIAR .xlsx exportado de Siigo y lo migra a Alegra como comprobantes de diario</p>
          </div>
          <span className="text-2xl">📒</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs text-cream-200/50">
          <div className="bg-navy-900/50 rounded-lg p-3 space-y-1">
            <p className="font-medium text-cream-200/70">Manejo automático de</p>
            <p>↔ Comprobantes sin débito/crédito (prueba inversión)</p>
            <p>⚙ Cuentas deshabilitadas (sustituye por cuenta padre)</p>
            <p>👤 Crea contactos faltantes antes de migrar</p>
          </div>
          <div className="bg-navy-900/50 rounded-lg p-3 space-y-1">
            <p className="font-medium text-cream-200/70">Formato esperado (Siigo)</p>
            <p>Col B: CUENTA (código PUC)</p>
            <p>Col E: NIT · Col H: NOMBRE</p>
            <p>Col I: COMPROBANTE · Col J: FECHA</p>
            <p>Col P: DEBITOS · Col Q: CREDITOS</p>
          </div>
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
        <p className="text-cream-100 text-sm font-medium">{fileName || 'Arrastra AUXILIAR XXXX.xlsx aquí o haz clic'}</p>
        <p className="text-cream-200/30 text-xs">Archivos .xlsx exportados de Siigo</p>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      </div>

      {/* Preview cards */}
      {phase !== 'idle' && journals.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Comprobantes', value: journals.length },
            { label: 'NITs únicos',  value: uniqueNits.size },
            { label: 'Cuentas PUC',  value: uniqueCuentas.size },
          ].map(s => (
            <div key={s.label} className="bg-navy-800/50 border border-white/8 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gold-300">{s.value.toLocaleString('es-CO')}</p>
              <p className="text-cream-200/40 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Start */}
      {phase === 'parsed' && (
        <button onClick={runMigration}
          className="w-full bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/30 text-gold-300 font-semibold py-3 rounded-xl transition text-sm">
          Iniciar migración → {journals.length.toLocaleString('es-CO')} comprobantes a Alegra
        </button>
      )}

      {/* Progress */}
      {(phase === 'loading' || phase === 'running') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-cream-200/50">
            <span>
              {phase === 'loading'
                ? 'Cargando datos de Alegra…'
                : `Migrando… ${progress.done.toLocaleString('es-CO')} / ${progress.total.toLocaleString('es-CO')} (${pct}%)`}
            </span>
            <button onClick={() => { stopRef.current = true; }} className="text-red-400/60 hover:text-red-400 transition text-xs">⏹ Detener</button>
          </div>
          <div className="w-full bg-navy-900 rounded-full h-2.5 overflow-hidden">
            <div className="bg-gold-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex gap-4 text-xs flex-wrap">
            <span className="text-green-400">✓ {progress.ok} creados</span>
            <span className="text-blue-400">↔ {progress.inverted} invertidos</span>
            <span className="text-purple-400">⚙ {progress.substituted} sustituidos</span>
            <span className="text-amber-400">⚠ {progress.skipped} omitidos</span>
            <span className="text-red-400">✗ {progress.errors} errores</span>
          </div>
        </div>
      )}

      {/* Done */}
      {phase === 'done' && (
        <div className="bg-navy-800/50 border border-white/10 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div className="flex-1">
            <p className="text-cream-100 font-semibold text-sm">Migración completada</p>
            <p className="text-cream-200/45 text-xs mt-0.5">
              {progress.ok} creados · {progress.inverted} invertidos · {progress.substituted} sustituidos · {progress.skipped} omitidos · {progress.errors} errores
            </p>
          </div>
          <div className="flex gap-2">
            {results.some(r => r.status === 'error' || r.status === 'skip') && (
              <button onClick={handleExportErrors}
                className="text-xs border border-white/10 hover:border-gold-500/30 text-cream-200/50 hover:text-gold-300 px-3 py-1.5 rounded-lg transition">
                ↓ Informe errores
              </button>
            )}
            <button onClick={() => { setPhase('idle'); setFileName(''); setJournals([]); setResults([]); setLog([]); logBuf.current = []; }}
              className="text-xs border border-white/10 hover:border-white/20 text-cream-200/40 hover:text-cream-100 px-3 py-1.5 rounded-lg transition">
              Nueva migración
            </button>
          </div>
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div className="bg-navy-900 border border-white/8 rounded-xl p-4 font-mono text-xs max-h-52 overflow-y-auto space-y-0.5">
          {log.map((l, i) => (
            <p key={i} className={
              l.startsWith('✗') || l.startsWith('  ✗') ? 'text-red-400/70' :
              l.startsWith('✓') || l.startsWith('  ✓') ? 'text-green-400/70' :
              l.startsWith('  ⚠') || l.startsWith('⚠') ? 'text-amber-400/70' :
              'text-cream-200/45'
            }>{l}</p>
          ))}
        </div>
      )}

      {/* Results table */}
      {results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-cream-200/40 text-xs">
              {successCount} migrados · {results.filter(r => r.status === 'error' || r.status === 'skip').length} con incidencias
            </p>
            <button onClick={handleExportErrors} className="text-xs text-cream-200/30 hover:text-gold-300 transition">↓ CSV incidencias</button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10 max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-navy-900">
                <tr className="border-b border-white/10 text-cream-200/35 uppercase tracking-wider">
                  <th className="text-left px-3 py-2">Comprobante</th>
                  <th className="text-left px-3 py-2 hidden md:table-cell">Fecha</th>
                  <th className="text-left px-3 py-2">Estado</th>
                  <th className="text-left px-3 py-2">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {results.filter(r => r.status !== 'ok').slice(0, 300).map(r => (
                  <tr key={r.key} className="border-b border-white/5 hover:bg-white/2">
                    <td className="px-3 py-2 font-mono text-gold-400/70 whitespace-nowrap">{r.comprobante}</td>
                    <td className="px-3 py-2 text-cream-200/40 hidden md:table-cell whitespace-nowrap">{r.fecha}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.status === 'error'       && <span className="text-red-400">✗ Error</span>}
                      {r.status === 'skip'        && <span className="text-amber-400">⚠ Omitido</span>}
                      {r.status === 'inverted'    && <span className="text-blue-400">↔ Invertido</span>}
                      {r.status === 'substituted' && <span className="text-purple-400">⚙ Sustituido</span>}
                    </td>
                    <td className="px-3 py-2 text-cream-200/35 max-w-xs truncate">{r.msg}</td>
                  </tr>
                ))}
                {results.every(r => r.status === 'ok') && (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-green-400/50">Todos los comprobantes migrados sin incidencias</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
