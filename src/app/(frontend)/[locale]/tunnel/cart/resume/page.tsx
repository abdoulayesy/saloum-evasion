import { redirect } from 'next/navigation';
import { checkoutPath } from '@/lib/checkout/paths';
import { tunnelLocale } from '../../locale';

// Reprise après relance (002, T033) : `/fr/panier/reprendre?t=…`. La restauration du panier par
// jeton de relance arrive avec US3 (T073 et suivantes) ; d'ici là, renvoi vers le panier.

// Toujours rendue à la demande (cookie, jeton) : le layout [locale] prérend sinon ses pages.
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }> };

const ResumePage = async ({ params }: Props) => {
  redirect(checkoutPath(await tunnelLocale(params), 'cart'));
};

export default ResumePage;
