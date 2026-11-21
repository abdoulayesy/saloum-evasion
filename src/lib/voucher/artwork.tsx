import {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Svg,
  Text,
} from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { SANS, SERIF } from './fonts';
import type { IllustrationKind, Stamp } from './model';

// Dessins du passeport, transcrits de la maquette « Bon de réservation · Passeport ». Le moteur
// PDF ne gère ni les motifs SVG (`pattern`) ni le texte sur un chemin (`textPath`) : les fonds
// guillochés sont générés ici ligne à ligne, le texte des tampons placé lettre à lettre.

export const PAGE = { width: 559, height: 794 } as const;
const GOLD = '#D9B870';

/** Vagues répétées d'un fond guilloché (remplace les `pattern` de la maquette). */
const waveRows = (period: number, amplitude: number, spacing: number, offset: number): string[] => {
  const rows: string[] = [];
  for (let y = offset; y < PAGE.height + spacing; y += spacing) {
    let d = `M0 ${y} Q${period / 4} ${y - amplitude} ${period / 2} ${y}`;
    for (let x = period; x <= PAGE.width + period; x += period / 2) d += ` T${x} ${y}`;
    rows.push(d);
  }
  return rows;
};

const GREEN_WAVES = waveRows(140, 7, 14, 7);
const SAND_WAVES = waveRows(100, 9, 22, 11);

/** Fond papier : vagues vert d'eau et sable, rosace centrale optionnelle. */
export const Guilloche = ({ rosetteY }: { rosetteY?: number }) => (
  <Svg width={PAGE.width} height={PAGE.height} style={{ position: 'absolute', top: 0, left: 0 }}>
    {GREEN_WAVES.map((d) => (
      <Path key={d} d={d} fill="none" stroke="#8FB5A2" strokeWidth={0.6} strokeOpacity={0.55} />
    ))}
    {SAND_WAVES.map((d) => (
      <Path key={d} d={d} fill="none" stroke="#E0B386" strokeWidth={0.5} strokeOpacity={0.5} />
    ))}
    {rosetteY !== undefined && (
      <G transform={`translate(280 ${rosetteY})`}>
        {[0, 30, 60, 90, 120, 150].map((angle) => (
          <Ellipse
            key={angle}
            cx={0}
            cy={0}
            rx={170}
            ry={56}
            transform={`rotate(${angle})`}
            fill="none"
            stroke="#8FB5A2"
            strokeWidth={0.7}
            strokeOpacity={0.45}
          />
        ))}
        <Circle
          cx={0}
          cy={0}
          r={64}
          fill="none"
          stroke="#8FB5A2"
          strokeWidth={0.7}
          strokeOpacity={0.45}
        />
        <Circle
          cx={0}
          cy={0}
          r={70}
          fill="none"
          stroke="#8FB5A2"
          strokeWidth={0.7}
          strokeOpacity={0.45}
        />
      </G>
    )}
  </Svg>
);

/** Couverture et dos : reflet, double filet doré. */
export const CoverFrame = ({
  dashed = true,
  mirror = false,
}: {
  dashed?: boolean;
  mirror?: boolean;
}) => (
  <Svg width={PAGE.width} height={PAGE.height} style={{ position: 'absolute', top: 0, left: 0 }}>
    <Defs>
      <LinearGradient id="sheen" x1={mirror ? '1' : '0'} y1="0" x2={mirror ? '0' : '1'} y2="1">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.07} />
        <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0} />
        <Stop offset="1" stopColor="#000000" stopOpacity={0.25} />
      </LinearGradient>
    </Defs>
    <Rect x={0} y={0} width={PAGE.width} height={PAGE.height} fill="url(#sheen)" />
    <Rect
      x={22}
      y={22}
      width={515}
      height={750}
      rx={10}
      fill="none"
      stroke={GOLD}
      strokeOpacity={0.35}
      strokeWidth={1}
    />
    {dashed && (
      <Rect
        x={28}
        y={28}
        width={503}
        height={738}
        rx={8}
        fill="none"
        stroke={GOLD}
        strokeOpacity={0.2}
        strokeWidth={1}
        strokeDasharray="2 4"
      />
    )}
  </Svg>
);

