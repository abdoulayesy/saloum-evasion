// Extrait borné d'un texte libre (004 : title et description d'une page d'auteur). Pur :
// espaces normalisés, coupe au dernier mot entier, « … » compris dans la longueur.
export const excerpt = (text: string, max: number): string => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const room = clean.slice(0, max - 1);
  const lastSpace = room.lastIndexOf(' ');
  const cut = lastSpace > 0 ? room.slice(0, lastSpace) : room;
  return `${cut.replace(/[\s,;:.]+$/, '')}…`;
};
