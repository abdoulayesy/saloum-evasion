# Contrat — Espace prestataires : routes et Server Actions

Application web dans le site, **en français uniquement**, sous `/espace` (hors des routes
localisées `/{fr|en}`). Toutes les pages sont **dynamiques**, `noindex, nofollow` (balise et
`X-Robots-Tag`), `Cache-Control: private, no-store`, absentes du sitemap, non bloquées dans
`robots.txt`. Layout propre (`<html lang="fr-SN">`), sans l'en-tête ni le pied de page publics ;
bouton « Aide » (WhatsApp de l'équipe) sur chaque écran (FR-039).

## Pages

| Page | Chemin | Accès | Contenu |
|---|---|---|---|
| Connexion | `/espace` | public | champ numéro WhatsApp (indicatif + numéro, `type="tel"`, `autocomplete="tel"`) ; bouton « Recevoir mon code » |
| Code | `/espace/code` | public (après demande) | 6 cases ou un champ `inputmode="numeric"` `autocomplete="one-time-code"` ; après 60 s : « Renvoyer sur WhatsApp » et « Recevoir le code par SMS » |
| Lien de secours | `/espace/lien/{jeton}` | jeton à usage unique (15 min) | ouvre la session puis redirige vers l'accueil |
| Accueil | `/espace/accueil` | session | « Aujourd'hui » et « Demain » (prestations), alertes (calendrier en erreur, prix en attente), quatre grandes tuiles : Calendrier, Réservations, Mes prix, Mes paiements |
| Calendrier | `/espace/calendrier` | session | choix de l'offre puis de l'unité (si plusieurs) |
| Calendrier d'une offre | `/espace/calendrier/{offre}?unite={id}&mois=AAAA-MM` | session, offre du prestataire | grille du mois (nuits) ou liste des jours avec créneaux et capacités ; états « Libre / Fermé / Réservé / Airbnb / Booking » |
| Semaine type | `/espace/calendrier/{offre}/semaine` | session, `owner` | créneaux et capacités par jour de la semaine |
| Calendriers externes | `/espace/calendrier/{offre}/synchronisation?unite={id}` | session, `owner`, hébergement | liens importés (état, dernière lecture) et lien Saloum Évasion à copier (bouton « Copier ») |
| Réservations | `/espace/reservations` | session | à venir d'abord ; onglet « Passées » (30 derniers jours) |
| Détail | `/espace/reservations/{id}` | session, ligne du prestataire | date, heure, voyageurs, demandes, boutons « Appeler », « WhatsApp », « J'ai un problème » |
| Mes prix | `/espace/prix` | session, `owner` | tarifs par offre, demande de changement, état des demandes |
| Mes paiements | `/espace/paiements?mois=AAAA-MM` | session, `owner` | relevé du mois (002) : réservations, commission, part, reversements, reste dû |
| Mise en avant | `/espace/mise-en-avant` | session, `owner`, restaurant | périodes, forfait, statut de paiement, affichages et ouvertures par semaine |
| Réglages | `/espace/reglages` | session | notifications (réservations, récapitulatif de la veille), personnes rattachées (lecture), « Me déconnecter » |

Sans session valide : redirection 303 vers `/espace` avec retour à la page demandée après
connexion (`?suite=` limité aux chemins `/espace/*`).

## Server Actions (formulaires, fonctionnent sans JavaScript)

Type de retour commun à la 002 (`ok` / `invalid` / `conflict` / `rate_limited` / `error`) ;
messages en français simple. Chaque action vérifie la session, le rôle et que la ressource
appartient au prestataire.

| Action | Entrées (Zod) | Effet | Erreurs |
|---|---|---|---|
| `requestLoginCode` | `whatsapp` E.164 | crée un `loginCode`, envoie `partner_login_code` ; réponse identique que le numéro existe ou non | `rate_limited` (3 demandes / 15 min / numéro, 10 / h / IP hachée) |
| `requestLoginCodeBySms` | `whatsapp` E.164 | renvoie le code courant (ou un nouveau) par SMS ; disponible 60 s après l'envoi WhatsApp ou si WhatsApp a refusé le numéro ; réponse identique que le numéro existe ou non | `rate_limited` (2 SMS / 15 min / numéro) |
| `verifyLoginCode` | `whatsapp`, `code` 6 chiffres | ouvre une session, pose `se_partner` | `invalid` (code faux, essais restants), `rate_limited` (blocage 15 min) |
| `logout` | — | révoque la session courante | — |
| `setNightsClosed` | `unitId`, `dates[]` (≤ 62), `closed` | ferme ou ouvre les nuits ; journalise ; renvoie `undoToken` (10 s) | `conflict: booked` (dates réservées, listées), `conflict: external` (nuit importée) |
| `setSlotCapacity` | `resource` (`experienceSlot` \| `transferDay`), `id`, `date`, `slot?`, `capacity` ou `closed` | met à jour la ligne d'inventaire ; journalise ; renvoie `undoToken` | `conflict: below_sold` (capacité < places vendues) |
| `undoChange` | `undoToken` (≤ 10 s) | rétablit la valeur précédente | `conflict: expired`, `conflict: booked_meanwhile` |
| `saveWeeklyTemplate` | `offerId`, `entries[]` | remplace la semaine type ; n'affecte pas les jours déjà modifiés ni vendus | `invalid` (créneau inconnu) |
| `addExternalCalendar` | `unitId`, `platform`, `url` | vérifie l'URL (https, hôte public, flux iCal lisible) puis lance une première lecture | `invalid: url`, `invalid: not_ical` |
| `removeExternalCalendar` | `calendarId` | supprime le lien et rouvre les nuits qu'il avait fermées (sauf réservées) | — |
| `reportProblem` | `lineRef`, `reason` (`breakdown` \| `weather` \| `sick` \| `other`), `note?` ≤ 300 | alerte l'équipe ; marque la ligne « indisponible signalée » (règle 002) ; envoie `partner_problem_ack` | — |
| `requestPriceChange` | `offerId`, `field`, `amount` (entier > 0), `confirmBigChange?` | crée la demande ; notifie l'équipe ; écart > 50 % sans confirmation → `invalid` avec le montant en lettres | `invalid` |
| `updateNotificationSettings` | `notifyBookings`, `dailyDigest` | met à jour la personne | — |

Toute action modifiant le stock s'exécute dans une transaction et passe par les fonctions
conditionnelles de [availability](./availability.md) ; aucune n'accepte de montant pour une
réservation.

## Îlots client (budget total ≤ 6 Ko gz sur l'espace)

- `UndoToast` : affiche « C'est fait. Annuler » pendant 10 s après une fermeture ou une
  réduction ; envoie `undoChange`.
- `DayPicker` : sélection de plusieurs jours au pouce dans la grille (sans JS : case à cocher par
  jour et bouton « Fermer les jours cochés »).
- `OfflineBanner` : « Pas de réseau. Vos changements ne sont pas enregistrés. » ; désactive les
  boutons d'envoi tant que `navigator.onLine` est faux.

## Ergonomie (vérifiée en E2E `@partner`)

- Cibles ≥ 48 × 48 px ; une action principale par écran, en bas, dans la zone du pouce.
- Icône toujours suivie d'un mot ; états du calendrier par couleur **et** mot.
- Confirmation rédigée pour toute action irréversible (« Fermer samedi 14 décembre ? »).
- Texte agrandi à 200 % sans défilement horizontal ; axe sans erreur sur chaque page et état.
- Parcours « fermer une date » et « réduire un créneau » chronométrés < 2 min (SC-001) en 3G.
