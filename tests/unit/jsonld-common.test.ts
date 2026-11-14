import { describe, expect, it } from 'vitest';
import { serializeJsonLd } from '@/components/seo/JsonLd';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbList } from '@/lib/seo/jsonld/breadcrumb';
import { buildGraph } from '@/lib/seo/jsonld/graph';
import { buildItemList } from '@/lib/seo/jsonld/itemList';
import { buildOrganization, organizationId } from '@/lib/seo/jsonld/organization';
import { buildWebSite } from '@/lib/seo/jsonld/website';
import { DEFAULT_SITE_SETTINGS, toSiteSettings, type SiteSettings } from '@/lib/site';

const origin = 'https://saloum-evasion.test';

const fullSettings: SiteSettings = {
  brandName: 'Saloum Évasion',
  legalName: 'Saloum Évasion SARL',
  locality: 'Ndangane',
  region: 'Fatick',
  countryCode: 'SN',
  phone: '+221 33 000 00 00',
  whatsapp: '+221 77 000 00 00',
  email: 'contact@example.test',
  areaServed: 'Delta du Sine-Saloum',
  sameAs: ['https://www.instagram.com/example'],
  paymentMethods: ['Wave', 'Orange Money', 'Carte bancaire'],
};

describe('JSON-LD communs', () => {
  it('Organization : @id stable, NAP issu des réglages, devise XOF', () => {
    const org = buildOrganization(fullSettings, origin);
    expect(org).toMatchObject({
      '@type': 'TravelAgency',
      '@id': `${origin}/#org`,
      name: 'Saloum Évasion',
      telephone: '+221 33 000 00 00',
      currenciesAccepted: 'XOF',
      paymentAccepted: 'Wave, Orange Money, Carte bancaire',
      address: { addressLocality: 'Ndangane', addressCountry: 'SN' },
    });
    expect(organizationId(origin)).toBe(`${origin}/#org`);
  });

  it('Organization : aucun champ inventé quand une coordonnée manque', async () => {
    const org = buildOrganization(toSiteSettings({}), origin);
    expect(toSiteSettings({ phone: '  ', sameAs: [{ url: '' }] })).toEqual(DEFAULT_SITE_SETTINGS);
    const json = JSON.stringify(org);
    expect(json).not.toContain('telephone');
    expect(json).not.toContain('contactPoint');
    expect(json).not.toContain('sameAs');
  });

  it('aucun avis ni note (principe V)', () => {
    const graph = buildGraph([
      buildOrganization(fullSettings, origin),
      buildWebSite(origin, 'fr', 'Saloum Évasion'),
    ]);
    const json = JSON.stringify(graph);
    expect(json).not.toMatch(/aggregateRating|"review"/i);
  });

  it('WebSite : langue et éditeur', () => {
    expect(buildWebSite(origin, 'en', 'Saloum Évasion')).toMatchObject({
      '@id': `${origin}/#website`,
      url: `${origin}/en`,
      inLanguage: 'en',
      publisher: { '@id': `${origin}/#org` },
    });
  });

  it('BreadcrumbList identique au fil visible, dernier élément sans item', () => {
    const crumbs = buildBreadcrumbs({
      locale: 'fr',
      route: { type: 'experience', universe: 'mangrove-et-iles', slug: 'pirogue' },
      currentName: 'Pirogue au coucher du soleil',
      universeName: 'Mangrove & îles',
    });
    expect(crumbs.map((crumb) => crumb.name)).toEqual([
      'Accueil',
      'Expériences',
      'Mangrove & îles',
      'Pirogue au coucher du soleil',
    ]);
    const list = buildBreadcrumbList(
      crumbs,
      `${origin}/fr/experiences/mangrove-et-iles/pirogue`,
      origin,
    );
    expect(list.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${origin}/fr` },
      { '@type': 'ListItem', position: 2, name: 'Expériences', item: `${origin}/fr/experiences` },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Mangrove & îles',
        item: `${origin}/fr/experiences/mangrove-et-iles`,
      },
      { '@type': 'ListItem', position: 4, name: 'Pirogue au coucher du soleil' },
    ]);
  });

  it('pas de fil sur l’accueil ni sur la demande (FR-025)', () => {
    for (const type of ['home', 'request', 'requestThanks'] as const) {
      expect(buildBreadcrumbs({ locale: 'fr', route: { type } })).toEqual([]);
    }
    expect(buildBreadcrumbs({ locale: 'en', route: { type: 'staysList' } })).toEqual([
      { name: 'Home', path: '/en' },
      { name: 'Stays' },
    ]);
  });

  it('ItemList numérotée', () => {
    expect(buildItemList(`${origin}/fr/sejours`, [`${origin}/fr/sejours/a`])).toMatchObject({
      numberOfItems: 1,
      itemListElement: [{ position: 1, url: `${origin}/fr/sejours/a` }],
    });
  });

  it('sérialisation : « </ » ne peut pas fermer le script', () => {
    const graph = buildGraph([{ '@type': 'Thing', name: '</script><script>alert(1)</script>' }]);
    expect(serializeJsonLd(graph)).not.toContain('</');
  });
});
