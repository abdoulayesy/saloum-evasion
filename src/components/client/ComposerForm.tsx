'use client';

import { useState, type ReactNode } from 'react';
import {
  clampGuests,
  clampNights,
  COMPOSE_LIMITS,
  estimateComposition,
  type ComposeExperience,
} from '@/lib/checkout/compose';
import type { Season, TransferTier } from '@/lib/checkout/pricing';
import { formatEur, formatXof } from '@/lib/pricing';

// Îlot « Composer mon séjour » (maquette) : vrais champs de formulaire (radio, cases, nombres,
// date) envoyés à la Server Action `composeStay` ; fonctionne sans JavaScript (le panier calcule
// alors tout). Avec JavaScript : boutons − / +, cartes sélectionnées et total estimé en direct,
// avec les mêmes fonctions de prix que le panier. Aucun montant n'est envoyé au serveur.

export type ComposerLodging = {
  id: number;
  name: string;
  meta: string;
  lowSeasonPerNight: number;
  highSeasonPerNight: number;
  minNights: number;
  capacity: number;
  bookable: boolean;
};

export type ComposerExperience = ComposeExperience & {
  name: string;
  category: string;
  meta: string;
  bookable: boolean;
};

export type ComposerTransfer = { id: number; route: string; tiers: TransferTier[] };

export type ComposerLabels = {
  step1: string;
  step2: string;
  step2Hint: string;
  step3: string;
  perNight: string;
  arrival: string;
  nights: string;
  guests: string;
  lessNights: string;
  moreNights: string;
  lessGuests: string;
  moreGuests: string;
  onRequest: string;
  transferTitle: string;
  transferNone: string;
  /** « {route} ⇄ Ndangane · … » : `{route}` remplacé côté client. */
  transferMeta: string;
  summary: string;
  summaryLabel: string;
  /** Gabarits : `{name}`, `{count}`, `{guests}`, `{amount}`, `{total}` remplacés côté client. */
  lodgingLineOne: string;
  lodgingLineOther: string;
  experienceLine: string;
  transferLine: string;
  total: string;
  perGuest: string;
  eurNote: string;
  payment: string;
  paymentNote: string;
  pay: string;
  payShort: string;
  request: string;
  requestNote: string;
  replaceNote: string;
  conditions: string;
  times: string;
};

type Props = {
  locale: 'fr' | 'en';
  action: (formData: FormData) => Promise<void>;
  lodgings: ComposerLodging[];
  experiences: ComposerExperience[];
  transfers: ComposerTransfer[];
  seasons: Season[];
  paymentMethods: readonly string[];
  minArrival: string;
  defaultArrival: string;
  cartHasItems: boolean;
  labels: ComposerLabels;
};

const fill = (template: string, values: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );

const optionClass = (selected: boolean): string =>
  `rounded-2xl border-2 text-left text-ink transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus active:scale-[0.98] ${
    selected ? 'border-ocre bg-[#fbefe2]' : 'border-warm-line bg-paper'
  }`;

const StepTitle = ({
  index,
  id,
  title,
  hint,
}: {
  index: number;
  id: string;
  title: string;
  hint?: string;
}) => (
  <div className="flex flex-wrap items-center gap-3.5">
    <span
      aria-hidden="true"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-mangrove font-bold text-gold"
    >
      {index}
    </span>
    <h2 id={id} className="min-w-0 font-sans text-[1.375rem] font-bold [overflow-wrap:anywhere]">
      {title}
    </h2>
    {hint && <span className="text-sm text-ink-muted">{hint}</span>}
  </div>
);

