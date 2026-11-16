import type { CollectionConfig } from 'payload';
import { isTeam, anyone } from '@/access';
import { requiredInFrench } from '@/fields/localized';
import { integerField } from '@/fields/checkout';
import { revalidateHooks } from '@/hooks/revalidate';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Paliers (002, T017) : au moins un, délais uniques, pourcentage qui ne remonte jamais quand le
 * délai diminue (un palier plus proche de l'arrivée ne rembourse pas davantage).
 */
export const validateTiers = (value: unknown): true | string => {
  if (!Array.isArray(value) || value.length === 0) return 'Au moins un palier est obligatoire.';
  const tiers = value.filter(isRecord).map((tier) => ({
    days: tier.daysBeforeArrivalMin,
    percent: tier.refundPercent,
  }));
  if (tiers.some((tier) => typeof tier.days !== 'number' || typeof tier.percent !== 'number'))
    return 'Chaque palier exige un délai et un pourcentage.';
  const days = tiers.map((tier) => Number(tier.days));
  if (new Set(days).size !== days.length) return 'Deux paliers ne peuvent pas avoir le même délai.';
  const sorted = [...tiers].sort((a, b) => Number(b.days) - Number(a.days));
  for (let index = 1; index < sorted.length; index += 1) {
    if (Number(sorted[index]?.percent) > Number(sorted[index - 1]?.percent))
      return 'Le pourcentage remboursé doit diminuer quand le délai diminue.';
  }
  return true;
};

// Conditions d'annulation (principe V) : résumé court affiché près du prix et dans le
// formulaire, détail en texte riche. Source unique réutilisée par toutes les offres.
export const CancellationPolicies: CollectionConfig = {
  slug: 'cancellationPolicies',
  labels: { singular: 'Conditions d’annulation', plural: 'Conditions d’annulation' },
  admin: { useAsTitle: 'name', group: 'Catalogue' },
  access: { read: anyone, create: isTeam, update: isTeam, delete: isTeam },
  hooks: revalidateHooks,
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Nom interne' },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
      maxLength: 160,
      label: 'Résumé (≤ 160 caractères)',
      validate: requiredInFrench(
        (value) =>
          typeof value === 'string' && value.length <= 160 ? true : '160 caractères au maximum.',
        'Résumé',
      ),
    },
    {
      name: 'tiers',
      type: 'array',
      label: 'Paliers de remboursement',
      minRows: 1,
      admin: {
        description:
          'Palier appliqué = le plus grand délai inférieur ou égal aux jours restants avant la prestation. Ex. 30 j → 100 %, 14 j → 50 %, 0 j → 0 %.',
      },
      validate: validateTiers,
      fields: [
        {
          type: 'row',
          fields: [
            integerField('daysBeforeArrivalMin', 'À partir de (jours avant l’arrivée)'),
            integerField('refundPercent', 'Remboursement (%)', { max: 100 }),
          ],
        },
      ],
    },
    {
      name: 'details',
      type: 'richText',
      localized: true,
      label: 'Détail',
      validate: requiredInFrench(() => true, 'Détail'),
    },
  ],
};
