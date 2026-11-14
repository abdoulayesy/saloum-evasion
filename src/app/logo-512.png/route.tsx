import { ImageResponse } from 'next/og';
import { markDataUri } from '@/lib/seo/og';

// Logo carré 512 px référencé par le JSON-LD Organization, généré au build depuis la marque.
export const dynamic = 'force-static';

export const GET = () =>
  new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- rendu image, pas de DOM
    <img src={markDataUri} width={512} height={512} />,
    { width: 512, height: 512 },
  );
