// Liens WhatsApp (FR-016, constitution VI) : simple lien wa.me, aucun widget tiers.
// Le numéro vient des réglages du site ; sans numéro, aucun lien n'est produit (le site ne
// renvoie jamais vers un numéro inventé).

export type WhatsAppInput = {
  /** Numéro E.164 des réglages (ex. +221771234567). */
  number: string | undefined;
  /** Message pré-rédigé, dans la langue de la page. */
  message: string;
};

/** Chiffres seuls, comme l'exige wa.me (sans « + » ni espaces). */
export const toWaNumber = (e164: string): string => e164.replace(/\D/g, '');

export const buildWhatsAppLink = ({ number, message }: WhatsAppInput): string | null => {
  if (!number) return null;
  const digits = toWaNumber(number);
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};
