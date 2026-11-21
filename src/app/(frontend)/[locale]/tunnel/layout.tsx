import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { isLocale } from '@/i18n/routing';

// Tunnel de commande (002, T033) : routes internes `/{langue}/tunnel/...`, atteintes uniquement
// par réécriture du middleware depuis les URL traduites (`/fr/panier`, `/en/cart`…), qui pose
// aussi `X-Robots-Tag: noindex` et `Cache-Control: private, no-store`. Pages dynamiques, jamais
// indexées, sans hreflang ni JSON-LD ; le résolveur `[...segments]` n'est pas touché (T19).
// Mise en page : colonne étroite pour les étapes (groupe `(steps)`), pleine largeur pour
// « Composer mon séjour » (deux colonnes de la maquette).

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

const TunnelLayout = async ({ children, params }: Props) => {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  return children;
};

export default TunnelLayout;
