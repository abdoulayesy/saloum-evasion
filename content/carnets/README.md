# Brouillons des Carnets du Saloum

Un fichier par guide et par langue : `fr/{slug-fr}.md` et `en/{slug-en}.md`. Les deux versions d'un
même guide partagent la clé `key`. `pnpm seed:guides` les importe dans le CMS **comme brouillons** ;
aucun script ne publie un guide en production : la relecture, la signature et la publication se font
dans l'admin par un membre de l'équipe (spec FR-021).

## Format

```markdown
---
key: que-faire              # identifiant commun FR/EN (obligatoire, stable)
slug: que-faire-au-sine-saloum
title: Que faire au Sine-Saloum
standfirst: Chapeau de 140 à 300 caractères…
targetKeyword: que faire au Sine-Saloum
metaTitle: Que faire au Sine-Saloum : 10 idées | Saloum Évasion   # ≤ 60 caractères
metaDescription: …                                                # ≤ 155 caractères
theme: que-faire            # preparer | que-faire | culture-nature
author: aissatou-diop       # slug du membre de l'équipe pressenti
reviewer: ibrahima-ndiaye   # facultatif
requiresCommunityReview: false
related:                    # slugs FR des offres et destinations liées, dans l'ordre
  stays: [week-end-bolong-ndangane]
  experiences: [excursion-pirogue-bolongs]
  accommodations: []
  destinations: [ndangane, mar-lodj]
---

Introduction (paragraphes Markdown).

## Premier intertitre

Texte, listes, liens.

:::encadre info Titre de l'encadré
Texte court de l'encadré (une information pratique datée : « tarif constaté en novembre 2026 »).
:::

### Sous-intertitre
```

- Titres : `##` (H2, entrées de la table des matières) et `###` (H3) seulement ; jamais `#`.
- Encadré : `:::encadre info|attention Titre`, une ligne de texte ou plus, puis `:::`.
- Les champs d'en-tête `related` et `faq` ne sont lus que dans la version française.
- Toute information chiffrée qui change (tarif, horaire, marée) est datée dans le texte.
- Pas d'image dans les brouillons : l'équipe ajoute ses photos réelles dans l'admin.
