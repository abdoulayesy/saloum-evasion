import { summaryLines, summaryTotals, type SummarySource } from '@/lib/checkout/summary';
import { formatEur } from '@/lib/pricing';

// « Passeport d'évasion » (maquette du bon de réservation) : contenu des pages, calculé à partir
// de la réservation. Module pur, sans rendu : le PDF (Passport.tsx) ne fait que l'afficher.
// Aucune donnée inventée : ce que la réservation ne dit pas (matériel fourni, contact direct du
// prestataire) n'apparaît pas ; « À prévoir » ne contient que des conseils pratiques.

type Locale = 'fr' | 'en';

export type VoucherLineDetail = {
  /** Résumé de l'offre (description de l'étape). */
  summary?: string;
  meetingPoint?: string;
  durationMinutes?: number;
  destination?: string;
  slug?: string;
  universeSlug?: string;
  partnerName?: string;
  /** Titre de l'offre dans l'autre langue (sous-titre bilingue). */
  altTitle?: string;
  transferOrigin?: 'aibd' | 'dakar';
};

export type VoucherPayment = {
  method: 'wave' | 'orange_money' | 'card';
  confirmedAt: string;
  reference?: string;
};

export type VoucherData = {
  reference: string;
  locale: Locale;
  traveller: { firstName: string; lastName: string; whatsapp: string; email: string };
  status: string;
  source: SummarySource;
  availability: Record<string, string>;
  policies: { title: string; summary: string }[];
  agency: { name: string; address: string; phone?: string; whatsapp?: string; email?: string };
  details?: Record<string, VoucherLineDetail>;
  payment?: VoucherPayment;
  /** Adresse du site (dos de couverture, vérification). */
  siteUrl?: string;
};

export type IllustrationKind = 'road' | 'pirogue' | 'table' | 'birds' | 'baobab' | 'village';

export type Stamp = {
  shape: 'rect' | 'circle';
  word: string;
  /** Texte de l'anneau (cercle) ou de la ligne du bas (rectangle). */
  detail: string;
  color: string;
  rotate: number;
};

export type PassportStep = {
  number: number;
  page: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  time: string;
  place: string;
  duration: string;
  description: string;
  booked: string[];
  bring: string[];
  contact: string;
  illustration: IllustrationKind;
  stamp: Stamp;
};

export type Passport = {
  reference: string;
  locale: Locale;
  labels: PassportLabels;
  traveller: {
    surname: string;
    givenNames: string;
    travellers: string;
    language: string;
    arrival: string;
    departure: string;
    host: string;
  };
  stay: { title: string; detail: string };
  toc: { label: string; page: number }[];
  steps: PassportStep[];
  signature: string;
  paidStamp: { word: string; method: string } | null;
  mrz: [string, string];
  summary: {
    rows: { label: string; detail: string; amount: string }[];
    totals: { label: string; amount: string; strong: boolean }[];
    eur: string;
    payment: string | null;
  };
  contacts: { title: string; lines: string[] }[];
  conditions: string[];
  verify: { title: string; text: string };
  /** Contenu du QR code : texte lisible hors ligne, sans lien de gestion (jeton jamais exposé). */
  qr: string;
  back: { site: string; address: string };
  pages: { summary: number; total: number };
};

