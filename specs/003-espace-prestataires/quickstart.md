# Quickstart: Espace prestataires et disponibilités

**Feature**: `003-espace-prestataires` | **Plan**: [plan.md](./plan.md)

Prérequis : l'environnement de la 002 fonctionne (`pnpm dev`, base Postgres, passerelle `fake`,
`pnpm jobs:dev`). Aucune nouvelle variable obligatoire.

## 1. Données de démonstration

```bash
pnpm migrate
pnpm seed                 # catalogue 001
pnpm seed:checkout        # offres vendables 002
pnpm seed:partners        # 003 : personnes rattachées, unités louables, semaines types,
                          # composants des séjours, une mise en avant payée
```

Le script affiche les numéros de démonstration (ex. `+221770000101` pour l'écolodge).

## 2. Se connecter à l'espace

1. Ouvrir `http://localhost:3000/espace` (largeur 360 px dans les outils du navigateur).
2. Saisir un numéro de démonstration, « Recevoir mon code ».
3. Sans `WHATSAPP_CLOUD_TOKEN`, le code est écrit dans la boîte d'envoi de test
   (`EMAIL_OUTBOX_DIR`, fichier `whatsapp-*.json`) ou dans la console du serveur.
4. Saisir le code : l'accueil affiche « Aujourd'hui », « Demain » et les quatre tuiles.

Repli : dans l'admin, fiche de la personne → « Créer un lien de connexion » (15 min).

## 3. Fermer une date et vérifier le site public

1. Espace → Calendrier → l'écolodge → « Bungalow 1 » → toucher deux nuits → « Fermer ».
2. Ouvrir la fiche de l'écolodge sur le site public, formulaire « Ajouter au panier » : ces
   nuits ne sont plus proposées si **tous** les bungalows sont fermés (sinon une autre unité est
   attribuée).
3. Pour une expérience : passer un créneau de 4 à 1 place ; le formulaire public n'en propose
   plus qu'une (le cache de l'API est de 30 s).

## 4. Réservation instantanée

1. Composer un panier avec le créneau à 1 place et payer avec la passerelle `fake` (« Réussir »).
2. La réservation est **confirmée** automatiquement ; la boîte d'envoi contient
   `partner_booking_new` pour le prestataire ; l'espace l'affiche dans « Réservations ».
3. Un second panier sur le même créneau est refusé avant le paiement.

## 5. Synchronisation iCal

1. Copier le lien d'export depuis Espace → Calendrier → unité → Synchronisation, l'ouvrir : un
   `.ics` avec les nuits réservées, sans aucun nom.
2. Ajouter comme calendrier externe `http://localhost:3000/dev/ical-sample.ics` (flux de
   démonstration, servi hors production seulement ; l'exigence `https` est levée en
   développement).
3. `pnpm jobs:dev` relit le flux sous 15 min (ou déclencher `/api/jobs/run`) : les nuits du flux
   apparaissent « Airbnb » dans l'espace et fermées sur le site.

## 6. Prix et mise en avant

1. Espace → Mes prix → demander un nouveau tarif haute saison : « En attente de validation ».
2. Admin → Ventes → Demandes de prix → Valider : le prix change sur la fiche ; message
   `partner_price_decision` dans la boîte d'envoi.
3. Ouvrir la page de l'univers « Table du Saloum » : carte « Partenaire mis en avant » en tête,
   lien `rel="sponsored"` ; Espace (restaurant) → Mise en avant : compteurs de la semaine.

## 7. Tests

```bash
pnpm test                          # dont src/lib/availability, src/lib/ical, sponsored
pnpm e2e --grep "@partner|@availability|@sponsored"
pnpm lhci                          # pages publiques inchangées, /espace sans assertion SEO
```
