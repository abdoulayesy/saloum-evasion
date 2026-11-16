# Feature Specification: Panier unique et paiement en ligne

**Feature Branch**: `002-panier-paiement`
**Created**: 2026-11-14
**Status**: Draft
**Input**: User description: "002 — Panier unique et paiement. Le visiteur compose son séjour (un hébergement + des expériences + tables + transfert AIBD/Dakar) et paie en une seule fois. Moyens de paiement au même niveau : Wave, Orange Money, carte bancaire (Visa/Mastercard). Devise FCFA, conversion indicative en euros. Options : acompte ou paiement total selon le séjour. Le récapitulatif reste visible sur mobile (résumé collant dépliable). Confirmation à l'écran, par email et par WhatsApp, avec bon de réservation PDF. Conditions d'annulation affichées avant paiement, remboursement suivi. Parcours complet réalisable en moins de 3 minutes à 360 px, sans création de compte obligatoire. Les pages du tunnel sont en noindex et hors sitemap. Les paiements échoués ou abandonnés sont relançables. Commissions par prestataire calculées automatiquement (10 à 25 % selon le type d'offre)."

## Contexte

La version 001 transforme la visite en **demande de séjour** ; l'encaissement se fait ensuite
hors du site, par échanges WhatsApp. Chaque aller-retour fait perdre des clients, surtout le
cadre dakarois qui décide le mercredi pour le vendredi. La version 002 permet au visiteur de
**composer son séjour et de le payer en une seule fois**, sur son téléphone, avec le moyen qu'il
utilise au quotidien (Wave, Orange Money ou carte), comme le veut la contrainte « offre unifiée »
de la constitution : une seule réservation, un seul paiement.

Saloum Évasion encaisse la totalité du montant et reverse à chaque prestataire (hébergeur,
guide, restaurant, transporteur) sa part, diminuée d'une commission calculée automatiquement.

**Publics** (inchangés depuis 001) : expatrié ou cadre basé à Dakar (téléphone, décision
rapide) ; touriste européen (prépare via Google, paie souvent par carte) ; diaspora et
touristes sénégalais (Wave, Orange Money).

## Clarifications

### Session 2026-11-14

- Q: Le visiteur paie-t-il des prestations dont la disponibilité est connue du site, ou avant
  confirmation par l'équipe ? → A: **option B, confirmée par le propriétaire le 2026-11-15** — paiement immédiat,
  confirmation de disponibilité par l'équipe sous 2 h en journée ; alternative ou remboursement
  intégral si indisponible. D'abord retenue par défaut au lancement de `/speckit-plan`
  (plan, tension T11), puis confirmée.

### Session 2026-11-15 (analyse de cohérence)

- Q: Tarifs enfants et transferts ? → A: enfants de 4 à 11 ans à 50 %, moins de 4 ans gratuits,
  pourcentage et âges réglables par offre ; transferts facturés par véhicule selon la tranche de
  passagers (1–3, 4–7, 8 et plus) → FR-041.
- Q: Alternative à une prestation indisponible ? → A: l'équipe propose au plus 2 alternatives ;
  aucun supplément facturé au voyageur, un écart en sa faveur est remboursé ; 48 h pour choisir,
  sinon remboursement intégral de la prestation → FR-005.
- Q: La « demande en cours » de la 001 existe-t-elle ? → A: la phase 8 de la 001 (demande de
  séjour) est livrée avant la 002 ; FR-006 est maintenu.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Composer son week-end et le payer avec Wave en moins de 3 minutes (Priority: P1)

Awa, cadre à Dakar, découvre un écolodge à Ndangane un mercredi soir sur son téléphone. Elle
l'ajoute à son panier pour deux nuits et deux adultes, ajoute une sortie pirogue dans les
bolongs, un dîner « Table du Saloum » et le transfert aller-retour depuis Dakar. Le résumé de
son panier reste visible en bas de l'écran ; elle le déplie pour vérifier le total en FCFA. Elle
lit les conditions d'annulation, saisit son prénom, son numéro WhatsApp et son e-mail, choisit
Wave, valide dans son application Wave et revient sur une page de confirmation. Elle reçoit dans
la minute un e-mail et un message WhatsApp avec son bon de réservation PDF.

