<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.0.1 (2026-11-14)
Bump rationale: PATCH — clarification of Principle II: the Lighthouse SEO = 100 target applies to
indexable pages. Principle III requires funnel/account pages to be noindex, which Lighthouse's SEO
category penalises by design; the two rules were contradictory on those pages. No principle added
or removed.
Modified principles: II. Performance (clarification only)
Templates: no change required (plan-template Constitution Check wording still valid).
Follow-up: specs/001-site-public-vitrine tasks D7 resolved by this amendment.

Previous report (1.0.0)
-----------------------
Version change: (template, unversioned) → 1.0.0
Bump rationale: first ratification; every placeholder replaced by concrete principles (MAJOR 1.0.0).

Modified principles (template slot → new title):
  - [PRINCIPLE_1_NAME] → I. Mobile-first absolu
  - [PRINCIPLE_2_NAME] → II. Performance (budgets bloquants en CI)
  - [PRINCIPLE_3_NAME] → III. SEO dès la conception
  - [PRINCIPLE_4_NAME] → IV. Accessibilité WCAG 2.2 AA
  - [PRINCIPLE_5_NAME] → V. Confiance et authenticité

Added principles (beyond the 5 template slots):
  - VI. Marché sénégalais
  - VII. Qualité du code et tests
  - VIII. Simplicité
  - IX. Données personnelles et sécurité

Added sections:
  - Contraintes produit et contenu (SECTION_2)
  - Flux de développement et portes qualité (SECTION_3)
  - Governance (filled)

Removed sections: none

