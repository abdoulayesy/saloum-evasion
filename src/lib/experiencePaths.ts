import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { getAlternates } from '@/lib/cms/queries';
import { populated } from '@/lib/cms/populated';
import type { Experience, Universe } from '@/payload-types';

// Chemins publics d'une expérience et de son univers dans chaque langue publiée : l'URL d'une
// expérience contient le slug de son univers (contrat routes.md), traduit lui aussi.

export const universeSlugOf = (experience: Experience): string | null =>
  populated<Universe>(experience.universe)?.seo?.slug ?? null;

/** Chemin d'une expérience dans la langue de la page (univers déjà peuplé). */
export const experiencePath = (locale: Locale, experience: Experience): string | null => {
  const slug = experience.seo?.slug;
  const universe = universeSlugOf(experience);
  return slug && universe ? buildPath(locale, { type: 'experience', universe, slug }) : null;
};

const universeId = (experience: Experience): number | null => {
  const value = experience.universe;
  return typeof value === 'number' ? value : (value?.id ?? null);
};

/** Chemins FR/EN d'une expérience (EN seulement si l'expérience et son univers sont publiés en EN). */
export const experienceAlternates = async (
  experience: Experience,
): Promise<Partial<Record<Locale, string>>> => {
  const id = universeId(experience);
  if (id === null) return {};
  const [slugs, universeSlugs] = await Promise.all([
    getAlternates('experiences', experience.id),
    getAlternates('universes', id),
  ]);
  const paths: Partial<Record<Locale, string>> = {};
  for (const locale of ['fr', 'en'] as const) {
    const slug = slugs[locale];
    const universe = universeSlugs[locale];
    if (slug && universe) paths[locale] = buildPath(locale, { type: 'experience', universe, slug });
  }
  return paths;
};

/** Chemins FR/EN d'un univers d'expériences. */
export const universeAlternates = async (id: number): Promise<Partial<Record<Locale, string>>> => {
  const slugs = await getAlternates('universes', id);
  const paths: Partial<Record<Locale, string>> = {};
  for (const locale of ['fr', 'en'] as const) {
    const universe = slugs[locale];
    if (universe) paths[locale] = buildPath(locale, { type: 'universe', universe });
  }
  return paths;
};
