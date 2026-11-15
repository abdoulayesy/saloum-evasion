import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Price } from '@/components/ui/Price';
import { CARD_QUALITY, CARD_SIZES, CmsImage } from '@/components/ui/CmsImage';
import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { populated } from '@/lib/cms/populated';
import { priceFrom } from '@/lib/pricing';
import type { Media, Stay } from '@/payload-types';

type StayCardProps = {
  stay: Stay;
  locale: Locale;
  headingLevel?: 2 | 3;
  /** Image prioritaire : première carte d'une liste (élément LCP sur mobile). */
  priority?: boolean;
};

// Carte de séjour (T088) : un seul lien (le titre, étendu à toute la carte), image différée,
// durée et prix « à partir de ». Attributs de données lus par le panneau de filtres.
export const StayCard = async ({
  stay,
  locale,
  headingLevel = 3,
  priority = false,
}: StayCardProps) => {
  const t = await getTranslations({ locale, namespace: 'stay' });
  const slug = stay.seo?.slug;
  if (!slug || !stay.title) return null;
  const href = buildPath(locale, { type: 'stay', slug });
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <article
      data-stay-card
      data-duration={stay.durationCategory ?? ''}
      data-moods={(stay.moods ?? []).join(',')}
      data-budget={stay.budgetBand ?? ''}
      className="relative flex h-full flex-col overflow-hidden rounded-card bg-white shadow-sm"
    >
      <CmsImage
        media={populated<Media>(stay.heroImage)}
        locale={locale}
        sizes={CARD_SIZES}
        quality={CARD_QUALITY}
        priority={priority}
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-sm font-semibold text-ocre">
          {t('nights', { count: stay.durationNights })}
        </p>
        <Heading className="text-2xl">
          <Link href={href} className="flex min-h-touch items-center after:absolute after:inset-0">
            {stay.title}
          </Link>
        </Heading>
        {stay.summary && <p className="text-ink-muted">{stay.summary}</p>}
        <div className="mt-auto pt-2">
          <Price
            locale={locale}
            amountXof={priceFrom(stay.pricing.lowSeasonPerPerson, stay.pricing.highSeasonPerPerson)}
            unit="perPerson"
          />
        </div>
      </div>
    </article>
  );
};
