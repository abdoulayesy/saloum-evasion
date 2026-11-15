import type { TouristAttraction, TouristTrip } from 'schema-dts';
import { organizationId } from './organization';

// Fiche expérience (contrat jsonld.md) : deux nœuds valides au sens de schema.org.
// - TouristAttraction : le lieu de l'activité (géolocalisation, photos, univers). C'est un
//   `Place`, qui ne peut pas porter d'offre ;
// - TouristTrip : l'activité guidée elle-même, avec l'offre en XOF par personne et
//   l'attraction comme itinéraire.
// La destination est décrite en ligne tant que sa page n'est pas livrée ; aucune note ni avis.

export type AttractionInput = {
  url: string;
  origin: string;
  name: string;
  description: string;
  images: readonly string[];
  universeName: string | null;
  destination: { name: string; latitude: number; longitude: number } | null;
  pricePerPersonXof: number;
  hasFaq: boolean;
};

export const attractionId = (url: string): string => `${url}#attraction`;

export const buildTouristAttraction = (input: AttractionInput): TouristAttraction => ({
  '@type': 'TouristAttraction',
  '@id': attractionId(input.url),
  name: input.name,
  description: input.description,
  url: input.url,
  ...(input.images.length > 0 ? { image: [...input.images] } : {}),
  isAccessibleForFree: false,
  ...(input.universeName ? { touristType: input.universeName } : {}),
  ...(input.destination
    ? {
        containedInPlace: { '@type': 'Place', name: input.destination.name },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: input.destination.latitude,
          longitude: input.destination.longitude,
        },
      }
    : {}),
  ...(input.hasFaq ? { subjectOf: { '@id': `${input.url}#faq` } } : {}),
});

export const buildExperienceTrip = (input: AttractionInput): TouristTrip => ({
  '@type': 'TouristTrip',
  '@id': `${input.url}#trip`,
  name: input.name,
  description: input.description,
  url: input.url,
  ...(input.universeName ? { touristType: input.universeName } : {}),
  provider: { '@id': organizationId(input.origin) },
  itinerary: { '@id': attractionId(input.url) },
  offers: {
    '@type': 'Offer',
    price: input.pricePerPersonXof,
    priceCurrency: 'XOF',
    url: input.url,
    availability: 'https://schema.org/InStock',
    seller: { '@id': organizationId(input.origin) },
  },
});
