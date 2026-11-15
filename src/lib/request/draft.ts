import { MAX_ITEMS, type RequestItemKind } from './constants';

// « Demande en cours » côté client (T143, contrat request-form.md §1) : stockage local
// `se.request.v1`, strictement nécessaire au service demandé (sans consentement). Tout accès
// est protégé (navigation privée, stockage bloqué) : sans stockage, le paramètre d'URL du lien
// « Demander » prend le relais.

export const DRAFT_KEY = 'se.request.v1';
export const DRAFT_TTL_DAYS = 30;
export const DRAFT_EVENT = 'se:request-draft';

export type DraftItem = { kind: RequestItemKind; slug: string; title: string };

export type RequestDraft = {
  version: 1;
  items: DraftItem[];
  arrivalDate?: string;
  departureDate?: string;
  adults?: number;
  children?: number;
  updatedAt: string;
};

const KINDS: readonly string[] = ['stay', 'experience', 'accommodation'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isKind = (value: unknown): value is RequestItemKind =>
  typeof value === 'string' && KINDS.includes(value);

const toItem = (value: unknown): DraftItem | null =>
  isRecord(value) &&
  isKind(value.kind) &&
  typeof value.slug === 'string' &&
  typeof value.title === 'string'
    ? { kind: value.kind, slug: value.slug, title: value.title }
    : null;

const optionalString = (value: unknown): string | undefined =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;

const optionalCount = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined;

export const emptyDraft = (now: Date = new Date()): RequestDraft => ({
  version: 1,
  items: [],
  updatedAt: now.toISOString(),
});

/** Lit un brouillon sérialisé ; tout contenu invalide ou expiré donne un brouillon vide. */
export const parseDraft = (raw: string | null, now: Date = new Date()): RequestDraft => {
  if (!raw) return emptyDraft(now);
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== 1 || typeof value.updatedAt !== 'string')
      return emptyDraft(now);
    const age = now.getTime() - new Date(value.updatedAt).getTime();
    if (!Number.isFinite(age) || age > DRAFT_TTL_DAYS * 24 * 60 * 60 * 1000) return emptyDraft(now);
    const items = (Array.isArray(value.items) ? value.items : [])
      .map(toItem)
      .filter((item): item is DraftItem => item !== null)
      .slice(0, MAX_ITEMS);
    return {
      version: 1,
      items,
      arrivalDate: optionalString(value.arrivalDate),
      departureDate: optionalString(value.departureDate),
      adults: optionalCount(value.adults),
      children: optionalCount(value.children),
      updatedAt: value.updatedAt,
    };
  } catch {
    return emptyDraft(now);
  }
};

/** Ajoute un élément sans doublon (type + slug) et dans la limite de 10. */
export const addItem = (
  draft: RequestDraft,
  item: DraftItem,
  now: Date = new Date(),
): RequestDraft => {
  const exists = draft.items.some((entry) => entry.kind === item.kind && entry.slug === item.slug);
  if (exists || draft.items.length >= MAX_ITEMS) return draft;
  return { ...draft, items: [...draft.items, item], updatedAt: now.toISOString() };
};

export const removeItem = (
  draft: RequestDraft,
  kind: RequestItemKind,
  slug: string,
  now: Date = new Date(),
): RequestDraft => ({
  ...draft,
  items: draft.items.filter((entry) => !(entry.kind === kind && entry.slug === slug)),
  updatedAt: now.toISOString(),
});

/** Dates et voyageurs portés par l'URL (recherche de l'accueil, liste, fiche). */
export const tripFromSearch = (
  search: URLSearchParams,
): Pick<RequestDraft, 'arrivalDate' | 'departureDate' | 'adults' | 'children'> => {
  const count = (value: string | null): number | undefined => {
    const parsed = value === null ? Number.NaN : Number(value);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
  };
  return {
    arrivalDate: optionalString(search.get('arrivee')),
    departureDate: optionalString(search.get('depart')),
    adults: count(search.get('adultes')),
    children: count(search.get('enfants')),
  };
};

export const readDraft = (now: Date = new Date()): RequestDraft => {
  try {
    return parseDraft(window.localStorage.getItem(DRAFT_KEY), now);
  } catch {
    return emptyDraft(now);
  }
};

export const writeDraft = (draft: RequestDraft): void => {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    window.dispatchEvent(new Event(DRAFT_EVENT));
  } catch {
    // Stockage indisponible : le lien « Demander » transporte l'élément dans l'URL.
  }
};

export const clearDraft = (): void => {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
    window.dispatchEvent(new Event(DRAFT_EVENT));
  } catch {
    // Rien à effacer.
  }
};
