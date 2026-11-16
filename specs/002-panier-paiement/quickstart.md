# Quickstart: Panier unique et paiement en ligne

**Prérequis** : le socle et le CMS de la 001 fonctionnent localement (voir
[quickstart 001](../001-site-public-vitrine/quickstart.md)) : Node ≥ 22.12, pnpm via corepack,
Postgres (`docker compose up -d`).

## 1. Variables d'environnement (ajouts à `.env`)

```dotenv
PAYMENT_GATEWAY=fake                 # fake | <id de l'agrégateur retenu>
FAKE_GATEWAY_SECRET=dev-secret-change-me
PAYMENT_GATEWAY_API_KEY=             # production / préproduction seulement
PAYMENT_GATEWAY_WEBHOOK_SECRET=
WHATSAPP_CLOUD_TOKEN=                # vide en local : les envois WhatsApp sont journalisés, pas envoyés
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_APP_SECRET=
WHATSAPP_VERIFY_TOKEN=
CRON_SECRET=dev-cron-secret
PLAUSIBLE_EVENTS_API=https://plausible.io/api/event
```

## 2. Données de démonstration

```sh
pnpm seed:checkout     # prestataires, taux de commission, politiques à paliers,
                       # 1 écolodge, 3 expériences, 1 table, 2 transferts, 1 séjour signature (bookable)
```

## 3. Lancer et payer en local

```sh
pnpm dev
pnpm jobs:dev          # exécute la file Payload toutes les 10 s (remplace la tâche cron)
```

1. Ouvrir `http://localhost:3000/fr/hebergements/ecolodge-demo` en émulation mobile 360 × 800.
2. Ajouter l'hébergement (2 nuits, 2 adultes), une expérience, une table et un transfert
   aller-retour depuis AIBD.
3. Panier → Coordonnées → Paiement : vérifier les conditions d'annulation et les trois moyens
   au même rang ; choisir Wave.
4. Sur la page `fake`, cliquer « Réussir » : arrivée sur la confirmation ; e-mail visible dans
   la console Resend de test (ou journal), WhatsApp journalisé, bon PDF téléchargeable.
5. Rejouer avec « Solde insuffisant », puis « Ne pas revenir » (la réservation passe quand même
   à `paid`).

## 4. Tests

```sh
pnpm test                                  # Vitest : tarification, acompte, commissions,
                                           # remboursements, machines à états, contrat gateway, PDF
pnpm e2e --grep @checkout                  # Playwright : 360 px, 3G, trois moyens, échecs, relance, annulation
pnpm e2e:nojs --grep @checkout             # tunnel complet sans JavaScript (passerelle fake)
pnpm lhci                                  # inclut /fr/panier, /fr/commande/coordonnees, /fr/commande/statut
pnpm bundles                               # ≤ 150 Ko par route, tunnel compris
```

Scénarios E2E obligatoires (tags) :

| Tag | Scénario |
|---|---|
| `@checkout @us1` | panier 4 éléments + paiement Wave, Orange Money, carte ; confirmation ; < 3 min (chronométré) ; 3G ; axe à chaque étape |
| `@checkout @parity` | Wave, Orange Money, carte : même rang, même boîte englobante (±1 px), aucun présélectionné, à 360, 412 et 1280 px |
| `@checkout @cancellation-visible` | conditions d'annulation visibles et acceptées avant le bouton « Payer » |
| `@checkout @us2` | acompte proposé à J+45, refusé à J+20 ; paiement du solde depuis le lien |
| `@checkout @us3` | échec (solde insuffisant) → message + réessai ; abandon → relance → reprise ; double appui sans double débit |
| `@checkout @us4` | annulation à J-40 (100 %), J-20 (50 %), J-5 (0 %) ; statuts du remboursement |
| `@checkout @keyboard` | parcours complet au clavier (desktop), focus jamais masqué par le résumé collant |
| `@checkout @seo` | `noindex` + `X-Robots-Tag` sur chaque page du tunnel ; absentes du sitemap |

## 5. Préproduction

- Compte test de l'agrégateur retenu, `PAYMENT_GATEWAY=<id>`, URL de notification publique.
- Modèles WhatsApp soumis à Meta en FR et EN (délai d'approbation de quelques jours : à lancer
  dès le choix du numéro).
- Tâche cron de l'hébergeur : `POST /api/jobs/run` chaque minute avec `CRON_SECRET`.
- Revue de sécurité de l'intégration de paiement (principe IX) avant ouverture au public.
