# Data Model: Panier unique et paiement en ligne

**Feature**: `002-panier-paiement` | **Date**: 2026-11-14 | **Plan**: [plan.md](./plan.md)

Complète le modèle de la 001 ([data-model 001](../001-site-public-vitrine/data-model.md)).
Conventions : montants en **XOF entiers** (`integer`) ; taux en **points de base** (`integer`,
1500 = 15 %) ; dates en UTC ; « L » = champ localisé FR/EN. Les collections transactionnelles
ne sont **jamais** créables ni lisibles via l'API publique de Payload : seules les Server
Actions et les routes serveur y accèdent (`access` restreint).

## Modifications des collections de la 001

### Offres vendables (`stays`, `experiences`, `accommodations`, nouvelle `transfers`)

| Champ ajouté | Type | Règles |
|---|---|---|
| `partner` | relationship → `partners` | **obligatoire pour publier comme vendable** |
| `bookable` | checkbox | défaut `false` ; si `true`, `partner`, `cancellationPolicy` et les prix ci-dessous sont obligatoires |
| `childPricePercent` | integer 0–100 | expériences et séjours ; défaut 50 ; gratuit sous 4 ans |
| `slots` | array<`{ label L, startTime HH:mm }`> | expériences (créneaux proposés) ; ≥ 1 si `bookable` |
| `cancellationPolicy` | relationship → `cancellationPolicies` | désormais obligatoire aussi sur expériences, hébergements et transferts vendables |

- `experiences.offerKind` : select `activity` \| `table` (défaut `activity`) ; `table` pour les
  repas de l'univers « Table du Saloum ». Sert au type d'offre des commissions.
- `accommodations` : `priceFromPerNight` reste l'affichage « à partir de » ; ajout de
  `pricing.lowSeasonPerNight` et `pricing.highSeasonPerNight` (entiers XOF, obligatoires si
  `bookable`) et `minNights` (défaut 1).
- `stays` : ajout de `requireFullPayment` (checkbox, FR-016) ; un séjour signature dans le
  panier **exclut** tout hébergement séparé.

### `cancellationPolicies`

| Champ ajouté | Type | Règles |
|---|---|---|
| `tiers` | array<`{ daysBeforeArrivalMin: integer ≥ 0, refundPercent: integer 0–100 }`> | ≥ 1 ; `daysBeforeArrivalMin` uniques ; `refundPercent` décroissant quand le délai diminue |

Palier applicable = celui dont `daysBeforeArrivalMin` est le plus grand ≤ jours restants
avant la première date de la ligne. Exemple : `[{30,100},{14,50},{0,0}]`.

### `siteSettings` (global)

Ajouts : `checkout.depositPercent` (défaut 30), `checkout.depositThresholdDays` (30),
`checkout.balanceDueDaysBeforeArrival` (14), `checkout.availabilitySlaMinutes` (120),
`checkout.businessHours` (`08:00`–`20:00`, fuseau Africa/Dakar),
`checkout.refundDelayDays` (14), `checkout.cartTtlDays` (7), `checkout.cartPurgeDays` (30),
`notifications.whatsappSenderId`, `notifications.financeEmail`.

### `requests` (001)

Inchangée. Le formulaire de demande reste disponible pour le sur-mesure ; un lien « Demander
un devis à la place » apparaît dans le panier.

## Nouvelles collections

### `partners` (Prestataires)

| Champ | Type | Règles |
|---|---|---|
| `name` | text | obligatoire |
| `kind` | select | `lodging` \| `guide` \| `restaurant` \| `transport` \| `other` |
| `contactName`, `phone`, `whatsapp`, `email` | text | `whatsapp` ou `email` obligatoire (notification FR-025) |
| `payoutMethod` | select | `bank_transfer` \| `wave` \| `orange_money` \| `cash` |
| `payoutDetails` | text | visible des rôles `finance` et `admin` seulement |
| `active` | checkbox | défaut `true` |

