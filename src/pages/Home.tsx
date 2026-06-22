import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { realClients } from '../data/clients';
import { obligaciones } from '../data/obligaciones';
import { getAllVencimientos } from '../lib/getVencimientos';
import type { Estado } from '../lib/getVencimientos';
import { StatusBadge } from '../components/StatusBadge';
import { WarningModal } from '../components/WarningModal';

const SESSION_KEY = 'warning_shown';

interface SummaryCard {
  estado: Estado;
  labelKey: string;
  color: string;
  bg: string;
  border: string;
}

const cards: SummaryCard[] = [
  { estado: 'pendiente', labelKey: 'home.pendientes', color: 'text-gray-300', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
  { estado: 'proximo',   labelKey: 'home.proximos',   color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { estado: 'presentado',labelKey: 'home.presentados',color: 'text-green-300', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { estado: 'vencido',   labelKey: 'home.vencidos',   color: 'text-red-300',   bg: 'bg-red-500/10',   border: 'border-red-500/20' },
];

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const allVenc = useMemo(() => getAllVencimientos(realClients, obligaciones), []);

  const counts: Record<Estado, number> = useMemo(() => ({
    pendiente: allVenc.filter(v => v.estado === 'pendiente').length,
    proximo:   allVenc.filter(v => v.estado === 'proximo').length,
    presentado:allVenc.filter(v => v.estado === 'presentado').length,
    vencido:   allVenc.filter(v => v.estado === 'vencido').length,
  }), [allVenc]);

  const proximos = useMemo(() => allVenc.filter(v => v.estado === 'proximo'), [allVenc]);

  useEffect(() => {
    if (proximos.length > 0 && !sessionStorage.getItem(SESSION_KEY)) {
      setShowModal(true);
    }
  }, [proximos.length]);

  function handleCloseModal() {
    sessionStorage.setItem(SESSION_KEY, '1');
    setShowModal(false);
  }

  return (
    <>
      {showModal && proximos.length > 0 && (
        <WarningModal vencimientos={proximos} onClose={handleCloseModal} />
      )}

      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-cream-100">{t('home.titulo')}</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(card => (
            <button
              key={card.estado}
              onClick={() => navigate(`/calendario?estado=${card.estado}`)}
              className={`${card.bg} ${card.border} border rounded-xl p-5 text-left hover:opacity-80 transition`}
            >
              <p className="text-cream-200/60 text-xs uppercase tracking-wider mb-3">{t(card.labelKey)}</p>
              <p className={`text-4xl font-bold ${card.color}`}>{counts[card.estado]}</p>
              <div className="mt-3">
                <StatusBadge estado={card.estado} />
              </div>
            </button>
          ))}
        </div>

        <p className="text-xs text-cream-200/40 border-t border-white/10 pt-4">
          ⚖️ {t('home.notaLegal')}
        </p>
      </div>
    </>
  );
}
