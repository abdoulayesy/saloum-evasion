import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { primaryButtonClass } from '@/components/checkout/fieldStyles';
import { unsubscribeReminders } from '@/lib/cart/actions';
import { verifyReminderLinkToken } from '@/lib/cart/reminderLink';
import { tunnelLocale } from '@/app/(frontend)/[locale]/tunnel/locale';

// Désinscription des relances de paiement (002, US3, T079, FR-031) : `/fr/panier/desinscription
// ?t=…`. Un seul bouton (formulaire serveur, sans JavaScript) ; confirmation après envoi.

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const locale = await tunnelLocale(params);
  const t = await getTranslations({ locale, namespace: 'unsubscribe' });
  return { title: `${t('title')} | Saloum Évasion` };
};

const UnsubscribePage = async ({ params, searchParams }: Props) => {
  const locale = await tunnelLocale(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'unsubscribe' });
  const search = await searchParams;
  if (search.fait === '1') {
    return (
      <>
        <h1 className="text-mangrove">{t('title')}</h1>
        <p role="status" className="mt-6 rounded-control bg-sable-deep px-4 py-3 font-semibold">
          {t('done')}
        </p>
      </>
    );
  }
  const token = typeof search.t === 'string' ? search.t : '';
  if (!verifyReminderLinkToken(token, 'unsubscribe')) {
    return (
      <>
        <h1 className="text-mangrove">{t('title')}</h1>
        <p className="mt-6">{t('invalid')}</p>
      </>
    );
  }
  return (
    <>
      <h1 className="text-mangrove">{t('title')}</h1>
      <p className="mt-4">{t('intro')}</p>
      <form action={unsubscribeReminders} className="mt-6">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="t" value={token} />
        <button type="submit" className={primaryButtonClass}>
          {t('confirm')}
        </button>
      </form>
    </>
  );
};

export default UnsubscribePage;
