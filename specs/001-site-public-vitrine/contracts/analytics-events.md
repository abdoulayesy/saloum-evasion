# Contrat — Mesure d'audience (Plausible, sans cookie)

Script Plausible chargé en `requestIdleCallback` (repli : `load` + 2 s). Les évènements
envoyés avant son chargement sont mis en file (`window.plausible.q`). **Aucune donnée
personnelle** dans les propriétés (pas de nom, de téléphone ni de texte libre).

| Évènement | Déclencheur | Propriétés |
|---|---|---|
| *(pageview)* | chaque navigation | automatique ; `locale` |
| `whatsapp_click` | clic sur tout lien `wa.me` | `placement` (`sticky_bar`\|`header`\|`footer`\|`menu`\|`confirmation`\|`page`), `pageType` |
| `request_item_added` | ajout à la demande en cours | `kind`, `pageType` |
| `request_form_view` | affichage du formulaire | `itemsCount` |
| `request_submitted` | résultat `ok` de la Server Action | `itemsCount`, `locale`, `sourcePageType`, `durationBucket` (`<60s`\|`60-120s`\|`>120s`, temps depuis l'affichage du formulaire) |
| `request_failed` | `invalid` / `rate_limited` / `error` | `reason` |
| `video_play` | premier clic sur lecture | `video` (`film`\|`vertical`), `pageType` |
| `video_chapter` | choix d'un chapitre | `chapter` (index) |
| `filter_applied` | validation du panneau de filtres | `filters` (ex. `duree,envie`) |
| `language_switch` | sélecteur de langue | `from`, `to`, `fallback` (`true` si page parente) |
| `web_vital` | bibliothèque web-vitals (LCP, INP, CLS) | `metric`, `rating` (`good`\|`needs-improvement`\|`poor`), `bucket`, `route` (modèle, ex. `/[locale]/sejours/[slug]`) |

**Indicateurs dérivés** (tableau de bord Plausible, objectifs configurés au lancement) :

- **Taux de demande** = (`request_submitted` + `whatsapp_click`) / visites uniques, par page
  d'entrée et par `locale` (SC-004).
- **Demandes en moins de 2 minutes** = part de `request_submitted` avec `durationBucket`
  `<60s` ou `60-120s` (suivi terrain de SC-003).
- **Part de CWV « bons »** par modèle de route (complément à CrUX et Search Console, SC-002).
