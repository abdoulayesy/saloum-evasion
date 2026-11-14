# Contrat — Routes publiques, SEO par type de page

Basé sur [research R1](../research.md#r1-stratégie-durl-et-de-langues-défaut--à-confirmer)
(slugs traduits, `/` → 301 `/fr`, `x-default` = FR). Toutes les routes publiques sont
**statiques ou ISR** (aucun contenu indexable rendu seulement côté client).

## Table des routes

| Type de page | FR | EN | Index | Rendu |
|---|---|---|---|---|
| Racine | `/` → **301** `/fr` | — | — | redirection (config) |
| Accueil | `/fr` | `/en` | index | SSG + tag |
| Liste séjours | `/fr/sejours` | `/en/stays` | index | SSG |
| Fiche séjour | `/fr/sejours/{slug}` | `/en/stays/{slug}` | index | SSG + ISR |
| Hub expériences | `/fr/experiences` | `/en/experiences` | index | SSG |
| Univers | `/fr/experiences/{univers}` | `/en/experiences/{universe}` | index | SSG |
| Fiche expérience | `/fr/experiences/{univers}/{slug}` | `/en/experiences/{universe}/{slug}` | index | SSG + ISR |
| Liste hébergements | `/fr/hebergements` | `/en/accommodation` | index | SSG |
| Fiche hébergement | `/fr/hebergements/{slug}` | `/en/accommodation/{slug}` | index | SSG + ISR |
| Liste destinations | `/fr/destinations` | `/en/destinations` | index | SSG |
| Destination | `/fr/destinations/{slug}` | `/en/destinations/{slug}` | index | SSG + ISR |
| Film | `/fr/film-immersion` | `/en/immersion-film` | index | SSG |
| Engagement | `/fr/notre-engagement` | `/en/our-commitment` | index | SSG |
| À propos | `/fr/a-propos` | `/en/about` | index | SSG |
| FAQ | `/fr/faq` | `/en/faq` | index | SSG |
| Contact | `/fr/contact` | `/en/contact` | index | SSG |
| Mentions légales | `/fr/mentions-legales` | `/en/legal-notice` | **noindex, follow** | SSG |
| Confidentialité | `/fr/confidentialite` | `/en/privacy` | index | SSG |
| Demande | `/fr/demande` | `/en/request` | **noindex** | dynamique (Server Action) |
| Confirmation | `/fr/demande/merci` | `/en/request/thank-you` | **noindex** | dynamique |
| 404 | toute URL inconnue | | noindex, **statut 404** | `not-found.tsx` localisé |
| 500 | erreur serveur | | noindex, **statut 500** | `error.tsx` / `global-error.tsx` |
| Admin | `/admin/**` | | `Disallow` + noindex | Payload |
| Techniques | `/sitemap.xml`, `/robots.txt`, `/api/**` | | — | route handlers |

**Pages sans document propre** (listes, hub des expériences, 404) : title, description et image
de partage proviennent de la collection `pages` (clés `stays_list`, `experiences_hub`,
`accommodations_list`, `destinations_list`, `not_found`), donc éditables et soumis au contrôle
d'unicité.

**Paramètres de filtre** (`?duree=weekend&envie=nature&budget=lt250k`) : la page filtrée garde
le canonical de la liste sans paramètres ; aucun lien interne indexable vers des combinaisons
de filtres.

**Slugs d'univers** : `mangrove-et-iles`/`mangrove-and-islands`,
`terre-et-villages`/`land-and-villages`, `table-du-saloum`/`saloum-table`.

## Exigences SEO par type de page

Légende JSON-LD : **Org** = Organization + TravelAgency (toutes les pages indexables),
**BC** = BreadcrumbList. Détails dans [jsonld.md](./jsonld.md).

| Type | Title / description | H1 | JSON-LD | Fil d'Ariane | Image OG | Sitemap | Maillage interne | Mot-clé cible (FR / EN) |
|---|---|---|---|---|---|---|---|---|
| Accueil | page `home` | promesse | Org, WebSite | non (racine) | héro | ✓ prio 1.0 | séjours vedettes, 4 univers, 6 destinations, film | séjour Sine-Saloum / Sine-Saloum holiday |
| Liste séjours | page fixe | « Séjours signature » | Org, BC, ItemList | ✓ | héro de la liste | ✓ | toutes les fiches séjour | séjour Sine-Saloum / Sine-Saloum trip |
| Fiche séjour | doc `seo` | titre | Org, BC, TouristTrip (+ itinerary, offers XOF), FAQPage si FAQ | ✓ | `shareImage` ou héro | ✓ + images | destinations, hébergements, expériences incluses, séjours similaires | ex. week-end Ndangane / Ndangane weekend |
| Hub expériences | page fixe | « Que faire au Sine-Saloum » | Org, BC, ItemList | ✓ | héro | ✓ | 3 univers + expériences vedettes | que faire au Sine-Saloum / things to do in Sine-Saloum |
| Univers | doc `seo` | nom de l'univers | Org, BC, ItemList | ✓ | image univers | ✓ | expériences de l'univers, destinations | ex. excursion mangrove Saloum |
| Fiche expérience | doc `seo` | titre | Org, BC, TouristAttraction + offers (XOF/personne), FAQPage si FAQ | ✓ | héro | ✓ + images | destination, séjours qui l'incluent, expériences de la même destination | excursion pirogue Sine-Saloum ; quad Sine-Saloum ; balade à cheval Palmarin (+ EN) |
| Liste hébergements | page fixe | « Hébergements » | Org, BC, ItemList | ✓ | héro | ✓ | toutes les fiches | lodge Sine-Saloum / Sine-Saloum lodge |
| Fiche hébergement | doc `seo` | titre | Org, BC, LodgingBusiness (VacationRental pour une villa entière) | ✓ | héro | ✓ + images | destination, séjours qui l'incluent, hébergements voisins | villa piscine Ndangane / Ndangane villa with pool |
| Liste destinations | page fixe | « Destinations » | Org, BC, ItemList | ✓ | carte SVG ou héro | ✓ | 6 destinations | Sine-Saloum destinations |
| Destination | doc `seo` | nom | Org, BC, TouristDestination (village) ou TouristAttraction (réserve) | ✓ | héro | ✓ + images | séjours, expériences, hébergements du lieu | Mar Lodj ; île aux Oiseaux Saloum ; week-end Ndangane (+ EN) |
| Film | page `film` | titre du film | Org, BC, VideoObject + Clip par chapitre (+ VideoObject par vidéo verticale) | ✓ | affiche du film | ✓ + `<video:video>` | séjours vedettes, engagement | film Sine-Saloum / Sine-Saloum film |
| FAQ | page `faq` | « Questions fréquentes » | Org, BC, FAQPage | ✓ | défaut | ✓ | fiches citées dans les réponses, contact | réserver séjour Sine-Saloum (informationnel) |
| Engagement, À propos, Contact, Confidentialité | page | titre | Org, BC (+ AboutPage / ContactPage) | ✓ | défaut ou photo d'équipe | ✓ | accueil, séjours | aucun (marque) |
| Mentions légales | page | titre | Org, BC | ✓ | défaut | **✗** | — | aucun |
| Demande, Confirmation | fixe | titre | aucun | non | — | **✗** | retour fiche / accueil | aucun |
| 404 / 500 | fixe | « Page introuvable » | aucun | non | — | **✗** | recherche de l'accueil + 3 séjours populaires + destinations | aucun |

**Couverture des mots-clés FR-026** : vérifiée par un test qui lit le champ `seo.targetKeyword`
de tous les documents publiés et échoue si l'un des 10 mots-clés (ou son équivalent EN)
n'est porté par aucune page indexable.

## Métadonnées communes (generateMetadata)

```text
title           = seo.metaTitle (≤ 60, unique)          — modèle : « {titre} | Saloum Évasion » si ça tient
description     = seo.metaDescription (≤ 155, unique)
alternates.canonical = URL absolue de la page dans sa langue, sans paramètres
alternates.languages = { fr: URL FR, en: URL EN (si enPublished), 'x-default': URL FR }
openGraph       = { type: website|article, locale: fr_SN|en_US, alternateLocale, url, title, description,
                    images: [{ url: /{locale}/.../opengraph-image, width: 1200, height: 630, alt }] }
twitter         = { card: summary_large_image, title, description, images }
robots          = { index: !noindex, follow: true }
```

## Redirections

| Cas | Règle |
|---|---|
| `/` | 301 → `/fr` (fixe, sans détection de langue) |
| Barre oblique finale, majuscules | 301 vers la forme canonique (minuscules, sans `/` final) |
| Slug modifié | 301 ancien → nouveau, créée par un hook (`redirects.reason = slug_change`) |
| Contenu dépublié | 301 → cible choisie par l'éditeur, sinon liste parente (`unpublished`) |
| Expérience changée d'univers | 301 ancienne URL imbriquée → nouvelle |
| Page EN absente (sélecteur de langue) | le sélecteur pointe vers la page EN parente la plus proche, avec `?from=missing` pour afficher un message ; aucune redirection serveur |

Les redirections du CMS sont chargées par le middleware à partir d'une table compilée et
mise en cache (tag `redirects`), au plus 1 saut.

## Sitemap (`app/sitemap.ts`)

- Une entrée par page indexable **et par langue publiée**, avec `alternates.languages`
  (hreflang dans le sitemap), `lastModified` = `updatedAt` réel du document.
- Extension image : héro + galerie (URL absolues). Extension vidéo : film et vidéos
  verticales (`thumbnail_loc` = affiche, `title`, `description`, `content_loc` = URL HLS,
  `duration`).
- Exclus : noindex, demande, confirmation, admin, pages EN non publiées.
- Régénéré par `revalidateTag('sitemap')` à chaque publication.

## robots.txt

```text
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Sitemap: https://{domaine}/sitemap.xml
```

> Les pages de demande ne sont **pas** bloquées dans `robots.txt` : Google doit pouvoir les
> crawler pour lire leur `noindex` (une page bloquée peut être indexée sans contenu si un
> lien externe y mène). Elles portent `<meta name="robots" content="noindex, follow">` et sont
> absentes du sitemap.