const LABELS = {
  fr: {
    passport: 'Passeport d’évasion',
    passportBi: 'Passeport d’évasion · Escape passport',
    number: 'N°',
    coverTagline: 'Escape Passport · Paspoor Teranga',
    region: 'Sine-Saloum · Sénégal',
    voucher: 'Bon de réservation · Voucher',
    travellerPage: 'Page du voyageur',
    travellerPageAlt: '/ Traveller',
    surname: 'Nom / Surname',
    givenNames: 'Prénoms / Given names',
    travellers: 'Voyageurs',
    language: 'Langue',
    languageName: 'Français',
    arrival: 'Arrivée / Arrival',
    departure: 'Départ / Departure',
    host: 'Hôte référent / Host',
    signature: 'Signature du voyageur',
    step: 'Étape',
    day: 'Jour',
    time: 'Heure',
    place: 'Lieu',
    duration: 'Durée',
    booked: 'Réservé',
    bring: 'À prévoir',
    visa: 'Visa du guide',
    visaHint: 'À tamponner sur place',
    summaryTitle: 'Votre séjour en un coup d’œil',
    summaryTag: 'Bon pour séjour',
    service: 'Prestation',
    contacts: 'Contacts utiles',
    conditions: 'Conditions',
    quote: '« Le voyageur repart avec des souvenirs, le village garde de quoi vivre. »',
    quoteTag: 'La Teranga du Saloum',
    tagline: 'Votre porte d’entrée vers les merveilles du Sine-Saloum',
    disclaimer:
      'Ce passeport d’évasion est un bon de réservation Saloum Évasion. Il ne constitue pas un document d’identité ni un titre de voyage. Ce document n’est pas une facture.',
  },
  en: {
    passport: 'Escape passport',
    passportBi: 'Escape passport · Passeport d’évasion',
    number: 'No.',
    coverTagline: 'Passeport d’Évasion · Paspoor Teranga',
    region: 'Sine-Saloum · Senegal',
    voucher: 'Booking voucher · Bon de réservation',
    travellerPage: 'Traveller page',
    travellerPageAlt: '/ Voyageur',
    surname: 'Surname / Nom',
    givenNames: 'Given names / Prénoms',
    travellers: 'Travellers',
    language: 'Language',
    languageName: 'English',
    arrival: 'Arrival / Arrivée',
    departure: 'Departure / Départ',
    host: 'Host / Hôte référent',
    signature: 'Traveller’s signature',
    step: 'Step',
    day: 'Day',
    time: 'Time',
    place: 'Place',
    duration: 'Duration',
    booked: 'Booked',
    bring: 'To bring',
    visa: 'Guide’s visa',
    visaHint: 'To be stamped on site',
    summaryTitle: 'Your stay at a glance',
    summaryTag: 'Valid for stay',
    service: 'Service',
    contacts: 'Useful contacts',
    conditions: 'Terms',
    quote: '“The traveller leaves with memories, the village keeps a living.”',
    quoteTag: 'Saloum Teranga',
    tagline: 'Your gateway to the wonders of the Sine-Saloum',
    disclaimer:
      'This escape passport is a Saloum Évasion booking voucher. It is not an identity or travel document. This document is not an invoice.',
  },
} as const;

export type PassportLabels = (typeof LABELS)[Locale];

