# Contrat — Notifications et bon de réservation

Tous les envois passent par la tâche `sendNotification` (file Payload). Politique commune :
4 tentatives (immédiate, +1 min, +5 min, +30 min), puis `escalated` : e-mail à
`siteSettings.fallbackNotificationEmail` (001) avec le contenu et l'erreur. Langue =
`booking.locale` (ou `cart.locale`). Aucune donnée de paiement sensible dans les messages
(ni numéro de carte, ni identifiant de compte mobile money).

## Voyageur

| Modèle | Déclencheur | E-mail | WhatsApp (modèle approuvé Meta) | Pièce jointe |
|---|---|---|---|---|
| `booking_confirmed` | paiement initial réussi | ✓ | ✓ (en-tête document) | bon PDF v1 |
| `availability_update` | toutes les lignes confirmées, ou une ligne indisponible | ✓ | ✓ | bon PDF mis à jour si tout est confirmé |
| `balance_due` | J-21 (7 j avant la date limite) puis J-15 (veille) | ✓ | ✓ | — (lien `/solde`) |
| `balance_paid` | paiement du solde réussi | ✓ | ✓ | bon PDF mis à jour |
| `payment_failed_reminder` | relance abandon / échec (1 h, 24 h), si consentement | ✓ | ✓ | — (lien de reprise) |
| `cancellation_received` | demande d'annulation | ✓ | ✓ | — |
| `refund_status` | chaque changement de statut de remboursement | ✓ | ✓ | — |
| `manage_link` | « Retrouver ma réservation » | ✓ | — | — |

Contenu minimal de `booking_confirmed` : référence ; prénom ; récapitulatif identique à
l'écran (FR-010) ; montant payé ; reste à payer et date limite ; mention « disponibilité en
cours de confirmation par notre équipe, réponse sous 2 h » tant que des lignes sont `pending` ;
lien de gestion ; contact WhatsApp de l'équipe.

## Équipe et prestataires

| Destinataire | Déclencheur | Canal |
|---|---|---|
| Équipe (`operations`) | réservation payée (contenu complet, lignes à confirmer, échéance) | e-mail |
| Équipe | échéance de confirmation de disponibilité dépassée (`availabilitySlaAlert`) | e-mail + WhatsApp |
| Équipe (`finance`) | demande d'annulation ; anomalie de montant ; remboursement validé non versé à J+10 | e-mail |
| Équipe | solde impayé à la date limite | e-mail |
| Prestataire | ligne(s) le concernant dans une réservation payée : dates, voyageurs, créneau, demande particulière (FR-025) | e-mail ou WhatsApp selon `partners` |

## Bon de réservation PDF

Gabarit `src/lib/voucher/Voucher.tsx` (`@react-pdf/renderer`), A4 portrait, une colonne,
corps ≥ 11 pt, contraste ≥ 4,5:1, polices Cormorant Garamond et Manrope embarquées.

Sections, dans l'ordre :

1. En-tête : logo, « Bon de réservation » / « Booking voucher », référence, version, date
   d'émission.
2. Voyageur : prénom, nom, WhatsApp, e-mail, nombre de voyageurs.
3. Statut : paiement (payé / acompte versé + solde et date limite) ; disponibilité (confirmée
   ou « en cours de confirmation »).
4. Prestations : pour chaque ligne, titre, dates et horaires, lieu de rendez-vous, prestataire,
   voyageurs, prix ; transferts avec heure de prise en charge.
5. Montants : total, payé, reste à payer, équivalent indicatif en euros (« indicatif, débit en
   FCFA »).
6. Conditions d'annulation acceptées (copie figée par ligne).
7. Contact : NAP et WhatsApp issus de `siteSettings` (source unique) ; lien de gestion (sans
   le jeton : invitation à utiliser le lien reçu par message).

Le PDF n'est **pas** une facture (mention en pied de page). Fichier nommé
`saloum-evasion-{reference}-v{version}.pdf`. Test : rendu de chaque section en FR et EN
(Vitest, extraction de texte) et poids < 300 Ko.
