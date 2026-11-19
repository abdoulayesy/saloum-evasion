'use client';

import { useActionState, useEffect, useRef } from 'react';
import { submitContactDetails } from '@/lib/booking/actions';
import type { ContactErrorCode, ContactField, ContactResult } from '@/lib/booking/contact';

// Étape coordonnées (002, T053) : formulaire relié à la Server Action par useActionState (fonctionne
// sans JavaScript). Résumé d'erreurs `role="alert"` avec liens vers les champs, focus déplacé sur
// le résumé ; message sous chaque champ (`aria-describedby`). Deux consentements distincts,
// jamais précochés (FR-012). Conçu à 360 px.

type Labels = {
  firstName: string;
  lastName: string;
  whatsapp: string;
  whatsappHint: string;
  dialCode: string;
  email: string;
  emailHint: string;
  specialRequest: string;
  consentProcessing: string;
  privacyLink: string;
  consentReminders: string;
  submit: string;
  errorSummary: string;
  errors: Record<ContactErrorCode | 'rateLimited' | 'generic' | 'cart', string>;
};

type Props = {
  locale: 'fr' | 'en';
  labels: Labels;
  dialCodes: readonly string[];
  privacyHref: string;
  cartHref: string;
  defaults: { firstName?: string; lastName?: string; whatsapp?: string; email?: string };
};

const FIELD_INPUT: Record<ContactField, string> = {
  firstName: 'firstName',
  lastName: 'lastName',
  whatsapp: 'whatsappLocal',
  email: 'email',
  specialRequest: 'specialRequest',
  consentProcessing: 'consentProcessing',
};

/** Ordre d'affichage des erreurs dans le résumé (ordre des champs). */
const FIELD_ORDER: readonly ContactField[] = [
  'firstName',
  'lastName',
  'whatsapp',
  'email',
  'specialRequest',
  'consentProcessing',
];

const input =
  'mt-1 block min-h-touch w-full min-w-0 rounded-control border border-line bg-white px-3 text-base text-ink';

/** Indicatif et numéro local à partir d'un numéro E.164 déjà saisi. */
const splitPhone = (phone: string | undefined, codes: readonly string[]) => {
  if (!phone) return { dialCode: '+221', local: '' };
  const code = [...codes]
    .sort((a, b) => b.length - a.length)
    .find((candidate) => phone.startsWith(candidate));
  return code
    ? { dialCode: code, local: phone.slice(code.length) }
    : { dialCode: '+221', local: phone };
};

