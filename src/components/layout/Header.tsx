import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { DialogOpener } from '@/components/client/DialogOpener';
import { HeaderFrame } from '@/components/client/HeaderFrame';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { LocaleNotices } from '@/components/client/LocaleNotices';
import { RequestCounter } from '@/components/client/RequestCounter';
import { buildPath } from '@/i18n/pathnames';
import { htmlLang, type Locale } from '@/i18n/routing';
import { getSiteSettings } from '@/lib/cms/siteSettings';
import { checkoutPath } from '@/lib/checkout/paths';
import { siteWhatsappHref } from '@/lib/pageActions';
import { BrandMark } from './BrandMark';
import { FOOTER_NAV_ID } from './Footer';
import { MENU_DIALOG_ID, MobileMenu } from './MobileMenu';

type HeaderProps = { locale: Locale };

// Sans `display` : les variantes (hidden, sm:inline-flex) ne doivent pas se contredire.
const controlBase =
  'min-h-touch min-w-touch items-center justify-center rounded-full px-3 font-semibold';
const controlClass = `inline-flex ${controlBase}`;

/** Accueil FR et EN : en-tête transparent par-dessus le héro. */
const HOME_PATHS = [buildPath('fr', { type: 'home' }), buildPath('en', { type: 'home' })];

/** Liens affichés en ligne dès 1280 px, libellés courts de la maquette « Accueil ». */
const desktopLinks = [
  { route: { type: 'film' }, label: 'navFilm' },
  { route: { type: 'staysList' }, label: 'navStays' },
  { route: { type: 'experiencesHub' }, label: 'navExperiences' },
  { route: { type: 'destinationsList' }, label: 'navDestinations' },
  { route: { type: 'commitment' }, label: 'navCommitment' },
] as const;

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
    <HeaderFrame homePaths={HOME_PATHS}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-1 gap-y-1 px-4 py-2 sm:px-8 lg:py-6">
        <Link
          href={buildPath(locale, { type: 'home' })}
          aria-label={t('homeLink')}
          className="inline-flex min-h-touch items-center gap-2 font-serif text-lg font-semibold text-sable sm:gap-3 sm:text-2xl sm:tracking-wide"
        >
          <BrandMark />
          <span>Saloum Évasion</span>
        </Link>
        <nav aria-label={t('mainNav')} className="hidden xl:block">
          <ul className="flex items-center gap-1 text-[0.9375rem] font-medium">
            {desktopLinks.map(({ route, label }) => (
              <li key={route.type}>
                <Link
                  href={buildPath(locale, route)}
                  className="inline-flex min-h-touch items-center rounded-full px-3 hover:text-[#f6c68a]"
                >
                  {t(label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
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
              className={`${controlBase} hidden px-0 transition-colors hover:text-gold sm:inline-flex xl:hidden`}
            >
              <WhatsAppIcon />
            </a>
          )}
          {/* Lien ordinaire (pas de préchargement) : le contrôleur calcule la page équivalente. */}
          <a
            href={switchHref}
            hrefLang={htmlLang[otherLocale]}
            lang={htmlLang[otherLocale]}
            aria-label={t('switchLanguageLabel')}
            className={`${controlClass} border border-sable/50 text-sm`}
          >
            {t('switchLanguage')}
          </a>
          <Link
            href={checkoutPath(locale, 'compose')}
            className={`${controlBase} hidden bg-ocre px-5 text-cream transition-colors hover:bg-ocre-deep md:inline-flex`}
          >
            {t('compose')}
          </Link>
          <DialogOpener
            dialogId={MENU_DIALOG_ID}
            fallbackHref={`#${FOOTER_NAV_ID}`}
            className={`${controlBase} inline-flex bg-sable text-mangrove lg:border lg:border-sable/50 lg:bg-transparent lg:text-sable`}
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
    </HeaderFrame>
  );
};
