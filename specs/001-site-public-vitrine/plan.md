# Implementation Plan: Site public Saloum Évasion — vitrine, catalogue et film d'immersion

**Branch**: `001-site-public-vitrine` | **Date**: 2026-11-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-site-public-vitrine/spec.md`

**Note**: `/speckit-clarify` a été interrompu avant la première réponse. Les points ouverts
sont tranchés par défaut dans [research.md](./research.md) (marqués **[défaut — à
confirmer]**) : stratégie d'URL (R1), modèle de prix (R2), contenu retiré (R11), quatrième
univers (R12).

## Summary

Site vitrine bilingue (FR par défaut, EN), mobile-first, dont la conversion est une
**demande de séjour** (formulaire court ou WhatsApp), sans paiement ni compte client. Une seule
application **Next.js 15 (App Router, RSC)** embarque **Payload CMS 3** (PostgreSQL) :
l'équipe gère séjours, expériences, hébergements, destinations, vidéos, FAQ et pages en FR/EN.
Les pages publiques sont **générées statiquement** et régénérées à la publication
(`revalidateTag`). Le SEO est intégré à chaque route : métadonnées, hreflang, JSON-LD,
sitemap avec images et vidéos, redirections 301 gérées dans le CMS. Le film est diffusé en HLS
(Mux) par un lecteur maison qui ne télécharge rien avant le clic sur mobile. Les budgets
Lighthouse et axe bloquent la fusion.

## Technical Context

**Language/Version**: TypeScript 5.x (`strict`, `noUncheckedIndexedAccess`), Node.js 22 LTS
**Primary Dependencies**: Next.js 15 (App Router, RSC, Server Actions, `next/image`,
`next/font`, `next/og`), Payload CMS 3 (`@payloadcms/db-postgres`, richtext-lexical, plugin
redirects, adaptateur de stockage S3), next-intl, Tailwind CSS (v4), Zod, schema-dts, hls.js
(chargé à la demande), web-vitals, Resend SDK
**Storage**: PostgreSQL 16 managé (Europe de l'Ouest, pooling) ; médias en stockage objet
S3-compatible ; vidéos chez Mux
**Testing**: Vitest (logique métier, métadonnées, JSON-LD), Playwright (iPhone SE, Pixel 7,
Android 360×800 en 4G lente ; projet sans JavaScript) + @axe-core/playwright, Lighthouse CI,
linkinator et script `seo:check`
**Target Platform**: navigateurs mobiles (Android milieu de gamme Chrome, iOS Safari 16+) puis
ordinateur ; hébergement Vercel (calcul `cdg1`) derrière CDN
**Project Type**: application web unique (site public + CMS intégré)
**Performance Goals**: CWV p75 mobile LCP ≤ 2,5 s (labo ≤ 2,0 s en 4G lente), INP ≤ 200 ms,
CLS ≤ 0,1 ; Lighthouse mobile Perf ≥ 95, SEO 100, A11y ≥ 95, BP 100
**Constraints**: JS initial ≤ 150 Ko gz par route publique ; image LCP ≤ 120 Ko AVIF/WebP ;
aucun octet vidéo avant interaction sur mobile ; 2 polices auto-hébergées ; utilisable en 3G ;
aucun traceur non essentiel ; montants XOF entiers
**Scale/Scope**: environ 40 pages publiques par langue au lancement (estimation : 6 à 10
séjours, 15 à 25 expériences, 6 à 12 hébergements, 6 destinations, 8 pages éditoriales) ;
environ 300 à 600 photos ; 1 film et 6 à 10 vidéos verticales ; trafic modeste (moins de
50 000 visites par mois la première année) ; 2 à 5 éditeurs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Source : `.specify/memory/constitution.md` (Saloum Évasion v1.0.1). Chaque porte est cochée ou
la dérogation figure dans Complexity Tracking, avec validation du propriétaire.

- [x] **I. Mobile-first** : Tailwind écrit en mobile d'abord (styles de base = 360 px, puis
      `sm/md/lg` = `min-width`) ; Stylelint interdit `max-width` dans `@media` ; cibles ≥ 44 px
      (test E2E) ; barre collante Demander / WhatsApp sur séjour, expérience, hébergement et
      destination ; panneau de filtres qui monte du bas ; clavier et autocomplete définis dans
      [request-form.md](./contracts/request-form.md) ; E2E 3G sur le parcours de demande.
- [x] **II. Performance** : RSC par défaut, 7 îlots client chargés à la demande ; image LCP
      priorisée seule ; lecteur vidéo sans octet avant clic ; hls.js en `import()` ; Plausible
      en idle ; budgets Lighthouse CI ([quickstart](./quickstart.md)). ⚠ **T5** (point de
      présence CDN à Dakar non vérifié) et **T6** (admin Payload) ci-dessous.
- [x] **III. SEO** : SSG/ISR pour toutes les pages publiques ; `generateMetadata` par route ;
      slugs traduits, hreflang + `x-default` ; JSON-LD par type ([jsonld.md](./contracts/jsonld.md)) ;
      sitemap images + vidéos ; 301 gérées dans le CMS ; demande et confirmation en noindex ;
      NAP en source unique (`siteSettings`).
- [x] **IV. Accessibilité** : HTML sémantique, contrastes de la palette vérifiés (≥ 5,5:1,
      research R9) ; galerie et panneau utilisables au clavier ; axe en E2E sur chaque type de
      page, bloquant.
- [x] **V. Confiance** : provenance obligatoire sur chaque média ; aucun avis ni
      AggregateRating (R10) ; prix TTC XOF + « ≈ € indicatif » ; conditions d'annulation
      obligatoires sur les séjours et rappelées dans le formulaire.
- [x] **VI. Marché sénégalais** : montants XOF entiers ; Wave, Orange Money et carte affichés
      au même rang (information, le paiement se fait hors ligne) ; `wa.me` sur chaque page ;
      sobriété (vidéo à la demande, pas de carte interactive).
- [x] **VII. Qualité** : TS strict sans `any` (ESLint) ; Vitest sur prix, conversion,
      validation, redirections, SEO ; Playwright mobile ; LHCI + axe obligatoires sur `main`.
- [x] **VIII. Simplicité** : un dépôt, une application (Next + Payload) ; pas de Redis
      (limitation de débit dans Postgres) ; pas d'API WhatsApp Business (R3).
- [x] **IX. Données et sécurité** : aucune donnée de carte ; Plausible sans cookie, donc aucun
      traceur à consentir ; consentement explicite au traitement dans le formulaire ; IP
      hachées ; rétention des demandes 24 mois ; création de `requests` interdite via l'API
      publique.

**Résultat (avant phase 0)** : PASS, sous réserve de T5 et T6.
**Résultat (après phase 1)** : PASS. Dérogations D-T6a et D-T6b écrites et approuvées
(Complexity Tracking) ; T10 résolu par la constitution v1.0.1 ; T5 reste un risque ouvert.

## Tensions avec la constitution et la spec (à arbitrer)

| # | Tension | Principe | Résolution proposée | Statut |
|---|---|---|---|---|
| **T1** | La spec supposait une notification de l'équipe **par WhatsApp** ; la stack n'a que Resend + `wa.me` | VIII | E-mail avec relance automatique + liste dans l'admin + bouton « Envoyer aussi sur WhatsApp » à la confirmation (R3) ; spec amendée (hypothèse et FR-013) | Résolu |
| **T2** | Option « GA4 avec bandeau » dans la stack | II, IX | **Plausible retenu**, GA4 écarté (cookies, poids JS, bandeau) | Résolu |
| **T3** | `AggregateRating` prévu dans la stack | V | Non émis : aucun avis vérifiable au lancement (R10) | Résolu |
| **T4** | Boucle muette sur ordinateur | II | Autorisée : ≥ 1024 px et pointeur fin, ni Save-Data ni mouvement réduit, après `load`, l'affiche reste l'élément LCP (R4) | Résolu |
| **T5** | Point de présence CDN « proche de Dakar » non vérifié ; risque sur le LCP p75 | II | Mesure terrain avant lancement ; repli : CDN avec PoP ouest-africain devant l'hébergeur (R6) | Risque ouvert |
| **T6** | L'admin Payload dépasse largement 150 Ko de JS et n'atteindrait pas les scores Lighthouse ; la constitution dit « par route » sans distinguer public et privé ; elle exige aussi que « chaque écran » soit conçu d'abord pour 360 px | II, I | **Dérogations D-T6a et D-T6b** (Complexity Tracking) : budgets et conception 360 px appliqués aux routes publiques ; `/admin` exclu de LHCI et des tests mobiles, noindex, réservé à l'équipe | Approuvée en session |
| **T10** | Lighthouse SEO = 100 et pages de demande en `noindex` (exigé par III) sont incompatibles | II, III | Constitution amendée en **v1.0.1** : SEO = 100 sur les pages indexables | Résolu |
| **T7** | Images OG « générées » (1200×630) et règle « uniquement de vraies photos » | V | Composition = vraie photo du document + titre et logo ; aucune image de synthèse | Résolu |
| **T8** | Stockage local de la « demande en cours » et règle de consentement aux cookies | IX | Strictement nécessaire au service demandé, donc exempté ; documenté dans Confidentialité | Résolu |
| **T9** | La spec demande « l'image principale ou la vidéo de la mangrove » en héro | II | Héro = image (LCP) ; la boucle vidéo ne vient qu'en surcouche sur ordinateur | Résolu |

## Project Structure

### Documentation (this feature)

```text
specs/001-site-public-vitrine/
├── plan.md              # Ce fichier
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── routes.md            # routes FR/EN + exigences SEO par type de page, redirections, sitemap, robots
│   ├── request-form.md      # demande en cours, champs, schéma Zod, Server Action, lien WhatsApp
│   ├── jsonld.md            # structure JSON-LD par type de page
│   └── analytics-events.md  # évènements Plausible + RUM
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (frontend)/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx                 # html lang, polices, header, footer, barre WhatsApp, JSON-LD Org
│   │   │   ├── page.tsx                   # accueil
│   │   │   ├── [...segments]/page.tsx     # résolveur de routes traduites → type de page (voir lib/routing)
│   │   │   ├── not-found.tsx
│   │   │   └── error.tsx
│   │   ├── opengraph-image.tsx            # OG 1200×630 générée par document (next/og)
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   └── global-error.tsx
│   ├── (payload)/admin/[[...segments]]/   # admin Payload (dérogation T6)
│   └── api/revalidate/route.ts            # appelé par les hooks Payload (secret)
├── collections/                           # stays, experiences, accommodations, destinations, universes,
│                                          # videos, media, faqItems, cancellationPolicies, pages,
│                                          # teamMembers, requests, redirects, rateLimits, users
├── globals/                               # siteSettings, navigation
├── fields/                                # seo, localeStatus, body (validation 300 mots), provenance
├── hooks/                                 # revalidate, autoRedirect, uniqueMeta
├── i18n/                                  # routing (segments traduits), messages fr.json / en.json
├── lib/
│   ├── pricing.ts                         # priceFrom, saisons, conversion EUR (655,957)
│   ├── seo/metadata.ts                    # generateMetadata commun (canonical, alternates, OG)
│   ├── seo/jsonld/*.ts                    # générateurs typés schema-dts par type de page
│   ├── seo/breadcrumbs.ts
│   ├── request/schema.ts                  # schéma Zod (contrat)
│   ├── request/submit.ts                  # Server Action submitStayRequest
│   ├── request/rateLimit.ts
│   ├── whatsapp.ts                        # construction des liens wa.me
│   └── analytics.ts                       # file d'évènements Plausible
├── components/
│   ├── ui/                                # Button, Chip, Price, Breadcrumbs, StickyActionBar, Section…
│   ├── cards/                             # StayCard, ExperienceCard, AccommodationCard, DestinationCard
│   ├── layout/                            # serveur : Header, Footer, MobileMenu (<dialog>)
│   ├── client/                            # "use client" (îlots) : DialogOpener, Gallery, FilterSheet,
│   │                                      # VideoPlayer, AmbientLoop, RequestForm, RequestCounter,
│   │                                      # AddToRequest, EnglishBanner, Analytics, WebVitals
│   │                                      # (recherche de l'accueil et sélecteur de langue : serveur)
│   └── blocks/                            # rendu des blocs de pages éditoriales
├── styles/globals.css                     # jetons (@theme) : mangrove #0F2A24, ocre #9E4521, sable #F4EEE3
└── payload.config.ts

public/                                    # logo, favicons, illustrations SVG (carte, motif sérère)
tests/
├── unit/                                  # Vitest
└── e2e/                                   # Playwright (@us1…@us5, nojs, axe)
scripts/seo-check.ts                       # crawl : liens, hreflang, unicité, mots-clés
lighthouserc.json
playwright.config.ts
docker-compose.yml                         # Postgres local
```

**Structure Decision** : une seule application Next.js à la racine (principe VIII), avec
Payload intégré via des groupes de routes : `(frontend)` pour le public, `(payload)` pour
l'admin. Le résolveur `[...segments]` associe les segments traduits (`sejours`/`stays`, …)
au bon type de page, ce qui permet les slugs traduits sans dupliquer l'arborescence par
langue. Alternative possible pendant l'implémentation : dossiers nommés FR + `pathnames` de
next-intl. Le contrat de routes reste identique dans les deux cas.

## Approche par parcours (ordre de livraison)

1. **Fondations** : configuration Next + Payload + Postgres, i18n, jetons de design et
   polices, layout, `siteSettings`, métadonnées et JSON-LD Org communs, CI (typecheck, lint,
   Vitest, Playwright, LHCI, axe) **dès le premier commit**.
2. **US1 (P1)** : collections stays, destinations, media, cancellationPolicies ; accueil (héro
   image, recherche, séjours vedettes) ; liste et filtres ; fiche séjour ; demande en cours ;
   formulaire, Server Action, e-mail, confirmation ; barre collante.
3. **US2 (P2)** : experiences et universes ; hub, univers et fiches ; ajout à la demande ;
   OG image ; sitemap ; JSON-LD TouristAttraction ; contrôle des mots-clés.
4. **US3 (P3)** : règles de publication (300 mots, alt, provenance), redirections
   automatiques, revalidation, rôles, liste des demandes.
5. **US4 (P4)** : videos (Mux), lecteur, page film, chapitres et `?t=`, VideoObject et Clip ;
   pages Engagement et À propos ; WhatsApp contextuel partout.
6. **US5 (P5)** : sélecteur de langue avec repli sur la page parente, bandeau EN, tests sur
   10 pages.
7. **Transverse** : accommodations, pages éditoriales restantes, 404 et 500, Plausible et RUM,
   mesure terrain à Dakar, contrôles avant lancement.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| **D-T6a** — L'admin Payload (`/admin`) dépasse le budget JS de 150 Ko et les scores Lighthouse (principe II, « par route ») | Le CMS intégré est la seule façon de satisfaire FR-029 (édition sans développeur) dans une application unique (principe VIII) | Un CMS SaaS externe déplacerait l'admin hors de l'application mais ajouterait un service et un coût, contraire à VIII ; un admin maison léger multiplierait l'effort par 5 à 10. **Portée** : `/admin/**` uniquement, non public, noindex, exclu de LHCI et de `check-bundles`. **Durée** : permanente. **Validation** : approuvée par le propriétaire en session le 2026-11-14 (option « Corriger d'abord »), révocable |
| **D-T6b** — L'admin Payload n'est pas conçu d'abord pour 360 px (principe I, « chaque écran ») | Interface fournie par Payload, non modifiable sans forker le CMS | Réécrire l'admin en mobile d'abord : même coût que ci-dessus. **Portée** : `/admin/**` ; testé sur ordinateur seulement (tâche US3). Si l'équipe doit éditer sur téléphone, une fonctionnalité ultérieure évaluera un mode d'édition mobile. **Durée** : jusqu'à réévaluation. **Validation** : approuvée en session le 2026-11-14, révocable |
| **D-LCP-photo** — Budget LCP de laboratoire porté de 2,0 s à **2,7 s** pour les seules pages dont l'élément LCP est une photo du CMS (fiches et listes de séjours, puis d'expériences ; étendu aux autres fiches et listes à leur livraison), principe II | En 4G lente simulée, Lighthouse rattache la peinture d'une image LCP à tout le JavaScript du framework (≈ 110 Ko, Next + React, incompressible) : 2,53 à 2,63 s mesurés en médiane (configuration retenue) alors que l'image s'affiche à ≈ 0,37 s en observation ; sans ce JavaScript, 2,0 s | Toutes les optimisations applicables ont été faites (image prioritaire préchargée, rendu serveur des images sans hydratation, CSS critique intégrée, polices latines seules, placeholder retiré de l'image LCP, une seule feuille CSS) ; la CSS intégrée au HTML descendait à 2,42–2,49 s mais faisait dépasser le budget TBT de l'accueil (150 à 300 ms) ; mesurer en bridage appliqué donne pire (TBT 350 à 1 400 ms) ; retirer React n'est pas envisageable. **Portée** : URL `/fr/sejours…`, `/en/stays…`, `/fr/experiences…` et `/en/experiences…` (`assertMatrix` de `lighthouserc.json`) ; 2,0 s maintenu ailleurs ; la cible terrain CWV p75 ≤ 2,5 s reste inchangée. **Durée** : réévaluée avec les vraies photos et les premières données terrain (CrUX ou RUM) avant le lancement. **Validation** : approuvée par le propriétaire en session le 2026-11-15 (2,5 s, puis 2,7 s au vu des mesures) |
