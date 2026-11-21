import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { tunnelLocale } from '@/app/(frontend)/[locale]/tunnel/locale';
import { getSiteSettings } from '@/lib/cms/siteSettings';
import { buildWhatsAppLink } from '@/lib/whatsapp';

// Étapes du tunnel (panier, commande, réservation) : colonne de lecture étroite et aide WhatsApp.

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

const StepsLayout = async ({ children, params }: Props) => {
  const locale = await tunnelLocale(params);
  const [t, settings] = await Promise.all([
    getTranslations({ locale, namespace: 'checkout' }),
    getSiteSettings(locale),
  ]);
  const whatsapp = buildWhatsAppLink({ number: settings.whatsapp, message: t('whatsappMessage') });
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      {children}
      {whatsapp ? (
        <p className="mt-10 border-t border-ink/10 pt-6">
          <a
            href={whatsapp}
            rel="noopener"
            className="inline-flex min-h-touch items-center font-semibold text-mangrove underline underline-offset-4"
          >
            {t('whatsappHelp')}
          </a>
        </p>
      ) : null}
    </div>
  );
};

export default StepsLayout;
