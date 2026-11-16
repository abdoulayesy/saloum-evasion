import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { buildPath } from '@/i18n/pathnames';
import { readCartToken } from '@/lib/cart/cookies';
import { cartSummary, findOpenCart } from '@/lib/cart/repository';
import { getPayloadClient } from '@/lib/cms/queries';
import { formatXof } from '@/lib/pricing';
import { tunnelLocale } from '../locale';

// Panier (002, T033) : `/fr/panier`, `/en/cart`. Lecture du cookie `se_cart` ; lignes, contrôles
// FR-004 et transferts proposés arrivent avec US1 (T045 et suivantes).

// Toujours rendue à la demande (cookie, jeton) : le layout [locale] prérend sinon ses pages.
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const locale = await tunnelLocale(params);
  const t = await getTranslations({ locale, namespace: 'cart' });
  return { title: `${t('title')} | Saloum Évasion` };
};

const CartPage = async ({ params }: Props) => {
  const locale = await tunnelLocale(params);
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'cart' });
  const token = await readCartToken();
  const cart = token ? await findOpenCart(await getPayloadClient(), token) : null;
  const summary = cart ? cartSummary(cart) : { count: 0, total: 0 };

  return (
    <>
      <CheckoutSteps locale={locale} current="cart" />
      <h1 className="text-mangrove">{t('title')}</h1>
      {summary.count === 0 ? (
        <div className="mt-6 grid gap-4">
          <p>{token && !cart ? t('expired') : t('empty')}</p>
          <Link
            href={buildPath(locale, { type: 'staysList' })}
            className="inline-flex min-h-touch w-full items-center justify-center rounded-control bg-mangrove px-6 font-semibold text-sable sm:w-auto"
          >
            {t('browse')}
          </Link>
        </div>
      ) : (
        <p className="mt-6 text-lg">
          {t('items', { count: summary.count })} · {t('total')} {formatXof(summary.total)}
        </p>
      )}
    </>
  );
};

export default CartPage;
