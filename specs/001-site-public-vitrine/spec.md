# Feature Specification: Site public Saloum Évasion — vitrine, catalogue et film d'immersion

**Feature Branch**: `001-site-public-vitrine`
**Created**: 2026-11-14
**Status**: Draft
**Input**: User description: "Site public de Saloum Évasion : vitrine, catalogue et film d'immersion, pensé d'abord pour le téléphone et pour être trouvé sur Google."

## Contexte

Les voyageurs qui cherchent « séjour Sine-Saloum » tombent sur des listes d'hôtels sans âme ou
des clubs fermés. Saloum Évasion vend une immersion complète (hébergement, expériences,
gastronomie, transfert), organisée par des gens de Ndangane. Le site public doit donner envie de
partir, inspirer confiance et transformer la visite en **demande de séjour**. Il n'y a ni
paiement en ligne ni compte client dans cette version : la conversion est la demande (formulaire
ou WhatsApp), traitée ensuite par l'équipe.

**Publics** :

1. Expatrié ou cadre basé à Dakar, sur téléphone, qui décide le mercredi pour le vendredi.
2. Touriste européen (France, Belgique, Espagne) qui prépare son voyage via Google, surtout sur
   mobile, parfois sur ordinateur.
3. Diaspora sénégalaise et touristes sénégalais, habitués à Wave et Orange Money.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Week-end tout compris demandé en moins de 2 minutes, au pouce (Priority: P1)

Un expatrié à Dakar ouvre le site sur son téléphone le mercredi. Depuis l'accueil, il indique
ses dates et le nombre de voyageurs (ou parcourt directement les séjours signature), filtre par
durée « week-end », ouvre une fiche, lit le programme jour par jour, ce qui est inclus et le prix
« à partir de », puis touche « Demander ce séjour » dans la barre collante. Le formulaire court
est pré-rempli avec le séjour et ses dates ; il ajoute son numéro WhatsApp et envoie. Une
confirmation s'affiche à l'écran et l'équipe est notifiée.

**Why this priority** : c'est le cœur de la conversion. À lui seul, ce parcours (accueil →
liste de séjours → fiche → demande) constitue un MVP qui génère des demandes.

**Independent Test** : sur un téléphone de 360 px de large, en réseau 3G simulé, un testeur
part de l'accueil et envoie une demande pour un séjour week-end ; on chronomètre et on vérifie
que l'équipe a bien reçu la notification.

**Acceptance Scenarios** :

1. **Given** l'accueil ouvert sur un téléphone de 360 px, **When** le visiteur saisit des dates
   et un nombre de voyageurs puis lance la recherche, **Then** il arrive sur la liste des séjours
   signature avec ces critères conservés.
