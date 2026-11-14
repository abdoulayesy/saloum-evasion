# Data Model — 001 Site public Saloum Évasion

Modèle des collections et globals Payload (PostgreSQL). **L** = champ localisé (FR, EN).
Tous les montants sont en **XOF entiers** (`integer`, ≥ 0). Les collections de contenu
utilisent les **brouillons et versions** de Payload (`_status: draft | published`).

## Groupes de champs réutilisables

### `seo` (sur toute collection publique et `pages`)

| Champ | Type | L | Règles |
|---|---|---|---|
| `slug` | text | ✓ | obligatoire, `^[a-z0-9]+(-[a-z0-9]+)*$`, unique par collection et par langue ; généré depuis le titre, éditable |
| `metaTitle` | text | ✓ | obligatoire, ≤ 60 caractères, unique sur le site (hook de validation) |
| `metaDescription` | textarea | ✓ | obligatoire, ≤ 155 caractères, unique sur le site |
| `shareImage` | upload → `media` | | facultatif ; défaut = image principale ; l'image OG 1200×630 est générée à partir de celle-ci |
| `targetKeyword` | text | ✓ | facultatif ; sert au rapport de couverture des mots-clés (FR-026) |
| `noindex` | checkbox | | défaut `false` ; forcé à `true` pour `requests` |

### `localeStatus` (sur toute collection publique)

| Champ | Type | Règles |
|---|---|---|
| `enPublished` | checkbox | calculé : `true` seulement si tous les champs EN obligatoires sont remplis ; sinon la page EN n'est ni générée, ni listée, ni annoncée en hreflang |

### `body` (fiches)

Texte riche localisé (Lexical). **Validation** : au moins 300 mots par langue publiée
(FR-023), comptés hors titres.

## Collections

### `stays` (Séjours signature)

| Champ | Type | L | Règles |
|---|---|---|---|
| `title` | text | ✓ | obligatoire |
| `summary` | textarea | ✓ | obligatoire, ≤ 200 car. (cartes de liste) |
| `heroImage` | upload → media | | obligatoire (image LCP) |
| `gallery` | array<upload → media> | | 3 à 20 éléments |
| `durationNights` | number | | entier 1 à 21 |
| `durationCategory` | select | | `weekend` (1 à 2 nuits) \| `short` (3 à 4) \| `week` (5 et plus) ; calculé depuis `durationNights` |
| `moods` | select multiple | | `nature`, `culture`, `gastronomie`, `detente`, `aventure`, `famille` |
| `pricing.lowSeasonPerPerson` | integer XOF | | obligatoire |
| `pricing.highSeasonPerPerson` | integer XOF | | obligatoire, ≥ basse saison |
| `pricing.basis` | text | ✓ | défaut « par personne, base 2 adultes » |
| `budgetBand` | select | | `lt250k` \| `250k-500k` \| `gt500k` ; calculé depuis le prix « à partir de » |
| `itinerary` | array | | ≥ 1 ; `{ day: number, title L, description L }` |
| `included` / `notIncluded` | array<text L> | ✓ | `included` ≥ 1 |
| `cancellationPolicy` | relationship → `cancellationPolicies` | | **obligatoire** (principe V) |
| `destinations` | relationship[] → destinations | | ≥ 1 |
| `accommodations` | relationship[] → accommodations | | |
| `experiences` | relationship[] → experiences | | |
| `similarStays` | relationship[] → stays | | facultatif ; défaut automatique (même destination ou mêmes envies) |
| `faq` | relationship[] → faqItems | | |
| `mapIllustration` | select | | identifiant d'une illustration SVG de la bibliothèque |
| `maxTravellers` | number | | facultatif |
| `featured` | checkbox | | mis en avant sur l'accueil |
| `replacementTarget` | relationship → stays | | cible de la 301 si le séjour est dépublié ou supprimé ; sinon liste parente |
| `body`, `seo`, `localeStatus` | groupes | | |

`experiences`, `accommodations` et `destinations` ont aussi un champ `replacementTarget`
(relation vers la même collection).

**Dérivé** : `priceFrom = min(low, high)` ; `priceFromEur = ceil(priceFrom / 655.957)`.

### `experiences`

| Champ | Type | L | Règles |
|---|---|---|---|
| `title`, `summary`, `heroImage`, `gallery` | comme `stays` | | |
| `universe` | relationship → universes (`kind = experience`) | | obligatoire ; fait partie de l'URL |
| `durationMinutes` | number | | obligatoire |
| `level` | select | | `facile` \| `modere` \| `sportif` |
| `seasonMonths` | select multiple (1 à 12) | | ≥ 1 ; « toute l'année » si 12 |
| `meetingPoint` | text | ✓ | obligatoire |
| `pricePerPerson` | integer XOF | | obligatoire |
| `minParticipants` | number | | défaut 1 |
| `destination` | relationship → destinations | | obligatoire |
| `faq` | relationship[] → faqItems | | |
| `body`, `seo`, `localeStatus` | | | |

