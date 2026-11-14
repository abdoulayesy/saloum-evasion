import type { Metadata } from 'next';
import { ogLocale, type Locale } from '@/i18n/routing';
import { absoluteUrl } from '@/lib/site';

// generateMetadata commun (contrat routes.md « Métadonnées communes »).

export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

export const DEFAULT_OG_IMAGE = {
  url: '/og-default.png',
  width: 1200,
  height: 630,
  alt: 'Saloum Évasion — séjours immersifs dans le Sine-Saloum',
} as const;

export type OgImage = { url: string; width: number; height: number; alt: string };

export type MetadataInput = {
  locale: Locale;
  /** Chemin de la page dans chaque langue publiée ; celui de `locale` est obligatoire. */
  paths: Partial<Record<Locale, string>>;
  title: string;
  description: string;
  image?: OgImage;
  noindex?: boolean;
  type?: 'website' | 'article';
};

const otherLocales = (locale: Locale, paths: MetadataInput['paths']): Locale[] => {
  const all: Locale[] = ['fr', 'en'];
  return all.filter((candidate) => candidate !== locale && paths[candidate] !== undefined);
};

export const buildMetadata = ({
  locale,
  paths,
  title,
  description,
  image = DEFAULT_OG_IMAGE,
  noindex = false,
  type = 'website',
}: MetadataInput): Metadata => {
  const ownPath = paths[locale];
  if (ownPath === undefined) throw new Error(`Chemin manquant pour la langue ${locale}`);
  // Constitution III : un dépassement fait échouer la construction plutôt que de publier.
  if (title.length === 0 || title.length > TITLE_MAX)
    throw new Error(`title de ${title.length} caractères (${ownPath}) : 1 à ${TITLE_MAX}`);
  if (description.length === 0 || description.length > DESCRIPTION_MAX)
    throw new Error(
      `description de ${description.length} caractères (${ownPath}) : 1 à ${DESCRIPTION_MAX}`,
    );
  const canonical = absoluteUrl(ownPath);

  const languages: Record<string, string> = {};
  if (paths.fr !== undefined) languages.fr = absoluteUrl(paths.fr);
  if (paths.en !== undefined) languages.en = absoluteUrl(paths.en);
  // x-default = version française, langue de référence (research R1).
  if (paths.fr !== undefined) languages['x-default'] = absoluteUrl(paths.fr);

  const imageUrl = image.url.startsWith('http') ? image.url : absoluteUrl(image.url);
  const images = [{ url: imageUrl, width: image.width, height: image.height, alt: image.alt }];

  return {
    title: { absolute: title },
    description,
    alternates: noindex ? undefined : { canonical, languages },
    openGraph: {
      type,
      locale: ogLocale[locale],
      alternateLocale: otherLocales(locale, paths).map((other) => ogLocale[other]),
      url: canonical,
      siteName: 'Saloum Évasion',
      title,
      description,
      images,
    },
    twitter: { card: 'summary_large_image', title, description, images: [imageUrl] },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
  };
};
