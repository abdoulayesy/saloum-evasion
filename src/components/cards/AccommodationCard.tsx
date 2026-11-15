import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { CARD_QUALITY, CARD_SIZES, CmsImage } from '@/components/ui/CmsImage';
import { Price } from '@/components/ui/Price';
import type { Locale } from '@/i18n/routing';
import { accommodationPath } from '@/lib/catalogPaths';
import { populated } from '@/lib/cms/populated';
import type { Accommodation, Destination, Media } from '@/payload-types';

type AccommodationCardProps = {
  accommodation: Accommodation;
  locale: Locale;
  headingLevel?: 2 | 3;
  priority?: boolean;
};

// Carte d'hébergement (T112) : un seul lien, type, capacité, lieu, prix par nuit.
export const AccommodationCard = async ({
  accommodation,
  locale,
  headingLevel = 3,
  priority = false,
}: AccommodationCardProps) => {
  const href = accommodationPath(locale, accommodation);
  if (!href || !accommodation.title) return null;
  const t = await getTranslations({ locale, namespace: 'accommodation' });
  const destination = populated<Destination>(accommodation.destination);
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-card bg-white shadow-sm">
      <CmsImage
        media={populated<Media>(accommodation.heroImage)}
        locale={locale}
        sizes={CARD_SIZES}
        quality={CARD_QUALITY}
        priority={priority}
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-sm font-semibold text-ocre">
          {t(`type.${accommodation.type}`)} · {t('capacity', { count: accommodation.capacity })}
          {destination?.name ? ` · ${destination.name}` : ''}
        </p>
        <Heading className="text-2xl">
          <Link href={href} className="flex min-h-touch items-center after:absolute after:inset-0">
            {accommodation.title}
          </Link>
        </Heading>
        {accommodation.summary && <p className="text-ink-muted">{accommodation.summary}</p>}
        <div className="mt-auto pt-2">
          <Price locale={locale} amountXof={accommodation.priceFromPerNight} unit="perNight" />
        </div>
      </div>
    </article>
  );
};
