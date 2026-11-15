import type { Locale } from '@/i18n/routing';
import { toSiteSettings, type SiteSettings } from '@/lib/site';
import { getSiteSettingsGlobal } from './queries';

// Réglages du site lus dans le CMS (source unique du NAP), mis en cache et invalidés par le
// tag `global:siteSettings` à chaque enregistrement.
export const getSiteSettings = async (locale: Locale = 'fr'): Promise<SiteSettings> =>
  toSiteSettings(await getSiteSettingsGlobal(locale));
