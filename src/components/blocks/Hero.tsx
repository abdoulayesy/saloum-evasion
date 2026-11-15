import { CmsImage, HERO_SIZES } from '@/components/ui/CmsImage';
import { Container } from '@/components/ui/Container';
import type { Locale } from '@/i18n/routing';
import { populated } from '@/lib/cms/populated';
import type { Media } from '@/payload-types';
import type { BlockOf } from './types';

type HeroProps = {
  block: BlockOf<'hero'>;
  locale: Locale;
  /** En tête de page : le H1 est le titre de la page, l'accroche du bloc vient dessous. */
  pageTitle?: string;
};

// Héro (T133) : image prioritaire (élément LCP) sous un voile, texte sable contrasté.
export const Hero = ({ block, locale, pageTitle }: HeroProps) => {
  const image = populated<Media>(block.image);
  return (
    <section className="relative isolate overflow-hidden bg-mangrove text-sable">
      <CmsImage
        media={image}
        locale={locale}
        sizes={HERO_SIZES}
        priority={Boolean(pageTitle)}
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-scrim" />
      <Container className="flex min-h-[50dvh] flex-col justify-end gap-3 py-10">
        {pageTitle ? (
          <>
            <h1 className="text-sable">{pageTitle}</h1>
            <p className="max-w-2xl font-serif text-2xl">{block.heading}</p>
          </>
        ) : (
          <h2 className="text-sable">{block.heading}</h2>
        )}
        {block.text && <p className="max-w-xl text-lg">{block.text}</p>}
      </Container>
    </section>
  );
};
