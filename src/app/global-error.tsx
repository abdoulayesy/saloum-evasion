'use client';

import Link from 'next/link';
import '@/styles/globals.css';

// Erreur dans le layout lui-même : remplace tout le document (Next impose son emplacement à
// la racine de `app/`). Bilingue, sans dépendance, noindex.
type GlobalErrorProps = { reset: () => void };

const GlobalError = ({ reset }: GlobalErrorProps) => (
  <html lang="fr-SN">
    <head>
      <title>Erreur | Saloum Évasion</title>
      <meta name="robots" content="noindex" />
    </head>
    <body>
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-6 px-4 py-12">
        <h1 className="text-mangrove">Une erreur est survenue</h1>
        <p className="text-lg text-ink-muted" lang="fr-SN">
          Nous n’avons pas pu afficher cette page. Réessayez dans un instant.
        </p>
        <p className="text-lg text-ink-muted" lang="en">
          Something went wrong. Please try again in a moment.
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-touch w-full items-center justify-center rounded-control bg-mangrove px-6 font-semibold text-sable sm:w-auto"
        >
          Réessayer / Try again
        </button>
        <Link
          href="/fr"
          className="inline-flex min-h-touch min-w-touch items-center underline underline-offset-4"
        >
          Retour à l’accueil
        </Link>
      </main>
    </body>
  </html>
);

export default GlobalError;
