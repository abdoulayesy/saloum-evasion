'use client';

import { useEffect, useState } from 'react';
import { track } from '@/lib/analytics';

// Avis de langue (T156, T157), en surimpression (aucun décalage de mise en page) :
// - après une bascule vers une page sans traduction publiée (`?from=missing`), avis indiquant
//   que l'on est sur la page la plus proche ;
// - sur une page française, si le navigateur est réglé en anglais, bandeau refermable proposant
//   la version anglaise ; choix mémorisé localement, jamais de redirection automatique.

type LocaleNoticesProps = {
  locale: 'fr' | 'en';
  missingText: string;
  bannerText: string;
  bannerLink: string;
  switchHref: string;
  closeLabel: string;
  /** Libellé de fermeture du bandeau, en anglais comme le bandeau. */
  bannerCloseLabel: string;
};

const DISMISS_KEY = 'se.english-banner.dismissed';

const prefersEnglish = (): boolean => {
  const [first] = navigator.languages.length > 0 ? navigator.languages : [navigator.language];
  return typeof first === 'string' && first.toLowerCase().startsWith('en');
};

const wasDismissed = (): boolean => {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
};

export const LocaleNotices = ({
  locale,
  missingText,
  bannerText,
  bannerLink,
  switchHref,
  closeLabel,
  bannerCloseLabel,
}: LocaleNoticesProps) => {
  const [missing, setMissing] = useState(false);
  const [banner, setBanner] = useState(false);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const fallback = search.get('from') === 'missing';
    const switchedFrom = search.get('switched');
    if (fallback) setMissing(true);
    if (switchedFrom) track('language_switch', { from: switchedFrom, to: locale, fallback });
    if (fallback || switchedFrom) {
      search.delete('from');
      search.delete('switched');
      const query = search.toString();
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${query ? `?${query}` : ''}`,
      );
    }
    if (locale === 'fr' && prefersEnglish() && !wasDismissed()) setBanner(true);
  }, [locale]);

  const dismissBanner = () => {
    setBanner(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Stockage indisponible : le bandeau reviendra à la prochaine page.
    }
  };

  if (!missing && !banner) return null;

  return (
    <div
      className="locale-notices fixed inset-x-0 top-0 z-50 flex flex-col gap-2 p-2"
      role="status"
    >
      {missing && (
        <div className="mx-auto flex w-full max-w-xl items-center gap-3 rounded-card bg-mangrove p-3 text-sable shadow-lg">
          <p className="flex-1">{missingText}</p>
          <button
            type="button"
            onClick={() => setMissing(false)}
            className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-control border border-sable/60 px-3 font-semibold"
          >
            {closeLabel}
          </button>
        </div>
      )}
      {banner && (
        <div
          lang="en"
          className="mx-auto flex w-full max-w-xl flex-wrap items-center gap-3 rounded-card bg-mangrove p-3 text-sable shadow-lg"
        >
          <p className="min-w-0 flex-1">{bannerText}</p>
          <a
            href={switchHref}
            hrefLang="en"
            className="inline-flex min-h-touch items-center rounded-control bg-sable px-4 font-semibold text-mangrove"
          >
            {bannerLink}
          </a>
          <button
            type="button"
            onClick={dismissBanner}
            className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-control border border-sable/60 px-3 font-semibold"
          >
            {bannerCloseLabel}
          </button>
        </div>
      )}
    </div>
  );
};
