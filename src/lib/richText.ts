// Texte brut d'un état Lexical (JSON-LD : réponses de FAQ, descriptions du programme).

type LexicalNode = { type?: unknown; text?: unknown; children?: unknown };

const isNode = (value: unknown): value is LexicalNode =>
  typeof value === 'object' && value !== null;

const BLOCK_TYPES = new Set(['paragraph', 'heading', 'listitem', 'quote']);

const walk = (node: unknown): string => {
  if (!isNode(node)) return '';
  if (typeof node.text === 'string') return node.text;
  const children = Array.isArray(node.children) ? node.children.map(walk).join('') : '';
  return typeof node.type === 'string' && BLOCK_TYPES.has(node.type) ? `${children}\n` : children;
};

export const lexicalToPlainText = (state: unknown): string => {
  if (!isNode(state)) return '';
  const root: unknown = 'root' in state ? state.root : state;
  return walk(root)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ');
};
