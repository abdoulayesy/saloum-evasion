'use client';

import { useEffect, useState, type ReactNode } from 'react';

// Badge du panier (002, T049, < 1 Ko) : lit le cookie lisible `se_cart_summary` (« nombre.total »,
// sans donnée personnelle) ; si le panier n'est pas vide, remplace l'action « Demander » de la
// barre collante par « Panier · n · total », de même taille (aucun décalage). Les pages publiques
// restent statiques : rien n'est lu côté serveur.

type Props = {
  href: string;
  /** Gabarit localisé avec `{count}` et `{total}` (ex. « Panier · {count} · {total} »). */
  template: string;
  className: string;
  children: ReactNode;
};

const readSummary = (): { count: number; total: number } | null => {
  const match = /(?:^|;\s*)se_cart_summary=(\d{1,3})\.(\d{1,12})/.exec(document.cookie);
  if (!match) return null;
  const count = Number(match[1]);
  return count > 0 ? { count, total: Number(match[2]) } : null;
};

const group = (value: number): string => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export const CartBadge = ({ href, template, className, children }: Props) => {
  const [summary, setSummary] = useState<{ count: number; total: number } | null>(null);
  useEffect(() => setSummary(readSummary()), []);
  if (!summary) return <>{children}</>;
  const label = template
    .replace('{count}', String(summary.count))
    .replace('{total}', `${group(summary.total)} FCFA`);
  return (
    <a href={href} className={className}>
      {label}
    </a>
  );
};
