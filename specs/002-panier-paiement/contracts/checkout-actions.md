# Contrat — Server Actions du panier et du tunnel

Toutes les actions sont des **Server Actions** appelées par des `<form>` : elles fonctionnent
sans JavaScript (redirection 303 vers la page suivante ou vers la même page avec erreurs) et,
avec JavaScript, sans rechargement complet. Validation **Zod côté serveur** ; aucun montant
n'est accepté du client ; chaque action recalcule les prix à partir de la source unique.

Type de retour commun :

```ts
type ActionResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'invalid'; fieldErrors: Record<string, string[]> } // messages localisés
  | { status: 'conflict'; reason: ConflictReason }
  | { status: 'rate_limited' }
  | { status: 'error' };

type ConflictReason =
  | 'price_changed'
  | 'offer_unavailable'
  | 'cart_expired'
  | 'payment_pending'
  | 'booking_not_payable';
```

## `addToCart`

```ts
const addToCartSchema = z.discriminatedUnion('offerType', [
  z.object({ offerType: z.literal('accommodation'), offerId: z.string(),
    startDate: isoDate, endDate: isoDate, adults: int(1, 30), children: int(0, 20), infants: int(0, 10) }),
  z.object({ offerType: z.literal('stay'), offerId: z.string(),
    startDate: isoDate, adults: int(1, 30), children: int(0, 20), infants: int(0, 10) }),
  z.object({ offerType: z.enum(['experience', 'table']), offerId: z.string(),
    date: isoDate, slot: z.string().max(40), adults: int(1, 30), children: int(0, 20), infants: int(0, 10) }),
  z.object({ offerType: z.literal('transfer'), offerId: z.string(),
    direction: z.enum(['outbound', 'return', 'both']), outboundDate: isoDate, outboundTime: hhmm,
    returnDate: isoDate.optional(), returnTime: hhmm.optional(), passengers: int(1, 14) }),
]);
```

- Crée le panier et pose `se_cart` s'il n'existe pas ; met à jour `se_cart_summary`.
- Un second hébergement ou séjour → `conflict` avec proposition de remplacement
  (`replaceLineId` à renvoyer).
- Retour : `{ cartCount, cartTotal, lineId }` ; sans JS, 303 vers la page d'origine avec
  `?added={lineId}` (message d'état annoncé par `role="status"`).

## `updateCartLine` / `removeCartLine`

`{ lineId, ...champs modifiables }` / `{ lineId }`. Incrémente `carts.version`. Recalcule et
renvoie le panier.

## `submitContactDetails`

```ts
const contactSchema = z.object({
  firstName: z.string().trim().min(1).max(60),           // autocomplete="given-name"
  lastName: z.string().trim().min(1).max(60),            // autocomplete="family-name"
  whatsapp: e164,                                        // type="tel" autocomplete="tel" ; indicatif par défaut +221
  email: z.string().trim().email().max(254),             // type="email" autocomplete="email"
  specialRequest: z.string().trim().max(1000).optional(),
  consentProcessing: z.literal('on'),                    // obligatoire (FR-012)
  consentReminders: z.literal('on').optional(),          // jamais précoché
  website: z.string().max(0).optional(),                 // pot de miel
});
```

- Revalide le panier (FR-004). En cas de problème : `conflict` + retour au panier.
- Crée ou retrouve la `Booking` `awaiting_payment` unique pour `(cart, version)` ; recopie les
  lignes, figes les prix et les `policySnapshot`.
- Limitation de débit : 10 / heure / IP (table `rateLimits` de la 001).
- 303 → étape paiement.

## `startPayment`

```ts
const startPaymentSchema = z.object({
  bookingRef: z.string().regex(/^SE-[A-HJ-NP-Z2-9]{6}$/),
  plan: z.enum(['full', 'deposit']),          // 'deposit' refusé si non éligible (FR-016)
  method: z.enum(['wave', 'orange_money', 'card']),
  acceptCancellation: z.literal('on'),        // FR-014
  purpose: z.enum(['initial', 'balance']).default('initial'),
});
```

- Vérifie l'accès (cookie du panier ou jeton de gestion pour le solde).
- Vérifie qu'aucun paiement `initiated`/`pending` n'existe → sinon `conflict: payment_pending`
  (FR-019).
- Si un prix a changé depuis l'étape coordonnées → `conflict: price_changed` avec l'ancien et
  le nouveau total.
- Calcule le montant (`total`, `depositAmount` ou `balanceAmount`), crée le `Payment`
  (`idempotencyKey`), appelle `gateway.createCheckout()` puis **redirige (303)** vers
  `redirectUrl`.

## `requestCancellation`

`{ bookingRef, token, lineIds: string[] | 'all', confirm: 'on' }` → calcule
`calculatedAmount` (FR-027), crée `Refund` `requested`, statut réservation
`cancellation_requested`, notifie voyageur et équipe. Affichage préalable du montant par une
page serveur (pas d'action) : l'action ne fait qu'enregistrer.

## `resendManageLink`

`{ reference, email }` → réponse toujours identique (« si une réservation correspond, un lien
vient d'être envoyé ») ; 5 / heure / IP.

## `unsubscribeReminders`

`{ token }` (lien dans chaque relance) → `carts.remindersConsent = false`, relances
programmées annulées.

## Accessibilité des formulaires

- Erreurs : résumé en tête de formulaire (`role="alert"`, liens vers les champs) + message sous
  chaque champ (`aria-describedby`), focus déplacé sur le résumé.
- Les trois moyens de paiement : groupe de boutons radio natifs (`fieldset` + `legend`), même
  composant, même taille (≥ 44 px de haut), ordre stable **Wave, Orange Money, Carte**,
  aucun présélectionné ; test E2E de parité (SC-009).
- Bouton de paiement : libellé avec le montant (« Payer 185 000 F CFA ») ; désactivé et
  annoncé « Paiement en cours… » après soumission pour éviter le double appui.
