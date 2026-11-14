import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { resolvePath } from '@/i18n/pathnames';
import { isLocale } from '@/i18n/routing';
import { isLive } from '@/lib/navigation';

// Résolveur des routes traduites (plan, « Structure Decision ») : associe les segments au
// type de page. Chaque type est branché ici à mesure que sa phase le livre ; un type non
// encore livré ou une URL inconnue donne la 404 localisée.
export const dynamicParams = true;

type PageProps = { params: Promise<{ locale: string; segments: string[] }> };

const ResolvedPage = async ({ params }: PageProps) => {
  const { locale, segments } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const route = resolvePath(locale, segments);
  if (!route || !isLive(route.type)) notFound();
  // Aucun type de page autre que l'accueil n'est livré à ce stade (phases 2A et 2B).
  notFound();
};

export default ResolvedPage;
