import { useTranslation } from 'react-i18next';
import type { Estado } from '../lib/getVencimientos';

const styles: Record<Estado, string> = {
  pendiente: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
  proximo: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  presentado: 'bg-green-500/20 text-green-300 border border-green-500/30',
  vencido: 'bg-red-500/20 text-red-300 border border-red-500/30',
};

const dots: Record<Estado, string> = {
  pendiente: 'bg-gray-400',
  proximo: 'bg-amber-400',
  presentado: 'bg-green-400',
  vencido: 'bg-red-400',
};

interface Props {
  estado: Estado;
  size?: 'sm' | 'md';
}

export function StatusBadge({ estado, size = 'sm' }: Props) {
  const { t } = useTranslation();
  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${px} ${styles[estado]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[estado]}`} />
      {t(`estado.${estado}`)}
    </span>
  );
}
