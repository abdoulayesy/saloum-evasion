import { getImageProps } from 'next/image';
import type { Locale } from '@/i18n/routing';
import { siteUrl } from '@/lib/site';
import type { Media } from '@/payload-types';

// Photo du CMS (T074, constitution II) : optimisation next/image (AVIF/WebP, srcset, `sizes`
// mobile d'abord) mais rendue en <img> par le SERVEUR via `getImageProps` : aucun composant
// client à hydrater (le composant <Image> est un composant client, coûteux sur processeur
// lent). Image principale : chargement immédiat en priorité haute, sans placeholder ; React 19
// la précharge lui-même dans le <head> au rendu serveur (<img> non différée). Pas d'appel à
// preload() : cette indication s'appliquerait aussi quand Next précharge une page liée en
// arrière-plan, et téléchargerait l'image principale de chaque page liée ;
// autres images : différées avec placeholder flou. Largeur et hauteur explicites (CLS nul).

type CmsImageProps = {
  media: Media | null;
  locale: Locale;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Qualité : 50 par défaut (≤ 120 Ko à densité 3 pour l'image principale). */
  quality?: number;
};

/** URL relative si l'image est servie par le site lui-même (aucun domaine distant à déclarer). */
export const mediaSrc = (url: string): string => {
  const origin = siteUrl();
  return url.startsWith(origin) ? url.slice(origin.length) : url;
};

export const CmsImage = ({
  media,
  locale,
  sizes,
  priority = false,
  className = '',
  quality,
}: CmsImageProps) => {
  if (!media?.url || !media.width || !media.height) return null;
  const blur = !priority && media.blurDataURL ? media.blurDataURL : undefined;
  const { props } = getImageProps({
    src: mediaSrc(media.url),
    alt: media.alt[locale],
    width: media.width,
    height: media.height,
    sizes,
    // 50 partout : les images sous la ligne de flottaison sont chargées tôt sur mobile (seuil
    // de chargement différé de Chrome) et pèsent sur le LCP simulé en réseau lent.
    quality: quality ?? 50,
    loading: priority ? 'eager' : 'lazy',
    fetchPriority: priority ? 'high' : undefined,
    ...(blur ? { placeholder: 'blur' as const, blurDataURL: blur } : {}),
  });
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- <img> optimisé par getImageProps (alt inclus)
  return <img {...props} className={className} />;
};

/**
 * `sizes` des cartes : largeur du conteneur sur mobile (marges de 16 px), plafonnée à 360 px
 * dès 400 px d'écran, pour ne pas demander une image plus large que la carte.
 */
export const CARD_SIZES =
  '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, (min-width: 400px) 360px, calc(100vw - 2rem)';

/** Qualité des vignettes de cartes (sous la ligne de flottaison, chargées tôt sur mobile). */
export const CARD_QUALITY = 50;

/** `sizes` de l'image principale : plafonne la largeur demandée à 1080 px sur mobile. */
export const HERO_SIZES = '(min-width: 1280px) 1280px, (min-width: 768px) 100vw, 360px';
