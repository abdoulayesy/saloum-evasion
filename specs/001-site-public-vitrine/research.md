# Research — 001 Site public Saloum Évasion

**Date** : 2026-11-14 · **Entrée** : [spec.md](./spec.md), [constitution v1.0.0](../../.specify/memory/constitution.md), stack imposée par le propriétaire.

> La séance `/speckit-clarify` a été interrompue après la question 1 (sans réponse). Les
> décisions marquées **[défaut — à confirmer]** reprennent les recommandations de clarification ;
> les modifier plus tard implique une reprise ciblée (indiquée pour chacune).

---

## R1. Stratégie d'URL et de langues **[défaut — à confirmer]**

- **Décision** : slugs traduits par langue (`/fr/sejours/week-end-bolong` ↔
  `/en/stays/bolong-weekend`) ; `/` → redirection **301 fixe** vers `/fr` (aucune détection de
  langue) ; `x-default` = version `/fr` de chaque page ; bandeau discret « English version » pour
  les navigateurs anglophones, sans redirection. Segments de collection traduits aussi
  (`sejours`/`stays`, `hebergements`/`accommodation`).
- **Justification** : chaque langue cible ses propres requêtes ; une redirection dépendant de
  `Accept-Language` sert un contenu différent à Googlebot (qui crawle sans en-tête de langue) et
  rend `/` non cacheable au CDN.
- **Alternatives** : redirection selon la langue du navigateur (rejetée : SEO + cache) ; page de
  choix de langue (rejetée : un écran de plus sur mobile, page sans contenu) ; slugs identiques
  (rejetée : perd les mots-clés anglais).
- **Reprise si changé** : `src/i18n/routing.ts`, contrat [routes.md](./contracts/routes.md).

## R2. Modèle de prix **[défaut — à confirmer]**

- **Décision** : tous les montants en **XOF entiers**. Séjour : prix par personne en basse et
  haute saison, sur une base de 2 adultes partageant l'hébergement ; affichage « à partir de » =
  minimum des deux. Expérience : prix par personne + nombre minimum de participants.
  Hébergement : prix par nuit et par unité « à partir de ». Les saisons sont des plages de dates
  globales (réglage du site). Prix exact = devis de l'équipe.
- **Conversion EUR** : parité fixe **1 € = 655,957 XOF**, arrondi à l'euro supérieur, libellé
  « ≈ … € (indicatif) ». Aucune API de change.
- **Alternatives** : prix par groupe (rejeté : peu lisible face aux comparateurs) ; prix exact
  par date (impossible sans calendrier temps réel, hors périmètre).
- **Reprise si changé** : `src/lib/pricing.ts`, champs `pricing` du [data-model](./data-model.md).

## R3. Notification des demandes — **tension spec ↔ stack**

- **Constat** : la spec suppose une notification de l'équipe « par e-mail et WhatsApp ». La stack
  ne prévoit que Resend + lien `wa.me`. Une notification WhatsApp *sortante* vers l'équipe exige
  l'API WhatsApp Business (compte Meta vérifié, modèles approuvés, prestataire) : un service et
  un processus en plus, contraire à VIII pour un MVP.