/** Texte placé lettre à lettre sur un cercle (anneau des tampons et de l'emblème). */
const RingText = ({
  text,
  cx,
  cy,
  r,
  size,
  color,
  weight = 800,
}: {
  text: string;
  cx: number;
  cy: number;
  r: number;
  size: number;
  color: string;
  weight?: number;
}) => {
  const letters = [...text];
  const step = 360 / letters.length;
  return (
    <G>
      {letters.map((letter, index) => {
        const angle = -180 + index * step;
        const radians = (angle * Math.PI) / 180;
        const x = cx + r * Math.cos(radians);
        const y = cy + r * Math.sin(radians);
        return (
          <G key={`${letter}-${index}`} transform={`translate(${x} ${y}) rotate(${angle + 90})`}>
            <Text
              x={0}
              y={size / 3}
              textAnchor="middle"
              style={{ fontFamily: SANS, fontSize: size, fontWeight: weight }}
              fill={color}
            >
              {letter}
            </Text>
          </G>
        );
      })}
    </G>
  );
};

/** Emblème de la couverture : soleil sur la mangrove, pirogue, anneau de texte. */
export const Emblem = () => (
  <Svg width={230} height={230} viewBox="0 0 230 230">
    <Circle cx={115} cy={115} r={110} fill="none" stroke={GOLD} strokeWidth={2} />
    <Circle cx={115} cy={115} r={103} fill="none" stroke={GOLD} strokeWidth={1} />
    <Circle cx={115} cy={115} r={74} fill="none" stroke={GOLD} strokeWidth={1.5} />
    <RingText
      text="SALOUM ÉVASION · TERANGA · NDANGANE · "
      cx={115}
      cy={115}
      r={88}
      size={11}
      color={GOLD}
      weight={700}
    />
    <G stroke={GOLD} strokeWidth={2} strokeLinecap="round">
      <Path d="M115 62 v-10" />
      <Path d="M90 70 l-6 -8" />
      <Path d="M140 70 l6 -8" />
      <Path d="M73 88 l-9 -4" />
      <Path d="M157 88 l9 -4" />
    </G>
    <Path d="M85 112 a30 30 0 0 1 60 0 z" fill={GOLD} />
    <Path
      d="M58 120 q14 -8 28 0 t28 0 t28 0 t28 0 t28 0"
      fill="none"
      stroke={GOLD}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M58 132 q14 -8 28 0 t28 0 t28 0 t28 0 t28 0"
      fill="none"
      stroke={GOLD}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path d="M78 150 q37 9 76 0 l6 -6 q-6 16 -44 17 q-30 0 -42 -8 z" fill={GOLD} />
    <Rect x={112} y={128} width={4} height={22} rx={2} fill={GOLD} />
    <Circle cx={114} cy={124} r={4} fill={GOLD} />
    <Path d="M120 130 l-16 36" stroke={GOLD} strokeWidth={1.6} />
    <Path
      d="M64 160 q4 -26 -2 -44 M64 136 q-10 4 -14 -2 M64 128 q10 -2 14 -8"
      stroke={GOLD}
      strokeWidth={2.4}
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M166 160 q-4 -26 2 -44 M166 136 q10 4 14 -2 M166 128 q-10 -2 -14 -8"
      stroke={GOLD}
      strokeWidth={2.4}
      fill="none"
      strokeLinecap="round"
    />
    <Circle cx={115} cy={205} r={3} fill={GOLD} />
    <Circle cx={25} cy={115} r={3} fill={GOLD} />
    <Circle cx={205} cy={115} r={3} fill={GOLD} />
  </Svg>
);

