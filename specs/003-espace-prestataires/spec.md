# Feature Specification: Espace prestataires et disponibilités

**Feature Branch**: `003-espace-prestataires`
**Created**: 2026-11-16
**Status**: Draft
**Input**: User description: "003 — Espace prestataires et disponibilités. Propriétaires de villas, piroguiers, loueurs de quads, restaurants gèrent depuis leur téléphone : calendrier de disponibilités, tarifs saisonniers, réservations reçues, paiements versés. Synchronisation iCal avec Airbnb et Booking pour les hébergements afin d'éviter les doubles réservations. Notifications WhatsApp à chaque réservation. Interface utilisable par des personnes peu à l'aise avec l'informatique : grands boutons, icônes, français simple. Le site public n'affiche que les créneaux réellement disponibles. Espace prestataires entièrement en noindex. Mise en avant sponsorisée payante des restaurants, clairement signalée comme « Partenaire mis en avant »."

## Contexte

Avec la version 002, le voyageur paie en ligne, mais la disponibilité de chaque prestation est
encore **confirmée à la main par l'équipe** dans les 2 heures, au téléphone ou sur WhatsApp avec
le prestataire. Les plannings vivent dans des cahiers, sur des groupes WhatsApp, ou dans les
calendriers d'Airbnb et de Booking pour les villas. Résultat : des allers-retours, des
indisponibilités découvertes après paiement, et un risque réel de double réservation.

La version 003 donne à chaque prestataire — propriétaire de villa ou d'écolodge, piroguier,
loueur de quads, guide, restaurant, transporteur — un **espace personnel sur son téléphone** pour tenir ses
disponibilités et ses prix, voir les réservations qu'il reçoit et les sommes que Saloum Évasion
lui a versées. Le site public s'appuie sur ces disponibilités pour ne proposer que ce qui est
**réellement libre**. Les hébergements déjà présents sur Airbnb ou Booking restent synchronisés
avec eux pour éviter les doubles réservations.

Elle ouvre enfin une **source de revenus complémentaire** : les restaurants peuvent payer une
mise en avant, toujours **signalée comme telle** (constitution V, confiance et authenticité).

**Publics** :
- **Prestataires** : souvent à l'aise avec WhatsApp et Wave, beaucoup moins avec les sites web
  et les formulaires ; un téléphone Android d'entrée ou de milieu de gamme, une connexion
  parfois faible au bord du bolong ; lecture du français variable.
- **Voyageurs** (inchangés depuis 001 et 002) : ils voient désormais des dates et des créneaux
  fiables.
- **Équipe Saloum Évasion** : accompagne les prestataires, garde la main sur le catalogue et les
  mises en avant.

## Clarifications

### Session 2026-11-16

