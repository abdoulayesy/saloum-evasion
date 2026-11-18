// Annotations GitHub des assertions Lighthouse CI en échec (lu depuis .lighthouseci/) : chaque
// assertion ratée devient une ligne `::error::` visible dans l'onglet de la PR, sans ouvrir le
// journal complet du job.
import { readFile } from 'node:fs/promises';

const raw = await readFile('.lighthouseci/assertion-results.json', 'utf8').catch(() => '[]');
const results = JSON.parse(raw);
const failures = results.filter((result) => result.level === 'error' && result.passed === false);
for (const failure of failures) {
  const url = String(failure.url ?? '').replace('http://localhost:3000', '');
  const found = typeof failure.actual === 'number' ? Math.round(failure.actual * 1000) / 1000 : failure.actual;
  console.log(
    `::error title=Lighthouse ${url}::${failure.auditId} ${failure.operator ?? ''} ${failure.expected} (mesuré : ${found})`,
  );
}
console.log(`${failures.length} assertion(s) Lighthouse en échec.`);
