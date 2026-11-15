import type { CollectionConfig } from 'payload';
import { isLocale, routing, type Locale } from '@/i18n/routing';
import { documentPath, type RoutedCollection } from '@/lib/redirects/paths';
import { absoluteUrl } from '@/lib/site';

// Bouton « Aperçu » de l'admin (T070) : ouvre la page publique du document dans la langue
// éditée. Pour une expérience, le slug de l'univers est lu dans le CMS.

type Preview = NonNullable<NonNullable<CollectionConfig['admin']>['preview']>;

type Obj = Record<string, unknown>;

const isRecord = (value: unknown): value is Obj =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const seoSlug = (doc: Obj): string | null => {
  const seo = isRecord(doc.seo) ? doc.seo : null;
  return seo && typeof seo.slug === 'string' && seo.slug !== '' ? seo.slug : null;
};

export const previewFor =
  (collection: RoutedCollection): Preview =>
  async (doc, { locale, req }) => {
    const lang: Locale =
      typeof locale === 'string' && isLocale(locale) ? locale : routing.defaultLocale;
    let universeSlug: string | null = null;
    if (collection === 'experiences') {
      const universe = doc.universe;
      if (isRecord(universe)) universeSlug = seoSlug(universe);
      else if (typeof universe === 'number') {
        const found = await req.payload.findByID({
          collection: 'universes',
          id: universe,
          locale: lang,
          depth: 0,
          draft: true,
          overrideAccess: true,
          req,
        });
        universeSlug = found.seo?.slug ?? null;
      }
    }
    const path = documentPath({ collection, locale: lang, slug: seoSlug(doc), universeSlug });
    return path ? absoluteUrl(path) : null;
  };
