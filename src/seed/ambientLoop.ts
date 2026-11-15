import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PHOTO_DIR } from './photos';

// Boucle d'ambiance de DÉMONSTRATION tirée de la vidéo fournie par l'équipe : 8 s, muette,
// 960 px, H.264 « faststart », ≤ 1,5 Mo (research R4). Générée dans public/videos/demo/ (non
// versionné) si ffmpeg est installé ; sinon la boucle garde le rendu Mux.

const SOURCE = join(PHOTO_DIR, 'IMG_0307.mov');
const OUTPUT_DIR = join(process.cwd(), 'public', 'videos', 'demo');
const OUTPUT = join(OUTPUT_DIR, 'ambient-loop.mp4');
const PUBLIC_PATH = '/videos/demo/ambient-loop.mp4';
const MAX_BYTES = 1.5 * 1024 * 1024;

const encode = (crf: number): boolean =>
  spawnSync('ffmpeg', [
    '-v',
    'error',
    '-y',
    '-ss',
    '0.5',
    '-t',
    '8',
    '-i',
    SOURCE,
    '-an',
    '-vf',
    'scale=960:-2',
    '-c:v',
    'libx264',
    '-profile:v',
    'main',
    '-pix_fmt',
    'yuv420p',
    '-crf',
    String(crf),
    '-preset',
    'slow',
    '-movflags',
    '+faststart',
    OUTPUT,
  ]).status === 0;

/** Chemin public de la boucle générée, ou null si la source ou ffmpeg manquent. */
export const prepareAmbientLoop = (): string | null => {
  if (!existsSync(SOURCE)) return null;
  mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const crf of [28, 32, 36]) {
    if (!encode(crf)) return null;
    if (statSync(OUTPUT).size <= MAX_BYTES) return PUBLIC_PATH;
  }
  return null;
};
