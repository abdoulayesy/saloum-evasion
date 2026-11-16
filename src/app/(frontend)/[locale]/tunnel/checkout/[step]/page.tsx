import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { readCartToken } from '@/lib/cart/cookies';
import { cartSummary, findOpenCart } from '@/lib/cart/repository';
import { checkoutPath } from '@/lib/checkout/paths';
import { getPayloadClient } from '@/lib/cms/queries';
import { tunnelLocale } from '../../locale';

// Étapes coordonnées, paiement et statut (002, T033) : `/fr/commande/{coordonnees|paiement|statut}`.
// Sans panier non vide, renvoi (303) vers le panier, première étape incomplète. Les formulaires
// arrivent avec US1 (T046 et suivantes).

const STEPS = ['details', 'payment', 'status'] as const;

type Step = (typeof STEPS)[number];

const isStep = (value: string): value is Step => STEPS.some((step) => step === value);

// Toujours rendue à la demande (cookie, jeton) : le layout [locale] prérend sinon ses pages.
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; step: string }> };

const stepOf = async (params: Props['params']): Promise<Step> => {
  const { step } = await params;
  if (!isStep(step)) notFound();
  return step;
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const [locale, step] = await Promise.all([tunnelLocale(params), stepOf(params)]);
  const t = await getTranslations({ locale, namespace: 'checkout' });
  return { title: `${t(`steps.${step}`)} | Saloum Évasion` };
};

const CheckoutStepPage = async ({ params }: Props) => {
  const [locale, step] = await Promise.all([tunnelLocale(params), stepOf(params)]);
  setRequestLocale(locale);
  const token = await readCartToken();
  const cart = token ? await findOpenCart(await getPayloadClient(), token) : null;
  if (!cart || cartSummary(cart).count === 0) redirect(checkoutPath(locale, 'cart'));
  const t = await getTranslations({ locale, namespace: 'checkout' });
  return (
    <>
      <CheckoutSteps locale={locale} current={step} />
      <h1 className="text-mangrove">{t(`steps.${step}`)}</h1>
      <p className="mt-6">{t('comingSoon')}</p>
    </>
  );
};

export default CheckoutStepPage;
