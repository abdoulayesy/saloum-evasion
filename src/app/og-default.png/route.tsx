import { renderOgImage } from '@/lib/seo/og';

// Image de partage par défaut (pages sans photo propre), générée au build.
export const dynamic = 'force-static';

export const GET = () =>
  renderOgImage({
    eyebrow: 'Ndangane · Sine-Saloum',
    title: 'Le Saloum, vécu de l’intérieur',
  });
