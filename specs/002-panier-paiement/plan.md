# Implementation Plan: Panier unique et paiement en ligne

**Branch**: `002-panier-paiement` | **Date**: 2026-11-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-panier-paiement/spec.md`

**Note** : pour la disponibilité (FR-005), le plan retient l'option B, **confirmée par le
propriétaire le 2026-11-15** (research R1, tension T11).
Le choix de l'agrégateur de paiement est **[à valider commercialement]** (R2) ; le code est
isolé derrière l'interface `PaymentGateway` et développé contre une passerelle `fake`.

## Summary

Le visiteur compose un panier unique (au plus un hébergement ou un séjour signature, des
expériences, des tables, un transfert AIBD/Dakar), saisit ses coordonnées et paie **en une
seule opération** par Wave, Orange Money ou carte, présentés au même rang. Le panier est
**côté serveur** (cookie `se_cart`), manipulé par des **formulaires + Server Actions** qui
marchent sans JavaScript ; les pages publiques de la 001 restent statiques. Le paiement passe
par la **page hébergée** d'un agrégateur sénégalais ; la **notification serveur signée** fait
foi, traitée de façon idempotente sous contrainte d'unicité Postgres (aucun double débit).
Après paiement : réservation, commissions par prestataire (10–25 % selon le type d'offre),
bon PDF généré côté serveur, confirmation par e-mail (Resend) et WhatsApp (API Cloud de Meta),
confirmation de disponibilité par l'équipe sous 2 h. Acompte (30 % si arrivée à plus de
30 jours), relances, annulation avec montant calculé et suivi des remboursements passent par
la file de tâches de Payload. Toutes les pages du tunnel sont `noindex`, hors sitemap, et
tenues aux budgets Performance, Accessibilité et Bonnes pratiques.

## Technical Context

**Language/Version**: TypeScript 5.x (`strict`, `noUncheckedIndexedAccess`), Node.js 22 LTS
(inchangé)
**Primary Dependencies**: celles de la 001 (Next.js 15, Payload CMS 3, next-intl, Tailwind v4,
Zod, Resend, schema-dts) **+ `@react-pdf/renderer`** (bon PDF, serveur uniquement — dérogation
**D-T17 approuvée le 2026-11-15**). Agrégateur de paiement et API WhatsApp
Cloud appelés en `fetch`, **sans SDK**. File de tâches : `jobs` de Payload 3 (inclus).
**Storage**: PostgreSQL 16 (nouvelles collections transactionnelles, index unique partiel sur
les paiements en attente) ; bons PDF dans le stockage objet S3-compatible, bucket **privé**
**Testing**: Vitest (prix, acompte, commissions, remboursements, paliers d'annulation, machines
à états, contrat `PaymentGateway`, PDF) ; Playwright `@checkout` sur android-360 (3G),
pixel-7, iphone-se, nojs, desktop (clavier) + axe à chaque étape et état ; Lighthouse CI sur
3 URL du tunnel (sans assertion SEO) ; `check-bundles`
**Target Platform**: navigateurs mobiles (Android milieu de gamme, iOS Safari 16+) puis
ordinateur ; hébergement Vercel `cdg1` en **offre Pro** (tâches planifiées chaque minute,
décision du propriétaire du 2026-11-15, tension T20)
**Project Type**: application web unique (extension du site 001)
**Performance Goals**: tunnel complet < 3 min à 360 px (SC-001) ; réponse des Server Actions
< 500 ms p95 hors appel à l'agrégateur ; notification de paiement traitée < 2 s ; confirmations
envoyées < 2 min (SC-003) ; CWV et Lighthouse du tunnel conformes à la constitution (hors SEO)
**Constraints**: aucune donnée de carte chez nous (PCI DSS délégué) ; montants XOF entiers,
recalculés côté serveur ; JS initial ≤ 150 Ko par route, îlots du tunnel ≤ 3 Ko au total ;
tunnel utilisable sans JS et en 3G ; pages publiques 001 restent SSG
**Scale/Scope**: quelques dizaines de réservations par semaine, pics le week-end ; 10 à 30
prestataires ; 9 pages de tunnel × 2 langues ; 5 modèles de notification × 2 canaux × 2 langues

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source : `.specify/memory/constitution.md` (Saloum Évasion v1.0.1).

- [x] **I. Mobile-first** : chaque étape conçue à 360 px d'abord (`min-width` seulement) ;
      résumé collant natif `<details>` fusionné avec la barre d'action de la 001 (R6) ;
      bouton « Payer » et navigation d'étape dans la zone du pouce ; cibles ≥ 44 px (test) ;
      claviers et `autocomplete` définis dans [checkout-actions](./contracts/checkout-actions.md) ;
      parcours de réservation **et de paiement** complet en 3G simulée (`@checkout @us1`).
- [x] **II. Performance** : pages publiques inchangées (statiques, aucune lecture de cookie au
      rendu) ; tunnel en composants serveur, deux îlots seulement (`CartBadge` < 1 Ko,
      `PaymentStatusPoller` < 2 Ko) ; PDF et appels externes côté serveur ; LHCI sur 3 URL du
      tunnel avec Perf ≥ 95, A11y ≥ 95, BP = 100 ; `check-bundles` couvre les nouvelles routes.
      ⚠ **T14** : la page hébergée de l'agrégateur échappe à nos budgets.
- [x] **III. SEO** : tunnel et pages de réservation `noindex` + `X-Robots-Tag`, hors sitemap,
      non bloqués dans `robots.txt` (R15) ; fiches publiques inchangées côté SEO (le bloc
      « Ajouter au panier » est un formulaire rendu au serveur, sans contenu indexable en JS).
- [x] **IV. Accessibilité** : formulaires natifs, résumé d'erreurs, radios natifs pour les
      moyens de paiement, `<details>` natif ; axe à chaque étape et dans chaque état (erreur,
      en attente, échec, confirmation) ; **test E2E clavier du parcours de réservation**
      (`@keyboard`) ; focus jamais masqué par le résumé collant (WCAG 2.4.11) ; PDF contrasté.
- [x] **V. Confiance** : prix TTC FCFA + « ≈ € indicatif » à chaque étape, dans les messages et
      le PDF ; **conditions d'annulation affichées et acceptées avant le bouton de paiement**
      (`@cancellation-visible`) et figées dans la réservation (R8) ; statut `completed` posé
      pour la future éligibilité aux avis ; mention honnête « disponibilité en cours de
      confirmation » (R1).
- [x] **VI. Marché sénégalais** : XOF entiers partout (stockage, calcul, débit) ; Wave,
      Orange Money, carte au même rang, même composant, ordre stable, aucun présélectionné
      (`@parity`, SC-009) ; WhatsApp sur chaque étape et canal de confirmation.
- [x] **VII. Qualité** : TS strict sans `any` ; tests unitaires sur tarification, conversion,
      acompte, annulation, commissions ; E2E 360 px pour US1 à US4 ; LHCI et axe bloquants.
- [x] **VIII. Simplicité** : même application, même base ; file de tâches Payload (pas de
      service de file) ; un seul agrégateur ; pas de Redis (contraintes Postgres) ; **deux
      ajouts justifiés en Complexity Tracking** : API WhatsApp Cloud (D-T12) et
      `@react-pdf/renderer` (D-T17).
- [x] **IX. Données et sécurité** : page de paiement hébergée, aucune donnée de carte ;
      signatures HMAC vérifiées, montants revérifiés, journal immuable (R16) ; jetons de
      gestion hachés ; cookies strictement nécessaires (pas de consentement requis, documentés) ;
      consentement aux relances séparé et jamais précoché ; registre des traitements mis à jour
      (paiement, prestataires, WhatsApp) ; **revue de sécurité bloquante** avant production.

**Résultat (avant phase 0)** : PASS ; T11, T12 et T17 validés par le propriétaire le 2026-11-15.
**Résultat (après phase 1)** : PASS. Le design ne viole aucun principe ; D-T12 et D-T17 sont
approuvées ; T14 est un risque accepté et mesuré ; T19 (pages publiques statiques) et T20
(ordonnanceur) sont résolus.

## Tensions avec la constitution, la spec et la 001 (à arbitrer)

| # | Tension | Principe | Résolution proposée | Statut |
|---|---|---|---|---|
| **T11** | Spec FR-005 sans réponse du propriétaire | — | Option B (R1) ; `availabilityStatus` par ligne permet d'ajouter un calendrier plus tard sans refonte | Confirmée (2026-11-15) |
| **T12** | La 001 (R3) a écarté l'API WhatsApp Business ; la spec 002 exige une confirmation **reçue** par WhatsApp | VIII | API Cloud de Meta en direct, sans SDK ni intermédiaire, modèles approuvés ; repli e-mail + page (R10) ; dérogation **D-T12** | Approuvée (2026-11-15) |
| **T13** | Constitution « offre unifiée » : un séjour = une réservation, un paiement ; la 002 autorise un panier sans hébergement (excursion à la journée) | Contraintes produit | Pas de fragmentation : tout panier, même sans hébergement, se paie en une opération ; le formulaire de demande 001 reste pour le sur-mesure | Résolu |
| **T14** | Page de paiement hébergée par l'agrégateur : ni nos budgets ni notre contrôle d'accessibilité | II, IV | Critère de sélection (utilisable à 360 px, R2) ; test manuel au clavier et au lecteur d'écran dans la revue de sélection ; mesure du taux d'abandon sur la page hébergée (`payment_started` → `payment_succeeded`) | Risque accepté |
| **T15** | Deux éléments collants à 360 px (barre d'action 001 + résumé du panier) | I, IV | Fusion en une seule barre (R6) ; hauteur réservée ; `scroll-padding-bottom` | Résolu |
| **T16** | Afficher le panier sur des pages statiques sans les rendre dynamiques | II, III | Cookie lisible `se_cart_summary` + îlot < 1 Ko ; espace réservé, CLS nul | Résolu |
| **T17** | Génération PDF : aucune bibliothèque au plan 001 ; règle « aucune dépendance hors plan sans accord » | VIII | `@react-pdf/renderer` côté serveur uniquement (R9) ; dérogation **D-T17** | Approuvée (2026-11-15) |
| **T18** | La 002 dépend de la 001 : CMS (2B), US1 et **phase 8 (demande de séjour, îlot `AddToRequest`)** pour FR-006 et le lien « Demander un devis » | — | Phases 2B à 7 livrées ; la **phase 8 de la 001 est livrée avant la 002** (décision du 2026-11-15) ; T001 la vérifie | Séquencement |
| **T19** | Lire le cookie du panier dans le résolveur `[...segments]` rendrait dynamiques toutes les pages publiques | II, III | Tunnel dans des routes dédiées du groupe `(checkout)`, segments traduits réécrits par le middleware ; le résolveur ne lit jamais de cookie ; test « fiche toujours prérendue » | Résolu |
| **T20** | La file de tâches exige un déclenchement chaque minute ; l'offre gratuite de Vercel n'autorise qu'une tâche planifiée par jour | VIII | Offre Vercel Pro (aucun service en plus) ; couvre aussi T146 de la 001 | Décidé (2026-11-15) |

## Project Structure

### Documentation (this feature)

```text
specs/002-panier-paiement/
├── plan.md              # Ce fichier
├── research.md          # Phase 0 (R1 à R16)
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── routes-tunnel.md      # pages et routes serveur du tunnel, noindex, LHCI
│   ├── checkout-actions.md   # Server Actions + schémas Zod + accessibilité des formulaires
│   ├── payment-gateway.md    # interface PaymentGateway, traitement des notifications, fake
│   ├── notifications.md      # modèles e-mail / WhatsApp, bon PDF
│   └── analytics-events.md   # évènements de l'entonnoir
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

