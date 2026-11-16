import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// T169 (WCAG 2.2 AA, 1.4.3 et 1.4.11) : contraste des paires de jetons réellement utilisées,
// lues dans globals.css (le test suit toute modification de couleur).
const css = readFileSync(join(process.cwd(), 'src', 'styles', 'globals.css'), 'utf8');

type Rgb = { r: number; g: number; b: number };

const token = (name: string): string => {
  const match = new RegExp(`--color-${name}:\\s*([^;]+);`).exec(css);
  if (!match?.[1]) throw new Error(`jeton --color-${name} introuvable`);
  return match[1].trim();
};

const parseHex = (hex: string): Rgb => {
  const value = hex.replace('#', '');
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
};

/** `rgb(15 42 36 / 0.72)` posé sur un fond opaque. */
const composite = (rgba: string, background: Rgb): Rgb => {
  const [r = 0, g = 0, b = 0, a = 1] = (rgba.match(/[\d.]+/g) ?? []).map(Number);
  return {
    r: r * a + background.r * (1 - a),
    g: g * a + background.g * (1 - a),
    b: b * a + background.b * (1 - a),
  };
};

const luminance = ({ r, g, b }: Rgb): number => {
  const channel = (value: number) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const ratio = (a: Rgb, b: Rgb): number => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
};

const color = (name: string): Rgb => parseHex(token(name));
const WHITE: Rgb = { r: 255, g: 255, b: 255 };

describe('contraste des jetons de couleur', () => {
  it.each([
    ['ink', 'sable'],
    ['ink', 'sable-deep'],
    ['ink-muted', 'sable'],
    ['ink-muted', 'sable-deep'],
    ['mangrove', 'sable'],
    ['ocre', 'sable'],
    ['ocre-deep', 'sable'],
    ['sable', 'mangrove'],
    ['sable', 'mangrove-soft'],
  ])('texte %s sur %s ≥ 4,5:1', (text, background) => {
    expect(ratio(color(text), color(background))).toBeGreaterThanOrEqual(4.5);
  });

  it.each([['ink'], ['ink-muted'], ['mangrove'], ['ocre'], ['ocre-deep']])(
    'texte %s sur blanc (cartes) ≥ 4,5:1',
    (text) => {
      expect(ratio(color(text), WHITE)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('texte blanc sur les boutons ocre ≥ 4,5:1', () => {
    expect(ratio(WHITE, color('ocre'))).toBeGreaterThanOrEqual(4.5);
  });

  it('texte sable sur le voile (scrim), même posé sur une photo blanche ≥ 4,5:1', () => {
    expect(ratio(color('sable'), composite(token('scrim'), WHITE))).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ['focus', 'sable', ''],
    ['focus', 'sable-deep', ''],
    ['focus', 'mangrove', 'focus-on-dark'],
    ['line', 'sable', ''],
    ['line', 'white', ''],
  ])('composant %s sur %s ≥ 3:1', (name, background, override) => {
    const foreground = color(override || name);
    const back = background === 'white' ? WHITE : color(background);
    expect(ratio(foreground, back)).toBeGreaterThanOrEqual(3);
  });
});
