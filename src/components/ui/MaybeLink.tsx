import Link from 'next/link';
import type { ReactNode } from 'react';

// Lien interne vers une page livrée, ou simple texte tant qu'elle n'existe pas (aucun lien
// cassé : contrôle en CI). Cible tactile ≥ 44 px.
type MaybeLinkProps = { href: string | null; children: ReactNode; className?: string };

export const MaybeLink = ({ href, children, className = '' }: MaybeLinkProps) =>
  href ? (
    <Link
      href={href}
      className={`inline-flex min-h-touch min-w-touch items-center underline underline-offset-4 ${className}`}
    >
      {children}
    </Link>
  ) : (
    <span className={className}>{children}</span>
  );
