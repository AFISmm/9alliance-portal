import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { differenceInDays, parseISO, isValid, format } from 'date-fns';
import { es } from 'date-fns/locale';
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

interface AprobacionModal {
  empleadoNombre: string;
  empleadoEmail: string;
  aprobadorEmail: string;
}

export default function CalcNomina() {
  const { t } = useTranslation();

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin]       = useState('');
  const [salario, setSalario]         = useState('');
  const [pctSalud, setPctSalud]       = useState('4');
  const [pctPension, setPctPension]   = useState('4');
  const [copiado, setCopiado]         = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [enviado, setEnviado]         = useState(false);
  const [form, setForm]               = useState<AprobacionModal>({
    empleadoNombre: '',
    empleadoEmail: '',
    aprobadorEmail: '',
  });

  const dias = (() => {
    if (!fechaInicio || !fechaFin) return null;
    const ini = parseISO(fechaInicio);
    const fin = parseISO(fechaFin);
    if (!isValid(ini) || !isValid(fin) || fin < ini) return null;
    return differenceInDays(fin, ini) + 1;
  })();

  const sal  = parseFloat(salario) || 0;
  const pS   = parseFloat(pctSalud) || 0;
  const pP   = parseFloat(pctPension) || 0;

  const valSalud   = Math.round(sal * (pS / 100));
  const valPension = Math.round(sal * (pP / 100));
  const totalDed   = valSalud + valPension;
  const neto       = sal - totalDed;

  const periodoTexto = fechaInicio && fechaFin
    ? `${format(parseISO(fechaInicio), "d 'de' MMMM yyyy", { locale: es })} al ${format(parseISO(fechaFin), "d 'de' MMMM yyyy", { locale: es })}`
    : '—';

  function limpiar() {
    setFechaInicio(''); setFechaFin('');
    setSalario(''); setPctSalud('4'); setPctPension('4');
    setCopiado(false); setEnviado(false);
  }

  function copiarResumen() {
    const lines = [
      `Período: ${periodoTexto}`,
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

  function enviarAprobacion() {
    const { empleadoNombre, empleadoEmail, aprobadorEmail } = form;
    if (!aprobadorEmail) return;

    const resumen = [
      `Empleado: ${empleadoNombre || '(sin nombre)'}`,
      `Período: ${periodoTexto}`,
      `Días devengados: ${dias ?? '-'}`,
      `Salario base: ${formatCOP(sal)}`,
      `Deducción salud (${pS}%): ${formatCOP(valSalud)}`,
      `Deducción pensión (${pP}%): ${formatCOP(valPension)}`,
      `Total deducciones: ${formatCOP(totalDed)}`,
      `Neto a pagar: ${formatCOP(neto)}`,
    ].join('\n');

    const subject = encodeURIComponent(
      `Nómina para aprobación — ${empleadoNombre || 'empleado'} — Período ${periodoTexto}`
    );
    const body = encodeURIComponent(
      `Estimado/a aprobador/a,\n\nSe ha calculado la siguiente nómina y requiere su aprobación:\n\n${resumen}\n\n` +
      `Por favor confirme su aprobación respondiendo este correo.\n\n` +
      `Este cálculo fue generado desde el Portal Administrativo 9 Alliance.\n\n` +
      `⚠️ Este cálculo es informativo. Verifique con el contador las deducciones aplicables.`
    );

    const cc = empleadoEmail ? `&cc=${encodeURIComponent(empleadoEmail)}` : '';
    window.open(`mailto:${aprobadorEmail}${cc}?subject=${subject}&body=${body}`);

    setEnviado(true);
    setShowModal(false);
  }

  return (
    <>
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
            className="bg-white/8 hover:bg-white/12 text-cream-200 text-sm py-2.5 px-4 rounded-lg transition"
          >
            {t('nomina.limpiar')}
          </button>
          <button
            onClick={copiarResumen}
            disabled={sal <= 0}
            className="flex-1 bg-gold-500/20 hover:bg-gold-500/30 disabled:opacity-40 text-gold-300 font-semibold text-sm py-2.5 rounded-lg transition border border-gold-500/30"
          >
            {copiado ? `✓ ${t('nomina.copiado')}` : t('nomina.copiarResumen')}
          </button>
          <button
            onClick={() => setShowModal(true)}
            disabled={sal <= 0}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-sm py-2.5 rounded-lg transition"
          >
            {enviado ? '✓ Enviado' : 'Enviar para aprobación'}
          </button>
        </div>

        <p className="text-xs text-amber-400/60 border border-amber-500/15 bg-amber-500/5 rounded-lg p-3 mt-2">
          ⚠️ {t('nomina.advertencia')}
        </p>
      </div>

      {/* Modal enviar para aprobación */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-navy-800 border border-white/15 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-white/10">
              <h2 className="text-cream-100 font-semibold text-lg">Enviar para aprobación</h2>
              <p className="text-cream-200/50 text-sm mt-1">
                Se abrirá tu cliente de correo con el resumen de la nómina listo para enviar.
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-cream-200/60 mb-1">Nombre del empleado</label>
                <input
                  type="text"
                  value={form.empleadoNombre}
                  onChange={e => setForm(f => ({ ...f, empleadoNombre: e.target.value }))}
                  placeholder="Ej: Juan Pérez"
                  className={inputClass()}
                />
              </div>
              <div>
                <label className="block text-sm text-cream-200/60 mb-1">Correo del empleado <span className="text-cream-200/30">(recibirá copia)</span></label>
                <input
                  type="email"
                  value={form.empleadoEmail}
                  onChange={e => setForm(f => ({ ...f, empleadoEmail: e.target.value }))}
                  placeholder="empleado@empresa.com"
                  className={inputClass()}
                />
              </div>
              <div>
                <label className="block text-sm text-cream-200/60 mb-1">Correo del aprobador <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  value={form.aprobadorEmail}
                  onChange={e => setForm(f => ({ ...f, aprobadorEmail: e.target.value }))}
                  placeholder="aprobador@empresa.com"
                  className={inputClass()}
                  required
                />
              </div>

              <div className="bg-navy-900 rounded-lg p-3 text-xs text-cream-200/40 space-y-0.5">
                <p>Período: {periodoTexto}</p>
                <p>Salario: {formatCOP(sal)} · Neto a pagar: <span className="text-gold-400 font-semibold">{formatCOP(neto)}</span></p>
              </div>
            </div>

            <div className="p-5 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-white/8 hover:bg-white/12 text-cream-200 text-sm py-2.5 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={enviarAprobacion}
                disabled={!form.aprobadorEmail}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-sm py-2.5 rounded-lg transition"
              >
                Enviar →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
