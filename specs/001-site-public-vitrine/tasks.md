---

description: "Task list — 001 Site public Saloum Évasion"
---

# Tasks: Site public Saloum Évasion — vitrine, catalogue et film d'immersion

**Input** : documents de conception dans `specs/001-site-public-vitrine/`
**Prerequisites** : [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md),
checklists [seo](./checklists/seo.md), [mobile](./checklists/mobile.md),
[performance-a11y](./checklists/performance-a11y.md)

**Tests** : obligatoires (constitution VII et demande du propriétaire). Chaque page a une
tâche de **test mobile 360 px** (`*.mobile.spec.ts` : Android 360×800 en 4G lente, iPhone SE,
paysage 800×360, zoom du texte à 200 %, cibles ≥ 44 px, axe, clavier) et une tâche de
**validation SEO** (`*.seo.spec.ts`, projet sans JavaScript : métadonnées, hreflang, JSON-LD,
fil d'Ariane, sitemap).

**Taille** : chaque tâche représente moins d'une demi-journée de travail.

**Ordre** : celui imposé par le propriétaire (socle → fondations SEO → CMS → pages par valeur
SEO → demande et WhatsApp → optimisation). Conséquence : le parcours **US1 n'est complet
(demande envoyée) qu'à la phase 8** ; les phases 4 à 7 livrent des pages consultables et
indexables, avec un bouton qui pointe déjà vers `/demande?…`.

## Format : `[ID] [P?] [Story] Description`

- **[P]** : parallélisable (fichiers différents, aucune dépendance sur une tâche inachevée)
- **[Story]** : parcours de la spec (US1 à US5)

## Décisions bloquantes à prendre avant ou pendant l'implémentation

Ces points viennent du plan et des checklists. Les tâches concernées appliquent le défaut
indiqué ; changer de décision implique de reprendre les tâches citées.

| # | Décision | Défaut appliqué | Tâches touchées |
|---|---|---|---|
| D1 | Dérogation D-T6a : admin Payload hors budgets Lighthouse/JS | **approuvée en session** (plan, Complexity Tracking) | T015, T016, T041 |
| D2 | T1 : notification de l'équipe par WhatsApp (API Business) ou non | **résolu** : e-mail avec relance + bouton « Envoyer aussi sur WhatsApp » (spec FR-013 amendée) | T141, T145, T146 |
| D3 | Mots-clés en concurrence (seo CHK042) : « séjour Sine-Saloum » (accueil ou liste) et « week-end Ndangane » (fiche ou destination) | page principale = liste des séjours et fiche séjour week-end | T170, T171 |
| D4 | Audiodescription du film (WCAG 1.2.5) | transcription descriptive affichée ; piste d'audiodescription **à décider** | T126 |
| D5 | Admin utilisable sur téléphone (mobile CHK005) | **dérogation D-T6b approuvée en session** : test sur ordinateur seulement | T072 |
| D6 | Défauts R1 (URL), R2 (prix), R11 (contenu retiré), R12 (4ᵉ univers) | appliqués tels quels | T025, T026, T059, T066 |
| D7 | Score SEO Lighthouse = 100 impossible sur une page `noindex` (demande) | **résolu** par la constitution v1.0.1 (SEO = 100 sur les pages indexables) | T155 |

---

## Phase 1 : Setup — socle (avant toute page)

**Objectif** : projet strict, design mobile-first, toutes les portes CI en place et capables de
virer au rouge avant la première vraie page.

- [X] T001 Initialiser l'application Next.js 15 (App Router, TypeScript, pnpm) à la racine : `package.json`, `next.config.ts`, `src/app/`, `.gitignore`, `.nvmrc` (22)
- [X] T002 Configurer `tsconfig.json` : `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, alias `@/*` → `src/*`
- [X] T003 [P] Configurer ESLint dans `eslint.config.mjs` : `next/core-web-vitals`, `@typescript-eslint/no-explicit-any` en erreur, `@typescript-eslint/consistent-type-assertions` (pas de `as`), `jsx-a11y` recommandé
- [X] T004 [P] Ajouter Prettier (`.prettierrc`, plugin Tailwind) et `.editorconfig`
- [X] T005 [P] Configurer Stylelint dans `.stylelintrc.json` : `media-feature-name-disallowed-list: ["max-width"]` (constitution I) ; exiger que `:hover` soit dans `@media (hover: hover)`
- [X] T006 Installer Tailwind CSS v4 et définir les jetons dans `src/styles/globals.css` (`@theme`) : `mangrove #0F2A24`, `ocre #9E4521`, `sable #F4EEE3`, couleurs de texte et de bordure dérivées, `scrim` pour le texte sur photo, espacements, rayons ; styles de base pensés pour 360 px, points de rupture `sm/md/lg` en `min-width`
- [X] T007 [P] Déclarer les polices dans `src/styles/fonts.ts` avec `next/font/google` (auto-hébergées) : Cormorant Garamond 500/600 et italique 500, Manrope variable 400 à 700, `subsets: ['latin']`, `display: 'swap'`, `adjustFontFallback`, variables CSS `--font-serif` et `--font-sans`
- [X] T008 [P] Créer `src/styles/a11y.css` (importé par `globals.css`) : anneau de focus `:focus-visible` de 3 px avec contraste ≥ 3:1 sur sable et sur mangrove, style du lien d'évitement, `scroll-padding-bottom` réservé à la barre collante, désactivation des transitions sous `prefers-reduced-motion: reduce`
- [X] T009 [P] Configurer Vitest dans `vitest.config.ts` (alias `@`, environnement node) et ajouter `tests/unit/smoke.test.ts`
- [X] T010 Configurer Playwright dans `playwright.config.ts` : projets `android-360` (360×800, `isMobile`, `hasTouch`, DPR 3), `android-360-landscape` (800×360), `iphone-se`, `pixel-7`, `nojs` (`javaScriptEnabled: false`), `desktop` (1280×800, pointeur fin) ; `webServer` sur `pnpm start`
- [X] T011 [P] Créer `tests/e2e/support/network.ts` : profils CDP `slow4g` (1,6 Mbit/s descendant, 750 kbit/s montant, 150 ms, processeur ×4) et `3g` (780 kbit/s, 330 kbit/s, 300 ms, processeur ×4), avec une fonction `applyNetwork(page, profile)` et un mode hors ligne
- [X] T012 [P] Créer `tests/e2e/support/a11y.ts` : helper `expectNoAxeViolations(page, label)` avec les tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`, échec à la moindre violation, réutilisable sur les états (menu ouvert, panneau ouvert, erreurs)
- [X] T013 [P] Créer `tests/e2e/support/mobile.ts` : `expectTouchTargets(page, 44)` (exclut les liens dans un paragraphe), `expectNoHorizontalScroll(page)`, `setTextZoom(page, 2)` (taille de police racine à 200 %), `expectFocusNotObscured(page)` (élément actif hors de la barre collante), `expectInThumbZone(locator)` (tiers inférieur de la fenêtre)
- [X] T014 [P] Créer `tests/e2e/support/seo.ts` : extraction depuis le HTML servi du title, de la description, des H1, du canonical, des hreflang, des balises OG et Twitter, de la meta robots et du JSON-LD, avec assertions (title ≤ 60, description ≤ 155, un seul H1, hreflang `fr`/`en`/`x-default` réciproques) et un registre d'unicité partagé entre les tests
- [X] T015 Créer `lighthouserc.json` : preset mobile, `numberOfRuns: 3` (médiane), assertions de la constitution (Perf ≥ 0,95, SEO = 1, A11y ≥ 0,95, BP = 1, LCP ≤ 2000, CLS ≤ 0,1, TBT ≤ 200, `resource-summary:script:size` ≤ 153 600), plus `modern-image-formats`, `unsized-images`, `font-display` ; liste d'URL initiale `/fr` ; `/admin` exclu (D1)
- [X] T016 [P] Écrire `scripts/check-bundles.ts` : lit le manifeste de build, calcule le poids gzip du JavaScript initial par route publique (échec au-delà de 150 Ko) et de chaque morceau chargé à la demande (échec au-delà de 100 Ko), en excluant `/admin` (D1)
- [X] T017 [P] Écrire le squelette de `scripts/seo-check.ts` : crawl du site construit à partir de `sitemap.xml`, liens cassés (linkinator), unicité title/description, réciprocité hreflang, chaînes de redirection d'au plus 1 saut
- [X] T018 Déclarer les scripts dans `package.json` : `dev`, `build`, `start`, `typecheck`, `lint` (ESLint + Stylelint), `test`, `e2e`, `e2e:nojs`, `lhci`, `bundles`, `seo:check`
- [X] T019 [P] Créer `docker-compose.yml` (Postgres 16) et `.env.example` avec les variables de [quickstart.md](./quickstart.md)
- [X] T020 Créer `.github/workflows/ci.yml` : pnpm, service Postgres, `typecheck` → `lint` → `test` → `build` → `bundles` → serveur → `e2e` (tous les projets) → `lhci autorun` → `seo:check` ; tout échec fait échouer le workflow
- [X] T021 Rédiger `.github/BRANCH_PROTECTION.md` : liste des contrôles obligatoires sur `main` (à activer par le propriétaire dans GitHub)
- [X] T022 [P] Créer `.github/pull_request_template.md` reprenant les points non automatisables de la constitution : authenticité et provenance des médias, cohérence des coordonnées (NAP), conditions d'annulation visibles, parité Wave / Orange Money / carte, type de clavier et `autocomplete` de chaque nouveau champ, capture d'écran à 360 px (analyse C5)
- [X] T023 Ajouter une page témoin `src/app/(frontend)/[locale]/page.tsx` et `tests/e2e/smoke.mobile.spec.ts` (axe, cibles, pas de défilement horizontal à 360 px), puis prouver en CI qu'une violation volontaire fait échouer le pipeline
- [X] T024 [P] Aligner les documents de conception sur les décisions de ce plan de tâches : `contracts/jsonld.md` (`contentUrl` = rendu MP4, village ou île → TouristDestination, réserve → TouristAttraction), `data-model.md` (clés `pages` pour les listes et la 404, champs `replacementTarget`, `accommodations.identifier`, `videos.descriptiveTranscript`, `siteSettings.fallbackNotificationEmail`, `requests.notifyAttempts`), `contracts/routes.md` (source des title des listes), `plan.md` (structure : menu, recherche et sélecteur de langue rendus côté serveur)

**Checkpoint** : `pnpm typecheck && pnpm lint && pnpm test && pnpm e2e && pnpm lhci` passent sur la page témoin ; une régression volontaire bloque la PR.

---

## Phase 2 : Foundational (bloquant pour tous les parcours)

### 2A. Fondations SEO

- [X] T025 Configurer next-intl : `src/i18n/routing.ts` (locales `fr`, `en`, défaut `fr`, `localePrefix: 'always'`, `localeDetection: false`), `src/i18n/request.ts`, `src/i18n/messages/fr.json` et `en.json`, `src/middleware.ts` (redirection 301 fixe de `/` vers `/fr`, minuscules, suppression de la barre oblique finale)
- [X] T026 Créer `src/i18n/pathnames.ts` : segments traduits (`sejours`/`stays`, `experiences`, `hebergements`/`accommodation`, `destinations`, `film-immersion`/`immersion-film`, `notre-engagement`/`our-commitment`, `a-propos`/`about`, `faq`, `contact`, `mentions-legales`/`legal-notice`, `confidentialite`/`privacy`, `demande`/`request`, `merci`/`thank-you`) ; fonctions `buildPath(locale, route)` et `resolvePath(locale, segments)` → `{ type, params }` typé en union discriminée
- [X] T027 [P] Écrire `tests/unit/pathnames.test.ts` : aller-retour `buildPath`/`resolvePath` pour chaque type de route et chaque langue, segments inconnus → `null`
- [X] T028 Créer le layout `src/app/(frontend)/[locale]/layout.tsx` : `<html lang="fr-SN|en">`, polices, lien d'évitement « Aller au contenu », `<main id="contenu">`, en-tête, pied de page, `setRequestLocale`, `generateStaticParams` des locales, export `viewport` avec `interactiveWidget: 'resizes-content'` (le clavier virtuel réduit la fenêtre, la barre collante reste au-dessus sans JS)
- [X] T029 [P] Créer `src/components/layout/Header.tsx` (logo, bouton menu de 44 px, emplacement du sélecteur de langue et du compteur de demande) et `src/components/layout/Footer.tsx` (navigation, NAP lu dans `siteSettings`, moyens de paiement Wave, Orange Money et carte au même rang)
- [X] T030 [P] Créer `src/components/layout/MobileMenu.tsx` (composant **serveur** : balisage `<dialog>` plein écran, liens, boutons de fermeture en haut **et** en bas) et `src/components/client/DialogOpener.tsx` (moins de 1 Ko : `showModal()`, ce qui donne au navigateur le focus enfermé, la fermeture par Échap et par le bouton retour d'Android, puis le retour du focus) ; défilement bloqué par CSS (`body:has(dialog[open])`) ; sans JavaScript, le bouton est un lien vers la navigation du pied de page (analyse K1)
- [X] T031 Créer `src/lib/seo/metadata.ts` : `buildMetadata({ locale, path, alternates, title, description, image, noindex, type })` → `Metadata` Next (canonical absolu sans paramètres, `alternates.languages` fr/en/`x-default`=FR avec EN omis s'il n'est pas publié, Open Graph `fr_SN`/`en_US` 1200×630, Twitter `summary_large_image`, robots)
- [X] T032 [P] Écrire `tests/unit/metadata.test.ts` : canonical, hreflang avec et sans EN, noindex, longueurs
- [X] T033 Créer `src/components/seo/JsonLd.tsx` : composant serveur qui rend un `@graph` typé `schema-dts` dans un seul `<script type="application/ld+json">`, en échappant `</`
- [X] T034 [P] Créer `src/lib/seo/jsonld/organization.ts` (Organization + TravelAgency depuis `siteSettings`), `website.ts`, `breadcrumb.ts`, `itemList.ts`, et `tests/unit/jsonld-common.test.ts` (`@id` stables, aucune clé `aggregateRating`/`review`, NAP issu de `siteSettings`)
- [X] T035 [P] Créer `src/lib/seo/breadcrumbs.ts` (fil d'Ariane calculé depuis le type de route, source unique pour l'affichage et le JSON-LD) et `src/components/ui/Breadcrumbs.tsx` (`nav aria-label`, `ol`, `aria-current="page"`)
- [X] T036 Créer `src/app/(frontend)/sitemap.ts` et `src/lib/seo/sitemapEntries.ts` : pages fixes × locales avec `alternates.languages`, points d'extension pour les documents, les images et les vidéos ; exclusion des pages noindex
- [X] T037 [P] Créer `src/app/(frontend)/robots.ts` conforme à [routes.md](./contracts/routes.md#robotstxt) (`Disallow: /admin`, `/api` ; pages de demande non bloquées)
- [X] T038 [P] Créer `src/lib/seo/og.tsx` : génération `next/og` 1200×630 (vraie photo du document, voile, titre en Cormorant, logo ; polices lues depuis des fichiers locaux) et `public/og-default.jpg`
- [X] T039 Créer `src/app/(frontend)/[locale]/not-found.tsx`, `error.tsx` et `src/app/(frontend)/global-error.tsx` (noindex, H1, liens vers 3 séjours populaires, les destinations et la recherche) et `tests/e2e/errors.mobile.spec.ts` (statut 404, noindex, ni canonical ni hreflang, axe, 360 px)
- [X] T040 Écrire `tests/e2e/seo-foundations.seo.spec.ts` (projet `nojs`) : `/` → 301 `/fr`, `robots.txt`, `sitemap.xml` en XML valide, `lang` du document, présence du lien d'évitement

> **Écarts d'implémentation 2A (2026-11-14)** :
> - T029 : coordonnées lues dans `src/lib/site.ts` (`getSiteSettings`) jusqu'au global
>   `siteSettings` de la phase 2B ; aucune coordonnée inventée (champ absent = non affiché).
> - T034 : nœud `TravelAgency` seul (sous-type d'Organization dans schema.org), `@id` `/#org`.
> - T036 / T037 : `sitemap.ts` et `robots.ts` à la racine de `src/app/` (exigence Next pour
>   robots) ; liens et sitemap limités aux routes livrées (`src/lib/navigation.ts`).
> - T038 : image par défaut `/og-default.png` et logo `/logo-512.png` générés au build
>   (`next/og`), polices statiques dans `src/assets/fonts/`.
> - T039 : `global-error.tsx` à la racine de `src/app/` (emplacement imposé) ; les URL sans
>   préfixe de langue sont réécrites vers la 404 localisée.
> - T025 : redirections (racine, barre oblique finale, majuscules) en 301 par le middleware
>   (`skipTrailingSlashRedirect`), pas le middleware next-intl.
> - Playwright : projet `iphone-se` limité à 2 workers (plantages de WebKit sous forte
>   concurrence) ; LHCI mesure `/fr` et `/en`.

### 2B. CMS et modèle de données localisé FR/EN

- [X] T041 Installer Payload 3 (`@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`) ; créer `src/payload.config.ts` (localisation `fr`/`en`, `defaultLocale: 'fr'`, `fallback: false`), les routes `src/app/(payload)/admin/[[...segments]]/page.tsx` et API, `withPayload` dans `next.config.ts`, en-tête `X-Robots-Tag: noindex` sur `/admin`
- [X] T042 [P] Créer `src/collections/Users.ts` : rôles `admin`/`editor`, mot de passe d'au moins 12 caractères, collage et gestionnaires de mots de passe autorisés (WCAG 3.3.8)
- [X] T043 [P] Créer les groupes de champs `src/fields/seo.ts`, `src/fields/localeStatus.ts`, `src/fields/body.ts` (au moins 300 mots par langue publiée), `src/fields/provenance.ts` et les validateurs purs `src/fields/validators.ts` (regex de slug, longueurs, comptage de mots)
- [X] T044 [P] Écrire `tests/unit/validators.test.ts` : slugs valides et invalides, title 60/61 caractères, comptage de mots (hors titres)
- [X] T045 Créer `src/collections/Media.ts` : `alt` FR et EN obligatoires, provenance obligatoire, génération de `blurDataURL` à l'envoi (sharp), dimensions, adaptateur de stockage S3 activé si `S3_*` est défini
- [X] T046 [P] Créer `src/collections/Destinations.ts` selon [data-model.md](./data-model.md#destinations), avec `kind` = `village` \| `ile` \| `reserve` et `replacementTarget`
- [X] T047 [P] Créer `src/collections/Universes.ts` (`kind: experience | stay`, slug localisé seulement pour `experience`)
- [X] T048 [P] Créer `src/collections/CancellationPolicies.ts`
- [X] T049 [P] Créer `src/collections/FaqItems.ts`
- [X] T050 Créer `src/collections/Stays.ts` : tous les champs du modèle, hooks calculant `durationCategory` et `budgetBand`, `cancellationPolicy` obligatoire, `replacementTarget`
- [X] T051 [P] Créer `src/collections/Experiences.ts` (univers obligatoire, `seasonMonths`, `pricePerPerson` XOF entier, `replacementTarget`)
- [X] T052 [P] Créer `src/collections/Accommodations.ts` (`type`, `capacity`, `amenities`, `geo`, `identifier` facultatif, galerie ≥ 5, `replacementTarget`)
- [X] T053 [P] Créer `src/collections/Videos.ts` : `muxPlaybackId`, durées plafonnées par format, affiche obligatoire, sous-titres FR et EN obligatoires pour `film`/`vertical15`, chapitres strictement croissants commençant à 0, `descriptiveTranscript` localisé
- [X] T054 [P] Créer `src/collections/Pages.ts` et les schémas de blocs `src/blocks/{Hero,RichText,Team,Figures,Gallery,Steps,Guarantees,Cta}.ts` ; clés uniques `home`, `commitment`, `about`, `faq`, `contact`, `legal`, `privacy`, `film`, `stays_list`, `experiences_hub`, `accommodations_list`, `destinations_list`, `not_found` (title, description et image de partage des pages sans document : seo CHK002 et CHK026)
- [X] T055 [P] Créer `src/collections/TeamMembers.ts`
- [X] T056 [P] Créer `src/collections/Requests.ts` (création via l'API refusée, lecture réservée à l'équipe, référence `SE-AAAAMMJJ-XXXX`, statuts) et `src/collections/RateLimits.ts` (masquée dans l'admin)
- [X] T057 [P] Créer `src/collections/Redirects.ts` (`from` unique, `to`, `type: 301`, `reason`)
- [X] T058 Créer les globals `src/globals/SiteSettings.ts` (NAP, WhatsApp, `responseTimeText`, `highSeasons`, `guarantees`, `paymentMethods`, `notificationEmail`, `fallbackNotificationEmail`, `sameAs`) et `src/globals/Navigation.ts`
- [X] T059 [P] Créer `src/lib/pricing.ts` (`priceFrom`, `durationCategory`, `budgetBand`, `toEurIndicative` = arrondi supérieur de XOF / 655,957, `formatXof` « 250 000 FCFA », `formatEur` « ≈ 382 € ») et `tests/unit/pricing.test.ts`
- [X] T060 Créer `src/lib/cms/queries.ts` : lectures publiées seulement (`getStayBySlug`, `listStays`, `getExperienceBySlug`, `listExperiences`, `getDestinationBySlug`, `listDestinations`, `getAccommodationBySlug`, `listAccommodations`, `getPage`, `getSiteSettings`, `getAlternates`), mises en cache avec les tags `doc:{collection}:{id}`, `{collection}`, `sitemap`, `nav`, en respectant `enPublished`
- [X] T061 Créer `src/hooks/revalidate.ts` (`afterChange`/`afterDelete` → `revalidateTag` du document, de sa collection, des destinations liées, du sitemap et de la navigation) et l'attacher à toutes les collections publiques et aux globals
- [X] T062 Générer la migration initiale (`pnpm payload migrate:create`) et écrire `src/seed/index.ts` : 6 destinations, 4 univers, réglages du site, 1 politique d'annulation, 3 séjours (dont un week-end à Ndangane), 4 expériences (pirogue, quad, balade à cheval à Palmarin, table du Saloum), 3 hébergements (dont une villa avec piscine à Ndangane), FAQ, pages ; FR et EN ; médias de test dans `tests/fixtures/media/`, réservés aux environnements de test
- [X] T063 Écrire `tests/e2e/cms.smoke.spec.ts` (projet `desktop`) : connexion à l'admin, `/admin` en noindex et bloqué dans `robots.txt`, création d'une demande via l'API publique refusée

> **Écarts d'implémentation 2B (2026-11-15)** :
> - T041 : Next fixé à **15.4.11** (Payload 3.93 exclut explicitement Next 15.5) ; API GraphQL
>   coupée ; admin en français via `@payloadcms/translations` (paquet de Payload) ; schéma
>   uniquement par migrations (`push: false`).
> - T043 : un champ localisé « obligatoire » l'est en français ; en anglais il peut rester vide,
>   et `localeStatus.enPublished` est recalculé à l'enregistrement de la version anglaise.
> - T045 : textes alternatifs en groupe non localisé `alt.fr` / `alt.en`, tous deux
>   obligatoires ; largeur minimale 1600 px contrôlée à l'envoi.
> - T046 / T052 : coordonnées GPS en deux nombres (latitude, longitude) : pas de PostGIS.
> - T053 : sous-titres référencés par URL de fichier .vtt (la collection `media` n'accepte que
>   des images).
> - T060 : réglages du site lus via `src/lib/cms/siteSettings.ts` ; `src/lib/site.ts` reste pur.
> - T061 : pas de route `/api/revalidate` : les hooks appellent `revalidateTag` directement
>   (même application), sans effet hors requête Next (seed, migrations).
> - T062 : seed de démonstration (images générées marquées « démonstration », provenance
>   « Démonstration », aucune coordonnée inventée) ; refusé en production.
> - `scripts/check-bundles.ts` écarte aussi les morceaux propres à l'admin (D-T6a).
> - **Constat ouvert** : la 404 est rendue côté client (enveloppe HTML d'erreur de Next sans
>   JavaScript, statut 404 correct). Sans impact SEO (page noindex), à corriger avant le
>   lancement (voir Phase 10).

**Checkpoint** : base migrée et peuplée, métadonnées, JSON-LD commun, sitemap et robots opérationnels ; les parcours peuvent démarrer.

---

## Phase 3 : User Story 3 — L'équipe gère le catalogue sans développeur (Priority: P3)

**Goal** : l'équipe publie en FR/EN avec des garde-fous (300 mots, alt, provenance, unicité des
méta), et toute adresse modifiée ou retirée est redirigée automatiquement.

**Independent Test** : dans l'admin, publier un contenu sans `alt` EN est refusé ; changer un
slug crée une redirection 301 ; une publication déclenche la revalidation.

- [X] T064 [US3] Créer `src/hooks/publishGuards.ts` : refuse la publication si un média utilisé n'a pas son `alt` FR/EN ou sa provenance, si `body` fait moins de 300 mots, si un séjour n'a pas de politique d'annulation, ou si les méta dépassent leurs limites ; EN incomplet → `enPublished = false` et avertissement, sans bloquer la publication FR
- [X] T065 [P] [US3] Créer `src/hooks/uniqueMeta.ts` : `metaTitle` et `metaDescription` uniques par langue sur toutes les collections publiques et `pages`
- [X] T066 [US3] Créer `src/hooks/autoRedirect.ts` : slug modifié → 301 ancien → nouveau par langue ; dépublication **ou suppression** → 301 vers `replacementTarget`, sinon vers la liste parente ; slug d'univers modifié → 301 pour chaque expérience imbriquée ; aplatissement des chaînes (seo CHK034, CHK035)
- [X] T067 [P] [US3] Écrire `tests/unit/autoRedirect.test.ts` : changement de slug, dépublication avec et sans remplacement, cascade d'univers, aplatissement
- [X] T068 [US3] Créer `src/app/api/redirects/route.ts` (table compilée, mise en cache avec le tag `redirects`) et l'appliquer dans `src/middleware.ts` ; ajouter dans `next.config.ts` les redirections des segments fixes renommés (seo CHK036)
- [X] T069 [US3] Configurer la liste des demandes dans `src/collections/Requests.ts` (colonnes référence, date, prénom, arrivée, voyageurs, statut, alerte si `notifiedAt` est vide ; filtres par statut ; accès `editor`)
- [X] T070 [P] [US3] Ajouter dans `src/payload.config.ts` l'aperçu de la page publique (`admin.preview`) et des descriptions de champs en français pour les éditeurs
- [X] T071 [P] [US3] Créer `src/jobs/purgeRequests.ts` (suppression des demandes de plus de 24 mois hors `won`, purge de `rateLimits` après 24 h) et créer `vercel.json` avec sa tâche planifiée (complété par T173)
- [X] T072 [US3] Écrire `tests/e2e/us3-editor.spec.ts` (projet `desktop`, D5) : publication refusée sans `alt` EN, refusée sous 300 mots, redirection créée après changement de slug, appel de revalidation déclenché

> **Écarts d'implémentation phase 3 (2026-11-15)** :
> - T064 : les règles portées par les champs (300 mots, SEO, conditions d'annulation) restent
>   dans leur validation ; `publishGuards.ts` ajoute le contrôle des photos référencées (alt FR
>   et EN, provenance). L'avertissement « version anglaise incomplète » est la case en lecture
>   seule `localeStatus.enPublished` de l'admin.
> - T065 : l'unicité (déjà active en 2B) est extraite dans `src/hooks/uniqueMeta.ts`.
> - T066 : redirections calculées en comparant l'état public du document principal avant et
>   après l'opération ; un brouillon n'en crée jamais (logique pure dans `src/lib/redirects/`).
> - T068 : table servie par `/api/redirect-table` (`/api/redirects` est l'API REST de Payload) ;
>   le middleware la garde 30 s en mémoire (`REDIRECTS_TTL_MS`) et applique la redirection sur
>   la forme canonique (un seul saut) ; segments renommés listés dans
>   `src/i18n/renamedSegments.ts` (vide).
> - T071 : purge par la route protégée `/api/cron/purge` (`CRON_SECRET`) déclenchée par
>   `vercel.json`, plutôt que par la file de tâches de Payload (inutile pour une seule tâche).
> - Playwright démarre toujours un serveur neuf (`reuseExistingServer: false`).

**Checkpoint** : l'équipe publie de façon sûre ; la vérification côté public se fait en T111.

---

## Phase 4 : User Story 1 — Catalogue des séjours : fiche, liste, accueil (Priority: P1) 🎯

**Goal** : sur 360 px, le visiteur trouve un week-end tout compris depuis l'accueil, filtre la
liste et lit une fiche complète (la demande arrive en phase 8).

**Independent Test** : en 3G sur Android 360 px, accueil → recherche → liste filtrée « week-end »
→ fiche séjour avec prix XOF/€, programme, inclus et conditions d'annulation.

### Composants partagés

- [X] T073 [P] [US1] Créer les composants `src/components/ui/{Button,Chip,Section,Container,Price}.tsx` (cibles ≥ 44 px, variantes écrites à la main (objets de classes typés ; tailwind-variants refusé par le propriétaire), `Price` en chiffres tabulaires avec XOF TTC et « ≈ … € (indicatif) », passage à la ligne autorisé à 200 %)
- [X] T074 [P] [US1] Créer `src/components/ui/CmsImage.tsx` (`next/image`, `sizes` mobile d'abord, placeholder flou, `priority` réservé à l'image principale, `alt` de la langue, largeur et hauteur explicites) et régler `images` dans `next.config.ts` (`formats: ['image/avif','image/webp']`, `deviceSizes: [360,414,640,768,1024,1280,1600]`, qualité 60) ; pour l'image principale, `sizes` plafonnant la largeur demandée à 1 080 px sur mobile et qualité 50, afin de rester sous 120 Ko à densité 3 (analyse P3)
- [X] T075 [P] [US1] Créer `src/components/ui/StickyActionBar.tsx` (fixe en bas sous `md`, marge `env(safe-area-inset-bottom)`, libellé selon le type de page : séjour « Demander ce séjour », expérience ou hébergement « Ajouter à ma demande », destination « Voir les séjours à {lieu} » ; lien WhatsApp) ; composant serveur sans JS : le clavier virtuel est géré par `interactiveWidget` (T028), pas de hook client (analyse K2)
- [X] T076 [P] [US1] Créer `src/lib/whatsapp.ts` (lien `wa.me` avec message FR/EN contenant le titre et l'URL de la page) et `tests/unit/whatsapp.test.ts`
- [X] T077 [P] [US1] Créer `src/components/client/Gallery.tsx` : défilement natif `scroll-snap` (fonctionne sans JS), boutons précédent / suivant de 44 px (WCAG 2.5.1), position « 3 / 12 » annoncée poliment, flèches du clavier, images différées sauf la première, marges latérales de 16 px pour éviter le conflit avec le geste retour ; pas de plein écran dans ce MVP
- [X] T078 [P] [US1] Créer `src/components/ui/MapIllustration.tsx` et `public/maps/*.svg` (SVG en ligne avec `title` et `desc`, destination mise en évidence)

### Fiche séjour

- [X] T079 [US1] Créer `src/lib/seo/jsonld/touristTrip.ts` et `src/lib/seo/jsonld/faq.ts` selon [jsonld.md](./contracts/jsonld.md), avec `tests/unit/jsonld-stay.test.ts`
- [X] T080 [US1] Créer `src/components/views/StayView.tsx` : H1, image principale prioritaire, faits clés, prix « à partir de » + base, conditions d'annulation près du prix, programme jour par jour (`ol`), inclus / non inclus, galerie, carte, FAQ (`details`), liens vers destinations, hébergements et expériences, séjours similaires (même destination d'abord, puis le plus d'envies communes, puis `featured`, 3 au maximum : seo CHK039), fil d'Ariane, barre collante
- [X] T081 [US1] Créer le résolveur `src/app/(frontend)/[locale]/[...segments]/page.tsx` (route `stay` : `generateStaticParams` FR + EN publiés, `generateMetadata` via `buildMetadata` avec alternates issus des slugs, `notFound()` sinon) et `opengraph-image.tsx` dans le même dossier
- [X] T082 [US1] Ajouter les séjours (images, alternates, `lastModified` réel) dans `src/lib/seo/sitemapEntries.ts`
- [X] T083 [P] [US1] Écrire `tests/e2e/stay.mobile.spec.ts` : H1 et prix visibles, barre collante présente au défilement et ne masquant jamais le focus, cibles ≥ 44 px, galerie au doigt et aux boutons, pas de défilement horizontal à 360 px, paysage, zoom à 200 % (barre ≤ 25 % de la hauteur), axe page et FAQ ouverte, parcours au clavier jusqu'à la barre
- [X] T084 [P] [US1] Écrire `tests/e2e/stay.seo.spec.ts` (projet `nojs`) : title et description uniques et dans les limites, H1 unique, canonical, hreflang réciproques, image OG 1200×630 accessible, JSON-LD TouristTrip + BreadcrumbList (+ FAQPage), fil d'Ariane identique au visible, au moins 300 mots, présence dans le sitemap, index
- [X] T085 [US1] Ajouter 1 fiche séjour FR et EN dans `lighthouserc.json`

### Liste des séjours

- [X] T086 [US1] Créer `src/lib/filters.ts` (lecture et écriture des paramètres `duree`, `envie`, `budget`, application aux séjours)
- [X] T087 [P] [US1] Écrire `tests/unit/filters.test.ts`
- [X] T088 [P] [US1] Créer `src/components/cards/StayCard.tsx` (un seul lien par carte, image différée, durée, prix « à partir de »)
- [X] T089 [US1] Créer `src/components/client/FilterSheet.tsx` : panneau qui monte du bas (hauteur max 85 dvh, défilement interne), puces ≥ 44 px, bouton d'application « Voir N séjours » et « Réinitialiser » (mobile CHK026), fermeture par bouton, glissement vers le bas, fond, Échap et bouton retour d'Android, focus enfermé puis rendu, synchronisation de l'URL ; bouton d'ouverture rendu seulement avec JS (sans JS : tous les séjours affichés)
- [X] T090 [US1] Créer `src/components/views/StaysListView.tsx` (H1 et méta depuis `pages.stays_list`, nombre de résultats en `aria-live`, grille 1 → 2 → 3 colonnes, filtrage côté client sur la liste complète rendue au build, état vide avec lien WhatsApp) et la route `stays_list` dans le résolveur (métadonnées, ItemList, canonical sans paramètres)
- [X] T091 [P] [US1] Écrire `tests/e2e/stays-list.mobile.spec.ts` : panneau ouvert depuis le bas, application qui met à jour le nombre, bouton retour qui ferme le panneau, état vide, axe panneau ouvert, hauteur du panneau en paysage, zoom à 200 %, clavier
- [X] T092 [P] [US1] Écrire `tests/e2e/stays-list.seo.spec.ts` (projet `nojs`) : métadonnées, canonical sans paramètres de filtre, ItemList, fil d'Ariane, sitemap
- [X] T093 [US1] Ajouter la liste des séjours FR et EN dans `lighthouserc.json`

### Accueil

- [X] T094 [US1] Créer `src/components/views/HomeSearch.tsx` (composant **serveur** : `<form method="get">` dans un `<dialog>` qui monte du bas, ouvert par `DialogOpener` de T030) : sur mobile, bouton « Trouver mon séjour » en bas du héro (zone du pouce : mobile CHK009) ; champs dates (`type="date"`), voyageurs (`type="number"`, `inputmode="numeric"`, boutons de 44 px) et envies (cases à cocher en puces) (mobile CHK021) ; envoie vers `/fr/sejours?duree=&envie=&arrivee=&depart=&adultes=` ; sans JS, le formulaire est affiché en ligne sous le héro (analyse K3)
- [X] T095 [US1] Créer `src/components/views/HomeView.tsx` selon FR-001 : héro image prioritaire (élément LCP) et H1 « Le Saloum, vécu de l'intérieur », recherche, garanties, séjours vedettes, 4 univers, aperçu du film (affiche + lien), destinations, étapes de demande, engagement, appel WhatsApp
- [X] T096 [US1] Remplacer la page témoin `src/app/(frontend)/[locale]/page.tsx` : contenu de `pages.home`, métadonnées, JSON-LD Organization + WebSite
- [X] T097 [P] [US1] Écrire `tests/e2e/home.mobile.spec.ts` : élément LCP = image principale ≤ 120 Ko en AVIF ou WebP, bouton de recherche dans la zone du pouce, page utile si la vidéo est bloquée (requêtes Mux interrompues), axe, 360 px, paysage, zoom à 200 %
- [X] T098 [P] [US1] Écrire `tests/e2e/home.seo.spec.ts` (projet `nojs`) : métadonnées, hreflang, Organization + WebSite, H1 unique
- [X] T099 [US1] Écrire `tests/e2e/us1-catalogue.mobile.spec.ts` (Android 360, profil `3g`) : accueil → recherche → liste « week-end » → fiche ; durée mesurée et enregistrée (la limite de 120 s porte sur le parcours complet en T152)

> **Écarts d'implémentation phase 4 (2026-11-15)** :
> - **Dérogation D-LCP-photo** (plan.md) : LCP de laboratoire ≤ 2,7 s pour les pages dont
>   l'élément LCP est une photo (fiches et listes de séjours), 2,0 s ailleurs ; réévaluation
>   obligatoire avec les vraies photos et les données terrain avant le lancement.
> - T074 : images rendues côté serveur par `getImageProps` (pas de composant client
>   `<Image>` à hydrater), image principale préchargée par `preload()` de React, placeholder
>   flou réservé aux images différées ; un seul `sharp` (0.34.5) pour Next et Payload (deux
>   libvips chargés empêchaient l'optimisation).
> - Polices : `@font-face` latines dans `globals.css` (fichiers `public/fonts`, cache
>   immuable) au lieu de `next/font/google` (18 sous-ensembles téléchargés), métriques de repli
>   reprises de next/font ; une seule feuille CSS bloquante.
> - T075 : barre collante fixée seulement sur téléphone en portrait (hauteur ≥ 500 px), dans
>   le flux en paysage bas ou à 200 % de zoom ; action principale active dès la livraison de
>   la page de demande (phase 8), WhatsApp entre-temps.
> - T078 : carte générée depuis les coordonnées GPS du CMS (pas de fichiers `public/maps`).
> - T081 : images de partage par la route `/og/[collection]/[id]` (vraie photo recadrée).
> - T094 : recherche en formulaire intégré sous le héro (bouton du héro = ancre dans la zone
>   du pouce) plutôt qu'en `<dialog>` : identique avec ou sans JavaScript.
> - T095 : sections univers et destinations sans lien tant que leurs pages ne sont pas
>   livrées ; aperçu du film ajouté avec sa page (phase 7).
> - Seed : numéro WhatsApp FICTIF de démonstration (`+221700000000`, jamais en production) ;
>   `pnpm seed` et `pnpm migrate` vident le cache de données de Next.
> - Mesure (T099) : parcours accueil → recherche → liste → fiche en 3G : 6,6 s.

**Checkpoint** : catalogue des séjours consultable et indexable sur mobile.

---

## Phase 5 : User Story 2 — Fiche expérience, hub et univers (Priority: P2)

**Goal** : un visiteur venu de Google comprend l'expérience et son prix dès le premier écran.

**Independent Test** : URL directe d'une fiche expérience sans JS : durée, niveau, saison,
départ et prix XOF/€ dans le premier écran 360×800 ; JSON-LD TouristAttraction valide.

- [X] T100 [P] [US2] Créer `src/components/cards/ExperienceCard.tsx`
- [X] T101 [US2] Créer `src/lib/seo/jsonld/touristAttraction.ts` (+ Offer XOF par personne) et `tests/unit/jsonld-experience.test.ts`
- [X] T102 [US2] Créer `src/components/views/ExperienceView.tsx` : bloc de faits clés dans le premier écran (durée, niveau, mois de saison, point de départ, prix par personne : mobile CHK003), texte, galerie, destination, séjours qui l'incluent, 3 expériences de la même destination, FAQ, fil d'Ariane Accueil › Expériences › Univers › Fiche (seo CHK024), barre collante « Ajouter à ma demande » (lien `/demande?experience=` jusqu'à la phase 8)
- [X] T103 [P] [US2] Créer `src/components/views/UniverseView.tsx` et `src/components/views/ExperiencesHubView.tsx` (H1 « Que faire au Sine-Saloum » / « Things to do in Sine-Saloum », ItemList)
- [X] T104 [US2] Ajouter au résolveur les routes `experience` (univers + slug), `universe` et `experiences_hub` (params statiques, métadonnées, image OG)
- [X] T105 [US2] Ajouter expériences, univers et hub dans `src/lib/seo/sitemapEntries.ts`
- [X] T106 [P] [US2] Écrire `tests/e2e/experience.mobile.spec.ts` : faits clés et prix dans le premier écran 360×800, cibles, axe, zoom à 200 %, paysage
- [X] T107 [P] [US2] Écrire `tests/e2e/experience.seo.spec.ts` (projet `nojs`) : métadonnées, TouristAttraction + Offer XOF, fil d'Ariane à 4 niveaux, au moins 300 mots, aperçu OG
- [X] T108 [P] [US2] Écrire `tests/e2e/experiences-hub.mobile.spec.ts` (hub et une page d'univers)
- [X] T109 [P] [US2] Écrire `tests/e2e/experiences-hub.seo.spec.ts` (hub et univers : ItemList, fil d'Ariane, sitemap)
- [X] T110 [US2] Ajouter fiche expérience, hub et univers FR et EN dans `lighthouserc.json`
- [X] T111 [US3] Écrire `tests/e2e/us3-publication.spec.ts` : création d'une expérience bilingue dans l'admin → après revalidation, fiche FR et EN en ligne, présente dans son univers, sur sa destination et dans le sitemap ; EN incomplet → page EN absente et sans hreflang

> **Écarts d'implémentation phase 5 (2026-11-15)** :
> - T101 : `TouristAttraction` est un `Place` et ne peut pas porter d'offre (schema.org) :
>   l'expérience est décrite par un `TouristAttraction` (lieu) et un `TouristTrip` qui porte
>   l'offre XOF par personne (contrat jsonld.md aligné).
> - T103 : une seule vue `ExperiencesListView` pour le hub et les pages d'univers.
> - T102 : destination affichée sans lien et décrite en ligne dans le JSON-LD jusqu'à la
>   livraison de sa page (phase 6) ; « Ajouter à ma demande » active en phase 8.
> - Sitemap rendu à la demande (`force-dynamic`) : toujours à jour après publication, lectures
>   servies par le cache de données.
> - Dérogation D-LCP-photo étendue aux URL `/fr/experiences…` et `/en/experiences…`
>   (pages dont le LCP est une photo, comme prévu à leur livraison).

**Checkpoint** : les fiches expérience servent d'entrées SEO autonomes.

---

## Phase 6 : User Story 2 — Destinations et hébergements (Priority: P2)

**Goal** : chaque destination et chaque hébergement a sa page indexable, reliée au reste du
catalogue.

**Independent Test** : la page Ndangane liste ses séjours, expériences et hébergements, sans
section vide ; la fiche villa est complète et balisée.

- [ ] T112 [P] [US2] Créer `src/components/cards/DestinationCard.tsx` et `src/components/cards/AccommodationCard.tsx`
- [ ] T113 [US2] Créer `src/lib/seo/jsonld/touristDestination.ts` (`village` ou `ile` → TouristDestination ; `reserve` → TouristAttraction : seo CHK017) et `tests/unit/jsonld-destination.test.ts`
- [ ] T114 [US2] Créer `src/components/views/DestinationView.tsx` : H1, intro, texte, galerie, carte, sections séjours, expériences et hébergements masquées si vides, barre collante « Voir les séjours à {lieu} » + WhatsApp, fil d'Ariane
- [ ] T115 [US2] Créer `src/components/views/DestinationsListView.tsx`, ajouter les routes `destination` et `destinations_list` au résolveur (métadonnées, OG, JSON-LD ItemList + BreadcrumbList pour la liste) et au sitemap (analyse M1)
- [ ] T116 [P] [US2] Écrire `tests/e2e/destination.mobile.spec.ts` (destination et liste : 360 px, paysage, zoom, axe, barre collante)
- [ ] T117 [P] [US2] Écrire `tests/e2e/destination.seo.spec.ts` (projet `nojs` ; destination et liste : métadonnées, JSON-LD par `kind`, maillage vers les contenus du lieu, sitemap)
- [ ] T118 [US2] Créer `src/lib/seo/jsonld/lodging.ts` (VacationRental seulement pour une villa avec `identifier`, `bedrooms` et au moins 8 photos ; sinon LodgingBusiness : seo CHK018) et `tests/unit/jsonld-lodging.test.ts`
- [ ] T119 [US2] Créer `src/components/views/AccommodationView.tsx` (capacité, équipements, photos, emplacement, séjours qui l'incluent, hébergements de la même destination) et `src/components/views/AccommodationsListView.tsx` (puces de type), avec les routes, les métadonnées, le JSON-LD (ItemList + BreadcrumbList pour la liste) et le sitemap (analyse M1)
- [ ] T120 [P] [US2] Écrire `tests/e2e/accommodation.mobile.spec.ts` (fiche et liste)
- [ ] T121 [P] [US2] Écrire `tests/e2e/accommodation.seo.spec.ts` (projet `nojs` ; fiche et liste)
- [ ] T122 [US2] Ajouter destination, liste des destinations, fiche hébergement et liste des hébergements FR et EN dans `lighthouserc.json`

**Checkpoint** : tous les contenus du catalogue sont indexables et reliés.

---

## Phase 7 : User Story 4 — Film d'immersion et pages institutionnelles (Priority: P4)

**Goal** : le visiteur hésitant regarde le film (sans octet vidéo avant le clic sur mobile),
lit l'engagement et l'équipe, et trouve FAQ, contact et pages légales.

**Independent Test** : sur mobile, aucune requête vidéo avant le clic ; le chapitre `?t=`
fonctionne ; sous-titres FR et EN disponibles.

- [ ] T123 [US4] Créer `src/lib/mux.ts` (URL HLS, rendu MP4 statique, URL d'affiche) et un hook dans `src/collections/Videos.ts` qui vérifie le `muxPlaybackId` et renseigne la durée via l'API Mux
- [ ] T124 [US4] Créer `src/components/client/VideoPlayer.tsx` : affiche via `CmsImage`, bouton lecture de 44 px avec nom accessible, aucun `src` et `preload="none"` avant le clic, puis `import()` de la **version allégée** de hls.js (`hls.js/dist/hls.light.mjs`, pour tenir le budget de 100 Ko du code à la demande : analyse P2 ; HLS natif sur Safari), pistes de sous-titres FR/EN (langue de la page par défaut), commandes natives au clavier, liste de chapitres en boutons, prise en compte de `?t=` après lecture (perf-a11y CHK043)
- [ ] T125 [US4] Créer `src/components/client/AmbientLoop.tsx` : seulement si `(min-width: 1024px) and (pointer: fine)`, ni mouvement réduit ni `Save-Data`, après `load` ; MP4 ≤ 1,5 Mo ; vidéo décorative `aria-hidden` ; **bouton pause/lecture visible** (WCAG 2.2.2 : perf-a11y CHK042)
- [ ] T126 [US4] Créer `src/components/views/FilmView.tsx` : H1, lecteur principal, chapitres (liens `?t=`), grille des vidéos verticales 9:16, section « Transcription descriptive » (`descriptiveTranscript`) ; piste d'audiodescription en attente de D4
- [ ] T127 [US4] Créer `src/lib/seo/jsonld/video.ts` (VideoObject + Clip, `endOffset` = début du chapitre suivant, `contentUrl` = rendu MP4 : seo CHK019) et `tests/unit/jsonld-video.test.ts`
- [ ] T128 [US4] Ajouter la route `film` au résolveur (métadonnées, OG = affiche) et les entrées vidéo du sitemap dans `src/lib/seo/sitemapEntries.ts`
- [ ] T129 [P] [US4] Écrire `tests/e2e/film.mobile.spec.ts` : aucune requête vers `stream.mux.com` avant le clic, HLS après le clic, `?t=`, pistes de sous-titres présentes, pas de lecture automatique avec mouvement réduit ou `Save-Data`, orientation non bloquée, axe, lecture au clavier
- [ ] T130 [P] [US4] Écrire `tests/e2e/film.seo.spec.ts` (projet `nojs`) : VideoObject + Clip, balises vidéo du sitemap, métadonnées
- [ ] T131 [P] [US4] Écrire `tests/e2e/ambient-loop.desktop.spec.ts` : boucle seulement sur ordinateur, bouton pause opérationnel, aucune boucle avec mouvement réduit ou `Save-Data`
- [ ] T132 [US4] Intégrer `AmbientLoop` au héro de l'accueil (ordinateur seulement ; l'image reste l'élément LCP) dans `src/components/views/HomeView.tsx`
- [ ] T133 [P] [US4] Créer le rendu des blocs `src/components/blocks/{Hero,RichText,Team,Figures,Gallery,Steps,Guarantees,Cta}.tsx` (composants serveur)
- [ ] T134 [US4] Ajouter au résolveur les pages `commitment`, `about` (membres de l'équipe), `faq` (FAQPage par catégorie), `contact` (NAP de `siteSettings`, WhatsApp, carte, ContactPage), `legal` (noindex, hors sitemap) et `privacy`, avec JSON-LD AboutPage, ContactPage ou WebPage
- [ ] T135 [US4] Ajouter le **registre des traitements** à la page Confidentialité (bloc `src/blocks/ProcessingRegister.ts` et rendu `src/components/blocks/ProcessingRegister.tsx`, contenu FR et EN dans `src/seed/index.ts`) : pour les demandes de séjour, la mesure d'audience, les comptes de l'équipe et la limitation de débit, indiquer la finalité, la base légale, la durée de conservation, les destinataires (hébergeur, Resend, Plausible, Mux) et les transferts hors du Sénégal ; ajouter dans `launch/checklist.md` (T176) la vérification par un juriste de la déclaration à la CDP (loi 2008-12) (analyse C4, constitution IX)
- [ ] T136 [P] [US4] Écrire `tests/e2e/editorial.mobile.spec.ts` (les 6 pages : 360 px, cibles, axe, zoom, FAQ au clavier)
- [ ] T137 [P] [US4] Écrire `tests/e2e/editorial.seo.spec.ts` (projet `nojs`) : métadonnées, FAQPage sur la FAQ, mentions légales en noindex et hors sitemap, NAP identique dans le pied de page, la page contact et le JSON-LD
- [ ] T138 [US4] Ajouter film, FAQ, engagement et à propos FR et EN dans `lighthouserc.json`

**Checkpoint** : film et contenus de confiance en ligne.

---

## Phase 8 : Demande de séjour et lien WhatsApp (US1, US2, US4)

**Goal** : compléter US1 (demande envoyée en moins de 2 min), l'ajout à la demande depuis
une fiche (US2) et le contact WhatsApp contextuel partout (US4).

**Independent Test** : parcours US1 complet en 3G sur 360 px en moins de 120 s, demande
enregistrée et e-mail envoyé ; fonctionne aussi sans JavaScript.

- [ ] T139 [P] [US1] Créer `src/lib/request/schema.ts` selon [request-form.md](./contracts/request-form.md#3-schéma-de-validation-serveur-zod) et `tests/unit/request-schema.test.ts` (dates passées, départ avant arrivée, E.164, consentement, honeypot)
- [ ] T140 [P] [US1] Créer `src/lib/request/rateLimit.ts` (SHA-256 salé, 5 par heure, table `rateLimits`) et `tests/unit/rateLimit.test.ts`
- [ ] T141 [US1] Créer la Server Action `src/lib/request/submit.ts` selon la séquence du contrat : honeypot ou envoi trop rapide → `ok` factice, limitation, idempotence `submissionId`, résolution des éléments, création de la demande, e-mail Resend, `notifiedAt`, `whatsappUrl`, redirection 303 sans JS (D2)
- [ ] T142 [P] [US1] Créer `src/lib/request/email.tsx` (version texte et HTML : tous les champs, langue, page d'origine, référence)
- [ ] T143 [P] [US1] Créer `src/lib/request/draft.ts` (stockage local `se.request.v1` dans `try/catch`, expiration à 30 jours, 10 éléments au maximum, sans doublon, repli par paramètre d'URL) et `tests/unit/draft.test.ts`
- [ ] T144 [US1] Créer `src/components/client/RequestForm.tsx` (`useActionState`) : champs, types de clavier, `autocomplete` et `inputmode` du contrat, indicatif +221 par défaut, steppers de 44 px, conditions d'annulation au-dessus du bouton, consentement, honeypot, `startedAt`, `submissionId` ; en cas d'erreur, focus sur le premier champ fautif, `aria-describedby` et résumé en `aria-live` (mobile CHK023) ; bouton d'envoi collant en bas du formulaire sur mobile (mobile CHK010) ; hors ligne, saisies conservées, message et lien WhatsApp ; double envoi bloqué
- [ ] T145 [US1] Créer `src/components/views/RequestView.tsx` (formulaire puis confirmation : référence, récapitulatif, `responseTimeText`, mention « les dates sont des souhaits », bouton principal « Envoyer aussi sur WhatsApp ») et `src/components/views/ThankYouView.tsx` ; routes `request` et `thank_you` en noindex, sans JSON-LD, hors sitemap ; titres des éléments résolus côté serveur dans la langue courante
- [ ] T146 [US1] Créer `src/jobs/retryNotifications.ts` : toutes les 10 min, relance des demandes dont `notifiedAt` est vide (3 essais au plus, compteur `notifyAttempts`), puis alerte à `siteSettings.fallbackNotificationEmail` ; `tests/unit/retryNotifications.test.ts` ; tâche planifiée dans `vercel.json` (spec FR-013, SC-009 : analyse G1)
- [ ] T147 [P] [US2] Créer `src/components/client/AddToRequest.tsx` et `src/components/client/RequestCounter.tsx` (en-tête, moins de 3 Ko, annonce « ajouté à votre demande ») et les brancher sur `StickyActionBar` (expérience et hébergement : ajout ; séjour : ajout puis ouverture du formulaire)
- [ ] T148 [US1] Transmettre dates et voyageurs par l'URL (accueil → liste → fiche → formulaire) et pré-remplir le formulaire depuis ces paramètres, le brouillon local ne servant qu'en complément quand JavaScript est disponible (analyse K3)
- [ ] T149 [P] [US4] Brancher `src/lib/whatsapp.ts` sur l'en-tête, le menu, le pied de page, la barre collante et la page contact (message contextuel avec titre et URL, `rel="noopener"`)
- [ ] T150 [P] [US1] Écrire `tests/e2e/request.mobile.spec.ts` (Android 360, profil `3g`) : attributs de clavier de chaque champ, focus sur la première erreur, double tap sans doublon, coupure réseau pendant l'envoi (saisies conservées + repli WhatsApp), confirmation, axe sur les états formulaire, erreur et confirmation, envoi **au clavier seul** (perf-a11y CHK045), zoom à 200 %, paysage
- [ ] T151 [P] [US1] Écrire `tests/e2e/request.nojs.spec.ts` (projet `nojs`) : envoi sans JS → 303 vers la confirmation, noindex des deux pages, absence du sitemap
- [ ] T152 [US1] Écrire `tests/e2e/us1-journey.mobile.spec.ts` (Android 360, `3g`) : accueil → demande envoyée en **120 s au plus**, ligne `requests` créée, e-mail capturé (Resend en mode test) (SC-003)
- [ ] T153 [P] [US2] Écrire `tests/e2e/us2-journey.mobile.spec.ts` : arrivée directe sur une fiche expérience → ajout → l'expérience figure dans le formulaire
- [ ] T154 [P] [US4] Écrire `tests/e2e/us4-whatsapp.mobile.spec.ts` : chaque route publique du sitemap contient un lien `wa.me` avec le titre de la page, dans sa langue
- [ ] T155 [US1] Ajouter `/fr/demande` et `/en/request` dans `lighthouserc.json` avec Perf, A11y et BP vérifiés, mais pas la catégorie SEO (constitution v1.0.1, pages noindex)

**Checkpoint** : US1, US2 et US4 complets ; le site génère des demandes.

---

## Phase 9 : User Story 5 — Bascule de langue sur la même page (Priority: P5)

**Goal** : l'anglophone passe en anglais sans quitter la page, et sa demande est conservée.

**Independent Test** : 10 pages FR de types différents mènent à leur équivalent EN ; une page
sans EN mène à la page parente avec un message.

- [ ] T156 [US5] Créer `src/components/ui/LocaleSwitcher.tsx` (composant serveur : liens calculés depuis les alternates de la page, repli sur la page parente avec `?from=missing`, cible ≥ 44 px) et `src/components/ui/MissingTranslationNotice.tsx` ; les brancher dans l'en-tête de chaque vue
- [ ] T157 [P] [US5] Créer `src/components/client/EnglishBanner.tsx` : bandeau refermable si la langue du navigateur est l'anglais sur une page FR, choix mémorisé localement, aucune redirection
- [ ] T158 [P] [US5] Écrire `tests/e2e/us5-locale.mobile.spec.ts` : 10 pages FR de types différents → page EN équivalente, page sans EN → parente + message, brouillon de demande conservé, sélecteur atteignable au pouce
- [ ] T159 [P] [US5] Écrire `tests/e2e/locale.seo.spec.ts` (projet `nojs`) : réciprocité des hreflang pour toutes les URL du sitemap, `x-default` = FR
- [ ] T160 [US5] Ajouter dans `src/i18n/messages/en.json` toutes les chaînes d'interface manquantes et un test `tests/unit/messages.test.ts` qui vérifie que FR et EN ont exactement les mêmes clés

**Checkpoint** : les 5 parcours sont livrés.

---

## Phase 10 : Polish — optimisation finale et vérification des budgets

- [ ] T161 Créer `src/lib/analytics.ts` et `src/components/client/Analytics.tsx` (Plausible chargé en `requestIdleCallback`, file d'attente) et brancher les évènements de [analytics-events.md](./contracts/analytics-events.md)
- [ ] T162 [P] Créer `src/components/client/WebVitals.tsx` (web-vitals → évènement `web_vital` avec modèle de route et tranche de valeur)
- [ ] T163 [P] Écrire `tests/e2e/third-party.spec.ts` : aucun script tiers dans le HTML initial, Plausible seulement après inactivité, aucune requête de police vers un domaine externe, 2 familles de polices au plus (perf-a11y CHK023, CHK029)
- [ ] T164 [P] Écrire `tests/e2e/inp.mobile.spec.ts` : INP mesuré (web-vitals, `reportAllChanges`) sur Android 360 avec processeur ×4 pour : ouvrir le panneau de filtres, appliquer, galerie suivante, ajouter à la demande, envoyer ; chacun ≤ 200 ms (perf-a11y CHK009)
- [ ] T165 [P] Écrire `tests/e2e/cls-interaction.spec.ts` : CLS cumulé pendant un défilement complet de chaque type de page (images différées, barre collante, compteur) ≤ 0,1 (perf-a11y CHK012)
- [ ] T166 [P] Écrire `tests/e2e/lcp-image.spec.ts` : pour chaque type de page, l'élément LCP est une image AVIF ou WebP de 120 Ko au plus, avec largeur et hauteur (perf-a11y CHK019, CHK020)
- [ ] T167 [P] Écrire `tests/e2e/no-hover.spec.ts` (tactile, sans survol) : menus, cartes, galerie et filtres utilisables sans survol (mobile CHK040)
- [ ] T168 [P] Écrire `tests/e2e/3g.mobile.spec.ts` (Android 360, profil `3g`) : pour chaque type de page publique, H1 et contenu principal lisibles en 5 s au plus, action principale utilisable (spec FR-020 : analyse P1)
- [ ] T169 [P] Écrire `tests/unit/contrast.test.ts` : contraste de toutes les paires de jetons texte/fond (≥ 4,5:1), du texte sur `scrim` (≥ 4,5:1), de l'anneau de focus, des bordures de champs et des icônes (≥ 3:1) (perf-a11y CHK031, CHK032)
- [ ] T170 Créer `src/lib/seo/keywords.ts` : les 10 mots-clés FR, leurs équivalents EN et la page principale de chacun (D3 : seo CHK042, CHK043)
- [ ] T171 Compléter `scripts/seo-check.ts` : couverture des mots-clés de `keywords.ts` (une page principale indexable par mot-clé et par langue, aucune autre page avec le même `targetKeyword`), différence entre sitemap et pages crawlées, chaînes de redirection
- [ ] T172 Passe de performance : analyser `pnpm bundles` et les rapports LHCI, différer les îlots restants, ne précharger que l'image LCP, retirer le CSS inutilisé, ajuster `deviceSizes` et la qualité, jusqu'à ce que toutes les URL de `lighthouserc.json` passent
- [ ] T173 Créer `vercel.json` : région `cdg1`, tâches planifiées, en-têtes de sécurité (CSP autorisant Mux et Plausible), cache des ressources statiques, `X-Robots-Tag: noindex` sur `/admin`
- [ ] T174 [P] Rédiger `specs/001-site-public-vitrine/launch/manual-a11y-audit.md` : protocole TalkBack (Chrome Android) et VoiceOver (iOS) sur les 5 parcours, à exécuter par une personne avant le lancement (perf-a11y CHK052)
- [ ] T175 [P] Rédiger `specs/001-site-public-vitrine/launch/latency-dakar.md` : mesure du TTFB et du LCP depuis un mobile 4G à Dakar et à Ndangane, seuil de décision du CDN (TTFB p75 > 600 ms) (plan T5)
- [ ] T176 [P] Rédiger `specs/001-site-public-vitrine/launch/checklist.md` : Rich Results et validateur Schema.org (1 URL par type), propriété de domaine Search Console et sitemap, objectifs Plausible, NAP identique à la fiche Google Business Profile, suivi du LCP terrain (personne désignée, revue hebdomadaire le premier mois : perf-a11y CHK007)
- [ ] T177 Dérouler [quickstart.md](./quickstart.md) de bout en bout sur un environnement propre et le mettre à jour avec les commandes finales

---

## Dependencies & Execution Order

### Phases

```text
Phase 1 Setup ──▶ Phase 2A SEO ──▶ Phase 2B CMS ──▶ Phase 3 US3
                                          │
                                          ├──▶ Phase 4 US1 catalogue ──▶ Phase 5 US2 expériences ──▶ Phase 6 US2 destinations/hébergements
                                          │                                     │
                                          │                                     └─ T111 (US3 côté public) dépend de T104
                                          ├──▶ Phase 7 US4 film/pages (dépend des composants T073–T078)
                                          └──▶ Phase 8 Demande (dépend des phases 4 à 7 pour brancher barres et liens)
                                                         └──▶ Phase 9 US5 ──▶ Phase 10 Polish
```

- Les phases 4 à 7 suivent l'ordre de valeur SEO demandé. Avec plusieurs développeurs, les
  phases 5, 6 et 7 peuvent démarrer en parallèle dès que T073 à T081 (composants partagés et
  résolveur) sont terminés.
- La phase 3 (US3) peut avancer en parallèle de la phase 4 : elle ne touche que `src/hooks/`
  et l'admin.

### Dans chaque phase

- Générateur JSON-LD et tests unitaires → vue → route du résolveur → sitemap → tests mobile et
  SEO → ajout dans `lighthouserc.json`.
- Le résolveur `src/app/(frontend)/[locale]/[...segments]/page.tsx` est modifié par T081, T090,
  T104, T115, T119, T128, T134 et T145 : ces tâches **ne sont pas parallélisables entre
  elles**.
- `src/lib/seo/sitemapEntries.ts` est modifié par T082, T105, T115, T119 et T128 (même
  remarque).

## Parallel Example: User Story 1

```text
# Composants partagés, tous en parallèle :
T073 Button/Chip/Section/Price · T074 CmsImage · T075 StickyActionBar · T076 whatsapp.ts · T077 Gallery · T078 MapIllustration

# Après T081 (résolveur) et T082 (sitemap), les deux tests de la fiche séjour en parallèle :
T083 stay.mobile.spec.ts · T084 stay.seo.spec.ts

# Phase 8, en parallèle :
T139 schema · T140 rateLimit · T142 email · T143 draft · T147 AddToRequest · T149 WhatsApp contextuel
```

## Parallel Example: User Story 2

```text
T100 ExperienceCard · T103 UniverseView + HubView   (pendant T101–T102)
T106 · T107 · T108 · T109                           (tests, après T104–T105)
T112 cartes · T116 · T117 · T120 · T121             (phase 6)
```

## Implementation Strategy

### MVP

1. Phases 1 à 2B (socle, SEO, CMS).
2. Phase 4 (catalogue des séjours), puis **directement** T139 à T145, T148, T150 à T152 de la
   phase 8 : le MVP strict est « séjours + demande ». C'est un écart volontaire à l'ordre
   imposé, à valider par le propriétaire ; sinon le premier envoi de demande n'arrive qu'après
   les phases 5 à 7.
3. **Stop and validate** : T152 (parcours US1 en moins de 120 s en 3G), LHCI vert.

### Livraison incrémentale (ordre imposé)

Socle → SEO → CMS + US3 → séjours (US1) → expériences (US2) → destinations et hébergements
(US2) → film et pages (US4) → demande et WhatsApp (US1, US2, US4) → langue (US5) → polish.
Chaque phase se termine par un checkpoint déployable avec ses tests mobile et SEO au vert.

## Notes

- 177 tâches, toutes inférieures à une demi-journée.
- Chaque type de page a sa paire de tests `*.mobile.spec.ts` et `*.seo.spec.ts` : fiche
  séjour (T083, T084), liste des séjours (T091, T092), accueil (T097, T098), fiche
  expérience (T106, T107), hub et univers (T108, T109), destination et liste (T116, T117),
  hébergement et liste (T120, T121), film (T129, T130), pages institutionnelles (T136, T137),
  demande (T150, T151), 404 (T039).
- Les points des checklists résolus par une tâche sont cités entre parenthèses (par exemple
  « seo CHK039 »).
