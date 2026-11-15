import type { ReactNode } from 'react';
import { Container } from './Container';

type SectionProps = {
  id?: string;
  title: string;
  /** Niveau du titre : 2 par défaut (le H1 est unique par page). */
  level?: 2 | 3;
  tone?: 'sable' | 'deep';
  children: ReactNode;
};

const tones = { sable: '', deep: 'bg-sable-deep' } as const;

export const Section = ({ id, title, level = 2, tone = 'sable', children }: SectionProps) => {
  const headingId = id ? `${id}-titre` : undefined;
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <section id={id} aria-labelledby={headingId} className={`py-10 sm:py-14 ${tones[tone]}`}>
      <Container>
        <Heading id={headingId} className="text-mangrove">
          {title}
        </Heading>
        <div className="mt-6">{children}</div>
      </Container>
    </section>
  );
};
