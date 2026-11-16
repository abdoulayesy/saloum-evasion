'use client';

import { useActionState, useEffect, useRef, useState, type FormEvent } from 'react';
import { durationBucket, pageType, track } from '@/lib/analytics';
import { clearDraft, readDraft, type DraftItem } from '@/lib/request/draft';
import { submitStayRequest, type FormValues, type SubmitResult } from '@/lib/request/submit';

// Formulaire de demande de séjour (T144, contrat request-form.md §2) : 360 px d'abord,
// fonctionne sans JavaScript (Server Action + redirection 303). Avec JavaScript : éléments et
// dates de la « demande en cours » fusionnés, steppers de 44 px, focus sur le premier champ
// fautif, envoi bloqué hors connexion (saisies conservées) et pendant un envoi en cours,
// confirmation affichée sur place.

export type RequestFormLabels = Record<string, string>;

type TermsEntry = { title: string; summary: string };

type RequestFormProps = {
  locale: 'fr' | 'en';
  submissionId: string;
  startedAt: number;
  sourcePath: string;
  initialItems: readonly DraftItem[];
  initialTrip: { arrivalDate?: string; departureDate?: string; adults?: number; children?: number };
  today: string;
  moods: readonly { value: string; label: string }[];
  budgets: readonly { value: string; label: string }[];
  cancellationTerms: readonly TermsEntry[];
  privacyHref: string;
  homeHref: string;
  whatsappHref: string | null;
  labels: RequestFormLabels;
  errorMessages: Record<string, string>;
};

const DIAL_CODES = [
  '+221',
  '+33',
  '+32',
  '+41',
  '+1',
  '+44',
  '+49',
  '+34',
  '+39',
  '+212',
  '+225',
  '+223',
  '+224',
  '+222',
  '+220',
];

const FIELD_ORDER = [
  'items',
  'arrivalDate',
  'departureDate',
  'adults',
  'children',
  'firstName',
  'whatsapp',
  'email',
  'message',
  'consent',
];
const FIELD_INPUT: Record<string, string> = { whatsapp: 'whatsappLocal' };

// Base sans largeur (une seule classe de largeur par champ : pas de conflit d'utilitaires).
const fieldBase =
  'mt-1 block min-h-touch rounded-control border border-line bg-white px-3 text-base text-ink';
const field = `${fieldBase} w-full`;
const stepperButton =
  'inline-flex h-touch w-touch shrink-0 items-center justify-center rounded-control border border-line bg-white text-xl font-semibold text-mangrove';

const valueOf = (values: FormValues | undefined, key: string): string | undefined => {
  const value = values?.[key];
  return typeof value === 'string' ? value : undefined;
};

