// Exécute la file de tâches en local (002, T028) : appelle /api/jobs/run toutes les 15 secondes,
// comme Vercel Cron en production. Usage : `pnpm jobs:dev` à côté de `pnpm dev`.

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const secret = process.env.CRON_SECRET;
const INTERVAL_MS = 15_000;

if (!secret) {
  console.error('CRON_SECRET manquant (voir .env.example).');
  process.exit(1);
}

const tick = async () => {
  try {
    const response = await fetch(new URL('/api/jobs/run', base), {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const body = await response.text();
    console.log(`[jobs] ${new Date().toLocaleTimeString('fr-FR')} HTTP ${response.status} ${body}`);
  } catch (error) {
    console.warn('[jobs] serveur injoignable', error instanceof Error ? error.message : error);
  }
};

void tick();
setInterval(() => void tick(), INTERVAL_MS);
