import type { PayloadRequest } from 'payload';
import type { ValidationResult } from './validators';

// Le français est la langue de référence (constitution, « Bilinguisme ») : un champ localisé
// « obligatoire » l'est en français ; en anglais, il peut rester vide (la page EN n'est alors
// ni publiée ni annoncée, voir `localeStatus`). S'il est rempli en anglais, il est validé.

export const DEFAULT_LOCALE = 'fr';

export const isDefaultLocale = (req: PayloadRequest): boolean =>
  (req.locale ?? DEFAULT_LOCALE) === DEFAULT_LOCALE;

const isEmpty = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  (typeof value === 'string' && value.trim() === '') ||
  (Array.isArray(value) && value.length === 0);

type Check = (value: unknown) => ValidationResult;

/** Obligatoire en français ; en anglais, validé seulement s'il est rempli. */
export const requiredInFrench =
  (check: Check = () => true, label = 'Champ') =>
  (value: unknown, { req }: { req: PayloadRequest }): ValidationResult => {
    if (isEmpty(value)) return isDefaultLocale(req) ? `${label} obligatoire en français.` : true;
    return check(value);
  };
