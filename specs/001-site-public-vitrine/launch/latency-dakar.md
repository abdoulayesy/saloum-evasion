# Latence depuis Dakar et Ndangane (T175, plan T5)

Le site est servi depuis la région Vercel `cdg1` (Paris) et sa base en Europe de l'Ouest. Avant le
lancement, on mesure ce que vivent réellement les visiteurs au Sénégal, et l'on décide s'il faut
un CDN ou un point de présence plus proche.

## Protocole

- **Lieux** : Dakar (Plateau ou Almadies) et Ndangane.
- **Réseaux** : 4G Orange et 4G Free (Yas), un téléphone Android milieu de gamme.
- **Moments** : un jour de semaine à 12 h et à 20 h (heure de Dakar), plus un samedi à 10 h.
- **Pages** : `/fr`, `/fr/sejours/week-end-bolong-ndangane`, `/fr/experiences`, `/fr/demande`.
- **Outils** :
  - TTFB et LCP : WebPageTest (agent le plus proche) ou Chrome DevTools en débogage à distance
    (onglet Performance, cache désactivé), 5 chargements par page et par moment ;
  - en complément : `curl -o /dev/null -s -w '%{time_starttransfer}\n' https://…` depuis le
    téléphone (Termux) pour le TTFB seul.

## Relevé

| Date | Lieu | Opérateur | Page | TTFB p75 (ms) | LCP p75 (s) | Remarques |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

## Seuil de décision

- **TTFB p75 ≤ 600 ms** partout : pas de changement.
- **TTFB p75 > 600 ms** à Dakar ou à Ndangane : activer un CDN avec point de présence en Afrique
  de l'Ouest devant les pages statiques (elles le sont toutes, sauf la demande), ou rapprocher
  la région de calcul ; refaire la mesure ensuite.
- **LCP p75 > 2,5 s** malgré un bon TTFB : revoir le poids des images principales et la
  dérogation D-LCP-photo (plan).

Décision prise le …… par …… : ……
