import { getRequestConfig } from 'next-intl/server';
import { isLocale, routing } from './routing';
import en from './messages/en.json';
import fr from './messages/fr.json';

const messages = { fr, en };

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isLocale(requested) ? requested : routing.defaultLocale;
  return { locale, messages: messages[locale] };
});