const WORDS = {
  fr: {
    weekdayLong: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
    weekdayShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
    monthLong: [
      'janvier',
      'février',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'août',
      'septembre',
      'octobre',
      'novembre',
      'décembre',
    ],
    monthShort: [
      'janv.',
      'févr.',
      'mars',
      'avr.',
      'mai',
      'juin',
      'juil.',
      'août',
      'sept.',
      'oct.',
      'nov.',
      'déc.',
    ],
    nights: (count: number) => `${count} ${count > 1 ? 'nuits' : 'nuit'}`,
    adults: (count: number) => `${count} ${count > 1 ? 'adultes' : 'adulte'}`,
    hours: (h: number, m: number) => (m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`),
    clock: (time: string) => time.replace(':', ' h '),
    road: (minutes: number) => `env. ${Math.round(minutes / 60)} h de route`,
    origin: { aibd: 'Aéroport AIBD', dakar: 'Votre adresse à Dakar' },
    transferOut: 'Transfert aller',
    transferBack: 'Transfert retour',
    status: {
      pending: 'Disponibilité en cours de confirmation',
      confirmed: 'Confirmé par le prestataire',
      unavailable: 'Indisponible : votre hôte vous propose une solution',
      replaced: 'Remplacé par une alternative',
    },
    paidOn: (method: string, date: string, ref?: string) =>
      `Réglé par ${method} le ${date}${ref ? ` · Réf. ${ref}` : ''}`,
    methods: { wave: 'Wave', orange_money: 'Orange Money', card: 'carte bancaire' },
    stampMethods: { wave: 'WAVE', orange_money: 'ORANGE MONEY', card: 'CARTE' },
    paid: 'PAYÉ',
    deposit: 'ACOMPTE',
    totalPaid: 'Total réglé',
    total: 'Total',
    alreadyPaid: 'Déjà réglé',
    balance: (date: string) => `Solde à régler avant le ${date}`,
    eur: (amount: string) => `soit ${amount} (indicatif)`,
    hostContact: 'Votre hôte · WhatsApp 7 j/7',
    assistance: 'Agence',
    emergency: 'Urgences Sénégal',
    emergencyLine: 'Police 17 · Pompiers 18 · SAMU 1515',
    provider: 'Prestataire',
    viaHost: 'contact via votre hôte',
    verifyTitle: 'Présentez ce passeport à chaque étape',
    verifyText: (reference: string) =>
      `Le prestataire scanne le QR code (réservation ${reference}, nom, dates, voyageurs), la vérifie auprès de votre hôte, puis tamponne la page de l’étape. Version numérique sur WhatsApp et par e-mail.`,
  },
  en: {
    weekdayLong: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    weekdayShort: ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.'],
    monthLong: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    monthShort: [
      'Jan.',
      'Feb.',
      'Mar.',
      'Apr.',
      'May',
      'June',
      'July',
      'Aug.',
      'Sept.',
      'Oct.',
      'Nov.',
      'Dec.',
    ],
    nights: (count: number) => `${count} ${count > 1 ? 'nights' : 'night'}`,
    adults: (count: number) => `${count} ${count > 1 ? 'adults' : 'adult'}`,
    hours: (h: number, m: number) => (m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`),
    clock: (time: string) => time,
    road: (minutes: number) => `about ${Math.round(minutes / 60)} h drive`,
    origin: { aibd: 'AIBD airport', dakar: 'Your address in Dakar' },
    transferOut: 'Outbound transfer',
    transferBack: 'Return transfer',
    status: {
      pending: 'Availability being confirmed',
      confirmed: 'Confirmed by the partner',
      unavailable: 'Unavailable: your host will offer a solution',
      replaced: 'Replaced by an alternative',
    },
    paidOn: (method: string, date: string, ref?: string) =>
      `Paid by ${method} on ${date}${ref ? ` · Ref. ${ref}` : ''}`,
    methods: { wave: 'Wave', orange_money: 'Orange Money', card: 'bank card' },
    stampMethods: { wave: 'WAVE', orange_money: 'ORANGE MONEY', card: 'CARD' },
    paid: 'PAID',
    deposit: 'DEPOSIT',
    totalPaid: 'Total paid',
    total: 'Total',
    alreadyPaid: 'Already paid',
    balance: (date: string) => `Balance due by ${date}`,
    eur: (amount: string) => `that is ${amount} (indicative)`,
    hostContact: 'Your host · WhatsApp 7 days a week',
    assistance: 'Agency',
    emergency: 'Emergencies in Senegal',
    emergencyLine: 'Police 17 · Fire 18 · Ambulance (SAMU) 1515',
    provider: 'Partner',
    viaHost: 'reach them through your host',
    verifyTitle: 'Show this passport at every step',
    verifyText: (reference: string) =>
      `The partner scans the QR code (booking ${reference}, name, dates, travellers), checks it with your host, then stamps the step’s page. Digital copy on WhatsApp and by e-mail.`,
  },
} as const;

