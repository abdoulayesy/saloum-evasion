// Constantes de la demande de séjour, sans dépendance : importables par les îlots clients sans
// embarquer Zod (26 Ko compressés) dans le JavaScript du navigateur.

export const MAX_ITEMS = 10;

export const REQUEST_ITEM_KINDS = ['stay', 'experience', 'accommodation'] as const;

export type RequestItemKind = (typeof REQUEST_ITEM_KINDS)[number];
