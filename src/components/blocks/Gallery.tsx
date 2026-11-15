import { getTranslations } from 'next-intl/server';
import { Gallery as GalleryCarousel } from '@/components/client/Gallery';
import { CmsImage } from '@/components/ui/CmsImage';
import { Container } from '@/components/ui/Container';
import type { Locale } from '@/i18n/routing';
import { populatedList } from '@/lib/cms/populated';
import type { Media } from '@/payload-types';
import type { BlockOf } from './types';

// Galerie (T133) : carrousel au doigt avec boutons de 44 px (îlot client existant).
export const Gallery = async ({ block, locale }: { block: BlockOf<'gallery'>; locale: Locale }) => {
  const images = populatedList<Media>(block.images);
  if (images.length === 0) return null;
  const t = await getTranslations({ locale, namespace: 'gallery' });
  const headingId = `galerie-${block.id ?? 'bloc'}`;
  return (
    <section aria-labelledby={headingId} className="py-10">
      <Container>
        <h2 id={headingId} className="text-mangrove">
          {block.heading || t('label')}
        </h2>
      </Container>
      <div className="mx-auto mt-4 max-w-6xl">
        <GalleryCarousel
          label={block.heading || t('label')}
          previousLabel={t('previous')}
          nextLabel={t('next')}
          positionTemplate={t('position', { current: '{current}', total: '{total}' })}
          slides={images.map((media) => (
            <CmsImage
              key={media.id}
              media={media}
              locale={locale}
              sizes="(min-width: 1024px) 45vw, (min-width: 640px) 60vw, 85vw"
              className="aspect-[4/3] w-full rounded-card object-cover"
            />
          ))}
        />
      </div>
    </section>
  );
};