2. **Given** la liste des séjours, **When** le visiteur ouvre le panneau de filtres (qui monte du
   bas de l'écran) et choisit durée, envie ou budget, **Then** la liste n'affiche que les séjours
   correspondants et indique leur nombre ; si aucun ne correspond, un message propose d'élargir
   les filtres ou de contacter un hôte sur WhatsApp.
3. **Given** une fiche séjour, **When** le visiteur fait défiler la page, **Then** la barre
   « Demander ce séjour » / WhatsApp reste visible en bas de l'écran.
4. **Given** le formulaire de demande ouvert depuis une fiche, **When** il s'affiche, **Then** le
   séjour et les dates déjà saisies sont pré-remplis et seuls les champs indispensables restent à
   compléter.
5. **Given** un formulaire valide, **When** le visiteur l'envoie, **Then** une confirmation
   s'affiche à l'écran (récapitulatif + délai de réponse annoncé) et l'équipe reçoit une
   notification contenant toutes les informations de la demande.
6. **Given** un champ invalide (téléphone mal formé, date passée, départ après retour), **When**
   le visiteur tente d'envoyer, **Then** un message clair apparaît à côté du champ concerné et les
   autres saisies sont conservées.

---

### User Story 2 — Arrivée depuis Google sur la fiche d'une expérience (Priority: P2)

Une touriste tape « excursion pirogue Sine-Saloum » sur Google. Le résultat affiche un titre et
une description pertinents ; elle arrive directement sur la fiche de l'expérience, comprend en
quelques secondes la durée, le niveau, la saison, le point de départ et le prix par personne (en
FCFA, avec équivalent indicatif en euros), suit le fil d'Ariane si besoin, et ajoute
l'expérience à sa demande.

**Why this priority** : la recherche organique est le principal canal d'acquisition des
touristes européens ; chaque fiche doit être une porte d'entrée autonome.

**Independent Test** : ouvrir directement l'URL d'une fiche expérience (sans passer par
l'accueil), vérifier que la page est complète sans exécution de script, que les informations
clés sont visibles sans défilement excessif sur 360 px, et que l'ajout à la demande fonctionne.

**Acceptance Scenarios** :

1. **Given** une fiche expérience ouverte par lien direct, **When** elle s'affiche, **Then** on
   voit le nom, l'univers, la durée, le niveau, la saison, le point de départ et le prix par
   personne en FCFA TTC avec équivalent indicatif en euros signalé comme tel.
2. **Given** une fiche expérience, **When** la visiteuse touche « Ajouter à ma demande »,
   **Then** l'expérience rejoint sa demande en cours et elle peut soit continuer à naviguer, soit
   ouvrir le formulaire où l'expérience figure déjà.
3. **Given** n'importe quelle fiche (séjour, expérience, hébergement, destination), **When** on
   consulte le contenu servi, **Then** il contient un titre, une description, un fil d'Ariane et
   des données structurées propres à la page, ainsi qu'au moins 300 mots de texte unique.
4. **Given** le lien d'une fiche partagé sur WhatsApp ou un réseau social, **When** l'aperçu
   s'affiche, **Then** il montre une image représentative, le titre et la description de la
   fiche.

---

### User Story 3 — L'équipe gère le catalogue sans développeur (Priority: P3)

Un membre de l'équipe se connecte à un espace de gestion et ajoute ou modifie un séjour, une
expérience, un hébergement ou une destination : textes en français et en anglais, prix, photos
(avec texte alternatif et provenance), liens entre contenus. Il publie, et la page publique est
à jour sans intervention technique.

**Why this priority** : sans cette autonomie, le catalogue vieillit et chaque correction de prix
ou de photo bloque l'équipe ; c'est la condition d'un site vivant après le lancement.

**Independent Test** : un membre de l'équipe non technique crée une nouvelle expérience
bilingue avec trois photos et la publie ; la fiche apparaît en FR et EN, dans la liste de son
univers, sur la page de sa destination et dans le plan du site.

**Acceptance Scenarios** :

1. **Given** un membre de l'équipe authentifié, **When** il crée un contenu et le publie,
   **Then** la page publique correspondante existe en FR et EN et apparaît dans les listes, les
   pages de destination liées et le plan du site.
2. **Given** un contenu dont la version anglaise est incomplète, **When** il tente de publier,
   **Then** il est averti ; la version anglaise n'est pas publiée (ni annoncée comme
   alternative) tant qu'elle n'est pas complète.
3. **Given** une photo téléversée sans texte alternatif FR/EN ou sans provenance, **When** il
   tente de publier, **Then** la publication est refusée avec un message expliquant ce qui
   manque.
4. **Given** le titre d'un contenu publié modifié de façon à changer son adresse, **When** il
   publie, **Then** l'ancienne adresse redirige définitivement vers la nouvelle.
5. **Given** un contenu dépublié, **When** un visiteur ouvre son ancienne adresse, **Then** il
   est redirigé vers la page parente la plus pertinente (liste ou destination).

---

### User Story 4 — Le visiteur hésitant regarde le film et contacte un hôte (Priority: P4)

Une visiteuse hésite. Elle lance le film d'immersion, saute au chapitre qui l'intéresse, regarde
deux vidéos verticales de 15 s, lit la page « Notre engagement » et l'équipe locale dans
« À propos », puis touche le bouton WhatsApp : la conversation s'ouvre avec un message
pré-rédigé mentionnant la page d'où elle vient.

**Why this priority** : la confiance déclenche la décision des visiteurs hésitants ; WhatsApp
est le canal de contact principal au Sénégal.

**Independent Test** : sur mobile, ouvrir la page du film, lancer un chapitre, puis contacter
un hôte sur WhatsApp en un seul geste depuis n'importe quelle page publique.

**Acceptance Scenarios** :

1. **Given** la page du film sur mobile, **When** elle se charge, **Then** aucune vidéo n'est
   téléchargée tant que la visiteuse n'a pas touché « lecture » ; seule une image d'affiche
   légère est affichée.
2. **Given** le film en lecture, **When** elle choisit un chapitre, **Then** la lecture reprend
   au début de ce chapitre.
3. **Given** n'importe quelle page publique, **When** elle touche le bouton WhatsApp, **Then**
   WhatsApp s'ouvre vers le numéro de l'équipe avec un message pré-rédigé dans la langue de la
   page indiquant le séjour, l'expérience ou la page consultée.
4. **Given** un appareil en mode économie de données ou mouvement réduit, **When** une page
   contenant une vidéo se charge, **Then** aucune lecture automatique n'a lieu.
5. **Given** une connexion trop faible pour la vidéo, **When** la visiteuse ouvre l'accueil,
   **Then** le grand visuel, la promesse, la recherche et les séjours signature restent
   affichés et utilisables.

---

### User Story 5 — L'anglophone bascule en anglais sur la même page (Priority: P5)

Un visiteur anglophone arrive sur une fiche en français. Il touche le sélecteur de langue et se
retrouve sur la même fiche en anglais, avec une adresse anglaise lisible. Sa demande en cours est
conservée.

**Why this priority** : indispensable pour les touristes non francophones, mais la majorité des
visiteurs cibles lisent le français.

**Independent Test** : depuis 10 pages françaises de types différents, basculer en anglais et
vérifier qu'on arrive à la page équivalente (et non à l'accueil anglais).

