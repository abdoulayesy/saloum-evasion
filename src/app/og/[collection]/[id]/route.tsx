import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { getPayloadClient } from '@/lib/cms/queries';
import { populated } from '@/lib/cms/populated';
import { renderOgImage, OG_SIZE } from '@/lib/seo/og';
import { siteUrl } from '@/lib/site';
import type { Media } from '@/payload-types';

// Image de partage 1200×630 d'un document (plan, tension T7) : la vraie photo principale du
// document, recadrée, avec le titre et la marque. Collections couvertes à mesure que leurs
// pages sont livrées.

const SUPPORTED = ['stays', 'experiences', 'universes', 'destinations', 'accommodations'] as const;
type Supported = (typeof SUPPORTED)[number];

const isSupported = (value: string): value is Supported => SUPPORTED.some((slug) => slug === value);

/** Photo en JPEG 1200×630 (data URI) : lue sur disque en local, téléchargée si distante (S3). */
const photoDataUri = async (media: Media | null): Promise<string | undefined> => {
  if (!media?.url) return undefined;
  const origin = siteUrl();
  const isLocal = !media.url.startsWith('http') || media.url.startsWith(origin);
  let source: Buffer;
  if (isLocal && media.filename) {
    source = await readFile(join(process.cwd(), 'media', media.filename));
  } else {
    const response = await fetch(media.url);
    if (!response.ok) return undefined;
    source = Buffer.from(await response.arrayBuffer());
  }
  const jpeg = await sharp(source)
    .resize(OG_SIZE.width, OG_SIZE.height, { fit: 'cover' })
    .jpeg({ quality: 75 })
    .toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString('base64')}`;
};

type Params = { params: Promise<{ collection: string; id: string }> };

export const GET = async (_request: Request, { params }: Params) => {
  const { collection, id } = await params;
  const numericId = Number(id);
  if (!isSupported(collection) || !Number.isInteger(numericId)) {
    return new Response('Introuvable', { status: 404 });
  }
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection,
    where: { and: [{ id: { equals: numericId } }, { _status: { equals: 'published' } }] },
    locale: 'fr',
    depth: 1,
    limit: 1,
    overrideAccess: false,
  });
  const [doc] = result.docs;
  if (!doc) return new Response('Introuvable', { status: 404 });
  // Fiches : titre et image principale ; univers : nom et image.
  const title = 'title' in doc ? doc.title : 'name' in doc ? doc.name : null;
  const photo = 'heroImage' in doc ? doc.heroImage : 'image' in doc ? doc.image : null;
  const image = await renderOgImage({
    eyebrow: 'Ndangane · Sine-Saloum',
    title: title ?? 'Saloum Évasion',
    photoUrl: await photoDataUri(populated<Media>(photo)),
  });
  image.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  return image;
};
