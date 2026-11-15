import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  PayloadRequest,
} from 'payload';
import { routing, type Locale } from '@/i18n/routing';
import {
  documentPath,
  isRoutedCollection,
  parentPath,
  type RoutedCollection,
} from '@/lib/redirects/paths';
import { planRedirects, type RedirectRule } from '@/lib/redirects/plan';

// Redirections 301 automatiques (T066, spec US3 scénarios 4 et 5) :
// - slug (ou univers) modifié sur un contenu publié → ancienne adresse → nouvelle, par langue ;
// - dépublication ou suppression → `replacementTarget` publié, sinon page parente ;
// - slug d'univers modifié → chaque expérience imbriquée est redirigée ;
// - chaînes aplaties et boucles supprimées (lib/redirects/plan.ts).
// Principe : on compare l'état PUBLIC du document principal avant et après l'opération.
// L'enregistrement d'un brouillon ne modifie pas le document principal (Payload) : il ne
// produit donc aucune redirection.

type Paths = Partial<Record<Locale, string>>;

type PublicState = {
  published: boolean;
  paths: Paths;
  universeSlugs: Partial<Record<Locale, string>>;
  replacementTarget: number | null;
  /** Expériences imbriquées (univers seulement) : identifiant → chemins publics. */
  nested: Map<number, Paths>;
};

type Row = { id: number | string } & Record<string, unknown>;
type Obj = Record<string, unknown>;

const isRecord = (value: unknown): value is Obj =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const localizedString = (value: unknown, locale: Locale): string | null => {
  if (typeof value === 'string') return value || null;
  if (!isRecord(value)) return null;
  const inner = value[locale];
  return typeof inner === 'string' && inner !== '' ? inner : null;
};

const relationId = (value: unknown): number | null => {
  if (typeof value === 'number') return value;
  if (isRecord(value) && typeof value.id === 'number') return value.id;
  return null;
};

const readMain = async (req: PayloadRequest, collection: RoutedCollection, id: number) =>
  req.payload.db.findOne<Row>({ collection, where: { id: { equals: id } }, locale: 'all', req });

const slugsOf = (row: Row | null): Partial<Record<Locale, string>> => {
  const seo = row && isRecord(row.seo) ? row.seo : null;
  const result: Partial<Record<Locale, string>> = {};
  for (const locale of routing.locales) {
    const slug = seo ? localizedString(seo.slug, locale) : null;
    if (slug) result[locale] = slug;
  }
  return result;
};

const publishedLocales = (row: Row): Locale[] => {
  const status = isRecord(row.localeStatus) ? row.localeStatus : {};
  return status.enPublished === true ? ['fr', 'en'] : ['fr'];
};

const universeSlugsOf = async (req: PayloadRequest, row: Row) => {
  const universeId = relationId(row.universe);
  if (universeId === null) return {};
  return slugsOf(await readMain(req, 'universes', universeId));
};

const pathsOf = (
  collection: RoutedCollection,
  row: Row,
  universeSlugs: Partial<Record<Locale, string>>,
): Paths => {
  const slugs = slugsOf(row);
  const paths: Paths = {};
  for (const locale of publishedLocales(row)) {
    const path = documentPath({
      collection,
      locale,
      slug: slugs[locale],
      universeSlug: universeSlugs[locale],
    });
    if (path) paths[locale] = path;
  }
  return paths;
};

const nestedExperiences = async (req: PayloadRequest, universeId: number) => {
  const nested = new Map<number, Paths>();
  const universe = await readMain(req, 'universes', universeId);
  if (!universe) return nested;
  const universeSlugs = slugsOf(universe);
  const result = await req.payload.db.find<Row>({
    collection: 'experiences',
    where: { and: [{ universe: { equals: universeId } }, { _status: { equals: 'published' } }] },
    locale: 'all',
    limit: 0,
    pagination: false,
    req,
  });
  for (const row of result.docs) {
    if (typeof row.id === 'number') nested.set(row.id, pathsOf('experiences', row, universeSlugs));
  }
  return nested;
};

const readState = async (
  req: PayloadRequest,
  collection: RoutedCollection,
  id: number,
): Promise<PublicState | null> => {
  const row = await readMain(req, collection, id);
  if (!row) return null;
  const universeSlugs = collection === 'experiences' ? await universeSlugsOf(req, row) : {};
  return {
    published: row._status === 'published',
    paths: row._status === 'published' ? pathsOf(collection, row, universeSlugs) : {},
    universeSlugs,
    replacementTarget: relationId(row.replacementTarget),
    nested: collection === 'universes' ? await nestedExperiences(req, id) : new Map(),
  };
};

const targetPaths = async (
  req: PayloadRequest,
  collection: RoutedCollection,
  state: PublicState,
): Promise<Paths> => {
  if (state.replacementTarget === null) return {};
  const replacement = await readState(req, collection, state.replacementTarget);
  return replacement?.published ? replacement.paths : {};
};

/** Redirections pour un contenu qui n'est plus public (dépublié ou supprimé). */
const removalRules = async (
  req: PayloadRequest,
  collection: RoutedCollection,
  before: PublicState,
): Promise<RedirectRule[]> => {
  const replacement = await targetPaths(req, collection, before);
  return routing.locales.flatMap((locale) => {
    const from = before.paths[locale];
    if (!from) return [];
    const to = replacement[locale] ?? parentPath(collection, locale, before.universeSlugs[locale]);
    return [{ from, to }];
  });
};

