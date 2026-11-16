# Contrat — Évènements de mesure du tunnel (Plausible, sans cookie)

Complète [analytics 001](../../001-site-public-vitrine/contracts/analytics-events.md). Mêmes
règles : **aucune donnée personnelle**, aucune référence de réservation, aucun montant exact
(tranches seulement). Les évènements de paiement sont émis **côté serveur** (API Events de
Plausible appelée depuis la file), car le visiteur peut ne jamais revenir sur le site après
avoir payé dans son application (FR-020).

| Évènement | Émis par | Déclencheur | Propriétés |
|---|---|---|---|
| `cart_item_added` | client | succès `addToCart` | `offerType`, `pageType`, `locale` |
| `cart_view` | client | affichage du panier | `itemsCount`, `hasAccommodation` |
| `checkout_details_view` | client | étape coordonnées | `itemsCount` |
| `checkout_payment_view` | client | étape paiement | `depositEligible` |
| `payment_started` | serveur | `startPayment` OK | `method`, `plan`, `locale`, `amountBand` (`<100k`\|`100-250k`\|`250-500k`\|`>500k`) |
| `payment_succeeded` | serveur | notification `succeeded` | `method`, `plan`, `locale`, `amountBand`, `durationBucket` (`<3min`\|`3-5min`\|`>5min`, depuis le premier `cart_item_added` de la session panier) |
| `payment_failed` | serveur | notification `failed` / `expired` | `method`, `reason` |
| `payment_recovered` | serveur | paiement réussi après une relance | `channel`, `rank` (1\|2) |
| `cancellation_requested` | serveur | `requestCancellation` | `daysBeforeArrivalBand` |

**Indicateurs dérivés** (FR-040) :

- Entonnoir : `cart_view` → `checkout_details_view` → `checkout_payment_view` →
  `payment_started` → `payment_succeeded`, par `locale` et `method`.
- Part des paiements en moins de 3 minutes (`durationBucket = <3min`, suivi terrain de SC-001).
- Taux de récupération = `payment_recovered` / (paniers relancés) (SC-005).
