import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFakeGateway } from '@/lib/payments';
import { formatXof } from '@/lib/pricing';
import '@/styles/globals.css';
import { completeFakePayment } from './actions';
import { isFakeGatewayEnabled } from './enabled';

// Page de paiement hébergée simulée (002, T031) : remplace la page de l'agrégateur en dev, en CI
// et dans les E2E. 404 en production. Le layout racine étant transparent, elle rend son document.

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Paiement simulé',
  robots: { index: false, follow: false },
};

const METHOD_LABELS = { wave: 'Wave', orange_money: 'Orange Money', card: 'Carte bancaire' };

const OUTCOMES = [
  { outcome: 'succeeded', label: 'Réussir', primary: true },
  { outcome: 'insufficient_funds', label: 'Solde insuffisant', primary: false },
  { outcome: 'declined', label: 'Refuser', primary: false },
  { outcome: 'cancelled_by_user', label: 'Annuler', primary: false },
  { outcome: 'timeout', label: 'Délai dépassé', primary: false },
  { outcome: 'technical', label: 'Erreur technique', primary: false },
] as const;

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const FakeGatewayPage = async ({ searchParams }: Props) => {
  if (!isFakeGatewayEnabled()) notFound();
  const params = await searchParams;
  const ref = typeof params.ref === 'string' ? params.ref : '';
  const delayMs = typeof params.delayMs === 'string' ? params.delayMs : '0';
  const checkout = getFakeGateway().findCheckout(ref);
  if (!checkout) notFound();

  return (
    <html lang="fr-SN">
      <body className="bg-sable text-ink">
        <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-8">
          <p className="rounded-control bg-ocre px-3 py-2 text-sm font-semibold text-sable">
            Passerelle de test : aucun argent n’est débité.
          </p>
          <h1 className="text-mangrove">Paiement {METHOD_LABELS[checkout.method]}</h1>
          <dl className="grid gap-2">
            <div className="flex justify-between gap-4">
              <dt>Référence</dt>
              <dd className="font-semibold">{checkout.bookingReference}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Montant</dt>
              <dd className="font-semibold" data-testid="fake-amount">
                {formatXof(checkout.amountXof)}
              </dd>
            </div>
          </dl>
          <p className="text-ink-muted">{checkout.description}</p>
          {params.sent === '1' ? (
            <p role="status" className="font-semibold">
              Notification envoyée sans retour sur le site.
            </p>
          ) : null}
          <form action={completeFakePayment} className="grid gap-3">
            <input type="hidden" name="ref" value={ref} />
            <input type="hidden" name="delayMs" value={delayMs} />
            {OUTCOMES.map(({ outcome, label, primary }) => (
              <button
                key={outcome}
                type="submit"
                name="outcome"
                value={outcome}
                className={
                  primary
                    ? 'min-h-touch rounded-control bg-mangrove px-6 font-semibold text-sable'
                    : 'min-h-touch rounded-control border border-mangrove px-6 font-semibold text-mangrove'
                }
              >
                {label}
              </button>
            ))}
          </form>
          <form action={completeFakePayment}>
            <input type="hidden" name="ref" value={ref} />
            <input type="hidden" name="delayMs" value={delayMs} />
            <input type="hidden" name="stay" value="1" />
            <button
              type="submit"
              name="outcome"
              value="succeeded"
              className="min-h-touch w-full rounded-control px-6 underline underline-offset-4"
            >
              Ne pas revenir (réussite notifiée seulement)
            </button>
          </form>
        </main>
      </body>
    </html>
  );
};

export default FakeGatewayPage;
