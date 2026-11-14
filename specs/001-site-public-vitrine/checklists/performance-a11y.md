# Performance & Accessibility Checklist: Site public Saloum Évasion

**Purpose** : vérifier que chaque budget de performance de la constitution (II) a une
**méthode de mesure** et un **test automatique en CI**, et que les critères WCAG 2.2 AA
demandés (contraste, focus visible, alternatives textuelles, sous-titres vidéo, navigation
clavier) sont couverts par des exigences vérifiables. On teste ce qui est **écrit**, pas
l'implémentation.
**Created** : 2026-11-14
**Feature** : [spec.md](../spec.md) · [plan.md](../plan.md) · [research.md](../research.md) ·
[quickstart.md](../quickstart.md) · [data-model.md](../data-model.md) ·
[constitution §II, §IV, §VII](../../../.specify/memory/constitution.md)
**Profondeur** : porte de revue formelle · **Public** : relecteur de PR et propriétaire

Légende : `[x]` = exigence présente et suffisante · `[ ]` = manque, ambiguïté ou conflit (le
constat suit le `→`).

## Cadre de mesure

- [x] CHK001 Les URL soumises à Lighthouse CI sont-elles définies par type de page et par langue ? [Completeness, quickstart §Budgets] → 1 URL par type, en FR et en EN.
- [ ] CHK002 L'environnement mesuré par Lighthouse CI est-il défini (build local de production ou déploiement de prévisualisation, avec ou sans CDN) ? [Gap, quickstart] → les résultats varient fortement selon l'environnement.
- [ ] CHK003 Le nombre de passages par URL et la statistique retenue (médiane de 3 ou 5) sont-ils fixés pour limiter les faux échecs ? [Clarity, Gap]
- [ ] CHK004 Le profil « 4G lente » est-il défini par ses paramètres (débit, latence, ralentissement processeur) et identique entre Lighthouse CI et Playwright ? [Clarity, Constitution II, plan §Technical Context]

## LCP

- [x] CHK005 Le budget LCP de laboratoire (≤ 2,0 s en 4G lente) est-il associé à une assertion bloquante ? [Completeness, quickstart `largest-contentful-paint` ≤ 2000]
- [x] CHK006 Une méthode de mesure terrain au 75e percentile est-elle définie ? [Completeness, research R5, analytics-events `web_vital`] → web-vitals vers Plausible, plus CrUX et Search Console.
- [ ] CHK007 Une règle de suivi du LCP terrain est-elle définie : qui consulte, à quelle fréquence, quel seuil déclenche une action ? [Gap, Constitution Gouvernance « revue trimestrielle »] → aucune alerte automatique ; l'examen trimestriel ne suffit pas au lancement.
- [ ] CHK008 La dépendance du LCP au point de présence CDN proche de Dakar est-elle levée avant le lancement ? [Dependency, plan T5, research R6] → risque ouvert.

## INP

- [ ] CHK009 Un test automatique mesure-t-il l'**INP** sur les interactions clés (ouvrir le panneau de filtres, balayer la galerie, ajouter à la demande, envoyer le formulaire) ? [Gap, Constitution II] → le quickstart n'asserte que le TBT ≤ 200 ms, qui n'est qu'un indicateur indirect : un chargement Lighthouse ne mesure pas l'INP.
- [x] CHK010 Une mesure terrain de l'INP est-elle définie ? [Completeness, analytics-events `web_vital`]

## CLS

- [x] CHK011 Le budget CLS ≤ 0,1 est-il associé à une assertion bloquante ? [Completeness, quickstart]
- [ ] CHK012 Le CLS **après le chargement** (défilement, images différées, barre collante, compteur de demande, bascule de police) est-il couvert par un test, alors que Lighthouse ne mesure que le chargement ? [Coverage, Gap]
- [x] CHK013 Des exigences de prévention du CLS sont-elles posées ? [Completeness, data-model §media `width`/`height`, research R9 `adjustFontFallback`, Spec §Edge Cases « aucun décalage »]

## Poids JavaScript par route

- [x] CHK014 Le budget de 150 Ko compressés par route publique est-il associé à une assertion bloquante ? [Completeness, quickstart `resource-summary:script:size` ≤ 153 600]
- [ ] CHK015 Le contrôle de la taille des bundles **au build** et par route, exigé par la constitution en plus de Lighthouse, est-il prévu ? [Gap, Constitution II critère] → absent du plan et du quickstart.
- [ ] CHK016 Un budget est-il fixé pour le JavaScript chargé **à la demande** (hls.js, galerie, panneau de filtres, sélecteur de dates) ? [Gap, plan §Constitution Check II] → hors budget initial, mais il pèse sur l'INP et sur le forfait data (principe VI).
- [x] CHK017 L'exclusion de l'admin du budget est-elle écrite et soumise à validation ? [Consistency, plan T6, Complexity Tracking] → validation du propriétaire en attente.

## Image principale

