import type { TouristTrip } from 'schema-dts';
import type { Locale } from '@/i18n/routing';
import { organizationId } from './organization';

// Fiche séjour → TouristTrip (contrat jsonld.md) : programme jour par jour et offre en XOF.
// Toutes les valeurs viennent du CMS ; aucun avis ni note (principe V).

export type TripInput = {
  url: string;
  origin: string;
  locale: Locale;
  name: string;
  description: string;
  images: readonly string[];
  touristTypes: readonly string[];
  itinerary: readonly { day: number; title: string; description: string }[];
  priceFromXof: number;
  hasFaq: boolean;
};

export const tripId = (url: string): string => `${url}#trip`;
export const faqId = (url: string): string => `${url}#faq`;

export const buildTouristTrip = (input: TripInput): TouristTrip => ({
  '@type': 'TouristTrip',
  '@id': tripId(input.url),
  name: input.name,
  description: input.description,
  url: input.url,
  ...(input.images.length > 0 ? { image: [...input.images] } : {}),
  ...(input.touristTypes.length > 0 ? { touristType: [...input.touristTypes] } : {}),
  provider: { '@id': organizationId(input.origin) },
  itinerary: {
    '@type': 'ItemList',
    numberOfItems: input.itinerary.length,
    itemListElement: input.itinerary.map((day, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'TouristAttraction',
        name: day.title,
        ...(day.description ? { description: day.description } : {}),
      },
    })),
  },
  offers: {
    '@type': 'Offer',
    price: input.priceFromXof,
    priceCurrency: 'XOF',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: input.priceFromXof,
      priceCurrency: 'XOF',
      referenceQuantity: {
        '@type': 'QuantitativeValue',
        value: 1,
        unitText: input.locale === 'fr' ? 'personne' : 'person',
      },
    },
    availability: 'https://schema.org/InStock',
    url: input.url,
    seller: { '@id': organizationId(input.origin) },
  },
  ...(input.hasFaq ? { subjectOf: { '@id': faqId(input.url) } } : {}),
});
