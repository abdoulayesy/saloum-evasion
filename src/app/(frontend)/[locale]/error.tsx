'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ErrorView, primaryButtonClass } from '@/components/views/ErrorView';

// Erreur serveur dans une page publique (statut 500). Composant client imposé par Next ;
// textes intégrés pour ne pas embarquer tout le catalogue de traductions côté client.
const texts = {
  fr: {
    title: 'Une erreur est survenue',
    body: 'Nous n’avons pas pu afficher cette page. Réessayez dans un instant.',
    retry: 'Réessayer',
    home: 'Retour à l’accueil',
    explore: 'Continuer la découverte',
  },
  en: {
    title: 'Something went wrong',
    body: 'We could not display this page. Please try again in a moment.',
    retry: 'Try again',
    home: 'Back to home',
    explore: 'Keep exploring',
  },
} as const;

type ErrorProps = { error: Error & { digest?: string }; reset: () => void };

const PageError = ({ error, reset }: ErrorProps) => {
  const params = useParams<{ locale: string }>();
  const locale = params.locale === 'en' ? 'en' : 'fr';
  const t = texts[locale];

  useEffect(() => {
    console.error(error.digest ?? error.message);
  }, [error]);

  return (
    <>
      <meta name="robots" content="noindex" />
      <ErrorView
        title={t.title}
        body={t.body}
        primary={
          <button type="button" onClick={reset} className={primaryButtonClass}>
            {t.retry}
          </button>
        }
        exploreTitle={t.explore}
        links={[{ href: `/${locale}`, label: t.home }]}
      />
    </>
  );
};

export default PageError;