- [x] CHK018 Le budget de l'image principale (≤ 120 Ko, AVIF ou WebP, dimensions explicites) est-il posé ? [Completeness, Constitution II, plan §Technical Context]
- [ ] CHK019 Un test automatique mesure-t-il le poids réel de l'élément LCP et son format ? [Gap] → aucune assertion Lighthouse (`modern-image-formats`, `unsized-images`, poids de l'image LCP) ni test Playwright n'est prévu.
- [ ] CHK020 Une règle garantit-elle que l'image source déposée par l'équipe produise un dérivé ≤ 120 Ko à la largeur mobile (qualité, largeurs générées) ? [Gap, data-model §media] → le modèle impose seulement une source d'au moins 1 600 px.
- [x] CHK021 La règle « une seule image prioritaire, les autres en différé » est-elle écrite ? [Completeness, plan §Constitution Check II]

## Polices

- [x] CHK022 Les règles sur les polices (2 familles, auto-hébergées, sous-ensemble latin, `swap`) sont-elles définies avec les graisses retenues ? [Completeness, research R9]
- [ ] CHK023 Un test automatique garantit-il ces règles (aucune requête vers un service de polices externe, au plus 2 familles, audit `font-display`) ? [Gap]
- [ ] CHK024 Un budget de poids total des polices est-il fixé ? [Gap] → la graisse variable de Manrope et 3 styles de Cormorant ne sont pas chiffrés.

## Vidéo sans préchargement sur mobile

- [x] CHK025 La règle « aucun octet vidéo avant interaction sur mobile » est-elle couverte par un test automatique ? [Completeness, quickstart US4] → aucune requête vers `stream.mux.com` avant le clic.
- [ ] CHK026 Les règles `Save-Data`, `prefers-reduced-motion` et ordinateur (boucle ≤ 8 s, ≤ 1,5 Mo, après `load`) ont-elles chacune un test automatique ? [Coverage, research R4] → seule la règle mobile est testée.
- [x] CHK027 Le poids de l'affiche vidéo est-il plafonné ? [Completeness, data-model §videos.poster ≤ 120 Ko]

## Scripts tiers différés

- [x] CHK028 La règle de chargement différé des scripts tiers et l'interdiction d'un widget WhatsApp tiers sont-elles écrites ? [Completeness, research R5, request-form §5]
- [ ] CHK029 Un test automatique garantit-il qu'aucun script tiers n'apparaît dans le HTML initial ni avant l'inactivité du navigateur ? [Gap]

## Contraste

- [x] CHK030 Les contrastes des couleurs principales de la palette sont-ils calculés et conformes ? [Completeness, research R9] → 4 combinaisons, toutes ≥ 5,5:1.
- [ ] CHK031 Les autres combinaisons sont-elles couvertes : ocre sur vert, texte d'aide, texte désactivé, et surtout **texte posé sur photo** (héro, cartes) ? [Gap] → axe ne mesure pas le contraste sur une image.
- [ ] CHK032 Le contraste des éléments non textuels (contour des champs, anneau de focus, icônes, puces de filtre ; ≥ 3:1, WCAG 1.4.11) est-il exigé ? [Gap, Constitution IV]

## Focus visible

- [ ] CHK033 Le style du focus visible est-il défini (épaisseur, couleur, contraste ≥ 3:1 sur sable **et** sur vert) ? [Gap, Constitution IV] → posé comme principe, jamais précisé.
- [ ] CHK034 Une méthode de vérification du focus visible est-elle prévue ? [Measurability, Gap] → axe ne teste pas la visibilité du focus.
- [ ] CHK035 La règle « le focus n'est jamais masqué » (WCAG 2.4.11) est-elle posée pour la barre collante et l'en-tête ? [Gap] → voir aussi [mobile.md](./mobile.md) CHK019.

## Alternatives textuelles

