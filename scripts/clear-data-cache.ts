// Vide le cache de données de Next (`unstable_cache`, persistant dans .next/cache d'un build à
// l'autre). Lancé après le seed et les migrations : ces scripts modifient la base hors de Next
// et ne peuvent pas invalider les tags. Les modifications faites dans l'admin, elles,
// invalident le cache par tag (hooks/revalidate.ts).
import { rmSync } from 'node:fs';

rmSync('.next/cache/fetch-cache', { recursive: true, force: true });
console.log('Cache de données Next vidé (.next/cache/fetch-cache).');
