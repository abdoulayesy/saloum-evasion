import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseDraft } from '@/lib/guides/draft';
import { duplicateKeywords, normalizeText, TARGET_KEYWORDS } from '@/lib/seo/keywords';

// T063 (004, FR-020, FR-020b, research R7) : une requête cible n'appartient qu'à une page ;
// les sept guides sont au registre ; « que faire au Sine-Saloum » passe au guide et le hub des
// expériences est recentré sur « activités Sine-Saloum ».

const all = TARGET_KEYWORDS.flatMap((entry) => [entry.fr, entry.en]);

const pathOf = (keyword: string): string | undefined =>
  all.find((target) => normalizeText(target.keyword) === normalizeText(keyword))?.path;

describe('registre des requêtes cibles', () => {
  it('chaque requête normalisée ne vise qu’un seul chemin', () => {
    expect(duplicateKeywords(TARGET_KEYWORDS)).toEqual([]);
  });

  it('doublon détecté malgré la casse et les accents', () => {
    const duplicated = [
      {
        fr: { keyword: 'Activités Sine-Saloum', path: '/fr/a', terms: ['activites'] },
        en: { keyword: 'x', path: '/en/a', terms: ['x'] },
      },
      {
        fr: { keyword: 'activites sine-saloum', path: '/fr/b', terms: ['activites'] },
        en: { keyword: 'y', path: '/en/b', terms: ['y'] },
      },
    ];
    expect(duplicateKeywords(duplicated)).toEqual([
      { keyword: 'activites sine-saloum', paths: ['/fr/a', '/fr/b'] },
    ]);
  });

  it('les sept guides de lancement sont au registre, en français et en anglais', () => {
    const guides = all.filter(
      (target) =>
        target.path.startsWith('/fr/carnets-du-saloum/') ||
        target.path.startsWith('/en/saloum-travel-guides/'),
    );
    expect(guides).toHaveLength(14);
  });

  it('requête de chaque brouillon de guide = requête du registre pour son adresse', () => {
    for (const locale of ['fr', 'en'] as const) {
      const dir = join(process.cwd(), 'content', 'carnets', locale);
      for (const file of readdirSync(dir).filter((name) => name.endsWith('.md'))) {
        const { meta } = parseDraft(readFileSync(join(dir, file), 'utf8'));
        const base = locale === 'fr' ? '/fr/carnets-du-saloum/' : '/en/saloum-travel-guides/';
        const target = all.find((candidate) => candidate.path === `${base}${String(meta.slug)}`);
        expect(target?.keyword, `${locale}/${file}`).toBe(meta.targetKeyword);
      }
    }
  });

  it('« que faire au Sine-Saloum » au guide ; « activités Sine-Saloum » au hub', () => {
    expect(pathOf('que faire au Sine-Saloum')).toBe(
      '/fr/carnets-du-saloum/que-faire-au-sine-saloum',
    );
    expect(pathOf('things to do in Sine-Saloum')).toBe(
      '/en/saloum-travel-guides/things-to-do-sine-saloum',
    );
    expect(pathOf('activités Sine-Saloum')).toBe('/fr/experiences');
    expect(pathOf('Sine-Saloum activities')).toBe('/en/experiences');
    expect(pathOf('Mar Lodj')).toBe('/fr/destinations/mar-lodj');
  });
});