### `accommodations` (Hébergements)

| Champ | Type | L | Règles |
|---|---|---|---|
| `title`, `summary`, `heroImage`, `gallery` | | | `gallery` ≥ 5 |
| `type` | select | | `villa` \| `ecolodge` \| `campement` |
| `capacity` | number | | obligatoire, ≥ 1 |
| `bedrooms` | number | | |
| `amenities` | select multiple | | `piscine`, `climatisation`, `wifi`, `vue-bolong`, `acces-plage`, `cuisine`, `parking`, `pmr`… |
| `priceFromPerNight` | integer XOF | | obligatoire |
| `destination` | relationship → destinations | | obligatoire |
| `geo` | point (lat, lng) | | obligatoire (JSON-LD `geo`) ; pas de carte interactive |
| `address` | text | ✓ | localité ou adresse affichable |
| `identifier` | text | | facultatif ; identifiant de location (requis pour le balisage VacationRental, avec au moins 8 photos) |
| `body`, `seo`, `localeStatus` | | | |

### `destinations`

| Champ | Type | L | Règles |
|---|---|---|---|
| `name` | text | ✓ | obligatoire |
| `heroImage`, `gallery` | | | |
| `intro` | textarea | ✓ | |
| `geo` | point | | obligatoire |
| `kind` | select | | `village` \| `ile` \| `reserve` (TouristDestination ou TouristAttraction) |
| `body`, `seo`, `localeStatus` | | | |

**Relations inverses** (requêtes, non stockées) : séjours, expériences et hébergements dont
`destination(s)` contient ce document. Une section vide n'est pas affichée.

Valeurs initiales : Ndangane, Mar Lodj, Île aux Oiseaux, Joal-Fadiouth, Palmarin, Djiffer.

### `universes`

| Champ | Type | L | Règles |
|---|---|---|---|
| `name` | text | ✓ | |
| `kind` | select | | `experience` \| `stay` |
| `image` | upload | | |
| `intro` | textarea | ✓ | |
| `order` | number | | |
| `seo` | groupe | | seulement si `kind = experience` (page publique) |

Valeurs initiales : Mangrove & îles, Terre & villages, Table du Saloum (`experience`) ;
Séjours & hébergements (`stay`).

### `videos`

| Champ | Type | L | Règles |
|---|---|---|---|
| `title`, `description` | text / textarea | ✓ | obligatoires (VideoObject) |
| `format` | select | | `film` \| `vertical15` \| `loop` |
| `muxPlaybackId` | text | | obligatoire |
| `durationSeconds` | number | | obligatoire ; `vertical15` ≤ 15 ; `loop` ≤ 8 |
| `poster` | upload → media | | obligatoire, ≤ 120 Ko après optimisation |
| `captions` | array `{ locale: fr\|en, file: upload .vtt }` | | **FR et EN obligatoires** pour `film` et `vertical15` |
| `chapters` | array `{ title L, startSeconds }` | | ≥ 2 pour `film` ; strictement croissants ; le premier = 0 |
| `uploadDate` | date | | obligatoire |
| `descriptiveTranscript` | texte riche | ✓ | transcription descriptive (alternative textuelle) ; obligatoire pour `film` et `vertical15` |
| `provenance` | groupe (voir `media`) | | obligatoire |

### `media` (photos)

| Champ | Type | L | Règles |
|---|---|---|---|
| fichier | upload (image) | | JPEG/PNG/WebP/AVIF source ≥ 1600 px de large ; dérivés AVIF/WebP générés par next/image |
| `alt` | text | ✓ | **obligatoire en FR et EN** (principes III et IV) |
| `provenance.author` | text | | **obligatoire** (principe V) |
| `provenance.place` | text | | **obligatoire** |
| `provenance.date` | date | | **obligatoire** |
| `blurDataURL` | text | | généré à l'envoi (placeholder flou) |
| `width` / `height` | number | | automatiques (dimensions explicites) |

### `faqItems`

`question` (L, obligatoire), `answer` (texte riche L, obligatoire), `category` (`general`,
`reservation`, `paiement`, `transport`, `sejour`), `order`. Rattachées aux fiches par relation
et listées sur `/faq`.

### `cancellationPolicies`

`name`, `summary` (L, ≤ 160 car., affiché près du prix et dans le formulaire), `details`
(texte riche L).

### `pages` (pages éditoriales)

