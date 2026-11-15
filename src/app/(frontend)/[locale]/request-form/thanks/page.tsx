import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ThankYouView } from '@/components/views/ThankYouView';
import { buildPath } from '@/i18n/pathnames';
import { isLocale, type Locale } from '@/i18n/routing';
import { getPayloadClient } from '@/lib/cms/queries';
import { getSiteSettings } from '@/lib/cms/siteSettings';
import { buildMetadata } from '@/lib/seo/metadata';
import { buildWhatsAppLink } from '@/lib/whatsapp';

// Route interne de la confirmation (T145) : `/fr/demande/merci` et `/en/request/thank-you`
// y sont réécrites. Sert la confirmation des envois sans JavaScript (redirection 303). Seuls la
// référence, les éléments et les dates sont montrés : aucune coordonnée personnelle, la
// référence pouvant circuler.
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

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'request' });
  return buildMetadata({
    locale,
    paths: {
      fr: buildPath('fr', { type: 'requestThanks' }),
      en: buildPath('en', { type: 'requestThanks' }),
    },
    title: t('thanksMetaTitle'),
    description: t('thanksMetaDescription'),
    noindex: true,
  });
};

const REFERENCE_PATTERN = /^SE-\d{8}-[A-Z0-9]{4}$/;

const ThanksPage = async ({ params, searchParams }: PageProps) => {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const { ref } = await searchParams;
  const reference = typeof ref === 'string' && REFERENCE_PATTERN.test(ref) ? ref : null;
  const [settings, t] = await Promise.all([
    getSiteSettings(locale),
    getTranslations({ locale, namespace: 'request' }),
  ]);
  const payload = await getPayloadClient();
  const found = reference
    ? (
        await payload.find({
          collection: 'requests',
          where: { reference: { equals: reference } },
          limit: 1,
          depth: 0,
        })
      ).docs[0]
    : undefined;
  const whatsappHref = buildWhatsAppLink({
    number: settings.whatsapp,
    message: reference
      ? t('whatsappRecap', {
          reference,
          firstName: '',
          arrival: found?.arrivalDate.slice(0, 10) ?? '',
          adults: found?.adults ?? 0,
          children: found?.children ?? 0,
          items: (found?.items ?? []).map((item) => item.titleSnapshot).join(', ') || t('noItems'),
        })
      : t('thanksBody'),
  });
  return (
    <ThankYouView
      locale={locale}
      reference={reference}
      responseTime={settings.responseTimeText}
      items={(found?.items ?? []).map((item) => item.titleSnapshot)}
      arrivalDate={found?.arrivalDate.slice(0, 10)}
      departureDate={found?.departureDate?.slice(0, 10)}
      adults={found?.adults}
      childCount={found?.children ?? 0}
      whatsappHref={whatsappHref}
    />
  );
};

export default ThanksPage;
