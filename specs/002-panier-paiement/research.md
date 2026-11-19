# Research: Panier unique et paiement en ligne

**Feature**: `002-panier-paiement` | **Date**: 2026-11-14 | **Plan**: [plan.md](./plan.md)

Chaque décision suit le format Décision / Raison / Alternatives. Les points marqués
**[défaut — à confirmer]** ont été tranchés sans réponse du propriétaire et restent révocables.
Les points marqués **[à valider commercialement]** dépendent d'un contrat ou d'une ouverture de
compte que l'équipe doit obtenir avant la mise en production ; le code est isolé derrière une
interface pour que ce choix ne bloque pas l'implémentation.

---

## R1 — Modèle de disponibilité **[défaut — à confirmer]**

- **Décision** : paiement immédiat, puis confirmation de disponibilité par l'équipe, ligne par
  ligne, sous 2 h entre 8 h et 20 h (heure de Dakar, UTC+0), avant 10 h le lendemain sinon
  (spec FR-005, option B). Une tâche planifiée alerte l'équipe à l'échéance. Une ligne
  indisponible déclenche, au choix du voyageur, une alternative ou un remboursement intégral.
- **Raison** : objectif « payer en moins de 3 minutes » (SC-001) tenu sans calendrier ;
  simplicité (principe VIII) ; la 001 a déjà posé « pas de calendrier temps réel ».
- **Alternatives** : calendrier par prestation (A), plus lourd à tenir avec des prestataires
  qui gèrent leurs disponibilités par téléphone ; pré-réservation puis lien de paiement (C),
  qui casse SC-001. Le modèle de données prévoit `availabilityStatus` par ligne, ce qui permet
  d'ajouter plus tard un calendrier sans migration de structure.

## R2 — Prestataire(s) de paiement **[à valider commercialement]**

- **Décision** : une interface `PaymentGateway` (contrat
  [payment-gateway.md](./contracts/payment-gateway.md)) avec, au lancement, **un seul
  agrégateur sénégalais** qui couvre Wave, Orange Money et carte Visa/Mastercard par **page de
  paiement hébergée** et **notifications serveur signées**. Candidats à comparer (tâche dédiée) :
  PayDunya, PayTech, CinetPay. Critères éliminatoires : les trois moyens au même niveau sur une
  même intégration ; page hébergée certifiée PCI DSS (aucune donnée de carte chez nous,
  principe IX) ; notification serveur signée et interrogation du statut par API ; mode test ;
  remboursement par API ou, à défaut, procédure documentée ; reversement en XOF sur compte
  sénégalais ; page de paiement utilisable à 360 px. Une implémentation `fake` sert au
  développement, aux tests E2E et à la CI.
- **Raison** : une intégration au lieu de trois (principe VIII) ; parité de traitement des trois
  moyens garantie par le même flux (principe VI) ; Stripe et Adyen n'ouvrent pas de compte
  marchand au Sénégal pour une petite structure. Si l'agrégateur retenu facture Wave nettement
  plus cher que Wave en direct, l'interface permet d'ajouter une implémentation « Wave
  Checkout » directe sans toucher au tunnel.
- **Alternatives** : intégrations directes Wave + Orange Money + acquéreur carte (trois
  contrats, trois webhooks, trois procédures de remboursement) ; paiement par lien manuel envoyé
  par WhatsApp (statu quo 001, contraire à la spec).

### R2a — Grille de comparaison (T097, à compléter avec les prestataires)

Aucune valeur n'est pré-remplie : les tarifs, délais et conditions se vérifient auprès de chaque
prestataire (contrat, documentation à jour, compte de test). Une réponse « non » à un critère
éliminatoire écarte le candidat.

