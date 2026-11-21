import type { CollectionBeforeChangeHook } from 'payload';
import { nextGuideDates } from '@/lib/guides/dates';
import { readingMinutes } from '@/lib/guides/readingTime';

// Dates et temps de lecture d'un guide à l'enregistrement (004, T017). À la publication :
// `publishedOn` à la première fois, `updatedOn` à la première fois puis à chaque « mise à jour
// importante » (case remise à faux). Temps de lecture calculé dans la langue enregistrée.

const civil = (value: unknown): string | null =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;

export const guideDatesHook: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const dates = nextGuideDates({
    publishing: data._status === 'published',
    previous: {
      publishedOn: civil(originalDoc?.publishedOn),
      updatedOn: civil(originalDoc?.updatedOn),
    },
    substantive: data.substantiveUpdate === true,
    today: new Date().toISOString().slice(0, 10),
  });
  return {
    ...data,
    publishedOn: dates.publishedOn,
    updatedOn: dates.updatedOn,
    substantiveUpdate: false,
    // Mise à jour partielle sans le corps : temps de lecture inchangé.
    ...(data.body === undefined ? {} : { readingMinutes: readingMinutes(data.body) }),
  };
};
