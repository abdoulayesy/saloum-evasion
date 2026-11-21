# Research — 004 Guides éditoriaux « Carnets du Saloum »

Toutes les décisions réutilisent le socle de la 001 (Next.js 15 App Router, Payload 3 sur
Postgres, next-intl, Tailwind v4, schema-dts, Plausible). **Aucune dépendance ajoutée.**

## R1 — Modèle : collection `guides`, liens portés par le guide

- **Décision** : une collection Payload `guides` construite avec `contentDefaults` (brouillons,
  versions, lecture publique des seuls documents publiés, `localeStatus.enPublished`, garde-fou
  médias, redirections automatiques, revalidation). Les liens vers les offres sont **portés par
  le guide** dans quatre champs relation `hasMany` ordonnés : `relatedStays`,
  `relatedExperiences`, `relatedAccommodations`, `relatedDestinations`. Le sens retour (encart
  sur une fiche) est une requête « guides publiés dont `relatedX` contient cette fiche ».
- **Raison** : même schéma que la 001 (un séjour porte ses destinations, la destination les
  retrouve par requête) ; une seule saisie (FR-009) ; requêtes simples et indexées en Postgres ;
  l'ordre est conservé par type, ce qui suffit à l'affichage par cartes.
- **Alternatives** : relation polymorphe unique `relationTo: [...]` (ordre global, mais requêtes
  inverses et interface d'admin moins lisibles) ; champ « guides liés » sur chaque offre (double
  saisie, risque d'incohérence) — rejetées.

## R2 — Corps du guide, table des matières et encadrés

- **Décision** : champ `body` en Lexical (éditeur existant), titres limités à H2 et H3 (le H1 est
  le titre du guide, FR-002), avec un bloc Lexical « Encadré pratique » (titre, texte court,
  variante info / attention) via `BlocksFeature`. La table des matières est **extraite côté
  serveur** des nœuds H2 (`src/lib/guides/toc.ts`, fonction pure) ; chaque H2 reçoit un
  identifiant stable (slug du texte, dédoublonné `-2`, `-3`) posé par un convertisseur du rendu
  `@payloadcms/richtext-lexical/react` qui appelle la même fonction. Table affichée à partir de
  trois H2 (FR-004), dans un `<details>` ouvert par défaut, sans JavaScript ; `scroll-margin-top`
  pour que la section ne passe pas sous l'en-tête collant.
- **Raison** : contenu présent dans le HTML servi (FR-008), aucun îlot client, ancres identiques
  entre la table et les titres puisque calculées par la même fonction.
- **Alternatives** : table saisie à la main (désynchronisation) ; génération côté client
  (contraire au principe III) — rejetées.

## R3 — Dates de publication et de mise à jour de fond

- **Décision** : `publishedOn` (date civile) posée à la première publication et jamais modifiée ;
  `updatedOn` posée à la première publication puis **seulement** quand l'équipe coche
  « Mise à jour importante » à l'enregistrement (case remise à zéro par le hook). La page affiche
  « Mis à jour le … » ; les données structurées utilisent `datePublished` = `publishedOn` et
  `dateModified` = `updatedOn`, jamais `updatedAt` de Payload.
- **Raison** : FR-006 et scénario US3-3 (une coquille ne change pas la date) ; Google demande que
  `dateModified` reflète une modification significative.
- **Alternatives** : `updatedAt` automatique (change à chaque coquille, signal trompeur) — rejetée.

## R4 — Pages d'auteur

- **Décision** : la collection existante `teamMembers` reçoit `slug` (non localisé, prénom-nom),
  `place` (lieu, localisé), `bio` (déjà localisée, enrichie à 80–200 mots) et `sameAs`
  (liens publics facultatifs). Nouvelle route `author` : `/fr/equipe/{slug}`, `/en/team/{slug}`,
  générée **seulement** pour les membres qui signent ou relisent au moins un guide publié dans la
  langue (FR-003b, aucune page vide). Données structurées `ProfilePage` dont `mainEntity` est la
  `Person` (`@id` = URL de la page + `#person`), référencée comme `author` / `contributor` des
  articles. La carte du membre sur « À propos » renvoie vers sa page quand elle existe.
- **Raison** : réponse à la clarification Q2 ; `ProfilePage` + `Person` est le balisage
  recommandé par Google pour les pages d'auteur ; réutiliser `teamMembers` garde une source unique
  (photo, rôle) pour « À propos » et les signatures.
- **Alternatives** : collection `authors` distincte (doublon de `teamMembers`) — rejetée.

## R5 — Données structurées

- **Décision** : par guide, un `@graph` avec `Article` (`headline` = titre, `description`,
  `image` (image principale en 16:9, 4:3 et 1:1, ≥ 1 200 px de large), `author` (Person, `@id`
  de la page d'auteur), `contributor` (relecteur), `publisher` = `#org` existant,
  `datePublished`, `dateModified`, `inLanguage`, `mainEntityOfPage`, `about` = destinations
  liées), `BreadcrumbList` (Accueil › Carnets du Saloum › guide), `FAQPage` si le guide a une
  foire aux questions (relation `faqItems`, builder `faq.ts` existant). Rubrique : `CollectionPage`
  + `ItemList` + `BreadcrumbList`. Page d'auteur : `ProfilePage` + `BreadcrumbList` (Accueil ›
  À propos › auteur). Builders purs dans `src/lib/seo/jsonld/article.ts` et `profilePage.ts`,
  testés comme les existants et validés par le contrôle JSON-LD de la CI.
- **Raison** : FR-007 ; `Article` plutôt que `BlogPosting` (guides pérennes, pas un fil
  d'actualité). Google n'affiche plus les résultats enrichis FAQ hors sites officiels de santé ou
  d'administration ; le balisage reste valide et décrit fidèlement la page (FR-005).
- **Alternatives** : `TravelGuide` (n'existe pas dans schema.org) ; `HowTo` pour « Aller à
  Ndangane » (abandonné par Google en 2023) — rejetées.

## R6 — Temps de lecture

- **Décision** : mots du corps (texte brut Lexical, `lexicalToPlainText` existant) ÷ 200 mots
  par minute, arrondi au supérieur, minimum 1 ; calculé à l'enregistrement par langue
  (`readingMinutes`, localisé) pour ne pas le recalculer à chaque rendu.
- **Raison** : vitesse moyenne de lecture sur écran en français et en anglais ; valeur stable et
  testable.

## R7 — Une requête, une page

- **Décision** : le registre `src/lib/seo/keywords.ts` (001) devient la liste unique des requêtes
  cibles ; `scripts/seo-check.ts` refuse qu'une même requête (normalisée) vise deux chemins. Les
  sept guides y sont ajoutés avec leurs requêtes FR et EN ; « que faire au Sine-Saloum » /
  « things to do in Sine-Saloum » passe au guide et le hub des expériences reçoit « activités
  Sine-Saloum » / « Sine-Saloum activities » (clarification du 2026-11-20). Les champs
  `targetQuery` (FR/EN) du guide servent à l'équipe (FR-018) ; un test vérifie qu'ils
  correspondent au registre pour les guides de lancement.
- **Raison** : FR-020b ; la vérification automatique empêche la cannibalisation au fil des
  ajouts.

## R8 — Maillage et revalidation

- **Décision** : à l'enregistrement d'un guide, revalidation des tags `doc:guides:{id}`, `guides`,
  `sitemap`, des fiches liées avant et après modification (`doc:stays:{id}`, etc.) et des pages
  d'auteur concernées (`doc:teamMembers:{id}`). Les requêtes de guides sur les fiches portent le
  tag `guides` ; celles des offres sur les guides portent les tags des collections d'offres,
  déjà revalidés par la 001 à chaque publication ou dépublication (FR-012). L'encart des fiches
  montre au plus trois guides publiés dans la langue, triés par `priority` (nombre, défaut 100)
  puis `updatedOn` décroissant (FR-011).
- **Raison** : mêmes mécanismes que la 001 (SSG + `revalidateTag`), aucun lien mort après une
  dépublication.

## R9 — Mesure

- **Décision** : les lectures sont les pages vues Plausible des chemins `/fr/carnets-du-saloum/*`
  et `/en/saloum-travel-guides/*` (pas d'évènement supplémentaire). Les clics vers une offre
  depuis un guide (texte ou carte) portent `data-guide-link` et sont suivis par l'écouteur
  délégué existant (`src/components/client/Analytics.tsx`) : évènement `guide_offer_click`
  (`guide`, `target` = type d'offre, `locale`) ; les clics WhatsApp reprennent `whatsapp_click`
  avec `placement: guide`. SC-004 = (clics offres + WhatsApp depuis les guides) ÷ pages vues des
  guides. Classement (SC-002) : rapport mensuel tiré de Search Console (filtre par page et par
  requête), sans intégration d'API.
- **Raison** : aucun cookie, aucun JavaScript ajouté par page ; principe VIII (pas de service
  nouveau sans besoin mesuré).

## R10 — Production éditoriale des sept guides

- **Décision** : pour chaque guide, une **fiche de questions** remise à l'équipe locale
  (`specs/004-guides-editoriaux-seo/content/questions.md`) ; à partir de ses réponses, l'équipe
  projet rédige les brouillons FR et EN en Markdown dans `content/carnets/{fr,en}/{slug}.md`
  (front matter : titre, chapeau, requête cible, title, description, liens, auteur pressenti),
  importés **comme brouillons** dans le CMS par `pnpm seed:guides` (conversion par
  `convertMarkdownToLexical` de `@payloadcms/richtext-lexical`, déjà installé). Le script ne
  publie jamais : la relecture, la signature et la publication se font dans l'admin par un
  membre de l'équipe (FR-021). Chaque information chiffrée qui change (tarifs de transport,
  horaires, marées) est datée dans le texte et vérifiée par l'équipe.
- **Raison** : clarification Q1 ; les brouillons sont versionnés et relisibles ; aucune donnée
  inventée n'est publiée sans validation locale.
- **Alternatives** : saisie directe dans l'admin (pas de relecture croisée possible avant
  import) ; traduction automatique publiée (exclue par la spec) — rejetées.

## R11 — Thèmes

- **Décision** : petite collection `guideThemes` (nom localisé, ordre), trois documents au
  lancement (Préparer son voyage, Que faire, Culture et nature) ; pas de page par thème.
- **Raison** : l'hypothèse de la spec prévoit des thèmes modifiables par l'équipe ; sans route
  propre, la collection reste un simple regroupement.

## R12 — Photos

- **Décision** : un guide utilise uniquement des médias de la collection `media` existante, avec
  texte alternatif FR/EN et provenance (garde-fou `publishGuard` existant étendu aux images du
  corps Lexical et à la photo de l'auteur). Les photos de démonstration du seed ne sont pas
  utilisables : le seed des guides n'en attache aucune ; l'équipe ajoute ses photos avant de
  publier. Seule exception : `pnpm seed:guides --demo-publish`, réservé aux environnements de
  test (refusé si `NODE_ENV=production` sans `SEED_ALLOW_PRODUCTION=1`, comme le seed de la 001),
  publie un guide de démonstration avec un média du seed dont la provenance indique « photo de
  démonstration », pour que Lighthouse CI et les E2E mesurent une vraie page.
- **Raison** : principe V ; FR-015.
- **Risque** : la publication dépend de photos réelles dont les droits sont confirmés ; à
  demander à l'équipe en même temps que les fiches de questions.
