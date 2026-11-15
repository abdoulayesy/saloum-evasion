import type { CollectionConfig } from 'payload';
import { nobody } from '@/access';

// Limitation de débit du formulaire (FR-014), stockée dans Postgres plutôt que dans un
// service supplémentaire (principe VIII). IP hachées avec sel ; purge à 24 h. Technique :
// invisible dans l'admin, accessible uniquement par l'API locale (overrideAccess).
export const RateLimits: CollectionConfig = {
  slug: 'rateLimits',
  admin: { hidden: true },
  access: { read: nobody, create: nobody, update: nobody, delete: nobody },
  fields: [
    { name: 'ipHash', type: 'text', required: true, index: true },
    { name: 'windowStart', type: 'date', required: true, index: true },
    { name: 'count', type: 'number', required: true, defaultValue: 0 },
  ],
};
