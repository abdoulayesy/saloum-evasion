import { checkoutEnv } from '@/lib/env';
import { siteUrl } from '@/lib/site';

// Évènements de mesure côté serveur (002, T064b, T065) : API Events de Plausible, sans cookie
// ni donnée personnelle (moyen de paiement, plan, cause d'échec, durée en secondes). Désactivé
// sans domaine configuré ; un échec n'interrompt jamais le parcours.

export type ServerEvent =
  | 'payment_started'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'payment_abandoned'
  | 'checkout_completed'
  | 'payment_recovered'
  | 'cancellation_requested';

export const trackServer = async (
  event: ServerEvent,
  props: Record<string, string | number>,
  path = '/',
): Promise<void> => {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return;
  try {
    await fetch(checkoutEnv().PLAUSIBLE_EVENTS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'saloum-evasion-server' },
      body: JSON.stringify({ name: event, domain, url: `${siteUrl()}${path}`, props }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // La mesure ne doit jamais casser le paiement.
  }
};
