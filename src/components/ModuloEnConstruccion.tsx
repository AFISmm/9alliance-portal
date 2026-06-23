import { useNavigate } from 'react-router-dom';

interface Props {
  titulo: string;
  descripcion: string;
  linkTo?: string;
  linkLabel?: string;
}

export function ModuloEnConstruccion({ titulo, descripcion, linkTo, linkLabel }: Props) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-5 px-4">
      <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
        <span className="text-3xl">🚧</span>
      </div>
      <div className="space-y-2 max-w-sm">
        <h2 className="text-xl font-semibold text-cream-100">{titulo}</h2>
        <p className="text-cream-200/50 text-sm leading-relaxed">{descripcion}</p>
      </div>
      {linkTo && linkLabel && (
        <button
          onClick={() => navigate(linkTo)}
          className="mt-2 bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/30 text-gold-300 text-sm font-medium px-5 py-2.5 rounded-xl transition"
        >
          {linkLabel} →
        </button>
      )}
    </div>
  );
}