- [x] CHK036 Le texte alternatif est-il obligatoire en FR et EN pour chaque photo, et la publication bloquée s'il manque ? [Completeness, data-model §media, Spec FR-030]
- [ ] CHK037 La règle pour les images **décoratives** (motif sérère, illustrations) est-elle définie (`alt` vide) ? [Gap]
- [ ] CHK038 Des consignes de rédaction rendent-elles « descriptif » vérifiable (longueur, ne pas commencer par « image de », décrire le lieu et l'action) ? [Clarity, Constitution III]
- [ ] CHK039 Un nom accessible est-il exigé pour les boutons-icônes (WhatsApp, + et − des compteurs, fermeture, lecture, flèches de galerie) ? [Gap]

## Sous-titres et vidéo accessible

- [x] CHK040 Les sous-titres FR et EN sont-ils obligatoires pour le film et les vidéos verticales ? [Completeness, data-model §videos.captions]
- [ ] CHK041 L'**audiodescription** ou une alternative textuelle complète, exigée par WCAG 1.2.5 (niveau AA) pour les vidéos préenregistrées, est-elle prévue ? [Gap, Constitution IV] → absente.
- [ ] CHK042 Un bouton pause est-il exigé pour la boucle vidéo sur ordinateur ? [Conflict, research R4 (boucle jusqu'à 8 s) vs WCAG 2.2.2 (tout mouvement automatique de plus de 5 s doit pouvoir être mis en pause)]
- [ ] CHK043 L'accessibilité du lecteur maison est-elle spécifiée : commandes au clavier, noms accessibles, chapitres utilisables, choix de la piste de sous-titres ? [Gap, research R4]

## Navigation clavier

- [x] CHK044 La navigation clavier complète est-elle posée comme principe ? [Completeness, Constitution IV, plan §Constitution Check IV]
- [ ] CHK045 Le test clavier du parcours de demande, exigé par la constitution, figure-t-il dans les scénarios du quickstart ? [Conflict, Constitution IV critère vs quickstart] → absent des scénarios @us1 à @us5.
- [ ] CHK046 La gestion du focus est-elle définie pour le menu plein écran, le panneau de filtres et la galerie plein écran (focus enfermé dans le panneau, fermeture par Échap, retour du focus sur le déclencheur) ? [Gap]
- [ ] CHK047 Un lien d'évitement (« aller au contenu ») est-il exigé ? [Gap]
- [ ] CHK048 L'annonce aux lecteurs d'écran des messages dynamiques (erreurs, confirmation d'envoi, nombre de résultats filtrés, ajout à la demande) est-elle définie ? [Gap]

## Couverture des tests d'accessibilité

- [x] CHK049 axe est-il exécuté sur chaque type de page et bloquant en CI ? [Completeness, plan §Constitution Check IV, Constitution VII]
- [ ] CHK050 Le jeu de règles axe (WCAG 2.0 et 2.1 A/AA, **2.2 AA**) est-il précisé ? [Clarity, Gap]
- [ ] CHK051 axe est-il exigé sur les **états** (menu ouvert, panneau ouvert, formulaire en erreur, confirmation) comme le dit la constitution (« chaque page et état testé ») ? [Coverage, Constitution IV vs quickstart]
- [ ] CHK052 Un audit manuel avant lancement est-il prévu, avec lecteurs d'écran (TalkBack sur Android, VoiceOver sur iOS) ? [Gap] → les tests automatiques ne couvrent qu'une partie des critères WCAG.
- [ ] CHK053 Les critères WCAG 2.2 propres aux formulaires (3.3.7 saisie redondante, 3.3.8 authentification accessible pour la connexion de l'équipe) sont-ils couverts ? [Gap]

## Notes

### Matrice des budgets de la constitution

| Budget | Seuil | Méthode de mesure | Test automatique bloquant en CI |
|---|---|---|---|
| LCP | ≤ 2,0 s (labo), ≤ 2,5 s (p75 terrain) | Lighthouse + web-vitals, CrUX | ✓ labo · ✗ terrain (pas d'alerte) |
| INP | ≤ 200 ms | web-vitals (terrain) | ✗ (seulement TBT en indicateur indirect) |
| CLS | ≤ 0,1 | Lighthouse + web-vitals | ◐ chargement seulement |
| JS par route | ≤ 150 Ko gz | Lighthouse `resource-summary` | ◐ pas de contrôle au build ; JS à la demande sans budget |
| Image principale | ≤ 120 Ko, AVIF/WebP, dimensions | — | ✗ |
| Polices | 2 familles, auto-hébergées, latin, swap | configuration (R9) | ✗ |
| Vidéo mobile | 0 octet avant clic | Playwright (requêtes réseau) | ✓ mobile · ✗ Save-Data, mouvement réduit, ordinateur |
| Scripts tiers | différés | configuration (R5) | ✗ |

### Matrice WCAG 2.2 AA demandée

| Critère | Exigence écrite | Vérification prévue |
|---|---|---|
| Contraste texte (1.4.3) | ◐ palette seulement | axe (fonds unis seulement) |
| Contraste non textuel (1.4.11) | ✗ | ✗ |
| Focus visible (2.4.7) et non masqué (2.4.11) | ◐ principe seulement | ✗ |
| Alternatives textuelles (1.1.1) | ✓ photos · ✗ décoratif, boutons-icônes | axe + blocage à la publication |
| Sous-titres (1.2.2) | ✓ | contrôle à la publication |
| Audiodescription (1.2.5) | ✗ | ✗ |
| Pause du mouvement (2.2.2) | ✗ (conflit avec la boucle de 8 s) | ✗ |
| Navigation clavier (2.1.1) et gestion du focus | ◐ | ✗ (test clavier absent du quickstart) |

### Bilan

53 points : **19 satisfaits**, **34 à traiter** :

- 2 conflits : CHK042 (boucle vidéo sans pause), CHK045 (test clavier exigé par la
  constitution, absent du quickstart) ;
- 2 dépendances ou couvertures partielles : CHK008, CHK051 ;
- 23 trous : CHK002, CHK007, CHK009, CHK012, CHK015, CHK016, CHK019, CHK020, CHK023, CHK024,
  CHK026, CHK029, CHK031, CHK032, CHK033, CHK035, CHK037, CHK039, CHK041, CHK043, CHK046,
  CHK047, CHK048 ;
- 7 manques de clarté, de mesurabilité ou de couverture manuelle : CHK003, CHK004, CHK034,
  CHK038, CHK050, CHK052, CHK053.

Budgets **sans aucun test automatique** : INP, image principale, polices, scripts tiers.