**Why this priority**: c'est la raison d'être de la fonctionnalité : passer de la demande à
la vente payée, sans échange manuel. Sans ce parcours, rien d'autre n'a de valeur.

**Independent Test**: sur un téléphone de 360 px en réseau 3G simulé, partir d'une fiche
hébergement, composer un panier de quatre éléments et payer en mode test avec chacun des trois
moyens de paiement ; vérifier la réservation payée, la confirmation à l'écran, l'e-mail, le
message WhatsApp et le PDF, le tout en moins de 3 minutes.

**Acceptance Scenarios**:

1. **Given** une fiche hébergement, une expérience, une table et un transfert disponibles,
   **When** le visiteur ajoute chacun au panier avec ses dates et son nombre de voyageurs,
   **Then** le résumé collant affiche le nombre d'éléments et le total en FCFA avec son
   équivalent indicatif en euros, sans quitter la page en cours.
2. **Given** un panier composé, **When** le visiteur ouvre l'étape de paiement, **Then** Wave,
   Orange Money et carte bancaire (Visa/Mastercard) sont présentés au même rang, avec la même
   taille et la même mise en avant, et les conditions d'annulation du panier sont affichées
   avant le bouton de paiement.
3. **Given** un paiement Wave accepté, **When** le visiteur revient sur le site, **Then** il
   voit la confirmation avec la référence de réservation, le récapitulatif, le montant payé,
   le reste à payer éventuel et un bouton de téléchargement du bon de réservation PDF.
4. **Given** un paiement accepté, **When** 2 minutes se sont écoulées, **Then** le voyageur a
   reçu un e-mail et un message WhatsApp contenant la référence, le récapitulatif et le bon de
   réservation PDF, dans la langue utilisée sur le site.
5. **Given** un visiteur qui paie dans l'application Wave ou Orange Money et ne revient jamais
   sur le site, **When** le paiement est confirmé par le moyen de paiement, **Then** la
   réservation passe au statut payé et les confirmations par e-mail et WhatsApp partent quand
   même.
6. **Given** un visiteur sans compte, **When** il termine le parcours, **Then** aucune étape ne
   lui a demandé de créer un compte ni un mot de passe.

---

### User Story 2 — Payer un acompte maintenant et le solde plus tard (Priority: P2)

Marc, à Lyon, réserve en février un séjour de cinq jours pour avril. Le site lui propose de
payer un acompte de 30 % maintenant ou la totalité. Il choisit l'acompte par carte. Quinze
jours avant son arrivée, il reçoit un rappel avec un lien pour régler le solde ; il paie depuis
ce lien, sans compte, et reçoit un bon de réservation mis à jour.

**Why this priority**: les touristes européens réservent des semaines à l'avance et hésitent à
tout payer d'un coup ; l'acompte lève ce frein. Le paiement total suffit pour un MVP, d'où P2.

**Independent Test**: composer un panier dont la date d'arrivée est à plus de 30 jours,
choisir l'acompte, payer en mode test, puis déclencher l'échéance du solde et payer depuis le
lien reçu ; vérifier les montants, les statuts et les deux bons de réservation.

**Acceptance Scenarios**:

1. **Given** un panier dont l'arrivée est à plus de 30 jours, **When** le visiteur arrive à
   l'étape de paiement, **Then** il peut choisir entre l'acompte (montant et date limite du
   solde affichés) et le paiement total.
2. **Given** un panier dont l'arrivée est dans 30 jours ou moins, **When** le visiteur arrive à
   l'étape de paiement, **Then** seul le paiement total est proposé, avec la raison affichée.
3. **Given** un acompte payé, **When** la date du rappel arrive, **Then** le voyageur reçoit
   par e-mail et WhatsApp un lien de paiement du solde, valable jusqu'à la date limite.
4. **Given** un solde non payé à la date limite, **When** l'échéance passe, **Then** l'équipe
   est alertée et le voyageur reçoit un dernier rappel ; la réservation n'est pas annulée
   automatiquement.

---

### User Story 3 — Reprendre un paiement échoué ou abandonné (Priority: P3)

Ibrahima, de la diaspora, compose son séjour mais son paiement Orange Money échoue (solde
insuffisant). Le site lui explique l'échec en clair, conserve son panier et lui propose de
réessayer ou de changer de moyen de paiement. Il ferme la page. Une heure plus tard, il reçoit
un message avec un lien qui restaure son panier à l'étape de paiement ; il paie par Wave.

