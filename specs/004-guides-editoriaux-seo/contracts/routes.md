# Contrat — Routes, rendu et SEO des Carnets du Saloum

Complète le [contrat des routes de la 001](../../001-site-public-vitrine/contracts/routes.md).
Mêmes règles : rendu statique + `revalidateTag`, slugs propres à chaque langue, `x-default` = FR,
une page sans version anglaise complète n'existe pas en anglais et n'est pas annoncée.

## Table des routes

| Type de page | FR | EN | Index | Rendu |
|---|---|---|---|---|
| Rubrique | `/fr/carnets-du-saloum` | `/en/saloum-travel-guides` | index | SSG + tag `guides` |
| Guide | `/fr/carnets-du-saloum/{slug}` | `/en/saloum-travel-guides/{slug}` | index | SSG + ISR (`doc:guides:{id}`) |
| Page d'auteur | `/fr/equipe/{slug}` | `/en/team/{slug}` | index | SSG + ISR (`doc:teamMembers:{id}`) |

Nouveaux types de la union `Route` (`src/i18n/pathnames.ts`) : `guidesHub`, `guide` (`slug`),
`author` (`slug`). Segments : `carnets-du-saloum` / `saloum-travel-guides`, `equipe` / `team`.

## Métadonnées

| Page | `title` (≤ 60) | Description (≤ 155) | Canonical | hreflang |
|---|---|---|---|---|
| Rubrique | « Carnets du Saloum : guides du Sine-Saloum \| Saloum Évasion » / « Saloum Travel Guides \| Saloum Évasion » | texte de la rubrique (CMS) | elle-même | FR ↔ EN + `x-default` |
| Guide | `seo.metaTitle` du guide | `seo.metaDescription` | elle-même | seulement si `enPublished` |
| Page d'auteur | « {Nom}, {rôle} \| Saloum Évasion » | extrait de la présentation | elle-même | seulement si la page existe dans les deux langues |

- Open Graph `article` pour un guide (`article:published_time`, `article:modified_time`,
  `article:author` = URL de la page d'auteur), image = `seo.shareImage` sinon image principale.
- Un seul H1 : titre du guide, nom de la rubrique, nom de l'auteur.

## Structure d'une page guide (ordre du HTML servi)

1. Fil d'Ariane : Accueil › Carnets du Saloum › {titre}.
2. H1, chapeau, ligne de signature : photo (48 px) et nom de l'auteur (lien vers sa page), rôle,
   lieu ; « Relu par {nom} » (lien) ; « Mis à jour le {date} » (`<time datetime>`) ; temps de
   lecture.
3. Image principale (LCP, `priority`).
4. Table des matières (`<nav aria-labelledby>` dans un `<details open>`) si ≥ 3 H2.
5. Corps (H2 avec `id` = ancre, H3, encadrés pratiques, images avec légende et crédit).
6. Foire aux questions (si présente).
7. « Pour aller plus loin » : cartes des offres liées publiées dans la langue (visuel, nom, prix
   « à partir de » en FCFA avec conversion indicative en euros pour une offre vendue).
8. Présentation de l'auteur (photo, nom, rôle, lieu, présentation courte, lien vers sa page).
9. Autres guides de la rubrique (3 au plus, même thème d'abord) et contact WhatsApp en un geste.

Barre d'action collante existante (WhatsApp) conservée.

## Encart sur les fiches

Sur les fiches séjour, expérience, hébergement et destination : section « À lire dans les Carnets
du Saloum » / « From our Saloum Travel Guides », placée après le contenu principal et avant les
suggestions, 1 à 3 cartes (image, titre, temps de lecture). Absente si aucun guide publié dans la
langue n'est lié.

## Liens d'entrée

- Menu principal et pied de page : entrée « Carnets du Saloum » / « Saloum Travel Guides »
  (route `guidesHub` ajoutée aux routes internes du global `navigation`).
- « À propos » : la carte d'un membre renvoie vers sa page d'auteur quand elle existe.

## Sitemap

- Rubrique, chaque guide (`lastModified` = `updatedOn`, images : principale et corps), chaque page
  d'auteur, par langue publiée, avec `alternates.languages`.

## Redirections

- Changement de slug d'un guide publié → 301 (hook `autoRedirect` existant).
- Changement de `slug` d'un membre de l'équipe ayant une page d'auteur → 301 des pages
  `/fr/equipe/…` et `/en/team/…` (même hook, étendu à `teamMembers`).
- Bascule de langue sans version traduite : guide → rubrique, page d'auteur → « À propos »
  (`parentRoute`).
- Dépublication d'un guide → 404 (pas de redirection automatique) ; les liens internes
  disparaissent par revalidation.
