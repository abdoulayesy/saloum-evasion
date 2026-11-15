import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { formatEur, formatXof } from '@/lib/pricing';

type PriceProps = {
  locale: Locale;
  amountXof: number;
  unit: 'perPerson' | 'perNight';
  /** Afficher « À partir de ». */
  from?: boolean;
  size?: 'md' | 'lg';
};

// Prix TTC en FCFA (référence) + équivalent indicatif en euros (constitution V et VI).
// Chiffres tabulaires ; retour à la ligne autorisé à 200 % de zoom.
export const Price = async ({ locale, amountXof, unit, from = true, size = 'md' }: PriceProps) => {
  const t = await getTranslations({ locale, namespace: 'price' });
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 tabular-nums">
      {from && <span className="text-sm text-ink-muted">{t('from')}</span>}
      <span
        className={
          size === 'lg'
            ? 'font-serif text-3xl font-semibold text-mangrove'
            : 'text-xl font-semibold text-mangrove'
        }
      >
        {/* Retour à la ligne permis avant « FCFA » (zoom 200 %), jamais dans le nombre. */}
        {formatXof(amountXof).replace('\u00a0', ' ')}
      </span>
      <span className="text-sm text-ink-muted">
        {t('ttc')} {t(unit)}
      </span>
      <span className="text-sm text-ink-muted">
        ({formatEur(amountXof, locale)} {t('indicative')})
      </span>
    </p>
  );
};
