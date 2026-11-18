# Research: Espace prestataires et disponibilités

**Feature**: `003-espace-prestataires` | **Date**: 2026-11-16 | **Plan**: [plan.md](./plan.md)

Chaque décision suit le format : Décision, Justification, Alternatives écartées. Les décisions
du propriétaire (spec, section « Clarifications ») sont reprises sans être rediscutées.

## R1 — Connexion des prestataires sans mot de passe (FR-001 à FR-003)

- **Décision** : collection `partnerMembers` distincte des `users` de Payload (l'admin reste
  réservé à l'équipe) ; connexion par **code à 6 chiffres envoyé par WhatsApp** avec un modèle de
  catégorie « authentification » de l'API Cloud déjà retenue en 002 (D-T12). Code stocké haché
  (SHA-256 + sel), valable 10 min, 5 essais puis blocage 15 min (collection `rateLimits` de la
  001). Session : jeton aléatoire de 256 bits dans un cookie `se_partner` (HttpOnly, Secure,
  SameSite=Lax, `Path=/espace`, 30 jours glissants), seule son empreinte est stockée dans
  `partnerSessions` ; l'équipe peut révoquer toutes les sessions d'une personne depuis l'admin.
- **Repli par SMS** (décision du propriétaire du 2026-11-16, D-T21) : sur l'écran du code, le
  bouton « Recevoir le code par SMS » apparaît 60 s après l'envoi WhatsApp, ou immédiatement si
  l'API WhatsApp refuse le numéro ; même code (un nouveau code invalide le précédent), même
  validité de 10 min, mêmes limites d'essais ; au plus 2 SMS par 15 min et par numéro. Fournisseur
  SMS appelé en `fetch`, sans SDK (R15).
- **Dernier recours** : l'équipe génère depuis l'admin un **lien de connexion à usage unique**
  (valable 15 min) qu'elle transmet elle-même par téléphone.
- **Justification** : les prestataires utilisent WhatsApp tous les jours mais oublient les mots de
  passe ; le code par message est le parcours qu'ils connaissent (Wave, Orange Money). Séparer les
  comptes de l'admin évite toute élévation de droits vers `/admin`.
- **Alternatives écartées** : comptes Payload avec rôle `partner` (l'écran de connexion de
  l'admin et ses mots de passe ne conviennent pas au public visé, risque d'accès à `/admin`) ;
  lien magique par e-mail (beaucoup de prestataires n'ont pas d'e-mail consulté) ; lien de
  l'équipe comme seul repli (écarté par le propriétaire : dépendance à l'équipe hors des heures
  ouvrées).

## R2 — Modèle de stock et absence de double réservation (FR-006 à FR-012, SC-003)

- **Décision** : une table d'**inventaire** unique, `inventory`, une ligne par ressource et par
  date (et créneau) : `resourceType` (`unit` | `experienceSlot` | `transferDay`), `resourceId`,
  `date`, `slot` (vide pour les nuits et les jours de transfert), `capacity`, `closed`, `sold`,
  `origin`. Les lignes sont **matérialisées à la demande** (première modification ou première
  vente) à partir de la semaine type ; sans ligne, la disponibilité est celle de la semaine type.
  La réservation de capacité passe par une **mise à jour SQL conditionnelle** dans une
  transaction (`UPDATE … SET held = held + n WHERE capacity - sold - held >= n AND NOT closed`),
  qui échoue proprement s'il n'y a plus de place ; les **rétentions** (`inventoryHolds`) portent
  la quantité retenue pendant le paiement et expirent avec la tentative de paiement (30 min, 002).
- **Justification** : une seule forme de stock pour les nuits, les créneaux et les véhicules ;
  l'atomicité est garantie par Postgres sans verrou applicatif ni service supplémentaire ; la
  matérialisation paresseuse évite de créer 365 lignes par offre.
- **Alternatives écartées** : calcul de la disponibilité à partir des réservations à chaque lecture
  (pas d'atomicité au moment de vendre la dernière place) ; verrou consultatif applicatif (plus
  fragile) ; Redis (service en plus, principe VIII).

## R3 — Unités louables et attribution (FR-006b, clarification Q2)

