import { join } from 'node:path';
import { Font } from '@react-pdf/renderer';

// Polices du passeport (maquette) : Cormorant Garamond (titres, italique) et Manrope (texte),
// sous-ensembles latins TTF (licence OFL) dans `src/assets/fonts`, embarqués en sous-ensemble
// dans le PDF. Inclus au build par `outputFileTracingIncludes` (next.config.ts). Le moteur PDF
// ne sait pas lire les graisses d'une police variable : une graisse = un fichier.

const fontsDir = join(process.cwd(), 'src', 'assets', 'fonts');
const file = (name: string): string => join(fontsDir, name);

export const SERIF = 'Cormorant Garamond';
export const SANS = 'Manrope';

let registered = false;

export const registerPassportFonts = (): void => {
  if (registered) return;
  Font.register({
    family: SERIF,
    fonts: [
      { src: file('cormorant-garamond-latin-500-normal.ttf'), fontWeight: 500 },
      { src: file('cormorant-garamond-latin-600-normal.ttf'), fontWeight: 600 },
      { src: file('cormorant-garamond-latin-700-normal.ttf'), fontWeight: 700 },
      {
        src: file('cormorant-garamond-latin-500-italic.ttf'),
        fontWeight: 500,
        fontStyle: 'italic',
      },
    ],
  });
  Font.register({
    family: SANS,
    fonts: [
      { src: file('manrope-latin-400-normal.ttf'), fontWeight: 400 },
      { src: file('manrope-latin-500-normal.ttf'), fontWeight: 500 },
      { src: file('manrope-latin-600-normal.ttf'), fontWeight: 600 },
      { src: file('manrope-latin-700-normal.ttf'), fontWeight: 700 },
      { src: file('manrope-latin-800-normal.ttf'), fontWeight: 800 },
    ],
  });
  // Pas de césure automatique (les mots du français resteraient coupés au mauvais endroit).
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
};
