import type { CollectionConfig } from 'payload';
import { isTeam, publishedOrTeam } from '@/access';
import { computeEnPublished, type EnglishCheck } from '@/fields/localeStatus';
import { autoRedirectHooks } from '@/hooks/autoRedirect';
import { publishGuard } from '@/hooks/publishGuards';
import { revalidateHooks } from '@/hooks/revalidate';

// Configuration commune des collections de contenu public : brouillons et versions
// (data-model), lecture publique des seuls documents publiés, écriture réservée à l'équipe,
// revalidation à la publication, calcul de la complétude anglaise.

type Hooks = NonNullable<CollectionConfig['hooks']>;

type ContentOptions = {
  englishCheck: EnglishCheck;
  extraBeforeChange?: NonNullable<Hooks['beforeChange']>;
  beforeValidate?: NonNullable<Hooks['beforeValidate']>;
};

export const contentDefaults = ({
  englishCheck,
  extraBeforeChange = [],
  beforeValidate = [],
}: ContentOptions): Pick<CollectionConfig, 'access' | 'versions' | 'hooks'> => ({
  access: { read: publishedOrTeam, create: isTeam, update: isTeam, delete: isTeam },
  versions: { drafts: true, maxPerDoc: 25 },
  hooks: {
    beforeValidate,
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
