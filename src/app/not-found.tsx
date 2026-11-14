import Link from 'next/link';
import { fontVariables } from '@/styles/fonts';
import '@/styles/globals.css';

// 404 des URL hors locale (ex. /es/…) : le layout racine étant transparent, cette page rend
// son propre document. Langue de référence : français, avec accès à l'anglais.
const RootNotFound = () => (
  <html lang="fr-SN" className={fontVariables}>
    <head>
      <title>Page introuvable | Saloum Évasion</title>
    </head>
    <body>
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-6 px-4 py-12 sm:px-8">
        <h1 className="text-mangrove">Page introuvable</h1>
        <p className="text-lg text-ink-muted">
          Cette page n’existe pas ou plus. Le Saloum, lui, vous attend toujours.
        </p>
        <Link
          href="/fr"
          className="inline-flex min-h-touch w-full items-center justify-center rounded-control bg-mangrove px-6 font-semibold text-sable sm:w-auto"
        >
          Retour à l’accueil
        </Link>
        <Link
          href="/en"
          hrefLang="en"
          lang="en"
          className="inline-flex min-h-touch min-w-touch items-center underline underline-offset-4"
        >
          English version
        </Link>
      </main>
    </body>
  </html>
);

export default RootNotFound;
