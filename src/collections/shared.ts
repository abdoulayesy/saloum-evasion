import type { CollectionConfig } from 'payload';
import { isTeam, publishedOrTeam } from '@/access';
import { computeEnPublished, type EnglishCheck } from '@/fields/localeStatus';
import { autoRedirectHooks } from '@/hooks/autoRedirect';
import { publishGuard } from '@/hooks/publishGuards';
import { revalidateHooks } from '@/hooks/revalidate';

// Configuration commune des collections de contenu public : brouillons et versions
// (data-model), lecture publique des seuls documents publiés, écriture réservée à l'équipe,
// revalidation à la publication, calcul de la complétude anglaise.

type ContentOptions = {
  englishCheck: EnglishCheck;
  extraBeforeChange?: NonNullable<NonNullable<CollectionConfig['hooks']>['beforeChange']>;
};

export const contentDefaults = ({
  englishCheck,
  extraBeforeChange = [],
}: ContentOptions): Pick<CollectionConfig, 'access' | 'versions' | 'hooks'> => ({
  access: { read: publishedOrTeam, create: isTeam, update: isTeam, delete: isTeam },
  versions: { drafts: true, maxPerDoc: 25 },
  hooks: {
    beforeChange: [
      ...extraBeforeChange,
      computeEnPublished(englishCheck),
      publishGuard,
      ...autoRedirectHooks.beforeChange,
    ],
    afterChange: [...autoRedirectHooks.afterChange, ...revalidateHooks.afterChange],
    beforeDelete: autoRedirectHooks.beforeDelete,
    afterDelete: [...autoRedirectHooks.afterDelete, ...revalidateHooks.afterDelete],
  },
});
