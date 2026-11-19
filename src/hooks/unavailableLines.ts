import { APIError, type CollectionBeforeChangeHook } from 'payload';
import { alternativeErrors, choiceDeadline } from '@/lib/booking/availability';

// Prestation déclarée indisponible par l'équipe (002, US4, T089, FR-005) : date du constat et
// date limite du choix du voyageur (48 h) posées une fois ; alternatives vérifiées (deux au plus,
// libellé et prix entier). Le choix lui-même arrive par la page de la réservation.

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const stampUnavailableLines: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (!isRecord(data) || !Array.isArray(data.lines)) return data;
  const previousLines: unknown[] =
    isRecord(originalDoc) && Array.isArray(originalDoc.lines) ? originalDoc.lines : [];
  const now = new Date().toISOString();
  data.lines = data.lines.map((line: unknown) => {
    if (!isRecord(line) || line.availabilityStatus !== 'unavailable') return line;
    const alternatives = Array.isArray(line.alternatives) ? line.alternatives.filter(isRecord) : [];
    const [error] = alternativeErrors(
      alternatives.map((alternative) => ({
        title: typeof alternative.title === 'string' ? alternative.title : null,
        price: typeof alternative.price === 'number' ? alternative.price : null,
      })),
    );
    if (error) throw new APIError(error, 400, undefined, true);
    const previous = previousLines.find(
      (candidate) => isRecord(candidate) && candidate.lineId === line.lineId,
    );
    const alreadyUnavailable = isRecord(previous) && previous.availabilityStatus === 'unavailable';
    if (alreadyUnavailable && line.unavailableAt) return line;
    const unavailableAt = typeof line.unavailableAt === 'string' ? line.unavailableAt : now;
    return { ...line, unavailableAt, choiceDeadline: choiceDeadline(unavailableAt) };
  });
  return data;
};
