'use server';

import { notFound, redirect } from 'next/navigation';
import { FAKE_OUTCOMES, type FakeOutcome } from '@/lib/payments/fake';
import { getFakeGateway } from '@/lib/payments';
import { isFakeGatewayEnabled } from './enabled';

// Issue choisie sur la page de paiement simulée (002, T031) : la notification signée part vers le
// point d'entrée réel (`notifyUrl`), éventuellement en différé (`delayMs`, scénario « retour avant
// confirmation »), puis le voyageur revient sur le site — sauf « Ne pas revenir ».

const MAX_DELAY_MS = 60_000;

const isOutcome = (value: unknown): value is FakeOutcome =>
  FAKE_OUTCOMES.some((outcome) => outcome === value);

const sendNotification = async (url: string, body: string, headers: Record<string, string>) => {
  try {
    const response = await fetch(url, { method: 'POST', body, headers, cache: 'no-store' });
    if (!response.ok) console.warn(`[fake-gateway] notification refusée : HTTP ${response.status}`);
  } catch (error) {
    console.warn('[fake-gateway] notification non délivrée', error);
  }
};

export const completeFakePayment = async (formData: FormData): Promise<void> => {
  if (!isFakeGatewayEnabled()) notFound();
  const ref = formData.get('ref');
  const outcome = formData.get('outcome');
  const stay = formData.get('stay') === '1';
  const delay = Math.min(Math.max(Number(formData.get('delayMs')) || 0, 0), MAX_DELAY_MS);
  if (typeof ref !== 'string' || !isOutcome(outcome)) notFound();

  const gateway = getFakeGateway();
  const checkout = gateway.findCheckout(ref);
  const signed = gateway.simulate(ref, outcome);
  if (!checkout || !signed) notFound();

  const deliver = () => sendNotification(checkout.notifyUrl, signed.body, signed.headers);
  if (delay > 0) setTimeout(() => void deliver(), delay);
  else await deliver();

  if (stay) redirect(`/dev/fake-gateway?ref=${encodeURIComponent(ref)}&sent=1`);
  redirect(outcome === 'cancelled_by_user' ? checkout.cancelUrl : checkout.returnUrl);
};