- Q: Une fois les disponibilités tenues par le prestataire, comment une réservation payée est-elle
  confirmée ? → A: Automatiquement dès le paiement si le calendrier indique la disponibilité (comme
  la réservation instantanée d'Airbnb) ; le prestataire garde le bouton « J'ai un problème », qui
  déclenche la règle d'indisponibilité de 002.
- Q: Quand un prestataire modifie un tarif saisonnier, quand le nouveau prix s'applique-t-il ? →
  A: Après validation par l'équipe, prévenue par WhatsApp ; d'ici là, l'ancien prix reste affiché
  et vendu.
- Q: Comment la mise en avant d'un restaurant est-elle vendue et payée ? → A: Forfait fixé par
  l'équipe (prix et période), payé hors du site (Wave, Orange Money, espèces) ; l'équipe
  l'enregistre comme payé dans l'administration.
- Q: Comment la disponibilité d'un séjour signature est-elle déterminée ? → A: Elle découle de
  ses composants : un séjour n'est réservable à une date que si son hébergement (les nuits) et
  ses expériences incluses (les créneaux prévus au programme) sont disponibles ; sa réservation
  consomme la capacité de chacun.
- Q: Comment modéliser un hébergement à plusieurs unités identiques (écolodge de 6 bungalows) ? →
  A: Une unité louable par bungalow ou chambre, chacune avec son calendrier et son lien de
  calendrier externe ; le voyageur réserve « un bungalow » et le site attribue une unité libre.
- Q: Que montre une carte « Partenaire mis en avant » et vers où mène-t-elle ? → A: Une offre du
  catalogue appartenant au restaurant (sa table du Saloum, par exemple) : photo, titre, prix
  « à partir de » et mention, avec un lien vers la fiche de cette offre, réservable comme les
  autres. Aucune page publique propre au restaurant n'est créée.
- Q: Comment la disponibilité des transferts AIBD / Dakar est-elle gérée ? → A: Par un calendrier
  de véhicules : le transporteur tient un nombre de véhicules disponibles par jour (et peut fermer
  un jour) ; chaque transfert réservé consomme un véhicule.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Le prestataire ferme et ouvre ses dates depuis son téléphone (Priority: P1)

Moussa loue deux pirogues à Ndangane. Un mardi soir, il apprend qu'une pirogue sera en
réparation samedi. Il ouvre le lien reçu sur WhatsApp, se connecte avec son numéro et un code
reçu par message, voit le calendrier de la semaine en grandes cases colorées, touche samedi et
passe la sortie du matin de « 2 pirogues » à « 1 pirogue ». Le site public ne propose plus
qu'une pirogue samedi matin. Awa, propriétaire d'une villa, bloque de la même façon le week-end
où sa famille vient.

**Why this priority**: sans disponibilités fiables tenues par les prestataires eux-mêmes,
aucune autre partie de la fonctionnalité n'a de valeur ; c'est aussi ce qui supprime la
confirmation manuelle de l'équipe.

**Independent Test**: un prestataire de démonstration se connecte sur un téléphone de 360 px,
ferme une date et réduit la capacité d'un créneau ; le formulaire de réservation public ne
propose plus la date fermée et limite le créneau à la capacité restante.

**Acceptance Scenarios**:

1. **Given** un prestataire inscrit par l'équipe, **When** il saisit son numéro WhatsApp,
   **Then** il reçoit un code à usage unique et accède à son espace sans mot de passe.
2. **Given** le calendrier d'un hébergement, **When** le propriétaire touche une ou plusieurs
   nuits puis « Fermer », **Then** ces nuits deviennent indisponibles sur le site public en
   moins d'une minute.
3. **Given** le calendrier d'une expérience à créneaux, **When** le prestataire change la
   capacité d'un créneau (ex. 2 pirogues → 1), **Then** le site public n'accepte pas plus de
   réservations que la capacité restante.
4. **Given** une date déjà réservée, **When** le prestataire tente de la fermer, **Then**
   l'espace l'en empêche, affiche la réservation concernée et propose d'appeler l'équipe.
5. **Given** un prestataire qui a fermé une date par erreur, **When** il touche « Annuler »
   dans les 10 secondes, **Then** la date est rouverte comme avant.

---

### User Story 2 — Le prestataire est prévenu sur WhatsApp et voit ses réservations (Priority: P2)

Une famille réserve et paie la sortie en pirogue de samedi. Moussa reçoit aussitôt un message
WhatsApp : date, heure, nombre de personnes, prénom du client, lien vers le détail. Dans son
espace, l'onglet « Réservations » liste ses prochaines sorties, la plus proche en premier, avec
un bouton pour appeler ou écrire au client et un bouton « J'ai un problème ».

**Why this priority**: c'est le geste quotidien du prestataire et la condition pour que les
voyageurs soient bien accueillis ; il réutilise la notification prévue par 002.

**Independent Test**: une réservation payée en passerelle de test déclenche un message
WhatsApp vers le prestataire concerné et apparaît dans la liste de ses réservations ; un autre
prestataire ne la voit pas.

**Acceptance Scenarios**:

1. **Given** une réservation payée contenant une prestation d'un prestataire, **When** le
   paiement est confirmé, **Then** la prestation est confirmée automatiquement (disponibilité
   tenue par le prestataire), ce prestataire reçoit un message WhatsApp dans les 2 minutes et la
   réservation apparaît dans son espace.
2. **Given** un prestataire, **When** il ouvre « Réservations », **Then** il voit uniquement ses
   propres prestations, à venir d'abord, avec date, heure, nombre de voyageurs (adultes, enfants,
   bébés), prénom et contact du voyageur, et demandes particulières.
3. **Given** une réservation annulée ou modifiée par l'équipe, **When** le changement est
   enregistré, **Then** le prestataire en est prévenu par WhatsApp et la liste est à jour.
4. **Given** un prestataire qui touche « J'ai un problème », **When** il choisit un motif simple
   (panne, météo, malade, autre), **Then** l'équipe est alertée et la réservation est signalée
   pour traitement selon la règle d'indisponibilité de 002 (alternatives ou remboursement).
5. **Given** un message WhatsApp non délivré, **When** les tentatives sont épuisées, **Then**
   l'équipe est alertée pour prévenir le prestataire par téléphone.

---

### User Story 3 — Les villas restent synchronisées avec Airbnb et Booking (Priority: P3)

