'use client';

import { useFormStatus } from 'react-dom';

// Bouton de paiement (002, US3, FR-019 ; contrat checkout-actions « Bouton de paiement ») :
// après l'envoi, désactivé et annoncé « Paiement en cours… » pour éviter le double appui. Sans
// JavaScript, c'est un bouton ordinaire (le serveur refuse de toute façon une seconde tentative).

type Props = {
  label: string;
  pendingLabel: string;
  className: string;
  name?: string;
  value?: string;
};

export const PayButton = ({ label, pendingLabel, className, name, value }: Props) => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-disabled={pending}
      className={`${className} disabled:opacity-70`}
    >
      <span aria-live="polite">{pending ? pendingLabel : label}</span>
    </button>
  );
};
