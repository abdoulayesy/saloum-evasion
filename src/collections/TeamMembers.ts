import type { CollectionConfig } from 'payload';
import { anyone, isTeam } from '@/access';
import { requiredInFrench } from '@/fields/localized';
import { revalidateHooks } from '@/hooks/revalidate';

// Équipe locale présentée sur « À propos » (FR-007) : vraies photos (principe V).
export const TeamMembers: CollectionConfig = {
  slug: 'teamMembers',
  labels: { singular: 'Membre présenté', plural: 'Équipe présentée' },
  admin: { useAsTitle: 'name', group: 'Contenus', defaultColumns: ['name', 'role', 'order'] },
  access: { read: anyone, create: isTeam, update: isTeam, delete: isTeam },
  hooks: revalidateHooks,
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Nom' },
    {
      name: 'role',
      type: 'text',
      localized: true,
      label: 'Rôle',
      validate: requiredInFrench(() => true, 'Rôle'),
    },
    { name: 'photo', type: 'upload', relationTo: 'media', required: true, label: 'Photo' },
    { name: 'bio', type: 'textarea', localized: true, label: 'Présentation' },
    { name: 'order', type: 'number', defaultValue: 0, label: 'Ordre' },
  ],
};
