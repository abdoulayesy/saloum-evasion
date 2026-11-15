// Séjours similaires (FR-002, seo CHK039) : choix manuel de l'éditeur s'il existe ; sinon,
// même destination d'abord, puis le plus d'envies communes, puis les séjours mis en avant.
// 3 au maximum, jamais le séjour courant.

export type SimilarCandidate = {
  id: number;
  destinationIds: readonly number[];
  moods: readonly string[];
  featured: boolean;
};

export const SIMILAR_MAX = 3;

export const selectSimilarStays = <T extends SimilarCandidate>(
  current: SimilarCandidate,
  candidates: readonly T[],
  manualIds: readonly number[] = [],
): T[] => {
  const others = candidates.filter((candidate) => candidate.id !== current.id);
  if (manualIds.length > 0) {
    return manualIds
      .map((id) => others.find((candidate) => candidate.id === id))
      .filter((candidate): candidate is T => candidate !== undefined)
      .slice(0, SIMILAR_MAX);
  }
  const score = (candidate: SimilarCandidate) => ({
    sameDestination: candidate.destinationIds.some((id) => current.destinationIds.includes(id)),
    commonMoods: candidate.moods.filter((mood) => current.moods.includes(mood)).length,
  });
  return [...others]
    .sort((a, b) => {
      const sa = score(a);
      const sb = score(b);
      if (sa.sameDestination !== sb.sameDestination) return sa.sameDestination ? -1 : 1;
      if (sa.commonMoods !== sb.commonMoods) return sb.commonMoods - sa.commonMoods;
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.id - b.id;
    })
    .slice(0, SIMILAR_MAX);
};
