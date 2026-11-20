// Prestation indisponible (002, US4, T089 ; FR-005, FR-030). Module pur : l'équipe propose au
// plus deux alternatives ; le voyageur choisit une alternative ou le remboursement intégral de la
// prestation dans les 48 heures, faute de quoi elle est remboursée intégralement. Jamais de
// supplément : une alternative plus chère est facturée au prix d'origine ; un écart en faveur du
// voyageur lui est remboursé (sur ce qu'il a déjà payé ; le reste réduit son solde).

export const MAX_ALTERNATIVES = 2;
export const CHOICE_DELAY_HOURS = 48;

const HOUR_MS = 60 * 60 * 1000;

export type TravellerChoice = 'alternative_1' | 'alternative_2' | 'refund';

/** Date limite du choix du voyageur : 48 h après le constat d'indisponibilité. */
export const choiceDeadline = (unavailableAt: string): string =>
  new Date(new Date(unavailableAt).getTime() + CHOICE_DELAY_HOURS * HOUR_MS).toISOString();

/** Erreurs des alternatives saisies par l'équipe (vide si valide). */
export const alternativeErrors = (
  alternatives: ReadonlyArray<{ title?: string | null; price?: number | null }>,
): string[] => {
  const errors: string[] = [];
  if (alternatives.length > MAX_ALTERNATIVES)
    errors.push('Deux alternatives au plus pour une prestation indisponible.');
  if (alternatives.some((alternative) => !alternative.title?.trim()))
    errors.push('Chaque alternative doit avoir un libellé.');
  if (
    alternatives.some(
      (alternative) =>
        typeof alternative.price !== 'number' ||
        !Number.isInteger(alternative.price) ||
        alternative.price < 0,
    )
  )
    errors.push('Prix de l’alternative : montant en FCFA entier.');
  return errors;
};

export type AlternativeOutcome = {
  /** Nouveau total de la ligne : jamais au-dessus du prix d'origine. */
  lineTotal: number;
  /** Écart déjà payé à rembourser au voyageur. */
  refund: number;
  /** Baisse du total de la réservation (le solde éventuel baisse d'autant, moins le remboursé). */
  totalReduction: number;
};

/** Effet du choix d'une alternative sur la ligne, le total et le remboursement. */
export const alternativeOutcome = ({
  originalTotal,
  paidForLine,
  alternativePrice,
}: {
  originalTotal: number;
  paidForLine: number;
  alternativePrice: number;
}): AlternativeOutcome => {
  const lineTotal = Math.min(originalTotal, alternativePrice);
  return {
    lineTotal,
    refund: Math.max(0, paidForLine - lineTotal),
    totalReduction: originalTotal - lineTotal,
  };
};

/** Remboursement intégral automatique : indisponible, sans choix, délai de 48 h passé. */
export const isAutoRefundDue = (
  line: {
    availabilityStatus: string;
    travellerChoice?: TravellerChoice | null;
    choiceDeadline?: string | null;
    cancelled?: boolean | null;
  },
  now: Date,
): boolean =>
  line.availabilityStatus === 'unavailable' &&
  !line.travellerChoice &&
  !line.cancelled &&
  Boolean(line.choiceDeadline) &&
  new Date(line.choiceDeadline ?? '').getTime() <= now.getTime();
