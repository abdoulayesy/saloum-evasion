import type fr from './messages/fr.json';
import type { routing } from './routing';

// Typage des clés de traduction et des locales (next-intl 4).
declare module 'next-intl' {
  // L'augmentation de module exige une interface.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof fr;
  }
}