**Acceptance Scenarios** :

1. **Given** une page française qui a une version anglaise, **When** le visiteur choisit
   « English », **Then** il arrive sur la version anglaise de la même page.
2. **Given** une page sans version anglaise publiée, **When** il choisit « English », **Then** il
   arrive sur la page anglaise parente la plus proche (liste ou destination) avec un court
   message l'expliquant.
3. **Given** une demande en cours contenant des éléments, **When** il change de langue, **Then**
   la demande est conservée.

---

### Edge Cases

- **Vidéo indisponible ou trop lente** : l'accueil et la page du film affichent l'image
  d'affiche et le contenu textuel ; aucune zone vide ni décalage de mise en page.
- **Réseau coupé pendant l'envoi de la demande** : les saisies sont conservées sur l'appareil,
  un message invite à réessayer et propose WhatsApp comme alternative ; aucune demande n'est
  envoyée en double si le visiteur touche deux fois « Envoyer ».
- **Dates incohérentes** : date passée, retour avant départ, ou séjour de durée fixe
  incompatible avec les dates choisies → message explicite, l'équipe ajuste ensuite.
- **Groupe hors capacité** : nombre de voyageurs supérieur à la capacité affichée d'un
  hébergement ou d'un séjour → la demande reste possible avec une mention « l'équipe vous
  proposera une solution adaptée ».
- **Recherche sans résultat** : proposition d'élargir les critères et de contacter un hôte.
- **Saison** : une expérience hors saison reste consultable, avec la mention de sa saison ; la
  demande reste possible.
- **Destination sans contenu lié** : la page destination ne montre pas de section vide ; elle
  masque les rubriques sans contenu.
- **Spam du formulaire** : les envois automatisés sont filtrés sans imposer d'épreuve pénible
  au visiteur légitime.
- **Lien partagé vers un contenu dépublié** : redirection vers la page parente, jamais une page
  d'erreur sèche.
- **Visiteur sur ordinateur** : toutes les fonctions restent disponibles sans dépendre du
  survol ; la mise en page s'élargit sans perdre de contenu.

## Requirements *(mandatory)*

### Functional Requirements

**Pages et contenus**

- **FR-001** : Le site DOIT proposer une page d'accueil comprenant : grand visuel (ou vidéo) de
  la mangrove, promesse « Le Saloum, vécu de l'intérieur », recherche (dates, voyageurs, envie),
  garanties, séjours signature, univers, film d'immersion, destinations, étapes de demande,
  engagement local et contact WhatsApp.
- **FR-002** : Le site DOIT proposer une liste des séjours signature filtrable par durée, envie
  et budget, et une fiche par séjour avec : programme jour par jour, inclus / non inclus, prix
  « à partir de » en FCFA TTC avec équivalent indicatif en euros, galerie, carte, FAQ, conditions
  d'annulation et séjours similaires.
- **FR-003** : Le site DOIT présenter les expériences regroupées par univers (Mangrove & îles,
  Terre & villages, Table du Saloum) et une fiche par expérience avec : durée, niveau, saison,
  point de départ, prix par personne en FCFA TTC avec équivalent indicatif en euros.
- **FR-004** : Le site DOIT présenter les hébergements par type (villas, écolodges, campements)
  et une fiche par hébergement avec : capacité, équipements, photos et emplacement.
