import { useMemo, useState, useEffect } from 'react';
import {
  TrendingUp, Globe, Scale, Gavel,
  ThumbsUp, MessageCircle, RefreshCw,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMarketData } from '../hooks/useMarketData';
import type { NewsItem } from '../hooks/useMarketData';

// ── Types ──────────────────────────────────────────────────────────────────────
type Cat = 'eco_co' | 'eco_world' | 'jur_nac' | 'jur_glob';

interface StaticNoticia {
  id: number; cat: Cat; fuente: string; hora: string;
  titular: string; resumen: string; likes: number; com: number;
  feat?: boolean; imagen?: string;
}

// Category images assigned to live RSS items (which have no thumbnails)
const CAT_IMAGES: Record<Cat, string[]> = {
  eco_co: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80',
    'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=800&q=80',
    'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&q=80',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80',
  ],
  eco_world: [
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&q=80',
    'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&q=80',
  ],
  jur_nac: [
    'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80',
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
    'https://images.unsplash.com/photo-1575505586569-646b2ca898fc?w=800&q=80',
    'https://images.unsplash.com/photo-1436450412740-6b988f486c6b?w=800&q=80',
  ],
  jur_glob: [
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
    'https://images.unsplash.com/photo-1568992688065-536aad8a12f6?w=800&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
  ],
};

// Fallback news (used while live data loads)
const STATIC_NOTICIAS: StaticNoticia[] = [
  {
    id: 1, cat: 'eco_co', fuente: 'Portafolio', hora: 'hace 2h', feat: true,
    titular: 'El dólar cierra cerca de los $3.430 tras una semana de baja volatilidad',
    resumen: 'Operadores del mercado cambiario señalan que el peso se fortaleció levemente, impulsado por flujos de portafolio y un ligero repunte en los precios del crudo Brent.',
    likes: 24, com: 6,
    imagen: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80',
  },
  {
    id: 2, cat: 'eco_world', fuente: 'Reuters', hora: 'hace 3h',
    titular: 'Mercados globales reaccionan a las nuevas cifras de inflación en EE. UU.',
    resumen: 'Las bolsas europeas y asiáticas operan mixtas a la espera de la decisión de tasas.',
    likes: 18, com: 9,
    imagen: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80',
  },
  {
    id: 3, cat: 'jur_nac', fuente: 'Ámbito Jurídico', hora: 'hace 5h',
    titular: 'Reforma tributaria: las claves del proyecto que cursa en el Congreso',
    resumen: 'Cambios propuestos en renta, IVA y retención que impactarían a las personas jurídicas.',
    likes: 41, com: 12,
    imagen: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80',
  },
  {
    id: 4, cat: 'eco_co', fuente: 'La República', hora: 'hace 6h',
    titular: 'Banco de la República mantiene su tasa de interés en la última reunión',
    resumen: 'La junta directiva privilegia el control de la inflación frente al crecimiento.',
    likes: 15, com: 4,
    imagen: 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=800&q=80',
  },
  {
    id: 5, cat: 'jur_glob', fuente: '9A Research', hora: 'hace 1d',
    titular: 'OCDE avanza en las reglas de tributación mínima para multinacionales',
    resumen: 'El Pilar 2 redefine cómo se gravan las grandes empresas a nivel global.',
    likes: 33, com: 7,
    imagen: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80',
  },
];

const CAT_META: Record<Cat, { label: string; Icon: LucideIcon; bg: string; isEco: boolean }> = {
  eco_co:    { label: 'Economía · Colombia', Icon: TrendingUp, bg: '#243560', isEco: true  },
  eco_world: { label: 'Economía · Mundial',  Icon: Globe,      bg: '#1B2A4A', isEco: true  },
  jur_nac:   { label: 'Jurídico · Nacional', Icon: Scale,      bg: '#2a2826', isEco: false },
  jur_glob:  { label: 'Jurídico · Global',   Icon: Gavel,      bg: '#0d1829', isEco: false },
};

