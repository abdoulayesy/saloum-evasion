import { getTranslations } from 'next-intl/server';
import { GuideCard } from '@/components/guides/GuideCard';
import { Container } from '@/components/ui/Container';
import type { Locale } from '@/i18n/routing';
import { guidesForOffer, type GuideOfferCollection } from '@/lib/cms/queries';
import { MAX_TEASER_GUIDES } from '@/lib/guides/teaser';

// Encart « À lire dans les Carnets du Saloum » des fiches (004, T043, FR-011) : guides publiés
// liés à la fiche, trois au plus, saisis une seule fois côté guide (requête inverse). Rien si
// aucun guide. `data-guide-card` : clics mesurés par l'écouteur délégué.

type GuidesTeaserProps = {
  collection: GuideOfferCollection;
  id: number;
  locale: Locale;
  /** Type de la fiche, pour la mesure (`from`). */
  from: 'stay' | 'experience' | 'accommodation' | 'destination';
};

export const GuidesTeaser = async ({ collection, id, locale, from }: GuidesTeaserProps) => {
  const guides = await guidesForOffer(collection, id, locale, MAX_TEASER_GUIDES);
  if (guides.length === 0) return null;
  const t = await getTranslations({ locale, namespace: 'guides' });
  return (
    <Container className="mt-10">
      <section aria-labelledby="guides-teaser">
        <h2 id="guides-teaser" className="text-mangrove">
          {t('teaserTitle')}
        </h2>
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {guides.map((guide) => (
            <li
              key={guide.id}
              data-guide-card={from}
              data-guide={guide.seo?.slug ?? String(guide.id)}
            >
              <GuideCard guide={guide} locale={locale} />
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
};