- **FR-005** : Le site DOIT proposer une page par destination (Ndangane, Mar Lodj, île aux
  Oiseaux, Joal-Fadiouth, Palmarin, Djiffer) reliant les séjours, expériences et hébergements du
  lieu.
- **FR-006** : Le site DOIT proposer une page « Film d'immersion » avec la vidéo principale
  découpée en chapitres navigables et les vidéos verticales de 15 s.
- **FR-007** : Le site DOIT proposer les pages Notre engagement, À propos (équipe locale avec
  photos), FAQ, Contact, Mentions légales et Confidentialité.
- **FR-008** : Les pages de séjours, d'expériences, d'hébergements et de destinations DOIVENT se
  lier entre elles (séjours similaires, expériences et hébergements du lieu, destination de
  rattachement) pour qu'un visiteur ne tombe jamais dans une impasse.
- **FR-009** : Le site DOIT appliquer l'identité visuelle de la maquette validée (vert
  mangrove, ocre latérite, sable ; titres en serif élégante, texte en sans-serif ; motif inspiré
  des tissages sérères), dans le respect des contrastes d'accessibilité.

**Demande de séjour**

- **FR-010** : Le visiteur DOIT pouvoir ajouter un ou plusieurs séjours, expériences ou
  hébergements à une « demande en cours », sans créer de compte ; celle-ci est conservée sur
  l'appareil pendant la navigation, y compris lors d'un changement de langue.
- **FR-011** : Le formulaire de demande DOIT se limiter à : éléments choisis (pré-remplis),
  dates, nombre de voyageurs (adultes / enfants), envies, budget indicatif, prénom, numéro
  WhatsApp (avec indicatif pays) et, en option, e-mail et message libre.
- **FR-012** : Chaque champ DOIT déclencher le clavier adapté sur mobile et accepter le
  remplissage automatique du navigateur.
- **FR-013** : À l'envoi, le site DOIT afficher une confirmation (récapitulatif et délai de
  réponse annoncé) et notifier l'équipe avec l'intégralité de la demande, la langue du visiteur
  et la page d'origine. Si la notification échoue, elle DOIT être relancée automatiquement, puis
  signalée à une adresse de secours si les relances échouent.
- **FR-014** : Le site DOIT empêcher les envois en double et filtrer les envois automatisés.
- **FR-015** : Le formulaire DOIT recueillir le consentement du visiteur au traitement de ses
  données pour répondre à sa demande, avec un lien vers la politique de confidentialité.

**Contact WhatsApp**

- **FR-016** : Chaque page publique DOIT offrir un accès WhatsApp en un geste, ouvrant une
  conversation avec un message pré-rédigé dans la langue de la page et mentionnant la page
  consultée.

**Mobile et sobriété**

- **FR-017** : Sur mobile, la navigation principale DOIT s'ouvrir en menu plein écran. Les
  fiches séjour, expérience et hébergement et les pages destination DOIVENT afficher une barre
  collante en bas avec un bouton WhatsApp et une action principale dont le libellé dépend du
  type de page : « Demander ce séjour » (séjour), « Ajouter à ma demande » (expérience,
  hébergement), « Voir les séjours à {lieu} » (destination).
- **FR-018** : Les filtres DOIVENT s'ouvrir dans un panneau qui monte du bas de l'écran ; les
  galeries DOIVENT se parcourir par balayage au doigt et rester utilisables au clavier.
- **FR-019** : Aucune vidéo ne DOIT être téléchargée avant une action du visiteur sur mobile ;
  la lecture automatique est désactivée en mode économie de données et mouvement réduit.
- **FR-020** : Toutes les pages DOIVENT rester lisibles et utilisables sur une connexion 3G
  (référence : environ 780 kbit/s et 300 ms de latence) : titre principal et contenu principal
  lisibles en 5 secondes au plus, actions principales utilisables ; l'accueil DOIT rester utile
  si la vidéo ne charge pas.

**Langues**

- **FR-021** : Tout le contenu public DOIT exister en français (par défaut) et en anglais, avec
  des adresses lisibles propres à chaque langue.
- **FR-022** : Le sélecteur de langue DOIT conduire à la page équivalente dans l'autre langue,
  ou à la page parente la plus proche si l'équivalent n'existe pas.

**Référencement**

- **FR-023** : Chaque séjour, expérience, hébergement et destination DOIT avoir sa propre page
  indexable dans chaque langue publiée, avec au moins 300 mots de texte unique sur les fiches.
