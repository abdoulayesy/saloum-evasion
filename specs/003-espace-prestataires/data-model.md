# Data Model: Espace prestataires et disponibilités

**Feature**: `003-espace-prestataires` | **Date**: 2026-11-16 | **Plan**: [plan.md](./plan.md)

Complète les modèles de la [001](../001-site-public-vitrine/data-model.md) et de la
[002](../002-panier-paiement/data-model.md). Conventions inchangées : montants en **XOF
entiers**, dates civiles `AAAA-MM-JJ` en texte (fuseau Africa/Dakar = UTC), heures `HH:mm`.
Les collections de cette version ne sont **jamais** accessibles par l'API publique de Payload :
seules les pages serveur de l'espace, les Server Actions et les tâches y accèdent.

## Modifications des collections existantes

### `partners` (002)

| Champ ajouté | Type | Règles |
|---|---|---|
| `spaceActive` | checkbox | défaut `false` ; active la confirmation automatique (R8) et l'accès à l'espace |
| `digestHour` | text `HH:mm` | défaut `19:00` ; heure du récapitulatif de la veille |

### `accommodations` (001/002)

`rentalUnits` (relation inverse) : au moins une unité si `bookable`. La capacité affichée de
l'hébergement reste celle de la 001 ; la capacité d'une réservation est celle de l'unité attribuée.

### `experiences` et `transfers` (001/002)

| Champ ajouté | Type | Règles |
|---|---|---|
| `weeklyTemplate` | array<`{ weekday: 1–7, slot: HH:mm \| '', capacity: integer ≥ 0 }`> | semaine type (FR-008) ; `slot` vide pour les transferts ; un créneau d'expérience doit exister dans `slots` |
| `capacityUnit` | select | `seats` \| `boats` \| `vehicles` \| `covers` ; libellé dans l'espace et sur le site |
| `bookingCutoff` | text `HH:mm` | défaut `20:00` la veille ; au-delà, le jour même n'est plus réservable |

### `stays` (001/002)

| Champ ajouté | Type | Règles |
|---|---|---|
| `components` | array<`{ kind: 'accommodation' \| 'experience', accommodation?, experience?, dayOffset: integer ≥ 0, slot?: HH:mm }`> | obligatoire si `bookable` ; au plus un hébergement ; `dayOffset` < durée du séjour ; le créneau existe dans l'expérience |

### `bookings.lines` (002)

| Champ ajouté | Type | Règles |
|---|---|---|
| `rentalUnit` | relation → `rentalUnits` | hébergement : unité attribuée au paiement |
| `inventoryRefs` | json | lignes d'inventaire consommées (`{ inventoryId, quantity }[]`), pour libérer en cas d'annulation |
| `confirmedBy` | select | `auto` \| `team` ; trace la confirmation (R8) |

## Nouvelles collections

### `partnerMembers` (Personnes rattachées)

| Champ | Type | Règles |
|---|---|---|
| `partner` | relation → `partners` | obligatoire |
| `name` | text | obligatoire |
| `whatsapp` | text E.164 | obligatoire, **unique** (identifiant de connexion) ; modifiable par l'équipe seulement ; tout changement **ferme toutes les sessions** de la personne |
| `role` | select | `owner` \| `manager` |
| `notifyBookings` | checkbox | défaut `true` |
| `dailyDigest` | checkbox | défaut `false` (FR-023) |
| `active` | checkbox | défaut `true` ; `false` ferme l'accès et toutes les sessions |
| `lastLoginAt` | date | |

Accès admin : lecture et écriture `operations`, `admin`.

### `partnerSessions`

`member` (relation), `tokenHash` (SHA-256, unique), `createdAt`, `lastSeenAt`, `expiresAt`
(`lastSeenAt` + 30 j, glissant), `revokedAt`, `userAgent` (tronqué à 120 caractères). Invisible
dans l'admin sauf l'action « Fermer toutes les sessions » sur `partnerMembers`.

### `loginCodes`

`whatsapp`, `codeHash` (SHA-256 + sel), `expiresAt` (création + 10 min), `attempts` (0–5),
`consumedAt`, `kind` (`code` \| `link`, le lien à usage unique de repli, 15 min),
`channels` (envois effectués : `whatsapp`, `sms`), `smsSent` (0–2 par fenêtre de 15 min).
Un nouveau code invalide les codes non consommés du même numéro. Purgés à expiration (tâche
quotidienne).

### `rentalUnits` (Unités louables)

| Champ | Type | Règles |
|---|---|---|
| `accommodation` | relation → `accommodations` | obligatoire |
| `name` | text | « Villa entière », « Bungalow 3 » ; unique par hébergement |
| `capacity` | integer ≥ 1 | personnes, bébés compris |
| `sortOrder` | integer | ordre d'attribution à capacité égale (R3) |
| `active` | checkbox | défaut `true` |
| `icalExportToken` | text | 128 bits aléatoires, unique ; régénérable par l'équipe (révoque l'ancien lien) |

### `inventory` (Stock daté)

| Champ | Type | Règles |
|---|---|---|
| `resourceType` | select | `unit` \| `experienceSlot` \| `transferDay` |
| `resourceId` | integer | unité, expérience ou transfert |
| `date` | text `AAAA-MM-JJ` | nuit, jour de l'expérience ou de la prise en charge |
| `slot` | text `HH:mm` \| `''` | vide pour `unit` et `transferDay` |
| `capacity` | integer ≥ 0 | `unit` : 1 |
| `closed` | checkbox | fermeture manuelle |
| `closedOrigin` | select | `partner` \| `team` \| `airbnb` \| `booking` \| `ical` ; vide si ouvert |
| `sold` | integer ≥ 0 | places vendues (réservations payées non annulées) |
| `held` | integer ≥ 0 | places retenues pendant un paiement |

