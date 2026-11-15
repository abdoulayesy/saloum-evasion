import { RichText } from '@payloadcms/richtext-lexical/react';
import { getTranslations } from 'next-intl/server';
import { Blocks } from '@/components/blocks/Blocks';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { MapIllustration } from '@/components/ui/MapIllustration';
import { ActionBarSpacer, StickyActionBar } from '@/components/ui/StickyActionBar';
import { buildPath, type Route } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { whatsappAction } from '@/lib/pageActions';
import { lexicalToPlainText } from '@/lib/richText';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbList } from '@/lib/seo/jsonld/breadcrumb';
import { buildFaqPage } from '@/lib/seo/jsonld/faq';
import { buildGraph } from '@/lib/seo/jsonld/graph';
import { buildOrganization } from '@/lib/seo/jsonld/organization';
import { buildWebPage, type EditorialPageType } from '@/lib/seo/jsonld/webPage';
import { absoluteUrl, siteUrl, type SiteSettings } from '@/lib/site';
import type { Destination, FaqItem, Page, SiteSetting } from '@/payload-types';

export type EditorialRoute = Extract<
  Route,
  { type: 'commitment' | 'about' | 'faq' | 'contact' | 'legal' | 'privacy' }
>;

type EditorialViewProps = {
  locale: Locale;
  route: EditorialRoute;
  page: Page;
  settings: SiteSettings;
  settingsGlobal: SiteSetting;
  faqItems: readonly FaqItem[];
  destinations: readonly Destination[];
};

const PAGE_TYPES: Record<EditorialRoute['type'], EditorialPageType> = {
  commitment: 'AboutPage',
  about: 'AboutPage',
  contact: 'ContactPage',
  faq: 'WebPage',
  legal: 'WebPage',
  privacy: 'WebPage',
};

const FAQ_CATEGORIES = ['general', 'reservation', 'paiement', 'transport', 'sejour'] as const;

/** Barre WhatsApp sur les pages de confiance ; pas sur les pages juridiques. */
const WITH_ACTION_BAR: ReadonlySet<EditorialRoute['type']> = new Set([
  'commitment',
  'about',
  'faq',
  'contact',
]);

// Pages institutionnelles (T134) : engagement, à propos, FAQ (FAQPage par catégorie), contact
// (coordonnées de la source unique, WhatsApp, carte), mentions légales et confidentialité.
export const EditorialView = async ({
  locale,
  route,
  page,
  settings,
  settingsGlobal,
  faqItems,
  destinations,
}: EditorialViewProps) => {
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const tActions = await getTranslations({ locale, namespace: 'actions' });
  const tFaq = await getTranslations({ locale, namespace: 'faqPage' });
  const tContact = await getTranslations({ locale, namespace: 'contact' });
  const title = page.title ?? '';
  const path = buildPath(locale, route);
  const url = absoluteUrl(path);
  const origin = siteUrl();
  const crumbs = buildBreadcrumbs({ locale, route });
  const whatsapp = await whatsappAction(locale, settings, { title, path });
  const blocks = page.blocks ?? [];
  const heroFirst = blocks[0]?.blockType === 'hero';
  const isFaq = route.type === 'faq';

  const graph = buildGraph([
    buildOrganization(settings, origin),
    buildBreadcrumbList(crumbs, url, origin),
    buildWebPage({
      type: PAGE_TYPES[route.type],
      url,
      origin,
      locale,
      name: title,
      description: page.seo?.metaDescription ?? '',
    }),
    ...(isFaq && faqItems.length > 0
      ? [
          buildFaqPage(
            url,
            faqItems.map((item) => ({
              question: item.question ?? '',
              answer: lexicalToPlainText(item.answer),
            })),
          ),
        ]
      : []),
  ]);

  const faqGroups = FAQ_CATEGORIES.map((category) => ({
    category,
    items: faqItems.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);

  return (
    <article>
      <JsonLd graph={graph} />
      <Breadcrumbs crumbs={crumbs} label={tCommon('breadcrumbLabel')} />
      {!heroFirst && (
        <Container className="pt-4">
          <h1 className="text-mangrove">{title}</h1>
        </Container>
      )}
      <Blocks
        blocks={blocks}
        pageTitle={heroFirst ? title : undefined}
        context={{ locale, settings, settingsGlobal, whatsappHref: whatsapp?.href ?? null }}
      />

      {isFaq &&
        faqGroups.map((group) => (
          <Container key={group.category} className="py-6">
            <section aria-labelledby={`faq-${group.category}`}>
              <h2 id={`faq-${group.category}`} className="text-mangrove">
                {tFaq(`categories.${group.category}`)}
              </h2>
              <div className="mt-4 flex flex-col gap-3">
                {group.items.map((item) => (
                  <details key={item.id} className="rounded-card bg-white p-4">
                    <summary className="flex min-h-touch cursor-pointer items-center font-semibold">
                      {item.question}
                    </summary>
                    <div className="rich-text mt-2">
                      {item.answer && <RichText data={item.answer} />}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          </Container>
        ))}

      {route.type === 'contact' && (
        <Container className="grid grid-cols-1 gap-8 py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section aria-labelledby="contact-joindre" className="min-w-0">
            <h2 id="contact-joindre" className="text-mangrove">
              {tContact('reach')}
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-3">
              <div>
                <dt className="text-sm font-semibold text-ocre">{tContact('address')}</dt>
                <dd>
                  <address className="not-italic">
                    <span className="block font-semibold">{settings.brandName}</span>
                    {settings.streetAddress && (
                      <span className="block">{settings.streetAddress}</span>
                    )}
                    <span className="block">
                      {settings.locality}, {settings.region}
                    </span>
                    <span className="block">{tContact('country')}</span>
                  </address>
                </dd>
              </div>
              {settings.phone && (
                <div>
                  <dt className="text-sm font-semibold text-ocre">{tContact('phone')}</dt>
                  <dd>
                    <a href={`tel:${settings.phone}`} className="underline underline-offset-4">
                      {settings.phone}
                    </a>
                  </dd>
                </div>
              )}
              {settings.email && (
                <div>
                  <dt className="text-sm font-semibold text-ocre">{tContact('email')}</dt>
                  <dd>
                    <a href={`mailto:${settings.email}`} className="underline underline-offset-4">
                      {settings.email}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            {whatsapp && (
              <ButtonLink
                href={whatsapp.href}
                external
                variant="whatsapp"
                className="mt-6 w-full sm:w-auto"
              >
                {tContact('whatsapp')}
              </ButtonLink>
            )}
          </section>
          {destinations.length > 0 && (
            <section aria-labelledby="contact-carte" className="min-w-0">
              <h2 id="contact-carte" className="text-mangrove">
                {tContact('map')}
              </h2>
              <div className="mt-3">
                <MapIllustration
                  title={tContact('map')}
                  description={`${settings.locality}, ${settings.region}`}
                  points={destinations.map((item) => ({
                    id: item.id,
                    name: item.name ?? '',
                    latitude: item.geo.latitude,
                    longitude: item.geo.longitude,
                    highlighted: item.name === settings.locality,
                  }))}
                />
              </div>
            </section>
          )}
        </Container>
      )}

      {WITH_ACTION_BAR.has(route.type) && (
        <>
          <StickyActionBar primary={null} whatsapp={whatsapp} label={tActions('barLabel')} />
          <ActionBarSpacer />
        </>
      )}
    </article>
  );
};
