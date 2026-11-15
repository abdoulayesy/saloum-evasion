import type { BreadcrumbList } from 'schema-dts';
import type { Crumb } from '@/lib/seo/breadcrumbs';

// BreadcrumbList : mêmes éléments que le fil d'Ariane visible (source unique : breadcrumbs.ts).
// Le dernier élément (page courante) n'a pas d'`item`.
export const buildBreadcrumbList = (
  crumbs: readonly Crumb[],
  pageUrl: string,
  origin: string,
): BreadcrumbList => ({
  '@type': 'BreadcrumbList',
  '@id': `${pageUrl}#breadcrumb`,
  itemListElement: crumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    ...(crumb.path ? { item: `${origin}${crumb.path}` } : {}),
  })),
});