- **Décision** : (1) e-mail transactionnel (Resend) à l'adresse de l'équipe, avec la demande
  complète ; (2) enregistrement dans la collection `requests` (liste consultable dans l'admin) ;
  (3) l'écran de confirmation propose au visiteur un bouton « Envoyer aussi sur WhatsApp »
  (`wa.me` pré-rempli avec le n° de demande et son récapitulatif), ce qui fait arriver un
  WhatsApp chez l'équipe sans API.
- **Action** : amender l'hypothèse « Notification équipe » de la spec (voir plan, Tensions T1).
- **Champs obligatoires** : prénom, n° WhatsApp (format E.164), date d'arrivée, nombre d'adultes,
  consentement. Facultatifs : éléments choisis, date de départ, enfants, envies, budget, e-mail,
  message.
- **Délai affiché** : « Réponse sous 24 h, souvent dans l'heure », valeur éditable (réglages).

## R4. Vidéo

- **Décision** : **Mux** (HLS adaptatif, image d'affiche et miniatures par URL, pistes WebVTT,
  région de diffusion mondiale). Lecteur maison léger : `<video>` natif + affiche statique
  (`next/image`) ; au clic, `import()` dynamique de **hls.js** (sauf Safari/iOS : HLS natif).
  **Pas de Mux Player** (trop lourd pour le budget de 150 Ko, même chargé tard).
- **Mobile** : aucun octet vidéo avant le clic (pas d'attribut `src`, `preload="none"`, pas de
  préconnexion à `stream.mux.com`). **Ordinateur** : boucle muette ≤ 8 s, rendu MP4 basse
  définition ≤ 1,5 Mo, démarrée seulement si `(min-width: 1024px) and (pointer: fine)` **et** ni
  `prefers-reduced-motion: reduce` ni `Save-Data` (`navigator.connection.saveData` ou indice
  client `Sec-CH-Save-Data`), et après l'évènement `load`. L'image LCP reste l'affiche.
- **Formats** : film principal 3 à 6 min en chapitres (champ `chapters` : titre FR/EN +
  horodatage) ; vidéos verticales de 15 s (9:16). Sous-titres FR et EN obligatoires.
- **Alternative** : Cloudflare Stream (équivalent ; écarté pour l'API de miniatures et
  d'affiches moins pratique) ; fichiers auto-hébergés (écartés : pas d'ABR sans chaîne d'encodage).

## R5. Mesure d'audience et consentement

- **Décision** : **Plausible** (sans cookie, hébergé dans l'UE), script chargé en `idle` (moins
  de 2 Ko). **GA4 écarté** (cookies + bandeau + poids JS, contraire à II et IX). Comme aucun
  traceur non essentiel n'est déposé, **aucun bandeau de consentement n'est affiché**. Une page
  Confidentialité explique la mesure ; la « demande en cours » stockée sur l'appareil est
  strictement nécessaire au service demandé, donc exemptée de consentement. Tout futur traceur
  non essentiel exigera un bandeau (principe IX).
- **Évènements** : voir [analytics-events.md](./contracts/analytics-events.md)
  (`whatsapp_click`, `request_item_added`, `request_submitted`, `video_play`, `video_chapter`,
  `filter_applied`, `language_switch`, `web_vital`).
- **RUM** : bibliothèque `web-vitals` (environ 2 Ko), envoi de LCP/INP/CLS comme évènement
  Plausible `web_vital` (propriétés : métrique, note, tranche de valeur, modèle de route).
  Search Console pour l'indexation et le CrUX.

## R6. Hébergement et latence depuis Dakar

- **Décision** : Vercel (région de calcul `cdg1`, Paris, proche de la base). Les pages publiques
  sont statiques ou ISR, donc servies depuis le cache du CDN. Base **PostgreSQL managée en
  Europe de l'Ouest** (Neon ou Supabase, Paris/Francfort) avec pooling de connexions. Médias :
  stockage objet compatible S3 (Vercel Blob ou Cloudflare R2) via l'adaptateur de stockage de
  Payload.
- **Risque** : la présence d'un point de présence CDN à Dakar n'est **pas vérifiée**. Une tâche
  de mesure (TTFB et LCP depuis un mobile 4G à Dakar et Ndangane) est un **prérequis au
  lancement**. Si le TTFB p75 dépasse 600 ms : placer un CDN disposant d'un point de présence
  ouest-africain devant l'hébergeur (Cloudflare annonce un PoP à Dakar, à vérifier aussi).

## R7. Limitation de débit et anti-spam

- **Décision** : champ piège (honeypot) + délai minimal de remplissage (≥ 3 s) + limite de
  **5 demandes par heure par IP hachée** (SHA-256 salé), stockée dans une table Postgres
  `rate_limits` purgée à 24 h. Pas de Redis (VIII : aucun service supplémentaire). Pas de CAPTCHA
  visuel (le spec interdit une épreuve pénible). Idempotence : clé `submissionId` (UUID généré
  par le client) unique, ce qui évite les doublons au double tap.

## R8. Rendu et régénération

- **Décision** : Next.js 15 (App Router) + **Payload 3** dans la même application.
  `generateStaticParams` pour toutes les fiches et les deux langues ; `revalidate = false` ; un
  hook Payload `afterChange`/`afterDelete` appelle `revalidateTag` (tags par document, par
  collection, `sitemap`, `nav`). Ainsi une publication met à jour la fiche, les listes, les
  destinations liées et le sitemap en quelques secondes.
- **Composants client** limités à : galerie, panneau de filtres, sélecteur de dates, lecteur
  vidéo, « demande en cours » (compteur + ajout), menu plein écran, sélecteur de langue. Tous
  chargés à la demande sauf le compteur de demande (moins de 3 Ko).
- **Formulaire sans JavaScript** : la Server Action fonctionne en amélioration progressive
  (envoi classique) ; l'élément choisi passe par un paramètre (`?sejour=<id>`) quand le stockage
  local n'est pas disponible.

## R9. Polices et jetons de design

- **Décision** : `next/font/google` (téléchargées au build, **auto-hébergées**) : Cormorant
  Garamond (500, 600 ; italique 500), Manrope (variable 400 à 700) ; sous-ensemble `latin` ;
  `display: swap` ; `adjustFontFallback` pour limiter le CLS. 2 familles = conforme à II.
- **Contrastes vérifiés** (WCAG 2.2) : vert #0F2A24 sur sable #F4EEE3 = **13,2:1** ; ocre
  #9E4521 sur sable = **5,5:1** ; blanc sur ocre = **6,3:1** ; sable sur vert = **13,2:1**.
  Tous ≥ 4,5:1. L'ocre ne doit pas être éclairci pour du texte.

## R10. Avis clients

- **Décision** : **aucun avis ni `AggregateRating` au lancement** (la spec et le principe V
  exigent des avis de voyageurs ayant séjourné, ce qui n'est pas vérifiable sans réservations).
  Les avis Google Business Profile ne sont **pas** recopiés sur le site (pas de balisage
  auto-attribué). Le modèle de données réserve une collection `reviews` pour une fonctionnalité
  ultérieure, non implémentée.

## R11. Contenu retiré **[défaut — à confirmer]**

- **Décision** : à la dépublication, l'éditeur choisit une **cible de remplacement** (séjour
  proche) ; à défaut, 301 vers la liste parente (catégorie ou univers). La règle est enregistrée
  automatiquement dans la collection `redirects`. Changement de slug : 301 automatique ancien →
  nouveau. Les chaînes de redirection sont aplaties (au plus 1 saut).

## R12. Quatrième univers de l'accueil **[défaut — à confirmer]**

- **Décision** : collection `universes` à **4 entrées**, dont 3 univers d'expériences et
  « Séjours & hébergements » (`kind: 'stay'`), qui pointe vers les hébergements. Seuls les
  univers `kind: 'experience'` ont une page `/experiences/<univers>`.

## R13. Validation SEO automatisée

- **Décision** : tests Playwright sur le HTML **sans JavaScript** (`javaScriptEnabled: false`)
  pour chaque type de page ; tests Vitest des générateurs de métadonnées et de JSON-LD (types
  `schema-dts` + validation de schéma) ; script CI qui crawle le build (`linkinator`) pour les
  liens cassés et vérifie hreflang réciproques, unicité des titles/descriptions et longueurs.
  Validation Rich Results : contrôle manuel avant lancement (pas d'API publique stable).
