import { APIError, type CollectionConfig } from 'payload';
import { adminOrSelf, isAdmin, isAdminField } from '@/access';

export const PASSWORD_MIN_LENGTH = 12;

// Équipe (data-model « users ») : e-mail + mot de passe de 12 caractères minimum. Le champ
// mot de passe de Payload accepte le collage et les gestionnaires de mots de passe
// (WCAG 3.3.8 : aucune épreuve cognitive à l'authentification).
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Membre de l’équipe', plural: 'Équipe' },
  admin: { useAsTitle: 'email', group: 'Administration' },
  auth: { maxLoginAttempts: 10, lockTime: 10 * 60 * 1000, tokenExpiration: 8 * 60 * 60 },
  access: {
    read: adminOrSelf,
    create: isAdmin,
    update: adminOrSelf,
    delete: isAdmin,
    admin: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        const password: unknown = data.password;
        if (typeof password === 'string' && password.length < PASSWORD_MIN_LENGTH) {
          throw new APIError(
            `Mot de passe trop court : ${PASSWORD_MIN_LENGTH} caractères au minimum.`,
            400,
            undefined,
            true,
          );
        }
        return data;
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', label: 'Nom' },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      label: 'Rôle',
      options: [
        { label: 'Administrateur', value: 'admin' },
        { label: 'Éditeur (contenus et demandes)', value: 'editor' },
        { label: 'Opérations (réservations et disponibilité)', value: 'operations' },
        { label: 'Finance (remboursements, commissions, reversements)', value: 'finance' },
      ],
      access: { update: isAdminField, create: isAdminField },
    },
  ],
};
