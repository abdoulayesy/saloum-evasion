import { describe, expect, it } from 'vitest';
import { durationBucket, guideClickEvent, pageType, routeTemplate } from '@/lib/analytics';

// T161 : propriétés des évènements sans identifiant (modèle de route, type de page, tranche).
describe('mesure d’audience', () => {
  it('modèle de route sans slug', () => {
    expect(routeTemplate('/fr')).toBe('/[locale]');
    expect(routeTemplate('/fr/sejours')).toBe('/[locale]/sejours');
    expect(routeTemplate('/fr/sejours/week-end-bolong-ndangane')).toBe('/[locale]/sejours/[slug]');
    expect(routeTemplate('/en/experiences/mangrove-and-islands')).toBe(
      '/[locale]/experiences/[universe]',
    );
    expect(routeTemplate('/en/experiences/mangrove-and-islands/pirogue-trip-bolongs')).toBe(
      '/[locale]/experiences/[universe]/[slug]',
    );
    expect(routeTemplate('/fr/demande/merci')).toBe('/[locale]/demande/merci');
    expect(routeTemplate('/fr/a-propos')).toBe('/[locale]/a-propos');
  });

  it('type de page', () => {
    expect(pageType('/fr')).toBe('home');
    expect(pageType('/fr/sejours')).toBe('stays_list');
    expect(pageType('/en/stays/x')).toBe('stay');
    expect(pageType('/fr/experiences')).toBe('experiences_hub');
    expect(pageType('/fr/experiences/u')).toBe('universe');
    expect(pageType('/fr/experiences/u/x')).toBe('experience');
    expect(pageType('/en/accommodation/x')).toBe('accommodation');
    expect(pageType('/fr/demande')).toBe('request');
    expect(pageType('/fr/demande/merci')).toBe('request_thanks');
    expect(pageType('/fr/faq')).toBe('faq');
  });

  it('tranche de durée de la demande', () => {
    expect(durationBucket(45_000)).toBe('<60s');
    expect(durationBucket(90_000)).toBe('60-120s');
    expect(durationBucket(150_000)).toBe('>120s');
  });
});

// T064 (004, US5, contracts/analytics-events.md) : clics mesurés depuis les guides et l'encart.
describe('mesure des Carnets du Saloum', () => {
  it('type de page des guides, de la rubrique et des auteurs', () => {
    expect(pageType('/fr/carnets-du-saloum')).toBe('guides_hub');
    expect(pageType('/en/saloum-travel-guides/dakar-to-ndangane')).toBe('guide');
    expect(pageType('/fr/equipe/awa-sarr')).toBe('author');
    expect(routeTemplate('/fr/carnets-du-saloum/mar-lodj')).toBe(
      '/[locale]/carnets-du-saloum/[slug]',
    );
  });

  it('clic vers une offre depuis un guide : guide, cible, langue', () => {
    expect(
      guideClickEvent(
        { kind: 'offer', guide: 'mar-lodj-ile-sans-voitures', value: 'destination' },
        'fr',
      ),
    ).toEqual({
      event: 'guide_offer_click',
      props: { guide: 'mar-lodj-ile-sans-voitures', target: 'destination', locale: 'fr' },
    });
  });

  it('clic sur une carte de l’encart : guide, type de fiche, langue', () => {
    expect(guideClickEvent({ kind: 'card', guide: 'serer-culture', value: 'stay' }, 'en')).toEqual({
      event: 'guide_card_click',
      props: { guide: 'serer-culture', from: 'stay', locale: 'en' },
    });
  });

  it('valeur inconnue ou guide absent : aucun évènement', () => {
    expect(guideClickEvent({ kind: 'offer', guide: 'x', value: 'transfer' }, 'fr')).toBeNull();
    expect(guideClickEvent({ kind: 'card', guide: '', value: 'stay' }, 'fr')).toBeNull();
  });
});
