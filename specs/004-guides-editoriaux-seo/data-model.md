# Data model — 004 Guides éditoriaux « Carnets du Saloum »

Conventions de la 001 : champs localisés FR (référence) et EN, `fallback: false` ; slugs
localisés en minuscules avec tirets ; brouillons et versions Payload ; `localeStatus.enPublished`
calculé ; médias avec texte alternatif FR/EN et provenance obligatoires à la publication.

## `guides` (nouvelle collection)

Construite avec `contentDefaults` (`src/collections/shared.ts`) : lecture publique des seuls
documents publiés, écriture `admin` / `editor`, redirections automatiques au changement de slug,
revalidation.

| Champ | Type | Localisé | Règles |
|---|---|---|---|
| `title` | text | oui | obligatoire en FR ; H1 de la page |
| `standfirst` | textarea | oui | chapeau ; avertissement hors de 140–300 caractères (FR-015b) |
| `heroImage` | upload → `media` | non | obligatoire ; ≥ 1 200 px de large |
| `theme` | relationship → `guideThemes` | non | obligatoire |
| `author` | relationship → `teamMembers` | non | obligatoire ; le membre doit avoir photo, rôle, lieu et présentation dans chaque langue publiée |
| `reviewer` | relationship → `teamMembers` | non | facultatif, ≠ `author` ; obligatoire si `requiresCommunityReview` |
| `requiresCommunityReview` | checkbox | non | coché pour le guide « La culture sérère » (FR-019) |
| `body` | richText (Lexical) | oui | H2/H3 seulement, images de `media`, bloc « Encadré pratique » ; obligatoire dans chaque langue publiée ; avertissement sous 600 mots (FR-015b) |
| `faq` | relationship → `faqItems`, hasMany | non | facultatif |
| `relatedStays` | relationship → `stays`, hasMany | non | ordonné |
| `relatedExperiences` | relationship → `experiences`, hasMany | non | ordonné |
| `relatedAccommodations` | relationship → `accommodations`, hasMany | non | ordonné |
| `relatedDestinations` | relationship → `destinations`, hasMany | non | ordonné ; avertissement sous deux liens tous types confondus (FR-015b ; exigé des guides de lancement, FR-020) |
| `priority` | number | non | défaut 100 ; plus petit = affiché d'abord dans les encarts |
| `seo.targetKeyword` | text | oui | requête cible (champ existant du groupe `seo`) ; obligatoire pour publier dans une langue (FR-018) |
| `publishedOn` | date civile | non | lecture seule ; posée à la première publication |
| `updatedOn` | date civile | non | lecture seule ; posée à la première publication puis à chaque « mise à jour importante » |
| `substantiveUpdate` | checkbox | non | « Mise à jour importante » ; remise à faux par le hook après avoir posé `updatedOn` |
| `readingMinutes` | number | oui | lecture seule ; calculé à l'enregistrement (R6) |
| `reviewDue` | checkbox virtuel | non | vrai si `updatedOn` date de plus de 12 mois (FR-018) ; colonne de la liste d'admin |
| `seo` | group (`seoField`) | oui | `slug`, `metaTitle` ≤ 60, `metaDescription` ≤ 155, `shareImage` ; unicité existante |
| `localeStatus` | group | non | `enPublished` calculé : titre, chapeau, corps, requête cible et SEO EN remplis |

**Publication refusée** (FR-015, message listant les manques) : auteur sans photo ou sans
présentation dans la langue ; image principale absente ; une image (principale, corps, photo de
l'auteur) sans texte alternatif FR et EN ou sans provenance ; titre, chapeau, corps, requête
cible, `metaTitle` ou `metaDescription` absents en FR ; relecteur absent alors que
`requiresCommunityReview` est coché.

**Avertissements sans blocage** (FR-015b, encadré « Points à vérifier » de l'admin) : moins de
deux liens d'offres ou de destinations ; moins de 600 mots dans une langue publiée ; chapeau hors
de 140 à 300 caractères.

**Cycle de vie** : brouillon → publié (FR seul ou FR + EN selon `localeStatus.enPublished`) →
dépublié (redevient brouillon ; liens et encarts disparaissent, le sitemap le retire). Un
changement de slug d'un guide publié crée une redirection 301 (hook existant).

**Mise à jour de fond** : si `substantiveUpdate` est coché à l'enregistrement d'un document
publié et que l'auteur ou le relecteur a quitté l'équipe (`teamMembers.active` faux), la
modification est refusée tant qu'un membre actif n'est pas désigné (spec, cas limite).

## `guideThemes` (nouvelle collection)

| Champ | Type | Localisé | Règles |
|---|---|---|---|
| `name` | text | oui | obligatoire FR et EN |
| `order` | number | non | ordre d'affichage dans la rubrique |

Trois documents au lancement : Préparer son voyage / Plan your trip ; Que faire / Things to do ;
Culture et nature / Culture and nature.

## `teamMembers` (collection existante, champs ajoutés)

| Champ | Type | Localisé | Règles |
|---|---|---|---|
| `slug` | text | non | unique, prénom-nom ; obligatoire dès que le membre signe ou relit un guide ; un changement crée des redirections 301 des pages d'auteur FR et EN (`autoRedirect`) |
| `place` | text | oui | ex. « Ndangane » ; obligatoire pour signer |
| `bio` | textarea | oui | existant ; 80–200 mots pour signer dans une langue |
| `sameAs` | array de `url` | non | liens publics facultatifs (réseaux professionnels) |
| `active` | checkbox | non | défaut vrai ; un membre inactif garde ses signatures existantes |

Page d'auteur (`/fr/equipe/{slug}`, `/en/team/{slug}`) générée seulement si le membre est
`author` ou `reviewer` d'au moins un guide publié dans la langue.

## Relations et requêtes inverses

```text
guides ──relatedStays──────────▶ stays
       ──relatedExperiences────▶ experiences
       ──relatedAccommodations─▶ accommodations
       ──relatedDestinations───▶ destinations
       ──author / reviewer─────▶ teamMembers
       ──theme─────────────────▶ guideThemes
       ──faq───────────────────▶ faqItems
```

- Encart d'une fiche X : guides publiés (et `enPublished` en anglais) où `relatedX` contient la
  fiche, tri `priority` puis `updatedOn` décroissant, limite 3 (FR-011).
- Cartes d'offres d'un guide : seulement les offres publiées dans la langue affichée (FR-012).
- Page d'auteur : guides publiés où `author` ou `reviewer` = le membre.

## Registre des requêtes cibles (`src/lib/seo/keywords.ts`)

Une requête normalisée appartient à un seul chemin (FR-020b, contrôlé par `pnpm seo:check`).
Changements :

| Requête FR / EN | Avant | Après |
|---|---|---|
| que faire au Sine-Saloum / things to do in Sine-Saloum | hub des expériences | guide « Que faire au Sine-Saloum » |
| activités Sine-Saloum / Sine-Saloum activities | — | hub des expériences |
| six autres requêtes de guides (spec FR-020) | — | guide correspondant |
