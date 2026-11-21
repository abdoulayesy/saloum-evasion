# Implementation Plan: Guides éditoriaux « Carnets du Saloum »

**Branch**: `004-guides-editoriaux-seo` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-guides-editoriaux-seo/spec.md`

## Summary

Nouvelle rubrique publique bilingue « Carnets du Saloum » / « Saloum Travel Guides » : une page
de rubrique, une page par guide et une page par auteur, toutes **statiques** (SSG +
`revalidateTag`) comme le reste du site public. Les guides sont une collection Payload
(`guides`) construite sur le socle éditorial de la 001 : brouillons, version anglaise publiée
seulement si complète, garde-fous de publication (photos réelles avec texte alternatif et
provenance, auteur signé, au moins deux liens), redirections automatiques. Chaque guide porte
ses liens vers séjours, expériences, hébergements et destinations ; les fiches retrouvent leurs
guides par requête inverse (encart « À lire dans les Carnets »). La table des matières est
extraite côté serveur des intertitres, sans JavaScript. Données structurées `Article` +
`BreadcrumbList` (+ `FAQPage`), `ProfilePage` + `Person` pour les auteurs. La date affichée est
celle de la dernière **mise à jour de fond**, distincte des corrections. Les sept guides de
lancement sont rédigés en brouillon Markdown par l'équipe projet, importés comme brouillons, puis
relus, signés et publiés par l'équipe locale. Le registre des requêtes cibles garantit qu'une
requête n'appartient qu'à une page ; « que faire au Sine-Saloum » passe du hub des expériences au
premier guide.

## Technical Context

**Language/Version**: TypeScript 5.x (`strict`, `noUncheckedIndexedAccess`), Node.js 22 LTS
(inchangé)
**Primary Dependencies**: celles de la 001 (Next.js 15 App Router, Payload CMS 3 avec Lexical,
next-intl, Tailwind v4, schema-dts, Plausible). **Aucune dépendance ajoutée** : conversion
Markdown → Lexical par `convertMarkdownToLexical` de `@payloadcms/richtext-lexical` (installé).
**Storage**: PostgreSQL 16 : collections `guides` et `guideThemes`, champs ajoutés à
`teamMembers` (migration additive) ; images dans le stockage objet existant.
**Testing**: Vitest (table des matières et ancres, temps de lecture, dates de mise à jour,
garde-fous de publication, requêtes inverses, builders JSON-LD `Article` et `ProfilePage`,
registre « une requête = une page ») ; Playwright `@guides` sur android-360, iphone-se, pixel-7,
nojs et desktop-admin (publication) + axe ; Lighthouse CI sur la rubrique, un guide et une page
d'auteur ; `pnpm seo:check` ; `check-bundles`.
**Target Platform**: identique à la 001 (Vercel, région `cdg1` ; navigateurs mobiles récents,
Android milieu de gamme à 360 px en 3G/4G).
**Project Type**: application web unique (Next.js + Payload intégré), dépôt unique.
**Performance Goals**: budgets de la constitution sur les trois nouveaux types de page : LCP ≤
2,5 s (labo ≤ 2,0 s en 4G lente ; dérogation D-LCP-photo à 3,0 s si l'élément LCP est la photo
principale), INP ≤ 200 ms, CLS ≤ 0,1, Lighthouse mobile Perf ≥ 95 / SEO 100 / A11y ≥ 95 / BP 100.
**Constraints**: aucun îlot client nouveau (table des matières en HTML, mesure par l'écouteur
délégué existant) ; JS initial ≤ 150 Ko gz par route ; image principale ≤ 120 Ko AVIF/WebP ;
contenu complet servi sans JavaScript ; FR et EN complets avant publication dans une langue.
**Scale/Scope**: 7 guides au lancement (600 à 2 000 mots chacun, 2 langues), quelques auteurs,
3 thèmes ; croissance attendue de quelques guides par trimestre, gérée par l'équipe.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source: `.specify/memory/constitution.md` (Saloum Évasion v1.0.0).

- [x] **I. Mobile-first** — pages conçues à 360 px ; table des matières repliable sans
      JavaScript ; cibles ≥ 44 px (entrées de la table, cartes) ; aucune fonction au survol ;
      barre WhatsApp collante conservée ; pas de formulaire nouveau côté public.
- [x] **II. Performance** — SSG + ISR ; aucun îlot client ajouté ; image principale `priority`
      seulement sur la page guide, images du corps en différé avec dimensions ; mêmes polices ;
      trois URL ajoutées à Lighthouse CI.
- [x] **III. SEO** — rendu serveur ; `title`/description issus du CMS avec longueurs et unicité
      existantes ; un H1 ; canonical, OG `article`, hreflang réciproques seulement si la version
      anglaise est complète ; JSON-LD `Article`, `BreadcrumbList`, `FAQPage`, `ProfilePage`,
      `CollectionPage` + `ItemList` validés en CI ; sitemap avec images ; 301 au changement de
      slug ; maillage dans les deux sens ; une requête cible = une page (`seo:check`). Le
      contrat JSON-LD de la constitution est étendu à `Article` et `ProfilePage` (types absents
      de la liste du principe III, ajoutés par cette feature et décrits dans
      `contracts/jsonld.md`).
- [x] **IV. Accessibilité** — HTML sémantique (`article`, `nav` de table des matières,
      `<time>`), titres hiérarchisés H1 › H2 › H3, textes alternatifs obligatoires, ancres qui ne
      masquent pas la cible (WCAG 2.4.11), axe sur rubrique, guide, auteur et encart.
- [x] **V. Confiance** — uniquement des photos réelles avec provenance (garde-fou étendu au
      corps du guide et à la photo d'auteur) ; signatures de vrais membres de l'équipe ; prix
      « à partir de » en FCFA avec conversion indicative ; aucun avis.
- [x] **VI. Marché sénégalais** — montants XOF des offres liées, contact WhatsApp en un geste,
      pages légères (aucun JS ajouté).
- [x] **VII. Qualité** — TS strict, aucun `any` ; logique pure testée (`src/lib/guides/`) ;
      E2E mobile + axe ; Lighthouse CI et `seo:check` bloquants.
- [x] **VIII. Simplicité** — une collection et une petite collection de thèmes dans le CMS
      existant, aucune dépendance ni service nouveau ; suivi des positions par Search Console,
      sans intégration d'API.
- [x] **IX. Données personnelles** — aucune donnée de visiteur collectée ; mesure sans cookie ;
      les pages d'auteur ne publient que ce que le membre accepte (nom, rôle, lieu, photo,
      présentation, liens publics), consentement recueilli par l'équipe avant publication.

**Résultat** : aucune violation ; pas de dérogation nécessaire. Re-vérifié après la phase 1 :
inchangé.

## Project Structure

### Documentation (this feature)

```text
specs/004-guides-editoriaux-seo/
├── plan.md              # Ce fichier
├── research.md          # Phase 0 : R1–R12
├── data-model.md        # Phase 1 : guides, guideThemes, teamMembers, registre des requêtes
├── quickstart.md        # Phase 1
├── contracts/
│   ├── routes.md        # routes, métadonnées, structure de page, encart, sitemap
│   ├── jsonld.md        # Article, ProfilePage, CollectionPage
│   └── analytics-events.md
├── content/
│   └── questions.md     # fiches de questions pour l'équipe locale (une par guide)
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

