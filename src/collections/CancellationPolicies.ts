import type { CollectionConfig } from 'payload';
import { isTeam, anyone } from '@/access';
import { requiredInFrench } from '@/fields/localized';
import { revalidateHooks } from '@/hooks/revalidate';

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
      name: 'details',
      type: 'richText',
      localized: true,
      label: 'Détail',
      validate: requiredInFrench(() => true, 'Détail'),
    },
  ],
};