- **FR-024** : Chaque page publique DOIT avoir un titre et une description uniques, un seul
  titre principal, une adresse de référence, un aperçu de partage (image, titre, description)
  et des données structurées adaptées à son type.
- **FR-025** : Toutes les pages publiques DOIVENT afficher un fil d'Ariane, sauf l'accueil, le
  formulaire de demande et sa confirmation, et la page d'erreur.
- **FR-026** : Chacun des mots-clés cibles suivants DOIT être couvert par au moins une page
  dédiée ou principale, en français et par son équivalent anglais : séjour Sine-Saloum,
  week-end Ndangane, que faire au Sine-Saloum, excursion pirogue Sine-Saloum, île aux Oiseaux
  Saloum, villa piscine Ndangane, lodge Sine-Saloum, quad Sine-Saloum, balade à cheval Palmarin,
  Mar Lodj.
- **FR-027** : La vidéo principale DOIT être décrite pour les moteurs de recherche avec ses
  chapitres ; le plan du site DOIT inclure les pages, images et vidéos et se mettre à jour à
  chaque publication.
- **FR-028** : Le formulaire de demande et sa confirmation NE DOIVENT PAS être indexés.

**Gestion du contenu**

- **FR-029** : Les membres de l'équipe authentifiés DOIVENT pouvoir créer, modifier, publier et
  dépublier séjours, expériences, hébergements, destinations, FAQ et pages éditoriales, en FR et
  EN, sans intervention technique.
