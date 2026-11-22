import { addDays } from './deposit';
import {
  accommodationPrice,
  DEFAULT_CHILD_PRICING,
  experiencePrice,
  transferPrice,
  type Season,
  type TransferTier,
} from './pricing';

// Composer mon séjour (maquette « Composer mon séjour ») : plan des lignes du panier et estimation
// du total à partir des mêmes fonctions de prix que le panier. Module pur : utilisé par la Server
// Action (qui recalcule tout côté serveur) et par l'îlot client (estimation affichée).

export const COMPOSE_LIMITS = { minNights: 1, maxNights: 14, minGuests: 1, maxGuests: 12 } as const;

/** Heures par défaut du transfert (ajustables ensuite dans le panier ou avec l'hôte). */
export const DEFAULT_TRANSFER_TIMES = { outbound: '10:00', return: '15:00' } as const;

export type ComposeLodging = {
  id: number;
  lowSeasonPerNight: number;
  highSeasonPerNight: number;
};

export type ComposeExperience = {
  id: number;
  offerType: 'experience' | 'table';
  pricePerPerson: number;
  childPercent: number;
  slots: readonly string[];
};

export type ComposeTransfer = { id: number; tiers: readonly TransferTier[] };

export type ComposeChoice = {
  startDate: string;
  nights: number;
  guests: number;
  lodging: ComposeLodging;
  experiences: readonly ComposeExperience[];
  transfer: ComposeTransfer | null;
};

export type PlannedLine =
  | { offerType: 'accommodation'; offerId: number; startDate: string; endDate: string }
  | {
      offerType: 'experience' | 'table';
      offerId: number;
      date: string;
      slot: string;
    }
  | {
      offerType: 'transfer';
      offerId: number;
      outboundDate: string;
      outboundTime: string;
      returnDate: string;
      returnTime: string;
    };

export const clampNights = (value: number): number =>
  Math.min(COMPOSE_LIMITS.maxNights, Math.max(COMPOSE_LIMITS.minNights, Math.round(value)));

export const clampGuests = (value: number): number =>
  Math.min(COMPOSE_LIMITS.maxGuests, Math.max(COMPOSE_LIMITS.minGuests, Math.round(value)));

/**
 * Jour de chaque expérience : dès le lendemain de l'arrivée, réparties sur le séjour (pas le jour
 * du départ quand le séjour dure plus d'une nuit) ; les tables le soir, les activités en
 * alternant les créneaux pour éviter deux sorties au même moment.
 */
const experienceDay = (startDate: string, nights: number, index: number): string => {
  if (nights <= 1) return startDate;
  return addDays(startDate, 1 + (index % (nights - 1)));
};

const experienceSlot = (experience: ComposeExperience, index: number): string | null => {
  const { slots } = experience;
  if (slots.length === 0) return null;
  if (experience.offerType === 'table') return slots[slots.length - 1] ?? null;
  return slots[index % slots.length] ?? null;
};

/** Lignes à créer dans le panier (un transfert aller-retour = une entrée, deux lignes). */
export const planComposition = (choice: ComposeChoice): PlannedLine[] => {
  const nights = clampNights(choice.nights);
  const endDate = addDays(choice.startDate, nights);
  const lines: PlannedLine[] = [
    {
      offerType: 'accommodation',
      offerId: choice.lodging.id,
      startDate: choice.startDate,
      endDate,
    },
  ];
  let activityIndex = 0;
  choice.experiences.forEach((experience, index) => {
    const slot = experienceSlot(experience, activityIndex);
    if (!slot) return;
    if (experience.offerType === 'experience') activityIndex += 1;
    lines.push({
      offerType: experience.offerType,
      offerId: experience.id,
      date: experienceDay(choice.startDate, nights, index),
      slot,
    });
  });
  if (choice.transfer) {
    lines.push({
      offerType: 'transfer',
      offerId: choice.transfer.id,
      outboundDate: choice.startDate,
      outboundTime: DEFAULT_TRANSFER_TIMES.outbound,
      returnDate: endDate,
      returnTime: DEFAULT_TRANSFER_TIMES.return,
    });
  }
  return lines;
};

export type EstimateLine = {
  kind: 'lodging' | 'experience' | 'transfer';
  id: number;
  amount: number;
};

/** Estimation affichée (XOF entiers) : mêmes fonctions de prix que le panier, adultes seulement. */
export const estimateComposition = (
  choice: ComposeChoice,
  seasons: readonly Season[],
): { lines: EstimateLine[]; total: number; perGuest: number } => {
  const nights = clampNights(choice.nights);
  const guests = clampGuests(choice.guests);
  const travellers = { adults: guests, children: 0, infants: 0 };
  const lodging = accommodationPrice(
    choice.lodging,
    { startDate: choice.startDate, endDate: addDays(choice.startDate, nights) },
    seasons,
  );
  const lines: EstimateLine[] = [
    { kind: 'lodging', id: choice.lodging.id, amount: lodging.total },
    ...choice.experiences.map((experience) => ({
      kind: 'experience' as const,
      id: experience.id,
      amount: experiencePrice(
        {
          pricePerPerson: experience.pricePerPerson,
          child: { ...DEFAULT_CHILD_PRICING, childPercent: experience.childPercent },
        },
        travellers,
      ).total,
    })),
  ];
  if (choice.transfer) {
    // Aller et retour : deux trajets facturés chacun par véhicule.
    const leg = transferPrice(choice.transfer.tiers, guests).total;
    lines.push({ kind: 'transfer', id: choice.transfer.id, amount: leg * 2 });
  }
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  return { lines, total, perGuest: Math.round(total / guests) };
};
