'use server';

import { headers } from 'next/headers';
import { redirect, unstable_rethrow } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { buildRequestReference } from '@/collections/Requests';
import { buildPath } from '@/i18n/pathnames';
import { isLocale, type Locale } from '@/i18n/routing';
import { getPayloadClient } from '@/lib/cms/queries';
import { getSiteSettings } from '@/lib/cms/siteSettings';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { notifyTeam } from './notify';
import { clientIp, consumeRateLimit, hashIp, payloadRateLimitStore } from './rateLimit';
import { collectionOf, resolveItems, type ResolvedItem } from './resolveItems';
import {
  isLikelyBot,
  normalizeWhatsapp,
  REQUEST_ITEM_KINDS,
  stayRequestSchema,
  type RequestItemKind,
  type StayRequestInput,
} from './schema';

// Server Action `submitStayRequest` (T141, contrat request-form.md §4). Fonctionne sans
// JavaScript : le champ caché `enhanced` n'est renseigné qu'après hydratation ; sans lui, la
// réussite redirige (303) vers la page de remerciement au lieu de renvoyer un état.

export type FieldErrors = Partial<Record<keyof StayRequestInput, string>>;

/** Valeurs saisies renvoyées pour réafficher le formulaire (y compris sans JavaScript). */
export type FormValues = Record<string, string | string[]>;

export type SubmitResult =
  | { status: 'ok'; reference: string; whatsappUrl: string | null }
  | { status: 'invalid'; fieldErrors: FieldErrors; values: FormValues }
  | { status: 'rate_limited'; values: FormValues }
  | { status: 'error'; values: FormValues };

const isKind = (value: string): value is RequestItemKind =>
  REQUEST_ITEM_KINDS.some((kind) => kind === value);

/** `items` du formulaire : valeurs « type:slug ». */
const parseItems = (values: string[]): { kind: RequestItemKind; slug: string }[] =>
  values.flatMap((value) => {
    const [kind = '', slug = ''] = value.split(':');
    return isKind(kind) && slug ? [{ kind, slug }] : [];
  });

const formValues = (form: FormData): FormValues => {
  const values: FormValues = {};
  for (const key of new Set(form.keys())) {
    if (key.startsWith('$ACTION')) continue;
    const all = form.getAll(key).filter((entry): entry is string => typeof entry === 'string');
    values[key] = key === 'items' || key === 'moods' ? all : (all[0] ?? '');
  }
  return values;
};

const text = (values: FormValues, key: string): string => {
  const value = values[key];
  return typeof value === 'string' ? value : '';
};

const list = (values: FormValues, key: string): string[] => {
  const value = values[key];
  return Array.isArray(value) ? value : [];
};

const fieldKeys: readonly (keyof StayRequestInput)[] = [
  'items',
  'arrivalDate',
  'departureDate',
  'adults',
  'children',
  'moods',
  'budgetBand',
  'firstName',
  'whatsapp',
  'email',
  'message',
  'consent',
  'website',
  'startedAt',
  'submissionId',
  'locale',
  'sourcePath',
];

const isFieldKey = (value: PropertyKey): value is keyof StayRequestInput =>
  fieldKeys.some((key) => key === value);

const thanksPath = (locale: Locale, reference: string): string =>
  `${buildPath(locale, { type: 'requestThanks' })}?ref=${encodeURIComponent(reference)}`;

const recapMessage = async (
  locale: Locale,
  data: StayRequestInput,
  reference: string,
  items: readonly ResolvedItem[],
): Promise<string> => {
  const t = await getTranslations({ locale, namespace: 'request' });
  const titles = items.map((item) => item.title).join(', ');
  return t('whatsappRecap', {
    reference,
    firstName: data.firstName,
    arrival: data.arrivalDate,
    adults: data.adults,
    children: data.children,
    items: titles || t('noItems'),
  });
};

