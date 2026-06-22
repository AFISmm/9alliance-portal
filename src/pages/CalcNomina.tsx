import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { differenceInDays, parseISO, isValid } from 'date-fns';
import { formatCOP } from '../data/fiscalParams';

function readonlyClass() {
  return 'w-full bg-navy-950/60 border border-white/5 rounded-lg px-4 py-2.5 text-gold-300 font-semibold cursor-not-allowed';
}

function inputClass() {
  return 'w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2.5 text-cream-100 focus:outline-none focus:border-gold-500/50 transition';
}

function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 items-center py-2 border-b border-white/5 last:border-0">
      <div>
        <p className="text-sm text-cream-200/70">{label}</p>
        {hint && <p className="text-xs text-cream-200/30 mt-0.5">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function CalcNomina() {
  const { t } = useTranslation();

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin]       = useState('');
  const [salario, setSalario]         = useState('');
  const [pctSalud, setPctSalud]       = useState('4');
  const [pctPension, setPctPension]   = useState('4');
  const [copiado, setCopiado]         = useState(false);

  const dias = (() => {
    if (!fechaInicio || !fechaFin) return null;
    const ini = parseISO(fechaInicio);
    const fin = parseISO(fechaFin);
    if (!isValid(ini) || !isValid(fin) || fin < ini) return null;
    return differenceInDays(fin, ini) + 1;
  })();

  const sal   = parseFloat(salario) || 0;
  const pS    = parseFloat(pctSalud) || 0;
  const pP    = parseFloat(pctPension) || 0;

  const valSalud    = Math.round(sal * (pS / 100));
  const valPension  = Math.round(sal * (pP / 100));
  const totalDed    = valSalud + valPension;
  const neto        = sal - totalDed;

  const [copiadoText, setCopiadoText] = useState('');
  useEffect(() => { setCopiadoText(''); }, [salario, pctSalud, pctPension, fechaInicio, fechaFin]);

  function limpiar() {
    setFechaInicio(''); setFechaFin('');
    setSalario(''); setPctSalud('4'); setPctPension('4');
    setCopiado(false);
  }

  function copiarResumen() {
    const lines = [
      `Período: ${fechaInicio} al ${fechaFin}`,
      `Días devengados: ${dias ?? '-'}`,
      `Salario base: ${formatCOP(sal)}`,
      `Deducción salud (${pS}%): ${formatCOP(valSalud)}`,
      `Deducción pensión (${pP}%): ${formatCOP(valPension)}`,
      `Total deducciones: ${formatCOP(totalDed)}`,
      `Neto a pagar: ${formatCOP(neto)}`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="bg-navy-800/50 border border-white/10 rounded-xl p-5 space-y-1">
      <Row label={t('nomina.fechaInicio')}>
        <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className={inputClass()} />
      </Row>

      <Row label={t('nomina.fechaFin')}>
        <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className={inputClass()} />
      </Row>

      <Row label={t('nomina.diasDevengados')} hint={t('nomina.bloqueado')}>
        <input readOnly value={dias !== null ? dias : '—'} className={readonlyClass()} />
      </Row>

      <Row label={t('nomina.salarioBase')}>
        <input
          type="number" min="0" value={salario}
          onChange={e => setSalario(e.target.value)}
          placeholder="0"
          className={inputClass()}
        />
      </Row>

      <Row label={t('nomina.pctSalud')}>
        <input
          type="number" min="0" max="100" step="0.1" value={pctSalud}
          onChange={e => setPctSalud(e.target.value)}
          className={inputClass()}
        />
      </Row>

      <Row label={t('nomina.valorSalud')} hint={t('nomina.bloqueado')}>
        <input readOnly value={sal > 0 ? formatCOP(valSalud) : '—'} className={readonlyClass()} />
      </Row>

      <Row label={t('nomina.pctPension')}>
        <input
          type="number" min="0" max="100" step="0.1" value={pctPension}
          onChange={e => setPctPension(e.target.value)}
          className={inputClass()}
        />
      </Row>

      <Row label={t('nomina.valorPension')} hint={t('nomina.bloqueado')}>
        <input readOnly value={sal > 0 ? formatCOP(valPension) : '—'} className={readonlyClass()} />
      </Row>

      <Row label={t('nomina.totalDeducciones')} hint={t('nomina.bloqueado')}>
        <input readOnly value={sal > 0 ? formatCOP(totalDed) : '—'} className={readonlyClass()} />
      </Row>

      <div className="grid grid-cols-2 gap-4 items-center py-3">
        <p className="text-sm font-semibold text-cream-100">{t('nomina.netoAPagar')}</p>
        <div className="bg-gold-500/10 border border-gold-500/30 rounded-lg px-4 py-2.5">
          <span className="text-gold-300 font-bold text-lg">{sal > 0 ? formatCOP(neto) : '—'}</span>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={limpiar}
          className="flex-1 bg-white/8 hover:bg-white/12 text-cream-200 text-sm py-2.5 rounded-lg transition"
        >
          {t('nomina.limpiar')}
        </button>
        <button
          onClick={copiarResumen}
          disabled={sal <= 0}
          className="flex-1 bg-gold-500 hover:bg-gold-400 disabled:opacity-40 text-navy-900 font-semibold text-sm py-2.5 rounded-lg transition"
        >
          {copiado ? `✓ ${t('nomina.copiado')}` : t('nomina.copiarResumen')}
        </button>
      </div>

      <p className="text-xs text-amber-400/60 border border-amber-500/15 bg-amber-500/5 rounded-lg p-3 mt-2">
        ⚠️ {t('nomina.advertencia')}
      </p>
    </div>
  );
}
