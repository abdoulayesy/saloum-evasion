import { describe, expect, it } from 'vitest';
import { formatDuration, formatSeason } from '@/lib/format';
import { buildExperienceTrip, buildTouristAttraction } from '@/lib/seo/jsonld/touristAttraction';

const origin = 'https://saloum-evasion.test';
const url = `${origin}/fr/experiences/mangrove-et-iles/pirogue`;

describe('JSON-LD fiche expérience', () => {
  const input = {
    url,
    origin,
    name: 'Pirogue dans les bolongs',
    description: 'Trois heures dans la mangrove.',
    images: [`${origin}/img/1.jpg`],
    universeName: 'Mangrove & îles',
    destination: { name: 'Ndangane', latitude: 14.11, longitude: -16.76 },
    pricePerPersonXof: 15_000,
    hasFaq: true,
  };
  const node = buildTouristAttraction(input);
  const trip = buildExperienceTrip(input);

  it('TouristAttraction (lieu) : géolocalisation, univers, FAQ, sans offre', () => {
    expect(node).toMatchObject({
      '@type': 'TouristAttraction',
      '@id': `${url}#attraction`,
      isAccessibleForFree: false,
      touristType: 'Mangrove & îles',
      containedInPlace: { '@type': 'Place', name: 'Ndangane' },
      geo: { latitude: 14.11, longitude: -16.76 },
      subjectOf: { '@id': `${url}#faq` },
    });
    expect(node).not.toHaveProperty('offers');
  });

  it('TouristTrip (activité) : offre XOF par personne, itinéraire = l’attraction', () => {
    expect(trip).toMatchObject({
      '@type': 'TouristTrip',
      '@id': `${url}#trip`,
      provider: { '@id': `${origin}/#org` },
      itinerary: { '@id': `${url}#attraction` },
      offers: { price: 15_000, priceCurrency: 'XOF', seller: { '@id': `${origin}/#org` } },
    });
  });

  it('aucun avis ni note', () => {
    expect(JSON.stringify([node, trip])).not.toMatch(/aggregateRating|"review"/i);
  });
});

describe('formats des faits clés', () => {
  it('durée', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(180)).toBe('3 h');
    expect(formatDuration(90)).toBe('1 h 30');
  });

  const names = (month: number) =>
    [
      'janvier',
      'février',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'août',
      'septembre',
      'octobre',
      'novembre',
      'décembre',
    ][month - 1] ?? '';
  const labels = {
    allYear: 'Toute l’année',
    range: (from: string, to: string) => `${from} à ${to}`,
  };

  it('saison : toute l’année, période continue (même à cheval sur l’année), liste sinon', () => {
    expect(formatSeason([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], names, labels)).toBe(
      'Toute l’année',
    );
    expect(formatSeason([11, 12, 1, 2, 3, 4], names, labels)).toBe('novembre à avril');
    expect(formatSeason([6, 7, 8], names, labels)).toBe('juin à août');
    expect(formatSeason([3], names, labels)).toBe('mars');
    expect(formatSeason([1, 3, 5], names, labels)).toBe('janvier, mars, mai');
    expect(formatSeason([], names, labels)).toBe('');
  });
});
