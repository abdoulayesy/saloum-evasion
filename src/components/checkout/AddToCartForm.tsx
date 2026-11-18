import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { addToCart } from '@/lib/cart/actions';
import { fieldClass, labelClass, primaryButtonClass } from './fieldStyles';

// Formulaire « Ajouter au panier » (002, T046) : composant serveur, formulaire classique relié à
// une Server Action (fonctionne sans JavaScript ; la fiche reste statique). Conçu à 360 px :
// une colonne, voyageurs sur trois colonnes à partir de `sm`. Claviers : `type="date"`,
// `inputmode="numeric"`.

export type AddToCartOffer =
  | { offerType: 'accommodation'; id: number; maxGuests: number }
  | { offerType: 'stay'; id: number; maxGuests: number }
  | {
      offerType: 'experience' | 'table';
      id: number;
      maxGuests: number;
      slots: { label: string; startTime: string }[];
    };

type Props = {
  locale: Locale;
  offer: AddToCartOffer;
  /** Identifiant unique des champs quand plusieurs formulaires cohabitent (suggestions du panier). */
  idPrefix?: string;
  /** Champs cachés ajoutés (ex. `replaceLineId`). */
  hidden?: Record<string, string>;
  defaults?: { startDate?: string; endDate?: string; adults?: number };
  submitLabel?: string;
};

const Travellers = ({
  prefix,
  max,
  defaults,
  labels,
}: {
  prefix: string;
  max: number;
  defaults?: Props['defaults'];
  labels: { legend: string; adults: string; children: string; infants: string };
}) => (
  <fieldset className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
    <legend className={`${labelClass} mb-1`}>{labels.legend}</legend>
    {(
      [
        ['adults', labels.adults, 1, defaults?.adults ?? 2],
        ['children', labels.children, 0, 0],
        ['infants', labels.infants, 0, 0],
      ] as const
    ).map(([name, label, min, value]) => (
      <div key={name} className="min-w-0">
        <label htmlFor={`${prefix}-${name}`} className="text-sm">
          {label}
        </label>
        <input
          id={`${prefix}-${name}`}
          name={name}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          defaultValue={value}
          required={name === 'adults'}
          className={fieldClass}
        />
      </div>
    ))}
  </fieldset>
);

export const AddToCartForm = async ({
  locale,
  offer,
  idPrefix,
  hidden = {},
  defaults,
  submitLabel,
}: Props) => {
  const t = await getTranslations({ locale, namespace: 'cart' });
  const prefix = idPrefix ?? `ajout-${offer.offerType}-${offer.id}`;
  const travellerLabels = {
    legend: t('travellers'),
    adults: t('adults'),
    children: t('children'),
    infants: t('infants'),
  };
  return (
    <form action={addToCart} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="offerType" value={offer.offerType} />
      <input type="hidden" name="offerId" value={offer.id} />
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      {offer.offerType === 'accommodation' && (
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor={`${prefix}-start`} className={labelClass}>
              {t('startDate')}
            </label>
            <input
              id={`${prefix}-start`}
              name="startDate"
              type="date"
              required
              defaultValue={defaults?.startDate}
              className={fieldClass}
            />
          </div>
          <div className="min-w-0">
            <label htmlFor={`${prefix}-end`} className={labelClass}>
              {t('endDate')}
            </label>
            <input
              id={`${prefix}-end`}
              name="endDate"
              type="date"
              required
              defaultValue={defaults?.endDate}
              className={fieldClass}
            />
          </div>
        </div>
      )}

      {offer.offerType === 'stay' && (
        <div className="min-w-0">
          <label htmlFor={`${prefix}-start`} className={labelClass}>
            {t('startDate')}
          </label>
          <input
            id={`${prefix}-start`}
            name="startDate"
            type="date"
            required
            defaultValue={defaults?.startDate}
            className={fieldClass}
          />
        </div>
      )}

      {(offer.offerType === 'experience' || offer.offerType === 'table') && (
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor={`${prefix}-date`} className={labelClass}>
              {t('date')}
            </label>
            <input
              id={`${prefix}-date`}
              name="date"
              type="date"
              required
              defaultValue={defaults?.startDate}
              className={fieldClass}
            />
          </div>
          <div className="min-w-0">
            <label htmlFor={`${prefix}-slot`} className={labelClass}>
              {t('slot')}
            </label>
            <select id={`${prefix}-slot`} name="slot" required className={fieldClass}>
              {offer.slots.map((slot) => (
                <option key={slot.startTime} value={slot.startTime}>
                  {slot.label === slot.startTime
                    ? slot.startTime
                    : `${slot.label} · ${slot.startTime}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <Travellers
        prefix={prefix}
        max={offer.maxGuests}
        defaults={defaults}
        labels={travellerLabels}
      />

      <button type="submit" className={primaryButtonClass}>
        {submitLabel ?? t('addToCart')}
      </button>
    </form>
  );
};
