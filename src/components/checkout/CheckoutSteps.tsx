import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';

// Indicateur d'étapes du tunnel (002, T033) : liste ordonnée, étape courante annoncée par
// `aria-current="step"` ; pas de lien vers les étapes suivantes (elles exigent les précédentes).
// Composant serveur, mobile d'abord : libellé courant seul à 360 px, les quatre étapes dès `sm`.

export const CHECKOUT_STEPS = ['cart', 'details', 'payment', 'status'] as const;

export type CheckoutStepName = (typeof CHECKOUT_STEPS)[number];

type Props = { locale: Locale; current: CheckoutStepName };

export const CheckoutSteps = async ({ locale, current }: Props) => {
  const t = await getTranslations({ locale, namespace: 'checkout' });
  const index = CHECKOUT_STEPS.indexOf(current);
  return (
    <nav aria-label={t('progress')} className="mb-6">
      <p className="text-sm font-semibold text-ink-muted sm:sr-only">
        {t('stepLabel', {
          current: index + 1,
          total: CHECKOUT_STEPS.length,
          name: t(`steps.${current}`),
        })}
      </p>
      <ol className="hidden gap-2 sm:flex">
        {CHECKOUT_STEPS.map((step, position) => (
          <li
            key={step}
            aria-current={step === current ? 'step' : undefined}
            className={
              step === current
                ? 'flex-1 border-t-4 border-mangrove pt-2 text-sm font-semibold text-mangrove'
                : position < index
                  ? 'flex-1 border-t-4 border-mangrove/60 pt-2 text-sm text-ink'
                  : 'flex-1 border-t-4 border-ink/20 pt-2 text-sm text-ink-muted'
            }
          >
            {position + 1}. {t(`steps.${step}`)}
          </li>
        ))}
      </ol>
    </nav>
  );
};
