import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { PAYMENT_METHODS } from '@/lib/payments/gateway';

// Moyens de paiement (002, T055 ; constitution VI, SC-009) : boutons radio natifs dans un même
// composant, même taille (≥ 44 px), ordre stable Wave, Orange Money, Carte, aucun présélectionné.
// Une colonne à 360 px, trois colonnes égales à partir de `sm`.

export const PaymentMethods = async ({ locale }: { locale: Locale }) => {
  const t = await getTranslations({ locale, namespace: 'payment' });
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 font-semibold">{t('choose')}</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" data-testid="payment-methods">
        {PAYMENT_METHODS.map((method) => (
          <label
            key={method}
            data-method={method}
            className="flex min-h-touch min-w-0 cursor-pointer items-center gap-3 rounded-control border-2 border-line bg-white px-4 py-3 font-semibold has-[:checked]:border-mangrove"
          >
            <input
              type="radio"
              name="method"
              value={method}
              required
              className="h-5 w-5 shrink-0 accent-mangrove"
            />
            <span className="min-w-0 break-words">{t(`methods.${method}`)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};