/** Petite puce « carte » de la couverture. */
export const CardGlyph = () => (
  <Svg width={46} height={30} viewBox="0 0 46 30">
    <Rect x={1} y={1} width={44} height={28} rx={5} fill="none" stroke={GOLD} strokeWidth={1.6} />
    <Circle cx={23} cy={13} r={5} fill="none" stroke={GOLD} strokeWidth={1.6} />
    <Path d="M8 22 q7.5 -5 15 0 t15 0" fill="none" stroke={GOLD} strokeWidth={1.6} />
  </Svg>
);

/** Logo du dos de couverture. */
export const BrandMark = () => (
  <Svg width={64} height={64} viewBox="0 0 34 34">
    <Circle cx={17} cy={17} r={16} fill="none" stroke={GOLD} strokeWidth={1.4} />
    <Circle cx={17} cy={14} r={5} fill="none" stroke={GOLD} strokeWidth={1.4} />
    <Path d="M5 21 Q11 17 17 21 T29 21" fill="none" stroke={GOLD} strokeWidth={1.4} />
    <Path d="M6 25.5 Q11.5 22 17 25.5 T28 25.5" fill="none" stroke={GOLD} strokeWidth={1.4} />
  </Svg>
);

/** Bande de tissage sérère du dos de couverture. */
export const Weave = () => {
  const cells = Array.from({ length: 11 }, (_, index) => index * 40);
  return (
    <Svg width={439} height={20} viewBox="0 0 439 20" style={{ opacity: 0.7 }}>
      {cells.map((x) => (
        <G key={x}>
          <Path
            d={`M${x} 10 L${x + 10} 0 L${x + 20} 10 L${x + 10} 20 Z`}
            fill="none"
            stroke={GOLD}
            strokeWidth={1}
          />
          <Path
            d={`M${x + 20} 10 L${x + 30} 0 L${x + 40} 10 L${x + 30} 20 Z`}
            fill={GOLD}
            fillOpacity={0.55}
          />
        </G>
      ))}
    </Svg>
  );
};

/** Silhouette de l'emplacement photo (page du voyageur). */
export const Portrait = () => (
  <Svg width={100} height={118} viewBox="0 0 100 118">
    <Circle cx={50} cy={40} r={24} fill="#B9AA8E" />
    <Path d="M6 118 c4 -34 22 -48 44 -48 s40 14 44 48 z" fill="#B9AA8E" />
  </Svg>
);

/** Puce losange ocre (remplace « ◆ », absent du sous-ensemble latin des polices). */
export const Diamond = () => (
  <Svg width={7} height={7} viewBox="0 0 10 10" style={{ marginTop: 3 }}>
    <Path d="M5 0 L10 5 L5 10 L0 5 Z" fill="#9E4521" />
  </Svg>
);

/** Bulle de discussion (contact WhatsApp de l'étape). */
export const Bubble = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24">
    <Path
      d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-5A8 8 0 1 1 21 12z"
      fill="none"
      stroke="#9E4521"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

/** Tampon « payé » (ou « acompte ») de la page du voyageur. */
export const PaidStamp = ({ word, method }: { word: string; method: string }) => (
  <Svg width={112} height={112} viewBox="0 0 112 112">
    <Circle cx={56} cy={56} r={53} fill="none" stroke="#2E6B4F" strokeWidth={3} />
    <Circle cx={56} cy={56} r={33} fill="none" stroke="#2E6B4F" strokeWidth={1.5} />
    <RingText
      text={`${word} · SALOUM ÉVASION · `}
      cx={56}
      cy={56}
      r={43}
      size={8.5}
      color="#2E6B4F"
      weight={700}
    />
    <Text
      x={56}
      y={58}
      textAnchor="middle"
      style={{ fontFamily: SANS, fontSize: 14, fontWeight: 800 }}
      fill="#2E6B4F"
    >
      {word}
    </Text>
    <Text
      x={56}
      y={72}
      textAnchor="middle"
      style={{ fontFamily: SANS, fontSize: method.length > 6 ? 7 : 10, fontWeight: 700 }}
      fill="#2E6B4F"
    >
      {method}
    </Text>
  </Svg>
);

