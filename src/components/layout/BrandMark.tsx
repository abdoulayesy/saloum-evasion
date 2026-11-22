// Emblème de la marque (maquette) : soleil au-dessus de deux vagues, trait doré.
export const BrandMark = ({ size = 30 }: { size?: number }) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 34 34"
    fill="none"
    stroke="#f0a257"
    strokeWidth="1.8"
  >
    <circle cx="17" cy="14" r="6" />
    <path d="M3 22 Q10 18 17 22 T31 22" />
    <path d="M3 27 Q10 23 17 27 T31 27" />
  </svg>
);
