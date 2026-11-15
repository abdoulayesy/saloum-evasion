# Contrat — Routes du tunnel et des réservations

Complète [routes 001](../../001-site-public-vitrine/contracts/routes.md). Toutes les routes
ci-dessous sont **dynamiques**, **`noindex, nofollow`** (métadonnées + en-tête
`X-Robots-Tag: noindex`), **absentes du sitemap**, **non bloquées** dans `robots.txt`, servies
avec `Cache-Control: private, no-store`. Pas de hreflang ni de JSON-LD (pages non indexables) ;
`title` et H1 uniques restent exigés (accessibilité). Le sélecteur de langue conduit à la même
étape dans l'autre langue et conserve le panier (FR-003).

## Pages

| Étape | FR | EN | Accès | Contenu principal |
|---|---|---|---|---|
| Panier | `/fr/panier` | `/en/cart` | cookie `se_cart` | lignes modifiables, contrôles FR-004, transferts proposés, total, lien « Demander un devis à la place » |
| Coordonnées | `/fr/commande/coordonnees` | `/en/checkout/details` | panier non vide et valide | prénom, nom, WhatsApp, e-mail, demande particulière, consentements |
| Paiement | `/fr/commande/paiement` | `/en/checkout/payment` | réservation `awaiting_payment` liée au panier | choix acompte / total, conditions d'annulation + case d'acceptation, 3 moyens au même rang, bouton « Payer {montant} » |
| Statut | `/fr/commande/statut?p={paymentId}` | `/en/checkout/status?p=…` | cookie `se_cart` ou jeton | « en cours de confirmation » / échec (cause + réessayer) / redirection vers la confirmation |
| Confirmation et gestion | `/fr/reservation/{ref}?k={jeton}` | `/en/booking/{ref}?k=…` | jeton de gestion | référence, statut paiement et disponibilité, récapitulatif, bon PDF, solde, annulation, statut de remboursement |
| Paiement du solde | `/fr/reservation/{ref}/solde?k=…` | `/en/booking/{ref}/balance?k=…` | jeton, statut `deposit_paid` | montant du solde, 3 moyens au même rang |
| Annulation | `/fr/reservation/{ref}/annulation?k=…` | `/en/booking/{ref}/cancel?k=…` | jeton | montant remboursable par ligne (FR-027), confirmation |
| Retrouver ma réservation | `/fr/reservation/retrouver` | `/en/booking/find` | public | référence + e-mail → lien envoyé par e-mail |
| Reprise après relance | `/fr/panier/reprendre?t={jeton}` | `/en/cart/resume?t=…` | jeton de relance (usage limité 7 j) | restaure le panier, redirige vers l'étape de paiement, signale les changements (prix, disponibilité) |

Après le premier affichage de la confirmation, le jeton est retiré de l'URL visible
(`history.replaceState` par l'îlot de statut ; sans JS, il reste mais `Referrer-Policy:
no-referrer` empêche sa fuite).

## Routes serveur

| Route | Méthode | Rôle | Protection |
|---|---|---|---|
| `/api/payments/notify/[gateway]` | POST | notification serveur de l'agrégateur | signature HMAC, montant/devise revérifiés, idempotente |
| `/api/payments/status/[paymentId]` | GET | interrogée par l'îlot de statut (3 s) | cookie `se_cart` ou jeton ; réponse minimale `{ status, bookingUrl? }` |
| `/api/bookings/[ref]/voucher` | GET | bon PDF (dernière version) | jeton de gestion (`?k=`) ou session admin ; `Content-Disposition: inline` |
| `/api/jobs/run` | POST | déclenchement de la file Payload par la tâche cron | secret `CRON_SECRET` |
| `/api/whatsapp/webhook` | GET/POST | vérification Meta + statuts de livraison des messages | jeton de vérification + signature `X-Hub-Signature-256` |

## Pages publiques 001 modifiées

| Page | Changement |
|---|---|
| Fiches séjour, expérience, hébergement | bloc « Ajouter au panier » (formulaire serveur : dates, créneau, voyageurs) si l'offre est `bookable` ; sinon « Demander » (001) |
| Toutes les pages publiques | barre collante : si panier non vide, « Panier · n · total » remplace « Demander » ; WhatsApp conservé (R6) |
| Pages publiques | restent **statiques** : aucune lecture du cookie au rendu |

## Redirections et erreurs

- Étape demandée sans prérequis (ex. paiement sans coordonnées) → 303 vers la première étape
  incomplète.
- Jeton invalide ou révoqué → page « lien invalide » (200, `noindex`) avec formulaire
  « Retrouver ma réservation » ; jamais d'indication sur l'existence de la référence.
- Panier expiré → page panier vide avec rappel « votre panier a expiré » et suggestions.

## Lighthouse CI (profil mobile)

URL ajoutées : `/fr/panier` et `/fr/commande/coordonnees` avec le panier de démonstration
(cookie injecté par `lighthouserc.json` via `extraHeaders`), `/fr/commande/statut?p=demo`.
Assertions : Performance ≥ 95, Accessibilité ≥ 95, Bonnes pratiques = 100 ; **pas
d'assertion SEO** (constitution v1.0.1). Budget JS : ≤ 150 Ko compressés par route (contrôlé
aussi par `check-bundles`).
