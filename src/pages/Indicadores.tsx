import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UVT_2026, SMMLV_2026, AUX_TRANSPORTE_2026, TARIFAS_RENTA, formatCOP, VIGENCIA } from '../data/fiscalParams';

export default function Indicadores() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const filtered = TARIFAS_RENTA.filter(r =>
    r.concepto.toLowerCase().includes(query.toLowerCase()) ||
    r.grupoEs.toLowerCase().includes(query.toLowerCase())
  );

  const indicadores = [
    {
      label: t('indicadores.uvt'),
      valor: UVT_2026,
      nota: 'Resolución DIAN 000238 de 2025',
      icon: '📋',
    },
    {
      label: t('indicadores.smmlv'),
      valor: SMMLV_2026,
      nota: 'Decreto 0159 de 2026',
      icon: '💼',
    },
    {
      label: t('indicadores.auxTransporte'),
      valor: AUX_TRANSPORTE_2026,
      nota: 'Decreto 0159 de 2026',
      icon: '🚌',
    },
    {
      label: '4 UVT',
      valor: 4 * UVT_2026,
      nota: 'Cuantía mínima servicios generales',
      icon: '📐',
    },
    {
      label: '27 UVT',
      valor: 27 * UVT_2026,
      nota: 'Cuantía mínima compras / arrendamiento inmuebles',
      icon: '📐',
    },
    {
      label: '92 UVT',
      valor: 92 * UVT_2026,
      nota: 'Cuantía mínima bienes agrícolas sin procesamiento',
      icon: '📐',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-cream-100">{t('indicadores.titulo')} {VIGENCIA}</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {indicadores.map(ind => (
          <div key={ind.label} className="bg-navy-800/50 border border-white/5 rounded-xl p-4">
            <p className="text-cream-200/50 text-xs uppercase tracking-wide mb-1">{ind.label}</p>
            <p className="text-cream-100 text-2xl font-bold">{formatCOP(ind.valor)}</p>
            <p className="text-gold-400/70 text-xs mt-1">{ind.nota}</p>
          </div>
        ))}
      </div>

      {/* Tabla de retención */}
      <div>
        <h2 className="text-xl font-semibold text-cream-100 mb-3">{t('indicadores.tablaRetencion')}</h2>
        <p className="text-xs text-cream-200/40 mb-3">
          Fuente: ET Arts. 383, 386, 392, 401; Decreto 1625/2016. UVT {VIGENCIA} = {formatCOP(UVT_2026)} (Res. DIAN 000238/2025).
        </p>
        <div className="mb-3">
          <input
            type="search"
            placeholder={t('indicadores.buscar')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="bg-navy-800 border border-white/10 rounded-lg px-4 py-2 text-sm text-cream-100 placeholder-cream-200/30 focus:outline-none focus:border-gold-500/50 w-full max-w-sm"
          />
        </div>
        <div className="rounded-xl overflow-hidden border border-white/10">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-navy-800">
                <th className="text-left px-4 py-3 text-cream-200/60 font-medium w-8">#</th>
                <th className="text-left px-4 py-3 text-cream-200/60 font-medium">{t('indicadores.concepto')}</th>
                <th className="text-right px-4 py-3 text-cream-200/60 font-medium whitespace-nowrap">{t('indicadores.baseMinima')}</th>
                <th className="text-right px-4 py-3 text-cream-200/60 font-medium whitespace-nowrap">{t('indicadores.baseMinimaCol')}</th>
                <th className="text-right px-4 py-3 text-cream-200/60 font-medium">{t('indicadores.tarifa')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const isBlue = i % 2 === 0;
                return (
                  <tr
                    key={i}
                    className={isBlue
                      ? 'bg-navy-800 text-cream-100'
                      : 'bg-white text-navy-900'
                    }
                  >
                    <td className={`px-4 py-2.5 ${isBlue ? 'text-cream-200/40' : 'text-navy-800/50'}`}>{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{r.concepto}</td>
                    <td className={`px-4 py-2.5 text-right ${isBlue ? 'text-cream-200/70' : 'text-navy-700'}`}>
                      {r.baseUvt === 0 ? '—' : `${r.baseUvt} UVT`}
                    </td>
                    <td className={`px-4 py-2.5 text-right ${isBlue ? 'text-cream-200/70' : 'text-navy-700'}`}>
                      {r.baseUvt === 0 ? 'Sin mínimo' : formatCOP(r.baseUvt * UVT_2026)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold">{r.tarifaPct.toFixed(1)}%</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-cream-200/30 bg-navy-900">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