**Why this priority**: chaque paiement mobile qui échoue (solde, plafond, réseau) est une vente
quasi faite. Les relances récupèrent une part de ces ventes ; elles supposent que P1 existe.

**Independent Test**: simuler en mode test un paiement refusé, puis un abandon après saisie des
coordonnées ; vérifier le message d'échec, la conservation du panier, la réception de la relance
et la reprise du paiement depuis le lien, sans double débit.

**Acceptance Scenarios**:

1. **Given** un paiement refusé, **When** le visiteur revient sur le site, **Then** il voit un
   message expliquant l'échec en langage simple, son panier intact, et peut réessayer ou
   choisir un autre moyen de paiement en un geste.
2. **Given** un visiteur qui a saisi ses coordonnées et accepté d'être recontacté, **When** il
   quitte le parcours sans payer, **Then** il reçoit une relance au bout de 1 heure puis une
   dernière au bout de 24 heures, chacune avec un lien qui restaure son panier.
3. **Given** un lien de relance, **When** le visiteur l'ouvre et qu'un prix ou une
   disponibilité a changé, **Then** le changement est signalé avant le paiement et le total est
   recalculé.
4. **Given** un premier paiement en attente de confirmation, **When** le visiteur tente de
   payer une seconde fois le même panier, **Then** le site l'en empêche et lui indique que le
   premier paiement est en cours de confirmation.

---

### User Story 4 — Annuler et suivre son remboursement (Priority: P4)

Fatou doit reporter son voyage. Depuis le lien de son e-mail de confirmation, elle accède à sa
réservation sans mot de passe, voit le montant remboursable selon les conditions acceptées, et
demande l'annulation. Elle reçoit une confirmation, puis suit l'avancement de son remboursement
(demandé, validé, versé) jusqu'au versement sur son compte Wave.

**Why this priority**: les conditions d'annulation affichées avant le paiement n'inspirent
confiance que si elles sont tenues ; la constitution l'exige. Les annulations sont plus rares
que les achats, d'où P4.

**Independent Test**: depuis une réservation payée en mode test, demander l'annulation à
différentes dates par rapport à l'arrivée ; vérifier le montant remboursable calculé, les
statuts successifs, les notifications et le remboursement sur le moyen de paiement d'origine.

**Acceptance Scenarios**:

1. **Given** une réservation payée, **When** le voyageur ouvre le lien de gestion reçu par
   e-mail ou WhatsApp, **Then** il voit sa réservation, son bon PDF, le montant remboursable à
   la date du jour et un bouton « Demander l'annulation ».
2. **Given** une demande d'annulation, **When** le voyageur la confirme, **Then** il reçoit un
   accusé avec le montant remboursable et le délai annoncé, et l'équipe est notifiée.
3. **Given** un remboursement validé par l'équipe, **When** il est versé, **Then** il est
   crédité sur le moyen de paiement d'origine et le voyageur est notifié à chaque changement
   de statut.
4. **Given** une prestation annulée par Saloum Évasion ou un prestataire, **When** l'équipe
   l'enregistre, **Then** le voyageur est remboursé intégralement pour cette prestation, quelles
   que soient les conditions.

---

### User Story 5 — L'équipe suit les ventes, les commissions et les reversements (Priority: P5)

Moussa, gérant de Saloum Évasion, consulte en fin de mois les réservations payées. Pour chaque
prestataire, il voit le montant encaissé, la commission retenue selon le type d'offre, le montant
à reverser et ce qui a déjà été reversé. Les remboursements sont déduits automatiquement.

**Why this priority**: indispensable pour payer les prestataires justement et vite, mais le
calcul peut être vérifié à la main les premières semaines ; il n'empêche pas de vendre.

**Independent Test**: créer en mode test des réservations mêlant les cinq types d'offre et
plusieurs prestataires, dont une partiellement remboursée ; vérifier commissions, montants à
reverser et totaux par prestataire et par période.

**Acceptance Scenarios**:

1. **Given** une réservation payée, **When** l'équipe l'ouvre, **Then** chaque ligne affiche le
   prestataire, le montant, le taux de commission appliqué, la commission et la part à reverser.
