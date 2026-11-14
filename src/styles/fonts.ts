import { Cormorant_Garamond, Manrope } from 'next/font/google';

// Constitution II : 2 familles maximum, auto-hébergées (next/font télécharge au build),
// sous-ensemble latin, font-display: swap.
// Cormorant : graisses 500 et 600 seulement (l'italique sera ajouté si la maquette l'exige).
export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal'],
  display: 'swap',
  adjustFontFallback: true,
  variable: '--font-cormorant',
});

// Manrope : police variable (une seule ressource pour 400 à 700).
export const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true,
  variable: '--font-manrope',
});

export const fontVariables = `${cormorant.variable} ${manrope.variable}`;
