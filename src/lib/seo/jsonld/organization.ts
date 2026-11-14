import type { TravelAgency } from 'schema-dts';
import type { SiteSettings } from '@/lib/site';

// Organization + TravelAgency (toutes les pages indexables). TravelAgency hérite
// d'Organization dans schema.org : un seul type suffit et reste valide pour Google.
// Toutes les valeurs viennent de `siteSettings` (source unique du NAP) ; un champ absent
// n'est pas émis.

export const organizationId = (origin: string): string => `${origin}/#org`;

export const buildOrganization = (settings: SiteSettings, origin: string): TravelAgency => ({
  '@type': 'TravelAgency',
  '@id': organizationId(origin),
  name: settings.brandName,
  ...(settings.legalName ? { legalName: settings.legalName } : {}),
  url: `${origin}/fr`,
  logo: { '@type': 'ImageObject', url: `${origin}/logo-512.png`, width: '512', height: '512' },
  image: `${origin}/og-default.png`,
  ...(settings.phone ? { telephone: settings.phone } : {}),
  ...(settings.email ? { email: settings.email } : {}),
  address: {
    '@type': 'PostalAddress',
    ...(settings.streetAddress ? { streetAddress: settings.streetAddress } : {}),
    addressLocality: settings.locality,
    addressRegion: settings.region,
    ...(settings.postalCode ? { postalCode: settings.postalCode } : {}),
    addressCountry: settings.countryCode,
  },
  ...(settings.geo
    ? {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: settings.geo.latitude,
          longitude: settings.geo.longitude,
        },
      }
    : {}),
  areaServed: [{ '@type': 'Place', name: settings.areaServed }],
  currenciesAccepted: 'XOF',
  paymentAccepted: settings.paymentMethods.join(', '),
  ...(settings.whatsapp
    ? {
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            telephone: settings.whatsapp,
            availableLanguage: ['fr', 'en'],
          },
        ],
      }
    : {}),
  ...(settings.sameAs.length > 0 ? { sameAs: settings.sameAs } : {}),
});
