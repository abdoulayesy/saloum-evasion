// Contenu de DÉMONSTRATION (développement et tests uniquement, jamais en production) :
// textes génériques et images de remplacement clairement marquées, pour exercer les règles
// de publication (300 mots, unicité SEO, galeries, conditions d'annulation).

type Lang = 'fr' | 'en';

const sentences: Record<Lang, string[]> = {
  fr: [
    'Ce texte de démonstration décrit une offre fictive destinée à tester le site.',
    'Les bolongs du Sine-Saloum serpentent entre les palétuviers et les îles de coquillages.',
    'Les pirogues glissent au rythme des marées, loin du bruit de la ville.',
    'Les hôtes de Ndangane accueillent les voyageurs avec un thé à la menthe et du temps.',
    'Le programme laisse de la place au repos, à la baignade et à la conversation.',
    'Les repas mettent en avant le poisson du jour, les huîtres de mangrove et le riz local.',
    'Chaque sortie est encadrée par un guide du village qui connaît les oiseaux et les chenaux.',
    'Le transfert depuis Dakar ou l’aéroport peut être organisé à la demande.',
    'Les conditions d’annulation sont indiquées clairement avant toute réservation.',
    'Ce paragraphe sera remplacé par le texte réel rédigé par l’équipe avant le lancement.',
  ],
  en: [
    'This demonstration text describes a fictitious offer used to test the website.',
    'The Sine-Saloum bolongs wind between mangrove trees and shell islands.',
    'Pirogues glide with the tides, far from the noise of the city.',
    'Hosts in Ndangane welcome travellers with mint tea and plenty of time.',
    'The programme leaves room for rest, swimming and conversation.',
    'Meals feature the catch of the day, mangrove oysters and local rice.',
    'Every outing is led by a village guide who knows the birds and the channels.',
    'Transfers from Dakar or the airport can be arranged on request.',
    'Cancellation terms are shown clearly before any booking.',
    'This paragraph will be replaced by real copy written by the team before launch.',
  ],
};

type LexicalText = {
  type: 'text';
  text: string;
  version: 1;
  format: 0;
  detail: 0;
  mode: 'normal';
  style: '';
};
type LexicalParagraph = {
  type: 'paragraph';
  version: 1;
  direction: 'ltr';
  format: '';
  indent: 0;
  textFormat: 0;
  textStyle: '';
  children: LexicalText[];
};

export type LexicalState = {
  root: {
    type: 'root';
    version: 1;
    direction: 'ltr';
    format: '';
    indent: 0;
    children: LexicalParagraph[];
  };
};

const paragraph = (text: string): LexicalParagraph => ({
  type: 'paragraph',
  version: 1,
  direction: 'ltr',
  format: '',
  indent: 0,
  textFormat: 0,
  textStyle: '',
  children: [{ type: 'text', text, version: 1, format: 0, detail: 0, mode: 'normal', style: '' }],
});

export const richText = (paragraphs: string[]): LexicalState => ({
  root: {
    type: 'root',
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    children: paragraphs.map(paragraph),
  },
});

/** Texte de démonstration d'au moins `minWords` mots, introduit par le sujet. */
export const demoBody = (lang: Lang, subject: string, minWords = 320): LexicalState => {
  const pool = sentences[lang];
  const paragraphs: string[] = [subject];
  let words = subject.split(/\s+/).length;
  let index = 0;
  while (words < minWords) {
    const chunk = Array.from(
      { length: 5 },
      (_, offset) => pool[(index + offset) % pool.length] ?? '',
    ).join(' ');
    paragraphs.push(chunk);
    words += chunk.split(/\s+/).length;
    index += 5;
  }
  return richText(paragraphs);
};

export type Bilingual = { fr: string; en: string };

export const destinations: {
  key: string;
  kind: 'village' | 'ile' | 'reserve';
  name: Bilingual;
  lat: number;
  lng: number;
}[] = [
  {
    key: 'ndangane',
    kind: 'village',
    name: { fr: 'Ndangane', en: 'Ndangane' },
    lat: 14.115,
    lng: -16.76,
  },
  {
    key: 'mar-lodj',
    kind: 'ile',
    name: { fr: 'Mar Lodj', en: 'Mar Lodj' },
    lat: 14.07,
    lng: -16.75,
  },
  {
    key: 'ile-aux-oiseaux',
    kind: 'reserve',
    name: { fr: 'Île aux Oiseaux', en: 'Bird Island' },
    lat: 13.93,
    lng: -16.68,
  },
  {
    key: 'joal-fadiouth',
    kind: 'village',
    name: { fr: 'Joal-Fadiouth', en: 'Joal-Fadiouth' },
    lat: 14.16,
    lng: -16.83,
  },
  {
    key: 'palmarin',
    kind: 'village',
    name: { fr: 'Palmarin', en: 'Palmarin' },
    lat: 14.0,
    lng: -16.78,
  },
  {
    key: 'djiffer',
    kind: 'village',
    name: { fr: 'Djiffer', en: 'Djiffer' },
    lat: 13.95,
    lng: -16.75,
  },
];

export const universes: {
  key: string;
  kind: 'experience' | 'stay';
  name: Bilingual;
  slug: Bilingual;
}[] = [
  {
    key: 'mangrove',
    kind: 'experience',
    name: { fr: 'Mangrove & îles', en: 'Mangrove & islands' },
    slug: { fr: 'mangrove-et-iles', en: 'mangrove-and-islands' },
  },
  {
    key: 'terre',
    kind: 'experience',
    name: { fr: 'Terre & villages', en: 'Land & villages' },
    slug: { fr: 'terre-et-villages', en: 'land-and-villages' },
  },
  {
    key: 'table',
    kind: 'experience',
    name: { fr: 'Table du Saloum', en: 'Saloum table' },
    slug: { fr: 'table-du-saloum', en: 'saloum-table' },
  },
  {
    key: 'sejours',
    kind: 'stay',
    name: { fr: 'Séjours & hébergements', en: 'Stays & lodging' },
    slug: { fr: 'sejours-et-hebergements', en: 'stays-and-lodging' },
  },
];