**Contraintes** : unique `(resourceType, resourceId, date, slot)` ; `CHECK (sold + held <=
capacity OR closed)` ; les modifications de `sold` et `held` passent **uniquement** par les
fonctions SQL conditionnelles (R2), jamais par l'admin. Lignes absentes = semaine type.

**Disponibilité restante** (fonction pure testée) : `closed ? 0 : max(0, capacity − sold − held)`.

### `inventoryHolds` (Rétentions)

`payment` (relation → `payments`), `inventory` (relation), `quantity`, `expiresAt` (= expiration
de la tentative de paiement), `status` (`active` \| `converted` \| `released`).

```text
active ──paiement réussi──▶ converted   (held −= q ; sold += q)
active ──échec / abandon / expiration──▶ released   (held −= q)
```

### `externalCalendars` (Calendriers externes)

| Champ | Type | Règles |
|---|---|---|
| `rentalUnit` | relation → `rentalUnits` | obligatoire |
| `platform` | select | `airbnb` \| `booking` \| `other` |
| `url` | text | `https` uniquement ; hôte résolu vers une adresse publique (R6) |
| `etag`, `lastModified` | text | requêtes conditionnelles |
| `lastSuccessAt`, `lastAttemptAt` | date | |
| `status` | select | `ok` \| `error` ; `error` si `lastSuccessAt` > 2 h |
| `lastError` | text | message court, sans contenu du flux |
| `importedNights` | json | nuits fermées par ce flux (pour les rouvrir quand elles disparaissent) |

### `availabilityChanges` (Journal)

Les changements de prix sont tracés par `priceChangeRequests` (ancien, nouveau, auteur, décision),
non par ce journal. Champs : `member` ou `user` (auteur), `resourceType`, `resourceId`, `date`,
`slot`, `field`
(`closed` \| `capacity` \| `weeklyTemplate`), `before`, `after`, `createdAt`. Immuable
(crochets de la 002) ; conservé 12 mois.

### `priceChangeRequests` (Demandes de changement de prix)

| Champ | Type | Règles |
|---|---|---|
| `offerType`, `offer` | select + relation polymorphe | offre du prestataire |
| `field` | select | `lowSeason` \| `highSeason` \| `pricePerPerson` \| `tier:{n}` |
| `currentAmount`, `requestedAmount` | integer XOF | `requestedAmount` > 0 |
| `requestedBy` | relation → `partnerMembers` | |
| `status` | select | `pending` \| `approved` \| `rejected` \| `superseded` |
| `decisionReason` | textarea | obligatoire si `rejected` |
| `decidedBy`, `decidedAt` | relation → `users`, date | |

Une seule demande `pending` par `(offer, field)` : une nouvelle demande passe l'ancienne à
`superseded`.

### `sponsoredPlacements` (Mises en avant)

| Champ | Type | Règles |
|---|---|---|
| `partner` | relation → `partners` | `kind = restaurant` |
| `offer` | relation → `experiences` | publiée, appartenant au restaurant (table ou expérience) |
| `placements` | select multiple | `destination` \| `tablesUniverse` \| `nearbyExperiences` |
| `destinations` | relation multiple → `destinations` | si `destination` |
| `startDate`, `endDate` | text `AAAA-MM-JJ` | `endDate` ≥ `startDate` |
| `amount` | integer XOF | forfait |
| `paymentStatus` | select | `pending` \| `paid` |
| `paymentMethod` | select | `wave` \| `orange_money` \| `cash` \| `bank_transfer` |
| `paidAt` | date | |
| `status` | calculé | `scheduled` \| `active` \| `suspended` \| `ended` |

**Statut** (fonction pure testée) : `ended` si aujourd'hui > `endDate` ; `suspended` si l'offre
est dépubliée ou le prestataire inactif ; `active` si payé et aujourd'hui ∈ [début, fin] ;
sinon `scheduled`. **Une page n'affiche qu'une mise en avant active** : à égalité, la plus
ancienne payée.

### `sponsoredStats`

`placement` (relation), `week` (`AAAA-Www`), `views`, `clicks` ; unique `(placement, week)` ;
incréments atomiques par `/api/sponsored/hit`. Aucune donnée personnelle.

## Rôles et accès (complète la matrice de la 002)

| Rôle | Espace prestataires | Disponibilités | Prix (demandes) | Mises en avant |
|---|---|---|---|---|
| `owner` (prestataire) | son prestataire | lecture / écriture | demander | lecture des siennes |
| `manager` (prestataire) | son prestataire, sans « Mes paiements » | lecture / écriture | — | — |
| `operations` | — | lecture / écriture, déblocages | valider / refuser | lecture |
| `finance` | — | lecture | lecture | lecture / écriture (paiement) |
| `admin` | — | tout | tout | tout |

## Rétention

`loginCodes` supprimés à expiration ; `partnerSessions` supprimées 30 jours après expiration ;
`availabilityChanges` 12 mois ; `inventory` passé conservé 24 mois (statistiques) ;
`sponsoredStats` 24 mois ; coordonnées du voyageur masquées au prestataire 30 jours après la
prestation (lecture filtrée, la réservation 002 reste intacte).
