# Contrat — Notifications des prestataires (WhatsApp)

Envoi par la file `sendNotification` de la 002 (4 tentatives à 0, 1, 5 et 30 min, puis alerte de
l'équipe). Modèles WhatsApp **en français**, rédigés en phrases courtes, à faire approuver avant
la mise en ligne. Variables `{{n}}` dans l'ordre indiqué. Repli : aucun e-mail (beaucoup de
prestataires n'en consultent pas) ; l'escalade alerte l'équipe, qui appelle.

| Modèle | Catégorie | Déclencheur | Variables | Bouton |
|---|---|---|---|---|
| `partner_login_code` | authentification | `requestLoginCode` | code | copier le code |
| SMS de connexion (hors WhatsApp) | — | `requestLoginCodeBySms` | « Saloum Évasion : votre code est {code}. Il expire dans 10 min. Ne le donnez à personne. » | — |
| `partner_booking_new` | utilitaire | paiement confirmé d'une ligne du prestataire | 1 offre, 2 date, 3 heure, 4 voyageurs (« 2 adultes, 1 enfant »), 5 prénom du voyageur | « Voir la réservation » (lien `/espace/reservations/{id}`) |
| `partner_booking_changed` | utilitaire | annulation ou modification d'une ligne par l'équipe | 1 offre, 2 date, 3 nature (« annulée », « modifiée ») | « Voir » |
| `partner_problem_ack` | utilitaire | `reportProblem` | 1 offre, 2 date | — |
| `partner_daily_digest` | utilitaire | tâche quotidienne (heure `digestHour`), s'il y a des prestations le lendemain et `dailyDigest` | 1 date, 2 nombre de prestations, 3 première prestation (heure + offre) | « Voir demain » |
| `partner_payout_sent` | utilitaire | reversement enregistré (002) | 1 montant FCFA, 2 période, 3 référence | « Mes paiements » |
| `partner_price_decision` | utilitaire | demande de prix validée ou refusée | 1 offre, 2 nouveau montant, 3 décision, 4 motif (ou « — ») | « Mes prix » |
| `partner_ical_error` | utilitaire | calendrier externe en erreur depuis 2 h | 1 unité, 2 plateforme | « Voir le calendrier » |
| `partner_ical_conflict` | utilitaire | nuit importée déjà vendue | 1 unité, 2 dates | « Voir » |

Destinataires : toutes les personnes `active` du prestataire avec `notifyBookings` (réservations)
ou `dailyDigest` (récapitulatif) ; `partner_payout_sent` et `partner_price_decision` aux seuls
`owner`.

Notifications à l'équipe (e-mail et alerte admin, gabarit 002) : demande de prix, problème
signalé, conflit iCal, calendrier en erreur, échec définitif d'un message prestataire.
