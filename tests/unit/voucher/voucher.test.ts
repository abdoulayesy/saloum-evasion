import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildPassport, illustrationFor, mrzSafe, type VoucherData } from '@/lib/voucher/model';
import { renderVoucherPdf } from '@/lib/voucher/render';

// T059 (FR-024) et maquette « Passeport d'évasion » : contenu des pages calculé depuis la
// réservation (testé ici sur le texte), puis rendu PDF de 4 + N pages, poids < 300 Ko. Les
// polices embarquées encodent le texte en glyphes : le contenu se vérifie sur le modèle.

const line = (
  lineId: string,
  offerType: 'accommodation' | 'experience' | 'table' | 'transfer',
  title: string,
  startDate: string,
  extra: Partial<VoucherData['source']['lines'][number]> = {},
) => ({
  lineId,
  offerType,
  title,
  startDate,
  adults: 2,
  children: 0,
  infants: 0,
  lineTotal: 30_000,
  ...extra,
});

const DATA: VoucherData = {
  reference: 'SE-7KD3QP',
  locale: 'fr',
  traveller: {
    firstName: 'Aïssatou',
    lastName: 'Diallo',
    whatsapp: '+221771234567',
    email: 'a@example.sn',
  },
  status: 'paid',
  source: {
    locale: 'fr',
    total: 500_000,
    paymentPlan: 'full',
    depositAmount: 500_000,
    balanceAmount: 0,
    balanceDueDate: null,
    amountPaid: 500_000,
    lines: [
      line('villa', 'accommodation', 'Villa Bolong', '2026-12-04', {
        endDate: '2026-12-06',
        lineTotal: 240_000,
      }),
      line('out', 'transfer', 'Aéroport AIBD → Sine-Saloum', '2026-12-04', {
        transferDirection: 'outbound',
        transferTime: '14:00',
        adults: 2,
      }),
      line('pirogue', 'experience', 'Pirogue au couchant', '2026-12-04', { slot: '18:00' }),
      line('huitres', 'table', 'Dîner d’huîtres', '2026-12-04', {
        slot: '20:30',
        lineTotal: 24_000,
      }),
      line('oiseaux', 'experience', 'Île aux Oiseaux', '2026-12-05', {
        slot: '07:00',
        lineTotal: 40_000,
      }),
      line('quad', 'experience', 'Quad aux baobabs', '2026-12-05', {
        slot: '16:00',
        lineTotal: 70_000,
      }),
      line('village', 'experience', 'Village sérère', '2026-12-06', {
        slot: '09:30',
        lineTotal: 36_000,
      }),
      line('annule', 'experience', 'Sortie annulée', '2026-12-05', { cancelled: true }),
    ],
  },
  availability: { villa: 'confirmed', pirogue: 'pending' },
  policies: [
    { title: 'Villa Bolong', summary: 'Annulation gratuite jusqu’à 30 jours avant l’arrivée.' },
    { title: 'Pirogue au couchant', summary: 'Annulation gratuite jusqu’à 48 h avant.' },
  ],
  agency: {
    name: 'Saloum Évasion',
    address: 'Ndangane, Fatick, Sénégal',
    phone: '+221770000000',
    whatsapp: '+221770000001',
    email: 'contact@example.sn',
  },
  details: {
    out: {
      transferOrigin: 'aibd',
      durationMinutes: 180,
      destination: 'Ndangane',
      partnerName: 'Transferts Petite-Côte',
    },
    pirogue: {
      slug: 'excursion-pirogue-bolongs',
      universeSlug: 'mangrove-et-iles',
      meetingPoint: 'Ponton de la villa',
      durationMinutes: 120,
      summary: 'Moteur coupé, on glisse au rythme de la marée.',
      altTitle: 'Sunset pirogue',
    },
    oiseaux: { slug: 'ile-aux-oiseaux-pirogue', durationMinutes: 240 },
    quad: { slug: 'quad-sine-saloum', universeSlug: 'terre-et-villages', durationMinutes: 120 },
    village: { slug: 'village-serere-repas-habitant', durationMinutes: 360 },
  },
  payment: { method: 'wave', confirmedAt: '2026-11-21T10:00:00Z', reference: 'WAV-123' },
  siteUrl: 'https://saloum-evasion.example',
};

