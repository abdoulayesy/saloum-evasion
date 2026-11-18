import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { addToCart } from '@/lib/cart/actions';
import { fieldClass, labelClass, primaryButtonClass } from './fieldStyles';

// Sélecteur de transfert (002, T047) : trajet AIBD ou Dakar, aller, retour ou aller-retour,
// heures de prise en charge, passagers. Formulaire serveur sans JavaScript ; les champs du
// retour sont ignorés pour un aller simple (validation serveur).

export type TransferChoice = { id: number; title: string };

type Props = {
  locale: Locale;
  transfers: TransferChoice[];
  defaults?: { outboundDate?: string; returnDate?: string; passengers?: number };
};

export const TransferPicker = async ({ locale, transfers, defaults }: Props) => {
  if (transfers.length === 0) return null;
  const t = await getTranslations({ locale, namespace: 'cart' });
  const prefix = 'transfert';
  return (
    <form action={addToCart} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="offerType" value="transfer" />

      <div className="min-w-0">
        <label htmlFor={`${prefix}-route`} className={labelClass}>
          {t('transferRoute')}
        </label>
        <select id={`${prefix}-route`} name="offerId" required className={fieldClass}>
          {transfers.map((transfer) => (
            <option key={transfer.id} value={transfer.id}>
              {transfer.title}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-ink-muted">{t('perVehicle')}</p>
      </div>

      <fieldset className="min-w-0">
        <legend className={`${labelClass} mb-1`}>{t('direction')}</legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
          {(['both', 'outbound', 'return'] as const).map((direction) => (
            <label key={direction} className="flex min-h-touch items-center gap-3">
              <input
                type="radio"
                name="direction"
                value={direction}
                defaultChecked={direction === 'both'}
                className="h-5 w-5 shrink-0 accent-mangrove"
              />
              {t(`directions.${direction}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        {(
          [
            ['outboundDate', 'date', defaults?.outboundDate],
            ['outboundTime', 'time', undefined],
            ['returnDate', 'date', defaults?.returnDate],
            ['returnTime', 'time', undefined],
          ] as const
        ).map(([name, type, value]) => (
          <div key={name} className="min-w-0">
            <label htmlFor={`${prefix}-${name}`} className={labelClass}>
              {t(name)}
            </label>
            <input
              id={`${prefix}-${name}`}
              name={name}
              type={type}
              required={name.startsWith('outbound')}
              defaultValue={value}
              className={fieldClass}
            />
          </div>
        ))}
      </div>

      <div className="min-w-0">
        <label htmlFor={`${prefix}-passengers`} className={labelClass}>
          {t('passengers')}
        </label>
        <input
          id={`${prefix}-passengers`}
          name="passengers"
          type="number"
          inputMode="numeric"
          min={1}
          max={40}
          defaultValue={defaults?.passengers ?? 2}
          required
          className={fieldClass}
        />
      </div>

      <button type="submit" className={primaryButtonClass}>
        {t('addToCart')}
      </button>
    </form>
  );
};