```text
content/carnets/
├── fr/{slug}.md                     # brouillons des 7 guides (front matter + Markdown)
└── en/{slug}.md

src/collections/
├── Guides.ts                        # nouvelle collection (contentDefaults)
├── GuideThemes.ts                   # nouvelle
└── TeamMembers.ts                   # + slug, place, sameAs, active
src/hooks/
├── guideDates.ts                    # publishedOn / updatedOn / substantiveUpdate
├── guideGuards.ts                   # auteur signé, ≥ 2 liens, relecture communautaire
└── publishGuards.ts                 # + médias du corps Lexical et photo de l'auteur
src/lib/guides/
├── toc.ts                           # extraction des H2, ancres stables (pur)
├── readingTime.ts                   # 200 mots/min (pur)
├── dates.ts                         # règles de mise à jour de fond, « à revoir » à 12 mois (pur)
└── queries.ts                       # guides d'une fiche, offres d'un guide, guides d'un auteur
src/lib/seo/jsonld/
├── article.ts                       # Article (pur)
└── profilePage.ts                   # ProfilePage + Person (pur)
src/lib/seo/keywords.ts              # + 7 guides ; « que faire » réattribuée ; hub → « activités »
src/i18n/pathnames.ts                # routes guidesHub, guide, author
src/app/(frontend)/[locale]/[...segments]/page.tsx   # résolution des nouvelles routes
src/components/views/
├── GuidesHubView.tsx
├── GuideView.tsx
└── AuthorView.tsx
src/components/guides/
├── GuideByline.tsx                  # signature (serveur)
├── TableOfContents.tsx              # <details> + liens d'ancre (serveur)
├── GuideRichText.tsx                # convertisseurs Lexical : ancres H2, encadrés, images
├── RelatedOffers.tsx                # cartes d'offres liées (serveur)
└── GuidesTeaser.tsx                 # encart « À lire dans les Carnets » des fiches
src/components/client/Analytics.tsx  # + guide_offer_click, guide_card_click (écouteur existant)
src/globals/Navigation.ts            # + route guidesHub
src/lib/seo/sitemapEntries.ts        # + rubrique, guides, auteurs
scripts/seed-guides.ts               # thèmes, champs auteur de démo, brouillons (jamais publiés)
src/migrations/                      # migration additive
src/i18n/messages/{fr,en}.json     # libellés de la rubrique, de la signature, de l'encart
tests/unit/guides/                   # toc, readingTime, dates, garde-fous, queries
tests/unit/jsonld-article.test.ts, tests/unit/jsonld-profile.test.ts
tests/e2e/guides.mobile.spec.ts, tests/e2e/guides.seo.spec.ts,
tests/e2e/guides-admin.spec.ts       # publication refusée / acceptée (desktop-admin)
lighthouserc.json                    # + 3 URL
```