/** Espaces fines insécables des montants (convention du site) → espaces simples. */
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value).replace(/ | | /g, ' '));

describe('passeport d’évasion : contenu', () => {
  const passport = plain(buildPassport(DATA));

  it('une page par étape (hors hébergement et lignes annulées), dans l’ordre du séjour', () => {
    expect(passport.steps.map((step) => step.title)).toEqual([
      'Aéroport AIBD – Sine-Saloum',
      'Pirogue au couchant',
      'Dîner d’huîtres',
      'Île aux Oiseaux',
      'Quad aux baobabs',
      'Village sérère',
    ]);
    expect(passport.steps.map((step) => step.page)).toEqual([3, 4, 5, 6, 7, 8]);
    expect(passport.pages).toEqual({ summary: 9, total: 10 });
    expect(passport.toc[0]).toEqual({ label: '1 · Aéroport AIBD – Sine-Saloum', page: 3 });
  });

  it('jour, date ou heure, lieu, durée et illustration de chaque étape', () => {
    const [transfer, pirogue, dinner, birds, quad, village] = passport.steps;
    expect(transfer?.eyebrow).toBe('Jour 1 · Vendredi 4 décembre');
    expect(transfer?.place).toBe('Aéroport AIBD');
    expect(transfer?.duration).toBe('env. 3 h de route');
    expect(pirogue?.eyebrow).toBe('Jour 1 · 18 h 00');
    expect(pirogue?.subtitle).toBe('Sunset pirogue');
    expect(pirogue?.place).toBe('Ponton de la villa');
    expect(birds?.eyebrow).toBe('Jour 2 · Samedi 5 décembre');
    expect(
      [transfer, pirogue, dinner, birds, quad, village].map((step) => step?.illustration),
    ).toEqual(['road', 'pirogue', 'table', 'birds', 'baobab', 'village']);
    expect(pirogue?.booked).toEqual([
      '2 adultes',
      '30 000 FCFA',
      'Disponibilité en cours de confirmation',
    ]);
    expect(village?.stamp.detail).toContain('06 DÉC 2026');
  });

  it('page du voyageur : identité, dates, séjour, tampon de paiement et zone de lecture', () => {
    expect(passport.traveller).toMatchObject({
      surname: 'DIALLO',
      givenNames: 'Aïssatou',
      travellers: '2 adultes',
      arrival: 'Ven. 4 déc. 2026',
      departure: 'Dim. 6 déc. 2026',
      host: 'Saloum Évasion · +221770000001',
    });
    expect(passport.stay).toEqual({ title: 'Villa Bolong', detail: '2 nuits' });
    expect(passport.paidStamp).toEqual({ word: 'PAYÉ', method: 'WAVE' });
    expect(passport.mrz[0]).toBe('SE<7KD3QP<<SALOUM<EVASION<<VILLA<BOLONG'.padEnd(44, '<'));
    expect(passport.mrz[1]).toBe('DIALLO<<AISSATOU<<2ADT<<04DEC<06DEC'.padEnd(44, '<'));
    expect(passport.mrz.every((row) => row.length === 44)).toBe(true);
  });

  it('récapitulatif : montants, total réglé, paiement, conditions figées, contacts', () => {
    expect(passport.summary.rows).toHaveLength(7);
    expect(passport.summary.totals).toEqual([
      { label: 'Total réglé', amount: '500 000', strong: true },
    ]);
    expect(passport.summary.payment).toBe('Réglé par Wave le 21/11/2026 · Réf. WAV-123');
    expect(passport.conditions).toEqual([
      'Villa Bolong : Annulation gratuite jusqu’à 30 jours avant l’arrivée.',
      'Pirogue au couchant : Annulation gratuite jusqu’à 48 h avant.',
    ]);
    expect(passport.contacts.map((contact) => contact.title)).toEqual([
      'Votre hôte · WhatsApp 7 j/7',
      'Agence',
      'Urgences Sénégal',
    ]);
    expect(passport.back.site).toBe('saloum-evasion.example');
  });

  it('QR code : réservation lisible hors ligne, jamais de lien de gestion', () => {
    expect(passport.qr.split('\n')).toEqual([
      'Saloum Evasion',
      'No SE-7KD3QP',
      'DIALLO Aissatou',
      'Ven. 4 dec. 2026 - Dim. 6 dec. 2026',
      '2 adultes',
      'Villa Bolong',
    ]);
    expect(passport.qr).not.toMatch(/https?:|[?&]k=/);
    // ASCII seul : lisible par tous les lecteurs, même sans indication d'encodage.
    expect(passport.qr).toMatch(/^[\x20-\x7e\n]+$/);
  });

  it('acompte : total, déjà réglé et solde avec échéance ; tampon « acompte »', () => {
    const deposit = plain(
      buildPassport({
        ...DATA,
        status: 'deposit_paid',
        source: {
          ...DATA.source,
          paymentPlan: 'deposit',
          amountPaid: 150_000,
          balanceAmount: 350_000,
          balanceDueDate: '2026-11-04',
        },
      }),
    );
    expect(deposit.summary.totals).toEqual([
      { label: 'Total', amount: '500 000', strong: true },
      { label: 'Déjà réglé', amount: '150 000', strong: false },
      { label: 'Solde à régler avant le 4 nov. 2026', amount: '350 000', strong: false },
    ]);
    expect(deposit.paidStamp?.word).toBe('ACOMPTE');
  });

  it('anglais : libellés et dates en anglais', () => {
    const english = buildPassport({
      ...DATA,
      locale: 'en',
      source: { ...DATA.source, locale: 'en' },
    });
    expect(english.labels.travellerPage).toBe('Traveller page');
    expect(english.steps[0]?.eyebrow).toBe('Day 1 · Friday 4 December');
    expect(english.paidStamp).toEqual({ word: 'PAID', method: 'WAVE' });
  });

  it('aucune donnée inventée : sans détail d’offre, champs neutres ; sans paiement, pas de tampon', () => {
    const bare = buildPassport({ ...DATA, details: {}, payment: undefined });
    expect(bare.steps[1]?.place).toBe('—');
    expect(bare.steps[1]?.description).toBe('');
    expect(bare.paidStamp).toBeNull();
    expect(bare.summary.payment).toBeNull();
  });

  it('outils : zone de lecture et choix de l’illustration', () => {
    expect(mrzSafe('Île aux Oiseaux')).toBe('ILE<AUX<OISEAUX');
    expect(illustrationFor('transfer', undefined)).toBe('road');
    expect(illustrationFor('experience', { slug: 'balade-cheval-palmarin' })).toBe('baobab');
  });
});

describe('passeport d’évasion : PDF', () => {
  it('PDF valide de 10 pages (6 étapes), moins de 300 Ko', async () => {
    const pdf = await renderVoucherPdf(DATA);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    const pages = pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) ?? [];
    expect(pages).toHaveLength(10);
    expect(pdf.length).toBeLessThan(300 * 1024);
    if (process.env.VOUCHER_SAMPLE) writeFileSync(process.env.VOUCHER_SAMPLE, pdf);
  });

  it('séjour sans étape (hébergement seul) : 4 pages', async () => {
    const pdf = await renderVoucherPdf({
      ...DATA,
      source: { ...DATA.source, lines: DATA.source.lines.slice(0, 1) },
    });
    expect(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) ?? []).toHaveLength(4);
  });
});
