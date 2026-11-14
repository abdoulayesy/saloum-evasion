import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

// Images de partage 1200×630 (plan, tension T7) : une vraie photo du document, un voile
// mangrove, le titre en Cormorant et la marque. Sans photo (image par défaut), composition
// typographique sur fond mangrove : aucune image de synthèse présentée comme réelle.

export const OG_SIZE = { width: 1200, height: 630 } as const;

const fontsDir = join(process.cwd(), 'src', 'assets', 'fonts');

const loadFonts = async () => {
  const [serif, sans] = await Promise.all([
    readFile(join(fontsDir, 'cormorant-garamond-latin-600-normal.ttf')),
    readFile(join(fontsDir, 'manrope-latin-600-normal.ttf')),
  ]);
  return [
    { name: 'Cormorant Garamond', data: serif, weight: 600 as const, style: 'normal' as const },
    { name: 'Manrope', data: sans, weight: 600 as const, style: 'normal' as const },
  ];
};

const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0f2a24"/><path d="M12 40c8-6 14-6 20 0s12 6 20 0" fill="none" stroke="#f4eee3" stroke-width="4" stroke-linecap="round"/><circle cx="40" cy="22" r="7" fill="#9e4521"/></svg>`;

export const markDataUri = `data:image/svg+xml;base64,${Buffer.from(MARK_SVG).toString('base64')}`;

export type OgImageInput = {
  title: string;
  eyebrow?: string;
  /** URL absolue d'une vraie photo du document (JPEG ou PNG). */
  photoUrl?: string;
};

export const renderOgImage = async ({ title, eyebrow, photoUrl }: OgImageInput) =>
  new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        backgroundColor: '#0f2a24',
        fontFamily: 'Manrope',
      }}
    >
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- rendu image OG, pas de DOM
        <img
          src={photoUrl}
          width={OG_SIZE.width}
          height={OG_SIZE.height}
          style={{ position: 'absolute', inset: 0, objectFit: 'cover' }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '64px 72px',
          background: photoUrl
            ? 'linear-gradient(180deg, rgba(15,42,36,0.15) 0%, rgba(15,42,36,0.85) 70%)'
            : '#0f2a24',
        }}
      >
        {eyebrow && (
          <div
            style={{
              color: '#e8b49a',
              fontSize: 28,
              letterSpacing: 4,
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            {eyebrow}
          </div>
        )}
        <div
          style={{
            color: '#f4eee3',
            fontFamily: 'Cormorant Garamond',
            fontSize: title.length > 40 ? 64 : 80,
            lineHeight: 1.05,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 40, gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- rendu image OG */}
          <img src={markDataUri} width={56} height={56} />
          <div style={{ color: '#f4eee3', fontSize: 30 }}>Saloum Évasion</div>
        </div>
      </div>
    </div>,
    { ...OG_SIZE, fonts: await loadFonts() },
  );
