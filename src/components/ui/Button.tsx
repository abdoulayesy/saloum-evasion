import Link from 'next/link';
import type { ReactNode } from 'react';

// Variantes écrites à la main (tailwind-variants refusé par le propriétaire) : objets de
// classes typés. Cibles ≥ 44 px (constitution I).

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'whatsapp' | 'onDark';

const base =
  'inline-flex min-h-touch min-w-touch items-center justify-center gap-2 rounded-control px-5 text-center font-semibold';

export const buttonVariants: Record<ButtonVariant, string> = {
  primary: `${base} bg-mangrove text-sable`,
  secondary: `${base} border-2 border-mangrove text-mangrove`,
  ghost: `${base} text-mangrove underline underline-offset-4`,
  whatsapp: `${base} bg-ocre text-white`,
  /** Sur fond mangrove : bouton sable. */
  onDark: `${base} bg-sable text-mangrove`,
};

type ButtonLinkProps = {
  href: string;
  variant?: ButtonVariant;
  external?: boolean;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
};

export const ButtonLink = ({
  href,
  variant = 'primary',
  external = false,
  className = '',
  ariaLabel,
  children,
}: ButtonLinkProps) =>
  external ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={`${buttonVariants[variant]} ${className}`}
    >
      {children}
    </a>
  ) : (
    <Link href={href} aria-label={ariaLabel} className={`${buttonVariants[variant]} ${className}`}>
      {children}
    </Link>
  );
