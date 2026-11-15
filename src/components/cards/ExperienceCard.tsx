import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { CmsImage } from '@/components/ui/CmsImage';
import { Price } from '@/components/ui/Price';
import type { Locale } from '@/i18n/routing';
import { populated } from '@/lib/cms/populated';
import { experiencePath } from '@/lib/experiencePaths';
import { formatDuration } from '@/lib/format';
import type { Destination, Experience, Media } from '@/payload-types';

type ExperienceCardProps = {
  experience: Experience;
  locale: Locale;
  headingLevel?: 2 | 3;
  priority?: boolean;
};

// Carte d'expérience (T100) : un seul lien (titre étendu à la carte), durée, lieu, prix par
// personne ; image différée sauf la première d'une liste.
export const ExperienceCard = async ({
  experience,
  locale,
  headingLevel = 3,
  priority = false,
}: ExperienceCardProps) => {
  const href = experiencePath(locale, experience);
  if (!href || !experience.title) return null;
  const t = await getTranslations({ locale, namespace: 'experience' });
  const destination = populated<Destination>(experience.destination);
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-card bg-white shadow-sm">
      <CmsImage
        media={populated<Media>(experience.heroImage)}
        locale={locale}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        priority={priority}
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-sm font-semibold text-ocre">
          {formatDuration(experience.durationMinutes)} · {t(`levels.${experience.level}`)}
          {destination?.name ? ` · ${destination.name}` : ''}
        </p>
        <Heading className="text-2xl">
          <Link href={href} className="flex min-h-touch items-center after:absolute after:inset-0">
            {experience.title}
          </Link>
        </Heading>
        {experience.summary && <p className="text-ink-muted">{experience.summary}</p>}
        <div className="mt-auto pt-2">
          <Price locale={locale} amountXof={experience.pricePerPerson} unit="perPerson" />
        </div>
      </div>
    </article>
  );
};
