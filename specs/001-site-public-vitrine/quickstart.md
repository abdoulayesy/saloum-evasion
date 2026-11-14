# Quickstart — 001 Site public Saloum Évasion

Guide pour lancer le projet en local et vérifier les portes qualité de la constitution.
Le code n'existe pas encore : ce guide décrit l'état attendu à la fin de l'implémentation.

## Prérequis

- Node.js 22 LTS, pnpm 9
- Docker (PostgreSQL local) ou une base Postgres 16 accessible
- Comptes (clés de test) : Mux, Resend, Plausible ; stockage S3-compatible (facultatif en
  local : stockage disque)

## Installation

```bash
pnpm install
cp .env.example .env.local
docker compose up -d db          # Postgres 16 sur localhost:5432
pnpm payload migrate             # schéma Payload
pnpm seed                        # 6 destinations, 4 univers, contenus d'exemple FR/EN, réglages du site
pnpm dev                         # http://localhost:3000 → 301 vers /fr ; admin : /admin
```

### Variables d'environnement (`.env.example`)

| Variable | Rôle |
|---|---|
| `DATABASE_URI` | connexion Postgres (avec pooling en production) |
| `PAYLOAD_SECRET` | secret Payload (≥ 32 caractères) |
| `NEXT_PUBLIC_SITE_URL` | origine absolue (canonical, sitemap, JSON-LD) |
| `REVALIDATE_SECRET` | protège la route de revalidation |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` | import des vidéos depuis l'admin |
| `RESEND_API_KEY` / `REQUEST_FROM_EMAIL` | notification des demandes |
| `RATE_LIMIT_SALT` | sel du hachage d'IP |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | mesure d'audience (vide = désactivée en local) |
| `S3_*` | stockage des médias (facultatif en local) |

## Scripts

| Commande | Effet |
|---|---|
| `pnpm dev` | serveur de développement |
| `pnpm build && pnpm start` | build de production (SSG) + serveur |
| `pnpm typecheck` | `tsc --noEmit` (strict) |
| `pnpm lint` | ESLint (`no-explicit-any` en erreur) + Stylelint (interdit `max-width` dans `@media`) |
| `pnpm test` | Vitest (prix, conversion, validation, métadonnées, JSON-LD, redirections) |
| `pnpm e2e` | Playwright : iPhone SE, Pixel 7, Android 360×800 en 4G lente + axe |
| `pnpm e2e:nojs` | Playwright sans JavaScript : contenu, métadonnées, JSON-LD dans le HTML servi |
| `pnpm lhci` | Lighthouse CI mobile avec les budgets de [lighthouserc.json](../../lighthouserc.json) |
| `pnpm seo:check` | crawl du build : liens cassés, hreflang réciproques, unicité et longueurs title/description, couverture des 10 mots-clés |

## Scénarios de validation (correspondance avec la spec)

1. **US1 — Demande en moins de 2 min** : `pnpm e2e --grep @us1` sur le profil Android 360 px,
   4G lente. Le test va de l'accueil à une fiche week-end puis envoie la demande ; il vérifie
   la confirmation, la ligne `requests` créée et l'e-mail (Resend en mode test), et échoue si
   le parcours dépasse 120 s.
2. **US2 — Arrivée Google sur une fiche expérience** : `pnpm e2e:nojs --grep @us2`. Le HTML
   servi contient le prix XOF, l'équivalent indicatif en euros, le fil d'Ariane, un JSON-LD
   `TouristAttraction` valide et au moins 300 mots.
3. **US3 — Gestion sans développeur** : `pnpm e2e --grep @us3`. Le test crée une expérience
   bilingue dans l'admin, la publie, puis vérifie la fiche FR et EN, la liste, la destination
   et le sitemap après revalidation. Une publication avec un `alt` EN manquant doit être
   refusée.
4. **US4 — Film et WhatsApp** : `pnpm e2e --grep @us4` sur mobile. Aucune requête vers
   `stream.mux.com` avant le clic sur lecture ; chapitre `?t=` fonctionnel ; lien `wa.me`
   présent sur chaque route publique.
5. **US5 — Bascule de langue** : `pnpm e2e --grep @us5`. 10 pages FR de types différents
   mènent à leur équivalent EN ; une page sans EN mène à la page parente avec message.

## Budgets bloquants en CI (rappel constitution II)

```json
{
  "ci": {
    "collect": { "settings": { "preset": "mobile", "throttlingMethod": "simulate" } },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 1 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 1 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["error", { "maxNumericValue": 200 }],
        "resource-summary:script:size": ["error", { "maxNumericValue": 153600 }]
      }
    }
  }
}
```

URL testées : 1 par type de page en FR et en EN (accueil, listes, fiches, destination, film,
FAQ, demande). L'admin `/admin` est exclu (voir plan, tension T6).

## Avant la mise en ligne

- Mesurer le TTFB et le LCP depuis un mobile 4G à Dakar et à Ndangane (research R6).
- Rich Results Test et validateur Schema.org : 1 URL par type de page.
- Search Console : propriété de domaine, envoi du sitemap, vérification des hreflang.
- Plausible : objectifs `request_submitted` et `whatsapp_click` configurés.
- NAP de `siteSettings` identique à la fiche Google Business Profile.
