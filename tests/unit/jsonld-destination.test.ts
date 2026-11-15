import { describe, expect, it } from 'vitest';
import { buildLodging, isVacationRental, type LodgingInput } from '@/lib/seo/jsonld/lodging';
import { buildDestination } from '@/lib/seo/jsonld/touristDestination';

const origin = 'https://saloum-evasion.test';

describe('JSON-LD destination', () => {
  const base = {
    url: `${origin}/fr/destinations/ndangane`,
    name: 'Ndangane',
    description: 'Village de pêcheurs.',
    images: [`${origin}/img/1.jpg`],
    latitude: 14.11,
    longitude: -16.76,
    attractionUrls: [`${origin}/fr/experiences/mangrove-et-iles/pirogue`],
  };

  it('village ou île → TouristDestination, attractions incluses', () => {
    for (const kind of ['village', 'ile'] as const) {
      expect(buildDestination({ ...base, kind })).toMatchObject({
        '@type': 'TouristDestination',
        '@id': `${base.url}#place`,
        geo: { latitude: 14.11, longitude: -16.76 },
        includesAttraction: [
          { '@id': `${origin}/fr/experiences/mangrove-et-iles/pirogue#attraction` },
        ],
      });
    }
  });

  it('réserve → TouristAttraction, même @id', () => {
    expect(buildDestination({ ...base, kind: 'reserve' })).toMatchObject({
      '@type': 'TouristAttraction',
      '@id': `${base.url}#place`,
    });
  });
});

describe('JSON-LD hébergement', () => {
  const villa: LodgingInput = {
    url: `${origin}/fr/hebergements/villa`,
    origin,
    type: 'villa',
    name: 'Villa avec piscine',
    description: 'Huit couchages au bord du bolong.',
    images: Array.from({ length: 8 }, (_, index) => `${origin}/img/${index}.jpg`),
    locality: 'Ndangane',
    latitude: 14.11,
    longitude: -16.76,
    amenities: ['Piscine', 'Wi-Fi'],
    bedrooms: 4,
    capacity: 8,
    identifier: 'SN-NDG-001',
    priceRange: 'À partir de 120 000 FCFA / nuit',
    destinationUrl: `${origin}/fr/destinations/ndangane`,
  };

  it('villa complète (identifiant, chambres, 8 photos) → VacationRental', () => {
    expect(isVacationRental(villa)).toBe(true);
    expect(buildLodging(villa)).toMatchObject({
      '@type': 'VacationRental',
      identifier: 'SN-NDG-001',
      containsPlace: { occupancy: { value: 8 }, numberOfBedrooms: 4 },
      containedInPlace: { '@id': `${origin}/fr/destinations/ndangane#place` },
    });
  });

  it('villa incomplète ou écolodge → LodgingBusiness avec équipements et capacité', () => {
    for (const input of [
      { ...villa, identifier: null },
      { ...villa, images: villa.images.slice(0, 7) },
      { ...villa, type: 'ecolodge' as const },
    ]) {
      expect(isVacationRental(input)).toBe(false);
      expect(buildLodging(input)).toMatchObject({
        '@type': 'LodgingBusiness',
        maximumAttendeeCapacity: 8,
        amenityFeature: [
          { name: 'Piscine', value: true },
          { name: 'Wi-Fi', value: true },
        ],
        address: { addressLocality: 'Ndangane', addressCountry: 'SN' },
        parentOrganization: { '@id': `${origin}/#org` },
      });
    }
  });

  it('aucun avis ni note', () => {
    expect(JSON.stringify(buildLodging(villa))).not.toMatch(/aggregateRating|"review"/i);
  });
});
