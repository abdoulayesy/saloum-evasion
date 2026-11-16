import type { Access, FieldAccess, PayloadRequest } from 'payload';

// Droits d'accès communs (data-model 001 « users » et matrice des rôles de la 002). Aucun compte
// visiteur. Rôles :
// - `admin` : tout ;
// - `editor` : contenus 001 et demandes ;
// - `operations` : réservations, disponibilité, demandes de remboursement (lecture des contenus) ;
// - `finance` : remboursements, commissions, reversements (lecture des contenus et réservations).

export const ROLES = ['admin', 'editor', 'operations', 'finance'] as const;

export type Role = (typeof ROLES)[number];

const isRole = (value: unknown): value is Role => ROLES.some((role) => role === value);

export const roleOf = (req: PayloadRequest): Role | null => {
  const user = req.user;
  if (!user || !('role' in user)) return null;
  return isRole(user.role) ? user.role : null;
};

/** Droit d'accès par rôles ; la liste reste lisible (`roles`) pour le test de la matrice. */
export type RoleAccess = Access & { roles: readonly Role[] };

const allow = (...roles: Role[]): RoleAccess =>
  Object.assign<Access, { roles: readonly Role[] }>(
    ({ req }) => {
      const role = roleOf(req);
      return role !== null && roles.includes(role);
    },
    { roles },
  );

const allowField =
  (...roles: Role[]): FieldAccess =>
  ({ req }) => {
    const role = roleOf(req);
    return role !== null && roles.includes(role);
  };

export const isAdmin: RoleAccess = allow('admin');

/** Écriture des contenus éditoriaux 001 (offres, pages, médias, réglages). */
export const isTeam: RoleAccess = allow('admin', 'editor');

/** Tout membre de l'équipe, quel que soit son rôle (lecture de l'admin). */
export const isStaff: RoleAccess = allow(...ROLES);

/** Réservations et disponibilité. */
export const isOperations: RoleAccess = allow('admin', 'operations');

/** Remboursements validés, commissions, reversements. */
export const isFinance: RoleAccess = allow('admin', 'finance');

/** Lecture des réservations : opérations et finance. */
export const isBackOffice: RoleAccess = allow('admin', 'operations', 'finance');

export const isAdminField: FieldAccess = allowField('admin');

export const isFinanceField: FieldAccess = allowField('admin', 'finance');

export const isOperationsField: FieldAccess = allowField('admin', 'operations');

/** Public : documents publiés seulement ; équipe : tout, brouillons compris. */
export const publishedOrTeam: Access = ({ req }) =>
  roleOf(req) !== null ? true : { _status: { equals: 'published' } };

export const anyone: Access = () => true;

/** Personne, pas même un administrateur : écritures réservées au serveur (API locale). */
export const nobody: RoleAccess = allow();

/** Admin, ou l'utilisateur sur son propre compte. */
export const adminOrSelf: Access = ({ req }) => {
  const role = roleOf(req);
  if (role === 'admin') return true;
  if (!req.user) return false;
  return { id: { equals: req.user.id } };
};
