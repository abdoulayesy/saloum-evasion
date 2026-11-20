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

## Tunnel de réservation et de paiement (si la PR y touche)

- [ ] **Parité des moyens** : Wave, Orange Money et carte au même rang, même taille et même ordre
      sur le panier, l'étape paiement, la page de reprise et les messages d'échec. (VI, FR-013)
- [ ] **Conditions d'annulation** : celles de chaque prestation sont affichées et acceptées
      explicitement avant le bouton « Payer » ; le montant remboursable est montré avant toute
      demande d'annulation. (V, FR-014, FR-027)
- [ ] **Aucune donnée de carte** : aucun champ de carte sur le site, aucun numéro, cryptogramme ou
      date d'expiration dans les journaux, les notifications ou les paramètres d'URL (la carte se
      saisit sur la page hébergée de l'agrégateur). (IX, research R16)
- [ ] **Montants** : calculés côté serveur depuis la réservation figée, en XOF entiers ; jamais lus
      depuis le formulaire ou l'URL. (IX)
- [ ] **Modèles WhatsApp** : tout modèle nouveau ou modifié figure dans
      [docs/whatsapp-templates.md](../docs/whatsapp-templates.md) et y est marqué « approuvé » en
      FR et en EN avant la mise en production. (FR-023)

## Contrôles automatiques

Typecheck, lint, tests unitaires, budgets JavaScript, Playwright mobile + axe, SEO sans JS,
Lighthouse CI et contrôle SEO s'exécutent dans le job `Qualité, tests, budgets`.
