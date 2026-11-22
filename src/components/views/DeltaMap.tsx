// Carte stylisée du delta (maquette « Accueil ») : terres et îles dessinées, destinations
// placées d'après leurs coordonnées GPS du CMS, camp de base (Ndangane) en ocre, trajet en
// pirogue en pointillés. SVG en ligne, aucune requête.

type DeltaPoint = { id: number; name: string; latitude: number; longitude: number };

type DeltaMapProps = {
  title: string;
  description: string;
  points: readonly DeltaPoint[];
  baseId: number | null;
};

/** Positions dessinées par la maquette (le relevé GPS seul resserre trop les points). */
const DRAWN: Record<string, { x: number; y: number; end?: boolean }> = {
  ndangane: { x: 132, y: 140, end: true },
  'mar lodj': { x: 196, y: 178 },
  'île aux oiseaux': { x: 318, y: 210, end: true },
  'bird island': { x: 318, y: 210, end: true },
  'joal-fadiouth': { x: 70, y: 70 },
  palmarin: { x: 40, y: 196 },
  djiffer: { x: 104, y: 258 },
};

const WIDTH = 420;
const HEIGHT = 300;
const PAD_X = 60;
const PAD_Y = 52;

export const DeltaMap = ({ title, description, points, baseId }: DeltaMapProps) => {
  if (points.length === 0) return null;
  const lats = points.map((point) => point.latitude);
  const lngs = points.map((point) => point.longitude);
  const [minLat, maxLat, minLng, maxLng] = [
    Math.min(...lats),
    Math.max(...lats),
    Math.min(...lngs),
    Math.max(...lngs),
  ];
  const projected = points.map((point) => {
    const drawn = DRAWN[point.name.toLowerCase()];
    return {
      ...point,
      x:
        drawn?.x ??
        PAD_X + ((point.longitude - minLng) / (maxLng - minLng || 1)) * (WIDTH - 2 * PAD_X),
      y:
        drawn?.y ??
        PAD_Y + ((maxLat - point.latitude) / (maxLat - minLat || 1)) * (HEIGHT - 2 * PAD_Y),
      end: drawn?.end ?? false,
    };
  });
  const base = projected.find((point) => point.id === baseId);
  // Trajet en pirogue du camp de base vers les îles situées à l'est.
  const route = base
    ? [base, ...projected.filter((point) => point.id !== base.id && point.x > base.x)]
        .sort((a, b) => a.y - b.y)
        .map(
          (point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
        )
        .join(' ')
    : '';

  return (
    <svg
      role="img"
      aria-labelledby="delta-titre delta-desc"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="mt-3 h-auto w-full max-w-[460px]"
    >
      <title id="delta-titre">{title}</title>
      <desc id="delta-desc">{description}</desc>
      <rect width={WIDTH} height={HEIGHT} rx="20" fill="#f4eee3" />
      <g aria-hidden="true">
        <path
          d="M0 120 Q80 110 140 150 Q200 190 260 170 Q330 150 420 200 L420 300 L0 300 Z"
          fill="#bfd3c6"
        />
        <path d="M120 300 Q150 230 210 220 Q260 214 300 300 Z" fill="#9fbcaa" />
        <path d="M150 170 Q190 150 230 168 Q250 184 220 196 Q180 204 150 186 Z" fill="#7fa48e" />
        <path d="M280 200 Q320 186 350 204 Q356 222 326 228 Q294 228 280 214 Z" fill="#7fa48e" />
        {route && (
          <path d={route} stroke="#9e4521" strokeWidth="2" strokeDasharray="5 6" fill="none" />
        )}
      </g>
      {projected.map((point) => {
        const isBase = point.id === baseId;
        const anchorEnd = point.end || point.x > WIDTH * 0.8;
        return (
          <g key={point.id}>
            <circle
              cx={point.x}
              cy={point.y}
              r={isBase ? 7 : 4.5}
              fill={isBase ? '#9e4521' : '#1b2a24'}
            />
            <text
              x={anchorEnd ? point.x - 10 : point.x + 10}
              y={point.y + 4}
              textAnchor={anchorEnd ? 'end' : 'start'}
              fontFamily="Manrope, sans-serif"
              fontSize={isBase ? 14 : 12}
              fontWeight={isBase ? 700 : 500}
              fill="#1b2a24"
            >
              {point.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
