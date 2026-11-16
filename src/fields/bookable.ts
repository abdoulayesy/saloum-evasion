import { APIError, type CollectionBeforeChangeHook, type Field } from 'payload';
import { integerField } from './checkout';

// Champs « vendable » partagés par les offres (002, T020 ; FR-041) et règle « vendable ⇒
// partenaire + politique d'annulation + prix ». La règle s'applique à la publication (ou à tout
// enregistrement pour les collections sans brouillon, comme les transferts).

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasRelation = (value: unknown): boolean =>
  typeof value === 'number' || typeof value === 'string' || (isRecord(value) && 'id' in value);

export const isWholeXof = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

type BookableOptions = {
  /** Tarif enfant réglable (séjours, expériences). */
  childPricing?: boolean;
  /** Les conditions d'annulation existent déjà dans la collection (séjours). */
  hasCancellationPolicy?: boolean;
};

export const bookableFields = ({
  childPricing = false,
  hasCancellationPolicy = false,
}: BookableOptions = {}): Field[] => [
  {
    name: 'bookable',
    type: 'checkbox',
    defaultValue: false,
    label: 'Vendable en ligne',
    admin: {
      position: 'sidebar',
      description:
        'Ajout au panier et paiement en ligne. Exige un prestataire, des conditions d’annulation et des prix.',
    },
  },
  {
    name: 'partner',
    type: 'relationship',
    relationTo: 'partners',
    label: 'Prestataire',
    admin: { position: 'sidebar' },
  },
  ...(hasCancellationPolicy
    ? []
    : [
        {
          name: 'cancellationPolicy',
          type: 'relationship',
          relationTo: 'cancellationPolicies',
          label: 'Conditions d’annulation',
          admin: { position: 'sidebar' },
        } satisfies Field,
      ]),
  ...(childPricing
    ? [
        {
          ...integerField('childPricePercent', 'Tarif enfant (4–11 ans), en % du prix adulte', {
            max: 100,
            defaultValue: 50,
          }),
          admin: {
            position: 'sidebar',
            description: 'Gratuit sous 4 ans ; au-delà de 11 ans, tarif adulte.',
          },
        } satisfies Field,
      ]
    : []),
];

/**
 * Garde « vendable » : `hasPrices` vérifie les prix propres à la collection. Message unique
 * listant tout ce qui manque.
 */
export const bookableGuard =
  (hasPrices: (data: Record<string, unknown>) => boolean): CollectionBeforeChangeHook =>
  ({ data, originalDoc }) => {
    if (!isRecord(data)) return data;
    const merged: Record<string, unknown> = {
      ...(isRecord(originalDoc) ? originalDoc : {}),
      ...data,
    };
    if (merged.bookable !== true || merged._status === 'draft') return data;
    const missing: string[] = [];
    if (!hasRelation(merged.partner)) missing.push('prestataire');
    if (!hasRelation(merged.cancellationPolicy)) missing.push('conditions d’annulation');
    if (!hasPrices(merged)) missing.push('prix');
    if (missing.length > 0) {
      throw new APIError(
        `Offre vendable incomplète : ${missing.join(', ')}.`,
        400,
        undefined,
        true,
      );
    }
    return data;
  };

export const groupValue = (
  data: Record<string, unknown>,
  name: string,
): Record<string, unknown> => {
  const value = data[name];
  return isRecord(value) ? value : {};
};
