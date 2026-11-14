# Mobile Checklist: Site public Saloum Évasion

**Purpose** : vérifier que chaque parcours prioritaire (US1 à US5) est **décrit et testable à
360 px** pour : zone du pouce, cibles ≥ 44 px, barre d'action collante, clavier par champ,
panneau de filtres, galerie au doigt, 3G et connexion partielle, absence de dépendance au
survol, orientation paysage, zoom du texte à 200 %. On teste ce qui est **écrit**, pas
l'implémentation.
**Created** : 2026-11-14
**Feature** : [spec.md](../spec.md) · [plan.md](../plan.md) · [request-form.md](../contracts/request-form.md) ·
[quickstart.md](../quickstart.md) · [constitution §I, §IV](../../../.specify/memory/constitution.md)
**Profondeur** : porte de revue formelle · **Public** : relecteur de PR et propriétaire

Légende : `[x]` = exigence présente et suffisante · `[ ]` = manque, ambiguïté ou conflit (le
constat suit le `→`).

## Testabilité à 360 px par parcours

- [x] CHK001 Le test indépendant de US1 fixe-t-il la largeur (360 px), le réseau (3G) et un seuil mesurable ? [Measurability, Spec US1, SC-003] → 360 px, 3G simulée, moins de 2 min, 9 testeurs sur 10.
- [x] CHK002 Le test indépendant de US2 fixe-t-il une largeur de 360 px ? [Measurability, Spec US2] → « visibles sans défilement excessif sur 360 px ».
- [ ] CHK003 « Sans défilement excessif » (US2) est-il quantifié (informations clés dans le premier écran de 360×800, ou en moins de N écrans) ? [Ambiguity, Spec US2 §Independent Test]
- [ ] CHK004 Les tests indépendants de US4 (« sur mobile ») et de US5 (aucune largeur) précisent-ils 360 px ? [Gap, Spec US4, US5]
- [ ] CHK005 Le parcours US3 (édition par l'équipe) est-il explicitement **dans** ou **hors** du périmètre mobile ? [Conflict, Spec US3 vs Constitution I « chaque écran »] → l'équipe à Ndangane travaillera probablement sur téléphone ; la constitution vise « chaque écran » et l'admin Payload n'est pas conçu en mobile d'abord (voir plan T6, qui ne couvre que le JS).
- [x] CHK006 Les profils d'appareil de référence sont-ils définis pour les tests ? [Completeness, plan §Technical Context, quickstart] → iPhone SE, Pixel 7, Android 360×800.

## Zone du pouce

- [ ] CHK007 La « zone du pouce » est-elle définie de façon mesurable (par exemple le tiers inférieur de l'écran de 360×800) ? [Clarity, Constitution I, Gap] → citée dans la constitution et dans « au pouce » (US1), mais jamais quantifiée.
- [ ] CHK008 La liste des « actions principales » qui doivent se trouver dans la zone du pouce est-elle établie pour chaque parcours ? [Gap] → seules la barre collante (fiches) et le panneau de filtres sont placés en bas.
- [ ] CHK009 La place de la recherche de l'accueil (dans le héro, donc en haut d'écran) est-elle conciliée avec l'exigence « au pouce » de US1 ? [Conflict, Spec FR-001 vs US1]
- [ ] CHK010 La position du bouton d'envoi du formulaire de demande (en fin de formulaire ou collant) est-elle définie ? [Gap, request-form.md §2]
- [ ] CHK011 La position du bouton de fermeture du menu plein écran et du panneau de filtres est-elle définie ? [Gap, Spec FR-017, FR-018]

## Cibles tactiles ≥ 44 × 44 px

- [x] CHK012 L'exigence de 44 × 44 px est-elle posée et associée à un critère vérifiable ? [Completeness, Constitution I, plan §Constitution Check] → test automatisé de la taille des cibles.
- [ ] CHK013 Les exceptions sont-elles définies, notamment les liens dans le corps du texte, les puces de filtre et les points de pagination de la galerie ? [Ambiguity, Gap]
- [ ] CHK014 Un espacement minimal entre cibles adjacentes est-il précisé (stepper adultes/enfants, puces d'envies, boutons de chapitres) ? [Gap]

## Barre d'action collante

- [x] CHK015 La présence et le contenu de la barre collante sont-ils définis ? [Completeness, Spec FR-017, US1 scénario 3]
- [x] CHK016 Les pages qui portent la barre sont-elles listées de façon cohérente ? [Consistency, Spec FR-017 « fiches » vs Constitution I et plan (séjour, expérience, hébergement **et destination**)] ✅ Corrigé le 2026-11-14 : spec FR-017 amendée (séjour, expérience, hébergement, destination).
- [x] CHK017 Le libellé de la barre est-il défini selon le type de page ? [Conflict, Spec FR-017 « Demander ce séjour » vs US2 « Ajouter à ma demande » sur une fiche expérience ou hébergement] ✅ Corrigé le 2026-11-14 : spec FR-017 amendée (libellé par type de page).
- [ ] CHK018 Le comportement de la barre clavier ouvert, au-dessus du pied de page et avec la zone de sécurité iOS (barre d'accueil) est-il défini ? [Edge Case, Gap]
- [ ] CHK019 Une exigence garantit-elle que la barre ne masque jamais l'élément qui a le focus ni la fin du contenu (WCAG 2.2, 2.4.11 « focus non masqué ») ? [Gap, Constitution IV]

## Clavier adapté à chaque champ

- [x] CHK020 Le type de clavier et l'autocomplétion sont-ils définis pour chaque champ du formulaire de demande ? [Completeness, request-form.md §2, Spec FR-012]
- [ ] CHK021 Les champs de la **recherche de l'accueil** (dates, voyageurs, envie) ont-ils leurs propres exigences de clavier et de saisie ? [Gap, Spec FR-001] → seul le formulaire de demande est décrit.
- [ ] CHK022 La saisie des dates est-elle décrite de façon cohérente ? [Conflict, request-form.md (`type="date"` natif, deux champs) vs plan (îlot client `DateRangeField`)]
- [ ] CHK023 Le comportement après une erreur de validation sur mobile (focus sur le premier champ en erreur, défilement jusqu'à lui, annonce aux lecteurs d'écran) est-il défini ? [Gap, Spec US1 scénario 6]
- [x] CHK024 Le format du numéro WhatsApp et l'indicatif par défaut sont-ils définis ? [Clarity, request-form.md] → E.164, +221 par défaut.

## Panneau de filtres

- [x] CHK025 L'ouverture du panneau par le bas, les filtres disponibles et l'affichage du nombre de résultats sont-ils définis ? [Completeness, Spec FR-018, US1 scénario 2]
- [ ] CHK026 Le mode d'application est-il précisé (filtrage immédiat ou bouton « Voir N séjours »), ainsi que la réinitialisation ? [Ambiguity, Spec US1 scénario 2]
- [ ] CHK027 La fermeture du panneau (glisser vers le bas, toucher le fond, bouton retour d'Android qui doit fermer le panneau et non quitter la page) est-elle définie ? [Gap]
- [ ] CHK028 Le comportement des filtres **avant le chargement du JavaScript** ou sans lui (en 3G) est-il défini ? [Gap, research R8 ne couvre que le formulaire]

## Galerie au doigt

- [x] CHK029 La navigation par balayage et l'utilisation au clavier sont-elles exigées ? [Completeness, Spec FR-018]
- [ ] CHK030 Une alternative à un seul doigt sans geste (boutons précédent / suivant) est-elle exigée, comme le demande WCAG 2.5.1 ? [Gap, Constitution IV] → « au clavier » ne suffit pas pour un utilisateur tactile qui ne peut pas balayer.
- [ ] CHK031 Les indications de position (« 3 / 12 »), l'agrandissement plein écran et le zoom à deux doigts sont-ils définis ou exclus ? [Gap]
- [ ] CHK032 Le conflit entre le balayage de la galerie et le geste « retour » du navigateur ou le défilement vertical est-il traité ? [Edge Case, Gap]

## Réseau 3G et connexion partielle

- [x] CHK033 Le profil « 3G » est-il défini (débit, latence) et le seuil « utilisable en 3G » quantifié (par exemple contenu principal lisible en moins de N s) ? [Clarity, Spec FR-020, Constitution I] → les budgets du plan visent la 4G lente ; la 3G n'a pas de seuil. ✅ Corrigé le 2026-11-14 : spec FR-020 amendée (≈ 780 kbit/s, 300 ms, contenu lisible en 5 s au plus).
- [x] CHK034 L'exigence 3G couvre-t-elle tous les parcours, ou seulement la demande (seul parcours testé en 3G dans le plan) ? [Coverage, plan, quickstart US1] ✅ Corrigé le 2026-11-14 : spec FR-020 + tâche 3g.mobile.spec.ts pour tous les types de page.
- [x] CHK035 Le comportement en cas de coupure réseau pendant l'envoi de la demande est-il défini (saisies conservées, réessai, WhatsApp, pas de doublon) ? [Exception Flow, Spec §Edge Cases, request-form.md §4]
- [x] CHK036 Le comportement de l'accueil et du film quand la vidéo ne charge pas est-il défini ? [Exception Flow, Spec US4 scénario 5, §Edge Cases]
- [ ] CHK037 Le comportement lors d'une **perte de connexion pendant la navigation** (page suivante inaccessible, images qui échouent) est-il défini ou explicitement exclu (pas de mode hors ligne) ? [Gap]
- [ ] CHK038 Le comportement du menu, de la galerie, de la barre et du compteur de demande avant chargement du JavaScript (ou s'il échoue) est-il défini ? [Gap, research R8]

## Absence de dépendance au survol

- [x] CHK039 L'interdiction de toute fonction dépendante du survol est-elle posée et étendue à l'ordinateur ? [Completeness, Constitution I, Spec §Edge Cases « Visiteur sur ordinateur »]
- [ ] CHK040 Un critère vérifiable est-il associé à cette règle (revue des états `:hover` uniquement décoratifs, ou test au tactile sur ordinateur) ? [Measurability, Gap] → aucune vérification prévue dans le plan ou le quickstart.

## Orientation paysage

- [ ] CHK041 Des exigences existent-elles pour l'orientation paysage (800 × 360) : hauteur cumulée de l'en-tête et de la barre collante, hauteur du panneau de filtres, héro ? [Gap] → le paysage n'est mentionné nulle part.
- [ ] CHK042 L'interdiction de bloquer l'orientation (WCAG 1.3.4) et le passage en plein écran paysage du film sont-ils précisés ? [Gap, Constitution IV]

## Zoom du texte à 200 %

- [ ] CHK043 Le zoom du texte à 200 % (WCAG 1.4.4) et la réorganisation à 320 px sans défilement horizontal (WCAG 1.4.10) sont-ils exigés explicitement ? [Gap, Constitution IV] → implicites via WCAG 2.2 AA, mais absents de la spec et des tests.
- [ ] CHK044 La taille de police système agrandie d'Android et d'iOS est-elle prise en compte (boutons et cartes sans hauteur fixe, prix longs comme « 1 250 000 FCFA » qui passent à la ligne) ? [Edge Case, Gap]
- [ ] CHK045 Le comportement de la barre collante et du panneau de filtres avec un texte agrandi à 200 % (qui ne doivent pas occuper la majorité de l'écran) est-il défini ? [Edge Case, Gap]

## Notes

### Matrice par parcours

✓ = décrit et testable · ◐ = partiel ou ambigu · ✗ = absent · — = sans objet

| Critère | US1 Demande | US2 Fiche Google | US3 Gestion | US4 Film / WhatsApp | US5 Langue |
|---|---|---|---|---|---|
| 360 px dans le test | ✓ | ✓ | ✗ (hors ou dans le périmètre ?) | ◐ « mobile » | ✗ |
| Zone du pouce | ◐ recherche en haut | ◐ | ✗ | ◐ | ✗ position du sélecteur |
| Cibles ≥ 44 px | ✓ (constitution) | ✓ | ✗ | ✓ | ✓ |
| Barre collante | ✓ | ◐ libellé | — | ◐ WhatsApp hors fiches | — |
| Clavier par champ | ◐ recherche de l'accueil absente | — | ✗ | — | — |
| Panneau de filtres | ◐ application et fermeture | — | — | — | — |
| Galerie au doigt | ◐ alternative sans geste | ◐ | — | ◐ vidéos verticales | — |
| 3G / connexion partielle | ◐ pas de seuil 3G | ✗ | ✗ | ✓ vidéo | ✗ |
| Survol | ✓ règle, ✗ vérification | idem | idem | idem | idem |
| Paysage | ✗ | ✗ | ✗ | ✗ | ✗ |
| Zoom texte 200 % | ✗ | ✗ | ✗ | ✗ | ✗ |

### Bilan

> Mise à jour 2026-11-14 après `/speckit-analyze` : 4 points corrigés dans la spec (cochés ci-dessus). Les totaux ci-dessous datent de la première évaluation.

45 points : **12 satisfaits**, **33 à traiter** :

- 4 conflits : CHK005, CHK009, CHK017, CHK022 ;
- 2 incohérences : CHK016, CHK034 ;
- 22 trous : CHK004, CHK008, CHK010, CHK011, CHK014, CHK018, CHK019, CHK021, CHK023, CHK027,
  CHK028, CHK030, CHK031, CHK032, CHK037, CHK038, CHK040, CHK041, CHK042, CHK043, CHK044,
  CHK045 ;
- 5 ambiguïtés ou seuils non quantifiés : CHK003, CHK007, CHK013, CHK026, CHK033.

Les deux critères demandés **entièrement absents** de la spec et du plan sont **l'orientation
paysage** et le **zoom du texte à 200 %**.
