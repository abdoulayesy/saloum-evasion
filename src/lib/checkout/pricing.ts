// Tarification des lignes du panier (002, T014 ; FR-008, FR-009, FR-041). Module pur, sans
// dépendance : montants en XOF entiers, calculés côté serveur à partir de la source unique des
// prix (offre et réglages du site). Le prix est figé au paiement dans la réservation.

export type Season = { from: string; to: string };

/**
 * Tarif enfant d'une offre (FR-041). Les bornes d'âge (inclusives) servent aux libellés du
 * formulaire : le panier stocke des effectifs déjà classés (`children` = de `childMinAge` à
 * `childMaxAge`, `infants` = moins de `childMinAge`, gratuits ; au-delà, adulte).
 */
export type ChildPricing = { childPercent: number; childMinAge: number; childMaxAge: number };

export const DEFAULT_CHILD_PRICING: ChildPricing = {
  childPercent: 50,
  childMinAge: 4,
  childMaxAge: 11,
};

const DAY_MS = 24 * 60 * 60 * 1000;

const toDate = (iso: string): Date => new Date(`${iso.slice(0, 10)}T00:00:00Z`);

/** Jour au format MM-JJ. */
const monthDay = (iso: string): string => iso.slice(5, 10);

/** Date en saison haute : intervalles MM-JJ inclusifs, y compris à cheval sur le nouvel an. */
export const isHighSeason = (iso: string, seasons: readonly Season[]): boolean => {
  const day = monthDay(iso);
  return seasons.some(({ from, to }) =>
    from <= to ? day >= from && day <= to : day >= from || day <= to,
  );
};

/** Nuits entre deux dates (AAAA-MM-JJ), chacune datée du soir où elle commence. */
export const nightsBetween = (startDate: string, endDate: string): string[] => {
  const nights: string[] = [];
  for (let time = toDate(startDate).getTime(); time < toDate(endDate).getTime(); time += DAY_MS) {
    nights.push(new Date(time).toISOString().slice(0, 10));
  }
  return nights;
};

export type PriceResult = { total: number; unitPrice: number };

export const accommodationPrice = (
  offer: { lowSeasonPerNight: number; highSeasonPerNight: number },
  stay: { startDate: string; endDate: string },
  seasons: readonly Season[],
): PriceResult & { nights: number } => {
  const nights = nightsBetween(stay.startDate, stay.endDate);
  const total = nights.reduce(
    (sum, night) =>
      sum + (isHighSeason(night, seasons) ? offer.highSeasonPerNight : offer.lowSeasonPerNight),
    0,
  );
  return {
    nights: nights.length,
    unitPrice: nights.length > 0 ? Math.round(total / nights.length) : 0,
    total,
  };
};

export type Travellers = { adults: number; children: number; infants: number };

/** Nombre de places occupées (bébés compris). */
export const headcount = ({ adults, children, infants }: Travellers): number =>
  adults + children + infants;

/** Prix enfant arrondi à l'entier XOF. */
export const childUnitPrice = (unit: number, child: ChildPricing): number =>
  Math.round((unit * child.childPercent) / 100);

const perPersonTotal = (unit: number, travellers: Travellers, child: ChildPricing): number =>
  travellers.adults * unit + childUnitPrice(unit, child) * travellers.children;

export const experiencePrice = (
  offer: { pricePerPerson: number; child: ChildPricing },
  travellers: Travellers,
): PriceResult => ({
  unitPrice: offer.pricePerPerson,
  total: perPersonTotal(offer.pricePerPerson, travellers, offer.child),
});

export const stayPrice = (
  offer: { lowSeasonPerPerson: number; highSeasonPerPerson: number; child: ChildPricing },
  booking: Travellers & { startDate: string },
  seasons: readonly Season[],
): PriceResult => {
  const unit = isHighSeason(booking.startDate, seasons)
    ? offer.highSeasonPerPerson
    : offer.lowSeasonPerPerson;
  return { unitPrice: unit, total: perPersonTotal(unit, booking, offer.child) };
};

export type TransferTier = { maxPassengers: number; pricePerVehicle: number };

/**
 * Transfert facturé par véhicule selon la tranche de passagers (FR-041), bébés compris (une place
 * chacun). Au-delà de la plus grande tranche, véhicules supplémentaires au plus juste.
 */
export const transferPrice = (
  tiers: readonly TransferTier[],
  passengers: number,
): { total: number; vehicles: number } => {
  const sorted = [...tiers].sort((a, b) => a.maxPassengers - b.maxPassengers);
  const largest = sorted.at(-1);
  if (!largest || passengers <= 0) return { total: 0, vehicles: 0 };
  const tierFor = (count: number) => sorted.find((tier) => count <= tier.maxPassengers) ?? largest;
  let remaining = passengers;
  let total = 0;
  let vehicles = 0;
  while (remaining > 0) {
    const load = Math.min(remaining, largest.maxPassengers);
    // Dernier véhicule : la plus petite tranche suffisante.
    const tier = remaining <= largest.maxPassengers ? tierFor(remaining) : largest;
    total += tier.pricePerVehicle;
    vehicles += 1;
    remaining -= load;
  }
  return { total, vehicles };
};