### `transfers` (Trajets de transfert)

| Champ | Type | L | Règles |
|---|---|---|---|
| `title` | text | ✓ | ex. « Aéroport AIBD → Ndangane » |
| `origin` | select | | `aibd` \| `dakar` |
| `destination` | relationship → destinations | | obligatoire |
| `durationMinutes` | integer | | |
| `priceTiers` | array<`{ maxPassengers: integer, pricePerVehicle: integer XOF }`> | | ≥ 1 ; trié ; défaut 3 / 7 / 14 |
| `partner`, `cancellationPolicy`, `bookable` | | | comme les autres offres |

Pas de page publique propre : les transferts sont proposés dans le panier et sur les fiches.

### `carts` (Paniers)

| Champ | Type | Règles |
|---|---|---|
| `publicId` | text | 128 bits aléatoires (base64url), unique ; valeur du cookie `se_cart` |
| `locale` | select `fr` \| `en` | dernière langue utilisée |
| `items` | array<CartItem> | voir ci-dessous ; ≤ 1 ligne `accommodation` ou `stay` |
| `version` | integer | incrémentée à chaque modification (clé d'idempotence de réservation) |
| `contact` | group `{ firstName, lastName, whatsapp (E.164), email }` | rempli à l'étape coordonnées |
| `remindersConsent` | checkbox | jamais précoché (FR-012) |
| `remindersSent` | integer 0–2 | |
| `status` | select | `open` \| `checked_out` \| `abandoned` \| `expired` |
| `expiresAt` | date | `updatedAt + cartTtlDays` |
| `migratedFromRequest` | checkbox | panier issu de la « demande en cours » 001 (FR-006) |

**CartItem** :

| Champ | Type | Règles |
|---|---|---|
| `lineId` | text | identifiant de ligne stable |
| `offerType` | select | `stay` \| `accommodation` \| `experience` \| `table` \| `transfer` |
| `offer` | relationship polymorphe → stays \| accommodations \| experiences \| transfers | publié et `bookable` |
| `startDate` / `endDate` | date | `endDate` > `startDate` pour hébergement et séjour (nuits) |
| `slot` | text | expérience et table : un créneau de l'offre |
| `transferDirection` | select | `outbound` \| `return` (aller-retour = deux lignes) |
| `transferTime` | text HH:mm | transfert |
| `adults` / `children` / `infants` | integer | `adults` ≥ 1 ; total ≤ capacité |
| `quotedUnitPrice` / `quotedTotal` | integer XOF | prix vu à l'ajout (FR-009) |

**Validation (FR-004)** : expériences, tables et transferts compris entre l'arrivée et le départ
de l'hébergement ou du séjour (s'il y en a un) ; transfert retour postérieur à l'aller ; capacité ;
offre toujours publiée et vendable ; date ≥ aujourd'hui + 1 jour (délai minimum réglable).

### `bookings` (Réservations)

| Champ | Type | Règles |
|---|---|---|
| `reference` | text | `SE-XXXXXX`, unique (alphabet sans 0/O/1/I) |
| `cart` | relationship → carts | unique avec `cartVersion` (idempotence de création) |
| `cartVersion` | integer | |
| `locale` | select | langue des notifications et du PDF |
| `traveller` | group `{ firstName, lastName, whatsapp, email }` | obligatoire |
| `specialRequest` | textarea | facultatif, ≤ 1000 car. |
| `lines` | array<BookingLine> | copie figée des lignes du panier |
| `total` | integer XOF | somme des lignes |
| `paymentPlan` | select | `full` \| `deposit` |
| `depositAmount` / `balanceAmount` | integer XOF | `deposit + balance = total` ; 0 si `full` |
| `balanceDueDate` | date | arrivée − 14 jours ; vide si `full` |
| `amountPaid` | integer XOF | somme des paiements réussis − remboursements versés |
| `status` | select | voir machine à états |
| `availabilityDeadline` | date | calculée au paiement (R1) |
| `manageTokenHash` | text | SHA-256 du jeton de gestion ; masqué dans l'admin |
| `voucher` | group `{ file → media privé, version: integer, generatedAt }` | |
| `consentProcessingAt` | date | consentement FR-012 |
| `firstArrivalDate` | date | dérivé ; sert aux échéances et à l'annulation |

