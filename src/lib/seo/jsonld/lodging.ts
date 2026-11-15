import type { LodgingBusiness, VacationRental } from 'schema-dts';
import { organizationId } from './organization';
import { placeId } from './touristDestination';

// Fiche hébergement (contrat jsonld.md, seo CHK018) : VacationRental seulement pour une villa
// louée entière qui a un identifiant, un nombre de chambres et au moins 8 photos ; sinon
// LodgingBusiness. Les coordonnées sont celles du lieu, jamais le NAP de l'organisation.

export const VACATION_RENTAL_MIN_PHOTOS = 8;

export type LodgingInput = {
  url: string;
  origin: string;
  type: 'villa' | 'ecolodge' | 'campement';
  name: string;
  description: string;
  images: readonly string[];
  locality: string;
  latitude: number;
  longitude: number;
  amenities: readonly string[];
  bedrooms: number | null;
  capacity: number;
  identifier: string | null;
  priceRange: string;
  destinationUrl: string | null;
};

/** VacationRental éligible : villa entière avec les champs exigés par Google. */
export const isVacationRental = (input: LodgingInput): boolean =>
  input.type === 'villa' &&
  Boolean(input.identifier) &&
  (input.bedrooms ?? 0) > 0 &&
  input.images.length >= VACATION_RENTAL_MIN_PHOTOS;

export const buildLodging = (input: LodgingInput): LodgingBusiness | VacationRental => {
  const base = {
    '@id': `${input.url}#lodging`,
    name: input.name,
    description: input.description,
    url: input.url,
    ...(input.images.length > 0 ? { image: [...input.images] } : {}),
    address: {
      '@type': 'PostalAddress' as const,
      addressLocality: input.locality,
      addressCountry: 'SN',
    },
    geo: {
      '@type': 'GeoCoordinates' as const,
      latitude: input.latitude,
      longitude: input.longitude,
    },
    amenityFeature: input.amenities.map((name) => ({
      '@type': 'LocationFeatureSpecification' as const,
      name,
      value: true,
    })),
    ...(input.destinationUrl ? { containedInPlace: { '@id': placeId(input.destinationUrl) } } : {}),
  };
  if (isVacationRental(input)) {
    return {
      '@type': 'VacationRental',
      ...base,
      identifier: input.identifier ?? '',
      containsPlace: {
        '@type': 'Accommodation',
        occupancy: { '@type': 'QuantitativeValue', value: input.capacity },
        numberOfBedrooms: input.bedrooms ?? 0,
      },
    };
  }
  return {
    '@type': 'LodgingBusiness',
    ...base,
    ...(input.bedrooms ? { numberOfRooms: input.bedrooms } : {}),
    maximumAttendeeCapacity: input.capacity,
    priceRange: input.priceRange,
    parentOrganization: { '@id': organizationId(input.origin) },
  };
};
