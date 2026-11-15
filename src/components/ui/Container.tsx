import type { ReactNode } from 'react';

// Largeur de lecture : 16 px de marge à 360 px, puis élargissement progressif (min-width).
export const Container = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => <div className={`mx-auto w-full max-w-6xl px-4 sm:px-8 ${className}`}>{children}</div>;
