import Link from 'next/link';
import type { ServerProps } from 'payload';
import { FINANCE_ROLES, PARTNER_STATEMENT_PATH } from './partnerStatementPath';

// Lien de navigation de l'admin vers les relevés prestataires (002, US5, T095), affiché aux
// rôles `finance` et `admin` seulement.
export const PartnerStatementNavLink = ({ user }: Pick<ServerProps, 'user'>) => {
  const role = user && 'role' in user ? user.role : null;
  if (typeof role !== 'string' || !FINANCE_ROLES.has(role)) return null;
  return (
    <Link href={PARTNER_STATEMENT_PATH} className="nav__link">
      <span className="nav__link-label">Relevés prestataires</span>
    </Link>
  );
};
