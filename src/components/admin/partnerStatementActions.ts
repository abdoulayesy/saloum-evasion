'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getPayloadClient } from '@/lib/cms/queries';
import { periodErrors } from '@/lib/checkout/statement';
import { FINANCE_ROLES, PARTNER_STATEMENT_PATH } from './partnerStatementPath';

// Action « Enregistrer un reversement » de la vue des relevés (002, US5, T095, FR-036) :
// rôles `finance` et `admin`. Le reversement est effectué hors du site (virement, Wave, Orange
// Money, espèces) puis saisi ici ; il est rattaché au relevé dont il couvre la période.

const civilDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const PayoutInput = z.object({
  partnerId: z.coerce.number().int().positive(),
  periodStart: civilDate,
  periodEnd: civilDate,
  amount: z.coerce.number().int().positive(),
  method: z.enum(['bank_transfer', 'wave', 'orange_money', 'cash']),
  reference: z.string().trim().max(200).optional(),
  paidAt: civilDate,
});

const backTo = (input: { partnerId?: unknown; periodStart?: unknown; periodEnd?: unknown }) => {
  const query = new URLSearchParams({
    prestataire: String(input.partnerId ?? ''),
    du: String(input.periodStart ?? ''),
    au: String(input.periodEnd ?? ''),
  });
  return `${PARTNER_STATEMENT_PATH}?${query.toString()}`;
};

export const recordPayout = async (formData: FormData): Promise<void> => {
  const payload = await getPayloadClient();
  const { user } = await payload.auth({ headers: await headers() });
  const role = user && 'role' in user ? user.role : null;
  if (!user || typeof role !== 'string' || !FINANCE_ROLES.has(role)) redirect('/admin/login');

  const raw = Object.fromEntries(formData);
  const parsed = PayoutInput.safeParse(raw);
  if (
    !parsed.success ||
    periodErrors({ from: parsed.data.periodStart, to: parsed.data.periodEnd }).length > 0
  ) {
    redirect(`${backTo(raw)}&erreur=reversement`);
  }
  const input = parsed.data;
  await payload.create({
    collection: 'payouts',
    data: {
      partner: input.partnerId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      amount: input.amount,
      method: input.method,
      reference: input.reference || null,
      paidAt: `${input.paidAt}T12:00:00.000Z`,
      recordedBy: user.id,
    },
    user,
    overrideAccess: false,
  });
  redirect(`${backTo(input)}&enregistre=1`);
};
