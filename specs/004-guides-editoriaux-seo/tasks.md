---
description: "Tâches de la feature 004 — Guides éditoriaux « Carnets du Saloum »"
---

# Tasks: Guides éditoriaux « Carnets du Saloum »

**Input**: Design documents from `/specs/004-guides-editoriaux-seo/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: constitution (principe VII) : tests unitaires de la logique et E2E mobile (360 px) + axe
obligatoires pour chaque story livrée. Tests écrits avant l'implémentation qu'ils couvrent.

**Organization**: tâches groupées par user story ; chaque story est livrable et testable seule.

## Format: `[ID] [P?] [Story] Description`

- **[P]** : parallélisable (fichiers différents, aucune dépendance sur une tâche non terminée)
- **[Story]** : US1 à US5 (spec.md)
- Chemins depuis la racine du dépôt (application unique Next.js + Payload)

---

## Phase 1: Setup

**Purpose**: lancer la production éditoriale (chemin critique, dépend de l'équipe locale) et
préparer les répertoires.

- [ ] T001 Envoyer à l'équipe de Ndangane les fiches de specs/004-guides-editoriaux-seo/content/questions.md (auteurs et sept guides) avec la demande de photos réelles, de provenance et d'accord de publication ; consigner la date d'envoi et les auteurs pressentis sous cette tâche
- [x] T002 [P] Créer content/carnets/fr/ et content/carnets/en/ avec un README.md décrivant le format des brouillons (front matter : `slug`, `title`, `standfirst`, `targetQuery`, `metaTitle` ≤ 60, `metaDescription` ≤ 155, `theme`, `author`, `reviewer`, `related` par type, `faq` ; corps Markdown avec H2/H3 et blocs `:::encadre`) dans content/carnets/README.md
- [x] T003 [P] Vérifier les prérequis de la 001 utilisés par la 004 (`contentDefaults`, `seoField`, `localeStatus`, `publishGuard`, `autoRedirect`, résolveur `[...segments]`, `TARGET_KEYWORDS`, écouteur `Analytics.tsx`) et consigner le résultat sous cette tâche ; arrêter si l'un manque

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: modèle de données, routes et logique pure partagés par toutes les stories.

**⚠️ CRITICAL**: aucune story ne commence avant la fin de cette phase.

- [x] T004 [P] Créer la collection `guideThemes` (`name` localisé obligatoire FR et EN, `order`) dans src/collections/GuideThemes.ts, lecture publique, écriture `admin`/`editor`, revalidation (`revalidateHooks`)
- [x] T005 [P] Ajouter à `teamMembers` les champs `slug` (texte unique, motif `isValidSlug`), `place` (localisé), `sameAs` (tableau d'URL) et `active` (case, défaut vrai) dans src/collections/TeamMembers.ts ; colonnes d'admin `name`, `role`, `slug`, `active`
- [x] T006 Créer la collection `guides` selon data-model.md (titre, chapeau, image principale, thème, auteur, relecteur, `requiresCommunityReview`, corps Lexical, FAQ, quatre relations `related*` ordonnées, `priority`, `targetQuery`, `publishedOn`, `updatedOn`, `substantiveUpdate`, `readingMinutes`, `seo`, `localeStatus`) avec `contentDefaults` dans src/collections/Guides.ts ; éditeur du corps limité à H2/H3, images de `media`, bloc « Encadré pratique » (`title`, `text`, `variant` info | attention) via `BlocksFeature` défini dans src/blocks/PracticalBox.ts
- [x] T007 Enregistrer `guides` et `guideThemes` dans src/payload.config.ts, créer la migration additive (`pnpm payload migrate:create guides`) dans src/migrations/, l'appliquer, régénérer src/payload-types.ts et l'import map de l'admin
- [x] T008 [P] Écrire les tests des routes `guidesHub`, `guide`, `author` (construction FR/EN, résolution des segments, segments inconnus) dans tests/unit/pathnames.test.ts
- [x] T009 Ajouter les routes `guidesHub` (`carnets-du-saloum` / `saloum-travel-guides`), `guide` (`slug`) et `author` (`equipe` / `team`, `slug`) à la union `Route`, à `buildPath` et `resolvePath` dans src/i18n/pathnames.ts jusqu'à faire passer T008
- [x] T010 Ajouter `guides` (route `guide`) et `teamMembers` (route `author`) aux collections routées de src/lib/redirects/paths.ts (`RoutedCollection`, `documentPath`) et appliquer `autoRedirectHooks` à `teamMembers` dans src/collections/TeamMembers.ts : un changement de slug d'un guide publié ou d'un auteur crée les redirections 301 FR et EN (constitution III, FR-017) ; cas ajoutés à tests/unit/autoRedirect.test.ts
- [x] T011 [P] Écrire les tests de la table des matières (H2 seuls, texte brut des nœuds enfants, ancres slugifiées sans accents, doublons `-2`/`-3`, moins de trois H2 → pas de table) dans tests/unit/guides/toc.test.ts
- [x] T012 [P] Écrire les tests du temps de lecture (200 mots/min, arrondi supérieur, minimum 1, Lexical vide) dans tests/unit/guides/readingTime.test.ts
- [x] T013 [P] Écrire les tests des dates (première publication pose `publishedOn` et `updatedOn` ; coquille sans effet ; `substantiveUpdate` pose `updatedOn` et se remet à faux ; « à revoir » au-delà de 12 mois) dans tests/unit/guides/dates.test.ts
- [x] T014 [P] Implémenter `tocOf(state)` et `headingAnchor(text, seen)` dans src/lib/guides/toc.ts jusqu'à faire passer T011
- [x] T015 [P] Implémenter `readingMinutes(state)` (via `lexicalToPlainText`) dans src/lib/guides/readingTime.ts jusqu'à faire passer T012
- [x] T016 [P] Implémenter `nextGuideDates({ previous, next, today })` et `isReviewDue(updatedOn, today)` dans src/lib/guides/dates.ts jusqu'à faire passer T013
- [x] T017 Brancher dans src/collections/Guides.ts un hook `beforeChange` (src/hooks/guideDates.ts) qui applique `nextGuideDates` à la publication et calcule `readingMinutes` par langue ; champ virtuel `reviewDue` (`isReviewDue`) en colonne d'admin
- [x] T018 Ajouter les requêtes `getGuideBySlug`, `listGuides(locale)`, `getGuideAlternates`, `guidesForOffer(collection, id, locale, limit)`, `guidesForAuthor(memberId, locale)`, `getTeamMemberBySlug` dans src/lib/cms/queries.ts, avec les tags de cache `guides`, `doc:guides:{id}`, `doc:teamMembers:{id}` (filtre `localeStatus.enPublished` en anglais) ; les requêtes d'offres faites depuis un guide portent les tags `stays`, `experiences`, `accommodations`, `destinations`, revalidés par la 001 à chaque publication ou dépublication (FR-012)
- [x] T019 [P] Ajouter les libellés de la rubrique, de la signature (« Par », « Relu par », « Mis à jour le », « {n} min de lecture »), de la table des matières, des cartes, de l'encart et de la page d'auteur dans src/i18n/messages/fr.json et src/i18n/messages/en.json (parité vérifiée par tests/unit/messages.test.ts)
- [x] T020 Créer `pnpm seed:guides` (script `payload run scripts/seed-guides.ts && pnpm cache:clear` dans package.json) : trois thèmes, `slug`/`place`/`bio` des membres de démonstration, import **en brouillon** de chaque content/carnets/{fr,en}/*.md par `convertMarkdownToLexical` (blocs `:::encadre` → bloc « Encadré pratique »), sans jamais publier ni attacher de photo, idempotent par `slug`, dans scripts/seed-guides.ts

**Checkpoint**: migration appliquée, routes et logique pure testées, un brouillon importable.

> **Avancement des phases 1 et 2** (2026-11-20) :
> - T001 reste à faire par le propriétaire (envoi des fiches de questions à l'équipe).
> - T003 : prérequis de la 001 présents (dont `previewFor` et `src/lib/redirects/paths.ts`).
> - Écart au data-model : la requête cible est le champ existant `seo.targetKeyword` (localisé),
>   pas un nouveau `targetQuery` ; thèmes repérés par une clé `key` (brouillons Markdown).
> - Migration additive `20261120_202818_guides` appliquée ; dates civiles en texte AAAA-MM-JJ.
> - T010 : un membre de l'équipe est « public » dès qu'il a un slug (pas de brouillon) ; changement de
>   slug → 301 FR et EN ; page parente « À propos ».
> - T020 : parseur d'en-tête sans dépendance (`src/lib/guides/draft.ts`, testé) ; essai réel FR + EN
>   (intertitres, encadré, liens ordonnés, lien inconnu signalé, relance sans effet), puis supprimé.

---

## Phase 3: User Story 1 — Lire un guide trouvé sur Google (Priority: P1) 🎯 MVP

**Goal**: page guide complète (signature, date, table des matières, corps, offres liées, auteur,
WhatsApp) et page d'auteur, rendues côté serveur avec leurs données structurées.

**Independent Test**: publier un guide FR + EN ; l'ouvrir à 360 px ; vérifier signature, date,
table des matières, liens d'offres, bascule de langue, page d'auteur ; HTML servi sans JavaScript
avec `Article` + `BreadcrumbList`.

### Tests for User Story 1 ⚠️

- [x] T021 [P] [US1] Écrire les tests du builder `Article` (guide FR seul, FR + EN, avec relecteur → `contributor`, sans relecteur, `about` = destinations publiées, `headline` ≤ 110, aucun `review`) dans tests/unit/jsonld-article.test.ts
- [x] T022 [P] [US1] Écrire les tests du builder `ProfilePage` + `Person` (`@id` stable repris par l'article, `worksFor` = `#org`, `sameAs` facultatif) dans tests/unit/jsonld-profile.test.ts
- [x] T023 [P] [US1] Écrire l'E2E `@guides` à 360 px : signature (photo, nom lié à la page d'auteur, rôle, lieu, relu par, `<time>`, temps de lecture), table des matières (entrée → section visible sous l'en-tête), cartes d'offres en FCFA avec mention indicative en euros, présentation de l'auteur, WhatsApp, bascule FR ↔ EN vers le même guide, bascule d'un guide sans version anglaise vers la rubrique anglaise, page d'auteur listant ses guides, axe sans erreur, dans tests/e2e/guides.mobile.spec.ts
- [x] T024 [P] [US1] Écrire l'E2E SEO sans JavaScript : contenu, signature, liens et `@graph` (`Article`, `BreadcrumbList`, `FAQPage` si FAQ) d'un guide, `ProfilePage` d'une page d'auteur, un seul H1, canonical, hreflang absent quand l'anglais n'est pas publié, dans tests/e2e/guides.seo.spec.ts

### Implementation for User Story 1

- [x] T025 [P] [US1] Implémenter `buildArticle` dans src/lib/seo/jsonld/article.ts jusqu'à faire passer T021
- [x] T026 [P] [US1] Implémenter `buildProfilePage` dans src/lib/seo/jsonld/profilePage.ts jusqu'à faire passer T022
- [x] T027 [P] [US1] Créer le rendu du corps avec les convertisseurs `@payloadcms/richtext-lexical/react` : H2 avec `id` = `headingAnchor` et `scroll-margin-top`, H3, encadré pratique (`aside` + titre), images `CmsImage` en différé avec légende et crédit de provenance, dans src/components/guides/GuideRichText.tsx
- [x] T028 [P] [US1] Créer la table des matières (`<details open>` + `<nav aria-labelledby>`, liens d'ancre, cibles ≥ 44 px, rendue seulement à partir de trois H2) dans src/components/guides/TableOfContents.tsx
- [x] T029 [P] [US1] Créer la signature (photo 48 px, nom lié à la page d'auteur, rôle, lieu, « Relu par », `<time datetime>` de `updatedOn`, temps de lecture) dans src/components/guides/GuideByline.tsx
- [x] T030 [P] [US1] Créer les cartes d'offres liées (séjours, expériences, hébergements, destinations publiés dans la langue, ordre saisi ; prix « à partir de » en FCFA + conversion indicative EUR pour les offres vendues ; `data-guide-link` et `data-guide`) dans src/components/guides/RelatedOffers.tsx
- [x] T031 [US1] Créer la vue guide dans l'ordre du contrat (fil d'Ariane, H1, chapeau, signature, image principale `priority`, table des matières, corps, FAQ, cartes, présentation de l'auteur, autres guides du même thème d'abord, WhatsApp) dans src/components/views/GuideView.tsx
- [x] T032 [US1] Créer la vue de page d'auteur (photo, nom en H1, rôle, lieu, présentation, liens publics, liste de ses guides publiés dans la langue, lien vers « À propos ») dans src/components/views/AuthorView.tsx
- [x] T033 [US1] Brancher les routes `guide` et `author` dans src/app/(frontend)/[locale]/[...segments]/page.tsx : `generateStaticParams` (guides publiés par langue ; auteurs signant ou relisant au moins un guide publié dans la langue), métadonnées (`seo.metaTitle`/`metaDescription`, OG `article` avec dates et auteur, hreflang seulement si la version existe), `@graph` (`Article` + `BreadcrumbList` + `FAQPage` ; `ProfilePage` + `BreadcrumbList`), 404 sinon ; ajouter `guide` et `author` à `liveRouteTypes` dans src/lib/navigation.ts
- [x] T034 [US1] Étendre la revalidation : à l'enregistrement d'un guide, tags `doc:guides:{id}`, `guides`, `sitemap` et `doc:teamMembers:{id}` de l'auteur et du relecteur avant et après, dans src/hooks/revalidate.ts
- [x] T035 [US1] Ajouter `guide` → `guidesHub` et `author` → `about` à `parentRoute`, et les chemins FR/EN des guides et des auteurs aux alternates de la bascule de langue, dans src/lib/localeSwitch.ts (cas limite « Guide sans traduction ») ; tests dans tests/unit/localeSwitch.test.ts
- [x] T036 [P] [US1] Ajouter les URL `/fr/carnets-du-saloum/{guide de démo}` et `/fr/equipe/{auteur de démo}` à lighthouserc.json (guide publié par `pnpm seed:guides --demo-publish` avec un média du seed dont la provenance indique « photo de démonstration » ; option refusée si `NODE_ENV=production` sans `SEED_ALLOW_PRODUCTION=1`, research R12) dans lighthouserc.json et scripts/seed-guides.ts
- [x] T037 [P] [US1] Rédiger les brouillons FR et EN de « Que faire au Sine-Saloum » et « Quand partir au Sine-Saloum » à partir des réponses de T001 dans content/carnets/fr/ et content/carnets/en/ (≥ 600 mots, H2 par partie, informations chiffrées datées, liens vers les offres, citation du hub des expériences dès l'introduction pour le premier)
- [x] T038 [P] [US1] Rédiger les brouillons FR et EN de « Aller de Dakar ou de l'aéroport AIBD à Ndangane » et « Week-end au Sine-Saloum depuis Dakar » dans content/carnets/fr/ et content/carnets/en/ (tarifs et durées datés, liens vers les transferts et séjours)
- [x] T039 [P] [US1] Rédiger les brouillons FR et EN de « Les huîtres de palétuviers », « La culture sérère » (marqué `requiresCommunityReview`) et « Mar Lodj, l'île sans voitures » (renvoi vers la fiche destination dès l'introduction, requête « que faire à Mar Lodj ») dans content/carnets/fr/ et content/carnets/en/

**Checkpoint**: un guide et une page d'auteur lisibles, indexables et testés ; sept brouillons importables.

---

## Phase 4: User Story 2 — Passer d'une offre aux guides qui en parlent (Priority: P2)

**Goal**: encart « À lire dans les Carnets du Saloum » sur les fiches liées, saisi une seule fois.

**Independent Test**: lier un guide à une destination et un séjour ; l'encart apparaît sur ces deux
fiches seulement ; il disparaît quand le guide est dépublié.

### Tests for User Story 2 ⚠️

- [x] T040 [P] [US2] Écrire les tests de `pickTeaserGuides` (publiés dans la langue seulement, tri `priority` puis `updatedOn` décroissant, au plus trois) dans tests/unit/guides/teaser.test.ts
- [x] T041 [P] [US2] Écrire l'E2E : encart présent sur une fiche liée (séjour, expérience, hébergement, destination), absent d'une fiche non liée, au plus trois cartes, disparition après dépublication du guide, carte d'une offre dépubliée retirée du guide (FR-012), axe, dans tests/e2e/guides-teaser.mobile.spec.ts

### Implementation for User Story 2

- [x] T042 [US2] Implémenter `pickTeaserGuides` dans src/lib/guides/teaser.ts jusqu'à faire passer T040 et l'utiliser dans `guidesForOffer` (src/lib/cms/queries.ts)
- [x] T043 [US2] Créer l'encart (titre « À lire dans les Carnets du Saloum » / « From our Saloum Travel Guides », cartes image + titre + temps de lecture, `data-guide-card`, rien si aucun guide) dans src/components/guides/GuidesTeaser.tsx
- [x] T044 [US2] Insérer l'encart après le contenu principal et avant les suggestions dans src/components/views/StayView.tsx, ExperienceView.tsx, AccommodationView.tsx et DestinationView.tsx
- [x] T045 [US2] Revalider les fiches liées avant et après chaque enregistrement de guide (`doc:stays:{id}`, `doc:experiences:{id}`, `doc:accommodations:{id}`, `doc:destinations:{id}`) dans src/hooks/revalidate.ts

**Checkpoint**: maillage dans les deux sens sans double saisie.

---

## Phase 5: User Story 3 — Écrire, faire relire et publier un guide (Priority: P3)

**Goal**: publication sans aide technique, refusée tant qu'il manque un élément obligatoire.

**Independent Test**: dans l'admin, tenter de publier un guide en retirant tour à tour chaque
élément obligatoire (liste des manques affichée), puis publier un guide complet.

### Tests for User Story 3 ⚠️

- [x] T046 [P] [US3] Écrire les tests de `guideErrors` (bloquants : auteur sans photo ou présentation dans la langue, image principale absente, corps, requête cible, chapeau, title/description absents en FR, relecteur requis si `requiresCommunityReview`, mise à jour de fond avec auteur et relecteur inactifs) et de `guideWarnings` (non bloquants, FR-015b : moins de deux liens, moins de 600 mots dans une langue publiée, chapeau hors de 140–300 caractères) dans tests/unit/guides/guards.test.ts
- [x] T047 [P] [US3] Étendre les tests des garde-fous médias aux images du corps Lexical et à la photo de l'auteur dans tests/unit/publishGuards.test.ts
- [x] T048 [P] [US3] Écrire l'E2E desktop-admin : publication refusée avec la liste des manques, publication FR seule (pas de page EN, pas de hreflang), passage `enPublished` après la version anglaise, coquille sans changement de date, mise à jour importante → date du jour, changement de slug d'un guide → 301, changement de slug d'un auteur → 301 de sa page FR et EN, aperçu d'un brouillon depuis l'admin, encadré « Points à vérifier » sans blocage, guide « à revoir » signalé, dans tests/e2e/guides-admin.spec.ts (ajouté à `ADMIN_SPECS` de playwright.config.ts)

### Implementation for User Story 3

- [x] T049 [US3] Implémenter `guideErrors` (pur) dans src/lib/guides/guards.ts et le hook de publication qui le lit (auteur et relecteur chargés) dans src/hooks/guideGuards.ts, branché sur `guides` jusqu'à faire passer T046
- [x] T050 [US3] Étendre `referencedMediaIds` aux nœuds `upload` du corps Lexical et à la photo de l'auteur dans src/hooks/publishGuards.ts jusqu'à faire passer T047
- [x] T051 [US3] Définir l'`englishCheck` des guides (titre, chapeau, corps, requête cible et SEO anglais) passé à `contentDefaults` dans src/collections/Guides.ts
- [x] T052 [US3] Configurer la liste d'admin des guides (colonnes titre, requête cible, `updatedOn`, `localeStatus.enPublished`, `reviewDue`, statut ; descriptions d'aide « Mise à jour importante », « Relecture communautaire ») dans src/collections/Guides.ts
- [x] T053 [US3] Implémenter `guideWarnings` (pur) dans src/lib/guides/guards.ts et l'encadré « Points à vérifier » (champ `ui`, composant serveur) en tête du formulaire dans src/components/admin/GuideWarnings.tsx, branché dans src/collections/Guides.ts, sans bloquer la publication (FR-015b) ; régénérer l'import map
- [x] T054 [US3] Ajouter le bouton « Aperçu » d'un brouillon (`admin.preview: previewFor('guides')`, src/lib/cms/preview.ts) dans src/collections/Guides.ts (FR-014)

**Checkpoint**: l'équipe publie seule, sans pouvoir publier un guide incomplet.

---

## Phase 6: User Story 4 — Parcourir la rubrique (Priority: P4)

**Goal**: page de rubrique groupée par thème, accessible depuis le menu, le pied de page, « À
propos » et le plan du site.

**Independent Test**: trois guides de thèmes différents publiés ; rubrique FR et EN groupée par
thème ; liens du menu et du pied de page ; guides, rubrique et pages d'auteur dans le sitemap.

### Tests for User Story 4 ⚠️

- [x] T055 [P] [US4] Écrire les tests des entrées de sitemap (rubrique, guides avec `lastModified` = `updatedOn` et images, pages d'auteur, langues publiées seulement) dans tests/unit/seo/sitemap-guides.test.ts
- [x] T056 [P] [US4] Écrire l'E2E de la rubrique à 360 px (groupes par thème, cartes image + titre + chapeau + temps de lecture, lien de menu et de pied de page, carte d'un membre sur « À propos » menant à sa page d'auteur, axe) et l'E2E SEO sans JS (`CollectionPage` + `ItemList`) dans tests/e2e/guides-hub.mobile.spec.ts et tests/e2e/guides.seo.spec.ts

### Implementation for User Story 4

- [x] T057 [US4] Créer la vue de rubrique (H1, introduction issue d'une page CMS `guides_hub`, sections par thème dans l'ordre `guideThemes.order`) dans src/components/views/GuidesHubView.tsx et la page `guides_hub` dans `PAGE_KEYS` (src/collections/Pages.ts) et src/seed/pages.ts
- [x] T058 [US4] Brancher la route `guidesHub` (statique, métadonnées, `CollectionPage` + `ItemList` + `BreadcrumbList`) dans src/app/(frontend)/[locale]/[...segments]/page.tsx et `liveRouteTypes` (src/lib/navigation.ts)
- [x] T059 [US4] Ajouter la route `guidesHub` aux routes internes du global `navigation` (src/globals/Navigation.ts) et l'entrée « Carnets du Saloum » au menu et au pied de page du seed (src/seed/index.ts)
- [x] T060 [US4] Ajouter la rubrique, les guides et les pages d'auteur au sitemap dans src/lib/seo/sitemapEntries.ts et src/app/sitemap.ts jusqu'à faire passer T055
- [x] T061 [US4] Faire mener la carte d'un membre du bloc équipe de « À propos » vers sa page d'auteur quand elle existe dans src/components/blocks/Team.tsx
- [x] T062 [P] [US4] Ajouter `/fr/carnets-du-saloum` et `/en/saloum-travel-guides` à lighthouserc.json

**Checkpoint**: rubrique navigable et complète dans le plan du site.

---

## Phase 7: User Story 5 — Suivre l'objectif de référencement (Priority: P5)

**Goal**: une requête = une page vérifiée automatiquement ; lectures et clics mesurés sans cookie.

**Independent Test**: `pnpm seo:check` refuse une requête attribuée à deux chemins ; un clic vers
une offre depuis un guide envoie `guide_offer_click` avec guide, cible et langue.

### Tests for User Story 5 ⚠️

- [x] T063 [P] [US5] Écrire les tests du registre (requête normalisée unique sur l'ensemble FR et EN ; les sept guides présents ; « que faire au Sine-Saloum » sur le guide ; « activités Sine-Saloum » sur le hub) dans tests/unit/seo/keywords.test.ts
- [x] T064 [P] [US5] Écrire les tests de l'écouteur (`guide_offer_click` avec `guide`, `target`, `locale` ; `guide_card_click` avec `from` ; `whatsapp_click` `placement: guide`) dans tests/unit/analytics.test.ts

### Implementation for User Story 5

- [x] T065 [US5] Ajouter les sept guides (requêtes FR/EN de spec FR-020, termes attendus), réattribuer « que faire au Sine-Saloum » / « things to do in Sine-Saloum » au guide et donner « activités Sine-Saloum » / « Sine-Saloum activities » au hub des expériences dans src/lib/seo/keywords.ts ; refuser dans scripts/seo-check.ts toute requête normalisée visant deux chemins, jusqu'à faire passer T063
- [x] T066 [US5] Recentrer le hub des expériences sur « activités / excursions Sine-Saloum » (title, description, H1 et introduction de la page `experiences_hub`) dans src/seed/pages.ts, avec un script de mise à jour du CMS existant (`pnpm cms:experiences-hub`) dans scripts/sync-experiences-hub.ts
- [x] T067 [US5] Suivre `guide_offer_click`, `guide_card_click` et `placement: guide` dans l'écouteur délégué src/components/client/Analytics.tsx (types dans src/lib/analytics.ts) jusqu'à faire passer T064
- [x] T068 [P] [US5] Documenter les objectifs Plausible (`guide_offer_click`, `guide_card_click`), le calcul de SC-004 et le relevé mensuel Search Console de SC-002 (requête, page, position moyenne 28 jours) dans docs/analytics.md

**Checkpoint**: objectif mesurable chaque mois.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T069 [P] Vérifier les budgets sur la rubrique, un guide et une page d'auteur (`pnpm lhci`, `pnpm bundles`) en profil mobile et corriger tout dépassement
- [ ] T070 [P] Ajouter `@guides` au tunnel sans JavaScript (`pnpm e2e:nojs --grep @guides`) et vérifier `pnpm seo:check` sur toutes les nouvelles routes
- [ ] T071 Intégrer les réponses de l'équipe (T001) aux sept brouillons, importer avec `pnpm seed:guides` sur la préproduction, faire relire, signer et publier chaque guide par l'équipe (relecture communautaire pour « La culture sérère »), et consigner l'avancement guide par guide sous cette tâche
- [x] T072 [P] Ajouter au modèle de PR la vérification « guide signé par un membre actif, photos réelles avec provenance, informations chiffrées datées » dans .github/pull_request_template.md
- [ ] T073 Après publication : renvoyer le sitemap et inspecter l'URL de chaque guide dans Search Console ; consigner la date de publication de chaque guide (point de départ des 6 mois de SC-002) dans docs/analytics.md
- [x] T074 [P] Ajouter le traitement « Pages d'auteur de l'équipe » (finalité : présenter les auteurs des guides ; données : nom, rôle, lieu, photo, présentation, liens publics ; base légale : consentement du membre, retirable ; durée : tant que le membre signe un guide publié ; destinataires : public) au registre des traitements dans src/seed/pages.ts et l'appliquer au CMS existant par `pnpm cms:privacy-register` (script de la 002, constitution IX) ; compter 11 entrées dans tests/e2e/editorial.mobile.spec.ts
- [x] T075 Exécuter les scénarios de specs/004-guides-editoriaux-seo/quickstart.md de bout en bout et corriger les écarts

---

> **Avancement des phases 3 à 8** (2026-11-21) :
> - Brouillons des sept guides (T037–T039) rédigés avec des données fictives à la demande du
>   propriétaire : chaque guide commence par un encadré « Brouillon de démonstration », chaque
>   chiffre est marqué « à vérifier » ; à remplacer par les réponses de l'équipe (T001, T071).
> - Mesure : `data-guide` = slug du guide dans la langue de la page (correspond aux pages vues).
> - T041 : plafond de trois guides et retrait d'une offre dépubliée couverts par les tests
>   unitaires (`teaser.test.ts`, `related.test.ts`) ; l'E2E crée et supprime son propre guide.
> - T048 : « à revoir » à 12 mois et mise à jour de fond datée couverts par les tests unitaires
>   (l'API ne permet pas d'antidater) ; bouton « Aperçu » = page publique, comme la 001 (un
>   brouillon jamais publié n'a pas de page : mode brouillon commun à traiter hors de la 004).
> - T057 : titre et description de la rubrique dans les messages, pas de page CMS `guides_hub`
>   (aucune migration d'énumération) ; T059 : menu et pied de page tenus dans le code
>   (`src/lib/navigation.ts`), le global « Navigation » n'étant pas lu par le site.
> - T065 : unicité des requêtes vérifiée par langue (« Mar Lodj » existe en FR et en EN) ;
>   entrées `pendingPublication` pour les guides en brouillon.
> - T068 : `docs/analytics-carnets.md` (le fichier `docs/analytics.md` n'existe que sur la
>   branche de la 002 phase 8, pas encore fusionnée).
> - T074 : registre à six entrées sur cette branche ; onze après fusion de la 002 phase 8, dont le
>   script `pnpm cms:privacy-register` appliquera l'entrée au CMS existant.
> - Mises à jour REST des guides avec `?locale=fr` dans les tests : sans langue, Payload valide
>   les champs localisés comme vides (même comportement sur les collections de la 001).
> - Base locale : le cache de données de Next survit aux builds ; `pnpm cache:clear` après un
>   seed (en CI, cache neuf).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** : T001 dès maintenant (chemin critique éditorial) ; T002–T003 sans dépendance.
- **Foundational (Phase 2)** : après Setup ; bloque toutes les stories.
- **US1 (P1)** : après la phase 2 ; MVP. Les brouillons (T037–T039) dépendent des réponses de T001,
  pas du code.
- **US3 (P3)** : peut démarrer en parallèle de US1 (fichiers distincts : garde-fous, admin) ; à
  terminer avant toute publication réelle (T071).
- **US2 (P2)** : après US1 (cartes et requêtes de guides).
- **US4 (P4)** : après US1 (vue guide, auteurs) ; indépendante de US2.
- **US5 (P5)** : T065–T066 à terminer **avant la publication du guide « Que faire au
  Sine-Saloum »** (pas de cannibalisation) ; T067 après US1.
- **Polish** : après les stories voulues ; T071 après US1 + US3 et les réponses de l'équipe.

### Within Each User Story

- Tests d'abord (doivent échouer), puis logique pure, composants, branchement des routes.
- Une story n'est terminée qu'avec ses tests unitaires, E2E 360 px et axe verts.

### Parallel Opportunities

- Phase 2 : T004, T005, T008, T011–T013, T019 ensemble ; puis T014–T016 ensemble.
- US1 : T021–T024 ensemble ; T025–T030 ensemble (fichiers distincts) ; T037–T039 en continu.
- US3 en parallèle de US1 ; US4 en parallèle de US2.

---

## Parallel Example: User Story 1

```text
# Tests (ensemble) :
T021 tests/unit/jsonld-article.test.ts
T022 tests/unit/jsonld-profile.test.ts
T023 tests/e2e/guides.mobile.spec.ts
T024 tests/e2e/guides.seo.spec.ts

# Puis composants (ensemble) :
T025 src/lib/seo/jsonld/article.ts
T026 src/lib/seo/jsonld/profilePage.ts
T027 src/components/guides/GuideRichText.tsx
T028 src/components/guides/TableOfContents.tsx
T029 src/components/guides/GuideByline.tsx
T030 src/components/guides/RelatedOffers.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (envoyer les fiches de questions dès le premier jour).
2. Phase 2.
3. US1 : un guide et une page d'auteur complets, testés.
4. **STOP and VALIDATE** : lecture à 360 px, HTML sans JS, JSON-LD valide.

### Incremental Delivery

1. US1 + US3 → l'équipe peut publier les premiers guides proprement.
2. US5 (T065–T066) avant le guide « Que faire au Sine-Saloum ».
3. US2 → maillage retour, gain SEO des fiches.
4. US4 → rubrique et plan du site.
5. US5 (mesure) → suivi mensuel de l'objectif de 6 mois.

### Notes

- Aucun guide n'est publié par un script en production : publication par un membre de l'équipe.
- Toute information chiffrée qui change (tarifs, horaires, marées) est datée dans le texte.
- Commit après chaque phase ; PR vers `main`.
