import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { buildPath, type Route } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { isLive } from '@/lib/navigation';
import { siteWhatsappHref } from '@/lib/pageActions';
import { getSiteSettings } from '@/lib/cms/siteSettings';
import { BrandMark } from './BrandMark';

export const FOOTER_NAV_ID = 'navigation-pied';

type FooterProps = { locale: Locale };

const countryName: Record<Locale, string> = { fr: 'Sénégal', en: 'Senegal' };

type FooterRoute = Extract<
  Route,
  {
    type:
      | 'staysList'
      | 'request'
      | 'experiencesHub'
      | 'accommodationsList'
      | 'destinationsList'
      | 'guidesHub'
      | 'film'
      | 'commitment'
      | 'about'
      | 'contact'
      | 'faq'
      | 'legal'
      | 'privacy';
  }
>;

const columns: readonly { key: 'travel' | 'company' | 'help'; routes: readonly FooterRoute[] }[] = [
  {
    key: 'travel',
    routes: [
      { type: 'staysList' },
      { type: 'request' },
      { type: 'experiencesHub' },
      { type: 'accommodationsList' },
      { type: 'destinationsList' },
    ],
  },
  {
    key: 'company',
    routes: [
      { type: 'commitment' },
      { type: 'guidesHub' },
      { type: 'film' },
      { type: 'about' },
      { type: 'contact' },
    ],
  },
  { key: 'help', routes: [{ type: 'faq' }, { type: 'legal' }, { type: 'privacy' }] },
];

// Pied de page (maquette « Accueil ») : marque, trois colonnes de navigation (cible du menu
// sans JavaScript), coordonnées issues de la source unique, moyens de paiement Wave, Orange
// Money et carte au même rang (constitution VI).
export const Footer = async ({ locale }: FooterProps) => {
  const t = await getTranslations({ locale, namespace: 'footer' });
  const tRoutes = await getTranslations({ locale, namespace: 'routes' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const tActions = await getTranslations({ locale, namespace: 'actions' });
  const settings = await getSiteSettings(locale);
  const whatsappHref = await siteWhatsappHref(locale, settings);
  const linkClass =
    'inline-flex min-h-touch min-w-touch max-w-full items-center text-[#c9c0b0] [overflow-wrap:anywhere] transition-colors hover:text-sable';

  return (
    <footer className="mt-16 bg-forest text-[#c9c0b0]">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 pt-16 pb-10 sm:px-8 lg:px-16">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="flex max-w-xs flex-col gap-3">
            <Link
              href={buildPath(locale, { type: 'home' })}
              className="inline-flex min-h-touch items-center gap-3 font-serif text-[1.75rem] font-semibold text-sable"
            >
              <BrandMark size={30} />
              {settings.brandName}
            </Link>
            <p className="text-[0.9375rem] leading-relaxed">{t('tagline')}</p>
            <address className="text-[0.9375rem] leading-relaxed not-italic">
              {settings.streetAddress && <span className="block">{settings.streetAddress}</span>}
              <span className="block">
                {settings.locality}, {settings.region}, {countryName[locale]}
              </span>
              {settings.phone && <span className="block">{settings.phone}</span>}
              {settings.email && <span className="block">{settings.email}</span>}
            </address>
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex min-h-touch max-w-full items-center self-start rounded-full bg-ocre px-5 py-2 font-semibold text-cream"
              >
                {tActions('whatsappLabel')}
              </a>
            )}
          </div>

          <nav id={FOOTER_NAV_ID} aria-label={t('navLabel')} tabIndex={-1}>
            <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-x-6 gap-y-8 text-[0.9375rem] sm:grid-cols-[repeat(3,minmax(0,1fr))] sm:gap-x-12">
              {columns.map((column) => (
                <div key={column.key} className="flex flex-col">
                  <h2 className="mb-1 font-sans text-[0.9375rem] font-bold text-sable">
                    {t(column.key)}
                  </h2>
                  <ul className="flex flex-col">
                    {column.key === 'travel' && (
                      <li>
                        <Link href={buildPath(locale, { type: 'home' })} className={linkClass}>
                          {tCommon('home')}
                        </Link>
                      </li>
                    )}
                    {column.routes
                      .filter((route) => isLive(route.type))
                      .map((route) => (
                        <li key={route.type}>
                          <Link href={buildPath(locale, route)} className={linkClass}>
                            {tRoutes(route.type)}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </div>

        <section aria-labelledby="pied-paiement" className="flex flex-col gap-3">
          <h2 id="pied-paiement" className="font-sans text-[0.9375rem] font-bold text-sable">
            {t('paymentTitle')}
          </h2>
          <ul className="grid max-w-md grid-cols-3 gap-2">
            {settings.paymentMethods.map((method) => (
              <li
                key={method}
                className="flex min-h-touch min-w-0 items-center justify-center rounded-full border border-sable/40 px-2 text-center text-sm font-semibold text-sable"
              >
                {/* Texte agrandi à 200 % sur 320 px : coupure dans la case plutôt que débordement
                    (WCAG 1.4.4 et 1.4.10), les trois cases restant au même rang. */}
                <span className="min-w-0 break-words hyphens-auto">{method}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm">{t('paymentNote')}</p>
        </section>

        <div className="flex flex-col gap-2 border-t border-[#22382f] pt-6 text-[0.8125rem] sm:flex-row sm:justify-between">
          <span>
            © {new Date().getFullYear()} {settings.brandName} · {settings.locality},{' '}
            {countryName[locale]}. {t('rights')}
          </span>
          <span>{settings.paymentMethods.join(' · ')}</span>
        </div>
      </div>
    </footer>
  );
};
