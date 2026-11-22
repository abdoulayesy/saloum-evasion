# Démonstration statique (branche `demo`, jamais fusionnée dans `main`)

Instantané figé du site pour une présentation client, publiable sur n'importe quel hébergeur de
fichiers (Cloudflare Pages, Netlify, Vercel). Le vrai site (panier, paiement, demandes,
administration) exige un serveur Node et une base PostgreSQL : il n'est pas concerné.

## Produire l'instantané

```sh
pnpm build
pnpm exec next start -p 3000        # autre terminal : le site doit répondre sur /fr
OUT=/chemin/static-demo ORIGIN=https://saloum-evasion-site.pages.dev node scripts/export-static-demo.mjs
```

Le script explore le site (sitemap et liens), enregistre chaque page en `.html` (URL propres),
les images déjà optimisées (`/_img/…`), les fichiers de `public/` et `.next/static`, puis écrit
`_headers`, `_redirects`, `robots.txt` et `404.html`.

## Ce qui change dans l'instantané

- Non indexé : `robots.txt`, en-tête `X-Robots-Tag` et balise `robots`.
- Formulaires qui exigent un serveur (panier, paiement, demande) : un message de démonstration
  s'affiche à la place de l'envoi. La recherche de l'accueil et le total du composer fonctionnent.
- Bascule de langue : lien direct vers la page équivalente.
- Adresse du site (canonique, hreflang) : `ORIGIN`.

## Publier

```sh
npx wrangler pages deploy /chemin/static-demo --project-name saloum-evasion-site   # Cloudflare
npx netlify deploy --dir /chemin/static-demo --prod                                # Netlify
npx vercel deploy /chemin/static-demo --prod                                       # Vercel
```

## Droits des photos

`public/activites illustration/` n'est jamais copié. Les images de l'instantané sont des versions
optimisées des photos du seed, dont les droits restent à confirmer : à n'utiliser que pour une
présentation privée.
