interface Logo9AProps { size?: number; className?: string; }

export function Logo9A({ size = 80, className = '' }: Logo9AProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 280 280"
      width={size}
      height={size}
      className={className}
      aria-label="9 Alliance logo"
      role="img"
    >
      <circle cx="140" cy="140" r="136" fill="#2a2826" />
      <circle cx="140" cy="140" r="121" fill="none" stroke="#EDE8DC" strokeWidth="5.5" />
      <text
        x="100" y="200"
        fontFamily="'Playfair Display','Cormorant Garamond',Georgia,serif"
        fontSize="175" fontStyle="italic" fontWeight="400"
        fill="#EDE8DC" textAnchor="middle"
      >9</text>
      <text
        x="186" y="193"
        fontFamily="'Playfair Display','Cormorant Garamond',Georgia,serif"
        fontSize="152" fontStyle="italic" fontWeight="400"
        fill="#EDE8DC" textAnchor="middle"
      >A</text>
    </svg>
  );
}
