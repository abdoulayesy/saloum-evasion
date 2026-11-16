import type { Page } from '@playwright/test';

// Aides de mesure de performance en navigateur (phase 10).

/** Pages représentatives de chaque type de page publique. */
export const PAGE_TYPES: readonly { name: string; path: string }[] = [
  { name: 'accueil', path: '/fr' },
  { name: 'liste des séjours', path: '/fr/sejours' },
  { name: 'fiche séjour', path: '/fr/sejours/week-end-bolong-ndangane' },
  { name: 'centre des expériences', path: '/fr/experiences' },
  { name: 'fiche expérience', path: '/fr/experiences/mangrove-et-iles/excursion-pirogue-bolongs' },
  { name: 'destination', path: '/fr/destinations/ndangane' },
  { name: 'fiche hébergement', path: '/fr/hebergements/villa-piscine-ndangane' },
  { name: 'film', path: '/fr/film-immersion' },
  { name: 'à propos', path: '/fr/a-propos' },
  { name: 'FAQ', path: '/fr/faq' },
  { name: 'demande', path: '/fr/demande' },
];

/** Ralentit le processeur (Chromium seulement). */
export const throttleCpu = async (page: Page, rate: number): Promise<void> => {
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate', { rate });
};

/** Démarre l'observation des interactions (Event Timing) ; à appeler après le chargement. */
export const observeInteractions = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    // `durationThreshold` (Event Timing) n'est pas encore dans les types DOM de TypeScript.
    const eventOptions: PerformanceObserverInit & { durationThreshold: number } = {
      type: 'event',
      buffered: true,
      durationThreshold: 16,
    };
    const store: number[] = [];
    Object.defineProperty(window, '__interactions', { value: store, configurable: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (
          'interactionId' in entry &&
          typeof entry.interactionId === 'number' &&
          entry.interactionId > 0
        )
          store.push(entry.duration);
      }
    }).observe(eventOptions);
  });
};

/** Plus longue interaction observée depuis le dernier appel, puis remise à zéro. */
export const takeWorstInteraction = async (page: Page): Promise<number> => {
  await page.waitForTimeout(300);
  return page.evaluate(() => {
    const store: unknown = Reflect.get(window, '__interactions');
    if (!Array.isArray(store)) return 0;
    const worst = Math.max(
      0,
      ...store.filter((value): value is number => typeof value === 'number'),
    );
    store.length = 0;
    return worst;
  });
};

/** Démarre la mesure du CLS (décalages sans saisie récente). */
export const observeLayoutShift = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    let total = 0;
    Object.defineProperty(window, '__cls', { get: () => total, configurable: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const value = Reflect.get(entry, 'value');
        const recent = Reflect.get(entry, 'hadRecentInput');
        if (typeof value === 'number' && recent !== true) total += value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
};

export const readLayoutShift = async (page: Page): Promise<number> =>
  page.evaluate(() => {
    const value: unknown = Reflect.get(window, '__cls');
    return typeof value === 'number' ? value : 0;
  });
