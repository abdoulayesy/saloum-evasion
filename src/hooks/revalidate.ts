import { revalidateTag } from 'next/cache';
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload';

// Régénération à la publication (plan : SSG + revalidateTag). Tags :
//   doc:{collection}:{id} · {collection} · sitemap · nav · destinations liées.
// Hors requête Next (seed, migrations), revalidateTag n'est pas disponible : on l'ignore.

export const docTag = (collection: string, id: number | string): string =>
  `doc:${collection}:${id}`;

const safeRevalidate = (req: PayloadRequest, tags: readonly string[]): void => {
  if (req.context.disableRevalidate === true) return;
  for (const tag of tags) {
    try {
      revalidateTag(tag);
    } catch {
      // Appel hors d'un contexte Next (script) : rien à invalider.
    }
  }
};

const relatedDestinationTags = (doc: unknown): string[] => {
  if (typeof doc !== 'object' || doc === null) return [];
  const ids: unknown[] = [];
  if ('destination' in doc) ids.push(doc.destination);
  if ('destinations' in doc && Array.isArray(doc.destinations)) ids.push(...doc.destinations);
  return ids.flatMap((value) => {
    if (typeof value === 'number' || typeof value === 'string')
      return [docTag('destinations', value)];
    if (typeof value === 'object' && value !== null && 'id' in value) {
      const id = value.id;
      return typeof id === 'number' || typeof id === 'string' ? [docTag('destinations', id)] : [];
    }
    return [];
  });
};

const GUIDE_RELATIONS: readonly [string, string][] = [
  ['author', 'teamMembers'],
  ['reviewer', 'teamMembers'],
  ['relatedStays', 'stays'],
  ['relatedExperiences', 'experiences'],
  ['relatedAccommodations', 'accommodations'],
  ['relatedDestinations', 'destinations'],
];

const idOf = (value: unknown): number | string | null => {
  if (typeof value === 'number' || typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = value.id;
    return typeof id === 'number' || typeof id === 'string' ? id : null;
  }
  return null;
};

/**
 * Guide (004, R8) : pages d'auteur et de relecteur, fiches liées (encart « À lire dans les
 * Carnets »), avant comme après la modification.
 */
const relatedGuideTags = (doc: unknown): string[] => {
  if (typeof doc !== 'object' || doc === null) return [];
  return GUIDE_RELATIONS.flatMap(([field, collection]) => {
    const value: unknown = Reflect.get(doc, field);
    const values: unknown[] = Array.isArray(value) ? value : [value];
    return values.flatMap((item) => {
      const id = idOf(item);
      return id === null ? [] : [docTag(collection, id)];
    });
  });
};

export const revalidateCollectionAfterChange: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  collection,
  req,
}) => {
  safeRevalidate(req, [
    docTag(collection.slug, doc.id),
    collection.slug,
    'sitemap',
    'nav',
    ...relatedDestinationTags(doc),
    ...relatedDestinationTags(previousDoc),
    ...(collection.slug === 'guides'
      ? [...relatedGuideTags(doc), ...relatedGuideTags(previousDoc)]
      : []),
  ]);
  return doc;
};

export const revalidateCollectionAfterDelete: CollectionAfterDeleteHook = ({
  doc,
  collection,
  req,
}) => {
  safeRevalidate(req, [
    docTag(collection.slug, doc.id),
    collection.slug,
    'sitemap',
    'nav',
    ...relatedDestinationTags(doc),
  ]);
  return doc;
};

export const revalidateGlobalAfterChange: GlobalAfterChangeHook = ({ doc, global, req }) => {
  safeRevalidate(req, [`global:${global.slug}`, 'nav', 'sitemap']);
  return doc;
};

/** Hooks à brancher sur chaque collection publique. */
export const revalidateHooks = {
  afterChange: [revalidateCollectionAfterChange],
  afterDelete: [revalidateCollectionAfterDelete],
};
