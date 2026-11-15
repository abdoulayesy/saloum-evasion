import Link from 'next/link';

// Barre d'action collante (constitution I, FR-017) : fixe en bas d'écran sous `md`, dans la
// zone du pouce, avec l'action principale et WhatsApp. Composant serveur sans JavaScript :
// le clavier virtuel est géré par `interactiveWidget: 'resizes-content'` (layout).
// Hauteur réservée par `ActionBarSpacer` pour ne jamais masquer le contenu ni le focus.

export type ActionLink = { href: string; label: string; ariaLabel?: string };

type StickyActionBarProps = {
  primary: ActionLink | null;
  whatsapp: ActionLink | null;
  label: string;
};

const buttonBase =
  'inline-flex min-h-touch flex-1 items-center justify-center rounded-control px-4 text-center font-semibold';

export const StickyActionBar = ({ primary, whatsapp, label }: StickyActionBarProps) => {
  if (!primary && !whatsapp) return null;
  return (
    <nav
      aria-label={label}
      data-sticky-action-bar
      className="sticky-action-bar border-t border-sable-deep bg-sable/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:border-0 md:bg-transparent md:px-0 md:pt-6 md:pb-0 md:backdrop-blur-none"
    >
      <div className="mx-auto flex max-w-6xl gap-3 md:px-8">
        {primary && (
          <Link
            href={primary.href}
            aria-label={primary.ariaLabel}
            className={`${buttonBase} bg-mangrove text-sable`}
          >
            {primary.label}
          </Link>
        )}
        {whatsapp && (
          <a
            href={whatsapp.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={whatsapp.ariaLabel}
            className={`${buttonBase} bg-ocre text-white`}
          >
            {whatsapp.label}
          </a>
        )}
      </div>
    </nav>
  );
};

/** Espace réservé sous le contenu, de la hauteur de la barre, sur mobile seulement. */
export const ActionBarSpacer = () => <div aria-hidden="true" className="action-bar-spacer" />;
