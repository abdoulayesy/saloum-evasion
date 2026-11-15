import { getTranslations } from 'next-intl/server';
import { Container } from '@/components/ui/Container';
import type { Locale } from '@/i18n/routing';
import type { BlockOf } from './types';

// Registre des traitements (T135, constitution IX) : une fiche par traitement, en liste de
// définitions lisible à 360 px (pas de tableau à faire défiler).
export const ProcessingRegister = async ({
  block,
  locale,
}: {
  block: BlockOf<'processingRegister'>;
  locale: Locale;
}) => {
  const entries = block.entries ?? [];
  if (entries.length === 0) return null;
  const t = await getTranslations({ locale, namespace: 'blocks' });
  return (
    <Container className="py-6">
      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {entries.map((entry) => (
          <li key={entry.id ?? entry.purpose} className="min-w-0 rounded-card bg-white p-5">
            <h3 className="text-xl">{entry.purpose}</h3>
            <dl className="mt-3 grid grid-cols-1 gap-2">
              {(
                [
                  ['data', entry.data],
                  ['legalBasis', entry.legalBasis],
                  ['retention', entry.retention],
                  ['recipients', entry.recipients],
                  ['transfers', entry.transfers],
                ] as const
              ).map(([key, value]) =>
                value ? (
                  <div key={key}>
                    <dt className="text-sm font-semibold text-ocre">{t(key)}</dt>
                    <dd className="text-ink">{value}</dd>
                  </div>
                ) : null,
              )}
            </dl>
          </li>
        ))}
      </ul>
    </Container>
  );
};
