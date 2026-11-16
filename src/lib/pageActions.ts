import { getTranslations } from 'next-intl/server';
import type { ActionLink } from '@/components/ui/StickyActionBar';
import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { isLive } from '@/lib/navigation';
import { absoluteUrl, type SiteSettings } from '@/lib/site';
import { buildWhatsAppLink } from '@/lib/whatsapp';

// Actions de la barre collante (FR-016, FR-017) : action principale selon le type de page
// (active dès que la page de demande est livrée, phase 8) et lien WhatsApp pré-rédigé avec
// le titre et l'adresse de la page.

export type PageKind = 'stay' | 'experience' | 'accommodation';

export const whatsappAction = async (
  locale: Locale,
  settings: SiteSettings,
  page: { title?: string; path: string },
): Promise<ActionLink | null> => {
  const t = await getTranslations({ locale, namespace: 'actions' });
  const url = absoluteUrl(page.path);
  const message = page.title
    ? t('whatsappMessage', { title: page.title, url })
    : t('whatsappGeneric', { url });
  const href = buildWhatsAppLink({ number: settings.whatsapp, message });
  return href ? { href, label: t('whatsapp'), ariaLabel: t('whatsappLabel') } : null;
};

/** Lien WhatsApp général (en-tête, menu, pied de page), avec l'adresse de l'accueil. */
export const siteWhatsappHref = async (
  locale: Locale,
  settings: SiteSettings,
): Promise<string | null> => {
  const t = await getTranslations({ locale, namespace: 'actions' });
  return buildWhatsAppLink({
    number: settings.whatsapp,
    message: t('whatsappGeneric', { url: absoluteUrl(buildPath(locale, { type: 'home' })) }),
  });
};

export const primaryAction = async (
  locale: Locale,
  kind: PageKind,
  slug: string,
  title: string,
): Promise<ActionLink | null> => {
  if (!isLive('request') || !slug) return null;
  const t = await getTranslations({ locale, namespace: 'actions' });
  const tRequest = await getTranslations({ locale, namespace: 'request' });
  const formHref = buildPath(locale, { type: 'request' });
  const href = `${formHref}?${kind}=${encodeURIComponent(slug)}`;
  return {
    href,
    label: kind === 'stay' ? t('requestStay') : t('addToRequest'),
    // Avec JavaScript, l'ajout passe par la « demande en cours » (T147).
    add: {
      kind,
      slug,
      title,
      formHref,
      addedMessage: tRequest('added', { title }),
      viewLabel: tRequest('viewRequest'),
      navigate: kind === 'stay',
    },
  };
};