Templates:
  ✅ .specify/templates/plan-template.md — Constitution Check now lists the nine gates I–IX
  ✅ .specify/templates/tasks-template.md — tests no longer "optional" for business logic and
     mobile E2E (Principle VII); Polish phase adds Lighthouse CI / axe / SEO verification tasks
  ✅ .specify/templates/spec-template.md — reviewed, no mandatory section added; no change needed
  ✅ .specify/templates/commands/*.md — directory absent (skills live in .claude/skills); n/a
  ✅ README.md / docs/quickstart.md — absent; n/a

Deferred TODOs: none. Ratification date set to the date of first adoption (2026-11-14).
-->

# Saloum Évasion Constitution

Saloum Évasion est une plateforme haut de gamme de séjours immersifs clé en main à Ndangane et
dans les îles du Sine-Saloum (Sénégal). Elle concurrence Booking et Club Med par l'authenticité
locale : hébergement + expériences + gastronomie + transfert en **une seule réservation**.

Les principes ci-dessous sont **NON NÉGOCIABLES**. Chacun est assorti d'un critère vérifiable ;
un principe sans preuve de conformité est considéré comme non respecté.

## Core Principles

### I. Mobile-first absolu

- Chaque écran DOIT être conçu d'abord pour une largeur de **360 px**, puis élargi. Les media
  queries n'utilisent **que `min-width`** (aucun `max-width` pour adapter la mise en page).
- Appareil de référence : Android milieu de gamme sur réseau 4G sénégalais instable. Tout
  parcours (découverte → réservation → paiement) DOIT rester utilisable en **3G**.
- Cibles tactiles **≥ 44 × 44 px** ; actions principales dans la zone du pouce ; **aucune
  fonction ne dépend du survol** (hover).
- Sur mobile, une **barre d'action collante en bas d'écran** (Réserver / WhatsApp) DOIT être
  présente sur les pages séjour, expérience, hébergement et destination.
- Formulaires : type de clavier adapté (`type="tel"`, `type="email"`, `type="date"`,
  `inputmode`), attributs `autocomplete` renseignés, aucun champ non indispensable.

**Critère vérifiable** : lint CSS interdisant `max-width` dans les media queries ; tests E2E
exécutés en viewport 360 × 800 avec profil réseau 3G (parcours de réservation complet réussi) ;
test automatisé de la taille des cibles tactiles (≥ 44 px) ; revue de chaque formulaire
(type + autocomplete) dans la checklist de PR.

**Justification** : la majorité des visiteurs, locaux comme diaspora, réservent depuis un
téléphone sur un réseau mobile variable ; un parcours qui casse en 3G est une vente perdue.

### II. Performance (budgets bloquants en CI)

- Core Web Vitals au **75e percentile mobile** : LCP **≤ 2,5 s** (objectif labo ≤ 2,0 s en 4G
  lente), INP **≤ 200 ms**, CLS **≤ 0,1**.
- Lighthouse mobile : Performance **≥ 95**, SEO **= 100**, Accessibilité **≥ 95**, Bonnes
  pratiques **= 100**. Le score SEO = 100 s'applique aux **pages indexables** ; les pages
  `noindex` imposées par le principe III (tunnel, compte) sont exclues de cette seule catégorie
  et restent soumises aux trois autres.
- JavaScript initial **≤ 150 Ko compressés par route** ; image principale (LCP) **≤ 120 Ko**,
  en AVIF/WebP, avec `width`/`height` explicites.
- Vidéos : **jamais téléchargées avant interaction sur mobile** ; affiche (poster) légère ;
  streaming adaptatif (HLS/DASH) ; respect de `Save-Data` et `prefers-reduced-motion`.
- **2 familles de polices maximum**, auto-hébergées, sous-ensemble latin, `font-display: swap`.

**Critère vérifiable** : Lighthouse CI avec budgets (`budget.json` / assertions) exécuté sur
chaque PR, en profil mobile 4G lente — tout dépassement **bloque la fusion** ; contrôle de la
taille des bundles par route en CI ; test E2E vérifiant qu'aucune requête vidéo n'est émise
avant interaction en viewport mobile ; suivi des CWV terrain (RUM ou CrUX) au p75.

**Justification** : sur réseau sénégalais instable et forfaits data coûteux, la vitesse est
une condition d'accès, pas un luxe ; elle conditionne aussi le référencement.

### III. SEO dès la conception

- Toute page publique DOIT être **rendue côté serveur** (statique ou régénérée) : aucun contenu
  indexable n'existe uniquement en JavaScript.
- Chaque page possède un `title` unique **≤ 60 caractères**, une meta description unique
  **≤ 155 caractères**, **un seul H1**, une URL canonique, des balises Open Graph et Twitter.
- Français par défaut (`/fr`), anglais (`/en`), **hreflang réciproques + `x-default`** ; URLs
  lisibles en minuscules avec tirets (ex. `/fr/sejours/week-end-bolong`).
- Données structurées **JSON-LD valides** sur chaque type de page : Organization/TravelAgency,
  TouristTrip, TouristDestination, LodgingBusiness, VideoObject, BreadcrumbList, FAQPage.
- `sitemap.xml` généré automatiquement (avec images et vidéos), `robots.txt`, fil d'Ariane,
  maillage interne entre séjours, expériences, hébergements et destinations.
- Chaque image a un **texte alternatif descriptif** ; chaque URL modifiée reçoit une
  **redirection 301** ; pages de tunnel de réservation et de compte en **`noindex`**.
- SEO local : nom, adresse et téléphone (NAP) **identiques partout**, issus d'une source unique
  et cohérents avec la fiche Google Business Profile.

**Critère vérifiable** : test automatisé sur le HTML servi sans JavaScript (contenu principal
présent) ; tests de métadonnées par route (longueurs, unicité, H1 unique, canonical, OG,
hreflang réciproques) ; validation JSON-LD en CI (schéma + Rich Results) ; test du sitemap ;
table de redirections versionnée et testée ; NAP défini dans une seule constante partagée.

**Justification** : la recherche organique est le principal canal d'acquisition face aux
plateformes concurrentes ; le SEO ajouté après coup coûte toujours plus cher.

### IV. Accessibilité WCAG 2.2 AA

- Conformité **WCAG 2.2 niveau AA** ; HTML sémantique (landmarks, titres hiérarchisés,
  vrais boutons et liens, labels associés).
- Contraste texte **≥ 4,5:1** (≥ 3:1 pour le grand texte et les composants d'interface).
- **Navigation clavier complète**, focus visible, aucun piège au clavier.

**Critère vérifiable** : **axe sans aucune erreur** sur chaque page et état testé en E2E
(bloquant en CI) ; Lighthouse Accessibilité ≥ 95 ; test E2E clavier du parcours de réservation.

**Justification** : un site haut de gamme est un site utilisable par tous ; l'accessibilité
améliore aussi le SEO et l'usage mobile.

### V. Confiance et authenticité

- **Uniquement de vraies photos et vidéos** des lieux, hébergements et expériences proposés
  (aucune banque d'images présentée comme réelle, aucune image générée).
- **Aucun avis inventé** : seuls les voyageurs ayant effectivement séjourné (réservation
  terminée) peuvent noter et commenter.
- Prix affichés **TTC en FCFA**, avec conversion **indicative** en euros clairement signalée.
- **Conditions d'annulation visibles avant le paiement**, sur l'offre et dans le tunnel.

**Critère vérifiable** : chaque média référencé porte une provenance (auteur, lieu, date) dans
le contenu ; la création d'un avis exige une réservation au statut « terminée » (test unitaire
et contrôle serveur) ; test E2E vérifiant prix TTC FCFA + mention indicative EUR et affichage
des conditions d'annulation avant l'étape de paiement.

**Justification** : l'authenticité est la promesse différenciante face à Booking et Club Med ;
toute tromperie la détruit.

### VI. Marché sénégalais

- **FCFA (XOF)** est la devise de référence : stockage et calcul des montants en XOF (entiers),
  conversions dérivées uniquement pour l'affichage.
- **Wave et Orange Money** sont proposés **au même niveau visuel et fonctionnel** que la carte
  bancaire (même rang, même mise en avant).
- **WhatsApp** est le canal de contact principal, accessible depuis chaque page publique.
- **Sobriété en données mobiles** : pas de ressource lourde non sollicitée.

**Critère vérifiable** : modèle de données avec montants XOF entiers (test unitaire sur
arrondis et conversions) ; test E2E de l'écran de paiement vérifiant la présence et l'ordre
équivalent de Wave, Orange Money et carte ; lien WhatsApp présent sur chaque route publique.

**Justification** : sans paiement mobile ni WhatsApp, une part majeure de la clientèle locale
et de la diaspora ne peut ni contacter ni payer.

### VII. Qualité du code et tests

- **TypeScript strict** (`strict: true`), **aucun `any`** (explicite ou implicite).
- **Tests unitaires** obligatoires sur la logique métier (tarification, disponibilités,
  conversion de devise, annulation, éligibilité aux avis).
- **Tests de bout en bout** obligatoires sur des écrans mobiles (360 px) pour chaque parcours
  utilisateur livré.
- **Lighthouse CI et axe bloquent la fusion** si un budget ou une règle est dépassé.

**Critère vérifiable** : `tsc --noEmit` et ESLint (`@typescript-eslint/no-explicit-any` en
erreur) passent en CI ; suites unitaires et E2E vertes ; contrôles requis configurés sur la
branche `main`.

**Justification** : un tunnel de réservation et de paiement ne tolère pas les régressions.

### VIII. Simplicité

- On livre un **MVP avant toute optimisation** non exigée par un budget de la constitution.
- **Un seul dépôt, une seule application web.**
- **Pas de microservices** ni de service séparé sans besoin mesuré et documenté.

**Critère vérifiable** : toute nouvelle application, service ou dépendance structurante est
justifiée dans la section « Complexity Tracking » du plan concerné, avec mesure à l'appui.

**Justification** : une petite équipe livre plus vite et plus sûrement avec une architecture
unique ; la complexité se gagne par la preuve.

### IX. Données personnelles et sécurité

- Conformité à la **loi sénégalaise n° 2008-12** sur la protection des données personnelles
  (CDP) et au **RGPD** pour les visiteurs européens.
- **Consentement aux cookies** recueilli avant tout traceur non essentiel ; refus aussi simple
  que l'acceptation.
- **Aucune donnée de carte bancaire stockée ni transitant par nos serveurs** : paiement délégué
  à des prestataires certifiés PCI DSS (champs hébergés ou redirection).

**Critère vérifiable** : test E2E vérifiant qu'aucun traceur non essentiel n'est chargé avant
consentement ; revue de sécurité de toute intégration de paiement ; registre des traitements et
politique de confidentialité publiés en `/fr` et `/en`.

**Justification** : la confiance des voyageurs et la conformité légale conditionnent
l'existence même de la plateforme.

## Contraintes produit et contenu

- **Offre unifiée** : un séjour combine hébergement, expériences, gastronomie et transfert dans
  une **seule réservation** et un seul paiement ; aucune fonctionnalité ne doit fragmenter ce
  parcours sans dérogation.
- **Bilinguisme** : tout contenu public existe en français (référence) et en anglais avant
  publication ; une page sans traduction n'est pas publiée dans l'autre langue (pas de repli
  silencieux) et n'est pas annoncée en hreflang.
- **Source unique de vérité** : NAP, prix, conditions d'annulation et coordonnées WhatsApp
  proviennent d'une source unique réutilisée partout (pas de duplication en dur).
- **Médias** : chaque image est livrée en AVIF/WebP aux dimensions responsives, avec texte
  alternatif FR et EN ; chaque vidéo dispose d'un poster, de sous-titres et de métadonnées
  VideoObject.

## Flux de développement et portes qualité

- Toute fonctionnalité suit le cycle Spec Kit : spécification → plan (avec **Constitution
  Check** sur les principes I à IX) → tâches → implémentation.
- Une PR ne peut être fusionnée sur `main` que si **toutes** les vérifications suivantes sont
  vertes : typecheck strict, lint, tests unitaires, tests E2E mobiles (360 px), axe sans
  erreur, Lighthouse CI dans les budgets, validation JSON-LD et métadonnées SEO.
- La checklist de PR rappelle les points non automatisables : authenticité des médias,
  cohérence NAP, conditions d'annulation, parité Wave / Orange Money / carte.
- Les budgets de performance ne sont jamais relâchés pour faire passer une PR : on corrige
  le code, ou on demande une dérogation (voir Gouvernance).

## Governance

- Cette constitution **prévaut sur toute autre pratique** ou préférence du projet.
- **Dérogations** : toute dérogation à un principe DOIT être justifiée **par écrit dans le
  plan concerné** (section « Complexity Tracking » : principe visé, raison, alternative plus
  simple rejetée, durée) et **validée par le propriétaire du projet** avant implémentation.
  Une dérogation non validée équivaut à une violation.
- **Amendements** : proposés par PR modifiant ce fichier, avec rapport d'impact (Sync Impact
  Report) et mise à jour des modèles dépendants dans `.specify/templates/`. Ils entrent en
  vigueur après approbation du propriétaire du projet.
- **Versionnage sémantique** : MAJEUR pour la suppression ou la redéfinition incompatible d'un
  principe ou d'une règle de gouvernance ; MINEUR pour l'ajout d'un principe ou d'une section,
  ou un élargissement matériel ; CORRECTIF pour clarifications et reformulations.
- **Revue de conformité** : chaque plan passe la Constitution Check avant la phase 0 et après
  la phase 1 ; chaque PR est revue au regard des principes ; une revue globale de conformité
  (CWV terrain, Lighthouse, axe, SEO) a lieu au moins une fois par trimestre.

**Version**: 1.0.1 | **Ratified**: 2026-11-14 | **Last Amended**: 2026-11-14
