## Ce que change cette PR

<!-- En une ou deux phrases. Lien vers la tâche (specs/…/tasks.md, Txxx). -->

## Captures à 360 px

<!-- Au moins une capture mobile (360 × 800) de chaque écran modifié. -->

## Points de la constitution non vérifiables automatiquement

- [ ] **Médias authentiques** : toute nouvelle photo ou vidéo est réelle, montre un lieu ou une
      prestation proposée, et sa provenance (auteur, lieu, date) est renseignée. (V)
- [ ] **Coordonnées (NAP)** : nom, adresse et téléphone viennent uniquement des réglages du site,
      sans copie en dur. (III)
- [ ] **Conditions d'annulation** visibles avant toute étape de paiement ou de demande. (V)
- [ ] **Parité des paiements** : Wave, Orange Money et carte bancaire au même rang partout où
      les moyens de paiement apparaissent. (VI)
- [ ] **Formulaires** : chaque nouveau champ a le bon type de clavier (`type`, `inputmode`), un
      `autocomplete`, et aucun champ n'est superflu. (I)
- [ ] **Survol** : aucune fonction ne dépend du survol. (I)
- [ ] **Textes** : FR et EN fournis pour tout nouveau texte visible.

## Contrôles automatiques

Typecheck, lint, tests unitaires, budgets JavaScript, Playwright mobile + axe, SEO sans JS,
Lighthouse CI et contrôle SEO s'exécutent dans le job `Qualité, tests, budgets`.
