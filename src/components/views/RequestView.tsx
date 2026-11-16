import { getTranslations } from 'next-intl/server';
import { RequestForm, type RequestFormLabels } from '@/components/client/RequestForm';
import { Container } from '@/components/ui/Container';
import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { populated } from '@/lib/cms/populated';
import type { DraftItem } from '@/lib/request/draft';
import type { ResolvedItem } from '@/lib/request/resolveItems';
import { BUDGET_BANDS, MOODS, todayDakar } from '@/lib/request/schema';
import type { SiteSettings } from '@/lib/site';
import type { CancellationPolicy } from '@/payload-types';

type RequestViewProps = {
  locale: Locale;
  settings: SiteSettings;
  items: readonly (ResolvedItem & { policy: CancellationPolicy | number | null | undefined })[];
  trip: { arrivalDate?: string; departureDate?: string; adults?: number; children?: number };
  submissionId: string;
  startedAt: number;
  sourcePath: string;
  whatsappHref: string | null;
};

// Page « Demander un séjour » (T145, FR-012 à FR-015) : noindex, sans JSON-LD ni fil
// d'Ariane (spec FR-025) ; titres des éléments résolus côté serveur dans la langue courante ;
// conditions d'annulation des séjours choisis au-dessus du bouton d'envoi (FR-036).
export const RequestView = async ({
  locale,
  settings,
  items,
  trip,
  submissionId,
  startedAt,
  sourcePath,
  whatsappHref,
}: RequestViewProps) => {
  const t = await getTranslations({ locale, namespace: 'request' });
  const tMoods = await getTranslations({ locale, namespace: 'moods' });
  const tBudgets = await getTranslations({ locale, namespace: 'budgets' });

  const labelKeys = [
    'itemsLegend',
    'itemsHint',
    'noItemsSelected',
    'datesLegend',
    'arrival',
    'departure',
    'travellersLegend',
    'adults',
    'children',
    'fewerAdults',
    'moreAdults',
    'fewerChildren',
    'moreChildren',
    'moodsLegend',
    'budgetLegend',
    'budgetAny',
    'contactLegend',
    'firstName',
    'dialCode',
    'whatsapp',
    'whatsappHint',
    'email',
    'emailHint',
    'message',
    'consent',
    'privacyLink',
    'cancellationTitle',
    'submit',
    'submitting',
    'errorsSummary',
    'rateLimited',
    'error',
    'offline',
    'whatsappFallback',
    'confirmationTitle',
    'datesWish',
    'sendWhatsapp',
    'backHome',
  ] as const;
  const labels: RequestFormLabels = Object.fromEntries(labelKeys.map((key) => [key, t(key)]));
  labels.reference = t('reference', { reference: '{reference}' });
  labels.kind_stay = t('kinds.stay');
  labels.kind_experience = t('kinds.experience');
  labels.kind_accommodation = t('kinds.accommodation');
  if (settings.responseTimeText) labels.responseTime = settings.responseTimeText;

  const errorCodes = [
    'arrival_in_past',
    'date_invalid',
    'departure_before_arrival',
    'adults_invalid',
    'first_name_required',
    'whatsapp_invalid',
    'email_invalid',
    'consent_required',
    'too_long',
    'too_many_items',
    'default',
  ] as const;
  const errorMessages = Object.fromEntries(errorCodes.map((code) => [code, t(`errors.${code}`)]));

  const draftItems: DraftItem[] = items.map((item) => ({
    kind: item.kind,
    slug: item.slug,
    title: item.title,
  }));
  const cancellationTerms = items.flatMap((item) => {
    const policy = populated<CancellationPolicy>(item.policy);
    return policy?.summary ? [{ title: item.title, summary: policy.summary }] : [];
  });

  return (
    <Container className="max-w-2xl py-8">
      <h1 className="text-mangrove">{t('title')}</h1>
      <p className="mt-3 text-lg text-ink-muted">
        {settings.responseTimeText
          ? t('intro', { responseTime: settings.responseTimeText })
          : t('introFallback')}
      </p>
      <div className="mt-8">
        <RequestForm
          locale={locale}
          submissionId={submissionId}
          startedAt={startedAt}
          sourcePath={sourcePath}
          initialItems={draftItems}
          initialTrip={trip}
          today={todayDakar()}
          moods={MOODS.map((value) => ({ value, label: tMoods(value) }))}
          budgets={BUDGET_BANDS.map((value) => ({ value, label: tBudgets(value) }))}
          cancellationTerms={cancellationTerms}
          privacyHref={buildPath(locale, { type: 'privacy' })}
          homeHref={buildPath(locale, { type: 'home' })}
          whatsappHref={whatsappHref}
          labels={labels}
          errorMessages={errorMessages}
        />
      </div>
    </Container>
  );
};
