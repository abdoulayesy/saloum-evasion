import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { CARD_QUALITY, CARD_SIZES, CmsImage } from '@/components/ui/CmsImage';
import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { populated } from '@/lib/cms/populated';
import type { Guide, Media } from '@/payload-types';

// Carte d'un guide (004) : image, titre (lien étendu à la carte), chapeau facultatif, temps de
// lecture. Utilisée par « D'autres carnets », l'encart des fiches et la page de rubrique.

type GuideCardProps = {
  guide: Guide;
  locale: Locale;
  headingLevel?: 2 | 3;
  showStandfirst?: boolean;
  /** Image prioritaire : première carte d'une liste (élément LCP sur mobile). */
  priority?: boolean;
};

export const guidePath = (locale: Locale, guide: Guide): string | null =>
  guide.seo?.slug ? buildPath(locale, { type: 'guide', slug: guide.seo.slug }) : null;

export const GuideCard = async ({
  guide,
  locale,
  headingLevel = 3,
  showStandfirst = false,
  priority = false,
}: GuideCardProps) => {
  const href = guidePath(locale, guide);
  if (!href || !guide.title) return null;
  const t = await getTranslations({ locale, namespace: 'guides' });
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-card bg-white">
      <CmsImage
        media={populated<Media>(guide.heroImage)}
        locale={locale}
        sizes={CARD_SIZES}
        quality={CARD_QUALITY}
        priority={priority}
        className="aspect-[16/9] w-full object-cover"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Heading className="text-xl text-mangrove">
          <Link href={href} className="flex min-h-touch items-center after:absolute after:inset-0">
            {guide.title}
          </Link>
        </Heading>
        {showStandfirst && guide.standfirst && <p className="text-ink-muted">{guide.standfirst}</p>}
        <p className="mt-auto text-sm text-ink-muted">
          {t('readingTime', { minutes: guide.readingMinutes ?? 1 })}
        </p>
      </div>
    </article>
  );
};
