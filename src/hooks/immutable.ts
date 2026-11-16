import {
  APIError,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
} from 'payload';

// Pièces immuables (journal des notifications de paiement, écritures de commission) : aucune
// mise à jour ni suppression, même par l'API locale avec `overrideAccess` (data-model 002).

export const refuseUpdate: CollectionBeforeChangeHook = ({ operation, data }) => {
  if (operation === 'update') throw new APIError('Document immuable : modification refusée.', 403);
  return data;
};

export const refuseDelete: CollectionBeforeDeleteHook = () => {
  throw new APIError('Document immuable : suppression refusée.', 403);
};

export const immutableHooks = { beforeChange: [refuseUpdate], beforeDelete: [refuseDelete] };