**BookingLine** : champs de CartItem + `partner` (copie), `unitPrice`, `lineTotal`,
`commissionRateBp`, `commissionAmount`, `partnerAmount`, `policySnapshot` (`{ name, summary L,
tiers }`), `availabilityStatus` (`pending` \| `confirmed` \| `unavailable` \| `replaced`),
`availabilityNote`, `cancelled` (checkbox), `partnerNotifiedAt`.

**Machine à états de `bookings.status`** :

```text
awaiting_payment ──paiement acompte réussi──▶ deposit_paid ──paiement solde réussi──▶ paid
awaiting_payment ──paiement total réussi────▶ paid
awaiting_payment ──30 jours sans paiement ni modification (purgeCarts)──▶ expired
deposit_paid | paid ──demande d'annulation──▶ cancellation_requested
cancellation_requested ──refus──▶ (statut précédent)
cancellation_requested ──validation totale──▶ cancelled
cancellation_requested ──validation partielle──▶ partially_cancelled
deposit_paid | paid | partially_cancelled ──date de départ passée──▶ completed
```

`completed` est le seul statut qui ouvrira plus tard le droit de laisser un avis (principe V).
La confirmation de disponibilité est portée par `lines[].availabilityStatus`, indépendante du
statut de paiement : une réservation `paid` peut avoir des lignes `pending`.

### `payments` (Tentatives de paiement)

| Champ | Type | Règles |
|---|---|---|
| `booking` | relationship → bookings | obligatoire |
| `purpose` | select | `full` \| `deposit` \| `balance` |
| `method` | select | `wave` \| `orange_money` \| `card` |
| `amount` | integer XOF | recalculé côté serveur ; jamais fourni par le client |
| `currency` | text | toujours `XOF` |
| `gateway` | text | identifiant de l'implémentation (`fake`, agrégateur retenu…) |
| `idempotencyKey` | text | UUID, unique |
| `gatewayReference` | text | identifiant de transaction côté agrégateur, unique si présent |
| `status` | select | `initiated` \| `pending` \| `succeeded` \| `failed` \| `abandoned` \| `expired` |
| `failureReason` | select | `declined` \| `insufficient_funds` \| `timeout` \| `cancelled_by_user` \| `technical` |
| `redirectUrl` | text | page hébergée |
| `expiresAt` | date | création + 30 min |
| `confirmedAt` | date | |

**Contrainte** : index unique partiel `(booking, purpose) WHERE status IN ('initiated','pending')`
(FR-019).

```text
initiated ──redirection──▶ pending ──notification OK──▶ succeeded
                             │ └──notification KO──▶ failed
                             └──30 min sans nouvelle + réconciliation négative──▶ expired
initiated ──retour « annulé » de la page hébergée──▶ abandoned
```

### `paymentEvents` (Journal des notifications)

`payment` (relation), `gatewayEventId` (unique), `type`, `payload` (JSON, sans donnée de
carte : l'agrégateur n'en transmet pas), `signatureValid` (checkbox), `receivedAt`. Immuable :
aucune mise à jour ni suppression, même pour `admin`.

### `refunds` (Remboursements)

| Champ | Type | Règles |
|---|---|---|
| `booking` | relationship → bookings | |
| `lines` | array<`{ lineId, amount }`> | montants ≤ encaissé de la ligne |
| `amount` | integer XOF | somme des lignes |
| `reason` | select | `traveller` \| `company` \| `partner` \| `unavailable` |
| `calculatedAmount` | integer XOF | montant issu des paliers (FR-027) ; `amount` peut être supérieur (geste commercial), jamais inférieur sans motif |
| `method` | select | `original` \| `wave` \| `orange_money` \| `bank_transfer` |
| `methodJustification` | textarea | obligatoire si `method ≠ original` (FR-029) |
| `status` | select | `requested` \| `approved` \| `paid` \| `rejected` |
| `rejectionReason` | textarea | obligatoire si `rejected` |
| `gatewayRefundReference` | text | |
| `approvedBy` / `approvedAt` / `paidAt` | | `paidAt − approvedAt ≤ 14 j` suivi (alerte à J+10) |

