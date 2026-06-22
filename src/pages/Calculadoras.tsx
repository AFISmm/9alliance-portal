import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UVT_2026, IVA_TASA_GENERAL, TARIFAS_RENTA, TARIFAS_ICA_BOGOTA, formatCOP } from '../data/fiscalParams';
import CalcNomina from './CalcNomina';

type MainTab = 'tributaria' | 'nomina';
type SubTab  = 'renta' | 'iva' | 'ica';

export default function Calculadoras() {
  const { t } = useTranslation();

  const [mainTab, setMainTab] = useState<MainTab>('tributaria');
  const [subTab, setSubTab]   = useState<SubTab>('renta');

  const [base, setBase]             = useState('');
  const [conceptoIdx, setConceptoIdx] = useState(0);
  const [icaIdx, setIcaIdx]         = useState(0);
  const [resultado, setResultado]   = useState<{ retener: number; neto: number } | null>(null);
  const [copiado, setCopiado]       = useState(false);

  function calcular() {
    const b = parseFloat(base.replace(/\./g, '').replace(',', '.'));
    if (isNaN(b) || b <= 0) return;
    let retener = 0;
    if (subTab === 'renta') {
      const cfg = TARIFAS_RENTA[conceptoIdx];
      if (b < cfg.baseUvt * UVT_2026) { setResultado({ retener: 0, neto: b }); return; }
      retener = b * (cfg.tarifaPct / 100);
    } else if (subTab === 'iva') {
      retener = b * (IVA_TASA_GENERAL / 100) * 0.15;
    } else {
      retener = b * (TARIFAS_ICA_BOGOTA[icaIdx].tarifaXmil / 1000);
    }
    setResultado({ retener: Math.round(retener), neto: Math.round(b - retener) });
  }

  function copiar() {
    if (!resultado) return;
    navigator.clipboard.writeText(
      `Base: ${formatCOP(parseFloat(base))} | Retención: ${formatCOP(resultado.retener)} | Neto: ${formatCOP(resultado.neto)}`
    );
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  const subTabs: { key: SubTab; label: string }[] = [
    { key: 'renta', label: t('calculadoras.retRenta') },
    { key: 'iva',   label: t('calculadoras.retIva') },
    { key: 'ica',   label: t('calculadoras.retIca') },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-cream-100">{t('calculadoras.titulo')}</h1>

      {/* Pestañas principales */}
      <div className="flex gap-3">
        {(['tributaria', 'nomina'] as MainTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setMainTab(tab)}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition
              ${mainTab === tab
                ? 'bg-gold-500 border-gold-500 text-navy-900'
                : 'bg-navy-800/50 border-white/10 text-cream-200/70 hover:border-gold-500/40 hover:text-cream-100'
              }`}
          >
            {t(tab === 'tributaria' ? 'calculadoras.tributaria' : 'calculadoras.nominaLabel')}
          </button>
        ))}
      </div>

      {/* Calculadora Tributaria */}
      {mainTab === 'tributaria' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {subTabs.map(st => (
              <button
                key={st.key}
                onClick={() => { setSubTab(st.key); setResultado(null); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition
                  ${subTab === st.key
                    ? 'bg-navy-700 text-cream-100 border border-gold-500/40'
                    : 'bg-white/8 text-cream-200/60 hover:bg-white/12 border border-transparent'
                  }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="bg-navy-800/50 border border-white/10 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-sm text-cream-200/60 mb-1">{t('calculadoras.base')} (COP)</label>
              <input
                type="number" min="0" value={base}
                onChange={e => { setBase(e.target.value); setResultado(null); }}
                placeholder="0"
                className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2.5 text-cream-100 focus:outline-none focus:border-gold-500/50"
              />
            </div>

            {subTab === 'renta' && (
              <div>
                <label className="block text-sm text-cream-200/60 mb-1">{t('calculadoras.concepto')}</label>
                <select
                  value={conceptoIdx}
                  onChange={e => { setConceptoIdx(+e.target.value); setResultado(null); }}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2.5 text-cream-100 focus:outline-none focus:border-gold-500/50"
                >
                  {TARIFAS_RENTA.map((t, i) => (
                    <option key={i} value={i}>{t.concepto} ({t.tarifaPct}%)</option>
                  ))}
                </select>
                {TARIFAS_RENTA[conceptoIdx].baseUvt > 0 && (
                  <p className="text-xs text-cream-200/40 mt-1">
                    Base mínima: {TARIFAS_RENTA[conceptoIdx].baseUvt} UVT = {formatCOP(TARIFAS_RENTA[conceptoIdx].baseUvt * UVT_2026)}
                  </p>
                )}
              </div>
            )}

            {subTab === 'iva' && (
              <div className="bg-navy-900 rounded-lg p-3 text-sm text-cream-200/60">
                <p>IVA general: <strong className="text-cream-100">19%</strong></p>
                <p>Tarifa retención IVA: <strong className="text-cream-100">15%</strong> del IVA facturado</p>
              </div>
            )}

            {subTab === 'ica' && (
              <div>
                <label className="block text-sm text-cream-200/60 mb-1">Actividad económica (Bogotá)</label>
                <select
                  value={icaIdx}
                  onChange={e => { setIcaIdx(+e.target.value); setResultado(null); }}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-4 py-2.5 text-cream-100 focus:outline-none focus:border-gold-500/50"
                >
                  {TARIFAS_ICA_BOGOTA.map((t, i) => (
                    <option key={i} value={i}>{t.actividad} ({t.tarifaXmil}‰)</option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={calcular}
              className="w-full bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold py-2.5 rounded-lg transition"
            >
              {t('calculadoras.calcular')}
            </button>

            {resultado && (
              <div className="bg-navy-900 border border-gold-500/20 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-cream-200/60 text-sm">{t('calculadoras.valorRetener')}</span>
                  <span className="text-red-300 font-semibold">{formatCOP(resultado.retener)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cream-200/60 text-sm">{t('calculadoras.valorNeto')}</span>
                  <span className="text-green-300 font-semibold">{formatCOP(resultado.neto)}</span>
                </div>
                <button onClick={copiar} className="w-full mt-2 bg-white/10 hover:bg-white/15 text-cream-100 text-sm py-2 rounded-lg transition">
                  {copiado ? `✓ ${t('calculadoras.copiado')}` : t('calculadoras.copiar')}
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-amber-400/70 border border-amber-500/20 bg-amber-500/5 rounded-lg p-3">
            ⚠️ {t('calculadoras.advertencia')}. UVT 2026 = {formatCOP(UVT_2026)} (Res. DIAN 000238/2025).
          </p>
        </div>
      )}

      {/* Calculadora de Nómina */}
      {mainTab === 'nomina' && <CalcNomina />}
    </div>
  );
}
