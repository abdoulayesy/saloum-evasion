// Instantané statique de DÉMONSTRATION : explore le site servi par `next start`, enregistre
// chaque page en HTML et ses images optimisées, prêt pour un hébergeur de fichiers (Cloudflare
// Pages, Netlify, Vercel). Les fonctions qui exigent un serveur (panier, paiement, demande,
// administration) y sont désactivées avec un message. Jamais pour la production.
//
//   BASE=http://localhost:3000 OUT=/chemin ORIGIN=https://… node scripts/export-static-demo.mjs
//
// Jamais copié : `public/activites illustration/` (photos d'origine, droits à confirmer).
// Seules les images déjà optimisées et affichées par les pages sont enregistrées.
//
// Flux de données React : chaque page embarque, dans des balises `self.__next_f.push`, le flux
// qui sert à l'hydratation. Ses longs textes (JSON-LD…) sont précédés de leur longueur EN OCTETS :
// toute réécriture (liens d'images, adresse du site) doit donc recalculer ces longueurs, sinon
// l'hydratation échoue (« Connection closed »). `mapFlight` analyse le flux ligne par ligne.

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const BASE = (process.env.BASE ?? 'http://localhost:3000').replace(/\/+$/, '');
const ORIGIN = (process.env.ORIGIN ?? 'https://saloum-evasion-site.pages.dev').replace(/\/+$/, '');
const OUT = process.env.OUT;
if (!OUT) throw new Error('OUT (dossier de sortie) est requis.');

const EXCLUDED =
  /^\/(api|admin|_next|og|dev|espace)(\/|$)|\/(panier|cart|commande|checkout|reservation|booking|reprendre|resume|desinscription|unsubscribe)(\/|$)|\/(merci|thanks)$/;
const FILE_EXT =
  /\.(svg|png|ico|jpg|jpeg|webp|avif|gif|mp4|vtt|xml|txt|json|webmanifest|woff2?|css|js)$/i;
