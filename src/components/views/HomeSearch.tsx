import { getTranslations } from 'next-intl/server';
import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { DURATIONS, MOODS } from '@/lib/filters';

// Recherche de l'accueil (T094, FR-001) : formulaire serveur `method="get"` vers la liste des
// séjours, qui applique les filtres (durée, envie) et garde dates et voyageurs dans l'URL
// pour la demande. Fonctionne sans JavaScript. Claviers adaptés (constitution I) : dates en
// `type="date"`, voyageurs en `inputmode="numeric"`.

export const HOME_SEARCH_ID = 'recherche';

export const HomeSearch = async ({ locale }: { locale: Locale }) => {
  const t = await getTranslations({ locale, namespace: 'home' });
  const tDurations = await getTranslations({ locale, namespace: 'durations' });
  const tMoods = await getTranslations({ locale, namespace: 'moods' });
  const field = 'mt-1 block min-h-touch w-full rounded-control border border-line bg-white px-3';
  return (
    <section
      id={HOME_SEARCH_ID}
      aria-labelledby="recherche-titre"
      tabIndex={-1}
      className="rounded-card bg-white p-4 shadow-sm sm:p-6"
    >
      <h2 id="recherche-titre" className="text-2xl text-mangrove">
        {t('searchTitle')}
      </h2>
      <form
        method="get"
        action={buildPath(locale, { type: 'staysList' })}
        className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4"
      >
        <label className="font-semibold">
          {t('arrival')}
          <input type="date" name="arrivee" autoComplete="off" className={field} />
        </label>
        <label className="font-semibold">
          {t('departure')}
          <input type="date" name="depart" autoComplete="off" className={field} />
        </label>
        <label className="font-semibold">
          {t('adults')}
          <input
            type="number"
            name="adultes"
            inputMode="numeric"
            min={1}
            max={30}
            defaultValue={2}
            className={field}
          />
        </label>
        <label className="font-semibold">
          {t('duration')}
          <select name="duree" defaultValue="" className={field}>
            <option value="">{t('anyDuration')}</option>
            {DURATIONS.map((duration) => (
              <option key={duration} value={duration}>
                {tDurations(duration)}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="min-w-0 md:col-span-4">
          <legend className="font-semibold">{t('moods')}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {MOODS.map((mood) => (
              <label
                key={mood}
                className="inline-flex min-h-touch max-w-full cursor-pointer items-center rounded-full border-2 border-line px-4 [overflow-wrap:anywhere] has-[:checked]:border-mangrove has-[:checked]:bg-mangrove has-[:checked]:text-sable has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
              >
                <input type="checkbox" name="envie" value={mood} className="sr-only" />
                {tMoods(mood)}
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="submit"
          className="inline-flex min-h-touch items-center justify-center rounded-control bg-mangrove px-6 font-semibold text-sable md:col-span-4 md:justify-self-start"
        >
          {t('search')}
        </button>
      </form>
    </section>
  );
};