`key` (select unique : `home`, `commitment`, `about`, `faq`, `contact`, `legal`, `privacy`,
`film`, `stays_list`, `experiences_hub`, `accommodations_list`, `destinations_list`,
`not_found`), `title` (L), `blocks` (blocs de mise en page : héro, texte, équipe, chiffres,
galerie, étapes, garanties, CTA, registre des traitements), `seo`, `localeStatus`. Les clés de
liste et `not_found` fournissent le title, la description et l'image de partage des pages
sans document propre.

### `teamMembers`

`name`, `role` (L), `photo` (média réel), `bio` (L), `order`. Affichés sur À propos.

### `requests` (Demandes de séjour)

Non publique ; lecture et modification réservées aux `users`. Création uniquement via la
Server Action (accès API public refusé).

| Champ | Type | Règles |
|---|---|---|
| `reference` | text | unique, `SE-AAAAMMJJ-XXXX`, généré |
| `submissionId` | text (UUID) | **unique** (idempotence) |
| `items` | array `{ kind: stay\|experience\|accommodation, doc: relationship, titleSnapshot }` | 0 à 10 |
| `arrivalDate` | date | obligatoire, ≥ aujourd'hui (heure de Dakar, UTC+0) |
| `departureDate` | date | facultatif, > arrivée, ≤ arrivée + 60 j |
| `adults` | number | 1 à 30 |
| `children` | number | 0 à 20 |
| `moods` | select multiple | mêmes valeurs que `stays.moods` |
| `budgetBand` | select | facultatif |
| `firstName` | text | 1 à 60 car. |
| `whatsapp` | text | E.164 (`^\+[1-9]\d{7,14}$`) |
| `email` | email | facultatif |
| `message` | textarea | ≤ 1000 car. |
| `locale` | select fr\|en | |
| `sourcePath` | text | page d'origine |
| `consentAt` | date-time | obligatoire |
| `status` | select | `new` → `in_progress` → `quoted` → `won` \| `lost` ; `spam` (depuis tout état) |
| `notifiedAt` | date-time | renseigné après envoi de l'e-mail ; `null` = alerte dans l'admin |
| `notifyAttempts` | number | nombre d'envois tentés (relance automatique toutes les 10 min, 3 au plus, puis alerte de secours) |

**Rétention** : tâche planifiée qui supprime les demandes de plus de 24 mois au statut ≠ `won`.

### `redirects`

`from` (chemin, unique), `to` (chemin ou référence de document), `type` (301), `reason`
(`slug_change` \| `unpublished` \| `manual`). Créée automatiquement par des hooks ; chaînes
aplaties.

### `rateLimits` (technique, hors admin)

`ipHash` (SHA-256 salé), `windowStart`, `count`. Purge à 24 h.

### `users` (équipe)

Authentification Payload (e-mail + mot de passe, 12 caractères minimum). Rôles : `admin`
(tout), `editor` (contenus + demandes). Pas de compte visiteur.

### `reviews` (réservée, non implémentée dans cette fonctionnalité)

Prévue pour une fonctionnalité ultérieure, avec une relation obligatoire vers une réservation
terminée (principe V).

## Globals

### `siteSettings`

| Champ | Règles |
|---|---|
| `legalName`, `brandName` | NAP : **source unique** (FR-032) |
| `address` (streetAddress, locality « Ndangane », region « Fatick », country « SN », postalCode) | identique à la fiche Google Business Profile |
| `phone`, `whatsappNumber` | E.164 |
| `email` | |
| `geo` | coordonnées du siège |
| `sameAs` | URLs des réseaux sociaux et de la fiche GBP |
| `responseTimeText` | L ; défaut « Réponse sous 24 h, souvent dans l'heure » |
| `highSeasons` | array `{ from: MM-DD, to: MM-DD }` |
| `guarantees` | array `{ icon, title L, text L }` |
| `paymentMethods` | ordre fixe affiché : Wave, Orange Money, carte bancaire (même rang) |
| `notificationEmail` | destinataire des demandes |
| `fallbackNotificationEmail` | destinataire de l'alerte si les relances de notification échouent |

### `navigation`

Menus principal et pied de page (libellés L, liens internes vers des documents).

## Transitions d'état

```text
Contenu :  draft ──publish──▶ published ──unpublish──▶ draft (+ redirect auto 301)
                    │  slug modifié ──▶ redirect auto ancien → nouveau
                    └─ hook afterChange ──▶ revalidateTag(doc, collection, liés, sitemap)

Demande :  new ─▶ in_progress ─▶ quoted ─▶ won | lost      (tout état ─▶ spam)
```

## Règles de validation transverses

- Publication refusée si : `alt` FR/EN ou provenance manquants sur un média utilisé ; `body`
  < 300 mots ; `cancellationPolicy` absente (séjours) ; `metaTitle`/`metaDescription`
  au-delà des limites ou non uniques.
- EN incomplet ⇒ publication FR seule ; page EN absente du rendu, du sitemap et des hreflang.