**Structure Decision** : même application et mêmes conventions que la 001 ; les nouvelles pages
passent par le résolveur public existant (`[...segments]`) et la union `Route`, donc par les
tests de métadonnées, de hreflang et de sitemap déjà en place. La logique (table des matières,
dates, temps de lecture, JSON-LD, requêtes) est pure et testée dans `src/lib/`.

## Phases

- **Phase 0 (fait)** : [research.md](./research.md), R1–R12, aucune inconnue restante.
- **Phase 1 (fait)** : [data-model.md](./data-model.md), [contracts/](./contracts/),
  [quickstart.md](./quickstart.md) ; contexte agent mis à jour.
- **Phase 2** : `/speckit.tasks`. Ordre attendu des stories : US1 (guide lisible, P1) → US3
  (publication avec garde-fous, nécessaire pour publier proprement) → US2 (maillage inverse) →
  US4 (rubrique) → US5 (mesure). La rédaction des brouillons (fiches de questions puis textes)
  avance en parallèle dès la phase 1 : elle dépend des réponses de l'équipe locale, pas du code.

## Risques

| Risque | Effet | Parade |
|---|---|---|
| Réponses de l'équipe ou photos réelles tardives | guides non publiables | fiches de questions envoyées dès le début ; publication guide par guide |
| Droits des photos non confirmés | publication bloquée | provenance et accord demandés avec les fiches |
| Objectif top 10 non atteint à 6 mois | SC-002 manqué | suivi mensuel Search Console ; enrichissement ciblé des guides en retard ; liens externes (partenaires, office du tourisme) hors périmètre mais recommandés |
| Recentrage du hub des expériences | baisse temporaire sur « que faire » | le guide cite le hub dès son introduction ; suivi des deux pages dans Search Console |

## Complexity Tracking

Aucune violation de la constitution à justifier.
