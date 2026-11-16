# Contrat — Interface `PaymentGateway`

Isole le tunnel du prestataire de paiement (research R2). Implémentations : `fake` (dev, CI,
E2E) et l'agrégateur retenu. Fichier : `src/lib/payments/gateway.ts`.

```ts
type PaymentMethod = 'wave' | 'orange_money' | 'card';

type CreateCheckoutInput = {
  idempotencyKey: string;          // UUID du Payment
  amountXof: number;               // entier > 0
  method: PaymentMethod;
  bookingReference: string;        // SE-XXXXXX, affiché sur la page hébergée
  description: string;             // ex. « Saloum Évasion — séjour SE-7KD3QP (acompte) »
  customer: { firstName: string; lastName: string; email: string; phoneE164: string };
  locale: 'fr' | 'en';
  returnUrl: string;               // /{locale}/commande/statut?p={paymentId}
  cancelUrl: string;               // idem + &cancelled=1
  notifyUrl: string;               // /api/payments/notify/{gateway}
};

type CreateCheckoutResult =
  | { ok: true; gatewayReference: string; redirectUrl: string; expiresAt: Date }
  | { ok: false; reason: 'method_unavailable' | 'invalid_request' | 'gateway_error' };

type GatewayPaymentStatus =
  | { status: 'pending' }
  | { status: 'succeeded'; amountXof: number; paidAt: Date }
  | { status: 'failed'; reason: FailureReason }
  | { status: 'expired' };

type FailureReason = 'declined' | 'insufficient_funds' | 'timeout' | 'cancelled_by_user' | 'technical';

type VerifiedNotification = {
  gatewayEventId: string;
  gatewayReference: string;
  idempotencyKey: string | null;
  result: GatewayPaymentStatus;
};

type RefundResult =
  | { ok: true; gatewayRefundReference: string }
  | { ok: false; reason: 'not_supported' | 'gateway_error' };   // not_supported → remboursement manuel (R14)

type PaymentGateway = {
  id: string;
  supportedMethods: readonly PaymentMethod[];   // doit contenir les trois (principe VI)
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  getStatus(gatewayReference: string): Promise<GatewayPaymentStatus>;
  verifyNotification(rawBody: string, headers: Headers): Promise<VerifiedNotification | null>; // null = signature invalide
  refund(gatewayReference: string, amountXof: number): Promise<RefundResult>;
};
```

## Traitement d'une notification (`/api/payments/notify/[gateway]`)

1. Lire le corps brut ; `verifyNotification` → `null` ⇒ enregistrer `paymentEvents`
   (`signatureValid=false`) et répondre **401**.
2. Insérer `paymentEvents` (`gatewayEventId` unique) ; doublon ⇒ répondre **200** sans rien
   faire (idempotence).
3. Transaction : verrouiller le `Payment` et la `Booking` ; si `succeeded`, vérifier
   `amountXof === payment.amount` et devise XOF, sinon marquer en anomalie et alerter `finance`.
4. Appliquer la transition (machines à états du [data-model](../data-model.md)) ; ignorer une
   transition vers un état antérieur.
5. Sur succès : mettre à jour `amountPaid` et `status` ; figer les taux de commission ; créer
   les `commissionEntries` ; calculer `availabilityDeadline` ; programmer `generateVoucher`,
   `sendNotification(booking_confirmed)` (e-mail + WhatsApp), notifications équipe et
   prestataires ; annuler les relances du panier ; `carts.status = checked_out`.
6. Répondre **200** en moins de 2 s (le travail lourd part dans la file).

## Implémentation `fake`

- `createCheckout` renvoie `redirectUrl = /dev/fake-gateway?ref=…` (route présente seulement
  hors production) : page avec boutons « Réussir », « Solde insuffisant », « Refuser »,
  « Annuler », « Ne pas revenir » (envoie la notification sans rediriger).
- Notifications signées avec `FAKE_GATEWAY_SECRET`, envoyées au même point d'entrée que la
  production, pour tester le vrai chemin de code.
- Option `delayMs` pour simuler une notification tardive (scénario « retour avant
  confirmation »).

## Tests de contrat

Une suite Vitest commune (`tests/unit/payments/gateway.contract.test.ts`) exécutée contre
chaque implémentation : trois moyens supportés, montant entier conservé, signature invalide
rejetée, notification rejouée sans effet, statuts reconnus.
