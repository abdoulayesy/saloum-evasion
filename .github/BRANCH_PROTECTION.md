# Protection de la branche `main`

La constitution (VII) exige que Lighthouse CI et axe **bloquent la fusion** quand un budget est
dépassé. Ce blocage se règle dans GitHub ; il est à activer par le propriétaire du dépôt.

## Réglages à activer

GitHub → _Settings_ → _Branches_ → _Add branch ruleset_ (ou _Branch protection rule_) sur `main` :

- [ ] Exiger une pull request avant la fusion (au moins 1 relecture).
- [ ] Exiger que les contrôles de statut passent avant la fusion, avec la branche à jour.
- [ ] Contrôle obligatoire : **`Qualité, tests, budgets`** (job `quality` du workflow `CI`).
      Ce job échoue si l'une des étapes échoue : typecheck, lint, tests unitaires, build, budgets
      JavaScript, tests de bout en bout mobiles + axe, tests SEO sans JavaScript, Lighthouse CI,
      contrôle SEO.
- [ ] Interdire les poussées forcées et la suppression de la branche.
- [ ] Appliquer aussi les règles aux administrateurs.

## Dérogations

Une dérogation à un budget ne se fait jamais en désactivant un contrôle : elle est écrite dans le
plan concerné (section _Complexity Tracking_) et validée par le propriétaire (constitution,
Gouvernance).
