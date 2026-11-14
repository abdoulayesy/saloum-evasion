import type { ReactNode } from 'react';

// Layout racine transparent : <html> est rendu par le layout localisé
// (src/app/(frontend)/[locale]/layout.tsx), ou par not-found.tsx pour les URL hors locale.
const RootLayout = ({ children }: { children: ReactNode }) => children;

export default RootLayout;
