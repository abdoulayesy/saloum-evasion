import { describe, expect, it } from 'vitest';
import { buildMetadata, DESCRIPTION_MAX, TITLE_MAX } from '@/lib/seo/metadata';

process.env.NEXT_PUBLIC_SITE_URL = 'https://saloum-evasion.test';

const base = {
  title: 'Week-end bolong à Ndangane | Saloum Évasion',
  description: 'Deux nuits en écolodge, pirogue dans les bolongs et table locale.',
};

describe('buildMetadata', () => {
  it('canonical absolu, hreflang fr/en/x-default', () => {
    const metadata = buildMetadata({
      ...base,
      locale: 'en',
      paths: { fr: '/fr/sejours/week-end-bolong', en: '/en/stays/bolong-weekend' },
    });
    expect(metadata.alternates?.canonical).toBe(
      'https://saloum-evasion.test/en/stays/bolong-weekend',
    );
    expect(metadata.alternates?.languages).toEqual({
      fr: 'https://saloum-evasion.test/fr/sejours/week-end-bolong',
      en: 'https://saloum-evasion.test/en/stays/bolong-weekend',
      'x-default': 'https://saloum-evasion.test/fr/sejours/week-end-bolong',
    });
    expect(metadata.openGraph).toMatchObject({ locale: 'en_US', alternateLocale: ['fr_SN'] });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image' });
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it('EN non publiée : hreflang en omis, x-default = FR', () => {
    const metadata = buildMetadata({ ...base, locale: 'fr', paths: { fr: '/fr/faq' } });
    expect(metadata.alternates?.languages).toEqual({
      fr: 'https://saloum-evasion.test/fr/faq',
      'x-default': 'https://saloum-evasion.test/fr/faq',
    });
    expect(metadata.openGraph).toMatchObject({ alternateLocale: [] });
  });

  it('noindex : robots index=false, ni canonical ni hreflang', () => {
    const metadata = buildMetadata({
      ...base,
      locale: 'fr',
      paths: { fr: '/fr/demande', en: '/en/request' },
      noindex: true,
    });
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates).toBeUndefined();
  });

  it('image OG par défaut 1200×630 en URL absolue', () => {
    const metadata = buildMetadata({ ...base, locale: 'fr', paths: { fr: '/fr' } });
    expect(metadata.openGraph?.images).toEqual([
      expect.objectContaining({
        url: 'https://saloum-evasion.test/og-default.png',
        width: 1200,
        height: 630,
      }),
    ]);
  });

  it('chemin de la langue courante obligatoire', () => {
    expect(() => buildMetadata({ ...base, locale: 'en', paths: { fr: '/fr' } })).toThrow();
  });

  it('les limites de longueur sont celles de la constitution', () => {
    expect(TITLE_MAX).toBe(60);
    expect(DESCRIPTION_MAX).toBe(155);
    const paths = { fr: '/fr' };
    expect(() => buildMetadata({ ...base, locale: 'fr', paths, title: 'x'.repeat(61) })).toThrow(
      /title/,
    );
    expect(() =>
      buildMetadata({ ...base, locale: 'fr', paths, description: 'x'.repeat(156) }),
    ).toThrow(/description/);
    expect(() => buildMetadata({ ...base, locale: 'fr', paths, title: '' })).toThrow(/title/);
    expect(() =>
      buildMetadata({ ...base, locale: 'fr', paths, title: 'x'.repeat(60) }),
    ).not.toThrow();
  });
});
