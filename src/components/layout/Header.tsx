import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { DialogOpener } from '@/components/client/DialogOpener';
import { buildPath } from '@/i18n/pathnames';
import { htmlLang, type Locale } from '@/i18n/routing';
import { FOOTER_NAV_ID } from './Footer';
import { MENU_DIALOG_ID, MobileMenu } from './MobileMenu';

type HeaderProps = { locale: Locale };

const controlClass =
  'inline-flex min-h-touch min-w-touch items-center justify-center rounded-control px-3 font-semibold';

// En-tête : logo, sélecteur de langue (vers l'accueil de l'autre langue en attendant la
// bascule sur la page équivalente, US5), bouton menu de 44 px. Emplacement réservé au
// compteur de demande (phase 8).
export const Header = async ({ locale }: HeaderProps) => {
  const t = await getTranslations({ locale, namespace: 'header' });
  const otherLocale: Locale = locale === 'fr' ? 'en' : 'fr';

  return (
    <header className="border-b border-sable-deep bg-sable">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-8">
        <Link
          href={buildPath(locale, { type: 'home' })}
          aria-label={t('homeLink')}
          className="inline-flex min-h-touch items-center gap-2 font-serif text-xl font-semibold text-mangrove"
        >
          <svg aria-hidden="true" viewBox="0 0 64 64" width="32" height="32">
            <rect width="64" height="64" rx="14" fill="#0f2a24" />
            <path
              d="M12 40c8-6 14-6 20 0s12 6 20 0"
              fill="none"
              stroke="#f4eee3"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="40" cy="22" r="7" fill="#9e4521" />
          </svg>
          <span>Saloum Évasion</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href={buildPath(otherLocale, { type: 'home' })}
            hrefLang={htmlLang[otherLocale]}
            lang={htmlLang[otherLocale]}
            aria-label={t('switchLanguageLabel')}
            className={`${controlClass} text-mangrove underline underline-offset-4`}
          >
            {t('switchLanguage')}
          </Link>
          <DialogOpener
            dialogId={MENU_DIALOG_ID}
            fallbackHref={`#${FOOTER_NAV_ID}`}
            className={`${controlClass} bg-mangrove text-sable`}
          >
            {t('menu')}
          </DialogOpener>
        </div>
      </div>
      <MobileMenu locale={locale} />
    </header>
  );
};
