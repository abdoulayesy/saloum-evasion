# SEO Checklist: Site public Saloum Évasion

**Purpose** : vérifier que les exigences SEO sont complètes, claires et cohérentes pour chaque
type de page (accueil, listes, fiche séjour, fiche expérience, fiche hébergement, destination,
film, FAQ, 404), avant `/speckit-tasks`. On teste ce qui est **écrit**, pas l'implémentation.
**Created** : 2026-11-14
**Feature** : [spec.md](../spec.md) · [plan.md](../plan.md) · [routes.md](../contracts/routes.md) ·
[jsonld.md](../contracts/jsonld.md) · [data-model.md](../data-model.md)
**Profondeur** : porte de revue formelle · **Public** : relecteur de PR et propriétaire

Légende : `[x]` = exigence présente et suffisante · `[ ]` = manque, ambiguïté ou conflit (le
constat suit le `→`).

## Title et meta description

- [x] CHK001 Les longueurs maximales (title ≤ 60, description ≤ 155) et l'unicité sont-elles définies pour les fiches (séjour, expérience, hébergement, destination) ? [Completeness, data-model §seo, Constitution III] → champs `metaTitle`/`metaDescription` obligatoires, limites et unicité validées par un hook.
- [ ] CHK002 La source du title et de la description des pages **sans document CMS** (listes séjours, hébergements, destinations, hub expériences, 404) est-elle définie ? [Gap, routes.md « page fixe »] → « page fixe » n'est rattaché ni à `pages.key` ni à des messages i18n ; l'unicité de ces pages n'est donc pas couverte par le hook.
- [ ] CHK003 Le modèle de title « {titre} \| Saloum Évasion si ça tient » est-il formulé de façon vérifiable (quand ajoute-t-on la marque, que fait-on au-delà de 60 caractères) ? [Clarity, routes.md §Métadonnées communes]
- [x] CHK004 Le title et la description de la page 404 sont-ils définis, et leur exemption d'unicité justifiée ? [Coverage, routes.md] → H1 « Page introuvable » et noindex : l'exemption est implicite mais acceptable.
- [ ] CHK005 L'unicité title/description entre **langues** est-elle précisée (une page EN peut-elle reprendre un title FR identique, par exemple un nom propre comme « Mar Lodj ») ? [Ambiguity, data-model §seo]

## H1

- [x] CHK006 Un H1 unique est-il défini pour chaque type de page demandé ? [Completeness, routes.md §Exigences SEO, Constitution III] → accueil = promesse, listes = libellé fixe, fiches = titre, 404 = « Page introuvable ».
- [ ] CHK007 Le texte exact du H1 des listes et du hub est-il fixé en FR **et** en EN, et aligné sur le mot-clé cible ? [Clarity, Gap] → seuls les libellés FR sont donnés (« Séjours signature », « Que faire au Sine-Saloum »).

## Canonical

- [x] CHK008 La règle de canonical (URL absolue, langue de la page, sans paramètres) est-elle définie pour toutes les pages indexables ? [Completeness, routes.md §Métadonnées communes]
- [x] CHK009 La règle de canonical des listes filtrées (`?duree=…`) est-elle définie ? [Edge Case, routes.md §Paramètres de filtre]
- [ ] CHK010 L'absence de pagination des listes est-elle posée explicitement, ou une règle de canonical pour la pagination est-elle définie ? [Gap] → avec 15 à 25 expériences, le besoin est probablement nul, mais ce n'est pas écrit.
- [ ] CHK011 Les pages 404, demande et confirmation doivent-elles émettre un canonical et des hreflang, et la règle est-elle écrite ? [Gap, routes.md]

## Hreflang fr / en / x-default

