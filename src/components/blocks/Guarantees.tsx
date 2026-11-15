import { Section } from '@/components/ui/Section';
import type { SiteSetting } from '@/payload-types';
import type { BlockOf } from './types';

// Garanties (T133) : source unique dans les réglages du site.
export const Guarantees = ({
  block,
  settingsGlobal,
}: {
  block: BlockOf<'guarantees'>;
  settingsGlobal: SiteSetting;
}) => {
  const guarantees = (settingsGlobal.guarantees ?? []).filter((item) => item.title);
  if (guarantees.length === 0) return null;
  return (
    <Section id={`garanties-${block.id ?? 'bloc'}`} title={block.heading ?? ''}>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guarantees.map((item) => (
          <li key={item.id ?? item.title} className="rounded-card bg-white p-4">
            <h3 className="text-xl">{item.title}</h3>
            {item.text && <p className="mt-1 text-ink-muted">{item.text}</p>}
          </li>
        ))}
      </ul>
    </Section>
  );
};
