import { describe, expect, it } from 'vitest';
import {
  summaryLines,
  summaryText,
  summaryTotals,
  type SummarySource,
} from '@/lib/checkout/summary';

/** Espaces insécables (fines) des montants ramenées à des espaces simples pour la lisibilité. */
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value).replace(/[\u202f\u00a0]/g, ' '));

// T016b (FR-010) : source unique du récapitulatif. Les rendus (page T058, e-mail et WhatsApp
// T059, bon PDF T061) ajouteront ici leur assertion « rend exactement ces lignes ».
const BOOKING: SummarySource = {
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
      title: 'Écolodge des bolongs',
      startDate: '2027-03-15',
      endDate: '2027-03-19',
      adults: 2,
      children: 1,
      infants: 0,
      lineTotal: 360_000,
    },
    {
      lineId: 'pirogue',
      offerType: 'experience',
      title: 'Pirogue au coucher du soleil',
      startDate: '2027-03-16',
      slot: '17:30',
      adults: 2,
      children: 1,
      infants: 1,
      lineTotal: 82_350,
    },
    {
      lineId: 'in',
      offerType: 'transfer',
      title: 'Transfert AIBD → Saloum',
      startDate: '2027-03-15',
      transferDirection: 'outbound',
      transferTime: '09:40',
      adults: 2,
      children: 1,
      infants: 1,
      lineTotal: 45_000,
      cancelled: true,
    },
  ],
};

describe('récapitulatif de réservation', () => {
  it('lignes : titre, dates, voyageurs et prix déjà formatés', () => {
    expect(plain(summaryLines(BOOKING))).toEqual([
      {
        lineId: 'lodge',
        title: 'Écolodge des bolongs',
        when: 'du 15 mars 2027 au 19 mars 2027 · 4 nuits',
        travellers: '2 adultes, 1 enfant',
        price: '360 000 FCFA',
        cancelled: false,
      },
      {
        lineId: 'pirogue',
        title: 'Pirogue au coucher du soleil',
        when: '16 mars 2027 · 17:30',
        travellers: '2 adultes, 1 enfant, 1 bébé',
        price: '82 350 FCFA',
        cancelled: false,
      },
      {
        lineId: 'in',
        title: 'Transfert AIBD → Saloum',
        when: '15 mars 2027 · aller · 09:40',
        travellers: '2 adultes, 1 enfant, 1 bébé',
        price: '45 000 FCFA',
        cancelled: true,
      },
    ]);
  });

  it('totaux, euro indicatif et solde avec échéance', () => {
    expect(plain(summaryTotals(BOOKING))).toEqual({
      total: '487 350 FCFA',
      totalEur: '≈ 743 €',
      paid: '146 300 FCFA',
      balance: { amount: '341 050 FCFA', dueDate: '1 mars 2027' },
    });
    expect(
      summaryTotals({ ...BOOKING, paymentPlan: 'full', balanceDueDate: null }).balance,
    ).toBeNull();
    // Solde payé (US2) : plus de reste à payer sur l'écran, les messages et le bon PDF.
    expect(summaryTotals({ ...BOOKING, amountPaid: 487_350 }).balance).toBeNull();
  });

  it('anglais', () => {
    const [lodge] = summaryLines({ ...BOOKING, locale: 'en' });
    expect(lodge?.when).toBe('15 Mar 2027 to 19 Mar 2027 · 4 nights');
    expect(lodge?.travellers).toBe('2 adults, 1 child');
  });

  it('texte WhatsApp : mêmes lignes, prestations annulées exclues', () => {
    const lines = summaryLines(BOOKING);
    const text = summaryText(BOOKING).split('\n');
    expect(text).toHaveLength(2);
    expect(text[0]).toBe(
      `• ${lines[0]?.title} — ${lines[0]?.when} — ${lines[0]?.travellers} — ${lines[0]?.price}`,
    );
  });
});