// ── Unified display item ───────────────────────────────────────────────────────
interface DisplayItem {
  key: string;
  titular: string;
  resumen?: string;
  fuente: string;
  hora: string;
  cat: Cat;
  imagen?: string;
  link?: string;
  likes?: number;
  com?: number;
}

function relDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const h = Math.floor(diff / 3_600_000);
  const dy = Math.floor(diff / 86_400_000);
  if (h < 1) return 'hace un momento';
  if (h < 24) return `hace ${h}h`;
  if (dy === 1) return 'ayer';
  if (dy < 7) return `hace ${dy} días`;
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

const CAT_BY_FEED: Record<string, Cat> = {
  'Economía Colombia': 'eco_co',
  'Economía Mundial':  'eco_world',
  'Jurídico Colombia': 'jur_nac',
};

function liveToDisplay(item: NewsItem, feedLabel: string, idx: number): DisplayItem {
  const cat = CAT_BY_FEED[feedLabel] ?? 'eco_co';
  const imgs = CAT_IMAGES[cat];
  return {
    key: `live-${idx}-${item.pubDate}`,
    titular: item.title,
    fuente: item.source,
    hora: relDate(item.pubDate),
    cat,
    imagen: imgs[idx % imgs.length],
    link: item.link,
  };
}

function staticToDisplay(n: StaticNoticia): DisplayItem {
  return {
    key: `static-${n.id}`,
    titular: n.titular, resumen: n.resumen, fuente: n.fuente, hora: n.hora,
    cat: n.cat, imagen: n.imagen, likes: n.likes, com: n.com,
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function CatBadge({ cat, small }: { cat: Cat; small?: boolean }) {
  const { label, isEco } = CAT_META[cat];
  return (
    <span className={`inline-flex font-semibold tracking-wide rounded-full whitespace-nowrap
      ${small ? 'text-[8px] px-1.5 py-[2px]' : 'text-[9.5px] px-2.5 py-[3px]'}
      ${isEco ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30'
               : 'bg-white/10 text-cream-100/75 border border-white/20'}`}>
      {label}
    </span>
  );
}

function SourceRow({ fuente, hora }: { fuente: string; hora: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 rounded-full bg-gold-500 flex items-center justify-center shrink-0">
        <span className="text-navy-900 text-[8px] font-bold leading-none">9A</span>
      </div>
      <span className="text-cream-200/60 text-[11px] font-medium">{fuente}</span>
      <span className="text-cream-200/25 text-[11px]">·</span>
      <span className="text-cream-200/40 text-[11px]">{hora}</span>
    </div>
  );
}

function ImgArea({ cat, imagen, children, className = '' }: {
  cat: Cat; imagen?: string; children?: React.ReactNode; className?: string;
}) {
  const { Icon, bg, isEco } = CAT_META[cat];
  const accent = isEco ? '#C9A84C' : 'rgba(237,232,220,0.35)';

  return imagen ? (
    <div className={`overflow-hidden relative ${className}`} style={{ borderLeft: `3px solid ${accent}` }}>
      <img src={imagen} alt="" className="w-full h-full object-cover" />
      {children}
    </div>
  ) : (
    <div className={`flex items-center justify-center overflow-hidden relative ${className}`}
      style={{ backgroundColor: bg, borderLeft: `3px solid ${accent}` }}>
      <Icon size={64} strokeWidth={0.75} style={{ opacity: 0.10, color: 'white' }} />
      {children}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function InicioPage() {
  const { data: mkt, refresh } = useMarketData();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const allItems = useMemo<DisplayItem[]>(() => {
    const live = mkt?.news.flatMap((feed, fi) =>
      feed.items.map((item, ii) => liveToDisplay(item, feed.label, fi * 100 + ii))
    ) ?? [];
    return live.length >= 4 ? live : STATIC_NOTICIAS.map(staticToDisplay);
  }, [mkt]);

  const n = allItems.length;
  const heroItem  = allItems[tick % n];
  const gridItems = [1, 2, 3, 4].map(i => allItems[(tick + i) % n]);
  const isLive    = (mkt?.news.flatMap(f => f.items).length ?? 0) >= 4;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-cream-100">Inicio</h1>
          <p className="text-cream-200/35 text-xs mt-0.5">
            Noticias de economía y temas jurídicos · Colombia y el mundo
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1.5 text-[9.5px] text-emerald-400/80 font-semibold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              EN VIVO
            </span>
          )}
          <span className="text-cream-200/25 text-[10px]">Rotación cada 10 s</span>
          <button onClick={refresh} title="Actualizar noticias"
            className="text-cream-200/25 hover:text-gold-400 transition-colors">
            <RefreshCw size={12} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ── Hero card ── */}
      <div key={`hero-${tick}`} className="rounded-xl overflow-hidden border border-white/8" style={{ animation: 'fadeIn 0.5s ease' }}>
        <div className="relative h-72">
          <ImgArea cat={heroItem.cat} imagen={heroItem.imagen} className="absolute inset-0 w-full h-full">
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(13,24,41,0.93) 0%, rgba(13,24,41,0.1) 65%, transparent 100%)' }} />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <CatBadge cat={heroItem.cat} />
              <h2 className="text-cream-100 text-[21px] font-bold leading-snug mt-2">
                {heroItem.titular}
              </h2>
            </div>
          </ImgArea>
        </div>
        <div className="bg-navy-800/70 px-5 py-3 flex items-center justify-between border-t border-white/6">
          <SourceRow fuente={heroItem.fuente} hora={heroItem.hora} />
          {heroItem.likes !== undefined && (
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-cream-200/40 text-[11px]">
                <ThumbsUp size={11} strokeWidth={1.8} /> {heroItem.likes}
              </span>
              <span className="flex items-center gap-1.5 text-cream-200/40 text-[11px]">
                <MessageCircle size={11} strokeWidth={1.8} /> {heroItem.com}
              </span>
            </div>
          )}
          {heroItem.link && (
            <a href={heroItem.link} target="_blank" rel="noopener noreferrer"
              className="text-gold-400/60 hover:text-gold-400 text-[11px] transition-colors">
              Leer más →
            </a>
          )}
        </div>
      </div>

      {/* ── Grid 2 columnas ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {gridItems.map((item, i) => (
          <div key={`grid-${tick}-${i}`}
            className="bg-navy-800/50 border border-white/8 rounded-xl overflow-hidden flex flex-col hover:border-white/15 transition-colors"
            style={{ animation: 'fadeIn 0.5s ease' }}>
            <div className="relative h-[180px]">
              <ImgArea cat={item.cat} imagen={item.imagen} className="absolute inset-0 w-full h-full">
                <span className="absolute top-2.5 left-2.5"><CatBadge cat={item.cat} small /></span>
              </ImgArea>
            </div>
            <div className="p-4 flex flex-col flex-1">
              <SourceRow fuente={item.fuente} hora={item.hora} />
              <h3 className="text-cream-100 text-[14px] font-semibold leading-snug mt-2 mb-1.5"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {item.titular}
              </h3>
              {item.resumen ? (
                <p className="text-cream-200/55 text-[12px] leading-relaxed flex-1"
                  style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.resumen}
                </p>
              ) : item.link ? (
                <a href={item.link} target="_blank" rel="noopener noreferrer"
                  className="text-gold-400/60 hover:text-gold-400 text-[11px] mt-auto pt-2 transition-colors">
                  Leer artículo →
                </a>
              ) : null}
              {item.likes !== undefined && (
                <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-white/6">
                  <span className="flex items-center gap-1.5 text-cream-200/40 text-[11px]">
                    <ThumbsUp size={11} strokeWidth={1.8} /> {item.likes}
                  </span>
                  <span className="flex items-center gap-1.5 text-cream-200/40 text-[11px]">
                    <MessageCircle size={11} strokeWidth={1.8} /> {item.com}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[9.5px] text-cream-200/18 pt-3 border-t border-white/8">
        {isLive
          ? 'Noticias en tiempo real · open.er-api.com para tasas · Contenido de fuentes públicas'
          : 'Titulares de referencia · Imágenes: Unsplash (CC0)'}
      </p>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
