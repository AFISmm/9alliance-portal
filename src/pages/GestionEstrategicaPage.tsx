import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { realClients, clientsMap } from '../data/clients';
import { obligaciones } from '../data/obligaciones';
import { getAllVencimientos } from '../lib/getVencimientos';
import type { Estado } from '../lib/getVencimientos';
import { WarningModal } from '../components/WarningModal';

const SESSION_KEY = 'warning_shown';

interface SummaryCard {
  estado: Estado;
  labelKey: string;
  color: string;
  dot: string;
  bg: string;
  border: string;
  hoverBorder: string;
}

const cards: SummaryCard[] = [
  { estado: 'pendiente',  labelKey: 'home.pendientes',  color: 'text-slate-300',  dot: 'bg-slate-400',  bg: 'bg-slate-500/8',  border: 'border-slate-500/20',  hoverBorder: 'hover:border-slate-400/40'  },
  { estado: 'proximo',    labelKey: 'home.proximos',    color: 'text-amber-300',  dot: 'bg-amber-400',  bg: 'bg-amber-500/8',  border: 'border-amber-500/20',  hoverBorder: 'hover:border-amber-400/40'  },
  { estado: 'presentado', labelKey: 'home.presentados', color: 'text-emerald-300', dot: 'bg-emerald-400', bg: 'bg-emerald-500/8', border: 'border-emerald-500/20', hoverBorder: 'hover:border-emerald-400/40' },
  { estado: 'vencido',    labelKey: 'home.vencidos',    color: 'text-red-300',    dot: 'bg-red-400',    bg: 'bg-red-500/8',    border: 'border-red-500/20',    hoverBorder: 'hover:border-red-400/40'    },
];

export default function GestionEstrategicaPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const allVenc = useMemo(() => getAllVencimientos(realClients, obligaciones), []);

  const counts: Record<Estado, number> = useMemo(() => ({
    pendiente:  allVenc.filter(v => v.estado === 'pendiente').length,
    proximo:    allVenc.filter(v => v.estado === 'proximo').length,
    presentado: allVenc.filter(v => v.estado === 'presentado').length,
    vencido:    allVenc.filter(v => v.estado === 'vencido').length,
  }), [allVenc]);

  const proximos = useMemo(() =>
    allVenc
      .filter(v => v.estado === 'proximo' || v.estado === 'vencido')
      .sort((a, b) => (a.fechaExactaNit ?? a.fechaFin).localeCompare(b.fechaExactaNit ?? b.fechaFin))
  , [allVenc]);

  useEffect(() => {
    const upcoming = allVenc.filter(v => v.estado === 'proximo');
    if (upcoming.length > 0 && !sessionStorage.getItem(SESSION_KEY)) {
      setShowModal(true);
    }
  }, [allVenc]);

  function handleCloseModal() {
    sessionStorage.setItem(SESSION_KEY, '1');
    setShowModal(false);
  }

  return (
    <>
      {showModal && (
        <WarningModal
          vencimientos={allVenc.filter(v => v.estado === 'proximo')}
          onClose={handleCloseModal}
        />
      )}

      <div className="space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-cream-100">Tablero de Obligaciones</h1>
          <p className="text-cream-200/35 text-xs mt-0.5">Resumen en tiempo real · {realClients.length} empresas</p>
        </div>

        {/* Stat cards — compact */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map(card => (
            <button
              key={card.estado}
              onClick={() => navigate(`/informacion-general?tab=calendario&estado=${card.estado}`)}
              className={`${card.bg} ${card.border} ${card.hoverBorder} border rounded-xl px-4 py-3.5 text-left transition group`}
            >
              <p className={`text-3xl font-bold tabular-nums ${card.color}`}>{counts[card.estado]}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${card.dot}`} />
                <p className="text-cream-200/45 text-[10px] uppercase tracking-wider font-medium">{t(card.labelKey)}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Upcoming / overdue list */}
        <div className="bg-navy-800/40 border border-white/8 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
            <h2 className="text-cream-100 text-sm font-semibold">Próximos vencimientos</h2>
            {proximos.length > 0 && (
              <button
                onClick={() => navigate('/informacion-general?tab=calendario')}
                className="text-gold-400/60 hover:text-gold-400 text-xs transition"
              >
                Ver calendario →
              </button>
            )}
          </div>

          {proximos.length === 0 ? (
            <div className="px-4 py-10 flex flex-col items-center gap-2 text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm">✓</div>
              <p className="text-cream-200/40 text-sm">Sin vencimientos próximos</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {proximos.slice(0, 10).map(v => {
                const cliente = clientsMap[v.clienteId];
                const oblig = obligaciones.find(o => o.id === v.obligacionId);
                const isVencido = v.estado === 'vencido';
                return (
                  <button
                    key={v.id}
                    onClick={() => navigate(`/empresa/${v.clienteId}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition text-left group"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-0.5 ${isVencido ? 'bg-red-400' : 'bg-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-cream-100 text-xs font-medium truncate leading-snug">{cliente?.nombre ?? v.clienteId}</p>
                      <p className="text-cream-200/40 text-[10.5px] truncate mt-0.5">{oblig?.nombre ?? v.obligacionId}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-xs font-medium tabular-nums ${isVencido ? 'text-red-300' : 'text-amber-300'}`}>
                        {v.fechaExactaLabel ?? v.rangoFechas}
                      </p>
                      <p className="text-cream-200/25 text-[10px] mt-0.5">{v.periodo}</p>
                    </div>
                    <span className="text-cream-200/20 group-hover:text-gold-400/60 text-xs transition shrink-0">→</span>
                  </button>
                );
              })}
              {proximos.length > 10 && (
                <button
                  onClick={() => navigate('/informacion-general?tab=calendario')}
                  className="w-full px-4 py-3 text-center text-xs text-cream-200/35 hover:text-gold-400 transition"
                >
                  Ver {proximos.length - 10} más en el calendario →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Legal note */}
        <p className="text-[10px] text-cream-200/25 border-t border-white/8 pt-3">
          {t('home.notaLegal')}
        </p>
      </div>
    </>
  );
}
