import { describe, expect, it } from 'vitest';
import { buildFaqPage } from '@/lib/seo/jsonld/faq';
import { buildTouristTrip } from '@/lib/seo/jsonld/touristTrip';

const origin = 'https://saloum-evasion.test';
const url = `${origin}/fr/sejours/week-end-bolong`;

const trip = buildTouristTrip({
  url,
  origin,
  locale: 'fr',
  name: 'Week-end bolong',
  description: 'Deux nuits au bord des bolongs.',
  images: [`${origin}/img/1.jpg`, `${origin}/img/2.jpg`],
  touristTypes: ['Nature', 'Détente'],
  itinerary: [
    { day: 1, title: 'Jour 1 — Arrivée', description: 'Accueil à Ndangane.' },
    { day: 2, title: 'Jour 2 — Bolongs', description: '' },
  ],
  priceFromXof: 180_000,
  hasFaq: true,
});

describe('JSON-LD fiche séjour', () => {
  it('TouristTrip : identifiants stables, fournisseur et vendeur = organisation', () => {
    expect(trip).toMatchObject({
      '@type': 'TouristTrip',
      '@id': `${url}#trip`,
      provider: { '@id': `${origin}/#org` },
      subjectOf: { '@id': `${url}#faq` },
    });
  });

  it('programme en ItemList numérotée', () => {
    expect(trip.itinerary).toMatchObject({
      '@type': 'ItemList',
      numberOfItems: 2,
      itemListElement: [
        { position: 1, item: { name: 'Jour 1 — Arrivée', description: 'Accueil à Ndangane.' } },
        { position: 2, item: { name: 'Jour 2 — Bolongs' } },
      ],
    });
  });

  it('offre en XOF entiers, prix par personne', () => {
    expect(trip.offers).toMatchObject({
      price: 180_000,
      priceCurrency: 'XOF',
      priceSpecification: { referenceQuantity: { value: 1, unitText: 'personne' } },
    });
  });

  it('aucun avis ni note (principe V)', () => {
    expect(JSON.stringify(trip)).not.toMatch(/aggregateRating|"review"/i);
  });

  it('FAQPage : questions visibles avec réponse texte', () => {
    expect(
      buildFaqPage(url, [{ question: 'Comment réserver ?', answer: 'Par la demande.' }]),
    ).toEqual({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Comment réserver ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Par la demande.' },
        },
      ],
    });
  });
});
