// Instantané statique de DÉMONSTRATION : explore le site servi par `next start`, enregistre
// chaque page en HTML et ses images optimisées, prêt pour un hébergeur de fichiers (Cloudflare
// Pages, Netlify, Vercel). Les fonctions qui exigent un serveur (panier, paiement, demande,
// administration) y sont désactivées avec un message. Jamais pour la production.
//
//   node scripts/export-static-demo.mjs   (BASE, OUT, ORIGIN en variables d'environnement)
//
// Jamais copié : `public/activites illustration/` (photos d'origine, droits à confirmer).
// Seules les images déjà optimisées et affichées par les pages sont enregistrées.

import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const BASE = (process.env.BASE ?? 'http://localhost:3000').replace(/\/+$/, '');
const OUT = process.env.OUT;
const ORIGIN = (process.env.ORIGIN ?? 'https://saloum-evasion-site.pages.dev').replace(/\/+$/, '');
if (!OUT) throw new Error('OUT (dossier de sortie) est requis.');

const EXCLUDED = /^\/(api|admin|_next|og|dev|espace)(\/|$)|\/(panier|cart|commande|checkout|reservation|booking|reprendre|resume|desinscription|unsubscribe)(\/|$)|\/(merci|thanks)$/;
const FILE_EXT = /\.(svg|png|ico|jpg|jpeg|webp|avif|gif|mp4|vtt|xml|txt|json|webmanifest|woff2?|css|js)$/i;

const DEMO_SCRIPT = `<script>
(function () {
  var fr = document.documentElement.lang !== 'en';
  var msg = fr
    ? 'Version de démonstration : la réservation en ligne, le paiement et l’envoi de demandes sont désactivés ici.'
    : 'Demo version: online booking, payment and request sending are disabled here.';
  var timer;
  function show() {
    var box = document.getElementById('demo-banner');
    if (!box) {
      box = document.createElement('div');
      box.id = 'demo-banner';
      box.setAttribute('role', 'status');
      box.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:100;max-width:560px;margin:0 auto;background:#0f2a24;color:#f4eee3;border:1px solid #f0a257;border-radius:14px;padding:14px 16px;font:600 15px/1.4 Manrope,system-ui,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.35)';
      document.body.appendChild(box);
    }
    box.textContent = msg;
    clearTimeout(timer);
    timer = setTimeout(function () { box.remove(); }, 6000);
  }
  window.addEventListener('submit', function (event) {
    var form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    var method = (form.getAttribute('method') || 'get').toLowerCase();
    var action = form.getAttribute('action') || '';
    var serverAction = action.indexOf('javascript:') === 0 || form.querySelector('input[name^="$ACTION"]');
    if (method === 'post' || serverAction) {
      event.preventDefault();
      event.stopImmediatePropagation();
      show();
    }
  }, true);
})();
</script>`;

const files = new Map(); // chemin public → présent
const images = new Map(); // clé (url, w, q) → chemin public
const pages = new Map(); // chemin de page → chemin du fichier
const queue = [];
const seen = new Set();
const problems = [];

const write = async (publicPath, data) => {
  const target = join(OUT, publicPath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, data);
  files.set(publicPath, true);
};

const extFor = (type) =>
  type.includes('avif') ? 'avif' : type.includes('webp') ? 'webp' : type.includes('png') ? 'png' : 'jpg';

const fetchImage = async (url, w, q) => {
  const key = `${url}|${w}|${q}`;
  const known = images.get(key);
  if (known) return known;
  const target = `${BASE}/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=${q}`;
  const res = await fetch(target, { headers: { Accept: 'image/avif,image/webp,image/*' } });
  if (!res.ok) {
    problems.push(`image ${res.status} : ${url} (${w})`);
    return null;
  }
  const ext = extFor(res.headers.get('content-type') ?? '');
  const name = `/_img/${createHash('sha1').update(key).digest('hex').slice(0, 12)}.${ext}`;
  await write(name, Buffer.from(await res.arrayBuffer()));
  images.set(key, name);
  return name;
};

const fetchRaw = async (publicPath) => {
  if (files.has(publicPath) || existsSync(join(OUT, publicPath))) return;
  const res = await fetch(`${BASE}${publicPath}`);
  if (!res.ok) {
    problems.push(`fichier ${res.status} : ${publicPath}`);
    return;
  }
  await write(publicPath, Buffer.from(await res.arrayBuffer()));
};

const pageFile = (path) => {
  if (path === '/') return 'index.html';
  return `${path.replace(/^\/+|\/+$/g, '')}.html`;
};

