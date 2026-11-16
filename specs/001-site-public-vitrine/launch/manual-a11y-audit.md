# Audit manuel au lecteur d'écran (T174, perf-a11y CHK052)

Les tests automatisés (axe, clavier, cibles tactiles, zoom 200 %) ne remplacent pas un essai
réel. Avant le lancement, une personne déroule ce protocole sur deux téléphones et consigne le
résultat en bas de page.

## Matériel

- **Android** milieu de gamme, Chrome à jour, **TalkBack** activé (Paramètres → Accessibilité).
- **iPhone** (iOS 16 ou plus), Safari, **VoiceOver** activé (Réglages → Accessibilité).
- Connexion 4G réelle. Taille du texte du téléphone réglée au maximum pour une seconde passe.

## Gestes utiles

| Action | TalkBack | VoiceOver |
|---|---|---|
| Élément suivant / précédent | balayer à droite / à gauche | balayer à droite / à gauche |
| Activer | toucher deux fois | toucher deux fois |
| Parcourir par titres | menu de lecture → Titres | rotor → En-têtes |
| Parcourir par liens / champs | menu de lecture → Liens / Commandes | rotor → Liens / Champs |

## Parcours à dérouler (en FR puis en EN)

Pour chaque étape, noter : l'annonce est-elle compréhensible ? le focus va-t-il au bon endroit ?
rien n'est-il masqué par la barre collante ?

1. **US1 — Demande de séjour** : accueil → « Trouver mon séjour » → choisir des dates → liste
   des séjours → une fiche → « Demander ce séjour » → remplir le formulaire → provoquer une
   erreur (envoyer sans prénom) : le résumé d'erreurs est-il annoncé, le focus va-t-il sur le
   champ ? → corriger et envoyer : la confirmation et la référence sont-elles annoncées ?
2. **US2 — Fiche expérience** : arriver directement sur une fiche expérience → lire l'essentiel
   (durée, prix, départ) → « Ajouter à ma demande » : l'ajout est-il annoncé ? → ouvrir le
   compteur de l'en-tête.
3. **US3 — Filtres** (liste des séjours) : ouvrir « Filtrer » : le panneau est-il annoncé comme
   une boîte de dialogue, le focus y entre-t-il ? → choisir un filtre, « Voir N séjours » : le
   nombre de résultats est-il annoncé ? → fermer : le focus revient-il sur « Filtrer » ?
4. **US4 — WhatsApp** : depuis trois pages différentes, trouver le lien WhatsApp (barre
   collante, menu, pied de page) ; l'intitulé indique-t-il qu'on écrit à un hôte ?
5. **US5 — Langue** : depuis une fiche, changer de langue (en-tête, puis menu) : la page anglaise
   équivalente s'ouvre-t-elle, et la langue de lecture change-t-elle (voix anglaise) ?
6. **Film** : lire la vidéo au lecteur d'écran, activer les sous-titres, choisir un chapitre ;
   trouver la transcription descriptive.
7. **Galerie** : boutons « Photo précédente / suivante » et position annoncée.

## Résultat

| Date | Personne | Appareil | Parcours | Anomalie | Gravité | Correction |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

Toute anomalie qui empêche de terminer un parcours est **bloquante** pour le lancement.
