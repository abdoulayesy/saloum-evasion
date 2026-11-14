// Constitution II : JavaScript initial ≤ 150 Ko compressés par route publique,
// et chaque morceau chargé à la demande ≤ 100 Ko compressés.
// L'admin Payload est exclu (dérogation D-T6a du plan).
// Exécution : node --experimental-strip-types scripts/check-bundles.ts (après `next build`).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const NEXT_DIR = '.next';
const INITIAL_BUDGET = 150 * 1024;
const LAZY_BUDGET = 100 * 1024;
const EXCLUDED_ROUTE = /^\/\(payload\)/;

type AppBuildManifest = { pages: Record<string, string[]> };
type BuildManifest = { rootMainFiles?: string[]; polyfillFiles?: string[] };

const readJson = (file: string): unknown => JSON.parse(readFileSync(join(NEXT_DIR, file), 'utf8'));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const parseAppManifest = (value: unknown): AppBuildManifest => {
  const pages: Record<string, string[]> = {};
  if (isRecord(value) && isRecord(value.pages)) {
    for (const [route, files] of Object.entries(value.pages)) pages[route] = toStringArray(files);
  }
  return { pages };
};

const parseBuildManifest = (value: unknown): BuildManifest =>
  isRecord(value)
    ? {
        rootMainFiles: toStringArray(value.rootMainFiles),
        polyfillFiles: toStringArray(value.polyfillFiles),
      }
    : {};

const sizeCache = new Map<string, number>();
const gzipSize = (file: string): number => {
  const cached = sizeCache.get(file);
  if (cached !== undefined) return cached;
  const path = join(NEXT_DIR, file);
  const size = existsSync(path) ? gzipSync(readFileSync(path)).length : 0;
  sizeCache.set(file, size);
  return size;
};

const kb = (bytes: number): string => `${(bytes / 1024).toFixed(1)} Ko`;

const main = (): void => {
  if (!existsSync(join(NEXT_DIR, 'app-build-manifest.json'))) {
    console.error('Lancer `pnpm build` avant `pnpm bundles`.');
    process.exit(1);
  }
  const appManifest = parseAppManifest(readJson('app-build-manifest.json'));
  const buildManifest = parseBuildManifest(readJson('build-manifest.json'));
  // Les polyfills ne sont servis qu'aux navigateurs anciens (nomodule) : hors budget.
  const shared = buildManifest.rootMainFiles ?? [];

  const failures: string[] = [];
  const initialFiles = new Set<string>(shared);

  // Une route = sa page + tous les layouts parents (le manifeste les liste séparément).
  const entries = Object.entries(appManifest.pages);
  const layouts = entries.filter(([key]) => key.endsWith('/layout'));
  const routeFiles = (pageKey: string, files: string[]): string[] => {
    const pageDir = pageKey.slice(0, -'/page'.length);
    const parentLayouts = layouts
      .filter(([layoutKey]) => {
        const layoutDir = layoutKey.slice(0, -'/layout'.length);
        return pageDir === layoutDir || pageDir.startsWith(`${layoutDir}/`) || layoutDir === '';
      })
      .flatMap(([, layoutFiles]) => layoutFiles);
    return [...parentLayouts, ...files];
  };

  console.log('JavaScript initial par route (page + layouts parents, gzip) :');
  for (const [route, files] of entries) {
    if (EXCLUDED_ROUTE.test(route) || !route.endsWith('/page')) continue;
    const jsFiles = [...new Set([...shared, ...routeFiles(route, files)])].filter((file) =>
      file.endsWith('.js'),
    );
    jsFiles.forEach((file) => initialFiles.add(file));
    const total = jsFiles.reduce((sum, file) => sum + gzipSize(file), 0);
    const status = total <= INITIAL_BUDGET ? 'ok' : 'DÉPASSÉ';
    console.log(`  ${status.padEnd(7)} ${kb(total).padStart(10)}  ${route}`);
    if (total > INITIAL_BUDGET) failures.push(`${route} : ${kb(total)} > ${kb(INITIAL_BUDGET)}`);
  }

  const chunksDir = join(NEXT_DIR, 'static', 'chunks');
  const lazyFiles = readdirSync(chunksDir, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.js'))
    .map((file) => `static/chunks/${file.replaceAll('\\', '/')}`)
    .filter((file) => !initialFiles.has(file) && !file.includes('/app/(payload)/'));

  console.log(`Morceaux chargés à la demande : ${lazyFiles.length}`);
  for (const file of lazyFiles) {
    const size = gzipSize(file);
    if (size > LAZY_BUDGET)
      failures.push(`${file} (à la demande) : ${kb(size)} > ${kb(LAZY_BUDGET)}`);
  }

  if (failures.length > 0) {
    console.error('\nBudgets dépassés :');
    failures.forEach((failure) => console.error(`  - ${failure}`));
    process.exit(1);
  }
  console.log('\nTous les budgets JavaScript sont respectés.');
};

main();