export const ContactForm = ({
  locale,
  labels,
  dialCodes,
  privacyHref,
  cartHref,
  defaults,
}: Props) => {
  const [state, formAction, pending] = useActionState<ContactResult | null, FormData>(
    submitContactDetails,
    null,
  );
  const summaryRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state) summaryRef.current?.focus();
  }, [state]);

  const errors = state?.status === 'invalid' ? state.errors : {};
  const values = state && 'values' in state ? state.values : undefined;
  const phone = splitPhone(defaults.whatsapp, dialCodes);
  const describe = (field: ContactField, hint?: string) =>
    [hint, errors[field] ? `erreur-${field}` : undefined].filter(Boolean).join(' ') || undefined;
  const errorText = (field: ContactField) => {
    const code = errors[field];
    return code ? (
      <p id={`erreur-${field}`} className="mt-1 font-semibold text-ocre">
        {labels.errors[code]}
      </p>
    ) : null;
  };

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Site web</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state && state.status !== 'invalid' && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-control border-2 border-ocre p-4 font-semibold"
        >
          {state.status === 'rate_limited' && labels.errors.rateLimited}
          {state.status === 'error' && labels.errors.generic}
          {state.status === 'conflict' && (
            <a href={cartHref} className="underline underline-offset-4">
              {labels.errors.cart}
            </a>
          )}
        </div>
      )}
      {state?.status === 'invalid' && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-control border-2 border-ocre p-4"
        >
          <p className="font-semibold">{labels.errorSummary}</p>
          <ul className="mt-2 list-disc pl-5">
            {FIELD_ORDER.flatMap((field) => {
              const code = errors[field];
              return code
                ? [
                    <li key={field}>
                      <a href={`#${FIELD_INPUT[field]}`} className="underline underline-offset-4">
                        {labels[field]} : {labels.errors[code]}
                      </a>
                    </li>,
                  ]
                : [];
            })}
          </ul>
        </div>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="firstName" className="font-semibold">
            {labels.firstName}
          </label>
          <input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            required
            maxLength={60}
            defaultValue={values?.firstName ?? defaults.firstName}
            aria-invalid={errors.firstName ? true : undefined}
            aria-describedby={describe('firstName')}
            className={input}
          />
          {errorText('firstName')}
        </div>
        <div className="min-w-0">
          <label htmlFor="lastName" className="font-semibold">
            {labels.lastName}
          </label>
          <input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            required
            maxLength={60}
            defaultValue={values?.lastName ?? defaults.lastName}
            aria-invalid={errors.lastName ? true : undefined}
            aria-describedby={describe('lastName')}
            className={input}
          />
          {errorText('lastName')}
        </div>
      </div>

      <div className="min-w-0">
        <span id="whatsapp-libelle" className="font-semibold">
          {labels.whatsapp}
        </span>
        <p id="whatsapp-aide" className="text-sm text-ink-muted">
          {labels.whatsappHint}
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          <label htmlFor="dialCode" className="sr-only">
            {labels.dialCode}
          </label>
          <select
            id="dialCode"
            name="dialCode"
            autoComplete="tel-country-code"
            defaultValue={values?.dialCode ?? phone.dialCode}
            className="block min-h-touch w-28 shrink-0 rounded-control border border-line bg-white px-3 text-base text-ink"
          >
            {dialCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          <input
            id="whatsappLocal"
            name="whatsappLocal"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            required
            defaultValue={values?.whatsappLocal ?? phone.local}
            aria-labelledby="whatsapp-libelle"
            aria-invalid={errors.whatsapp ? true : undefined}
            aria-describedby={describe('whatsapp', 'whatsapp-aide')}
            className="block min-h-touch min-w-0 flex-1 basis-40 rounded-control border border-line bg-white px-3 text-base text-ink"
          />
        </div>
        {errorText('whatsapp')}
      </div>

      <div className="min-w-0">
        <label htmlFor="email" className="font-semibold">
          {labels.email}
        </label>
        <p id="email-aide" className="text-sm text-ink-muted">
          {labels.emailHint}
        </p>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          defaultValue={values?.email ?? defaults.email}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={describe('email', 'email-aide')}
          className={input}
        />
        {errorText('email')}
      </div>

      <div className="min-w-0">
        <label htmlFor="specialRequest" className="font-semibold">
          {labels.specialRequest}
        </label>
        <textarea
          id="specialRequest"
          name="specialRequest"
          rows={3}
          maxLength={1000}
          defaultValue={values?.specialRequest}
          aria-describedby={describe('specialRequest')}
          className={`${input} py-2`}
        />
        {errorText('specialRequest')}
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="flex min-h-touch items-start gap-3">
            <input
              id="consentProcessing"
              name="consentProcessing"
              type="checkbox"
              required
              aria-invalid={errors.consentProcessing ? true : undefined}
              aria-describedby={describe('consentProcessing')}
              className="mt-1 h-5 w-5 shrink-0 accent-mangrove"
            />
            <span>
              {labels.consentProcessing}{' '}
              <a href={privacyHref} className="underline underline-offset-4">
                {labels.privacyLink}
              </a>
            </span>
          </label>
          {errorText('consentProcessing')}
        </div>
        <label className="flex min-h-touch items-start gap-3">
          <input
            name="consentReminders"
            type="checkbox"
            className="mt-1 h-5 w-5 shrink-0 accent-mangrove"
          />
          <span>{labels.consentReminders}</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-touch w-full items-center justify-center rounded-control bg-mangrove px-6 font-semibold text-sable disabled:opacity-70 sm:w-auto"
      >
        {labels.submit}
      </button>
    </form>
  );
};