/** Redirections entre deux états publics (slug, univers ou version anglaise modifiés). */
const changeRules = (collection: RoutedCollection, before: PublicState, after: PublicState) => {
  const rules: RedirectRule[] = [];
  for (const locale of routing.locales) {
    const from = before.paths[locale];
    if (!from) continue;
    const to = after.paths[locale] ?? parentPath(collection, locale, after.universeSlugs[locale]);
    if (from !== to) rules.push({ from, to });
  }
  for (const [experienceId, oldPaths] of before.nested) {
    const newPaths = after.nested.get(experienceId) ?? {};
    for (const locale of routing.locales) {
      const from = oldPaths[locale];
      const to = newPaths[locale];
      if (from && to && from !== to) rules.push({ from, to });
    }
  }
  return rules;
};

/** Écrit le plan dans la collection `redirects` (même transaction que l'opération). */
export const applyRedirectPlan = async (
  req: PayloadRequest,
  added: readonly RedirectRule[],
  livePaths: readonly string[],
): Promise<void> => {
  if (added.length === 0 && livePaths.length === 0) return;
  const existing = await req.payload.find({
    collection: 'redirects',
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
    req,
  });
  const rules = existing.docs.map((doc) => ({ from: doc.from, to: doc.to }));
  const plan = planRedirects(rules, added, livePaths);
  const context = { ...req.context, skipAutoRedirect: true };

  if (plan.remove.length > 0) {
    await req.payload.delete({
      collection: 'redirects',
      where: { from: { in: plan.remove } },
      overrideAccess: true,
      context,
      req,
    });
  }
  const reason = req.context.autoRedirectReason === 'unpublished' ? 'unpublished' : 'slug_change';
  for (const rule of plan.upsert) {
    const current = existing.docs.find((doc) => doc.from === rule.from);
    if (current) {
      await req.payload.update({
        collection: 'redirects',
        id: current.id,
        data: { to: rule.to },
        overrideAccess: true,
        context,
        req,
      });
    } else {
      await req.payload.create({
        collection: 'redirects',
        data: {
          from: rule.from,
          to: rule.to,
          type: '301',
          reason,
        },
        overrideAccess: true,
        context,
        req,
      });
    }
  }
};

const stateKey = (collection: string, id: number | string) => `autoRedirect:${collection}:${id}`;

const stash = new WeakMap<PayloadRequest, Map<string, PublicState | null>>();

const remember = (req: PayloadRequest, key: string, state: PublicState | null) => {
  const store = stash.get(req) ?? new Map<string, PublicState | null>();
  store.set(key, state);
  stash.set(req, store);
};

const recall = (req: PayloadRequest, key: string): PublicState | null | undefined =>
  stash.get(req)?.get(key);

const numericId = (value: unknown): number | null => (typeof value === 'number' ? value : null);

export const captureStateBeforeChange: CollectionBeforeChangeHook = async ({
  collection,
  operation,
  originalDoc,
  req,
  data,
}) => {
  const id = numericId(originalDoc?.id);
  if (operation !== 'update' || id === null || !isRoutedCollection(collection.slug)) return data;
  if (req.context.skipAutoRedirect === true) return data;
  remember(req, stateKey(collection.slug, id), await readState(req, collection.slug, id));
  return data;
};

export const redirectAfterChange: CollectionAfterChangeHook = async ({
  collection,
  doc,
  operation,
  req,
}) => {
  const id = numericId(doc.id);
  if (id === null || !isRoutedCollection(collection.slug)) return doc;
  if (req.context.skipAutoRedirect === true) return doc;
  const after = await readState(req, collection.slug, id);
  if (!after) return doc;
  const livePaths = Object.values(after.paths);
  const before = operation === 'update' ? recall(req, stateKey(collection.slug, id)) : null;
  if (!before?.published) {
    await applyRedirectPlan(req, [], livePaths);
    return doc;
  }
  if (!after.published) {
    req.context.autoRedirectReason = 'unpublished';
    await applyRedirectPlan(req, await removalRules(req, collection.slug, before), []);
    return doc;
  }
  await applyRedirectPlan(req, changeRules(collection.slug, before, after), [
    ...livePaths,
    ...[...after.nested.values()].flatMap((paths) => Object.values(paths)),
  ]);
  return doc;
};

export const captureStateBeforeDelete: CollectionBeforeDeleteHook = async ({
  collection,
  id,
  req,
}) => {
  const numeric = numericId(id);
  if (numeric === null || !isRoutedCollection(collection.slug)) return;
  remember(req, stateKey(collection.slug, numeric), await readState(req, collection.slug, numeric));
};

export const redirectAfterDelete: CollectionAfterDeleteHook = async ({
  collection,
  doc,
  id,
  req,
}) => {
  const numeric = numericId(id);
  if (numeric === null || !isRoutedCollection(collection.slug)) return doc;
  const before = recall(req, stateKey(collection.slug, numeric));
  if (!before?.published) return doc;
  req.context.autoRedirectReason = 'unpublished';
  await applyRedirectPlan(req, await removalRules(req, collection.slug, before), []);
  return doc;
};

/** Hooks à brancher sur chaque collection routée. */
export const autoRedirectHooks = {
  beforeChange: [captureStateBeforeChange],
  afterChange: [redirectAfterChange],
  beforeDelete: [captureStateBeforeDelete],
  afterDelete: [redirectAfterDelete],
};