/** Conseils pratiques par type de sortie (jamais une promesse de prestation). */
const BRING: Record<IllustrationKind, Record<Locale, readonly string[]>> = {
  road: {
    fr: ['Pièce d’identité', 'Un peu d’espèces en FCFA'],
    en: ['ID document', 'Some cash in CFA francs'],
  },
  pirogue: {
    fr: ['Anti-moustique', 'Une petite laine pour le retour'],
    en: ['Insect repellent', 'A light sweater for the way back'],
  },
  table: {
    fr: ['Signaler vos allergies à votre hôte'],
    en: ['Tell your host about any allergies'],
  },
  birds: {
    fr: ['Chapeau et crème solaire', 'Chaussures pouvant être mouillées'],
    en: ['Hat and sunscreen', 'Shoes that can get wet'],
  },
  baobab: {
    fr: ['Tenue qui ne craint pas la poussière', 'Foulard pour le visage'],
    en: ['Clothes that can get dusty', 'A scarf for your face'],
  },
  village: {
    fr: ['Tenue couvrant épaules et genoux', 'Demander avant de photographier'],
    en: ['Clothes covering shoulders and knees', 'Ask before taking photos'],
  },
};

/** Tampon décoratif de chaque type d'étape (couleurs et formes de la maquette). */
const STAMPS: Record<
  IllustrationKind,
  { shape: 'rect' | 'circle'; color: string; rotate: number; word: Record<Locale, string> }
> = {
  road: { shape: 'rect', color: '#1F3A6B', rotate: -8, word: { fr: 'NDANGANE', en: 'NDANGANE' } },
  pirogue: { shape: 'circle', color: '#9E4521', rotate: 12, word: { fr: 'Bolong', en: 'Bolong' } },
  table: {
    shape: 'circle',
    color: '#2E6B4F',
    rotate: -10,
    word: { fr: 'Saveurs', en: 'Flavours' },
  },
  birds: { shape: 'rect', color: '#5B3A7A', rotate: 7, word: { fr: 'OISEAUX', en: 'BIRDS' } },
  baobab: { shape: 'circle', color: '#A23B2A', rotate: -13, word: { fr: 'Piste', en: 'Trail' } },
  village: { shape: 'rect', color: '#7A4A2A', rotate: -6, word: { fr: 'TERANGA', en: 'TERANGA' } },
};

const RING: Record<IllustrationKind, Record<Locale, string>> = {
  road: { fr: 'ENTRÉE', en: 'ARRIVAL' },
  pirogue: { fr: 'BOLONG · MANGROVE', en: 'BOLONG · MANGROVE' },
  table: { fr: 'TABLE DU SALOUM', en: 'SALOUM TABLE' },
  birds: { fr: 'ÎLE', en: 'ISLAND' },
  baobab: { fr: 'BROUSSE · BAOBABS', en: 'BUSH · BAOBABS' },
  village: { fr: 'VILLAGE', en: 'VILLAGE' },
};

const MRZ_MONTHS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

const LODGING = new Set(['accommodation', 'stay']);

const pick = <T>(list: readonly T[], index: number, fallback: T): T => list[index] ?? fallback;

const parts = (iso: string) => {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return {
    day: date.getUTCDate(),
    month: date.getUTCMonth(),
    weekday: date.getUTCDay(),
    year: date.getUTCFullYear(),
  };
};

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

/** « Vendredi 4 décembre » / « Friday 4 December ». */
export const longDay = (iso: string, locale: Locale): string => {
  const { day, month, weekday } = parts(iso);
  const words = WORDS[locale];
  return capitalize(
    `${pick(words.weekdayLong, weekday, '')} ${day} ${pick(words.monthLong, month, '')}`,
  );
};

/** « Ven. 4 déc. 2026 » / « Fri. 4 Dec. 2026 ». */
export const shortDate = (iso: string, locale: Locale): string => {
  const { day, month, weekday, year } = parts(iso);
  const words = WORDS[locale];
  return `${pick(words.weekdayShort, weekday, '')} ${day} ${pick(words.monthShort, month, '')} ${year}`;
};

/** « 04 DÉC 2026 » (tampons). */
const stampDate = (iso: string, locale: Locale): string => {
  const { day, month, year } = parts(iso);
  const short = pick(WORDS[locale].monthShort, month, '').replace('.', '').toUpperCase();
  return `${String(day).padStart(2, '0')} ${short.slice(0, 4)} ${year}`;
};

