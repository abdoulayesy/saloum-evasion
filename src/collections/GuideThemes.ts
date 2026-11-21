import type { CollectionConfig } from 'payload';
import { anyone, isTeam } from '@/access';
import { requiredInFrench } from '@/fields/localized';
import { revalidateHooks } from '@/hooks/revalidate';

// Thèmes des Carnets du Saloum (004, research R11) : regroupement des guides sur la page de la
// rubrique, sans page propre. Trois au lancement, modifiables par l'équipe.
export const GuideThemes: CollectionConfig = {
  slug: 'guideThemes',
  labels: { singular: 'Thème des Carnets', plural: 'Thèmes des Carnets' },
  admin: { useAsTitle: 'name', group: 'Carnets du Saloum', defaultColumns: ['name', 'order'] },
  access: { read: anyone, create: isTeam, update: isTeam, delete: isTeam },
  hooks: revalidateHooks,
  fields: [
    {
      name: 'name',
      type: 'text',
      localized: true,
      label: 'Nom',
      validate: requiredInFrench(() => true, 'Nom'),
    },
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      label: 'Clé (brouillons)',
      admin: {
        description: 'Identifiant utilisé par les brouillons Markdown (ex. « que-faire »).',
      },
    },
    { name: 'order', type: 'number', defaultValue: 0, label: 'Ordre' },
  ],
};
