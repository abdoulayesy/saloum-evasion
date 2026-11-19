import { getTranslations } from 'next-intl/server';
import { fieldClass, labelClass, primaryButtonClass } from '@/components/checkout/fieldStyles';
import type { Locale } from '@/i18n/routing';
import { resendManageLink } from '@/lib/booking/manageToken';

// « Retrouver ma réservation » (002, US4, T087) : `/fr/reservation/retrouver`. Formulaire serveur
// (référence + e-mail), sans JavaScript ; réponse identique que la réservation existe ou non.

export const BookingFindView = async ({
  locale,
  sent,
  limited,
}: {
  locale: Locale;
  sent: boolean;
  limited: boolean;
}) => {
  const t = await getTranslations({ locale, namespace: 'booking' });
  return (
    <>
      <h1 className="text-mangrove">{t('findTitle')}</h1>
      {sent && (
        <p role="status" className="mt-4 rounded-control bg-sable-deep px-4 py-3 font-semibold">
          {t('findSent')}
        </p>
      )}
      {limited && (
        <p
          role="alert"
          className="mt-4 rounded-control border-2 border-ocre px-4 py-3 font-semibold"
        >
          {t('findLimited')}
        </p>
      )}
      <p className="mt-4">{t('findIntro')}</p>
      <form action={resendManageLink} className="mt-6 flex flex-col gap-5">
        <input type="hidden" name="locale" value={locale} />
        <div aria-hidden="true" className="hidden">
          <label htmlFor="find-website">Site web</label>
          <input id="find-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="find-reference" className={labelClass}>
            {t('findReference')}
          </label>
          <input
            id="find-reference"
            name="reference"
            required
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="SE-XXXXXX"
            pattern="[Ss][Ee]-[A-Za-z0-9]{6}"
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="find-email" className={labelClass}>
            {t('findEmail')}
          </label>
          <input
            id="find-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={fieldClass}
          />
        </div>
        <button type="submit" className={primaryButtonClass}>
          {t('findSubmit')}
        </button>
      </form>
    </>
  );
};
