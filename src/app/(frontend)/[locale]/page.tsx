// Page témoin du socle (T023), dotée des fondations SEO de la phase 2A (métadonnées,
// hreflang, JSON-LD Organization + WebSite). Remplacée par l'accueil en T096.
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildPath } from '@/i18n/pathnames';
import { isLocale, routing, type Locale } from '@/i18n/routing';
import { buildGraph } from '@/lib/seo/jsonld/graph';
import { buildOrganization } from '@/lib/seo/jsonld/organization';
import { buildWebSite } from '@/lib/seo/jsonld/website';
import { buildMetadata } from '@/lib/seo/metadata';
import { getSiteSettings } from '@/lib/cms/siteSettings';
import { siteUrl } from '@/lib/site';

type PageProps = { params: Promise<{ locale: string }> };

const copy = {
  fr: {
    title: 'Saloum Évasion — séjours immersifs dans le Sine-Saloum',
    description:
      'Séjours tout compris à Ndangane et dans les îles du Sine-Saloum : hébergement, expériences, table locale et transfert en une seule demande.',
    heading: 'Le Saloum, vécu de l’intérieur',
    intro: 'Séjours immersifs à Ndangane et dans les îles du Sine-Saloum. Site en construction.',
  },
  en: {
    title: 'Saloum Évasion — immersive stays in Sine-Saloum',
    description:
      'All-inclusive stays in Ndangane and the Sine-Saloum islands: lodging, experiences, local food and transfer in a single request.',
    heading: 'The Saloum, lived from within',
    intro: 'Immersive stays in Ndangane and the Sine-Saloum islands. Site under construction.',
  },
} as const;

const resolveLocale = (value: string): Locale => (isLocale(value) ? value : routing.defaultLocale);

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const locale = resolveLocale((await params).locale);
  return buildMetadata({
    locale,
    paths: { fr: buildPath('fr', { type: 'home' }), en: buildPath('en', { type: 'home' }) },
    title: copy[locale].title,
    description: copy[locale].description,
  });
};

const HomePage = async ({ params }: PageProps) => {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const text = copy[locale];
  const settings = await getSiteSettings(locale);
  const origin = siteUrl();
  const graph = buildGraph([
    buildOrganization(settings, origin),
    buildWebSite(origin, locale, settings.brandName),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col justify-center gap-6 px-4 py-12 sm:px-8">
      <JsonLd graph={graph} />
      <p className="text-sm font-semibold tracking-wide text-ocre uppercase">Saloum Évasion</p>
      <h1 className="text-mangrove">{text.heading}</h1>
      <p className="text-lg text-ink-muted">{text.intro}</p>
    </div>
  );
};

export default HomePage;
