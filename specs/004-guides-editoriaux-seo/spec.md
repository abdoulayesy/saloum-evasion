# Feature Specification: Guides éditoriaux « Carnets du Saloum »

**Feature Branch**: `004-guides-editoriaux-seo`
**Created**: 2026-11-20
**Status**: Draft
**Input**: User description: "004 — Guides éditoriaux SEO. Rubrique « Carnets du Saloum » : guides
utiles rédigés ou relus par l'équipe locale, signés avec auteur et photo (crédibilité pour Google).
Premiers sujets : Que faire au Sine-Saloum ; Quand partir (saisons, marées, oiseaux) ; Comment
aller de Dakar ou de l'aéroport AIBD à Ndangane ; Week-end au Sine-Saloum depuis Dakar ; Les huîtres
de palétuviers ; La culture sérère ; Mar Lodj, l'île sans voitures. Chaque guide renvoie vers les
séjours, expériences et destinations concernés, et inversement. Données structurées Article +
BreadcrumbList, date de mise à jour visible, table des matières, versions FR et EN. Objectif :
apparaître dans les 10 premiers résultats Google sur ces requêtes en 6 mois."

## Contexte

Le site public (001) vend des séjours, expériences, hébergements et destinations, mais ne répond
pas aux questions que les voyageurs posent à Google avant de choisir : que faire, quand partir,
comment venir. Ces requêtes informationnelles sont captées par des blogs et des plateformes. Les
« Carnets du Saloum » sont des guides pratiques, signés par l'équipe basée à Ndangane, qui
répondent à ces questions mieux que les concurrents et mènent le lecteur vers les offres du site.

## Clarifications

### Session 2026-11-20

- Q: Qui produit les textes des sept guides de lancement ? → A: Brouillons FR et EN préparés par
  l'équipe projet à partir des informations de l'équipe locale, corrigés, validés et signés par un
  membre de l'équipe avant publication.
- Q: Quelle page cible la requête principale « Mar Lodj » ? → A: La fiche destination Mar Lodj ;
  le guide cible la longue traîne informationnelle (« Mar Lodj île sans voitures », « que faire à
  Mar Lodj », « visiter Mar Lodj » ; EN « things to do in Mar Lodj ») et renvoie vers la fiche.
- Q: Vers quelle page publique pointe la signature d'un auteur ? → A: Une page par auteur (photo,
  rôle, présentation, lieu, liste de ses guides), en FR et EN.
- Q: Nom de la rubrique en anglais ? → A: « Saloum Travel Guides » (`/en/saloum-travel-guides`) ;
  le français reste « Carnets du Saloum » (`/fr/carnets-du-saloum`).
- Q: « que faire au Sine-Saloum », cible du hub des expériences depuis la 001, revient-elle au
  guide 1 ? → A: Oui ; le hub des expériences est recentré sur « activités Sine-Saloum » /
  « excursions Sine-Saloum » (EN « Sine-Saloum activities / excursions »).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lire un guide trouvé sur Google (Priority: P1)

Claire prépare un voyage au Sénégal depuis Lyon. Elle tape « que faire au Sine-Saloum » sur son
téléphone, arrive sur le guide des Carnets du Saloum. Elle voit tout de suite qui l'a écrit (nom,
photo, rôle dans l'équipe, basé à Ndangane), quand il a été mis à jour, et une table des matières
qui lui permet d'aller directement à la partie « en famille ». Elle lit, puis ouvre l'excursion en
pirogue citée dans le guide.

**Why this priority**: c'est la valeur même de la fonctionnalité : une page qui répond à une
requête Google, inspire confiance et mène vers une offre. Sans elle, rien d'autre n'a d'intérêt.

**Independent Test**: publier un seul guide en FR et EN ; l'ouvrir à 360 px depuis une URL
directe ; vérifier auteur, photo, date de mise à jour, table des matières fonctionnelle, liens
vers les offres, et la page servie sans JavaScript.

**Acceptance Scenarios**:

