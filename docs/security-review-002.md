# Revue de sécurité du tunnel de paiement (002, T103)

- **Date** : 2026-11-20
- **Périmètre** : code de la 002 au commit de la phase 8 (branche `002-panier-paiement-polish`),
  passerelle factice. Principe IX de la constitution, décision R16 de `research.md`.
- **Statut** : **revue partielle, toujours bloquante pour la production.** La passerelle réelle
  (T098) n'existe pas encore : sa vérification de signature, sa liste d'IP et ses appels sortants
  devront être revus avant la mise en production (section « Reste à revoir »).
- **Méthode** : lecture du code des points d'entrée (routes, actions serveur, hooks, tâches), des
  règles d'accès Payload et des secrets ; tests unitaires ajoutés pour chaque correction.

## Corrections faites pendant la revue

| # | Gravité | Constat | Correction |
|---|---|---|---|
| S1 | Élevée | **Double application d'un paiement réussi.** Deux traitements concurrents du même succès (deux notifications d'identifiants différents, ou une notification et la réconciliation) lisaient tous deux la tentative `pending`, passaient la transition et appelaient `applySuccessfulPayment` deux fois : encaissé et écritures de commission comptés deux fois, deux confirmations envoyées. | Avant les effets du succès, `applyGatewayStatus` réserve l'évènement `applied:<id de la tentative>` dans `paymentEvents`, dont l'identifiant est unique en base : un seul traitement passe (`src/lib/payments/notify.ts`). Test « deux traitements concurrents » dans `tests/unit/payments/notify.test.ts`. |
| S2 | Moyenne | **Passerelle réelle sans secret possible.** `PAYMENT_GATEWAY_API_KEY` et `PAYMENT_GATEWAY_WEBHOOK_SECRET` étaient facultatifs quelle que soit la passerelle : un déploiement mal configuré n'aurait pu vérifier aucune notification. | Ces deux variables sont exigées dès que `PAYMENT_GATEWAY` n'est pas `fake` ; le démarrage échoue sinon (`src/lib/env.ts`, test dans `tests/unit/checkout/env.test.ts`). |
| S3 | Moyenne | **Blocage d'une réservation (phase 7).** Le hook de confirmation de disponibilité écrivait les notifications hors de la transaction de la requête et attendait indéfiniment le verrou de la réservation. | `req` transmis (`src/hooks/availabilityUpdate.ts`, commit de la phase 7) ; couvert par l'E2E `us5-statement`. |

## Points vérifiés

**Notifications de la passerelle** (`/api/payments/notify/[gateway]`)
- Signature vérifiée par l'implémentation de la passerelle sur le corps brut ; comparaison HMAC à
  temps constant (`timingSafeEqual`) ; corps limité à 64 Kio ; signature invalide → 401, journalisée
  sans le contenu.
- Rejeu : `gatewayEventId` unique dans `paymentEvents` → 200 sans effet.
- Montant et devise revérifiés contre la tentative avant tout changement d'état ; écart → tentative
  échouée, réservation intacte, finance alertée.
- Transitions de la machine à états uniquement ; une notification vers un état antérieur est
  ignorée ; un état final n'est plus modifié.

**Montants**
- Calculés côté serveur depuis la réservation figée (`startPayment.ts`) : le formulaire ne choisit
  que le plan (total ou acompte, revalidé) et le moyen. Montants XOF entiers validés par les champs.

**Accès**
- Réservation, statut de paiement et bon PDF : cookie du panier ou jeton de gestion
  (`canAccessBooking`) ; réponse 404 identique dans tous les cas d'échec (pas d'énumération des
  identifiants séquentiels).
- Jeton de gestion : HMAC dérivé de `PAYLOAD_SECRET`, seule l'empreinte est stockée (champ illisible
  et non modifiable par l'API) ; liens de relance signés et datés (7 jours, désinscription 90 jours).
- « Retrouver ma réservation » : même réponse que la paire existe ou non, 5 demandes par heure et
  par adresse IP.
- Admin : `paymentEvents`, `payments`, `commissionEntries` créés par le serveur seulement et
  immuables (même pour un administrateur, hooks `immutableHooks`) ; remboursements approuvés par
  `finance` / `admin` ; commission et part prestataire illisibles du rôle `operations` ; relevés et
  export réservés à `finance` / `admin` (vérifié en E2E).
- Tâches planifiées : `CRON_SECRET` comparé à temps constant, tout refusé sans secret ; date de
  référence `?now=` acceptée seulement avec la passerelle factice.
- Webhook WhatsApp : signature `X-Hub-Signature-256` vérifiée avec `WHATSAPP_APP_SECRET`, refus
  sans secret.

**Passerelle factice**
- Interdite en production sauf dérogation explicite `ALLOW_FAKE_GATEWAY=1` (préproduction) ; page
  `/dev/fake-gateway` en 404 quand elle est désactivée ; secret obligatoire.

**Données de carte et journaux**
- Aucun champ de carte sur le site (page hébergée de l'agrégateur) ; aucun journal applicatif ne
  contient de numéro de téléphone, d'e-mail ou de donnée de carte (recherche dans `src/lib/payments`,
  `src/lib/booking`, `src/jobs`).

## Reste à revoir (bloquant avant la production)

1. **Adaptateur de la passerelle réelle (T098)** : vérification de signature selon la
   documentation de l'agrégateur, liste d'IP si elle est publiée, délais et nouvelles tentatives
   des appels sortants, aucune donnée de carte reçue ni journalisée, réponses enregistrées du test
   de contrat. Cette revue doit être complétée par un avenant à ce document.
2. **Secrets de production** à définir hors du dépôt : `PAYLOAD_SECRET` (sa rotation invalide les
   liens de gestion et de relance déjà envoyés : à planifier), `CRON_SECRET` (sans lui, aucune
   tâche ne tourne : relances, réconciliation, purge), `PAYMENT_GATEWAY_*`, `WHATSAPP_*`.
3. **Succès non appliqué** : si `applySuccessfulPayment` échoue après la transition (base
   indisponible), la tentative reste `succeeded` sans effet sur la réservation ; le voyageur voit
   « en attente » (`isPaymentApplied`). Aucune reprise automatique : prévoir une alerte ou une
   procédure manuelle avant l'ouverture.

## Recommandations non bloquantes

- Limiter le débit du démarrage de paiement par panier (aujourd'hui protégé par l'unicité de la
  tentative active, pas par un plafond de fréquence).
- Surveiller les évènements `invalid_signature` de `paymentEvents` (alerte au-delà de quelques par
  heure).