- [x] CHK012 La règle hreflang (fr, en, `x-default` = FR, réciprocité) est-elle définie pour toutes les pages indexables ? [Completeness, routes.md, research R1]
- [x] CHK013 Le comportement lorsqu'une page n'a pas de version EN publiée est-il défini (pas de hreflang EN, absence du sitemap) ? [Edge Case, data-model §localeStatus, Spec FR-022]
- [ ] CHK014 La stratégie d'URL (slugs traduits, `/` → 301 `/fr`) a-t-elle été **validée** par le propriétaire ? [Assumption, research R1 « défaut — à confirmer »] → clarification interrompue.

## Données structurées (JSON-LD)

- [x] CHK015 Un JSON-LD attendu est-il défini pour chaque type de page indexable (accueil, listes, fiches, destination, film, FAQ) ? [Completeness, jsonld.md, Constitution III]
- [x] CHK016 L'absence de JSON-LD sur la 404 et sur les pages de demande est-elle intentionnelle et écrite ? [Coverage, routes.md] → oui : « aucun ».
- [ ] CHK017 Le choix entre `TouristDestination` et `TouristAttraction` pour une destination est-il sans ambiguïté ? [Ambiguity, jsonld.md §Destination, data-model §destinations.kind] → « île » ou « réserve » donnent TouristAttraction : Mar Lodj (île habitée) et l'île aux Oiseaux (réserve) seraient balisées pareil, alors que Mar Lodj est une destination de séjour.
- [ ] CHK018 Les conditions d'éligibilité à `VacationRental` sont-elles vérifiables à partir des champs du modèle de données ? [Consistency, jsonld.md §hébergement vs data-model §accommodations] → `jsonld.md` exige `identifier` et au moins 8 photos, mais `accommodations` n'a pas de champ `identifier` et sa galerie ne garantit que 5 photos.
- [ ] CHK019 Le format de l'URL de contenu vidéo (`contentUrl` / `content_loc` = manifeste HLS `.m3u8`) a-t-il été confirmé comme accepté pour l'indexation vidéo ? [Assumption, jsonld.md §Film, routes.md §Sitemap] → sinon, prévoir un rendu MP4 comme URL de contenu.
- [ ] CHK020 L'attente de résultat enrichi pour `FAQPage` est-elle documentée de façon réaliste ? [Assumption, jsonld.md §FAQ] → Google ne montre plus ces résultats que pour des sites d'autorité (gouvernement, santé) : le balisage reste valide, mais sans gain visible attendu.
- [x] CHK021 L'interdiction de `AggregateRating` et `Review` est-elle explicitement écrite et cohérente avec la spec ? [Consistency, jsonld.md, Spec FR-035, Constitution V]

## Fil d'Ariane

