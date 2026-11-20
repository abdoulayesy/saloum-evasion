import { APIError, type GlobalBeforeChangeHook, type GlobalConfig } from 'payload';
import { isFinance, isStaff } from '@/access';
import { civilDateField, integerField, offerTypeOptions } from '@/fields/checkout';
import { MAX_COMMISSION_BP, MIN_COMMISSION_BP } from '@/lib/checkout/commission';
import { rateHistoryErrors, type RateEntry } from '@/lib/checkout/commissionRate';
import type { OfferType } from '@/lib/checkout/validateCart';

/** Taux par défaut (data-model) en points de base : 1000 = 10 %. */
export const DEFAULT_COMMISSION_RATES: {
  offerType: OfferType;
  rateBp: number;
  effectiveFrom: string;
}[] = [
  { offerType: 'transfer', rateBp: 1000, effectiveFrom: '2026-01-01' },
  { offerType: 'table', rateBp: 1500, effectiveFrom: '2026-01-01' },
  { offerType: 'accommodation', rateBp: 1500, effectiveFrom: '2026-01-01' },
  { offerType: 'experience', rateBp: 2000, effectiveFrom: '2026-01-01' },
  { offerType: 'stay', rateBp: 2500, effectiveFrom: '2026-01-01' },
];

const OFFER_TYPES: readonly OfferType[] = DEFAULT_COMMISSION_RATES.map((rate) => rate.offerType);

const isOfferType = (value: unknown): value is OfferType =>
  OFFER_TYPES.some((offerType) => offerType === value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** Lignes du tableau `rates` (données de formulaire non typées). */
const rateEntries = (value: unknown): RateEntry[] =>
  Array.isArray(value)
    ? value.flatMap((row: unknown) =>
        isRecord(row) &&
        isOfferType(row.offerType) &&
        typeof row.rateBp === 'number' &&
        typeof row.effectiveFrom === 'string'
          ? [{ offerType: row.offerType, rateBp: row.rateBp, effectiveFrom: row.effectiveFrom }]
          : [],
      )
    : [];

/** Historique sans effet rétroactif (US5, T096). */
const guardRateHistory: GlobalBeforeChangeHook = ({ data, originalDoc }) => {
  const today = new Date().toISOString().slice(0, 10);
  const errors = rateHistoryErrors(
    rateEntries(isRecord(originalDoc) ? originalDoc.rates : undefined),
    rateEntries(data.rates),
    today,
  );
  if (errors.length > 0) throw new APIError(errors.join(' '), 400, null, true);
  return data;
};

// Taux de commission par type d'offre (002, T021, T096), historisés : une nouvelle ligne avec sa
// date d'effet, jamais de modification rétroactive. Le taux en vigueur est copié dans la ligne de
// réservation au premier paiement réussi (FR-034).
export const CommissionRates: GlobalConfig = {
  slug: 'commissionRates',
  label: 'Taux de commission',
  admin: {
    group: 'Finance',
    description:
      'Le taux appliqué à une réservation est celui en vigueur au moment de son premier paiement réussi ; il est figé ensuite. Changer un taux ne modifie donc jamais les réservations déjà payées.',
  },
  access: { read: isStaff, update: isFinance },
  hooks: { beforeChange: [guardRateHistory] },
  fields: [
    {
      name: 'inForce',
      type: 'ui',
      admin: {
        components: { Field: '/components/admin/CommissionRatesInForce#CommissionRatesInForce' },
      },
    },
    {
      name: 'rates',
      type: 'array',
      label: 'Taux (historique)',
      labels: { singular: 'Taux', plural: 'Taux' },
      defaultValue: DEFAULT_COMMISSION_RATES,
      admin: {
        description: `Pour changer un taux, ajoutez une ligne avec sa date d’effet (aujourd’hui ou plus tard) : les lignes déjà en vigueur restent dans l’historique et ne se modifient pas. Taux en points de base, entre ${MIN_COMMISSION_BP} (10 %) et ${MAX_COMMISSION_BP} (25 %) : 1500 = 15 %. Le taux appliqué est le plus récent dont la date d’effet est passée.`,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'offerType',
              type: 'select',
              required: true,
              label: 'Type d’offre',
              options: offerTypeOptions,
            },
            integerField('rateBp', 'Taux (points de base)', {
              min: MIN_COMMISSION_BP,
              max: MAX_COMMISSION_BP,
            }),
            civilDateField('effectiveFrom', 'En vigueur à partir du', true),
          ],
        },
      ],
    },
  ],
};
