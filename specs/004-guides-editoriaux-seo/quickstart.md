# Quickstart — 004 Carnets du Saloum

**Prérequis** : le socle de la 001 fonctionne en local (voir
[quickstart 001](../001-site-public-vitrine/quickstart.md)) : `pnpm seed` déjà lancé.
Aucune variable d'environnement nouvelle pour le site ; `SEED_GUIDES_DEMO_PUBLISH` ne sert qu'aux
tests.

## 1. Données

```sh
pnpm migrate               # collections guides et guideThemes, champs ajoutés à teamMembers
pnpm seed:guides           # 3 thèmes, slug/lieu/présentation des membres de démonstration,
                           # brouillons des 7 guides depuis content/carnets/{fr,en}/*.md (jamais publiés)
pnpm cms:experiences-hub   # CMS existant : hub des expériences recentré sur « activités »
```

Tests et Lighthouse CI seulement (refusé en production) : `SEED_GUIDES_DEMO_PUBLISH=1 pnpm
seed:guides` publie deux guides de démonstration (`guide-de-demonstration` en FR et EN,
`guide-de-demonstration-francais` en FR seul) avec une photo du seed marquée « Démonstration ».
PowerShell : `$env:SEED_GUIDES_DEMO_PUBLISH='1'; pnpm seed:guides`.

Le seed ne modifie jamais un guide existant (repéré par son slug français) : relancer la commande
après une modification d'un brouillon Markdown n'a d'effet que sur les guides absents du CMS.

## 2. Publier un guide dans l'admin

1. `http://localhost:3000/admin/collections/guides` → ouvrir un brouillon (ex. « Que faire au
   Sine-Saloum »). L'encadré « Points à vérifier » (liens, longueur du texte et du chapeau) ne
   bloque jamais la publication.
2. Supprimer l'encadré « Brouillon de démonstration » du texte, remplacer chaque « à vérifier »
   par une information datée et confirmée.
3. Choisir l'auteur (membre avec photo, adresse de page `slug`, lieu et présentation), le
   relecteur, l'image principale (photo réelle : texte alternatif FR/EN et provenance), au moins
   deux offres ou destinations. La requête cible est dans l'onglet SEO (`seo.targetKeyword`).
4. « Publier » : chaque manque bloquant est listé (auteur sans photo, image sans texte alternatif,
   requête cible absente, relecteur obligatoire pour « La culture sérère »…).
5. Passer en anglais, compléter titre, chapeau, texte, SEO et requête cible : la version anglaise
   n'est publiée que si elle est complète.
6. Retirer `pendingPublication` de l'entrée du guide dans `src/lib/seo/keywords.ts`.

Bouton « Aperçu » : comme pour les contenus de la 001, il ouvre la page publique (version
publiée) ; un brouillon jamais publié n'a pas encore de page.

## 3. Vérifier en mobile 360 × 800

- `/fr/carnets-du-saloum` et `/en/saloum-travel-guides` : guides regroupés par thème ; entrée
  « Carnets du Saloum » dans le menu et le pied de page.
- Un guide : signature (photo, nom lié à la page d'auteur, rôle, lieu, relu par, mis à jour le,
  temps de lecture), table des matières (3 intertitres ou plus) qui mène aux sections sans les
  masquer sous l'en-tête, cartes des offres en FCFA, présentation de l'auteur, WhatsApp.
- Une fiche liée (séjour, expérience, hébergement, destination) : encart « À lire dans les Carnets
  du Saloum » (3 guides au plus).
- `/fr/equipe/{slug}` : page d'auteur avec la liste de ses guides ; « À propos » y renvoie.
- Coquille corrigée → date inchangée ; « Mise à jour importante » cochée → date du jour.
- Slug d'un guide ou d'un auteur modifié → l'ancienne adresse redirige (301).

## 4. Tests

```sh
pnpm test                                            # toc, temps de lecture, dates, garde-fous,
                                                     # encart, registre, JSON-LD, sitemap, mesure
pnpm e2e --grep @guides                              # 360 px : guide, encart, rubrique, admin, axe
pnpm e2e:nojs --grep @guides                         # contenu, signature et JSON-LD sans JavaScript
pnpm seo:check                                       # serveur démarré : une requête = une page,
                                                     # guides en brouillon signalés (avertissement)
pnpm lhci                                            # rubrique, guide de démonstration, page d'auteur
pnpm bundles                                         # aucune route au-delà de 150 Ko
```

Base locale déjà remplie avant la 004 : après `pnpm seed:guides`, lancer `pnpm cache:clear`
avant `pnpm build` (le cache de données de Next survit aux builds).

## 5. Avant publication réelle

- Fiches de questions envoyées à l'équipe (`content/questions.md`), réponses intégrées aux
  brouillons, informations chiffrées datées et vérifiées.
- Photos réelles du Saloum, droits confirmés, provenance saisie.
- Relecture par un membre de la communauté pour « La culture sérère ».
- Registre des traitements : entrée « Pages d'auteur de l'équipe » appliquée au CMS existant
  (`pnpm cms:privacy-register`, script de la 002 phase 8).
- Mesure : objectifs Plausible et relevé mensuel Search Console selon
  [docs/analytics-carnets.md](../../docs/analytics-carnets.md).
