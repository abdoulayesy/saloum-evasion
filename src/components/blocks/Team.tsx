import Link from 'next/link';
import { CmsImage } from '@/components/ui/CmsImage';
import { Section } from '@/components/ui/Section';
import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { guidesForAuthor } from '@/lib/cms/queries';
import { populated, populatedList } from '@/lib/cms/populated';
import type { Media, TeamMember } from '@/payload-types';
import type { BlockOf } from './types';

// Équipe (T133, FR-007) : photo, nom, rôle et présentation de chaque membre. 004 (T061) : le nom
// d'un membre qui signe ou relit un guide publié dans la langue mène à sa page d'auteur.
type TeamProps = {
  block: BlockOf<'team'>;
  locale: Locale;
  /** Bloc en tête de page : la première photo est l'élément LCP, chargée en priorité. */
  priority?: boolean;
};

/** Chemin de la page d'auteur du membre, s'il en a une dans la langue. */
const authorPathOf = async (member: TeamMember, locale: Locale): Promise<string | null> => {
  if (!member.slug) return null;
  const guides = await guidesForAuthor(member.id, locale);
  return guides.length > 0 ? buildPath(locale, { type: 'author', slug: member.slug }) : null;
};

export const Team = async ({ block, locale, priority = false }: TeamProps) => {
  const members = populatedList<TeamMember>(block.members).filter((member) => member.role);
  if (members.length === 0) return null;
  const authorPaths = await Promise.all(members.map((member) => authorPathOf(member, locale)));
  return (
    <Section id={`equipe-${block.id ?? 'bloc'}`} title={block.heading ?? ''}>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member, index) => {
          const authorPath = authorPaths[index];
          return (
            <li key={member.id} className="overflow-hidden rounded-card bg-white">
              <CmsImage
                media={populated<Media>(member.photo)}
                locale={locale}
                priority={priority && index === 0}
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, (min-width: 400px) 360px, calc(100vw - 2rem)"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl">
                  {authorPath ? (
                    <Link
                      href={authorPath}
                      className="inline-flex min-h-touch items-center underline underline-offset-4"
                    >
                      {member.name}
                    </Link>
                  ) : (
                    member.name
                  )}
                </h3>
                <p className="font-semibold text-ocre">{member.role}</p>
                {member.bio && <p className="mt-2 text-ink-muted">{member.bio}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
};
