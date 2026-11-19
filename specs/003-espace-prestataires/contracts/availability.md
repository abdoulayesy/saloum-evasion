# Contrat — Disponibilités : calcul, rétention, API publique

Module pur `src/lib/availability/` (sans dépendance, tests unitaires exhaustifs) et fonctions
SQL appelées par les Server Actions et le traitement des paiements de la 002.

## Fonctions pures

```ts
type Slot = { date: string; slot: string };              // slot '' pour nuits et transferts
type InventoryRow = { date: string; slot: string; capacity: number; closed: boolean; sold: number; held: number };
type WeeklyEntry = { weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7; slot: string; capacity: number };

remaining(row: InventoryRow): number;                    // closed ? 0 : max(0, capacity - sold - held)
effectiveRow(date, slot, rows, template, unitCapacity?): InventoryRow;  // ligne ou semaine type
isBookableDay(date, slot, cutoff 'HH:mm', now): boolean; // délai minimum (veille 20 h par défaut)
unitFreeForNights(rows, nights[]): boolean;
allocateUnit(units, rowsByUnit, nights[], travellers): unitId | null;   // R3
stayAvailability(components, arrival, lookup): { available: boolean; blocking?: Component };  // R4
vehiclesNeeded(passengers, tiers): number;               // réutilise transferPrice (002)
nextAvailableDates(offer, from, count = 3): string[];    // proposition sans JavaScript
```

## Rétention et vente (transaction SQL)

1. **`holdInventory(paymentId, items[])`** — appelée à la création de la tentative de paiement
   (002, `startPayment`). Pour chaque élément : matérialise la ligne d'inventaire si absente
   (depuis la semaine type), puis
   `UPDATE inventory SET held = held + :q WHERE id = :id AND NOT closed AND capacity - sold - held >= :q`.
   Si une mise à jour n'affecte aucune ligne : **annulation de toute la transaction** et
   `conflict: offer_unavailable` (avec la ligne bloquante). Sinon crée les `inventoryHolds`.
2. **`convertHolds(paymentId)`** — au succès du paiement (notification 002, même transaction que
   la mise à jour de la réservation) : `held −= q`, `sold += q`, holds `converted`.
3. **`releaseHolds(paymentId)`** — échec, abandon, expiration (tâche de réconciliation 002 qui
   passe déjà les tentatives à `expired`) : `held −= q`, holds `released`.
4. **`releaseSold(bookingLine)`** — annulation validée d'une ligne (002, US4) : `sold −= q` sur les
   lignes `inventoryRefs`.

Idempotence : chaque fonction ne traite que les holds dans l'état attendu ; rejouer une
notification ne vend jamais deux fois.

## API publique

### `GET /api/availability`

Paramètres : `offerType` (`accommodation` \| `stay` \| `experience` \| `table` \| `transfer`),
`offer` (identifiant), `from`, `to` (AAAA-MM-JJ, ≤ 62 jours), `guests` (facultatif, pour
filtrer les unités trop petites), `nights` (séjours et hébergements).

Réponse (`200`, JSON compact) :

```json
{
  "offer": 12,
  "days": [
    { "date": "2027-02-10", "status": "open", "slots": [{ "slot": "09:00", "left": 4 }, { "slot": "17:30", "left": 0 }] },
    { "date": "2027-02-11", "status": "closed" }
  ]
}
```

- Hébergements et séjours : `status` par date d'arrivée possible (`open` si une unité, ou tous les
  composants, sont libres pour `nights` nuits) ; pas de `slots`.
- Expériences, tables, transferts : `left` par créneau (ou par jour pour un transfert, en
  véhicules) ; jamais de valeur supérieure à 20 (pas d'exposition du stock exact au-delà).
- `Cache-Control: public, s-maxage=20, stale-while-revalidate=20` (fraîcheur ≤ 40 s, FR-011) ;
  `X-Robots-Tag: noindex`.
- `400` si paramètres invalides ; `404` si l'offre n'est pas publiée et `bookable`.
- Limite : 120 requêtes / min / IP hachée (`rateLimits` de la 001).

### Intégration au panier (002)

- `addToCart` et `updateCartLine` refusent une date indisponible (`conflict: offer_unavailable`)
  et renvoient `nextAvailableDates` ; sans JavaScript, la fiche affiche ces dates en lien.
- La vérification au panier est **indicative** ; seule `holdInventory` au paiement fait foi.

## Tests

- Unitaires : `remaining`, semaine type vs lignes, délai minimum (veille 20 h, Dakar),
  attribution d'unités (capacité, ordre, changement d'unité refusé), intersection des
  composants d'un séjour, véhicules au-delà de 14 passagers, `nextAvailableDates`.
- Intégration (base de test) : deux `holdInventory` concurrents sur la dernière place → un seul
  réussit ; rejeu de `convertHolds` sans effet ; expiration qui libère ; annulation qui libère.
- E2E `@availability` : date fermée dans l'espace absente du formulaire public en moins d'une
  minute ; créneau complet refusé avant paiement ; formulaire sans JavaScript.