- **FR-030** : La publication DOIT être bloquée si un contenu obligatoire manque (texte
  alternatif FR/EN et provenance des photos, prix, conditions d'annulation pour un séjour).
- **FR-031** : Toute adresse modifiée DOIT rediriger définitivement l'ancienne vers la
  nouvelle ; un contenu dépublié DOIT rediriger vers sa page parente.
- **FR-032** : Les coordonnées de l'entreprise (nom, adresse, téléphone, WhatsApp) DOIVENT être
  saisies une seule fois et réutilisées à l'identique sur tout le site.
- **FR-033** : L'équipe DOIT pouvoir consulter la liste des demandes reçues avec leur date,
  leur contenu et leur page d'origine.

**Confiance**

- **FR-034** : Le site NE DOIT afficher que des photos et vidéos réelles des lieux et prestations
  proposés.
- **FR-035** : Le site NE DOIT afficher aucun avis ni note dans cette version, en l'absence de
  séjours réservés vérifiables (voir Assumptions).
- **FR-036** : Les conditions d'annulation DOIVENT être visibles sur chaque fiche séjour et
  rappelées dans le formulaire de demande.
- **FR-037** : Le site DOIT présenter Wave, Orange Money et carte bancaire au même niveau dans
  les informations sur les moyens de paiement acceptés (paiement traité hors ligne par l'équipe).

**Mesure et vie privée**

- **FR-038** : Le site DOIT mesurer, dès le premier jour, le nombre de visites, le nombre de
  demandes envoyées, le nombre de contacts WhatsApp initiés et le taux de demande, par page
  d'origine et par langue.
- **FR-039** : Aucun traceur non essentiel ne DOIT être déposé avant le consentement du
  visiteur ; refuser DOIT être aussi simple qu'accepter.

### Key Entities

- **Séjour signature** : offre tout compris (hébergement + expériences + repas + transfert) ;
  durée, envies associées, programme jour par jour, inclus / non inclus, prix « à partir de »
  (XOF), conditions d'annulation, galerie, FAQ, destination(s), hébergement(s) et expériences
  inclus, séjours similaires.
- **Expérience** : activité ; univers, durée, niveau, saison, point de départ, prix par personne
  (XOF), photos, destination.
- **Hébergement** : villa, écolodge ou campement ; capacité, équipements, photos, emplacement,
  destination.
- **Destination** : lieu (Ndangane, Mar Lodj, île aux Oiseaux, Joal-Fadiouth, Palmarin,
  Djiffer) ; description, photos, localisation ; relie séjours, expériences et hébergements.
- **Univers** : regroupement thématique des expériences (Mangrove & îles, Terre & villages,
  Table du Saloum, et un quatrième sur l'accueil — voir Assumptions).
- **Média** : photo ou vidéo réelle ; textes alternatifs FR/EN, provenance (auteur, lieu,
  date) ; pour la vidéo : affiche, chapitres, sous-titres, format (principale ou verticale 15 s).
- **Demande de séjour** : éléments choisis, dates, voyageurs, envies, budget, prénom, numéro
  WhatsApp, e-mail optionnel, message, langue, page d'origine, consentement, date d'envoi.
- **Page éditoriale** : engagement, à propos, FAQ, contact, mentions légales, confidentialité.
- **Membre de l'équipe** : personne autorisée à gérer le contenu et consulter les demandes.
- **Coordonnées de l'entreprise** : nom, adresse, téléphone, WhatsApp — source unique.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** : 100 % des pages publiques indexables (FR et EN, hors pages volontairement en
  `noindex` : demande, confirmation, mentions légales) sont indexées dans Google Search Console
  30 jours après la mise en ligne.
- **SC-002** : 100 % des URL publiques sont classées « Bonnes » pour les Core Web Vitals sur
  mobile (dès que les données terrain sont disponibles ; d'ici là, en mesure de laboratoire).
- **SC-003** : 9 testeurs sur 10 envoient une demande complète en moins de 2 minutes depuis
  l'accueil, sur un téléphone de 360 px, au pouce.
- **SC-004** : le taux de demande (demandes + contacts WhatsApp / visites) est consultable dès
  le premier jour de mise en ligne, par page d'origine et par langue.
- **SC-005** : chacun des 10 mots-clés cibles (et son équivalent anglais) dispose d'au moins
  une page dédiée indexée au lancement.
- **SC-006** : depuis toute page publique, un contact WhatsApp s'ouvre en un seul geste.
- **SC-007** : un membre de l'équipe non technique publie une nouvelle expérience bilingue avec
  photos en moins de 15 minutes, sans aide.
- **SC-008** : 100 % des bascules de langue mènent à la page équivalente ou, à défaut, à la
  page parente la plus proche — jamais à une page d'erreur.
- **SC-009** : 100 % des demandes envoyées donnent lieu à une notification reçue par l'équipe.

## Assumptions

- **Conversion sans paiement** : le site génère des demandes ; la confirmation, le devis et
  l'encaissement (Wave, Orange Money, carte) sont traités par l'équipe hors du site. Le paiement
  en ligne, les comptes clients, l'espace prestataires, le calendrier temps réel et le blog sont
  hors périmètre.
- **Disponibilité** : sans calendrier temps réel, les dates saisies sont des souhaits ; l'équipe
  confirme la disponibilité par WhatsApp. La confirmation à l'écran le dit explicitement.
- **Délai de réponse annoncé** : l'équipe s'engage sur un délai (par défaut « sous 24 h, souvent
  dans l'heure ») ajustable dans la gestion du contenu.
- **Notification équipe** : par e-mail, avec relance automatique en cas d'échec ; la liste des
  demandes reste consultable dans l'espace de gestion. L'écran de confirmation propose au
  visiteur d'« Envoyer aussi sur WhatsApp » (message pré-rempli avec la référence), ce qui fait
  arriver la demande sur le WhatsApp de l'équipe sans service supplémentaire (plan, tension T1).
- **Conversion en euros** : le FCFA (XOF) a une parité fixe avec l'euro
  (1 € = 655,957 FCFA) ; l'équivalent en euros est arrondi et signalé comme indicatif.
- **Avis** : aucun avis n'est affiché au lancement, faute de séjours vérifiables ; la collecte
  d'avis de voyageurs ayant séjourné viendra avec une fonctionnalité ultérieure.
- **Langues** : français et anglais seulement ; les visiteurs espagnols utilisent la version
  anglaise ou française.
- **Quatrième univers** : la page d'accueil présente quatre univers alors que les expériences en
  comptent trois ; on suppose que le quatrième est « Séjours & hébergements » (le repos),
  présenté sur l'accueil comme porte d'entrée vers les hébergements, sans être un univers
  d'expériences. À confirmer lors de `/speckit.clarify`.
- **Recherche de l'accueil** : elle oriente vers les séjours correspondants (durée et envie) et
  transmet dates et voyageurs au formulaire ; elle ne vérifie pas la disponibilité.
- **Contenus et médias** : les textes FR/EN, photos et vidéos réels (dont le film et ses
  chapitres) sont fournis par l'équipe avant le lancement ; la maquette visuelle validée est
  disponible.
- **Rétention des demandes** : les demandes sont conservées 24 mois puis supprimées, sauf si
  elles ont donné lieu à un séjour.
- **Accès à la gestion** : réservé aux membres de l'équipe, avec identifiants individuels.
- **Fiche Google Business Profile** : existe ou sera créée, avec les mêmes coordonnées que le
  site.
