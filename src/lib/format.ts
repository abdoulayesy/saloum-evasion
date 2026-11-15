// Formatage des faits clés des expériences (durée, saison). Pur et testé.

/** « 45 min », « 3 h », « 1 h 30 ». */
export const formatDuration = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${String(minutes).padStart(2, '0')}`;
};

/**
 * Saison à partir des mois (1 à 12) : « Toute l'année » si 12 mois, « novembre à avril » si
 * les mois forment une seule période (y compris à cheval sur l'année), sinon la liste.
 */
export const formatSeason = (
  months: readonly number[],
  monthName: (month: number) => string,
  labels: { allYear: string; range: (from: string, to: string) => string },
): string => {
  const set = [...new Set(months)]
    .filter((month) => month >= 1 && month <= 12)
    .sort((a, b) => a - b);
  if (set.length === 0) return '';
  if (set.length === 12) return labels.allYear;
  if (set.length === 1) return monthName(set[0] ?? 1);
  // Début de période : un mois dont le précédent (circulairement) n'est pas dans la saison.
  const starts = set.filter((month) => !set.includes(month === 1 ? 12 : month - 1));
  if (starts.length !== 1) return set.map(monthName).join(', ');
  const start = starts[0] ?? set[0] ?? 1;
  const end = ((start - 1 + set.length - 1) % 12) + 1;
  return labels.range(monthName(start), monthName(end));
};
