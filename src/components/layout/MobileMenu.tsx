import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { getSiteSettings } from '@/lib/cms/siteSettings';
import { isLive, liveMainNavigation } from '@/lib/navigation';
import { siteWhatsappHref } from '@/lib/pageActions';

export const MENU_DIALOG_ID = 'menu-principal';

type MobileMenuProps = { locale: Locale };

const closeButtonClass =
  'inline-flex min-h-touch min-w-touch items-center justify-center rounded-control border border-sable/60 px-4 font-semibold';

// Composant serveur (analyse K1) : menu plein écran dans un <dialog>, ouvert par
// DialogOpener. Boutons de fermeture en haut et en bas (pouce), sans JavaScript dédié :
// `<form method="dialog">` ferme nativement la fenêtre.
export const MobileMenu = async ({ locale }: MobileMenuProps) => {
  const t = await getTranslations({ locale, namespace: 'menu' });
  const tRoutes = await getTranslations({ locale, namespace: 'routes' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const tActions = await getTranslations({ locale, namespace: 'actions' });
  const whatsappHref = await siteWhatsappHref(locale, await getSiteSettings(locale));
  const items = [
    { href: buildPath(locale, { type: 'home' }), label: tCommon('home') },
    ...liveMainNavigation().map((route) => ({
      href: buildPath(locale, route),
      label: tRoutes(route.type),
    })),
    ...(isLive('request')
      ? [{ href: buildPath(locale, { type: 'request' }), label: tRoutes('request') }]
      : []),
  ];

  return (
    <dialog
      id={MENU_DIALOG_ID}
      aria-labelledby={`${MENU_DIALOG_ID}-titre`}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-mangrove p-4 text-sable backdrop:bg-scrim sm:p-8"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4">
          <h2 id={`${MENU_DIALOG_ID}-titre`} className="text-2xl">
            {t('title')}
          </h2>
          <form method="dialog">
            <button type="submit" className={closeButtonClass}>
              {t('close')}
            </button>
          </form>
        </div>
        <nav aria-label={t('navLabel')} className="mt-8 flex-1 overflow-y-auto">
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex min-h-touch items-center font-serif text-2xl underline-offset-4"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-touch w-full items-center justify-center rounded-control bg-ocre px-4 font-semibold text-white"
          >
            {tActions('whatsappLabel')}
          </a>
        )}
        <form method="dialog" className="pt-4">
          <button type="submit" className={`${closeButtonClass} w-full`}>
            {t('close')}
          </button>
        </form>
      </div>
    </dialog>
  );
};
