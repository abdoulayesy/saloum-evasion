import { APIError, type CollectionBeforeChangeHook, type PayloadRequest } from 'payload';

// Garde-fous de publication (T064, spec US3 scénario 3). Les règles portées par les champs
// (300 mots, longueurs et unicité SEO, conditions d'annulation obligatoires, prix entiers)
// sont déjà vérifiées par leur validation. Ce hook ajoute la règle transversale : aucun
// contenu n'est publié s'il utilise une photo sans texte alternatif FR et EN ou sans
// provenance (principes IV et V), y compris une photo importée hors de l'admin.
// Une version anglaise incomplète ne bloque pas : `localeStatus.enPublished` reste faux et
// l'admin l'affiche (fields/localeStatus.ts).

type Obj = Record<string, unknown>;

const isRecord = (value: unknown): value is Obj =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toId = (value: unknown): number | null => {
  if (typeof value === 'number') return value;
  if (isRecord(value) && typeof value.id === 'number') return value.id;
  return null;
};

/** Images insérées dans un corps Lexical (nœuds `upload` vers `media`, à toute profondeur). */
const lexicalUploads = (node: unknown): unknown[] => {
  if (!isRecord(node)) return [];
  const own = node.type === 'upload' && node.relationTo === 'media' ? [node.value] : [];
  const root = isRecord(node.root) ? [node.root] : [];
  const children = Array.isArray(node.children) ? node.children : [];
  return [...own, ...[...root, ...children].flatMap(lexicalUploads)];
};

/** Identifiants des médias référencés par un document (image principale, galerie, partage, corps…). */
export const referencedMediaIds = (data: Obj): number[] => {
  const ids: unknown[] = [data.heroImage, data.image, data.poster, data.photo];
  if (Array.isArray(data.gallery)) ids.push(...data.gallery);
  if (isRecord(data.seo)) ids.push(data.seo.shareImage);
  // Guides (004, T050) : images du corps.
  ids.push(...lexicalUploads(data.body));
  return [...new Set(ids.map(toId).filter((id): id is number => id !== null))];
};

const hasText = (value: unknown): boolean => typeof value === 'string' && value.trim() !== '';

/** Ce qui manque à un média pour être publiable, ou liste vide. */
export const missingMediaFields = (media: Obj): string[] => {
  const alt = isRecord(media.alt) ? media.alt : {};
  const provenance = isRecord(media.provenance) ? media.provenance : {};
  const missing: string[] = [];
  if (!hasText(alt.fr)) missing.push('texte alternatif français');
  if (!hasText(alt.en)) missing.push('texte alternatif anglais');
  if (!hasText(provenance.author)) missing.push('auteur');
  if (!hasText(provenance.place)) missing.push('lieu');
  if (!provenance.date) missing.push('date de prise de vue');
  return missing;
};

const describeMedia = (media: Obj): string =>
  typeof media.filename === 'string' ? media.filename : `photo n° ${String(media.id)}`;

/** Problèmes des médias `ids` (texte alternatif, provenance), un message par photo. */
export const checkMedia = async (req: PayloadRequest, ids: number[]): Promise<string[]> => {
  if (ids.length === 0) return [];
  const result = await req.payload.find({
    collection: 'media',
    where: { id: { in: ids } },
    depth: 0,
    limit: ids.length,
    overrideAccess: true,
    req,
  });
  return result.docs.flatMap((doc) => {
    const record: unknown = doc;
    if (!isRecord(record)) return [];
    const missing = missingMediaFields(record);
    return missing.length > 0 ? [`${describeMedia(record)} : ${missing.join(', ')}`] : [];
  });
};

export const publishGuard: CollectionBeforeChangeHook = async ({ data, req, originalDoc }) => {
  if (!isRecord(data) || data._status !== 'published') return data;
  // Les champs non envoyés (ex. publication depuis la liste) sont pris dans le document actuel.
  const merged: Obj = { ...(isRecord(originalDoc) ? originalDoc : {}), ...data };
  const problems = await checkMedia(req, referencedMediaIds(merged));
  if (problems.length > 0) {
    throw new APIError(
      `Publication impossible : photo incomplète. ${problems.join(' ; ')}.`,
      400,
      undefined,
      true,
    );
  }
  return data;
};
