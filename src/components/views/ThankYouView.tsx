import { getTranslations } from 'next-intl/server';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { buildPath } from '@/i18n/pathnames';
import { htmlLang, type Locale } from '@/i18n/routing';

type ThankYouViewProps = {
  locale: Locale;
  reference: string | null;
  responseTime?: string;
  items: readonly string[];
  arrivalDate?: string;
  departureDate?: string;
  adults?: number;
  childCount: number;
  whatsappHref: string | null;
};

const formatDate = (locale: Locale, iso: string): string =>
  new Intl.DateTimeFormat(htmlLang[locale], { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00Z`),
  );

// Confirmation de la demande (T145, contrat request-form.md §4) : référence, récapitulatif,
// délai de réponse, « les dates sont des souhaits », bouton principal « Envoyer aussi sur
// WhatsApp », retour à l'accueil. Noindex, sans JSON-LD.
export const ThankYouView = async ({
  locale,
  reference,
  responseTime,
  items,
  arrivalDate,
  departureDate,
  adults,
  childCount,
  whatsappHref,
}: ThankYouViewProps) => {
  const t = await getTranslations({ locale, namespace: 'request' });
  return (
    <Container className="max-w-2xl py-8">
      <h1 className="text-mangrove">{t('thanksTitle')}</h1>
      <p className="mt-3 text-lg">{t('thanksBody')}</p>
      {reference && <p className="mt-4 text-xl font-semibold">{t('reference', { reference })}</p>}
      {responseTime && <p className="mt-2">{responseTime}</p>}

      {(items.length > 0 || arrivalDate) && (
        <section aria-labelledby="merci-recap" className="mt-6 rounded-card bg-white p-5">
          <h2 id="merci-recap" className="text-xl text-mangrove">
            {t('recapTitle')}
          </h2>
          <ul className="mt-2 list-disc pl-5">
            {items.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
          {arrivalDate && (
            <p className="mt-2">
              {departureDate
                ? t('recapDatesRange', {
                    arrival: formatDate(locale, arrivalDate),
                    departure: formatDate(locale, departureDate),
                  })
                : t('recapDates', { arrival: formatDate(locale, arrivalDate) })}
            </p>
          )}
          {adults !== undefined && <p>{t('recapTravellers', { adults, children: childCount })}</p>}
        </section>
      )}

      <p className="mt-4 text-ink-muted">{t('datesWish')}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {whatsappHref && (
          <ButtonLink href={whatsappHref} external variant="whatsapp" className="w-full sm:w-auto">
            {t('sendWhatsapp')}
          </ButtonLink>
        )}
        <ButtonLink
          href={buildPath(locale, { type: 'home' })}
          variant="secondary"
          className="w-full sm:w-auto"
        >
          {t('backHome')}
        </ButtonLink>
      </div>
    </Container>
  );
};
