import type { CollectionBeforeChangeHook, Field } from 'payload';
import { countWords, BODY_MIN_WORDS } from './validators';

// `localeStatus.enPublished` (data-model) : vrai seulement si tous les champs anglais
// obligatoires sont remplis. Sinon la page EN n'est ni générée, ni listée, ni annoncée en
// hreflang (constitution, « Bilinguisme » : pas de repli silencieux).

export const localeStatusField: Field = {
  name: 'localeStatus',
  type: 'group',
  label: 'Version anglaise',
  fields: [
    {
      name: 'enPublished',
      type: 'checkbox',
      defaultValue: false,
      label: 'Version anglaise complète et publiée',
      admin: {
        readOnly: true,
        description:
          'Calculé à l’enregistrement en anglais : titre, slug, title, description (et texte de 300 mots pour les fiches).',
      },
    },
  ],
};

type Data = Record<string, unknown>;

const isRecord = (value: unknown): value is Data =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const hasText = (value: unknown): boolean =>
  typeof value === 'string' && value.trim().length > 0;

/** Les champs anglais exigés par une collection sont-ils remplis ? */
export type EnglishCheck = (data: Data) => boolean;

export const seoComplete = (data: Data): boolean => {
  const seo = isRecord(data.seo) ? data.seo : {};
  return hasText(seo.slug) && hasText(seo.metaTitle) && hasText(seo.metaDescription);
};

export const bodyComplete = (data: Data): boolean => countWords(data.body) >= BODY_MIN_WORDS;

/** Hook de collection : recalcule `enPublished` quand on enregistre la version anglaise. */
export const computeEnPublished =
  (check: EnglishCheck): CollectionBeforeChangeHook =>
  ({ data, req }) => {
    if (req.locale !== 'en' || !isRecord(data)) return data;
    const previous = isRecord(data.localeStatus) ? data.localeStatus : {};
    return { ...data, localeStatus: { ...previous, enPublished: check(data) } };
  };
