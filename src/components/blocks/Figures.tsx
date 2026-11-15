import { Section } from '@/components/ui/Section';
import type { BlockOf } from './types';

// Chiffres clés (T133) : valeur puis libellé, lus dans l'ordre par les lecteurs d'écran.
export const Figures = ({ block }: { block: BlockOf<'figures'> }) => {
  const items = block.items ?? [];
  if (items.length === 0) return null;
  return (
    <Section id={`chiffres-${block.id ?? 'bloc'}`} title={block.heading ?? ''} tone="deep">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <li key={item.id ?? item.label} className="rounded-card bg-white p-5">
            <p className="font-serif text-4xl font-semibold text-ocre">{item.value}</p>
            <p className="mt-1">{item.label}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
};