/** Tampon d'étape : rectangle (entrée, île, village) ou cercle (bolong, table, piste). */
export const StepStamp = ({ stamp }: { stamp: Stamp }) =>
  stamp.shape === 'rect' ? (
    <Svg width={190} height={104} viewBox="0 0 190 104">
      <Rect
        x={3}
        y={3}
        width={184}
        height={98}
        rx={10}
        fill="none"
        stroke={stamp.color}
        strokeWidth={3.5}
      />
      <Rect
        x={10}
        y={10}
        width={170}
        height={84}
        rx={6}
        fill="none"
        stroke={stamp.color}
        strokeWidth={1}
      />
      <Text
        x={95}
        y={34}
        textAnchor="middle"
        style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 800 }}
        fill={stamp.color}
      >
        SALOUM ÉVASION
      </Text>
      <Text
        x={95}
        y={62}
        textAnchor="middle"
        style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 700 }}
        fill={stamp.color}
      >
        {stamp.word}
      </Text>
      <Text
        x={95}
        y={82}
        textAnchor="middle"
        style={{ fontFamily: SANS, fontSize: 11, fontWeight: 800 }}
        fill={stamp.color}
      >
        {stamp.detail}
      </Text>
    </Svg>
  ) : (
    <Svg width={150} height={150} viewBox="0 0 150 150">
      <Circle cx={75} cy={75} r={71} fill="none" stroke={stamp.color} strokeWidth={3.5} />
      <Circle cx={75} cy={75} r={66} fill="none" stroke={stamp.color} strokeWidth={1} />
      <Circle cx={75} cy={75} r={44} fill="none" stroke={stamp.color} strokeWidth={1.6} />
      <RingText text={stamp.detail} cx={75} cy={75} r={55} size={10} color={stamp.color} />
      <Text
        x={75}
        y={80}
        textAnchor="middle"
        style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 700 }}
        fill={stamp.color}
      >
        {stamp.word}
      </Text>
    </Svg>
  );

