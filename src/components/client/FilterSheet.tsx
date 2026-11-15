'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import {
  EMPTY_FILTERS,
  isEmptyFilters,
  matchesFilters,
  parseFilters,
  serializeFilters,
  toBudget,
  toDuration,
  toggleValue,
  type StayFilters,
} from '@/lib/filters';
import type { BudgetBand, DurationCategory } from '@/lib/pricing';

// Panneau de filtres (T089, FR-018) : monte du bas de l'écran (<dialog> modal : focus enfermé,
// Échap et bouton retour d'Android natifs, focus rendu à la fermeture), glissement vers le
// bas et clic sur le fond pour fermer, puces ≥ 44 px, « Voir N séjours » et « Réinitialiser ».
// Filtre les cartes rendues par le serveur (attributs data-*) et synchronise l'URL.
// Rendu seulement avec JavaScript : sans JS, la liste complète reste affichée.

type Option<T extends string> = { value: T; label: string };

type Plural = { zero: string; one: string; other: string };

type FilterSheetProps = {
  openLabel: string;
  title: string;
  closeLabel: string;
  resetLabel: string;
  groupLabels: { duration: string; mood: string; budget: string };
  durations: Option<DurationCategory>[];
  moods: Option<string>[];
  budgets: Option<BudgetBand>[];
  applyLabel: Plural;
  resultsLabel: Plural;
};

const plural = (labels: Plural, count: number): string =>
  (count === 0 ? labels.zero : count === 1 ? labels.one : labels.other).replace('#', String(count));

const readCards = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-stay-card]')).map((card) => ({
    item: card.closest('li') ?? card,
    stay: {
      durationCategory: toDuration(card.dataset.duration),
      moods: (card.dataset.moods ?? '').split(',').filter(Boolean),
      budgetBand: toBudget(card.dataset.budget),
    },
  }));

export const FilterSheet = (props: FilterSheetProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dragStart = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [applied, setApplied] = useState<StayFilters>(EMPTY_FILTERS);
  const [draft, setDraft] = useState<StayFilters>(EMPTY_FILTERS);

  const countFor = useCallback(
    (filters: StayFilters) =>
      readCards().filter(({ stay }) => matchesFilters(stay, filters)).length,
    [],
  );

  const apply = useCallback(
    (filters: StayFilters) => {
      let visible = 0;
      for (const { item, stay } of readCards()) {
        const match = matchesFilters(stay, filters);
        item.hidden = !match;
        if (match) visible += 1;
      }
      const count = document.getElementById('resultats-nombre');
      if (count) count.textContent = plural(props.resultsLabel, visible);
      const empty = document.getElementById('liste-vide');
      if (empty) empty.hidden = visible > 0;
      const query = serializeFilters(filters, new URLSearchParams(window.location.search));
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${query ? `?${query}` : ''}`,
      );
      setApplied(filters);
    },
    [props.resultsLabel],
  );

  useEffect(() => {
    setMounted(true);
    const initial = parseFilters(new URLSearchParams(window.location.search));
    if (!isEmptyFilters(initial)) apply(initial);
  }, [apply]);

  const open = () => {
    setDraft(applied);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStart.current = event.clientY;
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current !== null && event.clientY - dragStart.current > 80) close();
    dragStart.current = null;
  };

  // Clic sur le fond (hors du contenu) : fermeture. Écouteur natif posé sur le <dialog>.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };
    dialog.addEventListener('click', onBackdrop);
    return () => dialog.removeEventListener('click', onBackdrop);
  }, [mounted]);

  if (!mounted) return null;

  const activeCount = applied.durations.length + applied.moods.length + applied.budgets.length;
  const chip = (pressed: boolean) =>
    `inline-flex min-h-touch items-center rounded-full border-2 px-4 font-semibold ${
      pressed ? 'border-mangrove bg-mangrove text-sable' : 'border-line text-ink'
    }`;

  const group = <T extends string>(
    label: string,
    options: Option<T>[],
    values: T[],
    update: (next: T[]) => StayFilters,
  ) => (
    <fieldset className="mt-6 min-w-0">
      <legend className="font-semibold">{label}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={values.includes(option.value)}
            onClick={() => setDraft(update(toggleValue(values, option.value)))}
            className={chip(values.includes(option.value))}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        className="inline-flex min-h-touch items-center gap-2 rounded-control border-2 border-mangrove px-5 font-semibold text-mangrove"
      >
        {props.openLabel}
        {activeCount > 0 && (
          <span className="rounded-full bg-mangrove px-2 text-sm text-sable">{activeCount}</span>
        )}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="filtres-titre"
        className="mx-0 mt-auto mb-0 max-h-[85dvh] w-full max-w-none rounded-t-card bg-sable p-0 text-ink backdrop:bg-scrim md:mx-auto md:mb-auto md:max-w-lg md:rounded-card"
      >
        <div className="flex max-h-[85dvh] flex-col">
          <div
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            className="flex touch-none justify-center pt-3 pb-1"
            aria-hidden="true"
          >
            <span className="h-1.5 w-12 rounded-full bg-line" />
          </div>
          <div className="flex items-center justify-between gap-2 px-4">
            <h2 id="filtres-titre" className="text-2xl">
              {props.title}
            </h2>
            <button
              type="button"
              onClick={close}
              className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-control underline underline-offset-4"
            >
              {props.closeLabel}
            </button>
          </div>
          <div className="overflow-y-auto overscroll-contain px-4 pb-4">
            {group(props.groupLabels.duration, props.durations, draft.durations, (durations) => ({
              ...draft,
              durations,
            }))}
            {group(props.groupLabels.mood, props.moods, draft.moods, (moods) => ({
              ...draft,
              moods: parseFilters(new URLSearchParams({ envie: moods.join(',') })).moods,
            }))}
            {group(props.groupLabels.budget, props.budgets, draft.budgets, (budgets) => ({
              ...draft,
              budgets,
            }))}
          </div>
          <div className="flex gap-3 border-t border-sable-deep px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => setDraft(EMPTY_FILTERS)}
              className="inline-flex min-h-touch flex-1 items-center justify-center rounded-control border-2 border-mangrove font-semibold text-mangrove"
            >
              {props.resetLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                apply(draft);
                close();
              }}
              className="inline-flex min-h-touch flex-[2] items-center justify-center rounded-control bg-mangrove px-4 font-semibold text-sable"
            >
              {plural(props.applyLabel, countFor(draft))}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
};
