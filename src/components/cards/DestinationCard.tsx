import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { CmsImage } from '@/components/ui/CmsImage';
import type { Locale } from '@/i18n/routing';
import { destinationPath } from '@/lib/catalogPaths';
import { populated } from '@/lib/cms/populated';
import type { Destination, Media } from '@/payload-types';

type DestinationCardProps = {
  destination: Destination;
  locale: Locale;
  headingLevel?: 2 | 3;
  priority?: boolean;
};

// Carte de destination (T112) : un seul lien (nom étendu à la carte), type de lieu, intro.
export const DestinationCard = async ({
  destination,
  locale,
  headingLevel = 3,
  priority = false,
}: DestinationCardProps) => {
  const href = destinationPath(locale, destination);
  if (!href || !destination.name) return null;
  const t = await getTranslations({ locale, namespace: 'destination' });
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-card bg-white shadow-sm">
      <CmsImage
        media={populated<Media>(destination.heroImage)}
        locale={locale}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        priority={priority}
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-sm font-semibold text-ocre">{t(`kinds.${destination.kind}`)}</p>
        <Heading className="text-2xl">
          <Link href={href} className="flex min-h-touch items-center after:absolute after:inset-0">
            {destination.name}
          </Link>
        </Heading>
        {destination.intro && <p className="text-ink-muted">{destination.intro}</p>}
      </div>
    </article>
  );
};
