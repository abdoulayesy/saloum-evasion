import Link from 'next/link';
import type { Crumb } from '@/lib/seo/breadcrumbs';

type BreadcrumbsProps = { crumbs: readonly Crumb[]; label: string };

// Fil d'Ariane visible (FR-025). À 360 px : retour à la ligne autorisé, cibles de 44 px de
// haut, séparateurs décoratifs masqués aux lecteurs d'écran.
export const Breadcrumbs = ({ crumbs, label }: BreadcrumbsProps) => {
  if (crumbs.length === 0) return null;
  return (
    <nav aria-label={label} className="px-4 pt-2 text-sm sm:px-8">
      <ol className="flex flex-wrap items-center gap-x-1 text-ink-muted">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={`${index}-${crumb.name}`} className="flex items-center gap-x-1">
              {index > 0 && <span aria-hidden="true">/</span>}
              {crumb.path && !isLast ? (
                <Link
                  href={crumb.path}
                  className="inline-flex min-h-touch min-w-touch items-center underline underline-offset-4"
                >
                  {crumb.name}
                </Link>
              ) : (
                <span aria-current="page" className="inline-flex min-h-touch items-center">
                  {crumb.name}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
