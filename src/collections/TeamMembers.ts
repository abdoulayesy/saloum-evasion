import type { CollectionConfig } from 'payload';
import { anyone, isTeam } from '@/access';
import { requiredInFrench } from '@/fields/localized';
import { validateSlug } from '@/fields/validators';
import { autoRedirectHooks } from '@/hooks/autoRedirect';
import { revalidateHooks } from '@/hooks/revalidate';

// Équipe locale présentée sur « À propos » (FR-007) : vraies photos (principe V). Les membres
// qui signent ou relisent un guide publié ont une page d'auteur (004, FR-003b) : `slug`,
// `place`, `sameAs`. Un changement de slug redirige les pages d'auteur (constitution III).
export const TeamMembers: CollectionConfig = {
  slug: 'teamMembers',
  labels: { singular: 'Membre présenté', plural: 'Équipe présentée' },
  admin: {
    useAsTitle: 'name',
    group: 'Contenus',
    defaultColumns: ['name', 'role', 'slug', 'active', 'order'],
  },
  access: { read: anyone, create: isTeam, update: isTeam, delete: isTeam },
  hooks: {
    beforeChange: autoRedirectHooks.beforeChange,
    afterChange: [...autoRedirectHooks.afterChange, ...revalidateHooks.afterChange],
    beforeDelete: autoRedirectHooks.beforeDelete,
    afterDelete: [...autoRedirectHooks.afterDelete, ...revalidateHooks.afterDelete],
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Nom' },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      label: 'Adresse de la page d’auteur',
      validate: (value: unknown) =>
        value === null || value === undefined || value === '' ? true : validateSlug(value),
      admin: {
        description:
          'Prénom-nom en minuscules avec tirets (ex. « aissatou-diop ») : /fr/equipe/… et /en/team/…. Obligatoire pour signer un guide.',
      },
    },
    {
      name: 'role',
      type: 'text',
      localized: true,
      label: 'Rôle',
      validate: requiredInFrench(() => true, 'Rôle'),
    },
    { name: 'place', type: 'text', localized: true, label: 'Lieu (ex. Ndangane)' },
    { name: 'photo', type: 'upload', relationTo: 'media', required: true, label: 'Photo' },
    {
      name: 'bio',
      type: 'textarea',
      localized: true,
      label: 'Présentation',
      admin: { description: '80 à 200 mots pour signer un guide dans cette langue.' },
    },
    {
      name: 'sameAs',
      type: 'array',
      label: 'Liens publics (facultatif)',
      labels: { singular: 'Lien', plural: 'Liens' },
      fields: [
        {
          name: 'url',
          type: 'text',
          required: true,
          label: 'Adresse (https://…)',
          validate: (value: unknown) =>
            typeof value === 'string' && /^https:\/\/[^\s/]+\.\S+$/.test(value)
              ? true
              : 'Adresse complète commençant par https://',
        },
      ],
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Membre actif de l’équipe',
      admin: { description: 'Un membre inactif garde ses signatures existantes.' },
    },
    { name: 'order', type: 'number', defaultValue: 0, label: 'Ordre' },
  ],
};
