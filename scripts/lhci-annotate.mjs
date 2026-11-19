// Annotations GitHub des assertions Lighthouse CI en échec (lu depuis .lighthouseci/) : chaque
// assertion ratée devient une ligne `::error::` visible dans l'onglet de la PR, sans ouvrir le
// journal complet du job. Pour un LCP en échec, chaque passage indique aussi l'élément LCP et la
// décomposition de son temps (diagnostic sans télécharger les rapports).
import { readdir, readFile } from 'node:fs/promises';

const dir = '.lighthouseci';
const raw = await readFile(`${dir}/assertion-results.json`, 'utf8').catch(() => '[]');
const results = JSON.parse(raw);
const failures = results.filter((result) => result.level === 'error' && result.passed === false);

const reports = [];
for (const name of await readdir(dir).catch(() => [])) {
  if (!/^lhr-.*\.json$/.test(name)) continue;
  const lhr = JSON.parse(await readFile(`${dir}/${name}`, 'utf8'));
  reports.push(lhr);
}

const lcpDetail = (lhr) => {
  const audits = lhr.audits ?? {};
  const lcp = Math.round(audits['largest-contentful-paint']?.numericValue ?? 0);
  const fcp = Math.round(audits['first-contentful-paint']?.numericValue ?? 0);
  const items = audits['lcp-breakdown-insight']?.details?.items ?? [];
  const node = items.find((item) => item.type === 'node');
  const table = items.find((item) => item.type === 'table');
  const parts = (table?.items ?? [])
    .map((part) => `${part.subpart} ${Math.round(part.duration)} ms`)
    .join(', ');
  return `LCP ${lcp} ms, FCP ${fcp} ms, élément ${node?.selector ?? '?'} « ${String(node?.nodeLabel ?? '').slice(0, 60)} » (${parts})`;
};

for (const failure of failures) {
  const url = String(failure.url ?? '').replace('http://localhost:3000', '');
  const found =
    typeof failure.actual === 'number' ? Math.round(failure.actual * 1000) / 1000 : failure.actual;
  console.log(
    `::error title=Lighthouse ${url}::${failure.auditId} ${failure.operator ?? ''} ${failure.expected} (mesuré : ${found})`,
  );
  if (failure.auditId !== 'largest-contentful-paint') continue;
  for (const lhr of reports.filter((report) => report.requestedUrl === failure.url)) {
    console.log(`::warning title=LCP ${url}::${lcpDetail(lhr)}`);
  }
}
console.log(`${failures.length} assertion(s) Lighthouse en échec.`);