- [x] CHK022 Le fil d'Ariane est-il défini pour chaque type de page, avec les exceptions (accueil, demande, 404) ? [Completeness, routes.md]
- [x] CHK023 La spec (FR-025 : « les fiches ») et le plan (toutes les pages sauf exceptions) sont-ils alignés ? [Consistency, Spec FR-025 vs routes.md] → le plan va plus loin que la spec ; FR-025 est à mettre à jour. ✅ Corrigé le 2026-11-14 : spec FR-025 amendée (fil d'Ariane sur toutes les pages publiques sauf exceptions).
- [ ] CHK024 La hiérarchie du fil d'Ariane est-elle définie pour une fiche expérience (Accueil › Expériences › Univers › Fiche) et pour un séjour multi-destinations ? [Clarity, Gap]

## Image Open Graph

- [x] CHK025 Une image OG (1200×630) et sa source sont-elles définies pour les fiches et la page film ? [Completeness, routes.md, data-model §seo.shareImage]
- [ ] CHK026 La source de l'image OG des pages sans document (listes, hub : « héro de la liste ») est-elle définie dans le modèle de données ? [Gap] → même trou que CHK002.
- [x] CHK027 L'image OG composée (vraie photo + titre) est-elle conciliée avec la règle « uniquement de vraies photos » ? [Consistency, plan T7, Constitution V]

## Sitemap

- [x] CHK028 L'inclusion ou l'exclusion du sitemap est-elle définie pour chaque type de page, avec images et vidéos ? [Completeness, routes.md §Sitemap]
- [ ] CHK029 La valeur de priorité (« prio 1.0 » pour l'accueil) est-elle utile ou à retirer, et la règle est-elle la même pour toutes les pages ? [Consistency, routes.md] → priorité citée pour l'accueil seulement, et ignorée par Google : à retirer ou à généraliser.

## Indexation (index / noindex)

- [x] CHK030 La règle index / noindex est-elle définie pour chaque type de page ? [Completeness, routes.md §Table des routes, Constitution III]
- [ ] CHK031 Le choix « Mentions légales = noindex » mais « Confidentialité = index » est-il justifié ? [Ambiguity, routes.md]
- [x] CHK032 Le périmètre de SC-001 (« 100 % des pages publiques indexées ») exclut-il explicitement les pages noindex (mentions légales, demande, confirmation) ? [Conflict, Spec SC-001 vs routes.md] → tel qu'écrit, SC-001 ne peut pas atteindre 100 %. ✅ Corrigé le 2026-11-14 : spec SC-001 amendée (pages indexables seulement).

## Redirections

- [x] CHK033 Les règles de redirection (racine, slug modifié, contenu dépublié, changement d'univers, casse et barre oblique finale) sont-elles définies ? [Completeness, routes.md §Redirections, Spec FR-031]
- [ ] CHK034 L'effet en cascade du changement de slug d'un **univers** (toutes les URL d'expériences imbriquées) est-il couvert ? [Gap, routes.md]
- [ ] CHK035 La redirection en cas de **suppression définitive** d'un document (et pas seulement de dépublication) est-elle définie ? [Gap, data-model §Transitions]
- [ ] CHK036 Le renommage d'un segment fixe (`sejours`, `stays`…) ou d'une page fixe (film, engagement) est-il couvert par une règle de redirection ? [Gap]
- [ ] CHK037 La règle « contenu retiré → séjour proche ou liste parente » a-t-elle été validée ? [Assumption, research R11 « défaut — à confirmer »]

## Maillage interne

- [x] CHK038 Les liens internes attendus sont-ils définis pour chaque type de page ? [Completeness, routes.md, Spec FR-008]
- [ ] CHK039 Les critères de sélection des « séjours similaires » et des « hébergements voisins » sont-ils quantifiés (nombre, ordre, règle de départage) ? [Clarity, data-model §stays.similarStays, routes.md] → « même destination ou mêmes envies », sans nombre ni ordre ; « voisins » n'est pas défini.
- [x] CHK040 Une exigence garantit-elle qu'aucune page indexable n'est orpheline ? [Coverage, Spec FR-008] → chaque fiche est liée depuis une liste et depuis sa destination.

## Mot-clé cible

- [x] CHK041 Chacun des 10 mots-clés de la spec est-il rattaché à au moins un type de page ? [Completeness, Spec FR-026, routes.md]
- [ ] CHK042 Chaque mot-clé est-il rattaché à **une seule** page principale (pas de cannibalisation) ? [Conflict, routes.md] → « séjour Sine-Saloum » est attribué à l'accueil **et** à la liste des séjours ; « week-end Ndangane » à une fiche séjour **et** à la destination Ndangane.
- [ ] CHK043 Les équivalents anglais des 10 mots-clés sont-ils listés explicitement ? [Clarity, Spec FR-026] → seulement « (+ EN) » ou un exemple ; aucune liste EN fixée.
- [ ] CHK044 Les types de page **sans mot-clé de la spec** sont-ils identifiés et leur mot-clé arbitré ? [Gap] → voir le tableau ci-dessous : univers, FAQ et film portent des mots-clés inventés par le plan ; la liste des destinations n'a qu'un mot-clé EN.
- [ ] CHK045 Les mots-clés qui dépendent d'un contenu précis (quad, balade à cheval à Palmarin, villa avec piscine à Ndangane) sont-ils adossés à un engagement de contenu au lancement ? [Dependency, Spec Assumptions « Contenus et médias »]

## Notes

### Matrice de couverture par type de page

✓ = défini · ◐ = partiel ou ambigu · ✗ = absent · — = sans objet

| Type de page | Title/desc uniques | H1 | Canonical | Hreflang | JSON-LD | Fil d'Ariane | OG | Sitemap | Index | Redirection | Maillage | Mot-clé |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Accueil | ✓ | ✓ | ✓ | ✓ | ✓ Org, WebSite | — | ✓ | ✓ | ✓ | ✓ `/` → `/fr` | ✓ | ◐ conflit avec liste séjours |
| Listes (séjours, hébergements, destinations, hub) | ◐ source non définie | ◐ EN manquant | ✓ | ✓ | ✓ ItemList | ✓ | ◐ source | ✓ | ✓ | ✗ segment renommé | ✓ | ◐ destinations : EN seul |
| Univers | ✓ | ✓ | ✓ | ✓ | ✓ ItemList | ✓ | ✓ | ✓ | ✓ | ✗ cascade | ✓ | ◐ hors liste spec |
| Fiche séjour | ✓ | ✓ | ✓ | ✓ | ✓ TouristTrip | ✓ | ✓ | ✓ | ✓ | ◐ suppression | ◐ « similaires » flou | ◐ conflit Ndangane |
| Fiche expérience | ✓ | ✓ | ✓ | ✓ | ✓ TouristAttraction | ◐ hiérarchie | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Fiche hébergement | ✓ | ✓ | ✓ | ✓ | ◐ VacationRental | ✓ | ✓ | ✓ | ✓ | ◐ suppression | ◐ « voisins » | ✓ |
| Destination | ✓ | ✓ | ✓ | ✓ | ◐ type ambigu | ✓ | ✓ | ✓ | ✓ | ◐ suppression | ✓ | ◐ conflit Ndangane |
| Film | ✓ | ✓ | ✓ | ✓ | ◐ contentUrl HLS | ✓ | ✓ | ✓ | ✓ | ✗ page fixe | ✓ | ◐ hors liste spec |
| FAQ | ✓ | ✓ | ✓ | ✓ | ◐ FAQPage sans gain | ✓ | ✓ | ✓ | ✓ | ✗ page fixe | ✓ | ◐ hors liste spec |
| 404 | — | ✓ | ✗ non précisé | ✗ non précisé | — (voulu) | — | — | ✓ exclue | ✓ noindex, 404 | — | ✓ | — (normal) |

### Types de page signalés

- **Sans données structurées** : aucun type indexable. Seules la 404 et les pages de demande
  n'en ont pas, et c'est voulu.
- **Sans mot-clé issu de la spec** : univers (exemple seulement), film (« film Sine-Saloum »,
  inventé, faible volume probable), FAQ (« réserver séjour Sine-Saloum », inventé), liste des
  destinations (mot-clé EN seulement). Les pages Engagement, À propos, Contact et
  Confidentialité sont volontairement sans mot-clé (pages de marque). 404, demande et mentions
  légales sont sans objet.

### Bilan

> Mise à jour 2026-11-14 après `/speckit-analyze` : 2 points corrigés dans la spec (cochés ci-dessus). Les totaux ci-dessous datent de la première évaluation.

45 points : **19 satisfaits**, **26 à traiter** :

- 2 conflits : CHK032, CHK042 ;
- 4 hypothèses à valider : CHK014, CHK019, CHK020, CHK037 ;
- 9 trous ou dépendances : CHK002, CHK010, CHK011, CHK026, CHK034, CHK035, CHK036, CHK044,
  CHK045 ;
- 11 manques de clarté ou de cohérence : CHK003, CHK005, CHK007, CHK017, CHK018, CHK023,
  CHK024, CHK029, CHK031, CHK039, CHK043.
