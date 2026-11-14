'use client';

import type { MouseEvent, ReactNode } from 'react';

type DialogOpenerProps = {
  dialogId: string;
  /** Cible sans JavaScript : la navigation du pied de page. */
  fallbackHref: string;
  className?: string;
  children: ReactNode;
};

// Îlot client minimal (< 1 Ko) : ouvre un <dialog> rendu côté serveur avec showModal(),
// qui apporte nativement le focus enfermé, la fermeture par Échap et par le bouton retour
// d'Android, puis le retour du focus. Sans JavaScript, c'est un simple lien.
export const DialogOpener = ({
  dialogId,
  fallbackHref,
  className,
  children,
}: DialogOpenerProps) => {
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    const dialog = document.getElementById(dialogId);
    if (!(dialog instanceof HTMLDialogElement)) return;
    event.preventDefault();
    dialog.showModal();
  };
  return (
    <a
      href={fallbackHref}
      onClick={open}
      aria-haspopup="dialog"
      aria-controls={dialogId}
      className={className}
    >
      {children}
    </a>
  );
};
