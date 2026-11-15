import type { Locale } from '@/i18n/routing';
import type { SiteSettings } from '@/lib/site';
import type { Page, SiteSetting } from '@/payload-types';

export type PageBlock = NonNullable<Page['blocks']>[number];

export type BlockOf<T extends PageBlock['blockType']> = Extract<PageBlock, { blockType: T }>;

/** Contexte commun aux blocs : langue, coordonnées (source unique) et liens d'action. */
export type BlockContext = {
  locale: Locale;
  settings: SiteSettings;
  settingsGlobal: SiteSetting;
  whatsappHref: string | null;
};