1. **Given** un guide publié, **When** un visiteur l'ouvre, **Then** il voit en haut de page le
   titre, le nom et la photo de l'auteur avec son rôle, la date de dernière mise à jour et, si le
   guide a été relu par une autre personne, le nom du relecteur.
2. **Given** un guide comportant plusieurs sections, **When** le visiteur touche une entrée de la
   table des matières, **Then** la page l'amène à la section correspondante, et la section reste
   lisible sous l'en-tête du site.
3. **Given** un guide qui cite des offres, **When** le visiteur parcourt le guide, **Then** il
   trouve des liens vers les séjours, expériences, hébergements ou destinations concernés, avec
   leur visuel, leur nom et, pour les offres vendues, leur prix « à partir de » en FCFA.
4. **Given** un guide publié dans les deux langues, **When** le visiteur change de langue,
   **Then** il arrive sur la version équivalente du même guide.
5. **Given** un moteur de recherche qui explore la page sans exécuter de JavaScript, **When** il
   lit le guide, **Then** le contenu complet, l'auteur, la date et les liens sont présents, ainsi
   que les données structurées d'article et de fil d'Ariane.

---

### User Story 2 - Passer d'une offre aux guides qui en parlent (Priority: P2)

Moussa regarde la fiche « Week-end bolong à Ndangane ». Il se demande comment venir depuis
l'aéroport. En bas de la fiche, un encart « À lire dans les Carnets du Saloum » propose le guide
« Comment aller de Dakar ou de l'aéroport AIBD à Ndangane ». Il l'ouvre, lit, revient au séjour.

**Why this priority**: le maillage dans les deux sens renforce le référencement des guides et des
offres, et rassure le visiteur au moment de choisir. Il dépend de l'existence des guides (US1).

**Independent Test**: lier un guide à une destination et à un séjour ; vérifier que l'encart
apparaît sur ces deux fiches et sur aucune autre, et que le lien inverse existe dans le guide.

**Acceptance Scenarios**:

1. **Given** un guide lié à une offre ou une destination, **When** un visiteur ouvre cette offre
   ou cette destination, **Then** un encart « À lire dans les Carnets du Saloum » présente le
   guide (titre, image, temps de lecture).
2. **Given** un lien créé une seule fois par l'équipe entre un guide et une offre, **When** les
   deux pages sont publiées, **Then** le lien apparaît des deux côtés sans saisie supplémentaire.
3. **Given** une offre liée à plus de trois guides, **When** sa fiche s'affiche, **Then** l'encart
   présente au plus trois guides, choisis par ordre de priorité défini par l'équipe.
4. **Given** une offre dépubliée ou un guide dépublié, **When** l'autre page s'affiche, **Then** le
   lien vers la page dépubliée n'apparaît plus.

---

### User Story 3 - Écrire, faire relire et publier un guide (Priority: P3)

Aïssatou, de l'équipe à Ndangane, rédige le guide sur les huîtres de palétuviers dans l'espace de
gestion. Elle se choisit comme autrice, désigne Ibrahima comme relecteur, ajoute ses propres
photos avec leur provenance, lie le guide à la Table du Saloum et à l'île de Mar Lodj, puis fait
traduire la version anglaise. La publication est refusée tant qu'il manque une photo d'auteur, un
texte alternatif ou la traduction.

**Why this priority**: indispensable pour produire et tenir à jour les guides sans intervention
technique, mais les premiers guides peuvent être saisis par l'équipe projet.

**Independent Test**: créer un guide complet dans l'espace de gestion, tenter de le publier avec
chaque élément obligatoire manquant tour à tour, puis le publier complet et le voir en ligne.

**Acceptance Scenarios**:

1. **Given** un guide en brouillon, **When** l'équipe tente de le publier sans auteur, sans photo
   d'auteur, sans image principale, sans texte alternatif FR et EN pour chaque image, ou sans
   titre et description de page, **Then** la publication est refusée avec la liste des éléments
   manquants.
2. **Given** un guide publié en français et pas encore traduit, **When** il est publié, **Then**
   seule la version française est en ligne et annoncée aux moteurs de recherche ; la version
   anglaise n'existe pas et n'est pas annoncée.
