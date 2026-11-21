import { countWords } from '@/fields/validators';
import type { Locale } from '@/i18n/routing';

// Garde-fous de publication d'un guide (004, FR-015, FR-015b, FR-019, data-model). Pur.
// `guideErrors` bloque la publication ; `guideWarnings` alimente l'encadré « Points à vérifier »
// de l'admin sans bloquer. Les champs du guide sont vérifiés en français (référence) ; une version
// anglaise incomplète ne bloque pas : elle n'est simplement pas publiée (`localeStatus`).

export const MIN_LINKS = 2;
export const MIN_WORDS = 600;
export const STANDFIRST_MIN = 140;
export const STANDFIRST_MAX = 300;

export type GuardMember = {
  id: number;
  photo?: unknown;
  slug?: string | null;
  bio?: string | null;
  active?: boolean | null;
};

export type GuideGuardInput = {
  locale: Locale;
  guide: {
    title?: string | null;
    standfirst?: string | null;
    heroImage?: unknown;
    body?: unknown;
    seo?: {
      metaTitle?: string | null;
      metaDescription?: string | null;
      targetKeyword?: string | null;
    } | null;
    requiresCommunityReview?: boolean | null;
    substantiveUpdate?: boolean | null;
  };
  author: GuardMember | null;
  reviewer: GuardMember | null;
  /** Offres et destinations liées, tous types confondus. */
  linksCount: number;
};

const blank = (value: unknown): boolean => typeof value !== 'string' || value.trim() === '';

const present = (value: unknown): boolean => value !== null && value !== undefined && value !== '';

const LANGUAGE: Record<Locale, string> = { fr: 'en français', en: 'en anglais' };

export const guideErrors = ({ locale, guide, author, reviewer }: GuideGuardInput): string[] => {
  const errors: string[] = [];
  if (!author) {
    errors.push('Auteur obligatoire.');
  } else {
    if (!present(author.photo)) errors.push('Photo de l’auteur manquante.');
    if (blank(author.slug)) errors.push('Adresse de la page d’auteur (slug) manquante.');
    if (blank(author.bio)) errors.push(`Présentation de l’auteur manquante ${LANGUAGE[locale]}.`);
  }
  if (locale === 'fr') {
    if (!present(guide.heroImage)) errors.push('Image principale manquante.');
    if (blank(guide.title)) errors.push('Titre manquant.');
    if (blank(guide.standfirst)) errors.push('Chapeau manquant.');
    if (countWords(guide.body) === 0) errors.push('Texte du guide manquant.');
    if (blank(guide.seo?.targetKeyword)) errors.push('Requête cible (SEO) manquante.');
    if (blank(guide.seo?.metaTitle)) errors.push('Title (SEO) manquant.');
    if (blank(guide.seo?.metaDescription)) errors.push('Description (SEO) manquante.');
  }
  if (guide.requiresCommunityReview && !reviewer)
    errors.push('Relecture communautaire obligatoire : désignez un relecteur.');
  if (author && reviewer && author.id === reviewer.id)
    errors.push('Le relecteur doit être différent de l’auteur.');
  const activeSigner = author?.active !== false || (reviewer !== null && reviewer.active !== false);
  if (guide.substantiveUpdate && !activeSigner)
    errors.push(
      'Mise à jour importante : l’auteur ou le relecteur doit être un membre actif de l’équipe.',
    );
  return errors;
};

export const guideWarnings = ({ guide, linksCount }: GuideGuardInput): string[] => {
  const warnings: string[] = [];
  if (linksCount < MIN_LINKS)
    warnings.push(`Moins de deux offres ou destinations liées (${linksCount}).`);
  const words = countWords(guide.body);
  if (words > 0 && words < MIN_WORDS)
    warnings.push(`Texte de ${words} mots : ${MIN_WORDS} conseillés.`);
  const standfirst = guide.standfirst?.trim() ?? '';
  if (standfirst && (standfirst.length < STANDFIRST_MIN || standfirst.length > STANDFIRST_MAX))
    warnings.push(
      `Chapeau de ${standfirst.length} caractères : ${STANDFIRST_MIN} à ${STANDFIRST_MAX} conseillés.`,
    );
  return warnings;
};
