import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import type { Payload } from 'payload';
import { findBookingForCart } from '@/lib/booking/createBooking';
import { hashCartToken, newCartToken, writeCartCookies } from '@/lib/cart/cookies';
import { loadSeasons } from '@/lib/cart/offers';
import { verifyReminderLinkToken, type ReminderSource } from '@/lib/cart/reminderLink';
import { cartSummary } from '@/lib/cart/repository';
import { reviewCart, todayInDakar } from '@/lib/cart/validate';
import { checkoutPath } from '@/lib/checkout/paths';
import { getPayloadClient } from '@/lib/cms/queries';
import type { Cart } from '@/payload-types';
import { tunnelLocale } from '../../locale';

// Reprise après relance (002, US3, T079 ; contrat routes-tunnel) : `/fr/panier/reprendre?t=…`.
// Jeton signé valable 7 jours → le panier est rattaché à cet appareil (nouveau cookie : seule
// l'empreinte du jeton est stockée, il est donc régénéré), l'ouverture du lien est notée, puis :
// - prix ou disponibilité changés → panier, changements signalés, nouvelle version du panier
//   (la réservation sera refigée aux prix du jour à l'étape coordonnées) ;
// - sinon → étape paiement (ou coordonnées si la réservation n'existe plus) ;
// - panier déjà commandé → page de la réservation (accessible par le cookie du panier).
// Gestionnaire de route : seul endroit, avec les Server Actions, où un cookie peut être posé.

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ locale: string }> };

/** Note l'ouverture du lien sur la relance correspondante (mesure de récupération, T081). */
const markLinkOpened = async (payload: Payload, cart: Cart, source: ReminderSource) => {
  if (source.kind !== 'reminder') return;
  const { docs } = await payload.find({
    collection: 'reminders',
    where: {
      and: [
        { targetType: { equals: 'carts' } },
        { targetId: { equals: cart.id } },
        { kind: { equals: 'abandoned_cart' } },
        { channel: { equals: source.channel } },
        { rank: { equals: source.rank } },
      ],
    },
    limit: 1,
    depth: 0,
  });
  const reminder = docs[0];
  if (reminder && !reminder.linkOpenedAt) {
    await payload.update({
      collection: 'reminders',
      id: reminder.id,
      data: { linkOpenedAt: new Date().toISOString() },
    });
  }
};

export const GET = async (request: NextRequest, { params }: Context) => {
  const locale = await tunnelLocale(params);
  const cartPage = checkoutPath(locale, 'cart');
  const verified = verifyReminderLinkToken(request.nextUrl.searchParams.get('t') ?? '', 'resume');
  if (!verified) redirect(`${cartPage}?reprise=expiree`);

  const payload = await getPayloadClient();
  const cart = await payload
    .findByID({ collection: 'carts', id: verified.cartId, depth: 0 })
    .catch(() => null);
  if (!cart || (cart.status !== 'open' && cart.status !== 'checked_out')) {
    redirect(`${cartPage}?reprise=expiree`);
  }

  const token = newCartToken();
  await payload.update({
    collection: 'carts',
    id: cart.id,
    data: { tokenHash: hashCartToken(token) },
  });
  await writeCartCookies(
    token,
    cart.status === 'open' ? cartSummary(cart) : { count: 0, total: 0 },
  );
  await markLinkOpened(payload, cart, verified.source);

  const booking = await findBookingForCart(payload, cart);
  if (cart.status === 'checked_out' || (booking && booking.status !== 'awaiting_payment')) {
    redirect(booking ? checkoutPath(locale, 'booking', booking.reference) : cartPage);
  }

  const reviewed = await reviewCart(payload, cart.items ?? [], {
    locale,
    today: todayInDakar(),
    seasons: await loadSeasons(payload),
  });
  const changed = reviewed.some(
    (line) => line.issues.length > 0 || line.currentTotal !== line.item.quotedTotal,
  );
  if (changed) {
    await payload.update({
      collection: 'carts',
      id: cart.id,
      data: { version: (cart.version ?? 0) + 1 },
    });
    redirect(`${cartPage}?reprise=changements`);
  }
  redirect(checkoutPath(locale, booking ? 'payment' : 'details'));
};