3. **Given** un guide déjà publié, **When** l'équipe corrige une coquille, **Then** la date de mise
   à jour affichée ne change pas ; **When** l'équipe fait une mise à jour de fond et le signale,
   **Then** la date affichée devient celle du jour.
4. **Given** un guide dont l'adresse (URL) change, **When** il est republié, **Then** l'ancienne
   adresse redirige définitivement vers la nouvelle.
5. **Given** un guide qui n'a pas été revu depuis 12 mois, **When** l'équipe consulte la liste des
   guides, **Then** il est signalé « à revoir ».

---

### User Story 4 - Parcourir la rubrique Carnets du Saloum (Priority: P4)

Une voyageuse arrive sur la page d'accueil des Carnets depuis le menu. Elle voit l'ensemble des
guides, regroupés par thème (préparer son voyage, que faire, culture et nature), avec pour chacun
une image, un résumé et le temps de lecture.

**Why this priority**: utile pour la navigation et le maillage interne, mais la majorité des
lecteurs arriveront directement sur un guide depuis Google.

**Independent Test**: publier au moins trois guides de thèmes différents ; ouvrir la page de la
rubrique dans les deux langues ; vérifier regroupement, liens, présence dans le menu, le pied de
page et le plan du site.

**Acceptance Scenarios**:

1. **Given** des guides publiés, **When** un visiteur ouvre la page de la rubrique, **Then** il
   voit tous les guides publiés dans sa langue, regroupés par thème, avec image, titre, résumé et
   temps de lecture.
2. **Given** la rubrique publiée, **When** un visiteur ouvre le menu ou le pied de page, **Then**
   il y trouve un lien vers les Carnets du Saloum.
3. **Given** un guide publié, **When** le plan du site est généré, **Then** le guide y figure avec
   sa date de mise à jour et ses images.

---

### User Story 5 - Suivre l'objectif de référencement (Priority: P5)

Le gérant veut savoir, chaque mois, si les guides progressent vers le top 10 Google et s'ils
amènent des demandes et des réservations.

**Why this priority**: l'objectif de 6 mois n'a de sens que s'il est mesuré, mais la mesure
n'empêche pas de publier.

**Independent Test**: pour un guide publié, vérifier que sa requête cible FR et EN est consignée
et que la lecture du guide et les clics vers les offres sont mesurés dans l'outil d'audience.

**Acceptance Scenarios**:

1. **Given** un guide, **When** l'équipe le crée, **Then** elle consigne sa requête cible
   principale en français et en anglais, visible dans la liste des guides.
2. **Given** un visiteur qui lit un guide, **When** il clique vers une offre, **Then** l'outil
   d'audience enregistre la lecture et le clic (guide d'origine, offre cible, langue), sans cookie
   ni donnée personnelle.

---

### Edge Cases

- **Offre liée retirée** : un lien vers une offre ou une destination dépubliée disparaît du guide
  et de l'encart, sans lien cassé ni bloc vide.
- **Auteur qui quitte l'équipe** : le guide reste signé de son auteur d'origine tant que son
  contenu ne change pas, et sa page d'auteur reste en ligne tant qu'elle porte au moins un guide
  publié ; une mise à jour de fond exige un auteur ou un relecteur membre actuel de l'équipe.
- **Page d'auteur sans guide** : un membre de l'équipe sans guide publié dans une langue n'a pas
  de page d'auteur dans cette langue (aucune page vide).