2. **Given** une période choisie, **When** l'équipe affiche le relevé d'un prestataire, **Then**
   elle voit les montants encaissés, les commissions, les remboursements déduits, le reste à
   reverser et les reversements déjà enregistrés.
3. **Given** un taux modifié pour un type d'offre, **When** de nouvelles réservations sont
   payées, **Then** elles utilisent le nouveau taux et les réservations passées gardent le taux
   en vigueur au moment du paiement.

---

### Edge Cases

- **Prix modifié pendant la composition** : le prix est figé au moment du paiement ; si un prix
  a changé depuis l'ajout au panier, le visiteur en est informé avant de payer.
- **Prestation indisponible après paiement** : l'équipe le signale au voyageur dans le délai de
  confirmation et propose au plus deux alternatives, sans supplément ; il choisit une alternative
  ou le remboursement intégral de la prestation sous 48 heures (remboursement par défaut) ; le
  reste de la réservation est maintenu.
- **Prestation devenue indisponible ou dépubliée** : elle est signalée dans le panier, exclue du
  total, et le visiteur peut continuer avec le reste ou contacter un hôte sur WhatsApp.
- **Dates incohérentes entre éléments** : une expérience ou une table placée en dehors des
  nuits réservées, ou un transfert retour avant l'aller → message explicite avant le paiement.
- **Hébergement en double** : un panier contient au plus un hébergement ; en ajouter un second
  propose de remplacer le premier.
- **Séjour signature dans le panier** : il inclut déjà son hébergement ; le panier n'accepte
  alors pas d'hébergement séparé, mais accepte des expériences, tables et transferts en plus.
- **Groupe hors capacité** : nombre de voyageurs supérieur à la capacité d'une prestation →
  l'ajout est bloqué avec une proposition de contacter un hôte.
- **Réseau coupé pendant le paiement** : le panier et les coordonnées sont conservés sur
  l'appareil ; au retour, le site interroge le statut réel du paiement avant de proposer de
  réessayer, pour éviter tout double débit.
- **Retour au site avant la confirmation du moyen de paiement** : écran « paiement en cours de
  confirmation » qui se met à jour seul ; les confirmations partent dès que le paiement est
  confirmé.
- **Paiement confirmé après expiration du panier** : la réservation est créée si les
  prestations sont encore disponibles ; sinon l'équipe est alertée et le voyageur est remboursé.
- **Changement de langue pendant le parcours** : le panier, les coordonnées saisies et l'étape
  en cours sont conservés.
- **Visiteur sans e-mail** : l'e-mail est obligatoire pour recevoir le bon de réservation ; le
  site explique pourquoi au moment de la saisie.
- **Numéro WhatsApp invalide ou non joignable** : la confirmation par e-mail et à l'écran reste
  valable ; l'équipe est alertée de l'échec WhatsApp.
- **Envoi du bon PDF impossible** : le bon reste téléchargeable depuis la page de confirmation
  et le lien de gestion ; l'envoi est relancé automatiquement.
- **Remboursement d'un paiement mobile dont le compte a changé** : l'équipe peut enregistrer un
  remboursement par un autre moyen, avec justification.
- **Paiement avec acompte annulé avant le solde** : le montant remboursable est calculé sur ce
  qui a été réellement payé.

## Requirements *(mandatory)*

### Functional Requirements

**Panier**