Ajouts à l'arborescence de la 001 :

```text
src/
├── app/
│   ├── (frontend)/[locale]/
│   │   ├── [...segments]/page.tsx        # inchangé : pages publiques statiques, AUCUNE lecture de cookie
│   │   └── (checkout)/                    # routes dynamiques du tunnel (seul endroit où le cookie est lu)
│   │       ├── layout.tsx                 # noindex, résumé collant, étapes, WhatsApp
│   │       ├── cart/page.tsx  checkout/[step]/page.tsx  booking/[ref]/[[...action]]/page.tsx
│   │       └── resume/page.tsx  find/page.tsx
│   ├── api/
│   │   ├── payments/notify/[gateway]/route.ts
│   │   ├── payments/status/[paymentId]/route.ts
│   │   ├── bookings/[ref]/voucher/route.ts
│   │   ├── jobs/run/route.ts
│   │   └── whatsapp/webhook/route.ts
│   └── dev/fake-gateway/page.tsx          # hors production uniquement
├── collections/                           # + partners, transfers, carts, bookings, payments,
│                                          #   paymentEvents, refunds, commissionEntries, payouts,
│                                          #   reminders, notifications
├── globals/                               # + commissionRates ; siteSettings.checkout
├── jobs/                                  # sendNotification, generateVoucher, reconcilePendingPayments,
│                                          # abandonedCartReminder, balanceReminder, availabilitySlaAlert, purgeCarts
├── lib/
│   ├── checkout/                          # pur, sans dépendance : pricing.ts, deposit.ts, commission.ts,
│   │                                      # cancellation.ts, validateCart.ts, reference.ts, stateMachines.ts
│   ├── cart/                              # cookies.ts, actions.ts (Server Actions), repository.ts
│   ├── payments/                          # gateway.ts (type), fake.ts, <agrégateur>.ts, notify.ts, startPayment.ts
│   ├── notifications/                     # email.ts (Resend), whatsapp.ts (API Cloud), templates/*
│   ├── voucher/                           # Voucher.tsx (@react-pdf/renderer), render.ts
│   └── booking/                           # manageToken.ts, cancellation.ts, refunds.ts
├── components/
│   ├── checkout/                          # serveur : CartLines, StickySummary (<details>), StepNav,
│   │                                      # PaymentMethods (radios), CancellationTerms, ContactForm
│   └── client/                            # + CartBadge (<1 Ko), PaymentStatusPoller (<2 Ko) ;
│                                          #   AddToRequest 001 → AddToCart (migration FR-006)
tests/
├── unit/checkout/                         # pricing, deposit, commission, cancellation, stateMachines
├── unit/payments/gateway.contract.test.ts
└── e2e/checkout/                          # @checkout @us1…@us4 @parity @keyboard @seo
scripts/seed-checkout.ts
```

