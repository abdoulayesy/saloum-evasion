# Contrat — Données structurées JSON-LD par type de page

Rendu **côté serveur** dans un seul `<script type="application/ld+json">` contenant un
`@graph`. Typage avec `schema-dts` ; les identifiants `@id` sont stables
(`{origin}/#org`, `{url}#trip`, …). Toutes les valeurs proviennent du CMS (aucune valeur
inventée). `inLanguage` = `fr-SN` ou `en`. Les URL sont absolues.

**Interdit dans cette fonctionnalité** : `AggregateRating`, `Review` (aucun avis vérifiable,
voir principe V et research R10).

## Nœuds communs

### Organization + TravelAgency (toutes les pages indexables)

```json
{
  "@type": ["Organization", "TravelAgency"],
  "@id": "https://{domaine}/#org",
  "name": "{siteSettings.brandName}",
  "legalName": "{siteSettings.legalName}",
  "url": "https://{domaine}/fr",
  "logo": { "@type": "ImageObject", "url": "https://{domaine}/logo-512.png", "width": 512, "height": 512 },
  "image": "https://{domaine}/og-default.jpg",
  "telephone": "{siteSettings.phone}",
  "email": "{siteSettings.email}",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "…", "addressLocality": "Ndangane", "addressRegion": "Fatick",
    "postalCode": "…", "addressCountry": "SN"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": 0, "longitude": 0 },
  "areaServed": [{ "@type": "Place", "name": "Delta du Sine-Saloum" }],
  "currenciesAccepted": "XOF",
  "paymentAccepted": "Wave, Orange Money, Carte bancaire",
  "contactPoint": [{ "@type": "ContactPoint", "contactType": "customer service",
                     "telephone": "{whatsappNumber}", "availableLanguage": ["fr", "en"] }],
  "sameAs": ["{siteSettings.sameAs[]}"]
}
```

Le NAP est lu **exclusivement** dans `siteSettings` (constitution III, SEO local).

### WebSite (accueil uniquement)

`{ "@type": "WebSite", "@id": "…/#website", "url", "name", "inLanguage", "publisher": { "@id": "…/#org" } }`
Pas de `SearchAction` (pas de moteur de recherche interne indexable).

### BreadcrumbList (toutes les pages sauf accueil, demande, 404)

```json
{ "@type": "BreadcrumbList", "@id": "{url}#breadcrumb", "itemListElement": [
  { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://{domaine}/fr" },
  { "@type": "ListItem", "position": 2, "name": "Séjours", "item": "https://{domaine}/fr/sejours" },
  { "@type": "ListItem", "position": 3, "name": "{titre}" }
]}
```

Les éléments correspondent exactement au fil d'Ariane visible.

### ItemList (pages de liste, univers, hub)

`{ "@type": "ItemList", "itemListElement": [{ "@type": "ListItem", "position": n, "url": "{fiche}" }] }`

## Par type de page

### Fiche séjour → `TouristTrip`

```json
{
  "@type": "TouristTrip",
  "@id": "{url}#trip",
  "name": "{title}", "description": "{metaDescription}", "url": "{url}",
  "image": ["{heroImage}", "{gallery[0..2]}"],
  "inLanguage": "fr-SN",
  "touristType": ["{moods → libellés}"],
  "provider": { "@id": "https://{domaine}/#org" },
  "itinerary": {
    "@type": "ItemList",
    "numberOfItems": "{itinerary.length}",
    "itemListElement": [
      { "@type": "ListItem", "position": 1,
        "item": { "@type": "TouristAttraction", "name": "Jour 1 — {day.title}", "description": "{day.description texte}" } }
    ]
  },
  "offers": {
    "@type": "Offer",
    "price": "{priceFrom}", "priceCurrency": "XOF",
    "priceSpecification": { "@type": "UnitPriceSpecification", "price": "{priceFrom}",
                            "priceCurrency": "XOF", "referenceQuantity": { "@type": "QuantitativeValue", "value": 1, "unitText": "personne" } },
    "availability": "https://schema.org/InStock",
    "url": "{url}",
    "seller": { "@id": "https://{domaine}/#org" }
  },
  "subjectOf": { "@id": "{url}#faq" }
}
```

\+ `FAQPage` (`@id: {url}#faq`) si la fiche a des FAQ affichées.

### Fiche expérience → `TouristAttraction` + `Offer`

```json
{
  "@type": "TouristAttraction",
  "@id": "{url}#attraction",
  "name": "{title}", "description": "{metaDescription}", "url": "{url}", "image": ["…"],
  "isAccessibleForFree": false,
  "touristType": "{universe.name}",
  "containedInPlace": { "@id": "{destination.url}#place" },
  "geo": "{destination.geo}",
  "offers": { "@type": "Offer", "price": "{pricePerPerson}", "priceCurrency": "XOF",
              "url": "{url}", "seller": { "@id": "https://{domaine}/#org" } }
}
```

Durée, niveau et point de départ restent dans le contenu visible (pas de propriété
schema.org reconnue fiable sur ce type).