- **FR-001** : Le visiteur DOIT pouvoir ajouter au panier, sans créer de compte : au plus un
  hébergement (ou un séjour signature qui inclut le sien), des expériences, des tables
  (repas) et un transfert (aller, retour ou aller-retour, depuis l'aéroport AIBD ou Dakar).
  Le panier n'exige pas d'hébergement (excursion à la journée possible).
- **FR-002** : Chaque élément DOIT être ajouté avec ses paramètres : dates (nuits pour
  l'hébergement, date et créneau pour une expérience ou une table, date et heure pour un
  transfert), nombre d'adultes et d'enfants (avec leur âge, pour le tarif enfant de FR-041).
  Aucune autre option n'est proposée au MVP ; les besoins particuliers passent par la demande
  particulière (FR-011).
- **FR-003** : Le panier DOIT être conservé sur l'appareil pendant 7 jours, y compris lors d'un
  changement de langue ou d'une fermeture du navigateur, et le visiteur DOIT pouvoir modifier
  ou retirer chaque élément.
- **FR-004** : Le site DOIT vérifier la cohérence du panier avant le paiement (dates des
  éléments dans les nuits réservées, capacité, transfert retour après l'aller, prestations
  toujours publiées) et afficher chaque problème à côté de l'élément concerné.
- **FR-005** : Le visiteur DOIT payer immédiatement ; la disponibilité de chaque prestation est
  ensuite confirmée par l'équipe dans un délai annoncé (2 h entre 8 h et 20 h, heure de Dakar ;
  avant 10 h le lendemain pour un paiement fait la nuit). Tant qu'elle n'est pas confirmée, la
  réservation est « payée — en attente de confirmation » et le voyageur en est informé à l'écran,
  dans les messages et sur le bon. Pour une prestation indisponible, l'équipe propose au plus
  deux alternatives ; le voyageur choisit une alternative ou le remboursement intégral de la
  prestation (FR-030) dans les 48 heures, faute de quoi la prestation est remboursée
  intégralement. Aucun supplément n'est jamais facturé au voyageur pour une alternative ; un écart
  de prix en sa faveur lui est remboursé. L'équipe est alertée si le délai de confirmation est
  dépassé.
- **FR-006** : Le panier DOIT être migré depuis la « demande en cours » de la version 001 : les
  éléments déjà choisis par le visiteur se retrouvent dans le panier.

**Récapitulatif et prix**

- **FR-007** : Sur mobile, un résumé collant en bas d'écran DOIT afficher le nombre d'éléments
  et le total ; un geste le déplie en récapitulatif détaillé (éléments, dates, voyageurs, prix
  par ligne, total, acompte éventuel), refermable, sans masquer l'élément qui a le focus.
- **FR-008** : Les montants DOIVENT être calculés et affichés TTC en FCFA (entiers), avec
  l'équivalent en euros arrondi et marqué « indicatif » ; le montant débité est toujours celui
  en FCFA.
- **FR-009** : Le prix de chaque élément DOIT être calculé à partir de la source unique des
  prix (saison, nombre de voyageurs, nuits) et figé au moment du paiement ; tout écart avec le
  prix vu à l'ajout DOIT être signalé avant le paiement.
- **FR-010** : Le récapitulatif DOIT être présent et identique (mêmes lignes, même total) sur
  chaque étape du tunnel, sur la confirmation, dans l'e-mail, le message WhatsApp et le bon PDF.
- **FR-041** : Les enfants de 4 à 11 ans DOIVENT être facturés 50 % du prix adulte et les moins
  de 4 ans gratuitement, le pourcentage et les âges étant réglables par offre ; un transfert DOIT
  être facturé par véhicule selon la tranche de passagers (1–3, 4–7, 8 et plus), les tranches et
  leurs prix étant réglables par trajet.

**Coordonnées**

- **FR-011** : Le tunnel DOIT se limiter aux coordonnées suivantes : prénom, nom, numéro
  WhatsApp (avec indicatif pays), e-mail, et en option une demande particulière ; chaque champ
  DOIT déclencher le clavier adapté et accepter le remplissage automatique.
- **FR-012** : Le visiteur DOIT consentir au traitement de ses données pour l'exécution de la
  réservation, et PEUT consentir séparément à être relancé s'il ne finalise pas ; le second
  consentement n'est jamais précoché.

**Paiement**

- **FR-013** : L'étape de paiement DOIT présenter Wave, Orange Money et carte bancaire
  (Visa/Mastercard) au même rang, avec la même taille, le même style et la même mise en avant ;
  aucun moyen n'est présélectionné.
- **FR-014** : Les conditions d'annulation applicables au panier (par élément s'il y a des
  conditions différentes) DOIVENT être affichées sur l'étape de paiement, avant le bouton de
  paiement, et le visiteur DOIT les accepter explicitement.
- **FR-015** : Le visiteur DOIT payer l'ensemble du panier en une seule opération ; aucun
  élément ne se paie séparément.
- **FR-016** : Lorsque l'arrivée est à plus de 30 jours, le visiteur DOIT pouvoir choisir entre
  un acompte et le paiement total ; sinon seul le paiement total est proposé. Le taux d'acompte
  (30 % par défaut) et le seuil de 30 jours sont réglables par l'équipe, et un séjour signature
  PEUT imposer le paiement total.
