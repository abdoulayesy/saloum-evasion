import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { AddToCartForm, type AddToCartOffer } from './AddToCartForm';

// Bloc « Réserver en ligne » des fiches vendables (002, T046) : formulaire serveur d'ajout au
// panier, rappel des conditions d'annulation (constitution V). Ancre `#reserver` visée par
// l'action principale de la barre collante.

type Props = { locale: Locale; offer: AddToCartOffer; cancellationSummary?: string | null };

export const BookOnline = async ({ locale, offer, cancellationSummary }: Props) => {
  const t = await getTranslations({ locale, namespace: 'cart' });
  const tStay = await getTranslations({ locale, namespace: 'stay' });
  return (
    <section
      id="reserver"
      aria-labelledby="reserver-titre"
      className="scroll-mt-4 rounded-card border-2 border-mangrove bg-white p-4"
    >
      <h2 id="reserver-titre" className="text-mangrove">
        {t('bookTitle')}
      </h2>
      <p className="mt-2 text-ink-muted">{t('bookIntro')}</p>
      {cancellationSummary && (
        <p className="mt-2 text-sm">
          <strong>{tStay('cancellation')} :</strong> {cancellationSummary}
        </p>
      )}
      <div className="mt-4">
        <AddToCartForm locale={locale} offer={offer} />
      </div>
    </section>
  );
};
