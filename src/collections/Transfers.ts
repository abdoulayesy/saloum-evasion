import type { CollectionConfig } from 'payload';
import { anyone, isTeam } from '@/access';
import { bookableFields, bookableGuard } from '@/fields/bookable';
import { amountField, integerField } from '@/fields/checkout';
import { requiredInFrench } from '@/fields/localized';
import { revalidateHooks } from '@/hooks/revalidate';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Tranches de passagers : au moins une, plafonds strictement croissants (FR-041). */
export const validatePriceTiers = (value: unknown): true | string => {
  if (!Array.isArray(value) || value.length === 0) return 'Au moins une tranche est obligatoire.';
  const caps = value.filter(isRecord).map((tier) => tier.maxPassengers);
  if (caps.some((cap) => typeof cap !== 'number')) return 'Chaque tranche exige un plafond.';
  for (let index = 1; index < caps.length; index += 1) {
    if (Number(caps[index]) <= Number(caps[index - 1]))
      return 'Les plafonds de passagers doivent être croissants (ex. 3, 7, 14).';
  }
  return true;
};

// Trajets de transfert AIBD / Dakar (002, T019) : prix par véhicule selon la tranche de passagers
// (bébés compris). Pas de page publique : proposés dans le panier et sur les fiches.
export const Transfers: CollectionConfig = {
  slug: 'transfers',
  labels: { singular: 'Transfert', plural: 'Transferts' },
  admin: {
    useAsTitle: 'title',
    group: 'Catalogue',
    defaultColumns: ['title', 'origin', 'destination', 'bookable'],
  },
  access: { read: anyone, create: isTeam, update: isTeam, delete: isTeam },
  hooks: {
    beforeChange: [bookableGuard((data) => validatePriceTiers(data.priceTiers) === true)],
    afterChange: revalidateHooks.afterChange,
    afterDelete: revalidateHooks.afterDelete,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      label: 'Trajet',
      admin: { description: 'Ex. « Aéroport AIBD → Ndangane ».' },
      validate: requiredInFrench(() => true, 'Trajet'),
    },
    {
      type: 'row',
      fields: [
        {
          name: 'origin',
          type: 'select',
          required: true,
          label: 'Départ',
          options: [
            { label: 'Aéroport AIBD', value: 'aibd' },
            { label: 'Dakar', value: 'dakar' },
          ],
        },
        {
          name: 'destination',
          type: 'relationship',
          relationTo: 'destinations',
          required: true,
          label: 'Destination',
        },
        integerField('durationMinutes', 'Durée (minutes)', { min: 1, required: false }),
      ],
    },
    {
      name: 'priceTiers',
      type: 'array',
      label: 'Prix par véhicule selon le nombre de passagers',
      minRows: 1,
      validate: validatePriceTiers,
      defaultValue: [
        { maxPassengers: 3, pricePerVehicle: 0 },
        { maxPassengers: 7, pricePerVehicle: 0 },
        { maxPassengers: 14, pricePerVehicle: 0 },
      ],
      fields: [
        {
          type: 'row',
          fields: [
            integerField('maxPassengers', 'Jusqu’à (passagers, bébés compris)', { min: 1 }),
            amountField('pricePerVehicle', 'Prix par véhicule'),
          ],
        },
      ],
    },
    ...bookableFields(),
  ],
};
