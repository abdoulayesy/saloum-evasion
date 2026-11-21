import { APIError, type CollectionBeforeChangeHook, type PayloadRequest } from 'payload';
import { isLocale } from '@/i18n/routing';
import { guideErrors, type GuardMember } from '@/lib/guides/guards';
import { checkMedia } from './publishGuards';

// Garde-fous de publication d'un guide (004, T049, FR-015, FR-019) : auteur signé (photo,
// adresse de page, présentation dans la langue), champs obligatoires, relecture communautaire,
// mise à jour de fond par un membre actif, photo de l'auteur complète (texte alternatif et
// provenance). Lectures dans la transaction de la requête (`req`).

type Obj = Record<string, unknown>;

const isRecord = (value: unknown): value is Obj =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const idOf = (value: unknown): number | null => {
  if (typeof value === 'number') return value;
  if (isRecord(value) && typeof value.id === 'number') return value.id;
  return null;
};

const loadMember = async (req: PayloadRequest, value: unknown): Promise<GuardMember | null> => {
  const id = idOf(value);
  if (id === null) return null;
  const member = await req.payload
    .findByID({
      collection: 'teamMembers',
      id,
      depth: 0,
      locale: isLocale(req.locale ?? '') ? req.locale : 'fr',
      fallbackLocale: false,
      req,
    })
    .catch(() => null);
  return member
    ? {
        id: member.id,
        photo: member.photo,
        slug: member.slug,
        bio: member.bio,
        active: member.active,
      }
    : null;
};

const count = (value: unknown): number => (Array.isArray(value) ? value.length : 0);

export const guideGuardsHook: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  if (data._status !== 'published') return data;
  // Champs non envoyés (publication depuis la liste, mise à jour partielle) : document actuel.
  const merged: Obj = { ...(isRecord(originalDoc) ? originalDoc : {}), ...data };
  const [author, reviewer] = await Promise.all([
    loadMember(req, merged.author),
    loadMember(req, merged.reviewer),
  ]);
  const seo = isRecord(merged.seo) ? merged.seo : {};
  const errors = guideErrors({
    locale: req.locale === 'en' ? 'en' : 'fr',
    guide: {
      title: typeof merged.title === 'string' ? merged.title : null,
      standfirst: typeof merged.standfirst === 'string' ? merged.standfirst : null,
      heroImage: merged.heroImage,
      body: merged.body,
      seo: {
        metaTitle: typeof seo.metaTitle === 'string' ? seo.metaTitle : null,
        metaDescription: typeof seo.metaDescription === 'string' ? seo.metaDescription : null,
        targetKeyword: typeof seo.targetKeyword === 'string' ? seo.targetKeyword : null,
      },
      requiresCommunityReview: merged.requiresCommunityReview === true,
      substantiveUpdate: data.substantiveUpdate === true,
    },
    author,
    reviewer,
    linksCount:
      count(merged.relatedStays) +
      count(merged.relatedExperiences) +
      count(merged.relatedAccommodations) +
      count(merged.relatedDestinations),
  });
  const photoId = idOf(author?.photo);
  const photoProblems = photoId === null ? [] : await checkMedia(req, [photoId]);
  const problems = [...errors, ...photoProblems.map((problem) => `Photo de l’auteur : ${problem}`)];
  if (problems.length > 0) {
    throw new APIError(`Publication impossible : ${problems.join(' ')}`, 400, undefined, true);
  }
  return data;
};
