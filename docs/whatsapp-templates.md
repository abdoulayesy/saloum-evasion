# Modèles WhatsApp (002, T099)

Messages modèles envoyés aux voyageurs par l'API WhatsApp Cloud (`src/lib/notifications/whatsapp.ts`).
Meta n'accepte, hors fenêtre de 24 h ouverte par le voyageur, que des modèles approuvés : chaque modèle
ci-dessous doit être soumis en **français (`fr`)** et en **anglais (`en`)** sous le même nom, dans
le gestionnaire WhatsApp du compte Meta Business de Saloum Évasion.

Le code envoie le nom et les variables `{{1}}`, `{{2}}`… dans l'ordre indiqué ; le texte affiché au
voyageur est celui qui est approuvé chez Meta. **Toute modification d'un texte approuvé passe par une
nouvelle version ici, puis une nouvelle soumission** ; ne changez jamais l'ordre ou le nombre des
variables sans changer le code dans le même commit.

Règles Meta respectées par ces textes : pas de variable en début ni en fin de corps, pas deux
variables collées, pas de mise en forme promotionnelle dans les modèles « Utilitaire ».

## Suivi des soumissions

| Modèle | Catégorie | Variables | Version | FR | EN | Source dans le code |
|---|---|---|---|---|---|---|
| `booking_confirmed` | Utilitaire | 3 | 1 | à soumettre | à soumettre | `templates/bookingConfirmed.ts` |
| `availability_update` | Utilitaire | 2 | 1 | à soumettre | à soumettre | `templates/availabilityUpdate.ts` |
| `balance_due` | Utilitaire | 5 | 1 | à soumettre | à soumettre | `templates/balance.ts` |
| `balance_paid` | Utilitaire | 3 | 1 | à soumettre | à soumettre | `templates/balance.ts` |
| `payment_failed_reminder` | Marketing | 3 | 1 | à soumettre | à soumettre | `templates/reminder.ts` |
| `cancellation_received` | Utilitaire | 4 | 1 | à soumettre | à soumettre | `templates/refund.ts` |
| `refund_status` | Utilitaire | 5 | 1 | à soumettre | à soumettre | `templates/refund.ts` |

Mettre à jour les colonnes FR / EN (`soumis le AAAA-MM-JJ`, `approuvé le AAAA-MM-JJ`, `refusé : motif`)
à chaque étape. La case « modèles WhatsApp approuvés » du modèle de PR renvoie à ce tableau.

`payment_failed_reminder` relance un paiement non abouti : Meta le classe en principe en
« Marketing ». Il n'est envoyé qu'aux voyageurs qui ont accepté les relances (case du formulaire de
coordonnées, FR-031) et contient toujours le lien de désinscription.

Sans `WHATSAPP_CLOUD_TOKEN`, ou tant qu'un modèle n'est pas approuvé, l'envoi échoue proprement : le
message est journalisé dans `notifications`, l'e-mail part quand même et l'équipe est alertée après
4 tentatives (FR-023).

## Textes à soumettre

Les exemples entre crochets sont à saisir dans le champ « exemple » de chaque variable lors de la
soumission.

### `booking_confirmed`

