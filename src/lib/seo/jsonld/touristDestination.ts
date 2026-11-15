import type { TouristAttraction, TouristDestination } from 'schema-dts';

// Destination (contrat jsonld.md, seo CHK017) : village ou île habitée → TouristDestination ;
// réserve naturelle → TouristAttraction. `@id` = `{url}#place` dans les deux cas, référencé
// par les fiches d'expériences et d'hébergements du lieu.

export type DestinationKind = 'village' | 'ile' | 'reserve';

export type DestinationInput = {
  url: string;
  kind: DestinationKind;
  name: string;
  description: string;
  images: readonly string[];
  latitude: number;
  longitude: number;
  /** URL des fiches d'expériences du lieu (attractions incluses). */
  attractionUrls: readonly string[];
};

export const placeId = (url: string): string => `${url}#place`;

const common = (input: DestinationInput) => ({
  '@id': placeId(input.url),
  name: input.name,
  description: input.description,
  url: input.url,
  ...(input.images.length > 0 ? { image: [...input.images] } : {}),
  geo: { '@type': 'GeoCoordinates' as const, latitude: input.latitude, longitude: input.longitude },
  containedInPlace: { '@type': 'Place' as const, name: 'Delta du Saloum, Sénégal' },
});

export const buildDestination = (
  input: DestinationInput,
): TouristDestination | TouristAttraction =>
  input.kind === 'reserve'
    ? { '@type': 'TouristAttraction', ...common(input), isAccessibleForFree: false }
    : {
        '@type': 'TouristDestination',
        ...common(input),
        ...(input.attractionUrls.length > 0
          ? {
              includesAttraction: input.attractionUrls.map((url) => ({
                '@id': `${url}#attraction`,
              })),
            }
          : {}),
      };
