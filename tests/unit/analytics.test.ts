import { describe, expect, it } from 'vitest';
import { durationBucket, pageType, routeTemplate } from '@/lib/analytics';

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
