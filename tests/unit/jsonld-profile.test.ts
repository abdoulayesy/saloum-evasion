import { describe, expect, it } from 'vitest';
import { personId } from '@/lib/seo/jsonld/article';
import { buildProfilePage } from '@/lib/seo/jsonld/profilePage';

// T022 (004, FR-003b, contracts/jsonld.md) : page d'auteur → ProfilePage + Person, même @id
// de Person que l'auteur des articles.

const origin = 'https://saloum-evasion.test';
const url = `${origin}/fr/equipe/aissatou-diop`;

describe('JSON-LD ProfilePage', () => {
  it('Person principale, rattachée à l’organisation, avec liens publics', () => {
    expect(
      buildProfilePage({
        url,
        origin,
        locale: 'fr',
        name: 'Aïssatou Diop',
        jobTitle: 'Guide et cuisinière',
        description: 'Née à Ndangane.',
        image: `${origin}/img/aissatou.avif`,
        place: 'Ndangane',
        sameAs: ['https://example.org/aissatou'],
      }),
    ).toEqual({
      '@type': 'ProfilePage',
      '@id': `${url}#webpage`,
      url,
      inLanguage: 'fr-SN',
      mainEntity: {
        '@type': 'Person',
        '@id': `${url}#person`,
        name: 'Aïssatou Diop',
        jobTitle: 'Guide et cuisinière',
        description: 'Née à Ndangane.',
        image: `${origin}/img/aissatou.avif`,
        homeLocation: { '@type': 'Place', name: 'Ndangane' },
        worksFor: { '@id': `${origin}/#org` },
        sameAs: ['https://example.org/aissatou'],
      },
    });
  });

  it('même @id que l’auteur des articles ; champs facultatifs absents', () => {
    const page = buildProfilePage({
      url,
      origin,
      locale: 'en',
      name: 'A',
      jobTitle: '',
      description: '',
      image: null,
      place: '',
      sameAs: [],
    });
    expect(page.mainEntity).toEqual({
      '@type': 'Person',
      '@id': personId(url),
      name: 'A',
      worksFor: { '@id': `${origin}/#org` },
    });
    expect(page).toMatchObject({ inLanguage: 'en' });
  });
});