La villa d'Awa est aussi louée sur Airbnb et Booking. Avec l'aide de l'équipe, elle colle dans
son espace les liens de calendrier fournis par ces deux plateformes, et copie le lien de
calendrier Saloum Évasion dans chacune d'elles. Une réservation Airbnb ferme automatiquement les
nuits sur Saloum Évasion ; une réservation Saloum Évasion ferme les nuits sur Airbnb et Booking.

**Why this priority**: la double réservation est le risque le plus coûteux pour un hébergeur
(client à la rue, pénalité de plateforme) et la première raison qu'ils donnent pour refuser de
vendre sur un nouveau site.

**Independent Test**: un calendrier externe de démonstration contenant une réservation est
relié à un hébergement ; après synchronisation, les nuits correspondantes sont fermées sur le
site public ; le lien de calendrier exporté contient les nuits réservées sur Saloum Évasion.

**Acceptance Scenarios**:

1. **Given** un hébergement relié à un calendrier externe, **When** une réservation y est
   ajoutée, **Then** les nuits correspondantes sont fermées sur Saloum Évasion au plus tard
   30 minutes après sa publication par la plateforme externe.
2. **Given** une réservation payée sur Saloum Évasion, **When** la plateforme externe relit le
   calendrier exporté, **Then** les nuits réservées et les nuits fermées à la main y figurent,
   sans aucune donnée personnelle du voyageur.
3. **Given** un calendrier externe injoignable ou invalide depuis plus de 2 heures, **When** la
   synchronisation échoue, **Then** le propriétaire voit un avertissement simple, l'équipe est
   alertée, et les dernières nuits importées restent fermées.
4. **Given** une nuit importée d'un calendrier externe, **When** le propriétaire consulte son
   calendrier, **Then** il voit qu'elle vient d'Airbnb ou de Booking et ne peut pas la rouvrir
   depuis Saloum Évasion.
5. **Given** un conflit (même nuit réservée sur Saloum Évasion et importée d'une autre
   plateforme), **When** il est détecté, **Then** l'équipe et le propriétaire sont alertés
   immédiatement et la réservation Saloum Évasion suit la règle d'indisponibilité de 002.

---

### User Story 4 — Le prestataire tient ses prix et voit ce qui lui a été versé (Priority: P4)

Avant la haute saison, Awa veut augmenter le prix de sa villa en décembre. Dans « Mes prix »,
elle voit ses deux tarifs (basse et haute saison) en grands chiffres, touche « Modifier », saisit
le nouveau montant en FCFA et confirme. Dans « Mes paiements », elle voit ce que Saloum Évasion
lui doit pour le mois, ce qui lui a déjà été versé (date, moyen, référence), et la commission
retenue pour chaque réservation.

**Why this priority**: utile et attendu, mais les prix et les reversements peuvent continuer à
passer par l'équipe pendant les premiers mois sans bloquer la vente.

**Independent Test**: un prestataire de démonstration modifie un tarif saisonnier ; le nouveau
prix n'apparaît sur le site qu'après validation par l'équipe et ne change jamais le prix d'une
réservation déjà payée ; son relevé affiche les montants de 002 pour une période donnée.

**Acceptance Scenarios**:

1. **Given** un prestataire dans « Mes prix », **When** il modifie un tarif saisonnier,
   **Then** la demande est envoyée à l'équipe (prévenue par WhatsApp), l'espace affiche « En
   attente de validation » à côté du nouveau montant, et l'ancien prix reste affiché et vendu.
2. **Given** une demande de changement de prix, **When** l'équipe la valide, **Then** le nouveau
   prix s'applique aux nouvelles réservations, le prestataire en est prévenu par WhatsApp, et
   aucune réservation déjà payée n'est modifiée ; **When** l'équipe la refuse, **Then** le
   prestataire reçoit le motif en français simple.
3. **Given** un tarif saisi en dehors des bornes raisonnables (ex. baisse ou hausse de plus de
   50 %, montant non entier), **When** le prestataire confirme, **Then** l'espace lui demande de
   vérifier le montant, affiché en toutes lettres.
4. **Given** un prestataire dans « Mes paiements », **When** il choisit un mois, **Then** il voit
   pour chaque réservation le montant encaissé, la commission, sa part, et le total déjà versé
   et restant dû, identiques au relevé de l'équipe (002, FR-036).
5. **Given** un reversement enregistré par l'équipe, **When** il est saisi, **Then** le
   prestataire reçoit un message WhatsApp avec le montant et la référence.

---

### User Story 5 — Un restaurant paie pour être mis en avant, signalé comme tel (Priority: P5)