### Fiche hébergement → `LodgingBusiness` ou `VacationRental`

- `type = villa` louée entière → `VacationRental` **seulement si** les champs requis par Google
  sont disponibles (`containsPlace` Accommodation avec `occupancy`, `numberOfBedrooms`,
  `amenityFeature`, `geo`, ≥ 8 photos, `identifier`). Sinon `LodgingBusiness`.
- `ecolodge`, `campement` → `LodgingBusiness`.

```json
{
  "@type": "LodgingBusiness",
  "@id": "{url}#lodging",
  "name": "{title}", "description": "{metaDescription}", "url": "{url}", "image": ["…"],
  "address": { "@type": "PostalAddress", "addressLocality": "{destination.name}", "addressCountry": "SN" },
  "geo": { "@type": "GeoCoordinates", "latitude": "{geo.lat}", "longitude": "{geo.lng}" },
  "amenityFeature": [{ "@type": "LocationFeatureSpecification", "name": "Piscine", "value": true }],
  "numberOfRooms": "{bedrooms}",
  "maximumAttendeeCapacity": "{capacity}",
  "priceRange": "À partir de {priceFromPerNight} FCFA / nuit",
  "containedInPlace": { "@id": "{destination.url}#place" },
  "parentOrganization": { "@id": "https://{domaine}/#org" }
}
```

Les coordonnées de l'hébergement sont propres au lieu ; elles ne remplacent jamais le NAP de
l'organisation.

### Destination → `TouristDestination` (village ou île habitée) ou `TouristAttraction` (réserve)

Règle : `kind = village` ou `ile` → TouristDestination (Ndangane, Mar Lodj, Joal-Fadiouth,
Palmarin, Djiffer) ; `kind = reserve` → TouristAttraction (île aux Oiseaux). L'`@id` reste
`{url}#place` dans les deux cas.

```json
{
  "@type": "TouristDestination",
  "@id": "{url}#place",
  "name": "{name}", "description": "{metaDescription}", "url": "{url}", "image": ["…"],
  "geo": { "@type": "GeoCoordinates", "latitude": "…", "longitude": "…" },
  "containedInPlace": { "@type": "Place", "name": "Delta du Saloum, Sénégal" },
  "includesAttraction": [{ "@id": "{experience.url}#attraction" }],
  "touristType": ["…"]
}
```

### Film → `VideoObject` + `Clip`

```json
{
  "@type": "VideoObject",
  "@id": "{url}#film",
  "name": "{video.title}", "description": "{video.description}",
  "thumbnailUrl": ["https://image.mux.com/{playbackId}/thumbnail.jpg?width=1280"],
  "uploadDate": "{video.uploadDate ISO 8601 avec fuseau}",
  "duration": "PT{m}M{s}S",
  "contentUrl": "https://stream.mux.com/{playbackId}/highest.mp4",
  "embedUrl": "{url}",
  "inLanguage": "fr",
  "publisher": { "@id": "https://{domaine}/#org" },
  "hasPart": [
    { "@type": "Clip", "name": "{chapter.title}", "startOffset": 0, "endOffset": 74, "url": "{url}?t=0" },
    { "@type": "Clip", "name": "{chapter.title}", "startOffset": 74, "endOffset": 150, "url": "{url}?t=74" }
  ]
}
```

- `contentUrl` = rendu MP4 statique de Mux (un manifeste HLS `.m3u8` n'est pas un format
  d'URL de contenu reconnu pour l'indexation vidéo) ; la lecture sur le site reste en HLS.
- `endOffset` = début du chapitre suivant (ou durée totale pour le dernier).
- La page **doit** gérer `?t={secondes}` (le lecteur se positionne au chapitre après le clic
  sur lecture) ; les liens de chapitre visibles utilisent les mêmes URL.
- Chaque vidéo verticale de 15 s : `VideoObject` distinct (sans `hasPart`).
- La vidéo doit être l'élément principal et visible de la page film (condition d'indexation).

### FAQ → `FAQPage`

```json
{ "@type": "FAQPage", "@id": "{url}#faq", "mainEntity": [
  { "@type": "Question", "name": "{question}",
    "acceptedAnswer": { "@type": "Answer", "text": "{answer HTML simplifié}" } }
]}
```

Uniquement des questions et réponses visibles sur la page.

### Pages éditoriales

`AboutPage` (À propos, Engagement), `ContactPage` (Contact), `WebPage` (autres), toujours avec
`isPartOf` → `#website` et `about` → `#org`.

## Validation

- **Unitaire (Vitest)** : chaque générateur renvoie un objet typé `schema-dts` ; tests
  d'instantané par type ; règles : prix entiers et `priceCurrency = "XOF"`, aucune clé
  `aggregateRating` ou `review`, `@id` résolubles dans le graphe.
- **E2E (Playwright)** : extraction du JSON-LD sur le HTML servi sans JS pour 1 page de chaque
  type ; `JSON.parse` réussi ; types attendus présents ; fil d'Ariane identique au visible.
- **Avant lancement** : test manuel Rich Results et validateur Schema.org sur 1 URL par type.