| Critère | Type | PayDunya | PayTech | CinetPay |
|---|---|---|---|---|
| Wave, Orange Money et carte Visa/Mastercard sur **une même** intégration | éliminatoire | | | |
| Page de paiement hébergée, certifiée PCI DSS (aucune donnée de carte chez nous) | éliminatoire | | | |
| Notification serveur **signée** (HMAC ou équivalent) + interrogation du statut par API | éliminatoire | | | |
| Mode test complet (les trois moyens, échecs simulables) | éliminatoire | | | |
| Remboursement par API, sinon procédure documentée et délai | éliminatoire | | | |
| Reversement en XOF sur compte sénégalais, délai de reversement | éliminatoire | | | |
| Page hébergée utilisable à 360 px, au clavier et au lecteur d'écran (test manuel, tension T14) | éliminatoire | | | |
| Frais par transaction : Wave / Orange Money / carte | comparatif | | | |
| Frais fixes (ouverture, abonnement), plafonds par transaction | comparatif | | | |
| Retour du moyen choisi et de la cause d'échec dans la notification | comparatif | | | |
| Délai d'ouverture du compte marchand, pièces demandées | comparatif | | | |
| Support (langue, canal, horaires) | comparatif | | | |

**Démarche** : 1) demander à chacun la documentation d'API et un compte de test ; 2) vérifier
les critères éliminatoires sur le compte de test (dont un paiement Wave, Orange Money et carte, un
échec et un remboursement) ; 3) tester la page hébergée à 360 px, au clavier et au lecteur
d'écran ; 4) comparer les frais sur un panier type de 150 000 FCFA ; 5) décision du propriétaire
consignée ici (date, prestataire, raison), puis T098 (implémentation de la passerelle).

**Décision** : comparer d'abord (choix du propriétaire du 2026-11-19). La demande ci-dessous est
envoyée aux trois candidats ; la grille est remplie à réception des comptes de test, puis le
propriétaire décide. Le développement avance avec la passerelle `fake`.

**Demande type** (à envoyer à PayDunya, PayTech et CinetPay) :

