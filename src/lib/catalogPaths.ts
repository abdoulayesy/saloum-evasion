import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { getAlternates } from '@/lib/cms/queries';
import { isLive } from '@/lib/navigation';
import type { Accommodation, Destination } from '@/payload-types';

// Chemins publics des destinations et des hébergements, dans la langue de la page et dans
// chaque langue publiée (hreflang). `null` tant que le type de page n'est pas livré.

export const destinationPath = (locale: Locale, destination: Destination): string | null => {
  const slug = destination.seo?.slug;
  return slug && isLive('destination') ? buildPath(locale, { type: 'destination', slug }) : null;
};

export const accommodationPath = (locale: Locale, accommodation: Accommodation): string | null => {
  const slug = accommodation.seo?.slug;
  return slug && isLive('accommodation')
    ? buildPath(locale, { type: 'accommodation', slug })
    : null;
};

export const destinationAlternates = async (
  id: number,
): Promise<Partial<Record<Locale, string>>> => {
  const slugs = await getAlternates('destinations', id);
  const paths: Partial<Record<Locale, string>> = {};
  for (const locale of ['fr', 'en'] as const) {
    const slug = slugs[locale];
    if (slug) paths[locale] = buildPath(locale, { type: 'destination', slug });
  }
  return paths;
};

export const accommodationAlternates = async (
  id: number,
): Promise<Partial<Record<Locale, string>>> => {
  const slugs = await getAlternates('accommodations', id);
  const paths: Partial<Record<Locale, string>> = {};
  for (const locale of ['fr', 'en'] as const) {
    const slug = slugs[locale];
    if (slug) paths[locale] = buildPath(locale, { type: 'accommodation', slug });
  }
  return paths;
};

export const relationId = (value: number | { id: number } | null | undefined): number | null =>
  typeof value === 'number' ? value : (value?.id ?? null);
