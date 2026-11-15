import Link from 'next/link';
import type { ReactNode } from 'react';

export type ErrorLink = { href: string; label: string };

type ErrorViewProps = {
  title: string;
  body: string;
  primary: ReactNode;
  exploreTitle: string;
  links: readonly ErrorLink[];
};

// Gabarit commun 404 / 500 : H1 unique, texte utile, action principale dans la zone du pouce,
// liens de rebond. Les séjours populaires et la recherche s'ajoutent quand ils existent (US1).
export const ErrorView = ({ title, body, primary, exploreTitle, links }: ErrorViewProps) => (
  <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12 sm:px-8">
    <h1 className="text-mangrove">{title}</h1>
    <p className="text-lg text-ink-muted">{body}</p>
    <div>{primary}</div>
    {links.length > 0 && (
      <section aria-labelledby="erreur-explorer">
        <h2 id="erreur-explorer">{exploreTitle}</h2>
        <ul className="mt-2 flex flex-col">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-flex min-h-touch min-w-touch items-center underline underline-offset-4"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    )}
  </div>
);

export const primaryButtonClass =
  'inline-flex min-h-touch w-full items-center justify-center rounded-control bg-mangrove px-6 font-semibold text-sable sm:w-auto';
