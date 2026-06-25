import logo9a from '../assets/logo-9a.png';

interface Logo9AProps { size?: number; className?: string; }

export function Logo9A({ size = 80, className = '' }: Logo9AProps) {
  return (
    <img
      src={logo9a}
      width={size}
      height={size}
      className={className}
      alt="9 Alliance"
      style={{ display: 'block', borderRadius: '50%' }}
    />
  );
}
