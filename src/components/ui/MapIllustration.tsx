// Carte schématique (T078, plan « Carte : illustration SVG statique ») : points des
// destinations placés d'après leurs coordonnées GPS du CMS, destinations du séjour mises en
// évidence. Aucune carte interactive, aucune requête : SVG en ligne avec `title` et `desc`.

export type MapPoint = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  highlighted: boolean;
};

type MapIllustrationProps = { title: string; description: string; points: readonly MapPoint[] };

const WIDTH = 320;
const HEIGHT = 240;
const PADDING = 36;

export const projectPoints = (points: readonly MapPoint[]) => {
  if (points.length === 0) return [];
  const lats = points.map((point) => point.latitude);
  const lngs = points.map((point) => point.longitude);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
  const spanLat = maxLat - minLat || 1;
  const spanLng = maxLng - minLng || 1;
  return points.map((point) => ({
    ...point,
    x: PADDING + ((point.longitude - minLng) / spanLng) * (WIDTH - 2 * PADDING),
    y: PADDING + ((maxLat - point.latitude) / spanLat) * (HEIGHT - 2 * PADDING),
  }));
};

export const MapIllustration = ({ title, description, points }: MapIllustrationProps) => {
  const projected = projectPoints(points);
  if (projected.length === 0) return null;
  return (
    <svg
      role="img"
      aria-labelledby="carte-titre carte-desc"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-auto w-full max-w-md rounded-card bg-sable-deep"
    >
      <title id="carte-titre">{title}</title>
      <desc id="carte-desc">{description}</desc>
      <path
        d={`M0 ${HEIGHT * 0.15} C ${WIDTH * 0.3} ${HEIGHT * 0.3}, ${WIDTH * 0.2} ${HEIGHT * 0.7}, ${WIDTH * 0.35} ${HEIGHT} L0 ${HEIGHT} Z`}
        fill="#cfd8d4"
        aria-hidden="true"
      />
      {projected.map((point) => (
        <g key={point.id}>
          <circle
            cx={point.x}
            cy={point.y}
            r={point.highlighted ? 8 : 5}
            fill={point.highlighted ? '#9e4521' : '#4a5a55'}
            stroke="#f4eee3"
            strokeWidth="2"
          />
          <text
            x={point.x + 11}
            y={point.y + 4}
            fontSize="12"
            fontWeight={point.highlighted ? 700 : 400}
            fill="#0f2a24"
          >
            {point.name}
          </text>
        </g>
      ))}
    </svg>
  );
};
