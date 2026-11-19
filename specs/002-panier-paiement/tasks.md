# Tasks: Panier unique et paiement en ligne

**Input**: Design documents from `/specs/002-panier-paiement/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: obligatoires (constitution VII : tests unitaires sur la logique monétaire, E2E
360 px par parcours livré ; I : parcours de paiement en 3G ; IV : axe et clavier ; VI : parité
des moyens de paiement). Les tests d'une story sont écrits **avant** son implémentation et
doivent échouer d'abord.

**Organisation** : par user story (spec), chaque tâche < une demi-journée. `[P]` = fichiers
différents, sans dépendance sur une tâche inachevée.

**Prérequis bloquant externe** : la 001 doit avoir livré ses phases 2B à 7 (fait) **et sa phase 8
(demande de séjour, îlot `AddToRequest`, route `request`)**, à livrer avant la 002 (plan,
tension T18, décision du 2026-11-15). Les dérogations D-T12 (API WhatsApp Cloud) et D-T17
(`@react-pdf/renderer`) ont été approuvées le 2026-11-15. Ordonnanceur : offre Vercel Pro
(tension T20).

## Path Conventions

Application unique à la racine (plan 001 et 002) : `src/`, `tests/unit/`, `tests/e2e/`,
`scripts/`. Pages traduites via le résolveur `src/app/(frontend)/[locale]/[...segments]/page.tsx`.

---

## Phase 1: Setup

**Purpose**: préparer le dépôt pour le tunnel, sans logique métier.

- [X] T001 Vérifier les prérequis 001 (collections `stays`, `experiences`, `accommodations`, `destinations`, `cancellationPolicies`, `siteSettings` ; îlot `AddToRequest` ; résolveur de segments) et consigner le résultat dans specs/002-panier-paiement/tasks.md (note sous cette tâche) ; arrêter si absent
- [X] T002 Ajouter les variables d'environnement du quickstart (passerelle, WhatsApp, `CRON_SECRET`, Plausible Events) dans .env.example et un module de lecture typé et validé par Zod dans src/lib/env.ts
- [X] T003 [P] Ajouter les segments traduits du tunnel (`panier`/`cart`, `commande`/`checkout`, `coordonnees`/`details`, `paiement`/`payment`, `statut`/`status`, `reservation`/`booking`, `solde`/`balance`, `annulation`/`cancel`, `retrouver`/`find`, `reprendre`/`resume`) dans src/i18n/pathnames.ts, avec leur réécriture vers les routes internes du groupe `(checkout)` dans src/middleware.ts (plan, tension T19)
- [X] T004 [P] Créer les espaces de messages `cart`, `checkout`, `booking`, `payment`, `refund` (FR et EN, libellés des étapes, erreurs, causes d'échec, mentions « indicatif » et « en cours de confirmation ») dans src/i18n/messages/fr.json et src/i18n/messages/en.json
- [X] T005 [P] Ajouter les URL du tunnel (`/fr/panier`, `/fr/commande/coordonnees`, `/fr/commande/statut?p=demo`) avec le cookie du panier de démonstration et une matrice d'assertions sans catégorie SEO dans lighthouserc.json
- [X] T006 [P] Étendre scripts/check-bundles.ts aux routes du groupe `(checkout)` et ajouter un plafond de 3 Ko gzip pour l'ensemble des îlots `src/components/client/CartBadge.tsx` et `PaymentStatusPoller.tsx`
- [X] T007 [P] Ajouter le tag `@checkout` et un projet `android-360-3g` (profil `3g` de tests/e2e/support/network.ts) dans playwright.config.ts ; script `e2e:checkout` dans package.json
- [ ] T097 [P] Comparer PayDunya, PayTech et CinetPay selon les critères éliminatoires de research R2 (dont test manuel de la page hébergée à 360 px, au clavier et au lecteur d'écran — tension T14) ; consigner la décision dans specs/002-panier-paiement/research.md (R2) ; **décision commerciale du propriétaire requise avant T098** (avancée en phase 1 : seul blocage avant l'ouverture au public)
- [X] T008 [P] Créer les helpers E2E du tunnel (`seedCheckoutFixtures`, `fillContact`, `payWithFake(outcome)`, `readCartSummary`, `expectNoindex`) dans tests/e2e/support/checkout.ts

> **Avancement de la phase 1 (2026-11-16)** :
> - T001 : prérequis 001 vérifiés (collections, réglages, îlot `AddToRequest`, résolveur, demande de
>   séjour de la phase 8) ; tous présents.
> - T002 : `src/lib/env.ts` ; la passerelle `fake` est refusée en production sauf
>   `ALLOW_FAKE_GATEWAY=1` (local et tests, où `next start` tourne en mode production).
> - T003 : segments dans `src/lib/checkout/paths.ts` (et non `pathnames.ts` : le tunnel n'est pas une
>   route du résolveur) ; réécriture vers `/{langue}/tunnel/...` dans `src/middleware.ts` ; références
>   de réservation en minuscules dans les URL (le middleware redirige toute majuscule) ; le sélecteur
>   de langue reste sur la même étape et conserve `p`, `k` et `t`. Pas d'en-tête Referer propre au
>   tunnel : la politique du site (`strict-origin-when-cross-origin`) ne transmet jamais le chemin à
>   un tiers.
> - T005, T006, T008 : reportées au moment où les pages, les îlots et les premiers tests du tunnel
>   existent (phase 3).
> - T097 : grille de comparaison prête (research.md R2a) ; **décision commerciale du propriétaire
>   attendue**, nécessaire seulement avant T098.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: logique monétaire, modèle de données, file de tâches, passerelle de paiement et
layout du tunnel. **Aucune story ne commence avant la fin de cette phase.**

### Logique métier pure (tests d'abord)

- [X] T009 [P] Écrire les tests de tarification (FR-041 : nuits multi-saisons, enfants de 4 à 11 ans à 50 % et gratuits sous 4 ans avec pourcentage et âges réglables par offre, transferts par véhicule selon la tranche de passagers 1–3 / 4–7 / 8+, séjour signature par saison d'arrivée, entiers XOF, conversion EUR indicative 655,957) dans tests/unit/checkout/pricing.test.ts
- [X] T010 [P] Écrire les tests d'acompte (éligibilité > 30 jours, `requireFullPayment`, arrondi à la centaine supérieure, `acompte + solde = total`, date limite J-14) dans tests/unit/checkout/deposit.test.ts
- [X] T011 [P] Écrire les tests de commission (taux en points de base 1000–2500 refusés hors plage, arrondi demi vers le haut, somme commission + part = encaissé, reconnaissance au prorata en acompte, ajustement de remboursement, motif `partner` où la commission reste due) dans tests/unit/checkout/commission.test.ts
- [X] T012 [P] Écrire les tests des paliers d'annulation (palier applicable selon les jours restants, montant remboursable sur l'encaissé réel, annulation partielle, motif `company`/`unavailable` = 100 %) dans tests/unit/checkout/cancellation.test.ts
- [X] T013 [P] Écrire les tests de cohérence du panier (≤ 1 hébergement ou séjour, séjour exclut hébergement, dates dans les nuits, retour après aller, capacité, délai minimum J+1) et des machines à états `bookings` / `payments` (transitions autorisées, refus des retours en arrière) dans tests/unit/checkout/validateCart.test.ts et tests/unit/checkout/stateMachines.test.ts
- [X] T014 Implémenter src/lib/checkout/pricing.ts et src/lib/checkout/deposit.ts (purs, sans dépendance) jusqu'à faire passer T009 et T010
- [X] T015 [P] Implémenter src/lib/checkout/commission.ts et src/lib/checkout/cancellation.ts jusqu'à faire passer T011 et T012
- [X] T016 [P] Implémenter src/lib/checkout/validateCart.ts, src/lib/checkout/stateMachines.ts et src/lib/checkout/reference.ts (référence `SE-` + 6 caractères sans 0/O/1/I, test d'unicité statistique) jusqu'à faire passer T013
- [X] T016b [P] Créer src/lib/checkout/summary.ts (`summaryLines(booking)` : source unique des lignes, dates, voyageurs, prix et total) et tests/unit/checkout/summary.test.ts vérifiant que la page, l'e-mail, le modèle WhatsApp et le bon PDF rendent exactement ces lignes (FR-010) ; T058, T059 et T061 consomment `summaryLines`

### Modèle de données (data-model.md)

- [X] T017 [P] Ajouter `tiers` (validation : ≥ 1 palier, délais uniques, pourcentages décroissants) à src/collections/CancellationPolicies.ts
- [X] T018 [P] Créer src/collections/Partners.ts (champs, `payoutDetails` visible de `finance`/`admin` seulement)
- [X] T019 [P] Créer src/collections/Transfers.ts (trajets AIBD/Dakar, `priceTiers`, `partner`, `cancellationPolicy`, `bookable`)
- [X] T020 Ajouter `bookable`, `partner`, `childPricePercent`, `slots`, `offerKind`, prix saisonniers par nuit, `minNights`, `requireFullPayment` et la règle « vendable ⇒ partenaire + politique + prix » via un champ partagé src/fields/bookable.ts appliqué à src/collections/Stays.ts, Experiences.ts et Accommodations.ts ; tarif enfant réglable par offre (FR-041) ; `priceFromPerNight` des hébergements devient calculé (le plus bas des prix saisonniers), en lecture seule ; migration et seed mis à jour ; cartes, listes et JSON-LD de la 001 inchangés (tests 001 verts)
- [X] T021 [P] Créer src/globals/CommissionRates.ts (historisé, défauts 1000/1500/1500/2000/2500, validation 1000–2500) et ajouter le groupe `checkout` et `notifications` à src/globals/SiteSettings.ts
- [X] T022 [P] Créer src/collections/Carts.ts (CartItem, `version`, `contact`, `remindersConsent`, statuts, `expiresAt`) avec accès API publique interdit
- [X] T023 Créer src/collections/Bookings.ts (BookingLine, `policySnapshot`, `availabilityStatus`, `manageTokenHash` masqué, unicité `(cart, cartVersion)`, accès par rôle) — dépend de T022
- [X] T024 [P] Créer src/collections/Payments.ts et src/collections/PaymentEvents.ts (immuable : `update`/`delete` refusés à tous) ; migration SQL de l'index unique partiel `(booking, purpose) WHERE status IN ('initiated','pending')` et de l'unicité `gatewayEventId` dans src/migrations/
- [X] T025 [P] Créer src/collections/Refunds.ts, src/collections/CommissionEntries.ts (immuable), src/collections/Payouts.ts
- [X] T026 [P] Créer src/collections/Reminders.ts et src/collections/Notifications.ts (destinataire partiellement masqué dans l'admin)
- [X] T027 Ajouter les rôles `operations` et `finance` à src/collections/Users.ts et appliquer la matrice d'accès du data-model à toutes les nouvelles collections ; test d'accès dans tests/unit/checkout/access.test.ts

> **Avancement de la phase 2 (logique et modèle)** (2026-11-16) :
> - Logique pure : 56 tests verts. Le panier stocke des effectifs déjà classés (`adults`,
>   `children` de 4 à 11 ans, `infants` de moins de 4 ans), comme le data-model ; les bornes d'âge
>   de l'offre servent aux libellés du formulaire. Remboursement et commission arrondis demi vers
>   le haut ; en acompte puis solde, la commission du solde est calculée sur le cumul (somme
>   exacte, sans écart d'arrondi).
> - Modèle : dates civiles (`startDate`, `balanceDueDate`, périodes de reversement) stockées en
>   texte AAAA-MM-JJ (aucun décalage de fuseau) ; relances ciblées par `targetType` + `targetId`
>   (et non par relation polymorphe) pour porter l'index unique de FR-031 ; ajout de
>   `experiences.maxParticipants` (défaut 12), nécessaire au contrôle de capacité ; fichier du bon
>   PDF ajouté avec T061 (média privé). Migration `20261116_065551_checkout_model` : index
>   unique partiel des paiements actifs et reprise des prix saisonniers des hébergements ; descente
>   testée (contraintes en `IF EXISTS`, l'ordre généré par Payload échouait).

### Infrastructure transverse

- [X] T028 Configurer la file `jobs` de Payload dans src/payload.config.ts et créer la route protégée src/app/api/jobs/run/route.ts (secret `CRON_SECRET`, comparaison à temps constant) + script `jobs:dev` dans package.json
- [X] T029 [P] Définir le type `PaymentGateway` du contrat dans src/lib/payments/gateway.ts et la sélection par `PAYMENT_GATEWAY` dans src/lib/payments/index.ts
- [X] T030 [P] Écrire la suite de contrat commune (trois moyens, montant entier conservé, signature invalide rejetée, notification rejouée sans effet, statuts reconnus) dans tests/unit/payments/gateway.contract.test.ts
- [X] T031 Implémenter la passerelle `fake` (notifications signées HMAC `FAKE_GATEWAY_SECRET`, option `delayMs`) dans src/lib/payments/fake.ts et sa page src/app/dev/fake-gateway/page.tsx (404 en production) jusqu'à faire passer T030
- [X] T032 [P] Créer les cookies `se_cart` (HttpOnly, Secure, Lax, 7 j) et `se_cart_summary` (nombre + total, sans donnée personnelle) dans src/lib/cart/cookies.ts et le dépôt de paniers (lecture, création, incrément de version) dans src/lib/cart/repository.ts
- [X] T033 Créer le groupe src/app/(frontend)/[locale]/(checkout)/ (layout et routes internes `cart`, `checkout/[step]`, `booking/[ref]/[[...action]]`, `resume`, `find`) : `robots: noindex, nofollow`, en-têtes `X-Robots-Tag: noindex`, `Cache-Control: private, no-store`, `Referrer-Policy: no-referrer` (via src/middleware.ts, qui réécrit aussi les segments traduits), indicateur d'étapes, lien WhatsApp contextuel (FR-039) ; **ne pas** modifier le résolveur [...segments] (tension T19) ; test E2E : une fiche séjour reste servie avec `x-nextjs-prerender` après ajout d'un article au panier
- [X] T034 [P] Créer le gabarit d'envoi commun (4 tentatives 0/1/5/30 min, puis `escalated` vers `fallbackNotificationEmail`) : tâche src/jobs/sendNotification.ts, adaptateurs src/lib/notifications/email.ts (Resend) et src/lib/notifications/whatsapp.ts (API Cloud en `fetch` ; journalisation seule si `WHATSAPP_CLOUD_TOKEN` vide) ; tests de la politique de relance dans tests/unit/notifications/retry.test.ts
- [X] T035 [P] Ajouter les types de page du tunnel à `NOINDEX_TYPES` de src/lib/seo/sitemapEntries.ts (jamais dans `FIXED_ROUTES`) et vérifier que src/app/robots.ts ne les bloque pas ; test unitaire dans tests/unit/seo/sitemap-checkout.test.ts
- [X] T036 Créer le script de démonstration scripts/seed-checkout.ts (prestataires, taux, politiques à paliers, écolodge, 3 expériences, 1 table, 2 transferts, 1 séjour signature `bookable`) + script `seed:checkout` dans package.json

> **Avancement de la phase 2 (infrastructure)** (2026-11-16) :
> - T028 : file Payload (`sendNotification`), route `/api/jobs/run` en GET (Vercel Cron envoie un
>   GET avec `Authorization: Bearer`), planifiée chaque minute dans vercel.json ; contrôle du secret
>   factorisé dans `src/lib/cronAuth.ts` et repris par les routes cron de la 001 ; migration
>   `jobs_queue`.
> - T031 : `/dev/fake-gateway` exclue du middleware (sinon 404 faute de langue) ; la page et son
>   action répondent 404 hors passerelle factice et en production (sauf `ALLOW_FAKE_GATEWAY=1`).
> - T032 : jeton `se_cart` de 128 bits, seule son empreinte SHA-256 est stockée
>   (`carts.tokenHash`, migration `cart_token`).
> - T033 : routes internes sous `/{langue}/tunnel/…` (réécriture du middleware, phase 1) plutôt
>   qu'un groupe `(checkout)` ; `force-dynamic` sur chaque page (le `generateStaticParams` du
>   layout [locale] l'emporterait), vérifié en E2E (cookie inconnu → « panier expiré ») ; pas de
>   `Referrer-Policy: no-referrer` : la politique globale `strict-origin-when-cross-origin` suffit
>   et garde le sélecteur de langue fonctionnel (décision de la phase 1). Formulaires des étapes :
>   US1.
> - T035 : les pages du tunnel ne sont pas des `RouteType` de la 001 ; garde explicite dans
>   `entriesForRoute` (`isTunnelPath`) au lieu de `NOINDEX_TYPES`.
> - T036 : `pnpm seed:checkout` idempotent, après `pnpm seed` (qui purge aussi transferts et
>   prestataires).

**Checkpoint** : `pnpm typecheck && pnpm lint && pnpm test` verts ; admin affiche les nouvelles
collections ; la passerelle `fake` répond.

---

## Phase 3: User Story 1 — Composer son week-end et le payer avec Wave en moins de 3 minutes (Priority: P1) 🎯 MVP

**Goal**: panier de quatre éléments payé en une opération par Wave, Orange Money ou carte ;
confirmation à l'écran, par e-mail et WhatsApp avec bon PDF ; confirmation de disponibilité par
l'équipe.

**Independent Test**: à 360 px en 3G simulée, depuis une fiche hébergement, panier de 4
éléments payé avec chacun des trois moyens (passerelle `fake`), confirmation + e-mail +
WhatsApp journalisé + PDF, en moins de 3 minutes, sans compte.

### Tests for User Story 1 ⚠️

- [X] T037 [P] [US1] E2E parcours complet Wave / Orange Money / carte, chronométré < 3 min, axe à chaque étape, sans compte, changement de langue en cours de parcours (panier, coordonnées et étape conservés) (`@checkout @us1`, projet android-360-3g) dans tests/e2e/checkout/us1-pay.mobile.spec.ts
- [X] T038 [P] [US1] E2E parité des moyens de paiement : même rang, boîtes englobantes égales (±1 px), ordre Wave / Orange Money / Carte, aucun présélectionné, à 360, 412 et 1280 px (`@parity`) dans tests/e2e/checkout/parity.spec.ts
- [X] T039 [P] [US1] E2E conditions d'annulation visibles et acceptation obligatoire avant le bouton « Payer » ; prix TTC FCFA et mention « ≈ € indicatif » à chaque étape (`@cancellation-visible`) dans tests/e2e/checkout/trust.spec.ts
- [X] T040 [P] [US1] E2E « ne revient pas sur le site » : notification seule ⇒ réservation `paid` et notifications parties ; « retour avant confirmation » ⇒ écran d'attente puis confirmation (`delayMs`) dans tests/e2e/checkout/us1-async.spec.ts
- [X] T041 [P] [US1] E2E tunnel complet sans JavaScript (projet nojs) : ajout, panier, coordonnées, paiement `fake`, confirmation dans tests/e2e/checkout/us1-nojs.spec.ts
- [X] T042 [P] [US1] E2E clavier du parcours complet sur desktop, focus jamais masqué par le résumé collant (`expectFocusNotObscured`) (`@keyboard`) dans tests/e2e/checkout/keyboard.spec.ts
- [X] T043 [P] [US1] E2E SEO du tunnel : `noindex` + `X-Robots-Tag` sur chaque page, absentes de `/sitemap.xml`, `title` et H1 uniques (`@seo`) dans tests/e2e/checkout/seo.spec.ts
- [X] T044 [P] [US1] Test d'intégration du traitement des notifications (signature invalide 401, doublon 200 sans effet, montant divergent ⇒ anomalie, transition vers état antérieur ignorée, commissions créées) dans tests/unit/payments/notify.test.ts

### Implementation for User Story 1

- [X] T045 [US1] Implémenter les Server Actions `addToCart`, `updateCartLine`, `removeCartLine` (schémas Zod du contrat, prix recalculés, conflit second hébergement avec remplacement, 303 sans JS) dans src/lib/cart/actions.ts
- [X] T046 [P] [US1] Créer le formulaire serveur « Ajouter au panier » à 360 px d'abord (dates, créneau, voyageurs ; `type="date"`, `inputmode="numeric"`) pour hébergement, séjour, expérience/table dans src/components/checkout/AddToCartForm.tsx et l'intégrer aux fiches 001 quand `bookable`
- [X] T047 [P] [US1] Créer le sélecteur de transfert (aller, retour, aller-retour ; AIBD ou Dakar ; heure ; passagers) dans src/components/checkout/TransferPicker.tsx
- [X] T048 [US1] Renommer l'îlot `AddToRequest` en src/components/client/AddToCart.tsx : migration unique de la « demande en cours » 001 vers le panier serveur (FR-006), puis suppression de la clé locale
- [X] T049 [P] [US1] Créer l'îlot src/components/client/CartBadge.tsx (< 1 Ko, lit `se_cart_summary`, espace réservé, CLS nul) et fusionner la barre collante 001 (« Panier · n · total » + WhatsApp) dans src/components/ui/StickyActionBar.tsx
- [X] T050 [US1] Créer la page panier à 360 px d'abord (lignes modifiables, erreurs FR-004 à côté de chaque ligne, transferts proposés, total, lien « Demander un devis à la place ») dans src/components/views/CartView.tsx
- [X] T051 [P] [US1] Créer le résumé collant dépliable natif `<details>` (nombre, total, détail par ligne, acompte éventuel ; `scroll-padding-bottom`) dans src/components/checkout/StickySummary.tsx
- [X] T052 [US1] Implémenter `submitContactDetails` (schéma Zod, pot de miel, limitation 10/h/IP, revalidation du panier, création idempotente de la `Booking` `awaiting_payment` avec lignes figées et `policySnapshot`) dans src/lib/booking/createBooking.ts et src/lib/cart/actions.ts
- [X] T053 [P] [US1] Créer l'étape coordonnées (prénom, nom, WhatsApp avec indicatif +221 par défaut, e-mail avec explication, demande particulière, deux consentements distincts non précochés, résumé d'erreurs `role="alert"`) dans src/components/checkout/ContactForm.tsx et src/components/views/CheckoutDetailsView.tsx
- [X] T054 [US1] Implémenter `startPayment` (accès, refus si paiement en attente, `price_changed`, montant serveur, `Payment` + `idempotencyKey`, `gateway.createCheckout`, 303 vers la page hébergée) dans src/lib/payments/startPayment.ts
- [X] T055 [P] [US1] Créer l'étape paiement : src/components/checkout/PaymentMethods.tsx (radios natifs, même composant, ≥ 44 px, ordre stable), src/components/checkout/CancellationTerms.tsx (conditions par ligne + case d'acceptation), bouton « Payer {montant} » désactivé après envoi, dans src/components/views/CheckoutPaymentView.tsx
- [X] T056 [US1] Implémenter le point d'entrée src/app/api/payments/notify/[gateway]/route.ts et src/lib/payments/notify.ts selon le contrat (signature, journal, verrou, vérification du montant, transitions, commissions, `availabilityDeadline`, programmation des tâches, `carts.status = checked_out`) jusqu'à faire passer T044
- [X] T057 [P] [US1] Créer la route src/app/api/payments/status/[paymentId]/route.ts et l'îlot src/components/client/PaymentStatusPoller.tsx (< 2 Ko, interrogation 3 s, arrêt à 10 min, `aria-live="polite"`) ; page statut src/components/views/CheckoutStatusView.tsx
- [X] T058 [US1] Créer le jeton de gestion (32 octets, haché SHA-256, révocable) dans src/lib/booking/manageToken.ts et la page confirmation / gestion src/components/views/BookingView.tsx (référence, statuts paiement et disponibilité, récapitulatif identique FR-010, bouton PDF, retrait du jeton de l'URL)
- [X] T059 [P] [US1] Écrire les tests du bon PDF (sections FR et EN par extraction de texte, montants, conditions figées, NAP de `siteSettings`, poids < 300 Ko) dans tests/unit/voucher/voucher.test.ts
- [X] T060 [US1] Implémenter le gabarit src/lib/voucher/Voucher.tsx (`@react-pdf/renderer`, polices embarquées, une colonne, ≥ 11 pt), src/lib/voucher/render.ts, la tâche src/jobs/generateVoucher.ts (bucket privé, version) et la route src/app/api/bookings/[ref]/voucher/route.ts jusqu'à faire passer T059
- [X] T061 [P] [US1] Créer les modèles `booking_confirmed` (e-mail HTML + paramètres du modèle WhatsApp, FR/EN) dans src/lib/notifications/templates/bookingConfirmed.ts et les notifications équipe et prestataires (FR-025) dans src/lib/notifications/templates/internal.ts
- [X] T062 [US1] Ajouter dans l'admin la confirmation de disponibilité par ligne (`confirmed` / `unavailable` / `replaced` + note) pour le rôle `operations`, avec envoi de `availability_update` et régénération du PDF quand tout est confirmé, dans src/collections/Bookings.ts (composant d'admin src/components/admin/AvailabilityPanel.tsx)
- [X] T063 [P] [US1] Créer la tâche src/jobs/availabilitySlaAlert.ts (échéance 2 h en heures ouvrées Africa/Dakar, sinon 10 h le lendemain) et son test de calcul d'échéance dans tests/unit/checkout/availabilityDeadline.test.ts
- [X] T064 [P] [US1] Créer la route src/app/api/whatsapp/webhook/route.ts (vérification du jeton, signature `X-Hub-Signature-256`, mise à jour des statuts de livraison dans `notifications`)
- [X] T064b [P] [US1] Créer le module commun src/lib/analytics.ts (Plausible sans cookie, script en idle, évènements typés), que la phase 10 de la 001 réutilise au lieu de le recréer, et src/lib/analytics/server.ts (API Events)
- [X] T065 [P] [US1] Émettre `cart_item_added`, `cart_view`, `checkout_details_view`, `checkout_payment_view` (client) et `payment_started`, `payment_succeeded`, `payment_failed`, `checkout_completed` avec la durée en secondes depuis le premier `cart_item_added` (temps médian FR-040) (serveur) via les modules de T064b

> **Avancement de l'US1** (2026-11-18) :
> - Ajout au panier (T045, T046) : après « Ajouter au panier », le visiteur arrive sur le panier
>   (et non sur la fiche) ; le panier propose les expériences de la destination et le transfert,
>   ce qui sert l'objectif des 3 minutes ; la fiche reste statique. Erreurs affichées au panier.
> - T048 : la « demande en cours » 001 est reprise par un îlot du panier (`RequestMigration`) et
>   l'action `migrateRequestDraft` ; l'îlot `AddToRequest` reste pour les offres non vendables.
> - T052 : la réservation `awaiting_payment` est créée à l'étape coordonnées (prix et conditions
>   figés), idempotente par `(panier, version)` ; le formulaire utilise `useActionState` (comme la
>   001), aucune donnée personnelle dans les URL.
> - T055 : avec acompte possible, deux boutons portent chacun leur montant (« Payer l'acompte de… »,
>   « Payer le total de… ») : montant visible sans JavaScript.
> - T056 : pas de verrou SQL explicite ; idempotence par l'unicité de `gatewayEventId` et la machine
>   à états (`processNotification`, testé en mémoire). Les effets du succès (commissions, jeton de
>   gestion, file d'envoi) s'exécutent dans la requête de notification : à déplacer dans la file si
>   la réponse dépasse 2 s chez l'agrégateur réel.
> - T058 : accès à la réservation par le cookie du panier (même appareil) ou par le jeton de gestion
>   créé au paiement (lien des messages) ; jeton retiré de l'URL visible (`StripQueryParam`).
> - T060 : bon PDF rendu à la demande (route sécurisée et pièce jointe de l'e-mail) plutôt que stocké
>   dans un bucket privé ; polices PDF standard (Helvetica) au lieu de polices embarquées.
> - T062 : pas de panneau d'admin dédié ; le statut de disponibilité des lignes se modifie dans la
>   fiche réservation, un crochet prévient le voyageur et incrémente la version du bon.
> - T063 : contrôle de l'échéance exécuté à chaque passage de `/api/jobs/run`.
> - T064b : `src/lib/analytics.ts` existait (phase 10 de la 001) ; ajout de `src/lib/analyticsServer.ts`.
> - Cookie `se_cart` : `Secure` seulement si le site est en HTTPS (WebKit refuse un cookie `Secure`
>   sur http://localhost).
> - Seed : `seed:checkout` ne rend jamais vendables les fiches de référence des tests de la 001
>   (`week-end-bolong-ndangane`, `excursion-pirogue-bolongs`) ; il crée le panier de démonstration de
>   Lighthouse CI. CI : `pnpm seed && pnpm seed:checkout`, passerelle `fake`, `CRON_SECRET`.

**Checkpoint** : T037 à T044 verts ; `pnpm lhci` et `pnpm bundles` dans les budgets sur les
routes du tunnel ; MVP démontrable.

---

## Phase 4: User Story 2 — Payer un acompte maintenant et le solde plus tard (Priority: P2)

**Goal**: choix acompte / total selon l'éligibilité ; rappels et paiement du solde depuis un
lien, sans compte.

**Independent Test**: panier à J+45, acompte payé, échéance déclenchée, solde payé depuis le
lien ; montants, statuts et deux versions du PDF corrects.

### Tests for User Story 2 ⚠️

- [ ] T066 [P] [US2] E2E acompte proposé à J+45, absent à J+20 avec raison, refusé pour un séjour `requireFullPayment` ; paiement du solde depuis le lien (`@checkout @us2`) dans tests/e2e/checkout/us2-deposit.mobile.spec.ts
- [ ] T067 [P] [US2] Tests du planificateur de rappels (J-21, J-15, alerte à l'échéance, aucun rappel si soldé ou annulé) dans tests/unit/checkout/balanceSchedule.test.ts

### Implementation for User Story 2

- [ ] T068 [US2] Ajouter le choix acompte / total (montant de l'acompte, solde et date limite affichés ; raison si non éligible) à src/components/views/CheckoutPaymentView.tsx et la validation `plan` à src/lib/payments/startPayment.ts
- [ ] T069 [US2] Gérer les transitions `deposit_paid` → `paid` et le `purpose: balance` dans src/lib/payments/notify.ts (commissions reconnues au prorata, PDF régénéré, `balance_paid`)
- [ ] T070 [P] [US2] Créer la page de paiement du solde src/components/views/BookingBalanceView.tsx (jeton requis, mêmes composants de paiement et de parité)
- [ ] T071 [P] [US2] Créer la tâche src/jobs/balanceReminder.ts (J-21, J-15, alerte équipe et dernier rappel à l'échéance, sans annulation automatique) jusqu'à faire passer T067
- [ ] T072 [P] [US2] Créer les modèles `balance_due` et `balance_paid` (FR/EN, e-mail + WhatsApp) dans src/lib/notifications/templates/balance.ts

**Checkpoint** : T066 et T067 verts ; US1 toujours verte.

---

## Phase 5: User Story 3 — Reprendre un paiement échoué ou abandonné (Priority: P3)

**Goal**: échec expliqué et réessai immédiat ; relances consenties à 1 h et 24 h ; reprise
sans double débit.

**Independent Test**: refus « solde insuffisant » → message + réessai ; abandon après
coordonnées → relance → reprise depuis le lien → paiement ; double appui sans double débit.

### Tests for User Story 3 ⚠️

- [ ] T073 [P] [US3] E2E échec (chaque cause) → message clair, panier intact, réessai ou autre moyen en un geste ; double appui et seconde tentative pendant `pending` refusés (`@checkout @us3`) dans tests/e2e/checkout/us3-failure.mobile.spec.ts
- [ ] T074 [P] [US3] E2E abandon → relance journalisée → lien de reprise → changement de prix signalé → paiement ; désinscription en un geste dans tests/e2e/checkout/us3-reminder.spec.ts
- [ ] T075 [P] [US3] Tests de la réconciliation (pending > 10 min interrogé toutes les 5 min pendant 24 h, `expired` à 30 min sans nouvelle, aucune double transition) dans tests/unit/payments/reconcile.test.ts

### Implementation for User Story 3

- [ ] T076 [US3] Afficher les causes d'échec (`declined`, `insufficient_funds`, `timeout`, `cancelled_by_user`, `technical`) et les actions « Réessayer » / « Changer de moyen » dans src/components/views/CheckoutStatusView.tsx
- [ ] T077 [P] [US3] Créer la tâche src/jobs/reconcilePendingPayments.ts (appel `gateway.getStatus`, mêmes transitions que notify) jusqu'à faire passer T075
- [ ] T078 [P] [US3] Créer la tâche src/jobs/abandonedCartReminder.ts (consentement requis, 1 h et 24 h, au plus deux, annulation si payé) et les modèles `payment_failed_reminder` dans src/lib/notifications/templates/reminder.ts
- [ ] T079 [US3] Créer la reprise src/components/views/CartResumeView.tsx (jeton de relance 7 j, restauration du panier, signalement des changements de prix ou de disponibilité, redirection vers le paiement) et l'action `unsubscribeReminders` dans src/lib/cart/actions.ts
- [ ] T080 [P] [US3] Ajouter dans l'admin la vue des paniers abandonnés et paiements échoués (contenu, montant, cause, relances) avec action « Renvoyer un lien de paiement » (FR-032) dans src/components/admin/AbandonedCarts.tsx
- [ ] T081 [P] [US3] Émettre `payment_recovered` (canal, rang) dans src/lib/analytics/server.ts

**Checkpoint** : T073 à T075 verts ; US1 et US2 toujours vertes.

---

## Phase 6: User Story 4 — Annuler et suivre son remboursement (Priority: P4)

**Goal**: accès sans compte par lien, montant remboursable calculé avant confirmation,
remboursement suivi jusqu'au versement sur le moyen d'origine.

**Independent Test**: annulation à J-40, J-20 et J-5 sur une réservation payée ; montants
calculés, statuts successifs, notifications, remboursement `fake` ou manuel enregistré.

### Tests for User Story 4 ⚠️

- [ ] T082 [P] [US4] E2E lien de gestion, annulation à J-40 (100 %), J-20 (50 %), J-5 (0 %), annulation partielle d'une ligne, statuts `requested` → `approved` → `paid` visibles (`@checkout @us4`) dans tests/e2e/checkout/us4-cancel.mobile.spec.ts
- [ ] T083 [P] [US4] E2E « Retrouver ma réservation » : réponse identique que la paire existe ou non ; limitation 5/h/IP ; jeton invalide ⇒ page « lien invalide » sans fuite d'information dans tests/e2e/checkout/us4-find.spec.ts
- [ ] T084 [P] [US4] Tests du workflow de remboursement (montant ≥ calculé sauf motif, justification obligatoire si autre moyen, échéance 14 j et alerte J+10, ajustements de commission) dans tests/unit/booking/refunds.test.ts

### Implementation for User Story 4

- [ ] T085 [US4] Créer la page d'annulation src/components/views/BookingCancelView.tsx (montant remboursable par ligne à la date du jour) et l'action `requestCancellation` dans src/lib/booking/cancellation.ts
- [ ] T086 [US4] Implémenter le workflow `refunds` (approbation `finance`, appel `gateway.refund` ou enregistrement manuel justifié, `commissionEntries` d'ajustement, statut réservation) dans src/lib/booking/refunds.ts jusqu'à faire passer T084
- [ ] T087 [P] [US4] Créer la page « Retrouver ma réservation » src/components/views/BookingFindView.tsx et l'action `resendManageLink` (limitation 5/h/IP) dans src/lib/booking/manageToken.ts
- [ ] T088 [P] [US4] Créer les modèles `cancellation_received`, `refund_status`, `manage_link` dans src/lib/notifications/templates/refund.ts et la tâche d'alerte J+10 dans src/jobs/refundDeadlineAlert.ts
- [ ] T089 [P] [US4] Gérer une ligne `unavailable` (FR-005, FR-030) dans src/lib/booking/availability.ts : au plus 2 alternatives proposées par l'équipe, jamais de supplément, écart en faveur du voyageur remboursé, choix sous 48 h sinon remboursement intégral automatique ; tests dans tests/unit/booking/availability.test.ts
- [ ] T090 [P] [US4] Émettre `cancellation_requested` dans src/lib/analytics/server.ts

**Checkpoint** : T082 à T084 verts ; US1 à US3 toujours vertes.

---

## Phase 7: User Story 5 — L'équipe suit les ventes, les commissions et les reversements (Priority: P5)

**Goal**: commission par ligne visible, relevé par prestataire et période, reversements
enregistrés, export tableur.

**Independent Test**: réservations mêlant les cinq types d'offre et plusieurs prestataires,
dont une partiellement remboursée ; relevés et totaux égaux au calcul manuel.

### Tests for User Story 5 ⚠️

- [ ] T091 [P] [US5] Tests du relevé (somme des écritures de la période − reversements, motif `partner`, changement de taux sans effet rétroactif, export CSV `;` UTF-8 avec BOM) dans tests/unit/checkout/statement.test.ts
- [ ] T092 [P] [US5] E2E desktop admin `finance` : relevé d'un prestataire, enregistrement d'un reversement, export ; rôle `operations` sans accès aux montants à reverser dans tests/e2e/checkout/us5-statement.desktop.spec.ts

### Implementation for User Story 5

- [ ] T093 [US5] Implémenter le calcul de relevé dans src/lib/checkout/statement.ts jusqu'à faire passer T091
- [ ] T094 [P] [US5] Afficher par ligne le prestataire, le taux, la commission et la part dans la vue d'une réservation (admin) via src/components/admin/BookingLinesFinance.tsx
- [ ] T095 [US5] Créer la vue admin « Relevés prestataires » (période, totaux, reversements) dans src/components/admin/PartnerStatement.tsx et la route d'export CSV src/app/api/admin/statements/[partnerId]/route.ts (rôle `finance`/`admin`)
- [ ] T096 [P] [US5] Ajouter l'historique des taux et la règle « taux figé au paiement » visibles dans l'admin de src/globals/CommissionRates.ts (description, aide contextuelle)

**Checkpoint** : T091 et T092 verts ; toutes les stories vertes.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T098 Implémenter la passerelle retenue dans src/lib/payments/<agrégateur>.ts (fetch, sans SDK) et la faire passer par tests/unit/payments/gateway.contract.test.ts avec des réponses enregistrées
- [ ] T099 [P] Soumettre et versionner les modèles WhatsApp FR/EN (`booking_confirmed`, `availability_update`, `balance_due`, `payment_failed_reminder`, `refund_status`) dans docs/whatsapp-templates.md
- [ ] T100 [P] Créer la tâche quotidienne src/jobs/purgeCarts.ts (paniers non payés > 30 j) et le passage automatique `completed` après la date de départ dans src/jobs/completeBookings.ts
- [ ] T101 [P] Ajouter au bloc « Registre des traitements » de la page Confidentialité (livré par la 001, phase 7) les traitements paiement, prestataires et WhatsApp et le cookie `se_cart` (finalité, base légale, durée, destinataires, transferts hors du Sénégal), dans src/seed/pages.ts et le CMS
- [ ] T102 [P] Ajouter à .github/pull_request_template.md les points non automatisables du tunnel (parité des moyens, conditions d'annulation, absence de donnée de carte, modèles WhatsApp approuvés)
- [ ] T103 Revue de sécurité bloquante de l'intégration de paiement (principe IX, research R16) : signatures, montants, accès, jetons, journal, secrets ; rapport dans docs/security-review-002.md
- [ ] T104 [P] Test 3G complet du tunnel avec la passerelle réelle en préproduction et vérification des budgets (`pnpm lhci`, `pnpm bundles`) ; corriger tout dépassement avant fusion
- [ ] T105 Test utilisateur à 360 px avec 10 testeurs (SC-001 : 9 sur 10 en moins de 3 min) ; résultats dans specs/002-panier-paiement/checklists/usability.md
- [ ] T106 [P] Configurer les objectifs Plausible de l'entonnoir (FR-040) et documenter les indicateurs dans docs/analytics.md
- [ ] T107 Exécuter les scénarios du quickstart.md de bout en bout et corriger les écarts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Prérequis externe** : 001 phases 2B à 8 (T001) ; D-T12 et D-T17 approuvées (2026-11-15).
- **T097** (choix de l'agrégateur) démarre dès la phase 1 ; T098 attend la décision du
  propriétaire.
- **Setup (Phase 1)** → **Foundational (Phase 2)** → stories.
- **US1 (P1)** : dépend de la phase 2 uniquement.
- **US2 (P2)** : dépend de US1 (étape paiement, notify).
- **US3 (P3)** : dépend de US1 (statut, startPayment).
- **US4 (P4)** : dépend de US1 (lien de gestion) ; indépendante de US2 et US3.
- **US5 (P5)** : dépend des écritures de commission créées en US1 (T056) ; les ajustements de
  remboursement viennent de US4 (T086) mais le relevé est testable sans.
- **Polish** : T098 dès la décision de T097 (en parallèle des stories) ; T103–T105 après toutes
  les stories.

### Within Each User Story

Tests (échouent) → logique serveur → composants et pages → notifications → mesure.

### Parallel Opportunities

- Phase 1 : T003 à T008 en parallèle.
- Phase 2 : T009–T013 (tests) en parallèle ; puis T015, T016 en parallèle de T014 ; T017–T019,
  T021, T022, T024–T026 en parallèle ; T029, T030, T032, T034, T035 en parallèle.
- US1 : T037–T044 en parallèle ; T046, T047, T049, T051 en parallèle après T045.
- US2, US3, US4 peuvent avancer en parallèle après US1 si l'équipe le permet.

## Parallel Example: User Story 1

```text
# Tests d'abord, ensemble :
T037 us1-pay.mobile.spec.ts   T038 parity.spec.ts   T039 trust.spec.ts   T040 us1-async.spec.ts
T041 us1-nojs.spec.ts         T042 keyboard.spec.ts T043 seo.spec.ts     T044 notify.test.ts

# Puis composants indépendants après T045 :
T046 AddToCartForm.tsx   T047 TransferPicker.tsx   T049 CartBadge + StickyActionBar   T051 StickySummary.tsx
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phases 1 et 2 (avec la passerelle `fake`).
2. Phase 3 (US1) : paiement total uniquement.
3. **Arrêt et validation** : T037 à T044, LHCI et budgets ; démonstration.
4. En parallèle : T097–T098 (agrégateur réel) pour pouvoir ouvrir au public.

### Incremental Delivery

US1 (vente payée) → US2 (acompte) → US3 (récupération des échecs) → US4 (annulation,
condition de confiance avant ouverture large) → US5 (relevés). **Ouverture au public
recommandée après US4 et T103** (revue de sécurité), les annulations devant être tenues dès la
première vente.

### Notes

- `[P]` = fichiers différents, aucune dépendance inachevée.
- Construire chaque composant à 360 px d'abord, puis élargir (`min-width` uniquement).
- Aucune dépendance hors plan sans accord du propriétaire.
- Committer après chaque tâche ou groupe logique ; vérifier que les tests échouent avant
  d'implémenter.