- **Décision** : collection `rentalUnits` (hébergement, nom court, capacité, active, jeton
  d'export iCal). Une villa a une unité ; un écolodge une unité par bungalow. L'attribution choisit
  la **première unité libre sur toutes les nuits**, par ordre de capacité croissante compatible
  avec le nombre de voyageurs puis par ordre d'affichage (fonction pure testée). Un séjour qui
  exigerait de changer d'unité n'est pas proposé (edge case de la spec).
- **Justification** : c'est le modèle d'Airbnb et de Booking (une annonce par chambre), donc la
  synchronisation iCal reste exacte, unité par unité.
- **Alternatives écartées** : stock global « 6 bungalows » (iCal inexploitable : une réservation
  externe ne dit pas quel bungalow est pris).

## R4 — Disponibilité des séjours signature (FR-007b, clarification Q1)

- **Décision** : nouveau tableau `stays.components` (`kind` : hébergement ou expérience, offre,
  `dayOffset` à partir de l'arrivée, créneau) saisi par l'équipe. La disponibilité d'un séjour à
  une date d'arrivée est l'**intersection** des disponibilités de ses composants ; la réservation
  pose une rétention sur chaque composant dans la **même transaction** (tout ou rien).
- **Justification** : aucun calendrier de plus à tenir ; la fermeture d'une pirogue rend
  immédiatement le séjour indisponible aux dates concernées.
- **Alternatives écartées** : calendrier de départs tenu par l'équipe (risque de conflit avec
  l'hébergement) ; hébergement seul (les pirogues ne sont pas protégées).

## R5 — Transferts (FR-007a, clarification Q4)

- **Décision** : `inventory` avec `resourceType = transferDay` : un nombre de véhicules par jour et
  par trajet, défini dans la semaine type du transporteur. Un transfert consomme un véhicule (ou
  plusieurs au-delà de la plus grande tranche, fonction `transferPrice` de la 002 qui renvoie déjà
  `vehicles`).
- **Justification** : même modèle que les pirogues et les quads ; confirmation automatique
  possible.
- **Alternatives écartées** : créneaux horaires (plus précis mais plus à remplir, utile plus tard
  si les arrivées de nuit posent problème).

## R6 — Synchronisation iCal (FR-015 à FR-019)

- **Décision** :
  - **Import** : tâche planifiée `syncExternalCalendars` (file Payload, déclenchée par la route
    cron existante) qui relit chaque calendrier externe **toutes les 15 minutes** (marge sur
    l'objectif de 30 min). Téléchargement `https` uniquement, délai 10 s, taille ≤ 1 Mo, hôtes
    résolus vers des adresses publiques uniquement (protection SSRF), en-têtes `ETag` /
    `If-Modified-Since` respectés. Chaque évènement `VEVENT` (dates `DTSTART`/`DTEND` en jour
    entier ou date-heure) ferme les nuits correspondantes avec `origin = airbnb | booking | ical` ;
    une nuit qui disparaît du flux est rouverte (sauf si fermée par une autre origine).
  - **Export** : `GET /api/ical/{token}.ics` par unité ; jeton aléatoire de 128 bits révocable ;
    un évènement par période réservée ou fermée sur Saloum Évasion (`SUMMARY: Indisponible`),
    **sans aucune donnée personnelle** ; `UID` stable par période ; `Cache-Control: private,
    max-age=300`.
  - **Analyseur maison** (~150 lignes, tests sur des flux réels anonymisés d'Airbnb et de Booking) :
    dépliage des lignes, `VEVENT`, `DTSTART`/`DTEND` (`VALUE=DATE` ou date-heure UTC/locale),
    `UID`, `SUMMARY` ; tout le reste est ignoré.
  - **Conflits** : après chaque import, toute nuit importée qui recouvre une nuit vendue sur Saloum
    Évasion crée une alerte (équipe + propriétaire) et déclenche la règle d'indisponibilité de 002.
  - **Échec** : 2 h sans lecture réussie → statut `error`, avertissement dans l'espace, alerte
    équipe ; les nuits déjà importées restent fermées.
- **Justification** : Airbnb et Booking ne publient leurs réservations qu'en iCal pour les petits
  hôtes ; le format utile se réduit à quelques propriétés, un analyseur maison évite une
  dépendance (principe VIII) et se teste exhaustivement.
- **Alternatives écartées** : bibliothèques `node-ical` / `ical.js` (dépendance pour 5 % de leurs
  fonctions) ; API de channel manager (payante, réservée aux professionnels) ; synchronisation
  plus fréquente que 15 min (Airbnb limite et met en cache, gain nul).

## R7 — Disponibilités sur des pages publiques statiques (FR-011, constitution II et III)

- **Décision** : les fiches restent **statiques** (SSG + `revalidateTag`, 001). Le bloc
  « Ajouter au panier » (002) reçoit un îlot `AvailabilityPicker` (< 4 Ko gz) qui interroge
  `GET /api/availability?offer=…&from=…&to=…` (JSON compact, `Cache-Control: public,
  s-maxage=20, stale-while-revalidate=20`) au premier contact avec le formulaire, pas au
  chargement de la page. Sans JavaScript, le formulaire reste soumis au serveur, qui refuse une
  date indisponible et propose les 3 prochaines dates libres. **Le serveur revérifie toujours**
  au moment d'ajouter au panier puis au moment de payer (rétention atomique, R2).
- **Justification** : pages indexables et rapides inchangées ; disponibilité à jour à 30 s près
  sur le réseau de diffusion, conforme à FR-011 (< 1 min) ; aucune requête tant que le visiteur
  ne s'intéresse pas au formulaire (sobriété, principe VI).
- **Alternatives écartées** : pages dynamiques (perte du SSG, budgets LCP en danger) ;
  régénération des pages à chaque modification de calendrier (milliers de régénérations, délai
  incompatible avec la minute). Fraîcheur : 20 s de cache + 20 s de service périmé au plus = 40 s,
  sous l'exigence d'une minute (FR-011).

## R8 — Confirmation automatique (FR-013, FR-014, clarification de la spec)

- **Décision** : au succès du paiement (traitement de notification de 002), les rétentions
  deviennent des ventes (`sold += held`) dans la même transaction ; chaque ligne dont l'offre a un
  prestataire `spaceActive` passe `availabilityStatus = confirmed` ; les autres restent `pending`
  (règle 002). Le message au voyageur dit « Confirmé » ou « Disponibilité en cours de
  confirmation » selon le cas.
- **Justification** : la disponibilité ayant été retenue avant le paiement, la confirmation est
  certaine ; l'interrupteur `spaceActive` permet une bascule prestataire par prestataire.
- **Alternatives écartées** : acceptation par le prestataire (écartée par le propriétaire).

## R9 — Interface pour des prestataires peu à l'aise avec l'informatique (FR-034 à FR-040)

- **Décision** : `/espace`, application web dans le même site (pas d'application installable),
  **française uniquement**, composants serveur et **formulaires + Server Actions** (fonctionne
  sans JavaScript et en 3G) ; trois îlots seulement : `UndoToast` (annulation 10 s), `DayPicker`
  (sélection de plusieurs jours au pouce) et `OfflineBanner`. Règles de rédaction : phrases de
  12 mots au plus, verbes d'action (« Fermer », « Ouvrir »), aucun sigle, montants en grands
  chiffres avec « FCFA » ; icônes SVG locales toujours accompagnées d'un mot ; cibles ≥ 48 px ;
  états du calendrier par couleur **et** mot ; un bouton « Aide » (WhatsApp de l'équipe) sur
  chaque écran. Test avec 5 prestataires réels avant la mise en ligne (SC-001).
- **Justification** : simplicité maximale, réutilisation des patrons du tunnel 002, aucune
  installation ni mise à jour à gérer.
- **Alternatives écartées** : PWA installable (service worker, cache hors ligne : complexité
  disproportionnée pour la v1) ; application native (hors principe VIII).

## R10 — Notifications des prestataires (FR-020, FR-023, FR-027)

- **Décision** : file d'envoi `sendNotification` de la 002, nouveaux modèles WhatsApp en français :
  `partner_login_code` (authentification), `partner_booking_new`, `partner_booking_changed`,
  `partner_problem_ack`, `partner_daily_digest`, `partner_payout_sent`, `partner_price_decision`,
  `partner_ical_error`. Récapitulatif de la veille : tâche quotidienne à 19 h (Dakar), uniquement
  pour les personnes qui l'ont demandé et s'il y a des prestations le lendemain.
- **Justification** : un seul gabarit d'envoi avec relances et escalade déjà testé.

## R11 — Changements de prix validés par l'équipe (FR-024, FR-025, clarification)

- **Décision** : collection `priceChangeRequests` (offre, champ de prix, ancien, nouveau, auteur,
  statut). Validation dans l'admin par `operations` ou `admin` : la valeur est écrite dans l'offre
  (déclenche la régénération des pages par les crochets de la 001), le prestataire est notifié.
  Le prix figé des réservations payées (002) n'est jamais touché.
- **Justification** : protège d'une faute de frappe et garde la maîtrise des commissions.

## R12 — Mise en avant des restaurants (FR-028 à FR-033, clarifications Q3 et spec)

- **Décision** :
  - Collection `sponsoredPlacements` (restaurant, offre montrée, emplacements, période, forfait,
    statut de paiement, moyen reçu) gérée par l'équipe ; statut calculé : `scheduled`, `active`,
    `suspended`, `ended`.
  - **Rendu statique** : la carte est rendue au serveur avec la page (SSG) ; les pages concernées
    portent le tag `sponsored` ; une **tâche quotidienne à 00 h 05 (Dakar)** et chaque
    enregistrement d'une mise en avant invalident ce tag, de sorte que les débuts et fins de
    période sont appliqués dans la journée sans rendre les pages dynamiques.
  - Mention « Partenaire mis en avant » / « Featured partner » au-dessus du titre, texte (pas
    une image), contraste AA ; lien `rel="sponsored"` ; jamais dans le JSON-LD ; emplacement
    distinct de la liste éditoriale, un par page au plus.
  - **Mesure sans cookie** : îlot `SponsoredBeacon` (< 1 Ko) qui envoie `navigator.sendBeacon`
    vers `POST /api/sponsored/hit` au premier affichage réel (IntersectionObserver ≥ 50 %) et au
    clic ; compteurs hebdomadaires agrégés dans `sponsoredStats` ; aucune adresse IP ni
    identifiant stocké, robots exclus par en-tête `User-Agent`. Pas d'appel à l'API de Plausible.
- **Justification** : transparence exigée par la constitution (V) et par les lignes directrices des
  moteurs de recherche sur les liens payants ; pages publiques inchangées côté performance.
- **Alternatives écartées** : statistiques via l'API de Plausible (clé et dépendance au service,
  données par page et non par carte) ; rendu côté client de la carte (CLS et contenu invisible des
  robots).

## R13 — Données des voyageurs et traçabilité (FR-004, FR-005, FR-042)

- **Décision** : les pages de l'espace lisent les réservations par une requête serveur filtrée par
  prestataire (jamais par l'API publique) ; les coordonnées du voyageur sont masquées
  (« Voyageur ») 30 jours après la date de la prestation ; le rôle `manager` ne voit ni
  `Mes paiements` ni les coordonnées de reversement. Journal `availabilityChanges` (auteur, avant,
  après) conservé 12 mois ; tentatives de connexion journalisées sans le code.
- **Justification** : minimisation des données (loi 2008-12, RGPD) et responsabilité en cas de
  litige entre prestataire et équipe.

## R14 — Référencement et mise en cache de l'espace (FR-041)

- **Décision** : toutes les routes `/espace/*` répondent avec `X-Robots-Tag: noindex, nofollow`,
  `<meta name="robots" content="noindex, nofollow">`, `Cache-Control: private, no-store`, absentes
  du sitemap et **non bloquées** dans `robots.txt` (les robots doivent lire le `noindex`, R15 de la
  002) ; `/api/ical/*` est bloqué dans `robots.txt` (aucune page à indexer) et sert
  `X-Robots-Tag: noindex`.

## R15 — Fournisseur SMS pour le repli de connexion (D-T21) **[à valider commercialement]**

- **Décision** : un adaptateur `SmsSender` (`send(toE164, text)` → `ok` / `failed`) appelé en
  `fetch`, sans SDK ; sans clé configurée, le SMS est écrit dans la boîte d'envoi de test comme
  les messages WhatsApp. Texte unique, sans lien : « Saloum Évasion : votre code est 123456. Il
  expire dans 10 min. Ne le donnez à personne. » (≤ 160 caractères GSM, sans accent si le
  fournisseur facture l'Unicode).
- **Fournisseur** : à choisir sur devis réels ; grille à remplir (aucune valeur supposée) :

| Critère | Orange SMS API (Sénégal) | Fournisseur panafricain (ex. Africa's Talking) | Fournisseur international (ex. Twilio) |
|---|---|---|---|
| Prix par SMS vers Orange / Free / Expresso | | | |
| Taux et délai de remise mesurés (test de 50 envois) | | | |
| Nom d'expéditeur « SaloumEvas » (enregistrement, délai) | | | |
| API HTTP simple, mode test | | | |
| Hébergement des données, contrat de sous-traitance (loi 2008-12, RGPD) | | | |
| Facturation (prépayé, devise, moyen de paiement) | | | |

- **Justification** : le prestataire ne dépend plus de l'équipe pour se connecter le soir ou
  le week-end ; le SMS fonctionne sur tous les téléphones, même sans WhatsApp.
- **Alternatives écartées** : appel vocal automatique (coût, complexité) ; lien de l'équipe seul
  (écarté par le propriétaire).
