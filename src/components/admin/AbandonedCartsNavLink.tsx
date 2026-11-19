import Link from 'next/link';
import { ABANDONED_CARTS_PATH } from './abandonedCartsPath';

// Lien de navigation de l'admin vers la vue des paniers abandonnés (002, US3, T080).
export const AbandonedCartsNavLink = () => (
  <Link href={ABANDONED_CARTS_PATH} className="nav__link">
    <span className="nav__link-label">Paniers abandonnés</span>
  </Link>
);