> Objet : Ouverture d'un compte marchand — agence de voyages, Sine-Saloum
>
> Bonjour,
>
> Nous ouvrons la réservation en ligne de séjours dans le Sine-Saloum (paniers de 50 000 à
> 1 500 000 FCFA, paiement total ou acompte). Nous souhaitons proposer Wave, Orange Money et la
> carte Visa/Mastercard sur une même intégration, par page de paiement hébergée. Pourriez-vous
> nous transmettre :
>
> 1. la documentation de l'API (création de paiement, notification serveur et sa signature,
>    interrogation du statut, remboursement) ;
> 2. un compte de test couvrant les trois moyens, avec simulation d'échecs ;
> 3. vos frais par transaction (Wave, Orange Money, carte), frais fixes et plafonds ;
> 4. le délai et la périodicité des reversements en XOF sur un compte sénégalais ;
> 5. les pièces et le délai d'ouverture d'un compte marchand ;
> 6. la conformité PCI DSS de la page hébergée et son accessibilité (mobile 360 px, clavier,
>    lecteur d'écran) ;
> 7. les modalités du support (langue, canal, horaires).
>
> Merci d'avance,

## R3 — Parcours de paiement mobile money

- **Décision** : redirection vers la page hébergée de l'agrégateur, qui ouvre l'application
  Wave / Orange Money (lien profond ou code QR sur ordinateur) ; retour sur
  `/{locale}/commande/statut`. Le **statut fait foi uniquement à réception de la notification
  serveur** (FR-020) ; la page de statut interroge notre serveur toutes les 3 s (îlot client
  < 2 Ko, arrêt après 10 min) et affiche « paiement en cours de confirmation ». Si la
  notification tarde, une tâche de réconciliation interroge l'agrégateur toutes les 5 minutes
  pour les paiements « en attente » de plus de 10 minutes, pendant 24 h.
- **Raison** : sur mobile, l'utilisateur quitte le navigateur pour l'application de paiement et
  ne revient pas toujours ; le retour navigateur n'est pas une preuve de paiement.
- **Alternatives** : USSD push initié par nous (dépend de l'opérateur, hors agrégateur) ;
  confiance dans les paramètres de retour (falsifiables).

## R4 — Idempotence et absence de double débit (FR-019)

- **Décision** : une `Booking` est créée (statut `awaiting_payment`) à la soumission de l'étape
  coordonnées, avec une clé unique dérivée du panier (`cartId` + version du panier). Chaque
  tentative = un `Payment` avec `idempotencyKey` (UUID) transmise à l'agrégateur. Contrainte en
  base : **au plus un `Payment` au statut `initiated` ou `pending` par réservation et par
  nature** (index unique partiel). Une nouvelle tentative est refusée tant qu'un paiement est en
  attente ; elle est autorisée après `failed`, `abandoned` ou `expired` (expiration à 30 min
  sans notification). Le traitement des notifications est idempotent (clé = identifiant de
  transaction de l'agrégateur, table `paymentEvents` avec contrainte d'unicité) et
  transactionnel (verrou `SELECT … FOR UPDATE` sur la réservation).
- **Raison** : couvre double appui, retour arrière, réseau coupé, notification rejouée.
- **Alternatives** : verrou applicatif en mémoire (inopérant en serverless) ; Redis (service
  supplémentaire, principe VIII).

## R5 — Stockage du panier

- **Décision** : panier **côté serveur** (collection `carts`, Postgres) identifié par un cookie
  `se_cart` (identifiant aléatoire 128 bits, `HttpOnly`, `Secure`, `SameSite=Lax`, 7 jours),
  plus un cookie lisible `se_cart_summary` (nombre d'éléments et total XOF, sans donnée
  personnelle) qui alimente le résumé collant des pages statiques sans requête réseau. Les ajouts
  et modifications passent par des **formulaires + Server Actions** : ils fonctionnent sans
  JavaScript. La « demande en cours » de la 001 (stockage local) est migrée au premier
  chargement par l'îlot existant `AddToRequest`, renommé `AddToCart` (FR-006).
- **Raison** : survit au changement de langue et à la fermeture du navigateur (FR-003) ; permet
  la relance (FR-031) ; garde les pages publiques statiques (pas de lecture de cookie au rendu).
  Cookies strictement nécessaires au service demandé : exemptés de consentement (même analyse
  que la tension T8 de la 001), mentionnés dans la politique de confidentialité.
- **Alternatives** : stockage local seul (pas de relance, pas de sans-JS) ; panier en session
  serveur lue au rendu (rend toutes les pages dynamiques, budget LCP compromis).

## R6 — Résumé collant dépliable (FR-007)

- **Décision** : élément `<details>`/`<summary>` natif, positionné en bas d'écran, rendu côté
  serveur sur les pages du tunnel ; sur les pages publiques statiques, il **fusionne avec la
  barre d'action collante de la 001** (une seule barre : « Panier · 3 · 185 000 F » +
  WhatsApp), dont le contenu est lu dans `se_cart_summary` par un îlot de moins de 1 Ko.
  Hauteur réservée (`--spacing-action-bar`) pour un CLS nul ; `scroll-padding-bottom` pour que
  l'élément focalisé ne soit jamais masqué (WCAG 2.4.11).
- **Raison** : dépliable sans JavaScript, accessible au clavier et au lecteur d'écran
  nativement ; évite deux barres collantes empilées à 360 px.
- **Alternatives** : tiroir (`<dialog>`) piloté en JS ; panneau latéral (inadapté au pouce).

## R7 — Calcul des prix, acompte et commissions

- **Décision** : module pur `src/lib/checkout/` (aucune dépendance), entiers XOF uniquement.
  - Prix de ligne : hébergement = prix par nuit de la saison de chaque nuit × nuits ;
    expérience et table = prix adulte × adultes + prix enfant × enfants (enfant = 50 % par
    défaut, réglable par offre, gratuit sous 4 ans) ; transfert = prix par véhicule selon la
    tranche de passagers (1–3, 4–7, 8–14) et le trajet ; séjour signature = prix par personne
    de la saison de la date d'arrivée × voyageurs.
  - Acompte = `ceil(total × tauxAcompte / 100 / 100) × 100` (arrondi à la centaine supérieure) ;
    solde = total − acompte.
  - Commission par ligne = `round(montantEncaissé × tauxBp / 10000)` (arrondi au plus proche,
    demi vers le haut), taux en points de base (1000–2500) ; part prestataire = montant −
    commission. En acompte, la commission est calculée sur la ligne entière au paiement de
    l'acompte puis **reconnue au prorata de l'encaissé** pour le relevé.
  - Remboursement : montant remboursable par ligne = encaissé de la ligne × pourcentage du
    palier d'annulation applicable ; commission et part réduites au prorata (FR-035), sauf
    motif « prestataire » où la commission reste due par le prestataire.
- **Raison** : principe VI (XOF entiers) et VII (tests unitaires sur tarification, conversion,
  annulation) ; un seul endroit pour tous les calculs (source unique).
- **Alternatives** : décimaux en base (inutile en XOF, sans subdivision) ; calcul côté client
  (non fiable).

## R8 — Conditions d'annulation calculables

- **Décision** : la collection `cancellationPolicies` de la 001 (texte seul) gagne un tableau
  `tiers` : `{ daysBeforeArrivalMin: number, refundPercent: 0–100 }`, trié, obligatoire pour
  toute offre vendable. Le texte affiché reste éditorial mais une **validation** vérifie la
  cohérence minimale (au moins un palier). À la création de la réservation, la politique de
  chaque ligne est **copiée** dans la réservation (`policySnapshot`) : une modification
  ultérieure ne change pas les droits du voyageur.
- **Raison** : FR-014 (affichage avant paiement), FR-027 (calcul automatique) ; principe V.
- **Alternatives** : calcul manuel par l'équipe (contraire à FR-027).

## R9 — Bon de réservation PDF

- **Décision** : génération côté serveur avec **`@react-pdf/renderer`** (dépendance à
  approuver par le propriétaire), gabarit unique bilingue, polices de la charte embarquées
  (sous-ensemble latin), format A4 lisible sur 360 px (une colonne, corps 11 pt minimum).
  Stocké dans le stockage objet (bucket privé), servi par une route authentifiée par le jeton
  de gestion. Régénéré à chaque changement (confirmation de disponibilité, solde, annulation),
  avec un numéro de version.
- **Raison** : rendu déterministe sans navigateur sans tête (incompatible avec les limites des
  fonctions serverless) ; composants React connus de l'équipe ; uniquement serveur, donc aucun
  impact sur le budget JS client.
- **Alternatives** : `pdf-lib` (mise en page à la main, coûteuse) ; Chromium sans tête
  (200 Mo, démarrage lent) ; service SaaS de PDF (service supplémentaire et données
  personnelles chez un tiers).

## R10 — Confirmation WhatsApp au voyageur

- **Décision** : **WhatsApp Business Platform (API Cloud de Meta)** appelée en HTTP direct
  (`fetch`, aucune SDK), numéro professionnel de Saloum Évasion, **modèles de message
  approuvés** FR et EN : `booking_confirmed` (en-tête document = bon PDF), `balance_due`,
  `payment_reminder`, `refund_status`, `availability_update`. Envoi depuis la file de tâches,
  avec trois relances (1 min, 5 min, 30 min), puis alerte équipe (FR-023). Le voyageur peut
  répondre : la conversation arrive sur le même numéro que l'équipe utilise déjà.
- **Raison** : la spec exige une confirmation **reçue** par WhatsApp, ce qu'un lien `wa.me`
  (initié par le visiteur) ne permet pas. Revient sur la décision R3 de la 001 (« pas d'API
  WhatsApp Business ») : voir plan, tension T12 et Complexity Tracking.
- **Alternatives** : fournisseur intermédiaire (BSP : Twilio, 360dialog) — coût et sous-traitant
  supplémentaires ; lien `wa.me` sur la page de confirmation (garde la 001, ne remplit pas
  FR-023).

## R11 — E-mails transactionnels

- **Décision** : Resend (déjà au plan 001), gabarits HTML simples rendus côté serveur (pas de
  nouvelle dépendance), bon PDF en pièce jointe et lien de gestion. Même politique de relance
  que R10.
- **Raison** : réutilisation (principe VIII).
- **Alternatives** : aucune nécessaire.

## R12 — Tâches planifiées et file d'envoi

- **Décision** : **file de tâches de Payload 3** (`jobs`) stockée dans Postgres, déclenchée par
  une **tâche cron de l'hébergeur** toutes les minutes sur une route protégée par secret.
  Tâches : `sendNotification` (e-mail / WhatsApp, avec relances), `generateVoucher`,
  `reconcilePendingPayments` (5 min), `abandonedCartReminder` (1 h, 24 h),
  `balanceReminder` (J-21 et J-15 avant arrivée, soit 7 jours et la veille avant la date
  limite J-14), `availabilitySlaAlert`, `purgeCarts` (quotidienne, paniers > 30 jours).
- **Raison** : aucun service supplémentaire (principe VIII) ; reprise après échec ; historique
  consultable dans l'admin.
- **Alternatives** : file externe (Inngest, QStash) : service supplémentaire ; `setTimeout`
  (perdu en serverless).

## R13 — Accès sans compte (FR-026)

- **Décision** : lien de gestion `/{locale}/reservation/{reference}?k={jeton}` ; jeton aléatoire
  de 32 octets (base64url), **stocké haché** (SHA-256), sans expiration tant que la réservation
  est active, révocable par l'équipe. Référence lisible `SE-` + 6 caractères (alphabet sans
  ambiguïté, sans 0/O/1/I). « Retrouver ma réservation » : référence + e-mail → envoi du lien
  par e-mail (réponse identique que la paire existe ou non, limitation de débit 5/h/IP).
  En-têtes `Referrer-Policy: no-referrer` et `Cache-Control: private, no-store` sur ces pages.