Après le paiement initial réussi. Variables : `{{1}}` prénom [Awa], `{{2}}` référence [SE-K7M2QX],
`{{3}}` lien de gestion de la réservation [https://saloum-evasion.sn/fr/reservation/se-k7m2qx?k=…].

FR :

> Bonjour {{1}}, votre paiement est bien reçu et votre réservation {{2}} est enregistrée. Nous
> confirmons la disponibilité de chaque prestation avec nos partenaires et vous tenons informé ici.
> Votre bon et le détail de votre réservation : {{3}} — Merci de votre confiance, l'équipe Saloum
> Évasion.

EN :

> Hello {{1}}, your payment has been received and booking {{2}} is registered. We are confirming
> each service with our partners and will keep you posted here. Your voucher and booking details:
> {{3}} — Thank you for your trust, the Saloum Évasion team.

### `availability_update`

Quand l'équipe confirme une prestation ou la déclare indisponible. Variables : `{{1}}` prénom [Awa],
`{{2}}` référence [SE-K7M2QX].

FR :

> Bonjour {{1}}, la disponibilité de votre réservation {{2}} a été mise à jour. Le détail vous
> attend dans l'e-mail que nous venons de vous envoyer et sur la page de votre réservation.

EN :

> Hello {{1}}, the availability of your booking {{2}} has been updated. The details are in the email
> we just sent you and on your booking page.

### `balance_due`

Rappels du solde (J-7, J-1) et solde en retard. Variables : `{{1}}` prénom [Awa], `{{2}}` référence
[SE-K7M2QX], `{{3}}` montant du solde [224 000 FCFA], `{{4}}` date limite [12 janvier 2027],
`{{5}}` lien de paiement du solde [https://saloum-evasion.sn/fr/reservation/se-k7m2qx/solde?k=…].

FR :

> Bonjour {{1}}, le solde de votre réservation {{2}}, soit {{3}}, est à régler avant le {{4}}.
> Vous pouvez le payer par Wave, Orange Money ou carte ici : {{5}} — Une question ? Répondez
> simplement à ce message.

EN :

> Hello {{1}}, the balance of your booking {{2}}, {{3}}, is due before {{4}}. You can pay it by
> Wave, Orange Money or card here: {{5}} — Any question? Just reply to this message.

### `balance_paid`

Après le paiement du solde. Variables : `{{1}}` prénom [Awa], `{{2}}` référence [SE-K7M2QX],
`{{3}}` lien de gestion.

FR :

> Bonjour {{1}}, le solde de votre réservation {{2}} est bien reçu : elle est entièrement payée.
> Votre bon mis à jour : {{3}} — À très bientôt dans le Saloum.

EN :

> Hello {{1}}, the balance of booking {{2}} has been received: it is now fully paid. Your updated
> voucher: {{3}} — See you soon in the Saloum.

### `payment_failed_reminder`

Relance d'un paiement échoué ou abandonné (1 h puis 24 h, avec consentement). Variables : `{{1}}`
prénom [Awa], `{{2}}` lien de reprise du panier [https://saloum-evasion.sn/fr/panier/reprendre?t=…],
`{{3}}` lien de désinscription [https://saloum-evasion.sn/fr/panier/desinscription?t=…].

FR :

> Bonjour {{1}}, votre paiement n'a pas abouti et votre panier vous attend. Reprenez-le en un geste
> ici : {{2}} — Vous ne souhaitez plus recevoir ces rappels ? {{3}} Merci, l'équipe Saloum Évasion.

EN :

> Hello {{1}}, your payment did not go through and your cart is waiting for you. Pick it up in one
> tap here: {{2}} — Don't want these reminders any more? {{3}} Thank you, the Saloum Évasion team.

### `cancellation_received`

Accusé de réception d'une demande d'annulation du voyageur. Variables : `{{1}}` prénom [Awa],
`{{2}}` référence [SE-K7M2QX], `{{3}}` montant remboursable [112 000 FCFA], `{{4}}` lien de gestion.

FR :

> Bonjour {{1}}, nous avons bien reçu votre demande d'annulation pour la réservation {{2}}.
> Montant remboursable selon les conditions acceptées : {{3}}. Suivez le remboursement ici : {{4}}
> — L'équipe Saloum Évasion.

EN :

> Hello {{1}}, we have received your cancellation request for booking {{2}}. Refundable amount under
> the accepted conditions: {{3}}. Track your refund here: {{4}} — The Saloum Évasion team.

### `refund_status`

À chaque étape du remboursement (validé, versé, refusé). Variables : `{{1}}` prénom [Awa],
`{{2}}` référence [SE-K7M2QX], `{{3}}` statut [validé / approved], `{{4}}` montant
[112 000 FCFA], `{{5}}` lien de gestion.

FR :

> Bonjour {{1}}, le remboursement de votre réservation {{2}} est désormais : {{3}}. Montant :
> {{4}}. Le détail est sur la page de votre réservation : {{5}} — L'équipe Saloum Évasion.

EN :

> Hello {{1}}, the refund for your booking {{2}} is now: {{3}}. Amount: {{4}}. Details are on your
> booking page: {{5}} — The Saloum Évasion team.
