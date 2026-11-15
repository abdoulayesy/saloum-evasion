import { CmsImage } from '@/components/ui/CmsImage';
import { Section } from '@/components/ui/Section';
import type { Locale } from '@/i18n/routing';
import { populated, populatedList } from '@/lib/cms/populated';
import type { Media, TeamMember } from '@/payload-types';
import type { BlockOf } from './types';

// Équipe (T133, FR-007) : photo, nom, rôle et présentation de chaque membre.
type TeamProps = {
  block: BlockOf<'team'>;
  locale: Locale;
  /** Bloc en tête de page : la première photo est l'élément LCP, chargée en priorité. */
  priority?: boolean;
};

export const Team = ({ block, locale, priority = false }: TeamProps) => {
  const members = populatedList<TeamMember>(block.members).filter((member) => member.role);
  if (members.length === 0) return null;
  return (
    <Section id={`equipe-${block.id ?? 'bloc'}`} title={block.heading ?? ''}>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member, index) => (
          <li key={member.id} className="overflow-hidden rounded-card bg-white">
            <CmsImage
              media={populated<Media>(member.photo)}
              locale={locale}
              priority={priority && index === 0}
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, (min-width: 400px) 360px, calc(100vw - 2rem)"
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="p-4">
              <h3 className="text-xl">{member.name}</h3>
              <p className="font-semibold text-ocre">{member.role}</p>
              {member.bio && <p className="mt-2 text-ink-muted">{member.bio}</p>}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
};