- **FR-017** : Lorsque le visiteur a payé un acompte, le solde DOIT être exigible 14 jours avant
  l'arrivée ; un lien de paiement du solde DOIT être envoyé par e-mail et WhatsApp 7 jours avant
  cette date limite, puis rappelé la veille de la date limite.
- **FR-018** : Aucune donnée de carte bancaire NE DOIT être saisie, stockée ni transmise par le
  site : la saisie se fait chez un prestataire de paiement certifié.
- **FR-019** : Le site DOIT empêcher tout double débit d'un même panier, y compris en cas de
  double appui, de retour arrière, de réseau coupé ou de seconde tentative pendant qu'un
  paiement est en attente de confirmation.
- **FR-020** : Le statut d'un paiement DOIT être établi à partir de la confirmation du moyen de
  paiement, et non du retour du visiteur sur le site ; un paiement confirmé alors que le
  visiteur n'est pas revenu DOIT déclencher la réservation et les confirmations.
- **FR-021** : En cas d'échec, le site DOIT afficher la cause en langage simple (refus, solde
  insuffisant, délai dépassé, annulation par le visiteur), conserver le panier et proposer de
  réessayer ou de changer de moyen de paiement.

**Confirmation et bon de réservation**

- **FR-022** : Après un paiement confirmé, le site DOIT afficher une page de confirmation avec
  la référence de réservation, le récapitulatif, le montant payé, le reste à payer et sa date
  limite, les coordonnées de contact WhatsApp et un bouton de téléchargement du bon PDF.
- **FR-023** : Le voyageur DOIT recevoir, dans les 2 minutes suivant la confirmation du
  paiement, un e-mail et un message WhatsApp dans la langue utilisée sur le site, contenant la
  référence, le récapitulatif, le bon de réservation PDF et le lien de gestion de sa
  réservation. Un envoi qui échoue DOIT être relancé automatiquement, puis signalé à l'équipe.
- **FR-024** : Le bon de réservation PDF DOIT contenir : la référence, les coordonnées du
  voyageur, chaque prestation avec dates, horaires, lieu de rendez-vous et prestataire, les
  montants payés et restant dus, les conditions d'annulation acceptées et les coordonnées de
  Saloum Évasion (issues de la source unique). Il DOIT être lisible sur un écran de 360 px et
  imprimable.
- **FR-025** : L'équipe DOIT être notifiée de chaque réservation payée, avec l'intégralité de
  son contenu ; chaque prestataire concerné DOIT être informé des prestations qui le concernent.

**Gestion de la réservation par le voyageur**

- **FR-026** : Le voyageur DOIT pouvoir accéder à sa réservation sans compte, au moyen d'un
  lien personnel et non devinable reçu par e-mail et WhatsApp, pour la consulter, télécharger
  son bon, payer le solde et demander l'annulation. Il DOIT pouvoir redemander ce lien à partir
  de sa référence et de son e-mail.

**Annulation et remboursement**

- **FR-027** : Le montant remboursable DOIT être calculé automatiquement selon les conditions
  d'annulation acceptées au paiement, la date de la demande et les montants réellement payés,
  et affiché avant que le voyageur confirme l'annulation.
- **FR-028** : Chaque remboursement DOIT suivre les statuts « demandé », « validé », « versé »
  (ou « refusé », avec motif) ; le voyageur DOIT être notifié à chaque changement de statut et
  voir le statut depuis son lien de gestion.
- **FR-029** : Le remboursement DOIT être effectué sur le moyen de paiement d'origine, sauf
  impossibilité justifiée et enregistrée par l'équipe ; il DOIT être versé dans les 14 jours
  suivant sa validation.
- **FR-030** : Une prestation annulée par Saloum Évasion ou par un prestataire DOIT être
  remboursée intégralement au voyageur.

**Relance des paiements échoués ou abandonnés**

- **FR-031** : Un visiteur ayant saisi ses coordonnées et consenti aux relances, puis quitté le
  tunnel sans paiement confirmé, DOIT recevoir au plus deux relances (au bout de 1 heure et de
  24 heures), par WhatsApp et e-mail, contenant un lien qui restaure son panier à l'étape de
  paiement ; toute relance DOIT permettre de se désinscrire en un geste.
- **FR-032** : L'équipe DOIT voir la liste des paniers abandonnés et des paiements échoués
  (contenu, montant, cause, relances envoyées) et pouvoir renvoyer manuellement un lien de
  paiement.

