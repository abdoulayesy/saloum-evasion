# Mesure d'audience et entonnoir du tunnel (002, T106)

Plausible, sans cookie ni donnée personnelle (constitution, page Confidentialité). Les pages vues
sont envoyées par le script Plausible ; les évènements du tunnel viennent du navigateur
(`src/lib/analytics.ts`, composant `TrackEvent`) ou du serveur pour tout ce qui touche au paiement
(`src/lib/analyticsServer.ts`, API Events) : un paiement confirmé par notification de l'agrégateur
n'a pas de navigateur, et un bloqueur de publicité ne doit pas fausser les chiffres de vente.

Variables : `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (sans elle, aucune mesure, ni client ni serveur) et
`PLAUSIBLE_EVENTS_API` (défaut `https://plausible.io/api/event`).

## Objectifs à créer dans Plausible

Réglages du site → **Goals** → « Add goal » → *Custom event*, un objectif par nom ci-dessous (les
noms doivent correspondre exactement).

| Objectif | Source | Quand | Propriétés |
|---|---|---|---|
| `cart_item_added` | navigateur | arrivée au panier après un ajout | `items` |
| `cart_view` | navigateur | affichage du panier | `items` |
| `checkout_details_view` | navigateur | étape coordonnées | — |
| `checkout_payment_view` | navigateur | étape paiement | `deposit` (acompte proposé) |
| `payment_started` | serveur | redirection vers la page de paiement | `method`, `plan`, `locale` |
| `payment_succeeded` | serveur | paiement confirmé et appliqué | `method`, `locale` |
| `payment_failed` | serveur | refus, solde insuffisant, erreur, agrégateur indisponible | `method`, `reason`, `locale` |
| `payment_abandoned` | serveur | page de paiement quittée ou délai expiré | `method`, `status`, `locale` |
| `checkout_completed` | serveur | fin du parcours (même moment que le succès) | `method`, `locale`, `duration`, `durationSeconds` |
| `payment_recovered` | serveur | paiement après ouverture d'un lien de relance | `method`, `locale`, `channel`, `rank` |
| `cancellation_requested` | serveur | demande d'annulation du voyageur | `reason`, `lines` |

Réglages du site → **Custom properties** : ajouter `method`, `locale`, `plan`, `reason`, `status`,
`duration`, `channel`, `rank`, `deposit`, `items` pour pouvoir filtrer et ventiler.

## Entonnoir

Réglages du site → **Funnels** (offre Business de Plausible) → « Paiement » :

1. `cart_view`
2. `checkout_details_view`
3. `checkout_payment_view`
4. `payment_started`
5. `payment_succeeded`

Les étapes 1 à 3 sont mesurées dans le navigateur, 4 et 5 sur le serveur : Plausible relie les
étapes par visiteur, ce qui est impossible sans cookie pour un évènement serveur. **Lire
l'entonnoir étape par étape (volumes), pas comme un taux de conversion par visiteur.** Sans l'offre
Business, comparer les volumes des objectifs sur la même période.

## Indicateurs (FR-040)

Tous ventilables par langue (`locale`, ou chemin `/fr/…` / `/en/…` pour les évènements navigateur)
et par moyen de paiement (`method`).

| Indicateur | Calcul dans Plausible |
|---|---|
| Paniers créés | objectif `cart_item_added` (visiteurs uniques) |
| Arrivées à l'étape paiement | objectif `checkout_payment_view` |
| Paiements réussis | objectif `payment_succeeded` |
| Paiements échoués | objectif `payment_failed`, ventilé par `reason` |
| Paiements abandonnés | objectif `payment_abandoned`, ventilé par `status` |
| Taux de réussite par moyen | `payment_succeeded` ÷ `payment_started`, filtre `method` |
| Paiements récupérés après relance (SC-005) | objectif `payment_recovered`, ventilé par `channel` et `rank` |
| Temps du parcours (SC-001 : 3 min) | objectif `checkout_completed`, ventilé par `duration` |

**Temps médian** : Plausible ne calcule pas de médiane sur une propriété. La tranche `duration`
(`< 1 min`, `1–3 min`, `3–5 min`, `5–10 min`, `10–30 min`, `≥ 30 min`) donne la lecture directe :
la médiane est dans la tranche où le cumul des parcours dépasse 50 %. Pour une valeur exacte,
exporter la ventilation de `durationSeconds` par l'API Stats (`/api/v2/query`, dimension
`event:props:durationSeconds`, filtre sur l'objectif `checkout_completed`) et calculer la médiane
dans un tableur.

La durée va de la création du panier au paiement confirmé : elle inclut le temps passé sur la page
de l'agrégateur et, pour un panier repris après une relance, le temps écoulé avant la reprise.
Pour SC-001 (test utilisateur, T105), mesurer le parcours au chronomètre.