const daysBetween = (from: string, to: string): number =>
  Math.round(
    (Date.parse(`${to.slice(0, 10)}T00:00:00Z`) - Date.parse(`${from.slice(0, 10)}T00:00:00Z`)) /
      86_400_000,
  );

/** Caractères sûrs pour la zone de lecture automatique : A-Z, 0-9 et « < ». */
export const mrzSafe = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '<')
    .replace(/^<+|<+$/g, '');

const mrzLine = (value: string): string => (value + '<'.repeat(44)).slice(0, 44);

const mrzDate = (iso: string): string => {
  const { day, month } = parts(iso);
  return `${String(day).padStart(2, '0')}${pick(MRZ_MONTHS, month, 'XXX')}`;
};

/**
 * Texte du QR code en ASCII : sans indicateur d'encodage, certains lecteurs décodent l'UTF-8
 * comme du Latin-1 (« Ã© ») ; accents retirés, tirets et symboles simplifiés.
 */
export const qrSafe = (value: string): string =>
  value
    .replace(/°/g, 'o')
    .replace(/[–—]/g, '-')
    .replace(/[’‘]/g, "'")
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7e\n]/g, ' ');

/** Texte compatible avec les polices du PDF (sous-ensemble latin). */
export const pdfText = (value: string): string =>
  value.replace(/≈\s?/g, '~').replace(/[→⇄]/g, '–').replace(/[◆]/g, '·');

export const illustrationFor = (
  offerType: string,
  detail: VoucherLineDetail | undefined,
): IllustrationKind => {
  if (offerType === 'transfer') return 'road';
  if (offerType === 'table') return 'table';
  // Slug de l'offre d'abord (le plus précis), puis son univers.
  const slug = detail?.slug ?? '';
  if (/oiseau|bird/.test(slug)) return 'birds';
  if (/quad|cheval|horse/.test(slug)) return 'baobab';
  if (/village|serere|serer/.test(slug)) return 'village';
  if (/huitre|oyster|table/.test(slug)) return 'table';
  if (/pirogue|peche|fishing|kayak/.test(slug)) return 'pirogue';
  const universe = detail?.universeSlug ?? '';
  if (/terre|land/.test(universe)) return 'baobab';
  if (/table/.test(universe)) return 'table';
  return 'pirogue';
};

const durationLabel = (locale: Locale, offerType: string, minutes: number | undefined): string => {
  if (!minutes) return '—';
  const words = WORDS[locale];
  if (offerType === 'transfer') return words.road(minutes);
  return words.hours(Math.floor(minutes / 60), minutes % 60);
};

const amountOnly = (formatted: string): string => formatted.replace(/\s*FCFA$/, '');