/** Bandeau illustré de chaque étape (479 × 128), un par type de sortie. */
export const Illustration = ({ kind }: { kind: IllustrationKind }) => (
  <Svg width={479} height={128} viewBox="0 0 479 128" style={{ borderRadius: 10 }}>
    {/* Dégradés à la racine du dessin : le moteur PDF ignore ceux déclarés dans un groupe. */}
    <Defs>
      <LinearGradient id="sk" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#4A2848" />
        <Stop offset="0.75" stopColor="#E07B42" />
        <Stop offset="1" stopColor="#F2B064" />
      </LinearGradient>
    </Defs>
    {kind === 'road' && (
      <G>
        <Rect width={479} height={128} fill="#E9A15C" />
        <Rect width={479} height={60} fill="#C9694A" />
        <Circle cx={360} cy={78} r={22} fill="#FBD08C" />
        <Path d="M0 92 Q120 82 240 90 Q360 98 479 88 L479 128 L0 128 Z" fill="#8C4F2C" />
        <Path d="M200 128 L236 92 L246 92 L290 128 Z" fill="#5E3A24" />
        <Path
          d="M240 96 L240 100 M238 108 L236 116 M233 122 L231 128"
          stroke="#F4D9A8"
          strokeWidth={2}
        />
        <Path
          d="M70 92 L73 56 M73 56 Q58 48 50 52 M73 56 Q86 42 98 46 M73 56 L76 36"
          stroke="#2E1C14"
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
        />
        <Path d="M66 94 Q64 70 70 56 L78 56 Q82 72 80 94 Z" fill="#2E1C14" />
        <Path
          d="M420 90 L422 66 M422 66 Q412 60 406 62 M422 66 Q432 56 440 58"
          stroke="#2E1C14"
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />
      </G>
    )}
    {kind === 'pirogue' && (
      <G>
        <Rect width={479} height={80} fill="url(#sk)" />
        <Circle cx={330} cy={80} r={22} fill="#FBD08C" />
        <Rect y={80} width={479} height={48} fill="#2B1E2C" />
        <Path
          d="M0 80 Q40 64 80 72 Q120 58 170 70 L210 80 Z M380 80 Q410 66 440 70 Q460 62 479 66 L479 80 Z"
          fill="#140F1A"
        />
        <Rect x={310} y={86} width={40} height={2} fill="#F6B66A" fillOpacity={0.6} />
        <Rect x={318} y={94} width={24} height={2} fill="#F6B66A" fillOpacity={0.4} />
        <Path
          d="M120 108 Q190 116 280 110 L290 102 Q280 122 210 124 Q150 124 114 114 Z"
          fill="#0A0B10"
        />
        <Rect x={196} y={82} width={6} height={28} rx={3} fill="#0A0B10" />
        <Circle cx={199} cy={78} r={5} fill="#0A0B10" />
      </G>
    )}
    {kind === 'table' && (
      <G>
        <Rect width={479} height={128} fill="#1C2440" />
        <Circle cx={80} cy={30} r={1.5} fill="#F4EEE3" />
        <Circle cx={160} cy={18} r={1.2} fill="#F4EEE3" />
        <Circle cx={300} cy={26} r={1.5} fill="#F4EEE3" />
        <Circle cx={420} cy={14} r={1.2} fill="#F4EEE3" />
        <Circle cx={390} cy={34} r={14} fill="#F4E7C4" />
        <Rect y={88} width={479} height={40} fill="#6B3E26" />
        <Ellipse cx={240} cy={96} rx={110} ry={16} fill="#F4EEE3" />
        <Ellipse cx={240} cy={94} rx={92} ry={11} fill="#E3D9C6" />
        {[
          [190, 93],
          [222, 96],
          [256, 92],
          [288, 95],
        ].map(([x, y]) => (
          <G key={x}>
            <Ellipse cx={x} cy={y} rx={16} ry={6} fill="#7D7466" />
            <Ellipse cx={x} cy={(y ?? 0) - 1} rx={9} ry={3} fill="#EFE6D2" />
          </G>
        ))}
        <Rect x={96} y={58} width={22} height={30} rx={4} fill="#3A2A1E" />
        <Circle cx={107} cy={70} r={7} fill="#FFC56A" />
        <Circle cx={107} cy={70} r={20} fill="#FFC56A" fillOpacity={0.18} />
      </G>
    )}
    {kind === 'birds' && (
      <G>
        <Rect width={479} height={128} fill="#CFE2E4" />
        <Circle cx={400} cy={34} r={18} fill="#FFF3D6" />
        <Rect y={84} width={479} height={44} fill="#7FA6A8" />
        <Path d="M0 84 Q60 70 120 80 Q180 66 240 78 L260 84 Z" fill="#4F7A68" />
        <G fill="none" stroke="#24333A" strokeWidth={2.4} strokeLinecap="round">
          <Path d="M150 40 q10 -10 20 0 q10 -10 20 0" />
          <Path d="M200 26 q8 -8 16 0 q8 -8 16 0" />
          <Path d="M250 46 q12 -12 24 0 q12 -12 24 0" />
          <Path d="M310 30 q7 -7 14 0 q7 -7 14 0" />
          <Path d="M100 56 q8 -8 16 0 q8 -8 16 0" />
        </G>
        <Ellipse cx={330} cy={98} rx={16} ry={8} fill="#F4EEE3" />
        <Path d="M342 94 Q352 78 348 70 L352 70 Q358 82 348 98 Z" fill="#F4EEE3" />
        <Path d="M348 70 L366 74 L350 75 Z" fill="#E7A43D" />
        <Ellipse cx={380} cy={102} rx={14} ry={7} fill="#F4EEE3" />
        <Path d="M390 98 Q398 84 395 77 L399 77 Q404 88 395 102 Z" fill="#F4EEE3" />
        <Path d="M395 77 L411 81 L397 82 Z" fill="#E7A43D" />
      </G>
    )}
    {kind === 'baobab' && (
      <G>
        <Rect width={479} height={128} fill="#F0B56E" />
        <Circle cx={380} cy={44} r={20} fill="#FCE3B2" />
        <Path d="M0 82 Q120 64 240 78 Q360 92 479 72 L479 128 L0 128 Z" fill="#C4793F" />
        <Path d="M0 104 Q140 92 280 106 Q380 116 479 104 L479 128 L0 128 Z" fill="#9A5A2E" />
        <Path
          d="M330 80 L334 40 M334 40 Q318 30 308 34 M334 40 Q350 24 364 28 M334 40 L338 18"
          stroke="#2E1C14"
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
        />
        <Path d="M326 82 Q324 56 330 40 L340 40 Q344 58 342 82 Z" fill="#2E1C14" />
        <Circle cx={150} cy={108} r={11} fill="#1A1210" />
        <Circle cx={196} cy={108} r={11} fill="#1A1210" />
        <Path d="M140 100 L156 84 L188 84 L206 100 Z" fill="#1A1210" />
        <Circle cx={172} cy={70} r={7} fill="#1A1210" />
        <Rect x={167} y={75} width={10} height={12} fill="#1A1210" />
        <Path
          d="M126 112 Q100 110 70 118"
          stroke="#E7B585"
          strokeWidth={4}
          strokeOpacity={0.6}
          fill="none"
        />
      </G>
    )}
    {kind === 'village' && (
      <G>
        <Rect width={479} height={128} fill="#EBCB95" />
        <Circle cx={90} cy={36} r={18} fill="#F8E6BE" />
        <Rect y={96} width={479} height={32} fill="#B86A3A" />
        <Path
          d="M60 96 L64 50 M64 50 Q48 40 38 44 M64 50 Q80 34 94 38 M64 50 L68 28"
          stroke="#3A2418"
          strokeWidth={7}
          fill="none"
          strokeLinecap="round"
        />
        <Path d="M56 98 Q54 70 60 50 L70 50 Q74 72 72 98 Z" fill="#3A2418" />
        <Rect x={190} y={70} width={58} height={28} fill="#7A4A2A" />
        <Path d="M180 72 L219 36 L258 72 Z" fill="#5C3A22" />
        <Rect x={212} y={80} width={14} height={18} fill="#3A2418" />
        <Rect x={280} y={76} width={44} height={22} fill="#7A4A2A" />
        <Path d="M272 78 L302 50 L332 78 Z" fill="#5C3A22" />
        <Rect x={350} y={72} width={50} height={26} fill="#7A4A2A" />
        <Path d="M342 74 L375 42 L408 74 Z" fill="#5C3A22" />
        <Path
          d="M430 98 L430 70 M422 72 Q430 60 438 72"
          stroke="#5E7A3A"
          strokeWidth={3}
          fill="none"
        />
      </G>
    )}
  </Svg>
);

/**
 * QR code vectoriel (bibliothèque `qrcode` pour la matrice, tracé ici) : un seul chemin de
 * modules noirs, marge de 2 modules, correction d'erreurs M (lisible malgré un tampon ou un pli).
 */
export const QrCode = ({ text, size }: { text: string; size: number }) => {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const count = modules.size;
  let d = '';
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (modules.get(row, col)) d += `M${col} ${row}h1v1h-1z`;
    }
  }
  const quiet = 2;
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`${-quiet} ${-quiet} ${count + quiet * 2} ${count + quiet * 2}`}
    >
      <Rect
        x={-quiet}
        y={-quiet}
        width={count + quiet * 2}
        height={count + quiet * 2}
        fill="#FFFDF9"
      />
      <Path d={d} fill="#1B2A24" />
    </Svg>
  );
};
