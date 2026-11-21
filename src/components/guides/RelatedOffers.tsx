import { AccommodationCard } from '@/components/cards/AccommodationCard';
import { DestinationCard } from '@/components/cards/DestinationCard';
import { ExperienceCard } from '@/components/cards/ExperienceCard';
import { StayCard } from '@/components/cards/StayCard';
import type { Locale } from '@/i18n/routing';
import { relatedOffers } from '@/lib/guides/related';
import type { Guide } from '@/payload-types';

// Offres et destinations liées d'un guide (004, T030, FR-010) : cartes existantes du catalogue
// (prix « à partir de » en FCFA avec conversion indicative en euros), publiées dans la langue,
// dans l'ordre saisi. `data-guide-link` / `data-guide` : clics mesurés par l'écouteur délégué
// (contracts/analytics-events.md).

type RelatedOffersProps = { guide: Guide; locale: Locale; title: string; guideKey: string };

export const RelatedOffers = ({ guide, locale, title, guideKey }: RelatedOffersProps) => {
  const offers = relatedOffers(guide, locale);
  if (offers.length === 0) return null;
  return (
    <section aria-labelledby="guide-offres" className="mt-12">
      <h2 id="guide-offres" className="text-mangrove">
        {title}
      </h2>
      <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {offers.map((offer) => (
          <li
            key={`${offer.kind}-${offer.doc.id}`}
            data-guide-link={offer.kind}
            data-guide={guideKey}
          >
            {offer.kind === 'stay' && (
              <StayCard stay={offer.doc} locale={locale} headingLevel={3} />
            )}
            {offer.kind === 'experience' && (
              <ExperienceCard experience={offer.doc} locale={locale} headingLevel={3} />
            )}
            {offer.kind === 'accommodation' && (
              <AccommodationCard accommodation={offer.doc} locale={locale} headingLevel={3} />
            )}
            {offer.kind === 'destination' && (
              <DestinationCard destination={offer.doc} locale={locale} headingLevel={3} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};