const Stepper = ({
  name,
  label,
  value,
  min,
  max,
  lessLabel,
  moreLabel,
  onChange,
}: {
  name: string;
  label: string;
  value: number;
  min: number;
  max: number;
  lessLabel: string;
  moreLabel: string;
  onChange: (value: number) => void;
}) => {
  const button =
    'flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full border border-[#cdbea4] bg-sable text-xl text-ink disabled:opacity-40';
  return (
    <div className="flex min-w-0 flex-[1_1_16.5rem] flex-wrap items-center justify-between gap-3 rounded-2xl border border-warm-line bg-paper py-3 pr-3 pl-5">
      <label htmlFor={`compose-${name}`} className="font-semibold">
        {label}
      </label>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label={lessLabel}
          aria-controls={`compose-${name}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className={button}
        >
          −
        </button>
        <input
          id={`compose-${name}`}
          name={name}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value) || min)}
          className="min-h-touch w-12 [appearance:textfield] rounded-control border-0 bg-transparent text-center text-lg font-bold tabular-nums focus-visible:outline-3 focus-visible:outline-focus [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label={moreLabel}
          aria-controls={`compose-${name}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className={button}
        >
          +
        </button>
      </div>
    </div>
  );
};

const Check = ({ on }: { on: boolean }) => (
  <span
    aria-hidden="true"
    className={`flex h-6.5 w-6.5 flex-none items-center justify-center rounded-lg border-2 ${
      on ? 'border-ocre bg-ocre' : 'border-[#a89a82]'
    }`}
  >
    {on && (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff7ec"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12l5 5 9-10" />
      </svg>
    )}
  </span>
);

const Badge = ({ children }: { children: ReactNode }) => (
  <span className="rounded-full bg-sand-dark px-2.5 py-0.5 text-xs font-semibold text-[#6b4a2e]">
    {children}
  </span>
);

export const ComposerForm = ({
  locale,
  action,
  lodgings,
  experiences,
  transfers,
  seasons,
  paymentMethods,
  minArrival,
  defaultArrival,
  cartHasItems,
  labels,
}: Props) => {
  // Présélection : offres réservables en ligne d'abord (paiement direct), sinon la première.
  const [lodgingId, setLodgingId] = useState(
    (lodgings.find((item) => item.bookable) ?? lodgings[0])?.id ?? 0,
  );
  const [arrival, setArrival] = useState(defaultArrival);
  const [nights, setNights] = useState(2);
  const [guests, setGuests] = useState(2);
  const [picked, setPicked] = useState<ReadonlySet<number>>(
    () =>
      new Set(
        experiences
          .filter((experience) => experience.bookable)
          .slice(0, 2)
          .map((experience) => experience.id),
      ),
  );
  const [transferId, setTransferId] = useState<number | null>(transfers[0]?.id ?? null);

  const lodging = lodgings.find((item) => item.id === lodgingId) ?? lodgings[0];
  // Bornes de l'hébergement choisi : nuits minimum et capacité (vérifiées aussi côté serveur).
  const nightsMin = Math.max(COMPOSE_LIMITS.minNights, lodging?.minNights ?? 1);
  const guestsMax = Math.min(
    COMPOSE_LIMITS.maxGuests,
    lodging?.capacity ?? COMPOSE_LIMITS.maxGuests,
  );
  const pickLodging = (item: ComposerLodging) => {
    setLodgingId(item.id);
    setNights((current) => Math.max(current, item.minNights));
    setGuests((current) => Math.min(current, item.capacity));
  };
  const chosen = experiences.filter((experience) => picked.has(experience.id));
  const transfer = transfers.find((item) => item.id === transferId) ?? null;
  const onRequest = !lodging?.bookable || chosen.some((experience) => !experience.bookable);

  const estimate = lodging
    ? estimateComposition(
        {
          startDate: arrival || defaultArrival,
          nights,
          guests,
          lodging,
          experiences: chosen,
          transfer,
        },
        seasons,
      )
    : null;

  const toggle = (id: number) =>
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const lineLabel = (kind: string, id: number): string => {
    if (kind === 'lodging' && lodging)
      return fill(nights > 1 ? labels.lodgingLineOther : labels.lodgingLineOne, {
        name: lodging.name,
        count: nights,
      });
    if (kind === 'transfer') return labels.transferLine;
    const experience = experiences.find((item) => item.id === id);
    return fill(labels.experienceLine, { name: experience?.name ?? '', guests });
  };

  const total = estimate ? formatXof(estimate.total) : '';
  const submitLabel = onRequest ? labels.request : fill(labels.pay, { total });

  return (
    <form action={action} id="composer" className="flex flex-col gap-10 lg:flex-row lg:items-start">
      <input type="hidden" name="locale" value={locale} />

      <div className="flex min-w-0 flex-col gap-12 lg:flex-[999_1_35rem]">
        {/* ---------- 1. Hébergement ---------- */}
        <section aria-labelledby="etape-1" className="flex flex-col gap-5">
          <StepTitle index={1} id="etape-1" title={labels.step1} />
          <fieldset className="grid min-w-0 grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            <legend className="sr-only">{labels.step1}</legend>
            {lodgings.map((item) => {
              const selected = item.id === lodgingId;
              return (
                <label
                  key={item.id}
                  className={`${optionClass(selected)} flex min-h-[9.375rem] cursor-pointer flex-col gap-2 p-5.5`}
                >
                  <input
                    type="radio"
                    name="hebergement"
                    value={item.id}
                    checked={selected}
                    onChange={() => pickLodging(item)}
                    className="sr-only"
                  />
                  <span className="font-serif text-2xl leading-tight font-semibold">
                    {item.name}
                  </span>
                  <span className="text-sm leading-normal text-ink-muted">{item.meta}</span>
                  {!item.bookable && (
                    <span className="self-start">
                      <Badge>{labels.onRequest}</Badge>
                    </span>
                  )}
                  <span className="mt-auto text-[0.9375rem] font-bold">
                    {formatXof(item.lowSeasonPerNight)}{' '}
                    <span className="font-medium text-ink-muted">{labels.perNight}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>
          <div className="flex flex-wrap gap-3.5">
            <div className="flex min-w-0 flex-[1_1_100%] flex-wrap items-center justify-between gap-3 rounded-2xl border border-warm-line bg-paper py-3 pr-3 pl-5">
              <label htmlFor="compose-arrivee" className="font-semibold">
                {labels.arrival}
              </label>
              <input
                id="compose-arrivee"
                name="arrivee"
                type="date"
                required
                min={minArrival}
                value={arrival}
                onChange={(event) => setArrival(event.target.value)}
                className="min-h-touch max-w-full min-w-0 rounded-control border-0 bg-transparent px-2 text-base font-semibold focus-visible:outline-3 focus-visible:outline-focus"
              />
            </div>
            <Stepper
              name="nuits"
              label={labels.nights}
              value={nights}
              min={nightsMin}
              max={COMPOSE_LIMITS.maxNights}
              lessLabel={labels.lessNights}
              moreLabel={labels.moreNights}
              onChange={(value) => setNights(Math.max(nightsMin, clampNights(value)))}
            />
            <Stepper
              name="voyageurs"
              label={labels.guests}
              value={guests}
              min={COMPOSE_LIMITS.minGuests}
              max={guestsMax}
              lessLabel={labels.lessGuests}
              moreLabel={labels.moreGuests}
              onChange={(value) => setGuests(Math.min(guestsMax, clampGuests(value)))}
            />
          </div>
        </section>

        {/* ---------- 2. Expériences ---------- */}
        <section aria-labelledby="etape-2" className="flex flex-col gap-5">
          <StepTitle index={2} id="etape-2" title={labels.step2} hint={labels.step2Hint} />
          <fieldset className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            <legend className="sr-only">{labels.step2}</legend>
            {experiences.map((item) => {
              const selected = picked.has(item.id);
              return (
                <label
                  key={item.id}
                  className={`${optionClass(selected)} flex min-h-[4.75rem] cursor-pointer flex-wrap items-center gap-x-3.5 gap-y-1 px-4.5 py-4`}
                >
                  <input
                    type="checkbox"
                    name="experience"
                    value={item.id}
                    checked={selected}
                    onChange={() => toggle(item.id)}
                    className="sr-only"
                  />
                  <Check on={selected} />
                  <span className="flex min-w-0 flex-auto flex-col gap-0.5">
                    <span className="text-xs font-bold tracking-widest text-ocre uppercase">
                      {item.category}
                    </span>
                    <span className="leading-snug font-bold">{item.name}</span>
                    <span className="text-[0.8125rem] text-ink-muted">{item.meta}</span>
                    {!item.bookable && (
                      <span className="mt-1">
                        <Badge>{labels.onRequest}</Badge>
                      </span>
                    )}
                  </span>
                  <span className="flex-none text-sm font-bold tabular-nums">
                    {formatXof(item.pricePerPerson)}
                  </span>
                </label>
              );
            })}
          </fieldset>
        </section>

        {/* ---------- 3. Arrivée ---------- */}
        <section aria-labelledby="etape-3" className="flex flex-col gap-5">
          <StepTitle index={3} id="etape-3" title={labels.step3} />
          <fieldset className="flex min-w-0 flex-col gap-3">
            <legend className="sr-only">{labels.step3}</legend>
            {transfers.map((item) => {
              const selected = item.id === transferId;
              return (
                <label
                  key={item.id}
                  className={`${optionClass(selected)} grid cursor-pointer grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 px-5.5 py-5`}
                >
                  <input
                    type="radio"
                    name="transfert"
                    value={item.id}
                    checked={selected}
                    onChange={() => setTransferId(item.id)}
                    className="sr-only"
                  />
                  <svg
                    aria-hidden="true"
                    width="34"
                    height="34"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9e4521"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    className="row-span-2"
                  >
                    <path d="M3 17h18M5 17l2-6h10l2 6M8 11V8h8v3" />
                    <circle cx="7.5" cy="18.5" r="1.5" />
                    <circle cx="16.5" cy="18.5" r="1.5" />
                  </svg>
                  <span className="min-w-0 text-[1.0625rem] font-bold">{labels.transferTitle}</span>
                  <span className="min-w-0 text-sm text-ink-muted">
                    {fill(labels.transferMeta, { route: item.route })}
                  </span>
                </label>
              );
            })}
            <label
              className={`${optionClass(transferId === null)} flex min-h-touch cursor-pointer items-center gap-4 px-5.5 py-3`}
            >
              <input
                type="radio"
                name="transfert"
                value=""
                checked={transferId === null}
                onChange={() => setTransferId(null)}
                className="sr-only"
              />
              <span className="text-[0.9375rem] font-semibold">{labels.transferNone}</span>
            </label>
          </fieldset>
          <p className="text-sm text-ink-muted">{labels.times}</p>
        </section>
      </div>

      {/* ---------- Récapitulatif ---------- */}
      <aside
        aria-label={labels.summaryLabel}
        className="flex min-w-0 flex-col gap-5.5 rounded-[26px] bg-mangrove p-7 text-sable lg:sticky lg:top-6 lg:flex-[1_1_21rem]"
      >
        <h2 className="display text-[2rem]">{labels.summary}</h2>
        {estimate && (
          <ul aria-live="polite" className="flex flex-col gap-3 text-[0.9375rem]">
            {estimate.lines.map((line) => (
              <li
                key={`${line.kind}-${line.id}`}
                className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 border-b border-[#24443b] pb-3"
              >
                <span className="text-[#e1d8c8]">{lineLabel(line.kind, line.id)}</span>
                <span className="font-semibold whitespace-nowrap tabular-nums">
                  {formatXof(line.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {estimate && (
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <span className="text-[0.9375rem] text-[#e1d8c8]">{labels.total}</span>
              <span className="min-w-0 font-serif text-[2.5rem] font-semibold [overflow-wrap:anywhere] text-gold tabular-nums">
                {total}
              </span>
            </div>
            <p className="text-[0.8125rem] text-mist">
              {fill(labels.perGuest, { amount: formatXof(estimate.perGuest) })} ·{' '}
              {fill(labels.eurNote, { amount: formatEur(estimate.total, locale) })}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <p className="text-[0.8125rem] font-bold tracking-widest text-gold-deep uppercase">
            {labels.payment}
          </p>
          {/* Parité (constitution VI) : même rang, même taille, aucun présélectionné ; le choix se
              fait à l'étape paiement. */}
          <ul className="grid grid-cols-3 gap-2">
            {paymentMethods.map((method) => (
              <li
                key={method}
                className="flex min-h-12 min-w-0 items-center justify-center rounded-xl border-[1.5px] border-[#3a5a50] px-1 text-center text-sm font-bold [overflow-wrap:anywhere]"
              >
                {method}
              </li>
            ))}
          </ul>
          <p className="text-[0.8125rem] text-mist">{labels.paymentNote}</p>
        </div>

        {cartHasItems && <p className="text-[0.8125rem] text-gold">{labels.replaceNote}</p>}
        {onRequest && <p className="text-[0.8125rem] text-gold">{labels.requestNote}</p>}

        <button
          type="submit"
          className="min-h-[3.625rem] w-full rounded-2xl bg-ocre px-4 py-2 text-[1.0625rem] font-bold text-cream transition-colors hover:bg-ocre-deep active:scale-[0.97]"
        >
          {submitLabel}
        </button>
        <p className="text-[0.8125rem] leading-normal text-mist">{labels.conditions}</p>
      </aside>

      {/* Téléphone et tablette : total et action toujours à portée du pouce (barre collante du
          site, dans le flux en paysage bas et dès 1024 px, où le récapitulatif est visible). */}
      {estimate && (
        <>
          <div className="sticky-action-bar border-t border-[#24443b] bg-mangrove px-4 py-2.5 text-sable lg:hidden">
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <p className="flex min-w-0 flex-col leading-tight">
                <span className="text-xs text-[#e1d8c8]">{labels.total}</span>
                <span className="font-serif text-2xl font-semibold [overflow-wrap:anywhere] text-gold tabular-nums">
                  {total}
                </span>
              </p>
              <button
                type="submit"
                className="min-h-touch shrink-0 rounded-xl bg-ocre px-5 font-bold text-cream active:scale-[0.97]"
              >
                {onRequest ? labels.request : labels.payShort}
              </button>
            </div>
          </div>
          <div aria-hidden="true" className="action-bar-spacer lg:hidden" />
        </>
      )}
    </form>
  );
};
