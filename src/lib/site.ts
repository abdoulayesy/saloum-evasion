// Source unique des coordonnées de l'entreprise (constitution III : NAP identique partout).
// Les valeurs viennent du global Payload `siteSettings` (lecture : lib/cms/siteSettings.ts).
// Ce module reste pur (aucun accès au CMS) pour être testable unitairement.
// Aucune coordonnée n'est inventée : un champ non renseigné par l'équipe reste `undefined`
// et n'est ni affiché ni émis en JSON-LD.

export type SiteSettings = {
  brandName: string;
  legalName?: string;
  locality: string;
  region: string;
  countryCode: 'SN';
  streetAddress?: string;
  postalCode?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  geo?: { latitude: number; longitude: number };
  areaServed: string;
  sameAs: string[];
  responseTimeText?: string;
  paymentMethods: readonly ['Wave', 'Orange Money', 'Carte bancaire'];
};

/** Valeurs par défaut avant toute saisie dans le CMS. */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brandName: 'Saloum Évasion',
  locality: 'Ndangane',
  region: 'Fatick',
  countryCode: 'SN',
  areaServed: 'Delta du Sine-Saloum',
  sameAs: [],
  // Ordre et rang identiques partout (constitution VI).
  paymentMethods: ['Wave', 'Orange Money', 'Carte bancaire'],
};

/** Forme minimale du global `siteSettings` lue par `toSiteSettings`. */
export type SiteSettingsSource = {
  brandName?: string | null;
  legalName?: string | null;
  address?: {
    streetAddress?: string | null;
    locality?: string | null;
    region?: string | null;
    postalCode?: string | null;
  } | null;
  phone?: string | null;
  whatsappNumber?: string | null;
  email?: string | null;
  geo?: { latitude?: number | null; longitude?: number | null } | null;
  sameAs?: { url?: string | null }[] | null;
  responseTimeText?: string | null;
};

const text = (value: string | null | undefined): string | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;

/** Convertit le global du CMS en réglages d'affichage, sans jamais inventer de valeur. */
export const toSiteSettings = (source: SiteSettingsSource): SiteSettings => {
  const latitude = source.geo?.latitude;
  const longitude = source.geo?.longitude;
  const optional = {
    legalName: text(source.legalName),
    streetAddress: text(source.address?.streetAddress),
    postalCode: text(source.address?.postalCode),
    phone: text(source.phone),
    whatsapp: text(source.whatsappNumber),
    email: text(source.email),
    responseTimeText: text(source.responseTimeText),
  };
  return {
    ...DEFAULT_SITE_SETTINGS,
    brandName: text(source.brandName) ?? DEFAULT_SITE_SETTINGS.brandName,
    locality: text(source.address?.locality) ?? DEFAULT_SITE_SETTINGS.locality,
    region: text(source.address?.region) ?? DEFAULT_SITE_SETTINGS.region,
    ...Object.fromEntries(Object.entries(optional).filter(([, value]) => value !== undefined)),
    ...(typeof latitude === 'number' && typeof longitude === 'number'
      ? { geo: { latitude, longitude } }
      : {}),
    sameAs: (source.sameAs ?? []).flatMap((entry) => {
      const url = text(entry.url);
      return url ? [url] : [];
    }),
  };
};

/** Origine absolue du site, sans barre oblique finale. */
export const siteUrl = (): string =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

export const absoluteUrl = (path: string): string => `${siteUrl()}${path}`;
