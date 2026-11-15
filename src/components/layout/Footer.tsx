import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { liveLegalNavigation, liveMainNavigation } from '@/lib/navigation';
import { getSiteSettings } from '@/lib/cms/siteSettings';

export const FOOTER_NAV_ID = 'navigation-pied';

type FooterProps = { locale: Locale };

const countryName: Record<Locale, string> = { fr: 'Sénégal', en: 'Senegal' };

// Pied de page : navigation (cible du menu sans JavaScript), coordonnées issues de la
// source unique, moyens de paiement Wave, Orange Money et carte au même rang (constitution VI).
export const Footer = async ({ locale }: FooterProps) => {
  const t = await getTranslations({ locale, namespace: 'footer' });
  const tRoutes = await getTranslations({ locale, namespace: 'routes' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const settings = await getSiteSettings(locale);
  const links = [
    { href: buildPath(locale, { type: 'home' }), label: tCommon('home') },
    ...[...liveMainNavigation(), ...liveLegalNavigation()].map((route) => ({
      href: buildPath(locale, route),
      label: tRoutes(route.type),
    })),
  ];

  return (
    <footer className="mt-16 bg-mangrove text-sable">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 sm:px-8 md:grid-cols-3">
        <div>
          <p className="font-serif text-2xl font-semibold">{settings.brandName}</p>
          <p className="mt-3 text-sable/90">{t('tagline')}</p>
        </div>

        <nav id={FOOTER_NAV_ID} aria-label={t('navLabel')} tabIndex={-1}>
          <ul className="flex flex-col">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-touch min-w-touch items-center underline underline-offset-4"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-8">
          <section aria-labelledby="pied-contact">
            <h2 id="pied-contact" className="text-xl">
              {t('contactTitle')}
            </h2>
            <address className="mt-2 text-sable/90 not-italic">
              {settings.streetAddress && <span className="block">{settings.streetAddress}</span>}
              <span className="block">
                {settings.locality}, {settings.region}
              </span>
              <span className="block">{countryName[locale]}</span>
              {settings.phone && <span className="block">{settings.phone}</span>}
              {settings.email && <span className="block">{settings.email}</span>}
            </address>
          </section>

          <section aria-labelledby="pied-paiement">
            <h2 id="pied-paiement" className="text-xl">
              {t('paymentTitle')}
            </h2>
            <ul className="mt-3 grid grid-cols-3 gap-2">
              {settings.paymentMethods.map((method) => (
                <li
                  key={method}
                  className="flex min-h-touch items-center justify-center rounded-control border border-sable/60 px-2 text-center text-sm font-semibold"
                >
                  {method}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-sable/90">{t('paymentNote')}</p>
          </section>
        </div>
      </div>
      <p className="border-t border-sable/20 px-4 py-4 text-center text-sm text-sable/90 sm:px-8">
        © {new Date().getFullYear()} {settings.brandName}. {t('rights')}
      </p>
    </footer>
  );
};
