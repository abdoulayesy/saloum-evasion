// Brouillons Markdown des guides (004, research R10, content/carnets/README.md). Pur.
// En-tête volontairement simple, sans dépendance YAML : `clé: valeur`, listes `[a, b]`,
// booléens, une table imbriquée d'un niveau (`related:` puis lignes indentées) ; commentaires
// `  # …` en fin de ligne. Corps : Markdown et encadrés pratiques `:::encadre info|attention Titre`.

export type DraftValue = string | boolean | string[] | Record<string, string[]>;

export type DraftSegment =
  | { kind: 'markdown'; markdown: string }
  | { kind: 'box'; variant: 'info' | 'warning'; title: string; text: string };

export type Draft = { meta: Record<string, DraftValue>; segments: DraftSegment[] };

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

const stripComment = (value: string): string => value.replace(/\s+#.*$/, '').trim();

const unquote = (value: string): string =>
  /^(["']).*\1$/.test(value) ? value.slice(1, -1) : value;

const listOf = (value: string): string[] =>
  value
    .slice(1, -1)
    .split(',')
    .map((item) => unquote(item.trim()))
    .filter((item) => item !== '');

const scalar = (raw: string): string | boolean | string[] => {
  const value = stripComment(raw);
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value.startsWith('[') && value.endsWith(']')) return listOf(value);
  return unquote(value);
};

const parseMeta = (block: string): Record<string, DraftValue> => {
  const meta: Record<string, DraftValue> = {};
  let table: Record<string, string[]> | null = null;
  for (const line of block.split(/\r?\n/)) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    const nested = /^\s+([\w-]+):\s*(.*)$/.exec(line);
    if (nested && table) {
      const value = scalar(nested[2] ?? '');
      table[nested[1] ?? ''] = Array.isArray(value) ? value : [];
      continue;
    }
    const entry = /^([\w-]+):\s*(.*)$/.exec(line);
    if (!entry) continue;
    const key = entry[1] ?? '';
    const rest = stripComment(entry[2] ?? '');
    if (rest === '') {
      table = {};
      meta[key] = table;
    } else {
      table = null;
      meta[key] = scalar(rest);
    }
  }
  return meta;
};

const BOX_START = /^:::encadre\s+(info|attention)\s+(.+)$/;

const parseBody = (body: string): DraftSegment[] => {
  const segments: DraftSegment[] = [];
  let markdown: string[] = [];
  const flush = () => {
    const text = markdown.join('\n').trim();
    if (text !== '') segments.push({ kind: 'markdown', markdown: text });
    markdown = [];
  };
  const lines = body.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const start = BOX_START.exec(lines[index]?.trim() ?? '');
    if (!start) {
      markdown.push(lines[index] ?? '');
      continue;
    }
    const end = lines.findIndex((line, at) => at > index && line.trim() === ':::');
    if (end === -1)
      throw new Error(`Encadré non fermé : « ${start[2] ?? ''} » (ligne ${index + 1}).`);
    flush();
    segments.push({
      kind: 'box',
      variant: start[1] === 'attention' ? 'warning' : 'info',
      title: (start[2] ?? '').trim(),
      text: lines
        .slice(index + 1, end)
        .join('\n')
        .trim(),
    });
    index = end;
  }
  flush();
  return segments;
};

export const parseDraft = (source: string): Draft => {
  const match = FRONT_MATTER.exec(source.replace(/^﻿/, ''));
  if (!match) throw new Error('Brouillon sans en-tête (--- … ---).');
  return { meta: parseMeta(match[1] ?? ''), segments: parseBody(match[2] ?? '') };
};
