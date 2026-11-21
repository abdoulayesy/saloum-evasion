# Mesure des Carnets du Saloum (004, T068)

Complète la mesure du tunnel (`docs/analytics.md`, feature 002). Plausible, sans cookie ni donnée
personnelle ; aucun JavaScript ajouté par page : les clics passent par l'écouteur délégué existant
(`src/components/client/Analytics.tsx`). Contrat :
[specs/004-guides-editoriaux-seo/contracts/analytics-events.md](../specs/004-guides-editoriaux-seo/contracts/analytics-events.md).

## Objectifs à créer dans Plausible

Réglages du site → **Goals** → *Custom event* :

| Objectif | Quand | Propriétés |
|---|---|---|
| `guide_offer_click` | clic sur une offre ou une destination depuis un guide (cartes « Pour aller plus loin ») | `guide`, `target`, `locale` |
| `guide_card_click` | clic sur une carte de l'encart « À lire dans les Carnets du Saloum » d'une fiche | `guide`, `from`, `locale` |

`whatsapp_click` existe déjà : depuis un guide, sa propriété `placement` vaut `guide` (bouton du
guide) ou `sticky_bar` (barre collante) avec `pageType: guide`.

Réglages du site → **Custom properties** : ajouter `guide`, `target`, `from` (et `locale`,
`placement`, `pageType` s'ils n'existent pas encore).

`guide` = slug du guide **dans la langue de la page**, pour correspondre aux pages vues, comptées
par chemin (`/fr/carnets-du-saloum/{slug}`, `/en/saloum-travel-guides/{slug}`).

## SC-004 : 15 % des lectures suivies d'un clic

Sur 28 jours, par guide et par langue :

```text
(guide_offer_click + whatsapp_click avec pageType = guide) ÷ pages vues du chemin du guide
```

Dans Plausible : filtre *Page* = chemin du guide pour les pages vues ; objectifs filtrés par la
propriété `guide` (et `pageType = guide` pour WhatsApp).

## SC-002 : top 10 Google à 6 mois

Relevé **mensuel** dans Google Search Console → *Performances* → *Résultats de recherche* :

1. Filtre *Page* = adresse du guide (FR, puis EN).
2. Onglet *Requêtes* : relever la position moyenne de la requête cible (registre
   `src/lib/seo/keywords.ts`) sur les 28 derniers jours.
3. Reporter dans le tableau ci-dessous ; objectif ≤ 10 six mois après la publication.

| Guide | Publié le | Requête FR | Position FR | Requête EN | Position EN | Relevé du |
|---|---|---|---|---|---|---|
| Que faire au Sine-Saloum | — | que faire au Sine-Saloum | — | things to do in Sine-Saloum | — | — |
| Quand partir au Sine-Saloum | — | quand partir au Sine-Saloum | — | best time to visit Sine-Saloum | — | — |
| Aller de Dakar ou de l'AIBD à Ndangane | — | Dakar Ndangane | — | Dakar to Ndangane | — | — |
| Week-end au Sine-Saloum depuis Dakar | — | week-end Sine-Saloum depuis Dakar | — | Sine-Saloum weekend from Dakar | — | — |
| Les huîtres de palétuviers | — | huîtres de palétuviers Sénégal | — | mangrove oysters Senegal | — | — |
| La culture sérère | — | culture sérère | — | Serer culture | — | — |
| Mar Lodj, l'île sans voitures | — | que faire à Mar Lodj | — | things to do in Mar Lodj | — | — |

La date « Publié le » (première publication, champ `publishedOn` du guide) est le point de départ
des six mois. Un guide en retard se travaille en priorité : contenu enrichi, liens internes,
liens externes (partenaires, office du tourisme).

## Hub des expériences

Depuis la 004, le hub des expériences cible « activités Sine-Saloum » / « Sine-Saloum activities ».
Surveiller ses positions le premier mois après le recentrage (`pnpm cms:experiences-hub` sur un CMS
existant).
