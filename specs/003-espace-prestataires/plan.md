# Implementation Plan: Espace prestataires et disponibilités

**Branch**: `003-espace-prestataires` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-espace-prestataires/spec.md`

## Summary

Les prestataires (hébergeurs, piroguiers, loueurs de quads, restaurants, transporteurs) tiennent
eux-mêmes leurs disponibilités, demandent leurs changements de prix, voient leurs réservations et
leurs reversements dans un **espace web en français** sous `/espace`, conçu pour un téléphone de
360 px et des personnes peu à l'aise avec l'informatique. Connexion **sans mot de passe** par code
WhatsApp (même API que la 002). Les disponibilités vivent dans un **stock daté unique**
(`inventory`) avec **rétention atomique** pendant le paiement : la réservation devient
**instantanée** (confirmation automatique, clarification de la spec) et la double réservation entre
voyageurs Saloum Évasion impossible. Les unités louables sont **synchronisées en iCal** avec Airbnb
et Booking toutes les 15 minutes (analyseur maison, sans dépendance). Les pages publiques restent
**statiques** : un îlot interroge une API de disponibilité mise en cache 30 s, et le serveur
revérifie toujours. Les restaurants peuvent acheter au forfait (payé hors du site) une **mise en
avant** signalée « Partenaire mis en avant », rendue avec la page statique et mesurée sans cookie.

## Technical Context

**Language/Version**: TypeScript 5.x (`strict`, `noUncheckedIndexedAccess`), Node.js 22 LTS
(inchangé)
**Primary Dependencies**: celles de la 001 et de la 002, **sans aucune bibliothèque ajoutée** :
iCal lu et écrit par un module maison (R6), codes de connexion par l'API WhatsApp Cloud déjà
approuvée (D-T12), mesure des mises en avant dans Postgres (R12). **Un service externe ajouté** :
fournisseur SMS pour le repli de connexion, appelé en `fetch` sans SDK (R15, dérogation **D-T21**)
**Storage**: PostgreSQL 16 : collections `partnerMembers`, `partnerSessions`, `loginCodes`,
`rentalUnits`, `inventory` (contrainte unique et `CHECK`), `inventoryHolds`, `externalCalendars`,
`availabilityChanges`, `priceChangeRequests`, `sponsoredPlacements`, `sponsoredStats` ; mises à jour
conditionnelles en SQL dans des transactions (R2)
**Testing**: Vitest (disponibilité restante, semaine type, délai minimum, attribution d'unités,
séjours par composants, véhicules, analyse et génération iCal, protection SSRF, statut des mises en
avant, sessions et codes) ; tests d'intégration sur base de test (rétentions concurrentes) ;
Playwright `@partner` (android-360 en 3G, pixel-7, iphone-se, desktop clavier), `@availability`,
`@sponsored` + axe sur chaque page et état ; Lighthouse CI : pages publiques inchangées (budgets),
2 URL de l'espace sans assertion SEO
**Target Platform**: navigateurs mobiles Android d'entrée et de milieu de gamme (prestataires),
iOS Safari 16+ ; Vercel `cdg1` offre Pro (tâches chaque minute, 002)
**Project Type**: application web unique (extension du site 001/002)
**Performance Goals**: modification de calendrier visible sur le site public < 1 min (FR-011,
cache 30 s) ; Server Actions de l'espace < 500 ms p95 ; notification de réservation au prestataire
< 2 min (SC-005) ; import iCal toutes les 15 min (objectif 30 min, SC-004)
**Constraints**: espace utilisable sans JavaScript et en 3G ; îlots de l'espace ≤ 6 Ko gz au total,
îlot de disponibilité publique < 4 Ko gz ; aucune donnée personnelle dans les flux iCal ni dans les
mesures ; pages publiques toujours statiques ; montants XOF entiers ; Airbnb et Booking relisent
notre flux à leur rythme (hors de notre contrôle)
**Scale/Scope**: 30 à 60 prestataires, 1 à 3 personnes chacun ; 100 unités louables et créneaux
au plus ; quelques milliers de lignes d'inventaire par an ; ~13 pages d'espace ; 9 modèles WhatsApp

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source : `.specify/memory/constitution.md` (Saloum Évasion v1.0.1).

- [x] **I. Mobile-first** : espace conçu à 360 px d'abord (`min-width` seulement), cibles ≥ 48 px
      (au-delà des 44 px exigés), action principale dans la zone du pouce, `type="tel"` et
      `autocomplete="one-time-code"`, parcours complet en 3G simulée (`@partner`). ⚠ **T22** : la
      barre collante « Réserver / WhatsApp » des pages publiques n'a pas de sens dans l'espace ;
      elle y est remplacée par le bouton « Aide » (WhatsApp de l'équipe) sur chaque écran.
- [x] **II. Performance** : pages publiques inchangées (SSG) ; l'îlot de disponibilité n'est
      chargé qu'au contact du formulaire et ne touche pas le LCP ; carte de mise en avant rendue
      au serveur, image différée, espace réservé (CLS nul) ; espace en composants serveur, trois
      îlots ; `check-bundles` étendu aux routes `/espace`.
- [x] **III. SEO** : `/espace/*` en `noindex` + `X-Robots-Tag`, hors sitemap, non bloqué dans
      `robots.txt` (R14) ; fiches publiques inchangées et indexables ; API de disponibilité et
      flux iCal sous `/api` (déjà bloqué) ; mises en avant en `rel="sponsored"`, absentes du JSON-LD.
- [x] **IV. Accessibilité** : formulaires natifs, résumé d'erreurs, états par couleur **et** mot,
      confirmation rédigée, zoom 200 % sans défilement horizontal, axe à chaque page et état,
      parcours clavier `@keyboard` ; mention de mise en avant restituée aux lecteurs d'écran.
- [x] **V. Confiance** : « Partenaire mis en avant » toujours visible, jamais confondu avec la
      sélection éditoriale ni avec des avis (tension **T24** résolue) ; disponibilités réelles,
      confirmation honnête (« Confirmé » seulement quand le stock a été retenu) ; photos réelles des
      offres reprises telles quelles dans les cartes.
- [x] **VI. Marché sénégalais** : WhatsApp comme canal de connexion et de notification ; montants
      FCFA entiers en grands chiffres ; sobriété (aucune requête de disponibilité avant
      interaction, pages légères pour l'espace).
- [x] **VII. Qualité** : TS strict, aucun `any` ; logique de disponibilité et d'iCal dans des
      modules purs testés ; tests d'intégration de concurrence ; E2E 360 px pour US1 à US5 ; LHCI et
      axe bloquants.
- [x] **VIII. Simplicité** : même application, même base ; aucune bibliothèque ajoutée (iCal
      maison, WhatsApp déjà retenu, compteurs Postgres) ; **un service ajouté, justifié en
      Complexity Tracking** : fournisseur SMS du repli de connexion (D-T21) ; pas d'application
      installable.
- [x] **IX. Données et sécurité** : codes et jetons hachés, sessions révocables, limitation de
      débit ; données du voyageur minimales et masquées 30 jours après la prestation ; flux iCal sans
      donnée personnelle ; protection SSRF à l'import ; mesures sans cookie ni identifiant ; registre
      des traitements complété (prestataires, connexion WhatsApp) ; **revue de sécurité bloquante**
      avant production (authentification de l'espace, import iCal).

**Résultat (avant phase 0)** : PASS, sous réserve des tensions T21 à T27 ci-dessous.
**Résultat (après phase 1)** : PASS. Une dérogation justifiée et approuvée (D-T21, SMS).

## Tensions avec la constitution, la spec et les versions précédentes (à arbitrer)

| # | Tension | Principe | Résolution proposée | Statut |
|---|---|---|---|---|
| **T21** | La spec prévoit un repli SMS pour le code de connexion ; un fournisseur SMS est un service en plus | VIII | **Repli SMS** retenu par le propriétaire (dérogation **D-T21**, R1 et R15) ; lien de l'équipe en dernier recours | Décidé (2026-11-16) |
| **T22** | Barre collante « Réserver / WhatsApp » | I | Non applicable : la constitution la limite aux pages séjour, expérience, hébergement et destination ; l'espace a un bouton « Aide » sur chaque écran | Résolu |
| **T23** | Disponibilité à la minute sur des pages statiques | II, III | Îlot + `GET /api/availability` mis en cache 30 s ; revérification serveur à l'ajout et au paiement (R7) | Résolu |
| **T24** | Contenu payant sur un site dont la promesse est l'authenticité | V | Mention textuelle visible, `rel="sponsored"`, emplacement distinct, une par page, jamais dans le JSON-LD ni dans l'ordre éditorial (R12) | Résolu |
| **T25** | Bilinguisme FR/EN de la constitution | Contraintes produit | Il porte sur le site public ; l'espace prestataires (non public) est en français, décision de la spec ; les mises en avant restent bilingues | Résolu |
| **T26** | Calendrier iCal : bibliothèque ou code maison | VIII | Analyseur et générateur maison (~150 lignes, sous-ensemble utile), tests sur flux réels anonymisés (R6) | Résolu |
| **T27** | La 002 confirme la disponibilité à la main (FR-005, option B) ; la 003 la rend automatique | — | Bascule **par prestataire** (`spaceActive`) : les autres restent en confirmation manuelle (FR-014) ; `availabilityStatus` de la 002 réutilisé | Résolu |
| **T28** | Coût des messages WhatsApp d'authentification (facturés par message) | VI | Session de 30 jours glissants : une connexion par mois et par téléphone en régime normal ; coût à suivre dans le registre des envois | Risque accepté |
| **T29** | La 003 dépend de la 002 (paiements, réservations, `partners`, notifications), pas encore fusionnée | — | Branche `003` créée depuis `002` ; US1 à US3 et US5 de la 003 exigent l'US1 de la 002 ; l'US4 (« Mes paiements ») exige aussi l'US5 de la 002 (relevé) ; décision du 2026-11-16 : terminer l'US1 de la 002 avant toute implémentation de la 003 | Séquencement |

## Project Structure

### Documentation (this feature)

```text
specs/003-espace-prestataires/
├── plan.md              # Ce fichier
├── research.md          # Phase 0 : décisions R1 à R14
├── data-model.md        # Phase 1 : collections et modifications
├── quickstart.md        # Phase 1 : démonstration locale
├── contracts/
│   ├── partner-space.md          # routes et Server Actions de l'espace
│   ├── availability.md           # calcul, rétention, API publique
│   ├── ical.md                   # export et import iCal
│   ├── sponsored.md              # mise en avant et mesure
│   └── notifications-partners.md # modèles WhatsApp
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (partner)/espace/                 # espace prestataires (FR, dynamique, noindex)
│   │   ├── layout.tsx                    # <html lang="fr-SN">, bouton Aide, noindex
│   │   ├── page.tsx                      # connexion
│   │   ├── code/  lien/[token]/  accueil/  reglages/
│   │   ├── calendrier/  calendrier/[offer]/{semaine,synchronisation}/
│   │   ├── reservations/  reservations/[id]/
│   │   ├── prix/  paiements/  mise-en-avant/
│   │   └── actions.ts                    # Server Actions (contrat partner-space)
│   ├── api/availability/route.ts         # disponibilité publique (cache 30 s)
│   ├── api/ical/[token]/route.ts         # export iCal par unité
│   ├── api/sponsored/hit/route.ts        # mesure sans cookie
│   └── dev/ical-sample.ics/route.ts      # flux de démonstration (404 en production)
├── collections/                          # PartnerMembers, PartnerSessions, LoginCodes, RentalUnits,
│                                         # Inventory, InventoryHolds, ExternalCalendars,
│                                         # AvailabilityChanges, PriceChangeRequests,
│                                         # SponsoredPlacements, SponsoredStats (+ ajouts 001/002)
├── jobs/                                 # syncExternalCalendars, partnerDailyDigest,
│                                         # refreshSponsored, purgePartnerAuth
├── lib/
│   ├── availability/                     # pur : remaining, template, allocateUnit, stays, cutoff
│   ├── inventory/                        # SQL : holdInventory, convertHolds, releaseHolds
│   ├── ical/                             # pur : parse, generate ; fetch sûr (SSRF)
│   ├── partnerAuth/                      # codes, sessions, cookie se_partner
│   └── sponsored/                        # statut, choix par page, semaine ISO
├── components/partner/                   # tuiles, grille de calendrier, en-têtes, Aide
├── components/client/                    # UndoToast, DayPicker, OfflineBanner,
│                                         # AvailabilityPicker, SponsoredBeacon
└── components/cards/SponsoredCard.tsx
scripts/seed-partners.ts
tests/unit/{availability,ical,partnerAuth,sponsored}/
tests/integration/inventory.test.ts       # rétentions concurrentes (base de test)
tests/e2e/partner/  tests/e2e/availability/  tests/e2e/sponsored/
```

**Structure Decision** : extension de l'application unique (principe VIII). L'espace vit dans un
groupe de routes `(partner)` avec son propre layout racine, hors des routes localisées : le
middleware le laisse passer sans préfixe de langue et pose les en-têtes `noindex` et `no-store`.
La logique de disponibilité et d'iCal est isolée dans des modules purs testés ; seules les
fonctions de `lib/inventory` écrivent le stock, en SQL conditionnel. Les pages publiques et le
résolveur `[...segments]` ne lisent toujours ni cookie ni disponibilité (T19 de la 002).

## Approche par parcours (ordre de livraison)

0. **Prérequis** : 002 livrée au moins jusqu'à son US1 (paiement, réservations, notifications,
   `partners`, `transfers`) ; jusqu'à son US5 pour l'US4 de la 003 — T29.
1. **Fondations 003** : modules purs `availability` et `ical` + tests ; collections et migrations ;
   fonctions SQL de rétention + tests d'intégration ; authentification de l'espace (codes,
   sessions, lien de secours) ; layout `/espace` (noindex) ; `seed:partners`.
2. **US1 (P1)** : calendriers (nuits par unité, créneaux, véhicules), semaine type, annulation
   10 s, journal ; API de disponibilité + îlot sur les fiches ; rétention au paiement et
   confirmation automatique ; séjours par composants ; attribution d'unités.
3. **US2 (P2)** : notifications prestataires, liste et détail des réservations, « J'ai un
   problème », récapitulatif de la veille.
4. **US3 (P3)** : export et import iCal, conflits, erreurs, écran de synchronisation.
5. **US4 (P4)** : demandes de prix et validation dans l'admin ; « Mes paiements » (relevé 002) ;
   notification des reversements.
6. **US5 (P5)** : mises en avant (admin, carte, emplacements, tag `sponsored`, mesure, écran
   restaurant).
7. **Transverse** : modèles WhatsApp approuvés, test avec 5 prestataires réels (SC-001), revue de
   sécurité, registre des traitements, LHCI et `check-bundles` étendus.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| **D-T21** — Service externe supplémentaire : fournisseur SMS pour le code de connexion (principe VIII) | Un prestataire dont WhatsApp ne reçoit pas le code (numéro non WhatsApp, modèle refusé, panne) doit pouvoir se connecter seul, à toute heure (FR-003b) | Lien créé par l'équipe seul : dépend des heures ouvrées de l'équipe (écarté par le propriétaire) ; appel vocal : coût et complexité. **Portée** : uniquement les codes de connexion, 2 SMS / 15 min / numéro ; appels `fetch` sans SDK ; sans clé, boîte d'envoi de test. **Fournisseur** : choisi sur devis (R15). **Validation** : approuvée par le propriétaire en session le 2026-11-16 |
