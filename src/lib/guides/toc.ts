// Table des matières d'un guide (004, FR-004, research R2). Pur : extraite des H2 du corps
// Lexical ; les mêmes ancres sont posées sur les titres par le rendu (GuideRichText), en
// parcourant les H2 dans le même ordre avec un nouveau registre `seen`.

export const MIN_TOC_ENTRIES = 3;

export type TocEntry = { id: string; text: string };

type LexicalNode = { type?: unknown; tag?: unknown; text?: unknown; children?: unknown };

const isNode = (value: unknown): value is LexicalNode =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const childrenOf = (node: LexicalNode): LexicalNode[] =>
  Array.isArray(node.children) ? node.children.filter(isNode) : [];

/** Texte brut d'un nœud (texte, liens, mises en forme). */
export const nodeText = (node: LexicalNode): string =>
  typeof node.text === 'string' ? node.text : childrenOf(node).map(nodeText).join('');

const slugOf = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Ancre d'un intertitre, numérotée si le même texte revient (`seen` est modifié). */
export const headingAnchor = (text: string, seen: Map<string, number>): string => {
  const base = slugOf(text) || 'section';
  const count = (seen.get(base) ?? 0) + 1;
  seen.set(base, count);
  return count === 1 ? base : `${base}-${count}`;
};

/** Le nœud est-il un intertitre H2 ? */
export const isH2 = (node: unknown): boolean =>
  isNode(node) && node.type === 'heading' && node.tag === 'h2';

/** Entrées de la table des matières, dans l'ordre du texte. */
export const tocOf = (state: unknown): TocEntry[] => {
  if (!isNode(state)) return [];
  const root = 'root' in state && isNode(state.root) ? state.root : state;
  const seen = new Map<string, number>();
  return childrenOf(root)
    .filter(isH2)
    .map((node) => {
      const text = nodeText(node).trim();
      return { id: headingAnchor(text, seen), text };
    });
};
