import type { ReactNode } from 'react';

// Étiquette d'information (non interactive) : envies, durée, type.
export const Chip = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center rounded-full border border-line px-3 py-1 text-sm text-ink">
    {children}
  </span>
);
