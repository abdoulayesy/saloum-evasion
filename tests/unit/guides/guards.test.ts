import { describe, expect, it } from 'vitest';
import { guideErrors, guideWarnings, type GuideGuardInput } from '@/lib/guides/guards';

// T046 (004, FR-015, FR-015b, FR-019, data-model) : publication refusée tant qu'un élément
// obligatoire manque ; avertissements « Points à vérifier » qui ne bloquent pas.

const paragraph = (words: number) => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: Array.from({ length: words }, () => 'mot').join(' ') }],
      },
    ],
  },
});

const member = { photo: 1, slug: 'awa-sarr', bio: 'Née à Ndangane.', active: true };

const valid: GuideGuardInput = {
  locale: 'fr',
  guide: {
    title: 'Que faire au Sine-Saloum',
    standfirst: 'x'.repeat(200),
    heroImage: 3,
    body: paragraph(700),
    seo: { metaTitle: 'Titre', metaDescription: 'Description', targetKeyword: 'requête' },
    requiresCommunityReview: false,
    substantiveUpdate: false,
  },
  author: { id: 1, ...member },
  reviewer: null,
  linksCount: 3,
};

describe('garde-fous de publication d’un guide', () => {
  it('guide complet : aucune erreur, aucun avertissement', () => {
    expect(guideErrors(valid)).toEqual([]);
    expect(guideWarnings(valid)).toEqual([]);
  });

  it('auteur absent, sans photo, sans adresse de page ou sans présentation', () => {
    expect(guideErrors({ ...valid, author: null })).toEqual(['Auteur obligatoire.']);
    expect(
      guideErrors({ ...valid, author: { id: 1, photo: null, slug: '', bio: '', active: true } }),
    ).toEqual([
      'Photo de l’auteur manquante.',
      'Adresse de la page d’auteur (slug) manquante.',
      'Présentation de l’auteur manquante en français.',
    ]);
  });

  it('champs obligatoires en français : image, titre, chapeau, texte, requête, title, description', () => {
    expect(
      guideErrors({
        ...valid,
        guide: { ...valid.guide, heroImage: null, title: '', standfirst: ' ', body: null, seo: {} },
      }),
    ).toEqual([
      'Image principale manquante.',
      'Titre manquant.',
      'Chapeau manquant.',
      'Texte du guide manquant.',
      'Requête cible (SEO) manquante.',
      'Title (SEO) manquant.',
      'Description (SEO) manquante.',
    ]);
  });

  it('en anglais : seuls l’auteur et sa présentation anglaise sont vérifiés', () => {
    const english = {
      ...valid,
      locale: 'en' as const,
      guide: { ...valid.guide, title: '', seo: {} },
      author: { id: 1, ...member, bio: '' },
    };
    expect(guideErrors(english)).toEqual(['Présentation de l’auteur manquante en anglais.']);
  });

  it('relecture communautaire : relecteur obligatoire et différent de l’auteur', () => {
    const sensitive = { ...valid, guide: { ...valid.guide, requiresCommunityReview: true } };
    expect(guideErrors(sensitive)).toEqual([
      'Relecture communautaire obligatoire : désignez un relecteur.',
    ]);
    expect(guideErrors({ ...sensitive, reviewer: { id: 1, ...member } })).toEqual([
      'Le relecteur doit être différent de l’auteur.',
    ]);
    expect(guideErrors({ ...sensitive, reviewer: { id: 2, ...member } })).toEqual([]);
  });

  it('mise à jour de fond : un auteur ou un relecteur membre actif de l’équipe', () => {
    const update = {
      ...valid,
      guide: { ...valid.guide, substantiveUpdate: true },
      author: { id: 1, ...member, active: false },
    };
    expect(guideErrors(update)).toEqual([
      'Mise à jour importante : l’auteur ou le relecteur doit être un membre actif de l’équipe.',
    ]);
    expect(guideErrors({ ...update, reviewer: { id: 2, ...member } })).toEqual([]);
    expect(guideErrors({ ...update, guide: valid.guide })).toEqual([]);
  });
});

describe('points à vérifier (sans blocage)', () => {
  it('moins de deux liens, moins de 600 mots, chapeau hors de 140 à 300 caractères', () => {
    expect(
      guideWarnings({
        ...valid,
        linksCount: 1,
        guide: { ...valid.guide, body: paragraph(250), standfirst: 'court' },
      }),
    ).toEqual([
      'Moins de deux offres ou destinations liées (1).',
      'Texte de 250 mots : 600 conseillés.',
      'Chapeau de 5 caractères : 140 à 300 conseillés.',
    ]);
  });

  it('texte vide ou chapeau absent : pas d’avertissement (déjà une erreur bloquante)', () => {
    expect(
      guideWarnings({ ...valid, guide: { ...valid.guide, body: null, standfirst: '' } }),
    ).toEqual([]);
  });
});
