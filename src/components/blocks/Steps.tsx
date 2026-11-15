import { Section } from '@/components/ui/Section';
import type { BlockOf } from './types';

// Étapes (T133) : liste ordonnée, numéro visible.
export const Steps = ({ block }: { block: BlockOf<'steps'> }) => {
  const items = block.items ?? [];
  if (items.length === 0) return null;
  return (
    <Section id={`etapes-${block.id ?? 'bloc'}`} title={block.heading ?? ''}>
      <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map((item, index) => (
          <li key={item.id ?? item.title} className="flex gap-4 rounded-card bg-white p-5">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mangrove font-semibold text-sable"
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <h3 className="text-xl">{item.title}</h3>
              {item.text && <p className="mt-1 text-ink-muted">{item.text}</p>}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
};
