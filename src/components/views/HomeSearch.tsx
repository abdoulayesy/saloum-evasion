import { getTranslations } from 'next-intl/server';
import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { DURATIONS, MOODS } from '@/lib/filters';

// Recherche de l'accueil (T094, FR-001 ; maquette « Accueil ») : barre claire posée sur le
// héro, formulaire serveur `method="get"` vers la liste des séjours, qui applique les filtres
// (durée, envie) et garde dates et voyageurs dans l'URL pour la demande. Fonctionne sans
// JavaScript. Claviers adaptés (constitution I) : dates en `type="date"`, voyageurs en
// `inputmode="numeric"`.

export const HOME_SEARCH_ID = 'recherche';

const tile =
  'flex min-w-0 flex-[1_1_9.5rem] flex-col gap-1 rounded-2xl bg-paper px-4 pt-2.5 pb-1 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus';
const tileLabel = 'text-xs font-bold tracking-[0.08em] text-ink-muted uppercase';
const control =
  'min-h-touch w-full max-w-full min-w-0 border-0 bg-transparent p-0 text-base text-ink focus:outline-none';

export const HomeSearch = async ({ locale }: { locale: Locale }) => {
  const t = await getTranslations({ locale, namespace: 'home' });
  const tDurations = await getTranslations({ locale, namespace: 'durations' });
  const tMoods = await getTranslations({ locale, namespace: 'moods' });
  return (
    <section
      id={HOME_SEARCH_ID}
      aria-labelledby="recherche-titre"
      tabIndex={-1}
      className="scroll-mt-4 rounded-[22px] bg-sable p-2.5 text-ink shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)] lg:max-w-5xl"
    >
      <h2
        id="recherche-titre"
        className="px-3 pt-1 pb-2 font-sans text-xs font-bold tracking-[0.14em] text-ocre uppercase"
      >
        {t('searchTitle')}
      </h2>
      <form
        method="get"
        action={buildPath(locale, { type: 'staysList' })}
        className="flex flex-wrap gap-1.5"
      >
        <label className={tile}>
          <span className={tileLabel}>{t('arrival')}</span>
          <input type="date" name="arrivee" autoComplete="off" className={control} />
        </label>
        <label className={tile}>
          <span className={tileLabel}>{t('departure')}</span>
          <input type="date" name="depart" autoComplete="off" className={control} />
        </label>
        <label className={tile}>
          <span className={tileLabel}>{t('travellers')}</span>
          <input
            type="number"
            name="adultes"
            inputMode="numeric"
            min={1}
            max={30}
            defaultValue={2}
            className={control}
          />
        </label>
        <label className={tile}>
          <span className={tileLabel}>{t('duration')}</span>
          <select name="duree" defaultValue="" className={control}>
            <option value="">{t('anyDuration')}</option>
            {DURATIONS.map((duration) => (
              <option key={duration} value={duration}>
                {tDurations(duration)}
              </option>
            ))}
          </select>
        </label>
        <label className={tile}>
          <span className={tileLabel}>{t('mood')}</span>
          <select name="envie" defaultValue="" className={control}>
            <option value="">{t('anyMood')}</option>
            {MOODS.map((mood) => (
              <option key={mood} value={mood}>
                {tMoods(mood)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex min-h-16 flex-[1_1_100%] items-center justify-center gap-2.5 rounded-2xl bg-ocre px-7 font-bold text-cream transition-colors hover:bg-ocre-deep active:scale-[0.97] sm:flex-[0_1_auto]"
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          {t('search')}
        </button>
      </form>
    </section>
  );
};
