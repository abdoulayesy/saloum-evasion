# Contrat — Mise en avant des restaurants

## Emplacements

| Emplacement | Pages | Position |
|---|---|---|
| `destination` | fiche destination choisie (`/fr/destinations/{slug}`, `/en/destinations/{slug}`) | après la section « Que faire », avant les hébergements |
| `tablesUniverse` | page de l'univers « Table du Saloum » | en tête de la liste, au-dessus des cartes éditoriales, séparée par un titre |
| `nearbyExperiences` | fiches d'expériences de la même destination que l'offre montrée | dans le bloc « À proximité », en première position du bloc, distincte des suggestions |

Au plus **une** mise en avant active par page. L'ordre des listes éditoriales ne change jamais.

## Carte

- Composant serveur `SponsoredCard`, rendu avec la page statique.
- Contenu : mention **« Partenaire mis en avant »** (FR) / **« Featured partner »** (EN) en texte,
  au-dessus du titre, avec une icône décorative (`aria-hidden`) ; photo principale de l'offre
  (même règles d'image que les cartes de la 001, chargement différé), titre, prix « à partir de »
  TTC FCFA et « ≈ € indicatif ».
- La carte entière est un lien vers la fiche de l'offre, `rel="sponsored"` ; nom accessible =
  mention + titre (« Partenaire mis en avant : Table du Saloum chez Fatou »).
- Contraste de la mention ≥ 4,5:1 ; aucune information portée par la seule couleur.
- **Jamais** dans le JSON-LD de la page (ni `ItemList`, ni note, ni avis).

## Publication

- Les pages concernées portent le tag de cache `sponsored` ; il est invalidé à chaque
  enregistrement d'une mise en avant et chaque jour à 00 h 05 (Dakar) par la tâche
  `refreshSponsored` (débuts et fins de période).
- Statut calculé (data-model) ; mise en avant `suspended` si l'offre est dépubliée ou le
  prestataire désactivé.

## Mesure : `POST /api/sponsored/hit`

- Corps : `{ "placement": 7, "event": "view" | "click" }` envoyé par `navigator.sendBeacon`
  depuis l'îlot `SponsoredBeacon` (< 1 Ko) : `view` au premier passage à 50 % de visibilité,
  `click` au clic.
- Incrément atomique de `sponsoredStats(placement, semaine ISO)` ; réponse `204`.
- Aucun cookie, aucune adresse IP ni identifiant stocké ; requêtes de robots ignorées (en-tête
  `User-Agent`) ; limite 60 requêtes / min / IP hachée en mémoire de la requête de limitation.
- Mise en avant inactive ou inconnue : `204` sans effet.

## Tests

- Unitaires : statut calculé (dates, paiement, suspension), choix de la mise en avant unique par
  page, semaine ISO.
- E2E `@sponsored` : mention visible et lue par le lecteur d'écran (nom accessible) à 360 px et
  1280 px, FR et EN ; `rel="sponsored"` ; absente du JSON-LD ; liste éditoriale inchangée ;
  disparition hors période ; axe sans erreur.