const IMAGE =
  /\/_next\/image\?url=([^&"'\\\s,]+)(?:&amp;|\\u0026|&)w=(\d+)(?:&amp;|\\u0026|&)q=(\d+)/g;
const FLIGHT = /<script>self\.__next_f\.push\((\[[\s\S]*?\])\)<\/script>/g;
const LENGTH_TAGS = new Set('TAOoUSsLlGgMmV');

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

const files = new Set();
const images = new Map(); // « url|w|q » → chemin public
const pages = new Map();
const queue = [];
const seen = new Set();
const problems = [];

const write = async (publicPath, data) => {
  const target = join(OUT, publicPath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, data);
  files.add(publicPath);
};

const extFor = (type) =>
  type.includes('avif')
    ? 'avif'
    : type.includes('webp')
      ? 'webp'
      : type.includes('png')
        ? 'png'
        : 'jpg';

const fetchImage = async (url, w, q) => {
  const key = `${url}|${w}|${q}`;
  if (images.has(key)) return;
  const target = `${BASE}/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=${q}`;
  const res = await fetch(target, { headers: { Accept: 'image/avif,image/webp,image/*' } });
  if (!res.ok) {
    problems.push(`image ${res.status} : ${url} (${w})`);
    return;
  }
  const ext = extFor(res.headers.get('content-type') ?? '');
  const name = `/_img/${createHash('sha1').update(key).digest('hex').slice(0, 12)}.${ext}`;
  await write(name, Buffer.from(await res.arrayBuffer()));
  images.set(key, name);
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

const pageFile = (path) => (path === '/' ? 'index.html' : `${path.replace(/^\/+|\/+$/g, '')}.html`);

/**
 * Parcourt le flux de données React (texte décodé) ligne par ligne et applique `rewrite` au texte
 * de chaque ligne ; l'en-tête des lignes de texte (`id:T<longueur en octets hexadécimale>,`) est
 * recalculé. Les lignes binaires sont recopiées telles quelles.
 */
const mapFlight = (stream, rewrite) => {
  const bytes = Buffer.from(stream, 'utf8');
  const out = [];
  let i = 0;
  while (i < bytes.length) {
    const colon = bytes.indexOf(0x3a, i);
    if (colon < 0 || colon + 1 >= bytes.length) {
      out.push(Buffer.from(rewrite(bytes.subarray(i).toString('utf8'))));
      break;
    }
    const head = bytes.subarray(i, colon + 1).toString('latin1');
    const tag = String.fromCharCode(bytes[colon + 1]);
    if (LENGTH_TAGS.has(tag)) {
      const comma = bytes.indexOf(0x2c, colon + 2);
      const hex = comma < 0 ? '' : bytes.subarray(colon + 2, comma).toString('latin1');
      if (/^[0-9a-f]+$/.test(hex)) {
        const end = comma + 1 + parseInt(hex, 16);
        if (tag === 'T') {
          const text = Buffer.from(rewrite(bytes.subarray(comma + 1, end).toString('utf8')));
          out.push(Buffer.from(`${head}T${text.length.toString(16)},`), text);
        } else {
          out.push(bytes.subarray(i, end));
        }
        i = end;
        continue;
      }
    }
    const newline = bytes.indexOf(0x0a, colon + 1);
    const end = newline < 0 ? bytes.length : newline + 1;
    out.push(
      Buffer.from(head),
      Buffer.from(rewrite(bytes.subarray(colon + 1, end).toString('utf8'))),
    );
    i = end;
  }
  return Buffer.concat(out).toString('utf8');
};

/** Texte d'un script de flux : JSON sûr dans une balise <script> (comme Next.js). */
const scriptJson = (value) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

const processPage = async (path, original) => {
  // Flux de données : tous les morceaux de type 1, dans l'ordre.
  const scripts = [...original.matchAll(FLIGHT)].map((match) => ({
    text: match[0],
    value: JSON.parse(match[1]),
  }));
  const dataScripts = scripts.filter((script) => script.value[0] === 1);
  const stream = dataScripts.map((script) => script.value[1]).join('');
  if (mapFlight(stream, (text) => text) !== stream) {
    throw new Error(`Flux de données illisible (analyse non réversible) : ${path}`);
  }

  // Images optimisées citées par la page (attributs HTML et flux), téléchargées avant réécriture.
  for (const match of `${original}\n${stream}`.matchAll(IMAGE)) {
    await fetchImage(decodeURIComponent(match[1]), match[2], match[3]);
  }
  // Fichiers servis tels quels (médias bruts, icônes, vignettes).
  const rawRefs = new Set(
    [
      ...`${original}\n${stream}`.matchAll(
        /["'(](\/(?:api\/media\/file\/[^"'\\\s)?&#]+|[^"'\\\s)?&#]+\.(?:svg|png|ico|jpg|jpeg|webp|avif|webmanifest)))/g,
      ),
    ]
      .map((m) => m[1])
      .filter((ref) => !/^\/(_next|_img|fonts)\//.test(ref)),
  );
  for (const ref of rawRefs) await fetchRaw(decodeURI(ref));

  // Page équivalente dans l'autre langue (liens `alternate`), pour la bascule de langue.
  const switches = ['fr', 'en'].flatMap((lang) => {
    const alt = original.match(new RegExp(`rel="alternate" hrefLang="${lang}" href="([^"]+)"`));
    return alt ? [[`/api/locale-switch?to=${lang}`, new URL(alt[1], BASE).pathname]] : [];
  });

  const rewrite = (text) => {
    let result = text.replace(IMAGE, (whole, rawUrl, w, q) => {
      return images.get(`${decodeURIComponent(rawUrl)}|${w}|${q}`) ?? whole;
    });
    result = result
      .split(encodeURIComponent(BASE))
      .join(encodeURIComponent(ORIGIN))
      .split(BASE)
      .join(ORIGIN);
    for (const [from, to] of switches) result = result.split(from).join(to);
    return result;
  };

  // Réécriture : flux (longueurs recalculées) fusionné en un seul morceau, puis le reste du HTML.
  const merged = `<script>self.__next_f.push(${scriptJson([1, mapFlight(stream, rewrite)])})</script>`;
  let html = original;
  let placed = false;
  for (const script of dataScripts) {
    html = html.replace(script.text, placed ? '' : '<!--FLUX-->');
    placed = true;
  }
  html = rewrite(html).replace('<!--FLUX-->', () => merged);
  if (!/<meta name="robots"/.test(html)) {
    html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow"/></head>');
  }
  html = html.replace('</body>', () => `${DEMO_SCRIPT}</body>`);

  const links = [...original.matchAll(/href="(\/[^"#]*)"/g)]
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
  const { html, links } = await processPage(path, await res.text());
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
  await write('404.html', (await processPage('/404', await missing.text())).html);

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
  console.log(
    `${pages.size} pages, ${images.size} images optimisées, ${(bytes / 1048576).toFixed(1)} Mo`,
  );
  if (problems.length > 0)
    console.log(`À vérifier (${problems.length}) :\n- ${problems.join('\n- ')}`);
};

await run();