Le restaurant « Chez Fatou » à Mar Lodj souscrit auprès de l'équipe une mise en avant pour la
haute saison, au forfait, et la règle par Wave. Sur
les pages de la destination et des tables du Saloum, la carte de sa « table du Saloum »
apparaît dans un emplacement réservé, marquée « Partenaire mis en avant », et mène à la fiche
de cette table, où le voyageur réserve comme pour toute autre offre. Fatou voit dans son espace combien de personnes
ont vu sa carte et l'ont ouverte.

**Why this priority**: source de revenus complémentaire, mais indépendante des disponibilités
et de la réservation ; elle peut arriver en dernier.

**Independent Test**: l'équipe active une mise en avant datée pour un restaurant de
démonstration ; la carte apparaît dans l'emplacement réservé avec la mention, en FR et en EN,
pendant la période seulement ; le classement des autres contenus n'est pas modifié.

**Acceptance Scenarios**:

1. **Given** une mise en avant active, **When** un visiteur ouvre une page où elle est prévue,
   **Then** la carte du restaurant porte la mention « Partenaire mis en avant » (« Featured
   partner » en anglais), lisible sans survol et annoncée aux lecteurs d'écran.
2. **Given** une mise en avant dont la période est terminée ou non payée, **When** un visiteur
   ouvre la page, **Then** l'emplacement réservé disparaît ou affiche un autre partenaire actif.
3. **Given** des pages listant des restaurants, **When** une mise en avant est active, **Then**
   l'ordre de la liste éditoriale n'est pas modifié : la mise en avant occupe un emplacement
   distinct, au plus un par page.
4. **Given** un restaurant mis en avant, **When** il consulte son espace, **Then** il voit le
   nombre d'affichages et d'ouvertures de sa carte, par semaine, sans aucune donnée personnelle
   des visiteurs.
5. **Given** une mise en avant convenue avec un restaurant, **When** l'équipe l'enregistre avec
   son forfait et sa période, **Then** elle reste « programmée » et invisible tant que l'équipe ne
   l'a pas marquée « payée » ; le restaurant voit dans son espace la période, le montant et le
   statut de paiement.

---

### Edge Cases

- **Connexion faible ou coupée** : une modification de calendrier faite hors réseau n'est jamais
  annoncée comme enregistrée ; l'espace affiche clairement « Pas de réseau, réessayez » et ne
  perd pas la saisie.
- **Deux réservations simultanées** sur la dernière place d'un créneau : une seule aboutit ; la
  seconde est refusée avant paiement avec une proposition d'autre créneau.
- **Fermeture par le prestataire pendant qu'un voyageur paie** : le paiement en cours est honoré
  et la réservation prime ; le prestataire est prévenu qu'une réservation vient d'arriver.
- **Retard de synchronisation iCal** (fenêtre de 30 minutes) : une double réservation reste
  possible ; elle est détectée, signalée immédiatement et traitée selon la règle
  d'indisponibilité de 002 (au plus deux alternatives sans supplément, sinon remboursement).
- **Prestataire qui change de numéro WhatsApp** : seule l'équipe peut modifier le numéro de
  connexion, après vérification ; l'ancien numéro perd l'accès.
- **Téléphone partagé ou perdu** : l'équipe peut fermer à distance toutes les sessions d'un
  prestataire ; la session expire après 30 jours d'inactivité.
- **Plusieurs personnes pour un même prestataire** (propriétaire et gérant) : chacune a son
  propre accès ; les actions sont tracées par personne.
- **Prestataire avec plusieurs offres ou unités** (deux villas, six bungalows, pirogue et quads) :
  il choisit l'offre puis l'unité en un geste ; le calendrier affiché est toujours celui de
  l'offre et de l'unité nommées en haut de l'écran.
- **Séjour de plusieurs nuits sans unité libre sur toute la période** alors que chaque nuit a une
  unité libre (changement de bungalow nécessaire) : non proposé au voyageur, qui est orienté vers
  d'autres dates ou vers la demande sur mesure (001).