### `commissionRates` (global, historisé)

`rates` : array<`{ offerType, rateBp: integer 1000–2500, effectiveFrom: date }`>. Défauts :
`transfer` 1000, `table` 1500, `accommodation` 1500, `experience` 2000, `stay` 2500. Le taux
appliqué est copié dans `bookings.lines[].commissionRateBp` au premier paiement réussi
(FR-034) ; la validation refuse toute valeur hors 1000–2500.

### `commissionEntries` (Écritures de commission)

Une écriture par évènement financier, jamais modifiée :

| Champ | Type | Règles |
|---|---|---|
| `booking`, `lineId`, `partner` | | |
| `kind` | select | `collected` (paiement) \| `refund_adjustment` |
| `grossAmount` | integer XOF | encaissé (positif) ou remboursé (négatif) |
| `commissionAmount` | integer XOF | arrondi demi vers le haut ; négatif en ajustement |
| `partnerAmount` | integer XOF | `gross − commission` |
| `occurredAt` | date | date de l'évènement (période du relevé) |

Pour un remboursement motif `partner`, `commissionAmount` de l'ajustement = 0 et
`partnerAmount` = `grossAmount` (la commission reste due, FR-035).

### `payouts` (Reversements)

`partner`, `periodStart`, `periodEnd`, `amount` (XOF), `method`, `reference`, `paidAt`,
`recordedBy`. **Relevé** (FR-036) = somme des `commissionEntries` de la période − `payouts`
de la période ; export CSV (séparateur `;`, UTF-8 avec BOM pour le tableur). Une écriture
appartient à la période par sa date `occurredAt` ; un reversement, si la période qu'il couvre
(`periodStart`–`periodEnd`) y est entièrement incluse.

### `reminders` (Relances)

`target` (relation polymorphe → carts \| bookings), `kind` (`abandoned_cart` \| `failed_payment`
\| `balance_due` \| `balance_overdue`), `channel` (`email` \| `whatsapp`), `scheduledFor`,
`sentAt`, `status` (`scheduled` \| `sent` \| `failed` \| `cancelled`), `linkOpenedAt`,
`unsubscribed` (checkbox). Unicité `(target, kind, channel, rang)` : au plus deux relances
d'abandon (FR-031).

### `notifications` (Journal d'envoi)

`booking` (facultatif), `template`, `channel`, `recipient` (masqué partiellement dans l'admin),
`locale`, `attempts` (0–4), `status` (`queued` \| `sent` \| `failed` \| `escalated`),
`providerMessageId`, `lastError`. `escalated` = alerte envoyée à l'équipe (FR-023).

## Rôles et accès (admin)

| Rôle | Contenus 001 | Réservations | Disponibilité | Remboursements | Commissions et reversements |
|---|---|---|---|---|---|
| `editor` | lecture / écriture | — | — | — | — |
| `operations` | lecture | lecture / écriture (hors montants à reverser) | confirmer / indisponible | demander | — |
| `finance` | lecture | lecture | lecture | approuver / marquer versé | lecture / écriture, export |
| `admin` | tout | tout | tout | tout | tout |

## Rétention

`carts` non payés supprimés à J+30 (`purgeCarts`) ; `bookings`, `payments`, `refunds`,
`commissionEntries`, `payouts` conservés 10 ans (pièces comptables, à confirmer par le
comptable) puis anonymisés ; `paymentEvents` 10 ans ; `notifications` 24 mois ; `reminders`
12 mois.