- **Informations datées** (prix d'un taxi, horaires de bac, marées, saisons des oiseaux) :
  chaque information chiffrée qui change est datée dans le texte (« tarif constaté en
  novembre 2026 ») ; les prix sont en FCFA avec conversion indicative en euros.
- **Concurrence entre pages du site** : un guide ne cible jamais la requête principale d'une page
  existante du site. La fiche destination Mar Lodj garde « Mar Lodj » / « Mar Lodj island » ; le
  guide « Mar Lodj, l'île sans voitures » cible la longue traîne informationnelle, renvoie vers
  la fiche dès son introduction et ne reprend pas son contenu.
- **Guide sans traduction** : publié en français seulement, sans annonce de version anglaise ; la
  bascule de langue mène à la rubrique en anglais.
- **Table des matières** : un guide de moins de trois sections n'affiche pas de table des
  matières.
- **Photos** : un guide ne peut utiliser que de vraies photos du Saloum avec leur provenance ;
  faute de photo, le guide n'est pas publiable.
- **Sujet sensible** (culture sérère) : le guide doit être relu par une personne de l'équipe issue
  de la communauté ou consultée à ce sujet, avant publication.

## Requirements *(mandatory)*

### Functional Requirements

**Guides**

- **FR-001** : Le site DOIT proposer une rubrique publique « Carnets du Saloum » (EN : « Saloum
  Travel Guides »), composée d'une page d'accueil de rubrique et d'une page par guide, en français et
  en anglais.
- **FR-002** : Chaque guide DOIT afficher, en haut de page : le titre (seul titre principal de la
  page), un chapeau, le nom, la photo et le rôle de l'auteur, la mention « basé à Ndangane » ou le
  lieu de l'auteur, la date de dernière mise à jour, le temps de lecture estimé et, le cas échéant,
  le nom du relecteur.
- **FR-003** : Chaque auteur DOIT disposer d'une courte présentation, affichée en fin de guide,
  et ne peut être qu'un membre de l'équipe présenté sur le site. Le nom de l'auteur et du
  relecteur DOIT mener à sa page d'auteur.
- **FR-003b** : Chaque membre de l'équipe qui signe ou relit au moins un guide publié DOIT avoir
  une page publique d'auteur, en français et en anglais : photo, nom, rôle, lieu, présentation,
  liste de ses guides publiés dans la langue de la page, et lien vers l'équipe sur « À propos ».
  Cette page est indexable, décrite par des données structurées de personne et de fil d'Ariane,
  et présente dans le plan du site.
- **FR-004** : Un guide de trois sections ou plus DOIT afficher une table des matières générée à
  partir de ses intertitres, dont chaque entrée mène à la section correspondante.
- **FR-005** : Un guide DOIT pouvoir contenir des intertitres, paragraphes, listes, photos avec
  légende, encadrés d'information pratique et une foire aux questions ; une foire aux questions
  présente DOIT être décrite dans les données structurées correspondantes.
- **FR-006** : La date de mise à jour affichée DOIT être celle de la dernière mise à jour de fond
  signalée par l'équipe, distincte des corrections mineures ; la date de première publication
  DOIT être conservée.
- **FR-007** : Chaque guide DOIT être décrit par des données structurées valides de type article
  (titre, image, auteur avec son nom et l'adresse de sa page d'auteur, éditeur Saloum Évasion, dates de
  publication et de mise à jour) et de fil d'Ariane (Accueil › Carnets du Saloum › guide).
- **FR-008** : Le contenu complet des guides et de la rubrique DOIT être présent dans la page
  servie, sans dépendre de JavaScript.

**Maillage**

- **FR-009** : L'équipe DOIT pouvoir lier un guide à des séjours, expériences, hébergements et
  destinations, et ordonner ces liens ; le lien DOIT apparaître dans le guide et, en retour, sur
  la page de l'offre ou de la destination, sans double saisie.
- **FR-010** : Chaque guide DOIT présenter ses offres liées sous forme de cartes (visuel, nom,
  prix « à partir de » en FCFA pour une offre vendue) en plus des liens dans le texte.
- **FR-011** : Chaque fiche séjour, expérience, hébergement et destination liée à au moins un
  guide DOIT afficher un encart « À lire dans les Carnets du Saloum » (EN : « From our Saloum
  Travel Guides ») de trois guides au plus.
- **FR-012** : Un lien vers une page non publiée dans la langue affichée NE DOIT JAMAIS apparaître.
- **FR-013** : Chaque guide DOIT proposer en fin de page d'autres guides de la rubrique et un
  moyen de contacter l'équipe sur WhatsApp en un geste.

**Gestion et publication**

- **FR-014** : L'équipe DOIT pouvoir créer, modifier, prévisualiser, publier et dépublier un guide
  dans l'espace de gestion existant, sans intervention technique.
- **FR-015** : La publication d'un guide DOIT être refusée tant que manquent : l'auteur et sa
  photo, l'image principale, un texte alternatif FR et EN pour chaque image, la provenance de
  chaque photo, le titre de page (≤ 60 caractères) et la description de page (≤ 155 caractères)
  dans chaque langue publiée.
- **FR-015b** : L'espace de gestion DOIT afficher, sans bloquer la publication, un avertissement
  « Points à vérifier » quand un guide compte moins de deux liens vers des offres ou des
  destinations, moins de 600 mots dans une langue publiée, ou un chapeau hors de 140 à 300
  caractères.
- **FR-016** : Un guide sans traduction anglaise DOIT être publié en français seulement, sans
  annonce de version anglaise aux moteurs de recherche.
- **FR-017** : Tout changement d'adresse d'un guide publié ou d'une page d'auteur DOIT créer une
  redirection permanente depuis l'ancienne adresse.
- **FR-018** : La liste des guides dans l'espace de gestion DOIT montrer, pour chacun, sa requête
  cible FR et EN, sa date de mise à jour, son statut de traduction, et signaler « à revoir » un
  guide sans mise à jour de fond depuis 12 mois.
- **FR-019** : Le guide sur la culture sérère DOIT porter un relecteur, membre de l'équipe issu
  de la communauté ou consulté à ce sujet ; le champ relecteur est obligatoire, l'appartenance
  ou la consultation est vérifiée par l'équipe.

**Contenu de lancement**

- **FR-020** : La rubrique DOIT être lancée avec les sept guides suivants, en français et en
  anglais, chacun lié à au moins deux offres ou destinations du site :

  | Guide | Requête cible FR | Requête cible EN | Liens principaux |
  |---|---|---|---|
  | Que faire au Sine-Saloum | que faire au Sine-Saloum | things to do in Sine-Saloum | expériences, destinations |
  | Quand partir au Sine-Saloum (saisons, marées, oiseaux) | quand partir au Sine-Saloum | best time to visit Sine-Saloum | séjours, île aux Oiseaux |
  | Aller de Dakar ou de l'aéroport AIBD à Ndangane | Dakar Ndangane / AIBD Ndangane | Dakar to Ndangane | transferts, Ndangane |
  | Week-end au Sine-Saloum depuis Dakar | week-end Sine-Saloum depuis Dakar | Sine-Saloum weekend from Dakar | séjours, hébergements |
  | Les huîtres de palétuviers | huîtres de palétuviers Sénégal | mangrove oysters Senegal | Table du Saloum, Mar Lodj |
  | La culture sérère | culture sérère | Serer culture | expériences, destinations |
  | Mar Lodj, l'île sans voitures | que faire à Mar Lodj / Mar Lodj île sans voitures | things to do in Mar Lodj | Mar Lodj, hébergements |

- **FR-020b** : Une requête cible n'appartient qu'à une seule page du site ; l'attribution est
  vérifiée automatiquement avant chaque mise en ligne. « que faire au Sine-Saloum » / « things to
  do in Sine-Saloum » passe du hub des expériences au guide « Que faire au Sine-Saloum » ; le hub
  est recentré sur « activités Sine-Saloum » / « excursions Sine-Saloum » (EN « Sine-Saloum
  activities » / « Sine-Saloum excursions ») et le guide le cite dès son introduction.

- **FR-021** : Les textes des sept guides de lancement DOIVENT être préparés en brouillon, en
  français et en anglais, par l'équipe projet à partir des informations fournies par l'équipe
  locale, puis corrigés, validés et signés par un membre de l'équipe avant publication ; aucun
  guide n'est publié sans cette validation, et l'auteur affiché est le membre de l'équipe qui
  l'a validé.

**Mesure**

- **FR-022** : Le site DOIT mesurer, par guide et par langue, les lectures et les clics vers les
  offres et vers WhatsApp, sans cookie ni donnée personnelle, avec l'outil d'audience existant.

### Key Entities

- **Guide** : article pratique de la rubrique ; titre, chapeau, corps structuré (sections,
  encadrés, foire aux questions), image principale, thème, auteur, relecteur facultatif, dates de
  première publication et de dernière mise à jour de fond, temps de lecture, requêtes cibles FR et
  EN, offres et destinations liées ordonnées, statut de publication par langue.
- **Auteur** : membre de l'équipe présenté sur le site (nom, rôle, photo, présentation, lieu) ;
  signe ou relit les guides ; dispose d'une page publique d'auteur dès qu'il signe ou relit un
  guide publié.
- **Thème** : regroupement des guides dans la rubrique (préparer son voyage, que faire, culture et
  nature).
- **Lien guide ↔ offre** : relation ordonnée entre un guide et un séjour, une expérience, un
  hébergement ou une destination, affichée des deux côtés.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** : Les sept guides de lancement sont publiés en français et en anglais, chacun signé
  d'un membre de l'équipe avec photo, et lié à au moins deux offres ou destinations qui le lient
  en retour.
- **SC-002** : Six mois après leur publication, chacun des sept guides se classe dans les dix
  premiers résultats Google pour sa requête cible française (position moyenne ≤ 10 sur 28 jours
  dans l'outil de suivi des positions de Google), et pour sa requête cible anglaise.
- **SC-003** : 100 % des guides passent sans erreur le test des résultats enrichis de Google pour
  les données d'article et de fil d'Ariane.
- **SC-004** : Au moins 15 % des lectures de guide sont suivies d'un clic vers une offre ou vers
  WhatsApp.
- **SC-005** : Les pages des guides et de la rubrique respectent les mêmes budgets de performance
  et d'accessibilité que le reste du site (mesurés sur mobile).
- **SC-006** : Un membre de l'équipe publie un guide complet en FR et EN, sans aide technique, en
  moins de 30 minutes une fois les textes et photos prêts.
- **SC-007** : 100 % des guides en ligne ont eu une mise à jour de fond dans les 12 derniers mois.

## Assumptions

- **Production des textes** : la rédaction des brouillons des sept guides fait partie de la
  fonctionnalité ; le calendrier de publication dépend des informations et de la validation de
  l'équipe locale (une liste de questions par guide lui est remise).
- **Auteurs** : les auteurs et relecteurs sont les membres de l'équipe déjà présentés sur le site
  (nom, rôle, photo), qui acceptent de signer ; aucun auteur externe ni pseudonyme.
- **Photos** : uniquement de vraies photos du Saloum, prises ou fournies par l'équipe avec leur
  provenance (auteur, lieu, date) et des droits confirmés ; les photos de démonstration ne sont
  pas utilisables dans un guide publié.
- **Adresses** : `/fr/carnets-du-saloum/<guide>` et `/en/saloum-travel-guides/<guide>` ; pages
  d'auteur `/fr/equipe/<prenom-nom>` et `/en/team/<first-last>` ; en minuscules avec tirets, comme
  le reste du site.
- **Marché et moteur** : Google en français (Sénégal et France) et en anglais ; le classement est
  suivi avec l'outil de suivi des positions de Google relié au site, déjà prévu par la 001.
- **Objectif de 6 mois** : il dépend aussi de facteurs extérieurs (concurrence, liens externes,
  évolution des algorithmes) ; la fonctionnalité fournit les conditions techniques et éditoriales,
  l'atteinte est mesurée et revue chaque mois.
- **Thèmes** : trois thèmes au lancement (préparer son voyage, que faire, culture et nature),
  modifiables par l'équipe.
- **Pas de commentaires** : les guides n'acceptent ni commentaires ni avis de lecteurs.
- **Hors périmètre** : newsletter, auteurs invités, traduction automatique publiée sans relecture,
  autres langues que le français et l'anglais, et guides au-delà des sept de lancement (que
  l'équipe pourra ajouter elle-même).
