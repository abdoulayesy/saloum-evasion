import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { CmsImage } from '@/components/ui/CmsImage';
import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { populated } from '@/lib/cms/populated';
import type { Media, TeamMember } from '@/payload-types';

// Signature d'un guide (004, T029, FR-002) : photo et nom de l'auteur (lien vers sa page),
// rôle, lieu, relecteur, date de dernière mise à jour de fond, temps de lecture.

type GuideBylineProps = {
  locale: Locale;
  author: TeamMember;
  reviewer: TeamMember | null;
  updatedOn: string;
  readingMinutes: number;
};

/** Lien vers la page d'auteur, ou nom seul si le membre n'a pas encore de slug. */
const AuthorName = ({ member, locale }: { member: TeamMember; locale: Locale }) =>
  member.slug ? (
    <Link
      href={buildPath(locale, { type: 'author', slug: member.slug })}
      className="font-semibold underline underline-offset-4"
    >
      {member.name}
    </Link>
  ) : (
    <span className="font-semibold">{member.name}</span>
  );

export const formatGuideDate = (date: string, locale: Locale): string =>
  new Intl.DateTimeFormat(locale === 'fr' ? 'fr-SN' : 'en-GB', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));

export const GuideByline = async ({
  locale,
  author,
  reviewer,
  updatedOn,
  readingMinutes,
}: GuideBylineProps) => {
  const t = await getTranslations({ locale, namespace: 'guides' });
  const photo = populated<Media>(author.photo);
  return (
    <div className="mt-5 flex items-start gap-3 text-sm text-ink-muted">
      {photo && (
        <CmsImage
          media={photo}
          locale={locale}
          sizes="48px"
          className="size-12 shrink-0 rounded-full object-cover"
        />
      )}
      <div>
        <p className="text-base text-ink">
          {t('by')} <AuthorName member={author} locale={locale} />
          {author.role ? `, ${author.role}` : ''}
          {author.place ? ` · ${t('basedIn', { place: author.place })}` : ''}
        </p>
        {reviewer && (
          <p>
            {t('reviewedBy')} <AuthorName member={reviewer} locale={locale} />
          </p>
        )}
        <p>
          <time dateTime={updatedOn}>
            {t('updatedOn', { date: formatGuideDate(updatedOn, locale) })}
          </time>
          {' · '}
          {t('readingTime', { minutes: readingMinutes })}
        </p>
      </div>
    </div>
  );
};
