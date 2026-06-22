import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Vencimiento } from '../lib/getVencimientos';
import { obligacionesMap } from '../data/obligaciones';
import { clientsMap } from '../data/clients';

interface Props {
  vencimientos: Vencimiento[];
  onClose: () => void;
}

export function WarningModal({ vencimientos, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-navy-800 border border-amber-500/30 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center gap-3 p-5 border-b border-white/10">
          <span className="text-2xl">⚠️</span>
          <div>
            <h2 className="text-cream-100 font-semibold">{t('home.advertencia')}</h2>
            <p className="text-amber-300 text-sm mt-0.5">
              {t('home.advertenciaMensaje', { count: vencimientos.length })}
            </p>
          </div>
        </div>

        <ul className="p-4 space-y-3 max-h-72 overflow-y-auto">
          {vencimientos.map(v => {
            const cliente = clientsMap[v.clienteId];
            const ob = obligacionesMap[v.obligacionId];
            const fechaVence = format(parseISO(v.fechaFin), "d 'de' MMMM yyyy", { locale: es });

            return (
              <li key={v.id} className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-cream-100 font-semibold text-sm truncate">{cliente?.nombre}</p>
                    <p className="text-cream-200/60 text-xs mt-0.5">{ob?.nombre} — {v.periodo}</p>
                    {!v.exacta && (
                      <p className="text-cream-200/35 text-xs mt-0.5 italic">{v.rangoFechas}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-amber-300/70 uppercase tracking-wide">Vence</p>
                    <p className="text-amber-300 font-bold text-sm">{fechaVence}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full bg-amber-500 hover:bg-amber-400 text-navy-900 font-semibold py-2.5 rounded-lg transition"
          >
            {t('home.cerrar')}
          </button>
        </div>
      </div>
    </div>
  );
}