**Structure Decision** : extension de l'application unique de la 001 (principe VIII). La
logique métier monétaire est isolée dans `src/lib/checkout/`, sans dépendance, pour être
testée unitairement de façon exhaustive (principe VII). Le tunnel est un groupe de routes
`(checkout)` avec son propre layout (noindex, résumé collant) et des routes internes en anglais ;
les segments traduits (`panier`/`cart`, `commande`/`checkout`, `reservation`/`booking`) sont
réécrits par `src/middleware.ts` vers ces routes, comme les segments renommés de la 001, et
construits par `buildPath`. Le résolveur `[...segments]` ne connaît pas le tunnel (tension T19).

## Approche par parcours (ordre de livraison)

0. **Prérequis 001** : phases 2B à 7 livrées, **phase 8 (demande de séjour) livrée avant la
   002** ; `cancellationPolicies.tiers`,
   `partners`, `transfers`, champs `bookable` et prix saisonniers des hébergements.
1. **Fondations 002** : module `lib/checkout` + tests ; collections transactionnelles ; file
   de tâches + route cron ; interface `PaymentGateway` + `fake` + suite de contrat ; layout du
   tunnel (noindex) ; LHCI et `check-bundles` étendus.
2. **US1 (P1)** : `addToCart` sur les fiches, panier, résumé collant fusionné, coordonnées,
   paiement (parité, conditions), notification serveur, confirmation, PDF, e-mail, WhatsApp,
   notifications équipe et prestataires, confirmation de disponibilité dans l'admin.
