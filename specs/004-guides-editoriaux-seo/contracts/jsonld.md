# Contrat — Données structurées des Carnets du Saloum

Complète le [contrat JSON-LD de la 001](../../001-site-public-vitrine/contracts/jsonld.md) :
même `@graph` unique par page, nœuds communs `#org` (Organization + TravelAgency) et
`BreadcrumbList`, validation en CI (schéma + test des résultats enrichis).

## Guide → `Article` + `BreadcrumbList` (+ `FAQPage`)

```json
{
  "@type": "Article",
  "@id": "{url}#article",
  "headline": "{title}",
  "description": "{seo.metaDescription}",
  "image": ["{image 16:9}", "{image 4:3}", "{image 1:1}"],
  "inLanguage": "fr-SN | en",
  "datePublished": "{publishedOn}",
  "dateModified": "{updatedOn}",
  "author": { "@type": "Person", "@id": "{authorUrl}#person", "name": "{name}", "url": "{authorUrl}" },
  "contributor": { "@type": "Person", "@id": "{reviewerUrl}#person", "name": "{name}", "url": "{reviewerUrl}" },
  "publisher": { "@id": "{origin}/#org" },
  "mainEntityOfPage": { "@id": "{url}#webpage" },
  "about": [{ "@id": "{destinationUrl}#place" }],
  "wordCount": 1234
}
```

- `headline` ≤ 110 caractères ; `contributor` seulement si un relecteur est désigné ;
  `about` = destinations liées publiées dans la langue.
- `BreadcrumbList` : Accueil › Carnets du Saloum › {titre}.
- `FAQPage` seulement si le guide a une foire aux questions (builder `faq.ts` existant).
- Interdits : `aggregateRating`, `review` (aucun avis sur les guides).

## Rubrique → `CollectionPage` + `ItemList` + `BreadcrumbList`

- `ItemList` des guides publiés dans la langue, dans l'ordre d'affichage.
- `BreadcrumbList` : Accueil › Carnets du Saloum.

## Page d'auteur → `ProfilePage` + `BreadcrumbList`

```json
{
  "@type": "ProfilePage",
  "@id": "{url}#webpage",
  "url": "{url}",
  "inLanguage": "fr-SN | en",
  "mainEntity": {
    "@type": "Person",
    "@id": "{url}#person",
    "name": "{name}",
    "jobTitle": "{role}",
    "image": "{photo}",
    "description": "{bio}",
    "homeLocation": { "@type": "Place", "name": "{place}" },
    "worksFor": { "@id": "{origin}/#org" },
    "sameAs": ["{sameAs…}"]
  }
}
```

- `BreadcrumbList` : Accueil › À propos › {nom}.
- Le même `@id` de `Person` est repris par les articles (un auteur = une entité).

## Tests

- Builders purs `src/lib/seo/jsonld/article.ts` et `profilePage.ts`, tests unitaires sur un guide
  FR seul, un guide FR + EN, un guide avec relecteur et FAQ.
- E2E SEO sans JavaScript : présence et validité du `@graph` sur la rubrique, un guide et une
  page d'auteur.