- **Raison** : sécurité suffisante pour une réservation ; pas de mot de passe (spec).
- **Alternatives** : code envoyé à chaque visite (friction) ; comptes (hors périmètre).

## R14 — Remboursements

- **Décision** : workflow `requested → approved → paid` (ou `rejected`) piloté par l'équipe
  (rôle `finance`) dans l'admin. À l'approbation, appel de l'API de remboursement de
  l'agrégateur si disponible pour le moyen d'origine ; sinon (fréquent en mobile money)
  remboursement manuel enregistré avec référence de transaction et justificatif (FR-029, cas
  limite « compte changé »). Échéance de 14 jours suivie, alerte à J+10.
- **Raison** : les API de remboursement mobile money sont inégales ; le suivi doit exister
  dans les deux cas.
- **Alternatives** : remboursement automatique immédiat (risque de fraude, pas de contrôle).

## R15 — Référencement et mesure du tunnel

- **Décision** : pages du tunnel en `robots: noindex, nofollow` (métadonnées) **et** en-tête
  `X-Robots-Tag: noindex`, absentes du sitemap, **non bloquées** dans `robots.txt` (même règle
  que la 001, pour que Google voie le noindex). Lighthouse CI sur `/fr/panier` et
  `/fr/commande/coordonnees` (panier de démonstration) avec les assertions Performance,
  Accessibilité et Bonnes pratiques, **sans** SEO (constitution v1.0.1). Évènements Plausible
  du tunnel sans donnée personnelle ([analytics-events.md](./contracts/analytics-events.md)).
- **Raison** : principe III et constitution II.
- **Alternatives** : blocage `robots.txt` (Google ne verrait pas le noindex).

## R16 — Sécurité de l'intégration de paiement (principe IX)

- **Décision** : vérification de signature HMAC de chaque notification (comparaison à temps
  constant), liste d'IP de l'agrégateur si fournie, montant et devise revérifiés contre la
  réservation avant tout changement d'état ; secrets en variables d'environnement ; aucun
  montant transmis par le client (recalcul serveur) ; journal d'audit (`paymentEvents`)
  immuable ; rôles admin `editor`, `operations`, `finance`, `admin` (seuls `finance` et `admin`
  voient montants à reverser et approuvent remboursements). Revue de sécurité dédiée avant mise
  en production (tâche bloquante).
- **Raison** : exigences du principe IX et de la checklist de PR.
- **Alternatives** : aucune acceptable.