**Commissions et reversements**

- **FR-033** : Chaque élément vendu DOIT être rattaché à un prestataire et à un type d'offre
  (hébergement, expérience, table, transfert, séjour signature) ; la commission DOIT être
  calculée automatiquement en appliquant le taux du type d'offre, compris entre 10 % et 25 %.
- **FR-034** : Les taux par type d'offre DOIVENT être réglables par l'équipe dans la plage
  10–25 % ; le taux appliqué à une réservation est celui en vigueur au moment du paiement et
  n'est plus modifié ensuite.
- **FR-035** : Un remboursement DOIT réduire la commission et la part du prestataire au prorata
  du montant remboursé, sauf pour une annulation imputable au prestataire, où la commission
  perdue reste due par celui-ci.
- **FR-036** : L'équipe DOIT pouvoir afficher, par prestataire et par période, le relevé des
  montants encaissés, commissions, remboursements, montants à reverser et reversements
  enregistrés, et l'exporter en tableur.

**Tunnel, référencement et accessibilité**

- **FR-037** : Les pages du tunnel (panier, coordonnées, paiement, confirmation, gestion de la
  réservation, paiement du solde) NE DOIVENT PAS être indexées et NE DOIVENT PAS figurer dans
  le plan du site.
- **FR-038** : Le parcours complet, de l'ajout au panier à la confirmation, DOIT être utilisable
  sur un écran de 360 px, au pouce, en réseau 3G, au clavier et avec un lecteur d'écran ; les
  actions principales sont dans la zone du pouce.
- **FR-039** : Le contact WhatsApp avec un hôte DOIT rester accessible en un geste à chaque
  étape du tunnel, avec un message pré-rédigé mentionnant le contenu du panier.
- **FR-040** : Le site DOIT mesurer, par langue et par moyen de paiement : paniers créés,
  arrivées à l'étape de paiement, paiements réussis, échoués et abandonnés, paiements récupérés
  après relance, et le temps médian du parcours.

### Key Entities

- **Panier** : sélection en cours d'un visiteur ; éléments, voyageurs, langue, date de
  création, date d'expiration (7 jours), coordonnées saisies, consentement aux relances.
- **Élément de panier** : une prestation choisie ; type d'offre, prestation référencée, dates,
  créneau, voyageurs, options, prix vu à l'ajout, prix figé au paiement.
- **Réservation** : panier payé ou en cours de paiement ; référence unique, voyageur, éléments,
  montant total, mode de paiement (acompte ou total), montant payé, solde et date limite,
  conditions d'annulation acceptées (copie figée), statut (en attente de paiement, acompte
  payé, payée, annulation demandée, annulée partiellement, annulée, terminée), statut de
  confirmation de disponibilité par élément (en attente, confirmé, indisponible), lien de gestion.
- **Paiement** : une tentative d'encaissement ; réservation, moyen (Wave, Orange Money, carte),
  montant en FCFA, nature (acompte, solde, total), statut (initié, en attente, réussi, échoué,
  abandonné, expiré), cause d'échec, date ; une réservation peut avoir plusieurs tentatives.
- **Remboursement** : réservation, éléments concernés, montant, moyen de versement, motif
  (voyageur, Saloum Évasion, prestataire), statut (demandé, validé, versé, refusé), dates.
- **Prestataire** : hébergeur, guide, restaurant ou transporteur ; coordonnées, moyen de
  reversement, prestations proposées.
- **Taux de commission** : type d'offre, taux (10–25 %), date d'effet ; historisé.
- **Ligne de commission** : élément de réservation, prestataire, montant encaissé, taux
  appliqué, commission, part prestataire, ajustements liés aux remboursements.
- **Reversement** : prestataire, période, montant versé, date, référence ; enregistré par
  l'équipe.
- **Bon de réservation** : document PDF bilingue généré pour chaque réservation et mis à jour
  à chaque changement (solde payé, annulation partielle).
- **Relance** : panier ou réservation, canal (e-mail, WhatsApp), motif (abandon, échec, solde),
  date d'envoi, ouverture du lien, désinscription.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** : 9 testeurs sur 10 composent un panier de quatre éléments (hébergement,
  expérience, table, transfert) et le paient en moins de 3 minutes, depuis une fiche
  hébergement, sur un téléphone de 360 px, au pouce, sans créer de compte.
