import { useTranslation } from 'react-i18next';
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
      <div className="bg-navy-800 border border-amber-500/30 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center gap-3 p-5 border-b border-white/10">
          <span className="text-2xl">⚠️</span>
          <div>
            <h2 className="text-cream-100 font-semibold">{t('home.advertencia')}</h2>
            <p className="text-amber-300 text-sm mt-0.5">
              {t('home.advertenciaMensaje', { count: vencimientos.length })}
            </p>
          </div>
        </div>
        <ul className="p-4 space-y-2 max-h-64 overflow-y-auto">
          {vencimientos.map(v => {
            const cliente = clientsMap[v.clienteId];
            const ob = obligacionesMap[v.obligacionId];
            return (
              <li key={v.id} className="flex items-start gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <div>
                  <p className="text-cream-100 font-medium">{cliente?.nombre}</p>
                  <p className="text-cream-200/60">{ob?.nombre} — {v.periodo}</p>
                  <p className="text-amber-300 text-xs">{v.rangoFechas}</p>
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
