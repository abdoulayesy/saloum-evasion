import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { renderVoucherPdf, type VoucherData } from '@/lib/voucher/render';

// T059 (FR-024) : bon de réservation PDF bilingue (sections FR et EN), montants, conditions
// d'annulation figées, coordonnées de l'agence, poids < 300 Ko. Le texte est lu en décompressant
// les flux du PDF (aucune bibliothèque d'extraction ajoutée).

const textOf = (pdf: Buffer): string => {
  const raw = pdf.toString('latin1');
  const parts: string[] = [];
  const pattern = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  for (const match of raw.matchAll(pattern)) {
    const body = Buffer.from(match[1] ?? '', 'latin1');
    try {
      parts.push(inflateSync(body).toString('latin1'));
    } catch {
      parts.push(body.toString('latin1'));
    }
  }
  // Chaînes des opérateurs de texte : hexadécimales <…> (react-pdf) ou littérales (…).
  const content = parts.join('\n');
  const hex = [...content.matchAll(/(?<!<)<([0-9A-Fa-f\s]+)>(?!>)/g)].map((m) =>
    Buffer.from((m[1] ?? '').replace(/\s/g, ''), 'hex').toString('latin1'),
  );
  const literal = [...content.matchAll(/\(((?:\\.|[^\\)])*)\)/g)].map((m) => m[1] ?? '');
  return [...hex, ...literal].join('');
};

const DATA: VoucherData = {
  reference: 'SE-7KD3QP',
  locale: 'fr',
  traveller: {
    firstName: 'Awa',
    lastName: 'Diop',
    whatsapp: '+221771234567',
    email: 'awa@example.sn',
  },
  status: 'deposit_paid',
  source: {
    locale: 'fr',
    total: 487_350,
    paymentPlan: 'deposit',
    depositAmount: 146_300,
    balanceAmount: 341_050,
    balanceDueDate: '2027-03-01',
    amountPaid: 146_300,
    lines: [
      {
        lineId: 'lodge',
        offerType: 'accommodation',
        title: 'Ecolodge des bolongs',
        startDate: '2027-03-15',
        endDate: '2027-03-19',
        adults: 2,
        children: 1,
        infants: 0,
        lineTotal: 360_000,
      },
    ],
  },
  availability: { lodge: 'pending' },
  policies: [
    {
      title: 'Ecolodge des bolongs',
      summary: 'Annulation gratuite jusqu a 30 jours avant l arrivee.',
    },
  ],
  agency: {
    name: 'Saloum Evasion',
    address: 'Ndangane, Fatick, Senegal',
    phone: '+221770000000',
    whatsapp: '+221770000001',
    email: 'contact@example.sn',
  },
};

describe('bon de réservation PDF', () => {
  it('contient la référence, les sections FR et EN, les montants, les conditions et le NAP', async () => {
    const pdf = await renderVoucherPdf(DATA);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    const text = textOf(pdf);
    for (const expected of [
      'SE-7KD3QP',
      'Booking voucher',
      'Reference',
      'Ecolodge des bolongs',
      '487 350 FCFA',
      '146 300 FCFA',
      '341 050 FCFA',
      'Annulation gratuite',
      'Ndangane',
      '+221770000001',
      'contact@example.sn',
    ]) {
      expect(text, expected).toContain(expected);
    }
  });

  it('pèse moins de 300 Ko', async () => {
    const pdf = await renderVoucherPdf(DATA);
    expect(pdf.length).toBeLessThan(300 * 1024);
  });
});