- **SC-002** : le parcours complet réussit en réseau 3G simulé avec chacun des trois moyens de
  paiement.
- **SC-003** : 100 % des paiements confirmés donnent lieu à une réservation et à une
  confirmation à l'écran ou par message ; 95 % des voyageurs reçoivent l'e-mail et le message
  WhatsApp avec le bon PDF en moins de 2 minutes.
- **SC-004** : aucun double débit sur l'ensemble des scénarios de test (double appui, retour
  arrière, coupure réseau, retour tardif du moyen de paiement).
- **SC-005** : au moins 15 % des paniers abandonnés après saisie des coordonnées et des
  paiements échoués sont payés après relance, mesuré sur les 3 premiers mois.
- **SC-006** : 100 % des commissions et parts prestataires calculées correspondent au calcul
  manuel sur un échantillon de contrôle mensuel, remboursements compris.
- **SC-007** : 100 % des demandes d'annulation affichent le montant remboursable avant
  confirmation, et 100 % des remboursements validés sont versés en 14 jours au plus.
- **SC-008** : 100 % des pages du tunnel sont absentes de l'index et du plan du site, et
  respectent les budgets de performance et d'accessibilité de la constitution (hors score SEO).
- **SC-009** : sur l'écran de paiement, Wave, Orange Money et carte occupent le même rang et la
  même surface sur 100 % des tailles d'écran testées.
- **SC-010** : la part des demandes traitées à la main par WhatsApp pour encaisser diminue de
  moitié dans les 3 mois suivant la mise en ligne, par rapport au trimestre précédent.

## Assumptions

- **Dépendance à 001** : le catalogue (séjours, expériences, hébergements, destinations), la
  gestion de contenu, le bilinguisme, la source unique des prix et des conditions d'annulation
  et le contact WhatsApp de la version 001 sont en place. Le formulaire de demande de 001 est
  conservé pour les séjours sur mesure et les groupes hors capacité.
- **Fin de l'hypothèse « conversion sans paiement »** de 001 : le paiement en ligne entre dans
  le périmètre. Les comptes clients restent hors périmètre (accès par lien personnel).
- **Encaissement** : Saloum Évasion encaisse la totalité du montant comme vendeur unique et
  reverse leur part aux prestataires ; les reversements sont effectués par l'équipe hors du
  site (virement, Wave, Orange Money) et enregistrés dans l'espace de gestion. Le reversement
  automatique est hors périmètre.
- **Taux de commission par défaut** (réglables dans la plage 10–25 %) : transfert 10 %, table
  15 %, hébergement 15 %, expérience 20 %, séjour signature 25 %.
- **Acompte** : 30 % par défaut, proposé si l'arrivée est à plus de 30 jours ; solde exigible
  14 jours avant l'arrivée ; un solde impayé n'annule pas la réservation automatiquement,
  l'équipe décide.
- **Prestataires de paiement** : Wave, Orange Money et un prestataire de paiement par carte
  certifié offrent un mode test et une confirmation de paiement transmise au site ; le compte
  marchand de Saloum Évasion est ouvert auprès de chacun.
- **Confirmation WhatsApp** : l'envoi automatique de messages WhatsApp au voyageur suppose un
  compte WhatsApp professionnel approuvé et des modèles de message validés ; en cas
  d'indisponibilité, l'e-mail et la page de confirmation font foi.
- **E-mail obligatoire** : il est requis pour recevoir le bon de réservation et le lien de
  gestion ; le numéro WhatsApp reste le canal principal de contact.
- **Factures** : le bon de réservation n'est pas une facture fiscale ; la facturation
  réglementaire est hors périmètre de cette version.
- **Codes promotionnels, cartes cadeaux, paiement en plusieurs fois au-delà de
  l'acompte-solde, multi-devises au débit et réservation pour le compte d'une entreprise** sont
  hors périmètre.
- **Rétention** : les données de réservation et de paiement sont conservées pendant la durée
  légale de conservation des pièces comptables ; les paniers non payés sont supprimés 30 jours
  après leur dernière modification.
- **Volume** : quelques dizaines de réservations par semaine au lancement ; pas d'exigence de
  forte concurrence au-delà des pics de week-end.