const process_ = async (path, html) => {
  // 1. Images optimisées : attributs HTML (`&amp;`) et données de la page (`&`).
  const imagePattern = /\/_next\/image\?url=([^&"'\\\s,]+)(?:&amp;|\\u0026|&)w=(\d+)(?:&amp;|\\u0026|&)q=(\d+)/g;
  const wanted = new Set();
  for (const match of html.matchAll(imagePattern)) wanted.add(match[0]);
  const replacements = new Map();
  for (const full of wanted) {
    const [, rawUrl, w, q] = full.match(/url=([^&\\]+?)(?:&amp;|\\u0026|&)w=(\d+)(?:&amp;|\\u0026|&)q=(\d+)/) ?? [];
    if (!rawUrl) continue;
    const name = await fetchImage(decodeURIComponent(rawUrl), w, q);
    if (name) replacements.set(full, name);
  }
  html = html.replace(imagePattern, (full) => replacements.get(full) ?? full);

  // 2. Fichiers servis tels quels (médias bruts, icônes, vignettes) cités par la page.
  const rawRefs = new Set(
    [...html.matchAll(/["'(](\/(?:api\/media\/file\/[^"'\\\s)?&#]+|[^"'\\\s)?&#]+\.(?:svg|png|ico|jpg|jpeg|webp|avif|webmanifest)))/g)]
      .map((m) => m[1])
      .filter((ref) => !ref.startsWith('/_next/') && !ref.startsWith('/_img/') && !ref.startsWith('/fonts/')),
  );
  for (const ref of rawRefs) await fetchRaw(decodeURI(ref));

  // 3. Bascule de langue : page équivalente donnée par les liens `alternate` de la page.
  for (const lang of ['fr', 'en']) {
    const alt = html.match(new RegExp(`rel="alternate" hrefLang="${lang}" href="([^"]+)"`));
    if (alt) {
      const target = new URL(alt[1], BASE).pathname;
      html = html.split(`/api/locale-switch?to=${lang}`).join(target);
    }
  }

  // 4. Adresse du site, balise robots (démonstration non indexée), message des formulaires.
  html = html.split(BASE).join(ORIGIN);
  if (!/<meta name="robots"/.test(html)) {
    html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow"/></head>');
  }
  html = html.replace('</body>', `${DEMO_SCRIPT}</body>`);

  // 5. Liens internes à suivre.
  const links = [...html.matchAll(/href="(\/[^"#]*)"/g)]
    .map((m) => m[1].split('?')[0].replace(/\/+$/, '') || '/')
    .filter((link) => !EXCLUDED.test(link) && !FILE_EXT.test(link));
  return { html, links };
};

const crawl = async (path) => {
  const res = await fetch(`${BASE}${path}`, { redirect: 'manual' });
  if (res.status >= 300 && res.status < 400) {
    problems.push(`redirection ${res.status} ignorée : ${path} → ${res.headers.get('location')}`);
    return;
  }
  if (!res.ok || !(res.headers.get('content-type') ?? '').includes('text/html')) {
    problems.push(`page ${res.status} : ${path}`);
    return;
  }
  const { html, links } = await process_(path, await res.text());
  const file = pageFile(path);
  await write(file, html);
  pages.set(path, file);
  for (const link of links) enqueue(link);
};

const enqueue = (path) => {
  if (seen.has(path)) return;
  seen.add(path);
  queue.push(path);
};

const run = async () => {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await cp('.next/static', join(OUT, '_next/static'), { recursive: true });
  for (const entry of await readdir('public')) {
    if (entry === 'activites illustration') continue;
    await cp(join('public', entry), join(OUT, entry), { recursive: true });
  }

  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
  for (const [, loc] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    enqueue(new URL(loc).pathname.replace(/\/+$/, '') || '/');
  }
  for (const extra of ['/fr/composer', '/en/compose', '/fr/demande', '/en/request']) enqueue(extra);

  const drain = async () => {
    while (queue.length > 0) {
      const path = queue.shift();
      if (path !== undefined) await crawl(path);
    }
  };
  // Les liens découverts alimentent la file : on relance tant que des pages restent à traiter.
  do {
    await Promise.all(Array.from({ length: 6 }, drain));
  } while (queue.length > 0);

  // Page 404 (statut 404, rendue par le site).
  const missing = await fetch(`${BASE}/fr/page-introuvable-demo`);
  const missingPage = await process_('/404', await missing.text());
  await write('404.html', missingPage.html);

  await write('robots.txt', 'User-agent: *\nDisallow: /\n');
  await write('_redirects', '/  /fr  302\n');
  await write(
    '_headers',
    [
      '/*',
      '  X-Robots-Tag: noindex, nofollow',
      '  Cache-Control: public, max-age=0, must-revalidate',
      '/_next/static/*',
      '  Cache-Control: public, max-age=31536000, immutable',
      '/_img/*',
      '  Cache-Control: public, max-age=31536000, immutable',
      '',
    ].join('\n'),
  );
  // Repli sans règle de redirection : la racine renvoie vers la version française.
  if (!files.has('index.html')) {
    await write(
      'index.html',
      '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=/fr"><title>Saloum Évasion</title></head><body><a href="/fr">Saloum Évasion</a></body></html>',
    );
  }

  let bytes = 0;
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else bytes += (await stat(full)).size;
    }
  };
  await walk(OUT);
  console.log(`${pages.size} pages, ${images.size} images optimisées, ${(bytes / 1048576).toFixed(1)} Mo`);
  if (problems.length > 0) console.log(`À vérifier (${problems.length}) :\n- ${problems.join('\n- ')}`);
};

await run();
