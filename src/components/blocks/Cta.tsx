import { getTranslations } from 'next-intl/server';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { buildPath } from '@/i18n/pathnames';
import { isLive } from '@/lib/navigation';
import type { BlockContext, BlockOf } from './types';

type Action = { href: string; label: string; external: boolean; whatsapp: boolean };

// Appel à l'action (T133) : la demande de séjour n'existe qu'à partir de la phase 8 ; tant
// qu'elle n'est pas livrée, l'action renvoie vers la liste des séjours (aucun lien en 404).
export const Cta = async ({ block, context }: { block: BlockOf<'cta'>; context: BlockContext }) => {
  const t = await getTranslations({ locale: context.locale, namespace: 'blocks' });
  const stays: Action = {
    href: buildPath(context.locale, { type: 'staysList' }),
    label: t('ctaStays'),
    external: false,
    whatsapp: false,
  };
  const action = ((): Action => {
    if (block.action === 'whatsapp' && context.whatsappHref)
      return {
        href: context.whatsappHref,
        label: t('ctaWhatsapp'),
        external: true,
        whatsapp: true,
      };
    if (block.action === 'request' && isLive('request'))
      return {
        href: buildPath(context.locale, { type: 'request' }),
        label: t('ctaRequest'),
        external: false,
        whatsapp: false,
      };
    return stays;
  })();
  const headingId = `appel-${block.id ?? 'bloc'}`;
  return (
    <section aria-labelledby={headingId} className="py-10">
      <Container>
        <div className="rounded-card bg-mangrove p-6 text-sable sm:p-10">
          <h2 id={headingId} className="text-sable">
            {block.heading}
          </h2>
          {block.text && <p className="mt-2 max-w-xl text-lg">{block.text}</p>}
          <ButtonLink
            href={action.href}
            external={action.external}
            variant={action.whatsapp ? 'whatsapp' : 'onDark'}
            className="mt-6 w-full sm:w-auto"
          >
            {action.label}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
};
