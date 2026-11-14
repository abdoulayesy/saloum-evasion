import type { CollectionConfig } from 'payload';
import { anyone, isTeam } from '@/access';
import { revalidateHooks } from '@/hooks/revalidate';

const PATH_PATTERN = /^\/(fr|en)(\/[a-z0-9]+(-[a-z0-9]+)*)*$/;

const validatePath = (value: unknown): true | string =>
  typeof value === 'string' && PATH_PATTERN.test(value)
    ? true
    : 'Chemin interne en minuscules, ex. /fr/sejours/week-end-bolong.';

// Redirections 301 (constitution III) : créées automatiquement quand un slug change ou qu'un
// contenu est dépublié (phase US3), ou à la main ; chaînes aplaties, un seul saut.
export const Redirects: CollectionConfig = {
  slug: 'redirects',
  labels: { singular: 'Redirection', plural: 'Redirections' },
  admin: {
    useAsTitle: 'from',
    group: 'Administration',
    defaultColumns: ['from', 'to', 'reason', 'updatedAt'],
  },
  access: { read: anyone, create: isTeam, update: isTeam, delete: isTeam },
  hooks: revalidateHooks,
  fields: [
    {
      name: 'from',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Ancienne adresse',
      validate: validatePath,
    },
    { name: 'to', type: 'text', required: true, label: 'Nouvelle adresse', validate: validatePath },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: '301',
      label: 'Type',
      options: [{ label: '301 (définitive)', value: '301' }],
    },
    {
      name: 'reason',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      label: 'Origine',
      options: [
        { label: 'Slug modifié', value: 'slug_change' },
        { label: 'Contenu dépublié', value: 'unpublished' },
        { label: 'Manuelle', value: 'manual' },
      ],
    },
  ],
};
