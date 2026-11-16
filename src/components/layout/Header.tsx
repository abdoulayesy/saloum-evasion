import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { DialogOpener } from '@/components/client/DialogOpener';
import { LocaleNotices } from '@/components/client/LocaleNotices';
import { RequestCounter } from '@/components/client/RequestCounter';
import { buildPath } from '@/i18n/pathnames';
import { htmlLang, type Locale } from '@/i18n/routing';
import { getSiteSettings } from '@/lib/cms/siteSettings';
import { siteWhatsappHref } from '@/lib/pageActions';
import { FOOTER_NAV_ID } from './Footer';
import { MENU_DIALOG_ID, MobileMenu } from './MobileMenu';

type HeaderProps = { locale: Locale };

const controlClass =
  'inline-flex min-h-touch min-w-touch items-center justify-center rounded-control px-3 font-semibold';

/** Contrôleur de bascule de langue (page équivalente calculée côté serveur, US5). */
export const LOCALE_SWITCH_PATH = '/api/locale-switch';

// En-tête : logo, compteur de la demande en cours (T147, emplacement de 44 px réservé), lien
// WhatsApp (dès 640 px ; sur mobile il est dans le menu et la barre collante, T149),
// sélecteur de langue vers la page équivalente (T156 : la page d'origine est lue dans le
// Referer par le contrôleur, les pages restent statiques), bouton menu de 44 px ; avis de
// langue en surimpression (T156, T157).
export const Header = async ({ locale }: HeaderProps) => {
  const t = await getTranslations({ locale, namespace: 'header' });
  const tRequest = await getTranslations({ locale, namespace: 'request' });
  const tActions = await getTranslations({ locale, namespace: 'actions' });
  const otherLocale: Locale = locale === 'fr' ? 'en' : 'fr';
  const switchHref = `${LOCALE_SWITCH_PATH}?to=${otherLocale}`;
  const whatsappHref = await siteWhatsappHref(locale, await getSiteSettings(locale));

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
        <div className="flex flex-wrap items-center justify-end gap-1">
          <RequestCounter
            href={buildPath(locale, { type: 'request' })}
            label={tRequest('counter')}
            countLabelOne={tRequest('counterLabel', { count: 1 })}
            countLabelOther={tRequest('counterLabel', { count: 2 }).replace('2', '{count}')}
          />
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={tActions('whatsappLabel')}
              className={`${controlClass} hidden text-ocre-deep underline underline-offset-4 sm:inline-flex`}
            >
              {tActions('whatsapp')}
            </a>
          )}
          {/* Lien ordinaire (pas de préchargement) : le contrôleur calcule la page équivalente. */}
          <a
            href={switchHref}
            hrefLang={htmlLang[otherLocale]}
            lang={htmlLang[otherLocale]}
            aria-label={t('switchLanguageLabel')}
            className={`${controlClass} text-mangrove underline underline-offset-4`}
          >
            {t('switchLanguage')}
          </a>
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
      <LocaleNotices
        locale={locale}
        missingText={t('missingTranslation')}
        bannerText={t('englishBanner')}
        bannerLink={t('englishBannerLink')}
        switchHref={`${LOCALE_SWITCH_PATH}?to=en`}
        closeLabel={t('close')}
        bannerCloseLabel={t('bannerClose')}
      />
    </header>
  );
};