const listOf = (values: FormValues | undefined, key: string): string[] | undefined => {
  const value = values?.[key];
  return Array.isArray(value) ? value : undefined;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export const RequestForm = (props: RequestFormProps) => {
  const { labels, errorMessages } = props;
  const [state, formAction, pending] = useActionState<SubmitResult | null, FormData>(
    submitStayRequest,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [enhanced, setEnhanced] = useState(false);
  const [offline, setOffline] = useState(false);
  const values = state && state.status !== 'ok' ? state.values : undefined;
  const fieldErrors: Record<string, string | undefined> =
    state?.status === 'invalid' ? { ...state.fieldErrors } : {};

  const [items, setItems] = useState<DraftItem[]>([...props.initialItems]);
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(props.initialItems.map((item) => `${item.kind}:${item.slug}`)),
  );
  const [arrival, setArrival] = useState(props.initialTrip.arrivalDate ?? '');
  const [departure, setDeparture] = useState(props.initialTrip.departureDate ?? '');
  const [adults, setAdults] = useState(props.initialTrip.adults ?? 2);
  const [children, setChildren] = useState(props.initialTrip.children ?? 0);

  // Fusion de la « demande en cours » (stockage local), après hydratation seulement.
  useEffect(() => {
    setEnhanced(true);
    const draft = readDraft();
    setItems((current) => {
      const known = new Set(current.map((item) => `${item.kind}:${item.slug}`));
      const extra = draft.items.filter((item) => !known.has(`${item.kind}:${item.slug}`));
      if (extra.length > 0) {
        setChecked(
          (previous) => new Set([...previous, ...extra.map((item) => `${item.kind}:${item.slug}`)]),
        );
      }
      return [...current, ...extra].slice(0, 10);
    });
    if (!props.initialTrip.arrivalDate && draft.arrivalDate) setArrival(draft.arrivalDate);
    if (!props.initialTrip.departureDate && draft.departureDate) setDeparture(draft.departureDate);
    if (props.initialTrip.adults === undefined && draft.adults) setAdults(draft.adults);
    if (props.initialTrip.children === undefined && draft.children) setChildren(draft.children);
  }, [props.initialTrip]);

  // Erreurs : focus sur le premier champ fautif (WCAG 3.3.1).
  useEffect(() => {
    if (state?.status !== 'invalid') return;
    const first = FIELD_ORDER.find((key) => key in state.fieldErrors);
    if (!first) return;
    const name = FIELD_INPUT[first] ?? first;
    const element = formRef.current?.querySelector<HTMLElement>(`[name="${name}"]`);
    element?.focus();
  }, [state]);

  useEffect(() => {
    if (!state) return;
    if (state.status === 'ok') {
      clearDraft();
      track('request_submitted', {
        itemsCount: checked.size,
        locale: props.locale,
        sourcePageType: pageType(props.sourcePath),
        durationBucket: durationBucket(Date.now() - props.startedAt),
      });
      return;
    }
    track('request_failed', { reason: state.status });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- un évènement par résultat
  }, [state]);

  useEffect(() => {
    track('request_form_view', { itemsCount: props.initialItems.length });
  }, [props.initialItems.length]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (pending) {
      event.preventDefault();
      return;
    }
    if (!navigator.onLine) {
      event.preventDefault();
      setOffline(true);
      return;
    }
    setOffline(false);
  };

  if (state?.status === 'ok') {
    return (
      <section
        aria-labelledby="demande-confirmation"
        data-request-confirmation=""
        className="rounded-card bg-white p-5"
        tabIndex={-1}
      >
        <h2 id="demande-confirmation" className="text-mangrove">
          {labels.confirmationTitle}
        </h2>
        <p className="mt-2 text-lg font-semibold">
          {labels.reference?.replace('{reference}', state.reference)}
        </p>
        {labels.responseTime && <p className="mt-2">{labels.responseTime}</p>}
        <p className="mt-2 text-ink-muted">{labels.datesWish}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {state.whatsappUrl && (
            <a
              href={state.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-touch items-center justify-center rounded-control bg-ocre px-5 font-semibold text-white"
            >
              {labels.sendWhatsapp}
            </a>
          )}
          <a
            href={props.homeHref}
            className="inline-flex min-h-touch items-center justify-center rounded-control border-2 border-mangrove px-5 font-semibold text-mangrove"
          >
            {labels.backHome}
          </a>
        </div>
      </section>
    );
  }

  const errorEntries = FIELD_ORDER.flatMap((key) => {
    const code = fieldErrors[key];
    return code ? [{ key, message: errorMessages[code] ?? errorMessages.default ?? code }] : [];
  });
  const describedBy = (key: string, hint?: boolean): string | undefined =>
    [hint ? `${key}-aide` : '', key in fieldErrors ? `${key}-erreur` : '']
      .filter(Boolean)
      .join(' ') || undefined;
  const errorText = (key: string) =>
    key in fieldErrors ? (
      <p id={`${key}-erreur`} className="mt-1 text-sm font-semibold text-ocre-deep">
        {errorMessages[fieldErrors[key] ?? 'default'] ?? errorMessages.default}
      </p>
    ) : null;
  const alertMessage = offline
    ? labels.offline
    : state?.status === 'rate_limited'
      ? labels.rateLimited
      : state?.status === 'error'
        ? labels.error
        : null;

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      noValidate={enhanced}
      className="flex flex-col gap-6"
      aria-describedby={errorEntries.length > 0 ? 'demande-erreurs' : undefined}
    >
      <div aria-live="polite" role="status" className="empty:hidden">
        {alertMessage && (
          <div className="rounded-card border-2 border-ocre bg-white p-4">
            <p>{alertMessage}</p>
            {props.whatsappHref && (
              <a
                href={props.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex min-h-touch items-center font-semibold text-ocre-deep underline underline-offset-4"
              >
                {labels.whatsappFallback}
              </a>
            )}
          </div>
        )}
      </div>

      {errorEntries.length > 0 && (
        <div
          id="demande-erreurs"
          role="alert"
          className="rounded-card border-2 border-ocre bg-white p-4"
        >
          <p className="font-semibold">{labels.errorsSummary}</p>
          <ul className="mt-2 list-disc pl-5">
            {errorEntries.map((entry) => (
              <li key={entry.key}>
                <a href={`#champ-${entry.key}`} className="underline underline-offset-4">
                  {entry.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <input type="hidden" name="enhanced" value={enhanced ? '1' : ''} />
      <input type="hidden" name="submissionId" value={props.submissionId} />
      <input type="hidden" name="startedAt" value={props.startedAt} />
      <input type="hidden" name="locale" value={props.locale} />
      <input type="hidden" name="sourcePath" value={props.sourcePath} />
      <div aria-hidden="true" className="honeypot">
        <label>
          Site web
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <fieldset id="champ-items" className="min-w-0">
        <legend className="font-serif text-2xl font-semibold text-mangrove">
          {labels.itemsLegend}
        </legend>
        {items.length > 0 ? (
          <>
            <p className="mt-1 text-sm text-ink-muted">{labels.itemsHint}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {items.map((item) => {
                const key = `${item.kind}:${item.slug}`;
                return (
                  <li key={key}>
                    <label
                      htmlFor={`element-${item.kind}-${item.slug}`}
                      className="flex min-h-touch items-center gap-3 rounded-control bg-white px-3"
                    >
                      <input
                        id={`element-${item.kind}-${item.slug}`}
                        type="checkbox"
                        name="items"
                        value={key}
                        checked={checked.has(key)}
                        onChange={(event) =>
                          setChecked((previous) => {
                            const next = new Set(previous);
                            if (event.target.checked) next.add(key);
                            else next.delete(key);
                            return next;
                          })
                        }
                        className="h-5 w-5 accent-mangrove"
                      />
                      <span className="min-w-0 font-semibold">
                        <span className="block text-sm font-normal text-ink-muted">
                          {labels[`kind_${item.kind}`]}
                        </span>
                        {item.title}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-ink-muted">{labels.noItemsSelected}</p>
        )}
      </fieldset>

      <fieldset className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-serif text-2xl font-semibold text-mangrove">
          {labels.datesLegend}
        </legend>
        <div id="champ-arrivalDate" className="min-w-0">
          <label htmlFor="arrivalDate" className="font-semibold">
            {labels.arrival}
          </label>
          <input
            id="arrivalDate"
            type="date"
            name="arrivalDate"
            required
            autoComplete="off"
            min={props.today}
            value={
              valueOf(values, 'arrivalDate') !== undefined && !arrival
                ? valueOf(values, 'arrivalDate')
                : arrival
            }
            onChange={(event) => setArrival(event.target.value)}
            aria-invalid={'arrivalDate' in fieldErrors || undefined}
            aria-describedby={describedBy('arrivalDate')}
            className={field}
          />
          {errorText('arrivalDate')}
        </div>
        <div id="champ-departureDate" className="min-w-0">
          <label htmlFor="departureDate" className="font-semibold">
            {labels.departure}
          </label>
          <input
            id="departureDate"
            type="date"
            name="departureDate"
            autoComplete="off"
            min={arrival || props.today}
            value={
              valueOf(values, 'departureDate') !== undefined && !departure
                ? valueOf(values, 'departureDate')
                : departure
            }
            onChange={(event) => setDeparture(event.target.value)}
            aria-invalid={'departureDate' in fieldErrors || undefined}
            aria-describedby={describedBy('departureDate')}
            className={field}
          />
          {errorText('departureDate')}
        </div>
      </fieldset>

      <fieldset className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-serif text-2xl font-semibold text-mangrove">
          {labels.travellersLegend}
        </legend>
        {(
          [
            [
              'adults',
              labels.adults,
              adults,
              setAdults,
              1,
              30,
              labels.fewerAdults,
              labels.moreAdults,
            ],
            [
              'children',
              labels.children,
              children,
              setChildren,
              0,
              20,
              labels.fewerChildren,
              labels.moreChildren,
            ],
          ] as const
        ).map(([name, label, value, setValue, min, max, fewer, more]) => (
          <div key={name} id={`champ-${name}`} className="min-w-0">
            <label htmlFor={name} className="font-semibold">
              {label}
            </label>
            <div className="mt-1 flex items-center gap-2">
              {enhanced && (
                <button
                  type="button"
                  className={stepperButton}
                  aria-label={fewer}
                  aria-controls={name}
                  disabled={value <= min}
                  onClick={() => setValue(clamp(value - 1, min, max))}
                >
                  −
                </button>
              )}
              <input
                id={name}
                type="number"
                name={name}
                inputMode="numeric"
                min={min}
                max={max}
                required={name === 'adults'}
                value={value}
                onChange={(event) => setValue(clamp(Number(event.target.value), min, max))}
                aria-invalid={name in fieldErrors || undefined}
                aria-describedby={describedBy(name)}
                className={`${fieldBase} mt-0 w-20 text-center`}
              />
              {enhanced && (
                <button
                  type="button"
                  className={stepperButton}
                  aria-label={more}
                  aria-controls={name}
                  disabled={value >= max}
                  onClick={() => setValue(clamp(value + 1, min, max))}
                >
                  +
                </button>
              )}
            </div>
            {errorText(name)}
          </div>
        ))}
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="mb-2 font-serif text-2xl font-semibold text-mangrove">
          {labels.moodsLegend}
        </legend>
        <div className="flex flex-wrap gap-2">
          {props.moods.map((mood) => (
            <label
              key={mood.value}
              className="inline-flex min-h-touch max-w-full cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-4 has-[:checked]:border-mangrove has-[:checked]:bg-mangrove has-[:checked]:text-sable"
            >
              <input
                type="checkbox"
                name="moods"
                value={mood.value}
                defaultChecked={listOf(values, 'moods')?.includes(mood.value)}
                className="h-4 w-4 accent-mangrove"
              />
              <span className="min-w-0">{mood.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="mb-2 font-serif text-2xl font-semibold text-mangrove">
          {labels.budgetLegend}
        </legend>
        <div className="flex flex-col gap-2">
          {[{ value: '', label: labels.budgetAny ?? '' }, ...props.budgets].map((budget) => (
            <label
              key={budget.value || 'aucun'}
              className="flex min-h-touch items-center gap-3 rounded-control bg-white px-3"
            >
              <input
                type="radio"
                name="budgetBand"
                value={budget.value}
                defaultChecked={(valueOf(values, 'budgetBand') ?? '') === budget.value}
                className="h-5 w-5 accent-mangrove"
              />
              {budget.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid min-w-0 grid-cols-1 gap-4">
        <legend className="mb-2 font-serif text-2xl font-semibold text-mangrove">
          {labels.contactLegend}
        </legend>
        <div id="champ-firstName" className="min-w-0">
          <label htmlFor="firstName" className="font-semibold">
            {labels.firstName}
          </label>
          <input
            id="firstName"
            type="text"
            name="firstName"
            required
            maxLength={60}
            autoComplete="given-name"
            defaultValue={valueOf(values, 'firstName')}
            aria-invalid={'firstName' in fieldErrors || undefined}
            aria-describedby={describedBy('firstName')}
            className={field}
          />
          {errorText('firstName')}
        </div>
        <div id="champ-whatsapp" className="min-w-0">
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
              defaultValue={valueOf(values, 'dialCode') ?? '+221'}
              autoComplete="tel-country-code"
              className={`${fieldBase} mt-0 w-28 shrink-0`}
            >
              {DIAL_CODES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <input
              id="whatsappLocal"
              type="tel"
              name="whatsappLocal"
              required
              inputMode="tel"
              autoComplete="tel-national"
              defaultValue={valueOf(values, 'whatsappLocal')}
              aria-labelledby="whatsapp-libelle"
              aria-invalid={'whatsapp' in fieldErrors || undefined}
              aria-describedby={describedBy('whatsapp', true)}
              className={`${fieldBase} mt-0 min-w-0 flex-1 basis-40`}
            />
          </div>
          {errorText('whatsapp')}
        </div>
        <div id="champ-email" className="min-w-0">
          <label htmlFor="email" className="font-semibold">
            {labels.email}
          </label>
          <p id="email-aide" className="text-sm text-ink-muted">
            {labels.emailHint}
          </p>
          <input
            id="email"
            type="email"
            name="email"
            inputMode="email"
            autoComplete="email"
            defaultValue={valueOf(values, 'email')}
            aria-invalid={'email' in fieldErrors || undefined}
            aria-describedby={describedBy('email', true)}
            className={field}
          />
          {errorText('email')}
        </div>
        <div id="champ-message" className="min-w-0">
          <label htmlFor="message" className="font-semibold">
            {labels.message}
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            maxLength={1000}
            defaultValue={valueOf(values, 'message')}
            aria-describedby={describedBy('message')}
            className={`${field} py-2`}
          />
          {errorText('message')}
        </div>
      </fieldset>

      {props.cancellationTerms.length > 0 && (
        <section aria-labelledby="demande-annulation" className="rounded-card bg-sable-deep p-4">
          <h2 id="demande-annulation" className="text-xl text-mangrove">
            {labels.cancellationTitle}
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            {props.cancellationTerms.map((terms) => (
              <li key={terms.title}>
                <span className="font-semibold">{terms.title}</span> : {terms.summary}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div id="champ-consent" className="min-w-0">
        <label className="flex min-h-touch items-center gap-3">
          <input
            type="checkbox"
            name="consent"
            required
            defaultChecked={valueOf(values, 'consent') === 'on'}
            aria-invalid={'consent' in fieldErrors || undefined}
            aria-describedby={describedBy('consent')}
            className="h-5 w-5 shrink-0 accent-mangrove"
          />
          <span>{labels.consent}</span>
        </label>
        <a
          href={props.privacyHref}
          className="ml-8 inline-flex min-h-touch items-center text-sm underline underline-offset-4"
        >
          {labels.privacyLink}
        </a>
        {errorText('consent')}
      </div>

      <div className="request-submit sticky bottom-0 -mx-4 border-t border-sable-deep bg-sable/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <button
          type="submit"
          disabled={pending}
          aria-disabled={pending}
          className="inline-flex min-h-touch w-full items-center justify-center rounded-control bg-mangrove px-6 font-semibold text-sable disabled:opacity-70 sm:w-auto"
        >
          {pending ? labels.submitting : labels.submit}
        </button>
      </div>
    </form>
  );
};
