import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/cms/queries';

// Table compilée des redirections 301 (T068), lue par le middleware. Mise en cache avec le
// tag `redirects`, invalidé à chaque création ou modification d'une redirection.
// (`/api/redirects` est l'API REST de la collection Payload : nom distinct.)

export type RedirectTable = Record<string, string>;

const loadTable = unstable_cache(
  async (): Promise<RedirectTable> => {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'redirects',
      limit: 0,
      pagination: false,
      depth: 0,
      overrideAccess: false,
    });
    return Object.fromEntries(result.docs.map((doc) => [doc.from, doc.to]));
  },
  ['redirect-table'],
  { tags: ['redirects'] },
);

export const GET = async () =>
  NextResponse.json(await loadTable(), {
    headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