3. **US2 (P2)** : acompte, échéances du solde, page et paiement du solde, PDF mis à jour.
4. **US3 (P3)** : messages d'échec, réessai, réconciliation, relances d'abandon, reprise,
   désinscription, liste des paniers abandonnés dans l'admin.
5. **US4 (P4)** : lien de gestion, retrouver ma réservation, annulation, remboursements,
   notifications de statut.
6. **US5 (P5)** : écritures de commission, taux historisés, relevés par prestataire,
   reversements, export CSV, rôles `finance` / `operations`.
7. **Transverse** : sélection de l'agrégateur et intégration réelle, modèles WhatsApp
   approuvés, revue de sécurité, registre des traitements et confidentialité, mesure de
   l'entonnoir, test utilisateur des 3 minutes (SC-001).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| **D-T12** — Service externe supplémentaire : WhatsApp Business Platform (API Cloud de Meta), écarté par la 001 (principe VIII) | La spec 002 exige que le voyageur **reçoive** sa confirmation et son bon PDF par WhatsApp, canal principal de la clientèle (principe VI) | Lien `wa.me` : initié par le visiteur, ne délivre rien ; intermédiaire BSP (Twilio, 360dialog) : coût et sous-traitant de données en plus. **Portée** : notifications transactionnelles et relances consenties ; appels `fetch` sans SDK. **Repli** : e-mail + page de confirmation font foi. **Validation** : approuvée par le propriétaire en session le 2026-11-15 |
| **D-T17** — Nouvelle dépendance `@react-pdf/renderer` (hors plan 001) | Bon de réservation PDF exigé par la spec (FR-024), généré côté serveur | `pdf-lib` : mise en page manuelle, coût de développement × 3 ; Chromium sans tête : ~200 Mo, incompatible avec les fonctions serverless ; SaaS PDF : service et sous-traitant en plus. **Portée** : serveur uniquement, aucun octet côté client. **Validation** : approuvée par le propriétaire en session le 2026-11-15 (règle « aucune dépendance hors plan sans accord ») |