- **Prestataire inactif** (désactivé par l'équipe) : ses offres ne sont plus réservables ; les
  réservations à venir restent visibles de l'équipe pour être reprises.
- **Restaurant mis en avant devenu indisponible ou fermé** : la mise en avant est suspendue
  automatiquement et la période restante est reportée ou remboursée selon l'accord.
- **Séjour dont un composant ferme après la réservation** (pirogue en panne le jour 2) : la
  réservation est maintenue et la prestation concernée suit la règle d'indisponibilité de 002 ;
  le séjour cesse d'être proposé aux autres dates touchées.
- **Créneaux passés** : jamais proposés au public ; la journée en cours n'est plus réservable
  après l'heure limite définie par l'offre (par défaut la veille à 20 h, délai minimum de 002).
- **Fuseau horaire** : toutes les dates et heures de l'espace sont celles de Dakar.

## Requirements *(mandatory)*

### Functional Requirements

**Accès et sécurité**

- **FR-001** : L'équipe DOIT pouvoir inscrire un prestataire et une ou plusieurs personnes
  rattachées (nom, numéro WhatsApp, rôle « propriétaire » ou « gérant ») ; aucun prestataire ne
  peut créer son compte seul.
- **FR-002** : Le prestataire DOIT se connecter avec son numéro WhatsApp et un code à usage
  unique de 6 chiffres reçu par message, valable 10 minutes, sans mot de passe ; au plus
  5 essais, puis blocage de 15 minutes.
- **FR-003** : Une session DOIT rester ouverte sur le même téléphone tant qu'elle sert : elle
  expire après 30 jours sans utilisation (durée glissante), à la déconnexion, ou à sa fermeture à
  distance par l'équipe.
- **FR-003b** : Si le code WhatsApp n'arrive pas, le prestataire DOIT pouvoir le recevoir par SMS
  (même code, même validité, mêmes limites d'essais) ; en dernier recours, l'équipe peut lui
  transmettre un lien de connexion à usage unique valable 15 minutes.
- **FR-004** : Un prestataire NE DOIT voir que ses propres offres, disponibilités, réservations
  et paiements ; le rôle « gérant » ne voit ni les paiements ni les coordonnées de reversement.
- **FR-005** : Chaque modification (disponibilité, capacité, prix) DOIT être tracée : auteur,
  date, valeur avant, valeur après ; l'équipe peut consulter cet historique.

**Disponibilités**

- **FR-006** : Pour un hébergement, le propriétaire DOIT pouvoir ouvrir ou fermer des nuits,
  une à une ou par période, sur les 12 mois à venir, pour chaque unité louable.
- **FR-006b** : Un hébergement DOIT comporter une ou plusieurs unités louables (villa entière :
  une unité ; écolodge : une unité par bungalow ou chambre), chacune avec son propre calendrier.
  Le voyageur réserve un type d'hébergement pour des dates ; le site DOIT lui attribuer une unité
  libre pour toutes les nuits demandées, et proposer l'hébergement tant qu'au moins une unité
  l'est. Le propriétaire DOIT pouvoir fermer une unité, ou toutes les unités d'un coup.
- **FR-007** : Pour une expérience ou une table, le prestataire DOIT pouvoir, pour chaque jour et
  chaque créneau proposé par l'offre, fermer le créneau ou fixer sa capacité (places, embarcations,
  véhicules ou couverts selon l'offre).
- **FR-007a** : Pour un transfert, le transporteur DOIT pouvoir fixer, pour chaque jour, le
  nombre de véhicules disponibles, ou fermer le jour ; chaque transfert réservé (aller ou retour)
  DOIT consommer un véhicule le jour de sa prise en charge, quel que soit le nombre de
  passagers ; au-delà de la plus grande tranche de passagers, autant de véhicules que nécessaire.
- **FR-007b** : Un séjour signature NE DOIT être proposé à une date d'arrivée que si son
  hébergement est libre pour toutes les nuits du séjour et si chaque expérience incluse dispose
  de la capacité nécessaire au créneau prévu par le programme ; la réservation d'un séjour DOIT
  consommer la capacité de chaque composant, et la fermeture d'un composant DOIT rendre le séjour
  indisponible aux dates concernées. Aucun calendrier propre au séjour n'est tenu.
- **FR-008** : Le prestataire DOIT pouvoir définir une semaine type (créneaux et capacités par
  jour de la semaine) appliquée par défaut aux 12 mois à venir, puis la corriger jour par jour.
- **FR-009** : Une date ou un créneau réservé NE DOIT PAS pouvoir être fermé ni ramené sous le
  nombre de places déjà vendues par le prestataire ; seule l'équipe peut traiter ce cas.
- **FR-010** : Toute fermeture ou réduction de capacité DOIT pouvoir être annulée en un geste
  pendant 10 secondes.
- **FR-011** : Les formulaires de réservation du site public (002) NE DOIVENT proposer que les
  dates et créneaux disponibles, avec la capacité restante, mis à jour moins d'une minute après
  une modification ; une demande dépassant la disponibilité DOIT être refusée avant paiement.
- **FR-012** : Une place DOIT être retenue pendant le paiement (durée de validité de la
  tentative de paiement de 002) et libérée si le paiement échoue ou expire.
- **FR-013** : Lorsque les disponibilités d'une offre sont tenues dans l'espace, chaque
  prestation payée DOIT être confirmée automatiquement dès la confirmation du paiement, sans
  attente ni intervention de l'équipe, en remplacement de la confirmation manuelle de 002
  (FR-005) ; le voyageur voit « Confirmé » sur sa page et dans ses messages. Le prestataire garde
  le signalement « J'ai un problème » (FR-022).
- **FR-014** : Les offres dont le prestataire n'utilise pas encore l'espace DOIVENT continuer à
  suivre la règle de 002 (paiement puis confirmation par l'équipe sous 2 heures).

**Synchronisation des hébergements**

- **FR-015** : Pour chaque unité louable, l'espace DOIT permettre d'enregistrer un ou plusieurs
  liens de calendrier externes (Airbnb, Booking ou autre plateforme au format calendrier standard)
  et DOIT fournir un lien de calendrier Saloum Évasion à copier dans ces plateformes.
- **FR-016** : Les calendriers externes DOIVENT être relus au moins toutes les 30 minutes ; les
  nuits qu'ils contiennent sont fermées sur Saloum Évasion et marquées avec leur origine.
- **FR-017** : Le calendrier exporté DOIT contenir les nuits réservées et fermées sur Saloum
  Évasion, sans nom, numéro ni aucune donnée personnelle du voyageur.
- **FR-018** : Un échec de synchronisation de plus de 2 heures DOIT être signalé au propriétaire
  dans son espace et à l'équipe ; les dernières nuits importées restent fermées.
- **FR-019** : Une double réservation détectée DOIT alerter immédiatement l'équipe et le
  propriétaire, et la réservation Saloum Évasion DOIT être traitée selon la règle
  d'indisponibilité de 002.

**Réservations et notifications**

- **FR-020** : Chaque réservation payée, annulée ou modifiée DOIT être notifiée par WhatsApp au
  prestataire concerné (et à chaque personne rattachée qui l'a demandé), dans les 2 minutes,
  avec date, heure, voyageurs, prénom et contact du voyageur et lien vers le détail, selon la
  politique de relance de 002 (4 tentatives puis alerte de l'équipe).
- **FR-021** : L'onglet « Réservations » DOIT lister les réservations à venir du prestataire, la
  plus proche d'abord, et permettre d'appeler ou d'écrire au voyageur en un geste.
- **FR-022** : Le bouton « J'ai un problème » DOIT proposer des motifs simples, alerter l'équipe
  et déclencher la règle d'indisponibilité de 002 pour la prestation concernée.
- **FR-023** : Le prestataire DOIT pouvoir choisir de recevoir, la veille au soir, un message
  récapitulant ses prestations du lendemain.

**Prix et paiements versés**

- **FR-024** : Le prestataire DOIT voir ses tarifs saisonniers en FCFA entiers (basse et haute
  saison ; par nuit, par personne ou par véhicule selon l'offre) et pouvoir demander leur
  modification ; un changement de plus de 50 % DOIT être confirmé une seconde fois avec le
  montant écrit en lettres.
- **FR-025** : Un nouveau prix NE DOIT s'appliquer sur le site qu'après validation par l'équipe,
  prévenue par WhatsApp de chaque demande ; jusque-là l'ancien prix reste affiché et vendu. La
  validation ou le refus (avec motif) DOIT être notifié au prestataire. Aucun changement de prix
  NE DOIT modifier une réservation déjà payée (prix figé de 002).
- **FR-026** : L'onglet « Mes paiements » DOIT afficher, par mois, les réservations, montants
  encaissés, commissions, parts du prestataire, reversements effectués (date, moyen, référence)
  et reste dû, identiques au relevé de l'équipe (002, FR-036).
- **FR-027** : Chaque reversement enregistré par l'équipe DOIT être notifié au prestataire par
  WhatsApp.

**Mise en avant des restaurants**

- **FR-028** : L'équipe DOIT pouvoir créer une mise en avant pour un restaurant, en choisissant
  l'offre du catalogue qui sera montrée (une table ou une expérience de ce restaurant, publiée) :
  période,
  emplacements (pages de destination, page des tables du Saloum, fiches d'expériences proches),
  montant du forfait en FCFA, statut de paiement (en attente, payé) et moyen de paiement reçu
  hors du site (Wave, Orange Money, espèces, virement).
- **FR-028b** : La carte d'une mise en avant DOIT reprendre la photo principale, le titre et le
  prix « à partir de » de l'offre choisie, et mener à sa fiche ; aucune page publique propre au
  restaurant n'est créée. Si l'offre est dépubliée, la mise en avant DOIT être suspendue.
- **FR-029** : Toute mise en avant affichée DOIT porter la mention « Partenaire mis en avant »
  (« Featured partner » en anglais), visible sans interaction, contrastée selon WCAG 2.2 AA et
  restituée aux technologies d'assistance ; les liens sortants qu'elle contient DOIVENT être
  déclarés comme sponsorisés auprès des moteurs de recherche.
- **FR-030** : Une mise en avant NE DOIT modifier ni l'ordre des listes éditoriales, ni les prix,
  ni les avis ; elle occupe un emplacement distinct, au plus un par page, et n'apparaît jamais
  dans les données structurées comme une recommandation ou une note.
- **FR-031** : Une mise en avant DOIT n'être affichée que pendant sa période et une fois payée ;
  elle est suspendue automatiquement si le restaurant est désactivé.
- **FR-032** : Le restaurant mis en avant DOIT voir dans son espace le nombre d'affichages et
  d'ouvertures de sa carte par semaine, mesurés sans cookie ni donnée personnelle.
- **FR-033** : La mise en avant DOIT être vendue au forfait par l'équipe et payée hors du site ;
  aucun paiement en ligne de mise en avant n'est proposé dans cette version. Le restaurant DOIT
  voir dans son espace la période, le montant et le statut de paiement de ses mises en avant.

**Ergonomie pour tous**

- **FR-034** : L'espace DOIT être conçu d'abord pour un téléphone de 360 px utilisé au pouce :
  cibles tactiles d'au moins 48 × 48 px, une action principale par écran, icône toujours
  accompagnée d'un mot.
- **FR-035** : Les textes DOIVENT être rédigés en français simple (phrases courtes, vocabulaire
  courant, aucun jargon technique ni sigle non expliqué) ; les montants sont affichés en grands
  chiffres avec « FCFA ».
- **FR-036** : Les états du calendrier DOIVENT être distingués par la couleur **et** par un mot
  ou un symbole (« Libre », « Fermé », « Réservé », « Airbnb », « Booking »), jamais par la seule
  couleur.
- **FR-037** : Toute action irréversible ou qui touche un voyageur DOIT demander une
  confirmation explicite rédigée en toutes lettres.
- **FR-038** : L'espace DOIT rester utilisable en 3G et afficher un état clair en cas d'absence
  de réseau, sans jamais annoncer comme enregistrée une modification qui ne l'est pas.
- **FR-039** : Chaque écran DOIT proposer un accès en un geste à l'aide de l'équipe (WhatsApp ou
  appel).
- **FR-040** : L'espace DOIT respecter WCAG 2.2 AA, y compris agrandissement du texte à 200 %
  sans perte de contenu ni défilement horizontal.

**Confidentialité et référencement**

- **FR-041** : Toutes les pages de l'espace prestataires DOIVENT être exclues de l'indexation
  (balise et en-tête), absentes du plan du site et jamais mises en cache partagé.
- **FR-042** : Les données des voyageurs visibles du prestataire DOIVENT se limiter à ce qui est
  nécessaire à la prestation (prénom, nom, contact, nombre de voyageurs, demandes particulières)
  et ne plus être visibles 30 jours après la date de la prestation.

### Key Entities

- **Prestataire** (existant en 002) : enrichi d'un état d'activation de l'espace et de ses
  personnes rattachées.
- **Personne rattachée** : nom, numéro WhatsApp de connexion, rôle (propriétaire, gérant),
  préférences de notification, dernière connexion, sessions ouvertes.
- **Unité louable** : villa, bungalow ou chambre d'un hébergement ; nom court (« Bungalow 3 »),
  capacité en personnes, active ou non ; porte son calendrier et ses calendriers externes.
- **Disponibilité** : pour une unité louable, une nuit ; pour une expérience ou une table, un
  créneau daté ; pour un transfert, un jour (nombre de véhicules) ; état (libre, fermé, réservé), capacité totale, places vendues, origine (espace,
  Airbnb, Booking, autre calendrier, équipe).
- **Composant de séjour** : pour un séjour signature, hébergement ou expérience incluse, avec le
  jour du programme (et le créneau) où il est consommé ; source de la disponibilité du séjour.
- **Semaine type** : créneaux et capacités par jour de la semaine pour une offre, appliqués par
  défaut aux dates futures.
- **Calendrier externe** : unité louable, plateforme, lien, dernière lecture réussie, état
  (à jour, en erreur), nuits importées.
- **Rétention de place** : réservation de capacité temporaire pendant un paiement, avec
  expiration.
- **Journal des modifications** : auteur, offre, élément modifié, valeur avant, valeur après,
  date.
- **Code de connexion** : numéro, empreinte du code, expiration, nombre d'essais.
- **Demande de changement de prix** : offre, tarif concerné (saison), ancien et nouveau montant,
  auteur, date, statut (en attente, validée, refusée), motif de refus, validée par.
- **Mise en avant** : restaurant, offre montrée (table ou expérience du restaurant), période, emplacements, montant du forfait, statut de paiement
  et moyen reçu hors du site, statut
  (programmée, active, suspendue, terminée), compteurs d'affichages et d'ouvertures par semaine.
- **Réservation, Reversement, Ligne de commission** (002) : consultés par le prestataire, non
  modifiés.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** : 8 prestataires testeurs sur 10, choisis parmi les publics visés (dont au moins
  trois peu à l'aise avec les sites web), ferment une date et changent la capacité d'un créneau
  sur leur propre téléphone en moins de 2 minutes, sans aide, à la première utilisation.
- **SC-002** : 100 % des dates et créneaux fermés ou complets cessent d'être proposés au public
  en moins d'une minute.
- **SC-003** : aucune double réservation entre deux voyageurs Saloum Évasion sur l'ensemble des
  scénarios de test (achats simultanés, coupure réseau, paiement tardif).
- **SC-004** : les nuits réservées sur Airbnb ou Booking sont fermées sur Saloum Évasion en
  moins de 30 minutes après leur publication par la plateforme dans 99 % des cas, et les doubles
  réservations d'hébergement baissent d'au moins 90 % par rapport aux 3 mois précédant la mise en
  ligne.
- **SC-005** : 95 % des prestataires reçoivent le message WhatsApp de nouvelle réservation en
  moins de 2 minutes.
- **SC-006** : 70 % des prestataires vendant en ligne utilisent l'espace au moins une fois par
  semaine 3 mois après la mise en ligne.
- **SC-007** : la part des réservations nécessitant une confirmation manuelle de disponibilité
  par l'équipe baisse d'au moins 80 % dans les 3 mois suivant la mise en ligne.
- **SC-008** : 100 % des mises en avant affichées portent la mention « Partenaire mis en avant »
  (ou « Featured partner »), sur toutes les tailles d'écran testées, et aucune ne modifie l'ordre
  des listes éditoriales.
- **SC-009** : 100 % des pages de l'espace prestataires sont absentes de l'index et du plan du
  site, et respectent les budgets de performance et d'accessibilité de la constitution (hors
  score SEO).
- **SC-010** : les montants affichés dans « Mes paiements » correspondent à 100 % au relevé de
  l'équipe sur un échantillon de contrôle mensuel.

## Assumptions

- **Dépendance à 002** : panier, paiement, réservations, prestataires, commissions, reversements,
  notifications WhatsApp automatiques et règle d'indisponibilité (au plus
  deux alternatives sans supplément, sinon remboursement) sont en place.
- **Connexion par WhatsApp** : le code de connexion est envoyé par un modèle de message
  « authentification » approuvé par WhatsApp ; à défaut, il est envoyé par SMS (décision du
  propriétaire du 2026-11-16), et en dernier recours l'équipe transmet un lien de connexion à
  usage unique. Aucun mot de passe n'est demandé aux prestataires.
- **Inscription accompagnée** : l'équipe inscrit chaque prestataire, relie ses offres et l'aide à
  configurer ses calendriers externes lors d'une première visite ou d'un appel.
- **Langue** : l'espace prestataires est en français uniquement dans cette version ; l'anglais et
  le wolof sont hors périmètre. Les mises en avant restent bilingues sur le site public.
- **Formats de calendrier** : Airbnb et Booking publient et lisent les calendriers au format
  standard (iCal) ; leur propre délai de relecture (souvent 1 à 3 heures) échappe à Saloum
  Évasion, d'où le traitement des conflits plutôt que leur impossibilité.
- **Synchronisation limitée aux nuits** : seules les disponibilités (et non les prix ni les
  données des voyageurs) sont échangées avec les plateformes externes.
- **Capacité par créneau** : une expérience ou une table propose des créneaux définis dans le
  catalogue (002) ; la capacité est exprimée dans l'unité de l'offre (places, embarcations,
  véhicules, couverts).
- **Reversements** : toujours effectués par l'équipe hors du site (002) ; l'espace les affiche
  sans permettre au prestataire de les déclencher.
- **Mises en avant** : réservées aux restaurants dans cette version ; mesure d'audience sans
  cookie déjà en place (001) ; pas d'enchères ni de ciblage.
- **Hors périmètre** : application mobile installable, messagerie interne entre voyageur et
  prestataire (WhatsApp suffit), création d'offres par le prestataire (l'équipe garde la main sur
  le catalogue et les contenus), gestion des avis, facturation fiscale des mises en avant.
- **Rétention** : codes de connexion supprimés à expiration ; journal des modifications conservé
  12 mois ; données des voyageurs masquées au prestataire 30 jours après la prestation.