/** Contenu complet du passeport (10 pages pour six étapes). */
export const buildPassport = (data: VoucherData): Passport => {
  const locale = data.locale;
  const labels = LABELS[locale];
  const words = WORDS[locale];
  const details = data.details ?? {};
  const lines = data.source.lines.filter((line) => !line.cancelled);
  const summary = new Map(summaryLines(data.source).map((line) => [line.lineId, line]));
  const lodging = lines.find((line) => LODGING.has(line.offerType));
  const stayLine = lines.find((line) => line.offerType === 'stay');
  const accommodation = lines.find((line) => line.offerType === 'accommodation');

  const dates = lines.flatMap((line) => [line.startDate, line.endDate ?? line.startDate]).sort();
  const arrivalIso = lodging?.startDate ?? dates[0] ?? '';
  const departureIso = lodging?.endDate ?? dates[dates.length - 1] ?? arrivalIso;
  const adults = Math.max(0, ...lines.map((line) => line.adults));

  const timeOf = (line: (typeof lines)[number]): string => line.slot ?? line.transferTime ?? '';
  const stepLines = lines
    .filter((line) => !LODGING.has(line.offerType))
    .sort((a, b) => `${a.startDate} ${timeOf(a)}`.localeCompare(`${b.startDate} ${timeOf(b)}`));

  const host = data.agency.whatsapp ?? data.agency.phone ?? '';
  const seenDays = new Set<string>();
  const steps: PassportStep[] = stepLines.map((line, index) => {
    const detail = details[line.lineId];
    const illustration = illustrationFor(line.offerType, detail);
    const dayNumber = arrivalIso ? daysBetween(arrivalIso, line.startDate) + 1 : index + 1;
    const time = timeOf(line);
    const firstOfDay = !seenDays.has(line.startDate);
    seenDays.add(line.startDate);
    const isReturn = line.transferDirection === 'return';
    const place =
      line.offerType === 'transfer'
        ? isReturn
          ? (detail?.destination ?? 'Ndangane')
          : detail?.transferOrigin
            ? words.origin[detail.transferOrigin]
            : (detail?.destination ?? '—')
        : (detail?.meetingPoint ?? detail?.destination ?? '—');
    const stamp = STAMPS[illustration];
    const status = data.availability[line.lineId] ?? 'pending';
    const statusLabel =
      status === 'confirmed' || status === 'unavailable' || status === 'replaced'
        ? words.status[status]
        : words.status.pending;
    const summaryLine = summary.get(line.lineId);
    return {
      number: index + 1,
      page: index + 3,
      eyebrow: `${labels.day} ${dayNumber} · ${
        firstOfDay || !time ? longDay(line.startDate, locale) : words.clock(time)
      }`,
      title: pdfText(line.title),
      subtitle: pdfText(
        detail?.altTitle ??
          (line.offerType === 'transfer'
            ? isReturn
              ? words.transferBack
              : words.transferOut
            : ''),
      ),
      time: time ? words.clock(time) : '—',
      place: pdfText(place),
      duration: durationLabel(locale, line.offerType, detail?.durationMinutes),
      description: pdfText(detail?.summary ?? ''),
      booked: [
        summaryLine?.travellers ?? words.adults(line.adults),
        `${summaryLine?.price ?? ''}`,
        statusLabel,
      ].filter(Boolean),
      bring: [...BRING[illustration][locale]],
      contact: pdfText(
        `${words.provider} · ${detail?.partnerName ?? data.agency.name}${host ? ` · ${words.viaHost} ${host}` : ''}`,
      ),
      illustration,
      stamp: {
        shape: stamp.shape,
        word: stamp.word[locale],
        detail:
          stamp.shape === 'rect'
            ? `${isReturn ? (locale === 'fr' ? 'SORTIE' : 'DEPARTURE') : RING[illustration][locale]} · ${stampDate(line.startDate, locale)}`
            : `${RING[illustration][locale]} · ${mrzSafe(detail?.destination ?? 'NDANGANE').replace(/</g, ' ')} · `,
        color: stamp.color,
        rotate: stamp.rotate,
      },
    };
  });

  const nights = lodging?.endDate ? daysBetween(lodging.startDate, lodging.endDate) : 0;
  const stayTitle = stayLine?.title ?? accommodation?.title ?? data.agency.name;
  const stayDetail = [
    nights > 0 ? words.nights(nights) : '',
    stayLine && accommodation ? accommodation.title : (accommodation?.title ?? ''),
  ]
    .filter(Boolean)
    .filter((part, index, all) => all.indexOf(part) === index && part !== stayTitle)
    .join(' · ');

  const totals = summaryTotals(data.source);
  const paidInFull = data.source.amountPaid >= data.source.total;
  const summaryTotalsRows = paidInFull
    ? [{ label: words.totalPaid, amount: amountOnly(totals.total), strong: true }]
    : [
        { label: words.total, amount: amountOnly(totals.total), strong: true },
        { label: words.alreadyPaid, amount: amountOnly(totals.paid), strong: false },
        ...(totals.balance
          ? [
              {
                label: words.balance(totals.balance.dueDate),
                amount: amountOnly(totals.balance.amount),
                strong: false,
              },
            ]
          : []),
      ];

  const paidStatus = data.status === 'paid' || data.status === 'completed';
  const depositStatus = data.status === 'deposit_paid';
  const surname = data.traveller.lastName.toUpperCase();
  const summaryPage = steps.length + 3;

  return {
    reference: data.reference,
    locale,
    labels,
    traveller: {
      surname: pdfText(surname),
      givenNames: pdfText(data.traveller.firstName),
      travellers:
        summary.get(lodging?.lineId ?? stepLines[0]?.lineId ?? '')?.travellers ??
        words.adults(adults),
      language: labels.languageName,
      arrival: arrivalIso ? shortDate(arrivalIso, locale) : '—',
      departure: departureIso ? shortDate(departureIso, locale) : '—',
      host: pdfText([data.agency.name, host].filter(Boolean).join(' · ')),
    },
    stay: { title: pdfText(stayTitle), detail: pdfText(stayDetail) },
    toc: steps.map((step) => ({ label: `${step.number} · ${step.title}`, page: step.page })),
    steps,
    signature: pdfText(`${data.traveller.firstName.charAt(0)}. ${data.traveller.lastName}`),
    paidStamp:
      (paidStatus || depositStatus) && data.payment
        ? {
            word: paidStatus ? words.paid : words.deposit,
            method: words.stampMethods[data.payment.method],
          }
        : null,
    mrz: [
      mrzLine(`${mrzSafe(data.reference)}<<SALOUM<EVASION<<${mrzSafe(stayTitle)}`),
      mrzLine(
        `${mrzSafe(data.traveller.lastName)}<<${mrzSafe(data.traveller.firstName)}<<${adults}ADT${
          arrivalIso ? `<<${mrzDate(arrivalIso)}<${mrzDate(departureIso)}` : ''
        }`,
      ),
    ],
    summary: {
      rows: lines.map((line) => {
        const row = summary.get(line.lineId);
        return {
          label: pdfText(line.title),
          detail: pdfText([row?.when, row?.travellers].filter(Boolean).join(' · ')),
          amount: amountOnly(row?.price ?? ''),
        };
      }),
      totals: summaryTotalsRows,
      eur: pdfText(words.eur(formatEur(data.source.total, locale).replace('≈ ', ''))),
      payment: data.payment
        ? words.paidOn(
            words.methods[data.payment.method],
            new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
              timeZone: 'UTC',
            }).format(new Date(data.payment.confirmedAt)),
            data.payment.reference,
          )
        : null,
    },
    contacts: [
      ...(host ? [{ title: words.hostContact, lines: [host] }] : []),
      {
        title: words.assistance,
        lines: [data.agency.phone, data.agency.email].filter((value): value is string =>
          Boolean(value),
        ),
      },
      { title: words.emergency, lines: [words.emergencyLine] },
    ],
    conditions: [
      ...new Set(data.policies.map((policy) => pdfText(`${policy.title} : ${policy.summary}`))),
    ],
    verify: { title: words.verifyTitle, text: words.verifyText(data.reference) },
    qr: qrSafe(
      [
        data.agency.name,
        `${labels.number} ${data.reference}`,
        `${data.traveller.lastName.toUpperCase()} ${data.traveller.firstName}`,
        arrivalIso ? `${shortDate(arrivalIso, locale)} – ${shortDate(departureIso, locale)}` : '',
        summary.get(lodging?.lineId ?? stepLines[0]?.lineId ?? '')?.travellers ??
          words.adults(adults),
        stayTitle,
      ]
        .filter(Boolean)
        .join('\n'),
    ),
    back: {
      site: (data.siteUrl ?? '').replace(/^https?:\/\//, ''),
      address: pdfText(data.agency.address),
    },
    pages: { summary: summaryPage, total: summaryPage + 1 },
  };
};
