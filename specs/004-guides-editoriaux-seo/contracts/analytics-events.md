# Contrat — Mesure des Carnets du Saloum

Complète le [contrat de mesure de la 001](../../001-site-public-vitrine/contracts/analytics-events.md).
Plausible, sans cookie ni donnée personnelle ; aucun JavaScript ajouté par page : les clics
passent par l'écouteur délégué existant (`src/components/client/Analytics.tsx`).

| Évènement | Quand | Propriétés |
|---|---|---|
| *(page vue)* | ouverture d'un guide, de la rubrique, d'une page d'auteur | chemin (langue et guide déduits) |
| `guide_offer_click` | clic sur un lien d'offre ou de destination depuis un guide (texte, carte, encart de fin) | `guide` (slug du guide dans la langue de la page), `target` (`stay` \| `experience` \| `accommodation` \| `destination`), `locale` |
| `guide_card_click` | clic sur une carte de l'encart « À lire dans les Carnets » d'une fiche | `guide` (slug du guide dans la langue de la page), `from` (type de la fiche), `locale` |
| `whatsapp_click` | clic WhatsApp depuis un guide | existant ; `placement: guide` |

Marquage : `data-guide-link="{target}"` et `data-guide="{slug du guide dans la langue de la page}"` sur les liens concernés ;
`data-guide-card` sur les cartes de l'encart.

## Indicateurs

- SC-004 : (`guide_offer_click` + `whatsapp_click` placement `guide`) ÷ pages vues des guides,
  par guide et par langue, sur 28 jours.
- SC-002 : position moyenne de la requête cible sur la page du guide, sur 28 jours, relevée chaque
  mois dans Search Console (rapport dans `docs/analytics-carnets.md`).
- Objectifs Plausible à créer : `guide_offer_click`, `guide_card_click`.
