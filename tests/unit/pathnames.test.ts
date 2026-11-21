import { describe, expect, it } from 'vitest';
import { buildPath, resolvePath, type Route } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { canonicalPathname, hasLocalePrefix } from '@/middleware';

const routes: Route[] = [
  { type: 'home' },
  { type: 'staysList' },
  { type: 'stay', slug: 'week-end-bolong' },
  { type: 'experiencesHub' },
  { type: 'universe', universe: 'mangrove-et-iles' },
  { type: 'experience', universe: 'mangrove-et-iles', slug: 'pirogue-au-coucher-du-soleil' },
  { type: 'accommodationsList' },
  { type: 'accommodation', slug: 'ecolodge-des-bolongs' },
  { type: 'destinationsList' },
  { type: 'destination', slug: 'mar-lodj' },
  { type: 'film' },
  { type: 'commitment' },
  { type: 'about' },
  { type: 'faq' },
  { type: 'contact' },
  { type: 'legal' },
  { type: 'privacy' },
  { type: 'request' },
  { type: 'requestThanks' },
  // 004 : Carnets du Saloum.
  { type: 'guidesHub' },
  { type: 'guide', slug: 'que-faire-au-sine-saloum' },
  { type: 'author', slug: 'aissatou-diop' },
];

const locales: Locale[] = ['fr', 'en'];

const segmentsOf = (path: string): string[] => path.split('/').filter(Boolean).slice(1);

describe('buildPath / resolvePath', () => {
  for (const locale of locales) {
    for (const route of routes) {
      it(`${locale} : aller-retour ${route.type}`, () => {
        const path = buildPath(locale, route);
        expect(path.startsWith(`/${locale}`)).toBe(true);
        expect(path).toBe(path.toLowerCase());
        expect(resolvePath(locale, segmentsOf(path))).toEqual(route);
      });
    }
  }

  it('segments traduits conformes au contrat', () => {
    expect(buildPath('fr', { type: 'stay', slug: 'week-end-bolong' })).toBe(
      '/fr/sejours/week-end-bolong',
    );
    expect(buildPath('en', { type: 'accommodationsList' })).toBe('/en/accommodation');
    expect(buildPath('fr', { type: 'requestThanks' })).toBe('/fr/demande/merci');
    expect(buildPath('en', { type: 'requestThanks' })).toBe('/en/request/thank-you');
    expect(buildPath('en', { type: 'legal' })).toBe('/en/legal-notice');
    expect(buildPath('fr', { type: 'guidesHub' })).toBe('/fr/carnets-du-saloum');
    expect(buildPath('en', { type: 'guide', slug: 'things-to-do' })).toBe(
      '/en/saloum-travel-guides/things-to-do',
    );
    expect(buildPath('fr', { type: 'author', slug: 'aissatou-diop' })).toBe(
      '/fr/equipe/aissatou-diop',
    );
    expect(buildPath('en', { type: 'author', slug: 'aissatou-diop' })).toBe(
      '/en/team/aissatou-diop',
    );
  });

  it('segments inconnus ou mal formés → null', () => {
    expect(resolvePath('fr', ['stays'])).toBeNull();
    expect(resolvePath('en', ['sejours'])).toBeNull();
    expect(resolvePath('fr', ['inconnu'])).toBeNull();
    expect(resolvePath('fr', ['sejours', 'Week_End'])).toBeNull();
    expect(resolvePath('fr', ['sejours', 'a', 'b'])).toBeNull();
    expect(resolvePath('fr', ['experiences', 'a', 'b', 'c'])).toBeNull();
    expect(resolvePath('fr', ['demande', 'thank-you'])).toBeNull();
    expect(resolvePath('fr', ['faq', 'x'])).toBeNull();
    expect(resolvePath('en', ['carnets-du-saloum'])).toBeNull();
    expect(resolvePath('fr', ['carnets-du-saloum', 'a', 'b'])).toBeNull();
    expect(resolvePath('fr', ['equipe'])).toBeNull();
    expect(resolvePath('fr', ['equipe', 'Aissatou'])).toBeNull();
    expect(resolvePath('en', ['team', 'a', 'b'])).toBeNull();
  });
});

describe('canonicalPathname (middleware)', () => {
  it('racine → /fr', () => expect(canonicalPathname('/')).toBe('/fr'));
  it('barre oblique finale supprimée', () =>
    expect(canonicalPathname('/fr/sejours/')).toBe('/fr/sejours'));
  it('minuscules', () => expect(canonicalPathname('/FR/Sejours')).toBe('/fr/sejours'));
  it('chemin canonique inchangé', () => expect(canonicalPathname('/en/stays')).toBe('/en/stays'));
});

describe('hasLocalePrefix (middleware)', () => {
  it('reconnaît /fr et /en, refuse le reste', () => {
    expect(hasLocalePrefix('/fr')).toBe(true);
    expect(hasLocalePrefix('/en/stays')).toBe(true);
    expect(hasLocalePrefix('/es')).toBe(false);
    expect(hasLocalePrefix('/sejours')).toBe(false);
    expect(hasLocalePrefix('/french')).toBe(false);
  });
});
