import { randomUUID } from 'node:crypto';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { RequestView } from '@/components/views/RequestView';
import { buildPath } from '@/i18n/pathnames';
import { isLocale, type Locale } from '@/i18n/routing';
import { getStayBySlug } from '@/lib/cms/queries';
import { getSiteSettings } from '@/lib/cms/siteSettings';
import { tripFromSearch } from '@/lib/request/draft';
import { resolveItems } from '@/lib/request/resolveItems';
import { MAX_ITEMS, REQUEST_ITEM_KINDS, type RequestItemKind } from '@/lib/request/schema';
import { buildMetadata } from '@/lib/seo/metadata';
import { buildWhatsAppLink } from '@/lib/whatsapp';

// Route interne de la demande de séjour (T145). Les URL publiques `/fr/demande` et
// `/en/request` y sont réécrites par le middleware ; l'accès direct à `/…/request-form` donne
// une 404. Page dynamique (paramètres d'URL, identifiant d'envoi unique), isolée du résolveur
// des pages publiques, qui restent statiques.
export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const resolveLocale = async (params: PageProps['params']): Promise<Locale> => {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
};

const paths = {
  fr: buildPath('fr', { type: 'request' }),
  en: buildPath('en', { type: 'request' }),
};

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'request' });
  return buildMetadata({
    locale,
    paths,
    title: t('metaTitle'),
    description: t('metaDescription'),
    noindex: true,
  });
};

/** Éléments portés par l'URL : `?stay=slug&experience=slug…` (plusieurs valeurs possibles). */
const itemsFromSearch = (
  search: Record<string, string | string[] | undefined>,
): { kind: RequestItemKind; slug: string }[] =>
  REQUEST_ITEM_KINDS.flatMap((kind) => {
    const value = search[kind];
    const slugs = Array.isArray(value) ? value : value ? [value] : [];
    return slugs.filter((slug) => /^[a-z0-9-]{1,120}$/.test(slug)).map((slug) => ({ kind, slug }));
  }).slice(0, MAX_ITEMS);

const RequestPage = async ({ params, searchParams }: PageProps) => {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const search = await searchParams;
  const urlSearch = new URLSearchParams(
    Object.entries(search).flatMap(([key, value]) =>
      typeof value === 'string' ? [[key, value]] : [],
    ),
  );
  const [settings, resolved, tActions] = await Promise.all([
    getSiteSettings(locale),
    resolveItems(locale, itemsFromSearch(search)),
    getTranslations({ locale, namespace: 'actions' }),
  ]);
  const items = await Promise.all(
    resolved.map(async (item) => ({
      ...item,
      policy:
        item.kind === 'stay' ? (await getStayBySlug(locale, item.slug))?.cancellationPolicy : null,
    })),
  );
  const path = paths[locale];
  return (
    <RequestView
      locale={locale}
      settings={settings}
      items={items}
      trip={tripFromSearch(urlSearch)}
      submissionId={randomUUID()}
      startedAt={Date.now()}
      sourcePath={
        typeof search.from === 'string' && search.from.startsWith('/')
          ? search.from.slice(0, 300)
          : path
      }
      whatsappHref={buildWhatsAppLink({
        number: settings.whatsapp,
        message: tActions('whatsappGeneric', { url: `${path}` }),
      })}
    />
  );
};

export default RequestPage;