export const submitStayRequest = async (
  _previous: SubmitResult | null,
  form: FormData,
): Promise<SubmitResult> => {
  const values = formValues(form);
  const rawLocale = text(values, 'locale');
  const locale: Locale = isLocale(rawLocale) ? rawLocale : 'fr';
  const enhanced = text(values, 'enhanced') === '1';
  const startedAt = Number(text(values, 'startedAt'));

  // 2. Robot probable : réussite factice, rien n'est enregistré ni notifié.
  if (
    isLikelyBot({
      website: text(values, 'website'),
      startedAt: Number.isFinite(startedAt) ? startedAt : undefined,
    })
  ) {
    const reference = buildRequestReference(new Date());
    if (!enhanced) redirect(thanksPath(locale, reference));
    return { status: 'ok', reference, whatsappUrl: null };
  }

  // 1. Validation.
  const parsed = stayRequestSchema.safeParse({
    items: parseItems(list(values, 'items')),
    arrivalDate: text(values, 'arrivalDate'),
    departureDate: text(values, 'departureDate'),
    adults: text(values, 'adults'),
    children: text(values, 'children') || '0',
    moods: list(values, 'moods'),
    budgetBand: text(values, 'budgetBand'),
    firstName: text(values, 'firstName'),
    whatsapp: normalizeWhatsapp(text(values, 'dialCode') || '+221', text(values, 'whatsappLocal')),
    email: text(values, 'email'),
    message: text(values, 'message'),
    consent: text(values, 'consent') || undefined,
    website: text(values, 'website'),
    startedAt: text(values, 'startedAt'),
    submissionId: text(values, 'submissionId'),
    locale,
    sourcePath: text(values, 'sourcePath') || '/',
  });
  if (!parsed.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const [key] = issue.path;
      if (key !== undefined && isFieldKey(key) && !fieldErrors[key])
        fieldErrors[key] = issue.message;
    }
    return { status: 'invalid', fieldErrors, values };
  }
  const data = parsed.data;

  try {
    const payload = await getPayloadClient();

    // 4. Idempotence : un même envoi renvoie la demande déjà créée.
    const existing = await payload.find({
      collection: 'requests',
      where: { submissionId: { equals: data.submissionId } },
      limit: 1,
      depth: 0,
    });
    const settings = await getSiteSettings(locale);
    const [previous] = existing.docs;
    if (previous?.reference) {
      if (!enhanced) redirect(thanksPath(locale, previous.reference));
      const items = await resolveItems(locale, data.items);
      return {
        status: 'ok',
        reference: previous.reference,
        whatsappUrl: buildWhatsAppLink({
          number: settings.whatsapp,
          message: await recapMessage(locale, data, previous.reference, items),
        }),
      };
    }

    // 3. Limitation de débit.
    const salt = process.env.RATE_LIMIT_SALT ?? '';
    const allowed = await consumeRateLimit(
      payloadRateLimitStore(payload),
      hashIp(clientIp(await headers()), salt),
      new Date(),
    );
    if (!allowed) return { status: 'rate_limited', values };

    // 5–6. Éléments résolus et création de la demande.
    const items = await resolveItems(locale, data.items);
    const request = await payload.create({
      collection: 'requests',
      data: {
        submissionId: data.submissionId,
        status: 'new',
        items: items.map((item) => ({
          kind: item.kind,
          doc: { relationTo: collectionOf(item.kind), value: item.id },
          titleSnapshot: item.title,
        })),
        arrivalDate: data.arrivalDate,
        departureDate: data.departureDate,
        adults: data.adults,
        children: data.children,
        moods: data.moods,
        budgetBand: data.budgetBand,
        firstName: data.firstName,
        whatsapp: data.whatsapp,
        email: data.email,
        message: data.message,
        locale,
        sourcePath: data.sourcePath,
        consentAt: new Date().toISOString(),
        notifyAttempts: 0,
      },
    });
    const reference = request.reference ?? '';

    // 7. Notification de l'équipe : un échec n'empêche pas la réussite (relance planifiée).
    await notifyTeam(request.id).catch(() => false);

    // 8–9. Lien WhatsApp pré-rédigé, puis réponse.
    const whatsappUrl = buildWhatsAppLink({
      number: settings.whatsapp,
      message: await recapMessage(locale, data, reference, items),
    });
    if (!enhanced) redirect(thanksPath(locale, reference));
    return { status: 'ok', reference, whatsappUrl };
  } catch (error) {
    // `redirect()` lève une exception attendue : on la laisse passer.
    unstable_rethrow(error);
    return { status: 'error', values };
  }
};
