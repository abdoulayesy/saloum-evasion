# Tasks: Espace prestataires et disponibilités

**Input**: Design documents from `/specs/003-espace-prestataires/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: obligatoires (constitution VII : tests unitaires sur la logique de disponibilité ;
E2E 360 px par parcours livré ; I : parcours prestataire en 3G ; IV : axe, clavier, zoom 200 %).
Les tests d'une story sont écrits **avant** son implémentation et doivent échouer d'abord.

**Organisation** : par user story (spec), chaque tâche < une demi-journée. `[P]` = fichiers
différents, sans dépendance sur une tâche inachevée.

**Prérequis bloquant externe** (plan, tension T29) : la 002 doit avoir livré au moins son US1
(paiement, réservations, `partners`, `transfers`, file `sendNotification`, `startPayment` et
traitement des notifications de paiement) ; l'US4 de la 003 exige aussi l'US5 de la 002 (relevé).
Décision du 2026-11-16 : l'US1 de la 002 est terminée avant toute implémentation de la 003.
**T21 décidée** (2026-11-16) : repli SMS (dérogation D-T21), lien de l'équipe en dernier recours.

## Path Conventions

Application unique à la racine : `src/`, `tests/unit/`, `tests/integration/`, `tests/e2e/`,
`scripts/`. Espace prestataires : `src/app/(partner)/espace/`. Pages publiques : résolveur
`src/app/(frontend)/[locale]/[...segments]/page.tsx` (inchangé, ne lit jamais de cookie).

---

## Phase 1: Setup

**Purpose**: préparer le dépôt pour l'espace et les disponibilités, sans logique métier.

- [ ] T001 Vérifier les prérequis 002 (collections `partners`, `transfers`, `bookings`, `payments`, file `sendNotification`, `startPayment`, traitement `/api/payments/notify/[gateway]`) et consigner l'état dans une note « Avancement de la phase 1 » de specs/003-espace-prestataires/tasks.md
- [ ] T002 Étendre src/middleware.ts : `/espace` et `/espace/*` passent sans préfixe de langue, avec `X-Robots-Tag: noindex, nofollow` et `Cache-Control: private, no-store` ; test dans tests/unit/middleware-espace.test.ts
- [ ] T003 [P] Ajouter la variable facultative `PARTNER_CODE_PEPPER` (sel des codes de connexion, obligatoire en production) au schéma de src/lib/env.ts et à .env.example ; test dans tests/unit/checkout/env.test.ts
- [ ] T004 [P] Ajouter les étiquettes `@partner`, `@availability`, `@sponsored` au projet `android-360-3g` de playwright.config.ts et le script `e2e:partner` dans package.json
- [ ] T005 [P] Étendre scripts/check-bundles.ts aux routes `/espace/*` (≤ 150 Ko par route, îlots de l'espace ≤ 6 Ko) et à l'îlot `AvailabilityPicker` (< 4 Ko)
- [ ] T006 [P] Ajouter `/espace` et `/espace/accueil` (session de démonstration via `extraHeaders`) à lighthouserc.json, dans un groupe sans assertion SEO
- [ ] T007 [P] Créer les helpers E2E `seedPartnerFixtures`, `loginAsPartner(phone)` (lit le code dans la boîte d'envoi `whatsapp-*.json`), `closeNights`, `readPublicAvailability` dans tests/e2e/support/partner.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: logique pure, modèle de données, stock atomique, authentification et layout de
l'espace. **Aucune user story ne commence avant la fin de cette phase.**

### Logique pure (tests d'abord)

- [ ] T008 [P] Écrire les tests de disponibilité de base (`remaining`, `effectiveRow` ligne vs semaine type, `isBookableDay` avec délai la veille 20 h heure de Dakar) dans tests/unit/availability/core.test.ts
- [ ] T009 [P] Écrire les tests d'unités louables (`unitFreeForNights`, `allocateUnit` : capacité croissante compatible, ordre d'affichage, refus d'un changement d'unité en cours de séjour) dans tests/unit/availability/units.test.ts
- [ ] T010 [P] Écrire les tests des séjours et transferts (`stayAvailability` par intersection des composants avec `dayOffset` et créneau, `vehiclesNeeded` au-delà de 14 passagers via `transferPrice` de 002, `nextAvailableDates`) dans tests/unit/availability/stays.test.ts
- [ ] T011 [P] Écrire les tests d'analyse iCal (dépliage, `VALUE=DATE` et date-heure, `DTEND` exclusif ou absent, `STATUS:CANCELLED`, flux vide ou invalide) avec des flux anonymisés tests/unit/ical/fixtures/airbnb.ics et tests/unit/ical/fixtures/booking.ics dans tests/unit/ical/parse.test.ts
- [ ] T012 [P] Écrire les tests de génération iCal (périodes contiguës, repliement à 75 octets, CRLF, `UID` stable, aucune donnée personnelle, exclusion des nuits importées du même flux) dans tests/unit/ical/generate.test.ts
- [ ] T013 [P] Écrire les tests des mises en avant (statut calculé `scheduled`/`active`/`suspended`/`ended`, une seule active par page, semaine ISO) dans tests/unit/sponsored/status.test.ts
- [ ] T014 [P] Écrire les tests d'authentification pure (code à 6 chiffres, empreinte avec sel, expiration 10 min, 5 essais puis blocage 15 min, jeton de session 256 bits, expiration glissante 30 j) dans tests/unit/partnerAuth/codes.test.ts
- [ ] T015 Implémenter src/lib/availability/core.ts, src/lib/availability/units.ts et src/lib/availability/stays.ts (purs, sans dépendance) jusqu'à faire passer T008 à T010
- [ ] T016 [P] Implémenter src/lib/ical/parse.ts et src/lib/ical/generate.ts jusqu'à faire passer T011 et T012
- [ ] T017 [P] Implémenter src/lib/sponsored/status.ts jusqu'à faire passer T013
- [ ] T018 [P] Implémenter src/lib/partnerAuth/codes.ts et src/lib/partnerAuth/tokens.ts jusqu'à faire passer T014

### Modèle de données (data-model.md)

- [ ] T019 [P] Créer src/collections/PartnerMembers.ts (WhatsApp E.164 unique modifiable par l'équipe seulement, rôles `owner`/`manager` ; crochet qui ferme toutes les sessions de la personne quand son numéro change, testé dans tests/unit/partnerAuth/number-change.test.ts), src/collections/PartnerSessions.ts et src/collections/LoginCodes.ts (canaux d'envoi, compteur de SMS ; accès API publique interdit, invisibles sauf actions d'administration)
- [ ] T020 [P] Créer src/collections/RentalUnits.ts (nom unique par hébergement, capacité, ordre, `icalExportToken` 128 bits) ; règle « vendable ⇒ au moins une unité active » dans src/fields/bookable.ts pour les hébergements
- [ ] T021 Créer src/collections/Inventory.ts (unicité `(resourceType, resourceId, date, slot)`, `sold` et `held` en lecture seule dans l'admin) et src/collections/InventoryHolds.ts
- [ ] T022 [P] Créer src/collections/ExternalCalendars.ts (URL `https`, état, `importedNights`, `lastError`)
- [ ] T023 [P] Créer src/collections/AvailabilityChanges.ts (immuable, crochets de src/hooks/immutable.ts) et src/collections/PriceChangeRequests.ts (une seule demande `pending` par offre et champ, motif obligatoire si refus)
- [ ] T024 [P] Créer src/collections/SponsoredPlacements.ts (offre publiée appartenant au restaurant, dates, forfait, statut de paiement, moyen reçu) et src/collections/SponsoredStats.ts (unicité `(placement, week)`)
- [ ] T025 Ajouter `spaceActive` et `digestHour` à src/collections/Partners.ts ; `weeklyTemplate`, `capacityUnit`, `bookingCutoff` via un champ partagé src/fields/weeklyTemplate.ts appliqué à src/collections/Experiences.ts et src/collections/Transfers.ts ; `components` (validation : un hébergement au plus, `dayOffset` < durée, créneau existant) à src/collections/Stays.ts ; `rentalUnit`, `inventoryRefs`, `confirmedBy` aux lignes de src/collections/Bookings.ts
- [ ] T026 Enregistrer les collections dans src/payload.config.ts, régénérer src/payload-types.ts, créer la migration dans src/migrations/ avec SQL ajouté (`CHECK (sold + held <= capacity OR closed)`, unicité de l'inventaire), tester la descente ; étendre la matrice d'accès de tests/unit/checkout/access.test.ts (aucune collection 003 lisible par le public ni par `editor`)

### Stock atomique, authentification, layout

- [ ] T027 Implémenter src/lib/inventory/sql.ts : `materializeRow`, `holdInventory(paymentId, items)` (tout ou rien, `conflict: offer_unavailable` avec la ligne bloquante), `convertHolds`, `releaseHolds`, `releaseSold`, idempotents, dans des transactions SQL (contrat [availability](./contracts/availability.md))
- [ ] T028 Écrire tests/integration/inventory.test.ts (deux rétentions concurrentes sur la dernière place : une seule réussit ; rejeu de `convertHolds` sans effet ; expiration qui libère ; annulation qui libère) avec une configuration Vitest dédiée vitest.integration.config.ts et le script `test:integration` dans package.json
- [ ] T029 Implémenter src/lib/partnerAuth/server.ts : `requestLoginCode` (réponse identique numéro connu ou non, limites 3 / 15 min / numéro et 10 / h / IP hachée via `rateLimits`), `verifyLoginCode`, cookie `se_partner` (HttpOnly, Secure, Lax, `Path=/espace`, 30 j glissants), `getPartnerSession`, `requirePartner(role?)`, `revokeSessions(member)`
- [ ] T030 Créer src/app/(partner)/espace/layout.tsx (`<html lang="fr-SN">`, `robots: noindex, nofollow`, police et jetons de la 001) et les composants src/components/partner/AppHeader.tsx, src/components/partner/HelpButton.tsx (WhatsApp de l'équipe), src/components/partner/Tile.tsx, construits à 360 px d'abord, cibles ≥ 48 px
- [ ] T031 [P] Créer le registre des 9 modèles WhatsApp prestataires (nom, catégorie, variables ordonnées, bouton) dans src/lib/notifications/partnerTemplates.ts et son test tests/unit/notifications/partner-templates.test.ts ([notifications-partners](./contracts/notifications-partners.md))
- [ ] T032 Créer scripts/seed-partners.ts (personnes rattachées avec numéros de démonstration, unités louables de l'écolodge, semaines types, composants des séjours, `spaceActive` sur deux prestataires, une mise en avant payée) et le script `seed:partners` dans package.json
- [ ] T033b [P] Remplir la grille de R15 (devis d'au moins deux fournisseurs SMS, test de 50 envois vers Orange, Free et Expresso) et consigner le choix dans specs/003-espace-prestataires/research.md (décision commerciale du propriétaire)
- [ ] T033c [P] Créer l'adaptateur src/lib/notifications/sms.ts (`fetch` sans SDK, boîte d'envoi de test sans clé, variables facultatives `SMS_PROVIDER`, `SMS_API_KEY`, `SMS_SENDER` dans src/lib/env.ts et .env.example) et ses tests (envoi, échec, texte ≤ 160 caractères GSM) dans tests/unit/notifications/sms.test.ts
- [ ] T033 [P] Créer le flux de démonstration src/app/dev/ical-sample.ics/route.ts (404 en production, deux réservations dans les 30 jours)

**Checkpoint** : `pnpm typecheck && pnpm lint && pnpm test && pnpm test:integration` verts ;
l'admin affiche les nouvelles collections ; `/espace` répond en `noindex`.

---

## Phase 3: User Story 1 — Le prestataire ferme et ouvre ses dates depuis son téléphone (Priority: P1) 🎯 MVP

**Goal**: connexion par code WhatsApp, calendriers (nuits par unité, créneaux, véhicules), semaine
type, annulation 10 s ; le site public ne propose que le disponible ; rétention au paiement et
confirmation automatique.

**Independent Test**: un prestataire de démonstration se connecte à 360 px, ferme une date et
réduit un créneau ; le formulaire public ne propose plus la date et limite le créneau ; une
réservation sur ce créneau est confirmée automatiquement ; une seconde est refusée avant paiement.

### Tests for User Story 1 ⚠️

- [ ] T034 [P] [US1] E2E connexion : code reçu (boîte d'envoi), repli « Recevoir le code par SMS » après 60 s (SMS dans la boîte d'envoi), mauvais code avec essais restants, blocage après 5 essais, lien de secours à usage unique, axe sur chaque état ; `X-Robots-Tag: noindex`, balise robots `noindex` et `Cache-Control: private, no-store` sur `/espace`, `/espace/code` et `/espace/accueil` ; aucune URL `/espace` dans le sitemap (`@partner @us1`) dans tests/e2e/partner/login.mobile.spec.ts
- [ ] T035 [P] [US1] E2E fermeture de nuits d'une unité et absence sur le formulaire public en moins d'une minute, chronométré < 2 min en 3G, zoom 200 % sans défilement horizontal, états lus par le lecteur d'écran (`@partner @us1`, projet android-360-3g) dans tests/e2e/partner/us1-calendar.mobile.spec.ts
- [ ] T036 [P] [US1] E2E capacité d'un créneau : réduction, refus sous les places vendues avec la réservation affichée, annulation dans les 10 s, semaine type (`@partner @us1`) dans tests/e2e/partner/us1-capacity.mobile.spec.ts
- [ ] T037 [P] [US1] E2E disponibilité publique : date fermée absente, créneau complet refusé avant paiement, sans JavaScript proposition des 3 prochaines dates, séjour indisponible quand une pirogue incluse est fermée (`@availability`) dans tests/e2e/availability/public.spec.ts
- [ ] T038 [P] [US1] E2E réservation instantanée : paiement `fake` réussi → « Confirmé » sur la page et dans le message, unité attribuée ; second panier sur la dernière place refusé ; prestataire sans espace → « en cours de confirmation » (002) (`@availability`) dans tests/e2e/availability/instant.spec.ts

### Implementation for User Story 1

- [ ] T039 [US1] Créer les pages de connexion src/app/(partner)/espace/page.tsx, src/app/(partner)/espace/code/page.tsx, src/app/(partner)/espace/lien/[token]/page.tsx et les actions `requestLoginCode`, `requestLoginCodeBySms` (2 SMS / 15 min / numéro), `verifyLoginCode`, `logout` dans src/app/(partner)/espace/actions.ts (`type="tel"`, `autocomplete="one-time-code"`, renvoi WhatsApp et bouton SMS après 60 s ou dès un refus WhatsApp, retour `?suite=` limité à `/espace/*`)
- [ ] T040 [US1] Ajouter à l'admin des personnes rattachées les actions « Créer un lien de connexion » (15 min) et « Fermer toutes les sessions » : point d'entrée dans src/collections/PartnerMembers.ts et composant src/components/admin/PartnerAccessActions.tsx, puis `pnpm generate:importmap`
- [ ] T041 [US1] Créer l'accueil src/app/(partner)/espace/accueil/page.tsx (« Aujourd'hui », « Demain », alertes, quatre tuiles, textes en français simple)
- [ ] T042 [US1] Créer src/app/(partner)/espace/calendrier/page.tsx (choix de l'offre puis de l'unité, en un geste chacun)
- [ ] T043 [US1] Créer la grille des nuits src/components/partner/NightsGrid.tsx (états « Libre / Fermé / Réservé / Airbnb / Booking » par couleur et mot, cases à cocher sans JS) et la page src/app/(partner)/espace/calendrier/[offer]/page.tsx (unité et mois en paramètres)
- [ ] T044 [US1] Créer la liste des jours et créneaux src/components/partner/SlotsList.tsx (capacité en unités de l'offre : places, embarcations, véhicules, couverts) pour expériences, tables et transferts, intégrée à src/app/(partner)/espace/calendrier/[offer]/page.tsx
- [ ] T045 [US1] Implémenter src/lib/inventory/partnerEdits.ts et les actions `setNightsClosed`, `setSlotCapacity`, `undoChange` dans src/app/(partner)/espace/actions.ts (refus sur nuit réservée ou importée, refus sous les places vendues, journal `availabilityChanges`, jeton d'annulation de 10 s)
- [ ] T046 [P] [US1] Créer les îlots src/components/client/UndoToast.tsx, src/components/client/DayPicker.tsx et src/components/client/OfflineBanner.tsx (≤ 6 Ko gz au total, chacun utile sans JS grâce au formulaire)
- [ ] T047 [US1] Créer src/app/(partner)/espace/calendrier/[offer]/semaine/page.tsx et l'action `saveWeeklyTemplate` (rôle `owner`, jours déjà modifiés ou vendus non touchés)
- [ ] T048 [US1] Créer src/app/api/availability/route.ts (paramètres validés par Zod, `left` plafonné à 20, `Cache-Control: public, s-maxage=30, stale-while-revalidate=30`, `X-Robots-Tag: noindex`, 120 requêtes / min / IP hachée)
- [ ] T049 [US1] Créer l'îlot src/components/client/AvailabilityPicker.tsx (chargé au premier contact avec le formulaire, < 4 Ko gz) et l'intégrer au bloc « Ajouter au panier » de la 002 sans rendre la fiche dynamique ; vérifier que la fiche reste prérendue (test de tests/e2e/checkout/tunnel.spec.ts)
- [ ] T050 [US1] Vérifier la disponibilité dans `addToCart` et `updateCartLine` (actions de la 002 dans src/lib/cart/) : `conflict: offer_unavailable` avec `nextAvailableDates`, affichées en liens sans JavaScript
- [ ] T051 [US1] Appeler `holdInventory` à la création de la tentative de paiement (`startPayment` de la 002), `convertHolds` dans la transaction du succès de paiement (attribution de l'unité via `allocateUnit`, `inventoryRefs`, `availabilityStatus = confirmed` et `confirmedBy = auto` si `partner.spaceActive`), `releaseHolds` dans la réconciliation des tentatives expirées (src/jobs/ de la 002)
- [ ] T052 [US1] Séjours par composants (FR-007b) : disponibilité dans `GET /api/availability` et rétention de tous les composants dans la même transaction, dans src/lib/inventory/sql.ts et src/app/api/availability/route.ts
- [ ] T053 [US1] Transferts par véhicules (FR-007a) : ressource `transferDay`, véhicules consommés selon `vehiclesNeeded`, dans src/lib/inventory/sql.ts et src/components/partner/SlotsList.tsx
- [ ] T054 [US1] Afficher « Confirmé » ou « Disponibilité en cours de confirmation » selon la ligne dans `summaryLines` (src/lib/checkout/summary.ts), la page de réservation et les messages au voyageur de la 002 ; test dans tests/unit/checkout/summary.test.ts
- [ ] T055 [US1] Appeler `releaseSold` à la validation d'une annulation de ligne (flux d'annulation de la 002) et rouvrir la capacité ; test d'intégration dans tests/integration/inventory.test.ts

**Checkpoint** : T034 à T038 verts ; `pnpm lhci` et `pnpm bundles` dans les budgets (pages
publiques inchangées) ; la confirmation manuelle de la 002 reste active pour les prestataires sans
espace.

---

## Phase 4: User Story 2 — Le prestataire est prévenu sur WhatsApp et voit ses réservations (Priority: P2)

**Goal**: message WhatsApp à chaque réservation, liste et détail des réservations, « J'ai un
problème », récapitulatif de la veille.

**Independent Test**: une réservation payée déclenche `partner_booking_new` vers le bon
prestataire et apparaît dans sa liste ; un autre prestataire ne la voit pas.

### Tests for User Story 2 ⚠️

- [ ] T056 [P] [US2] E2E réservation reçue : message dans la boîte d'envoi en moins de 2 min, liste triée (la plus proche d'abord), détail avec appel et WhatsApp, isolement entre prestataires, rôle `manager` sans « Mes paiements » (`@partner @us2`) dans tests/e2e/partner/us2-bookings.mobile.spec.ts
- [ ] T057 [P] [US2] E2E « J'ai un problème » : motifs simples, alerte équipe, ligne signalée pour la règle d'indisponibilité de la 002, accusé `partner_problem_ack` (`@partner @us2`) dans tests/e2e/partner/us2-problem.spec.ts
- [ ] T058 [P] [US2] Tests des destinataires (personnes actives avec `notifyBookings`, `owner` seuls pour paiements et prix) et des variables (voyageurs « 2 adultes, 1 enfant ») dans tests/unit/notifications/partner-recipients.test.ts

### Implementation for User Story 2

- [ ] T059 [US2] Créer src/lib/booking/partnerNotifications.ts (destinataires, `partner_booking_new` au succès du paiement, `partner_booking_changed` à l'annulation ou modification par l'équipe) et le brancher sur le traitement des paiements et des annulations de la 002
- [ ] T060 [US2] Créer src/app/(partner)/espace/reservations/page.tsx (à venir d'abord, onglet « Passées » sur 30 jours, lecture serveur filtrée par prestataire)
- [ ] T061 [US2] Créer src/app/(partner)/espace/reservations/[id]/page.tsx (date, heure, voyageurs, demandes, liens `tel:` et WhatsApp ; coordonnées masquées « Voyageur » 30 jours après la prestation, FR-042)
- [ ] T062 [US2] Implémenter l'action `reportProblem` dans src/app/(partner)/espace/actions.ts (alerte équipe, signalement de la ligne, `partner_problem_ack`)
- [ ] T063 [US2] Créer la tâche src/jobs/partnerDailyDigest.ts (heure `digestHour`, seulement s'il y a des prestations le lendemain et `dailyDigest`) et l'enregistrer dans src/payload.config.ts avec sa planification
- [ ] T064 [US2] Créer src/app/(partner)/espace/reglages/page.tsx et l'action `updateNotificationSettings` (notifications de réservation, récapitulatif, personnes rattachées en lecture, déconnexion)
- [ ] T065 [US2] Adapter l'escalade de src/jobs/sendNotification.ts aux modèles prestataires (pas de repli e-mail vers le prestataire, alerte équipe pour appel) ; test dans tests/unit/notifications/retry.test.ts

**Checkpoint** : T056 à T058 verts ; US1 toujours verte.

---

## Phase 5: User Story 3 — Les villas restent synchronisées avec Airbnb et Booking (Priority: P3)

**Goal**: export iCal par unité, import toutes les 15 min, conflits et erreurs signalés.

**Independent Test**: le flux de démonstration relié à une unité ferme ses nuits sur le site public
après synchronisation ; le flux exporté contient les nuits réservées sans donnée personnelle.

### Tests for User Story 3 ⚠️

- [ ] T066 [P] [US3] Tests de téléchargement sûr (refus `http` hors développement, adresses privées, redirection vers une adresse privée, plus de 3 redirections, corps > 1 Mo, délai 10 s, `304`) dans tests/unit/ical/fetch.test.ts
- [ ] T067 [P] [US3] E2E synchronisation : ajout du flux de démonstration, nuits « Airbnb » dans l'espace et fermées sur le site, export lisible et sans nom, nuit importée non réouvrable, calendrier en erreur signalé (`@partner @us3`) dans tests/e2e/partner/us3-ical.spec.ts

### Implementation for User Story 3

- [ ] T068 [US3] Implémenter src/lib/ical/fetch.ts (résolution DNS et contrôle des plages d'adresses, redirections contrôlées, `If-None-Match` / `If-Modified-Since`) jusqu'à faire passer T066
- [ ] T069 [US3] Créer src/app/api/ical/[token]/route.ts (`text/calendar`, `Cache-Control: private, max-age=300`, `X-Robots-Tag: noindex`, 404 sans indication pour un jeton inconnu)
- [ ] T070 [US3] Créer la tâche src/jobs/syncExternalCalendars.ts (toutes les 15 min, 20 calendriers par passage, fermeture et réouverture selon `importedNights`, statut `error` après 2 h, `partner_ical_error` une fois par épisode) et l'enregistrer dans src/payload.config.ts
- [ ] T071 [US3] Créer src/lib/ical/conflicts.ts (nuit importée déjà vendue → alerte équipe et propriétaire `partner_ical_conflict`, ligne signalée pour la règle d'indisponibilité de la 002) ; test dans tests/unit/ical/conflicts.test.ts
- [ ] T072 [US3] Créer src/app/(partner)/espace/calendrier/[offer]/synchronisation/page.tsx et les actions `addExternalCalendar` (vérification de l'URL et première lecture), `removeExternalCalendar` (réouverture des nuits non réservées), bouton « Copier » du lien d'export
- [ ] T073 [US3] Ajouter à l'admin des unités louables l'action « Régénérer le lien d'export » (révoque l'ancien) et l'état des calendriers externes dans src/collections/RentalUnits.ts et src/collections/ExternalCalendars.ts

**Checkpoint** : T066 et T067 verts ; US1 et US2 toujours vertes.

---

## Phase 6: User Story 4 — Le prestataire tient ses prix et voit ce qui lui a été versé (Priority: P4)

**Goal**: demandes de changement de prix validées par l'équipe ; relevé « Mes paiements »
identique à celui de l'équipe ; notification des reversements.

**Independent Test**: une demande de prix reste « en attente » sans changer le site, puis
s'applique après validation sans modifier une réservation payée ; le relevé correspond à celui de
la 002.

### Tests for User Story 4 ⚠️

- [ ] T074 [P] [US4] E2E prix : demande « En attente de validation », ancien prix toujours vendu, validation dans l'admin → nouveau prix sur la fiche et message `partner_price_decision`, refus avec motif, réservation payée inchangée, confirmation en lettres au-delà de 50 % (`@partner @us4`) dans tests/e2e/partner/us4-prices.spec.ts
- [ ] T075 [P] [US4] E2E « Mes paiements » : montants identiques au relevé de l'équipe pour le mois, reversement notifié, page absente pour le rôle `manager` (`@partner @us4`) dans tests/e2e/partner/us4-payouts.spec.ts
- [ ] T076 [P] [US4] Tests du montant en toutes lettres en français (ex. 125 000 → « cent vingt-cinq mille francs CFA ») dans tests/unit/partner/amount-in-words.test.ts

### Implementation for User Story 4

- [ ] T077 [P] [US4] Implémenter src/lib/partner/amountInWords.ts jusqu'à faire passer T076
- [ ] T078 [US4] Créer src/app/(partner)/espace/prix/page.tsx (tarifs en grands chiffres, état des demandes) et l'action `requestPriceChange` (remplacement d'une demande en attente, confirmation en lettres au-delà de 50 %, notification de l'équipe)
- [ ] T079 [US4] Ajouter les actions « Valider » et « Refuser » (motif obligatoire) à src/collections/PriceChangeRequests.ts : écriture du prix dans l'offre (régénération des pages par les crochets de la 001), notification `partner_price_decision`
- [ ] T080 [US4] Créer src/app/(partner)/espace/paiements/page.tsx en réutilisant la fonction de relevé de la 002 (US5) filtrée par prestataire et mois (rôle `owner`)
- [ ] T081 [US4] Notifier `partner_payout_sent` aux `owner` à l'enregistrement d'un reversement (crochet `afterChange` de src/collections/Payouts.ts)

**Checkpoint** : T074 à T076 verts ; US1 à US3 toujours vertes.

---

## Phase 7: User Story 5 — Un restaurant paie pour être mis en avant, signalé comme tel (Priority: P5)

**Goal**: mises en avant au forfait payé hors du site, carte signalée « Partenaire mis en avant »
sur les pages statiques, mesure sans cookie, écran du restaurant.

**Independent Test**: une mise en avant payée et datée apparaît avec la mention en FR et en EN
pendant sa période seulement, sans changer l'ordre éditorial ; ses compteurs augmentent.

### Tests for User Story 5 ⚠️

- [ ] T082 [P] [US5] E2E mise en avant : mention visible et nom accessible à 360 et 1280 px en FR et EN, `rel="sponsored"`, absente du JSON-LD, liste éditoriale inchangée, une seule par page, invisible si non payée ou hors période, axe (`@sponsored`) dans tests/e2e/sponsored/sponsored.spec.ts
- [ ] T083 [P] [US5] Tests du point de mesure (incrément par semaine ISO, robots ignorés, mise en avant inactive sans effet, aucun champ personnel enregistré) dans tests/unit/sponsored/hit.test.ts

### Implementation for User Story 5

- [ ] T084 [US5] Créer src/components/cards/SponsoredCard.tsx (mention textuelle au-dessus du titre, photo, titre, prix « à partir de » TTC FCFA et « ≈ € indicatif », lien `rel="sponsored"`) et les messages `sponsored.label` dans src/i18n/messages/fr.json et src/i18n/messages/en.json
- [ ] T085 [US5] Placer la carte dans les vues destination, univers « Table du Saloum » et bloc « À proximité » des fiches d'expérience (src/components/views/), emplacement distinct, une par page, espace réservé sans CLS
- [ ] T086 [US5] Ajouter le tag de cache `sponsored` aux pages concernées, son invalidation à l'enregistrement d'une mise en avant (crochet de src/collections/SponsoredPlacements.ts) et la tâche quotidienne src/jobs/refreshSponsored.ts (00 h 05, Dakar)
- [ ] T087 [US5] Créer src/app/api/sponsored/hit/route.ts (incrément atomique, `204`) et l'îlot src/components/client/SponsoredBeacon.tsx (< 1 Ko, `sendBeacon`, vue à 50 % de visibilité, clic) jusqu'à faire passer T083
- [ ] T088 [US5] Créer src/app/(partner)/espace/mise-en-avant/page.tsx (périodes, forfait, statut de paiement, affichages et ouvertures par semaine ; restaurants `owner` seulement)
- [ ] T089 [US5] Compléter l'admin de src/collections/SponsoredPlacements.ts (offre filtrée sur le restaurant choisi, statut calculé en colonne, marquage « payé » réservé à `finance` et `admin`)

**Checkpoint** : T082 et T083 verts ; LHCI des pages destination et univers dans les budgets.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T090 [P] Rédiger les 9 modèles WhatsApp à soumettre à l'approbation (texte, catégorie, variables, exemples) dans specs/003-espace-prestataires/launch/whatsapp-templates.md
- [ ] T091 [P] Rédiger le protocole et consigner les résultats du test avec 5 prestataires réels, dont 3 peu à l'aise avec les sites web (SC-001 : fermer une date et changer un créneau < 2 min sans aide) dans specs/003-espace-prestataires/launch/partner-usability.md
- [ ] T092 [P] Mener la revue de sécurité bloquante (connexion par code WhatsApp et SMS, sessions, lien de secours, isolement entre prestataires, SSRF de l'import iCal, jetons d'export, point de mesure) et la consigner dans specs/003-espace-prestataires/launch/security-review.md
- [ ] T093 [P] Compléter le registre des traitements et la politique de confidentialité FR/EN (prestataires, connexion par WhatsApp, mesure des mises en avant sans cookie) dans le contenu de la page confidentialité (src/seed/pages.ts et CMS)
- [ ] T094 Créer la tâche src/jobs/purgePartnerAuth.ts (codes expirés, sessions 30 j après expiration, journal > 12 mois, inventaire passé > 24 mois) et l'enregistrer dans src/payload.config.ts ; test dans tests/unit/partnerAuth/purge.test.ts
- [ ] T095 Suivre SC-006 et SC-007 : vue d'administration « Espace prestataires » (prestataires actifs par semaine, part des lignes `confirmedBy = auto`) dans src/components/admin/PartnerSpaceStats.tsx
- [ ] T096 Lancer `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:integration`, `pnpm e2e`, `pnpm e2e:nojs`, `pnpm bundles`, `pnpm lhci`, `pnpm seo:check` ; corriger tout dépassement de budget avant de clore
- [ ] T097 Valider le déroulé de specs/003-espace-prestataires/quickstart.md de bout en bout et mettre à jour CLAUDE.md si besoin

---

## Dependencies & Execution Order

### Phase Dependencies

- **Prérequis externe** : 002 livrée jusqu'à son US1 (T29), jusqu'à son US5 pour l'US4 ; T21
  décidée (SMS) ; T033b (choix du fournisseur SMS) avant la mise en production, pas avant le
  développement (boîte d'envoi de test).
- **Setup (Phase 1)** : immédiat.
- **Foundational (Phase 2)** : après Setup ; **bloque toutes les user stories**.
- **US1 (Phase 3)** : après la phase 2 ; c'est le MVP.
- **US2 (Phase 4)** : après la phase 2 ; s'appuie sur la connexion (T039) et sur la confirmation
  automatique (T051) pour le message « Confirmé ».
- **US3 (Phase 5)** : après la phase 2 et les calendriers de nuits (T043, T045).
- **US4 (Phase 6)** : après la phase 2 et la connexion (T039) ; « Mes paiements » requiert l'US5
  de la 002 (relevé).
- **US5 (Phase 7)** : après la phase 2 ; indépendante des disponibilités (seul T088 requiert la
  connexion T039).
- **Polish (Phase 8)** : après les stories retenues pour la mise en ligne.

### Within Each User Story

- Tests d'abord (ils échouent), puis modèles et logique, puis pages et actions, puis intégration
  aux flux de la 002.
- Les actions de src/app/(partner)/espace/actions.ts sont modifiées par plusieurs tâches : à
  enchaîner, jamais en parallèle.

### Parallel Opportunities

- Phase 1 : T003 à T007 en parallèle.
- Phase 2 : T008–T014 (tests) en parallèle ; puis T016–T018 en parallèle de T015 ; T019, T020,
  T022–T024 en parallèle ; T031 et T033 en parallèle de T027–T030.
- US1 : T034–T038 en parallèle ; T046 en parallèle de T041–T045.
- US2 : T056–T058 en parallèle.
- US3 : T066 et T067 en parallèle.
- US4 : T074–T076 en parallèle, T077 en parallèle de T078.
- US5 : T082 et T083 en parallèle.
- Polish : T090 à T093 en parallèle.
- Après la phase 2, US3, US4 et US5 peuvent avancer en parallèle de l'US1 si l'équipe le permet.

## Parallel Example: User Story 1

```text
T034 login.mobile.spec.ts   T035 us1-calendar.mobile.spec.ts   T036 us1-capacity.mobile.spec.ts
T037 availability/public.spec.ts   T038 availability/instant.spec.ts
puis : T046 îlots (UndoToast, DayPicker, OfflineBanner) pendant T041 → T045
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (Setup) puis phase 2 (Foundational).
2. Phase 3 (US1) : connexion, calendriers, disponibilité publique, réservation instantanée.
3. **Arrêt et validation** : T034 à T038, LHCI et budgets, démonstration avec deux prestataires
   pilotes (`spaceActive`), les autres restant en confirmation manuelle (002).

### Incremental Delivery

1. US1 → prestataires pilotes, suppression de la confirmation manuelle pour eux.
2. US2 → messages et liste des réservations : généralisation à tous les prestataires actifs.
3. US3 → hébergements présents sur Airbnb et Booking.
4. US4 → prix et relevés en libre-service.
5. US5 → mises en avant (revenu complémentaire), à ouvrir avant la haute saison.

### Notes

- Chaque tâche est cochée `[X]` dès qu'elle est faite ; à la fin de chaque phase : tests,
  Lighthouse CI mobile et axe, puis rapport (fait, scores, URL à vérifier, prochain lot).
- Aucune dépendance hors plan sans accord du propriétaire.
