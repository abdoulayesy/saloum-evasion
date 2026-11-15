import { getImageProps } from 'next/image';
import { preload } from 'react-dom';
import type { Locale } from '@/i18n/routing';
import { siteUrl } from '@/lib/site';
import type { Media } from '@/payload-types';

// Photo du CMS (T074, constitution II) : optimisation next/image (AVIF/WebP, srcset, `sizes`
// mobile d'abord) mais rendue en <img> par le SERVEUR via `getImageProps` : aucun composant
// client à hydrater (le composant <Image> est un composant client, coûteux sur processeur
// lent). Image principale : préchargée dans le <head> en priorité haute, sans placeholder ;
// autres images : différées avec placeholder flou. Largeur et hauteur explicites (CLS nul).

type CmsImageProps = {
  media: Media | null;
  locale: Locale;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Qualité : 50 pour l'image principale (≤ 120 Ko à densité 3), 60 sinon. */
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
    quality: quality ?? (priority ? 50 : 60),
    loading: priority ? 'eager' : 'lazy',
    fetchPriority: priority ? 'high' : undefined,
    ...(blur ? { placeholder: 'blur' as const, blurDataURL: blur } : {}),
  });
  if (priority && props.srcSet) {
    preload(props.src, {
      as: 'image',
      imageSrcSet: props.srcSet,
      imageSizes: sizes,
      fetchPriority: 'high',
    });
  }
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- <img> optimisé par getImageProps (alt inclus)
  return <img {...props} className={className} />;
};

/** `sizes` de l'image principale : plafonne la largeur demandée à 1080 px sur mobile. */
export const HERO_SIZES = '(min-width: 1280px) 1280px, (min-width: 768px) 100vw, 360px';
