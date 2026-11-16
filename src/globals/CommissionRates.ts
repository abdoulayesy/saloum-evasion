import type { GlobalConfig } from 'payload';
import { isFinance, isStaff } from '@/access';
import { civilDateField, integerField, offerTypeOptions } from '@/fields/checkout';
import { MAX_COMMISSION_BP, MIN_COMMISSION_BP } from '@/lib/checkout/commission';
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

// Taux de commission par type d'offre (002, T021), historisés : une nouvelle ligne avec sa date
// d'effet, jamais de modification rétroactive. Le taux en vigueur est copié dans la ligne de
// réservation au premier paiement réussi (FR-034).
export const CommissionRates: GlobalConfig = {
  slug: 'commissionRates',
  label: 'Taux de commission',
  admin: { group: 'Finance' },
  access: { read: isStaff, update: isFinance },
  fields: [
    {
      name: 'rates',
      type: 'array',
      label: 'Taux (historique)',
      defaultValue: DEFAULT_COMMISSION_RATES,
      admin: {
        description: `Taux en points de base, entre ${MIN_COMMISSION_BP} (10 %) et ${MAX_COMMISSION_BP} (25 %). Le taux appliqué est le plus récent dont la date d’effet est passée.`,
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
