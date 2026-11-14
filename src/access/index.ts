import type { Access, FieldAccess, PayloadRequest } from 'payload';

// Droits d'accès communs (data-model « users ») : `admin` (tout), `editor` (contenus +
// demandes). Aucun compte visiteur.

type Role = 'admin' | 'editor';

const roleOf = (req: PayloadRequest): Role | null => {
  const user = req.user;
  if (!user || !('role' in user)) return null;
  return user.role === 'admin' || user.role === 'editor' ? user.role : null;
};

export const isAdmin: Access = ({ req }) => roleOf(req) === 'admin';

export const isTeam: Access = ({ req }) => roleOf(req) !== null;

export const isAdminField: FieldAccess = ({ req }) => roleOf(req) === 'admin';

/** Public : documents publiés seulement ; équipe : tout, brouillons compris. */
export const publishedOrTeam: Access = ({ req }) =>
  roleOf(req) !== null ? true : { _status: { equals: 'published' } };

export const anyone: Access = () => true;

export const nobody: Access = () => false;

/** Admin, ou l'utilisateur sur son propre compte. */
export const adminOrSelf: Access = ({ req }) => {
  const role = roleOf(req);
  if (role === 'admin') return true;
  if (!req.user) return false;
  return { id: { equals: req.user.id } };
};
