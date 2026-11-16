# Liste de vérification avant lancement

Amorcée en phase 7 (T135), complétée en phase 10 (T176). Chaque ligne est cochée par une
personne nommée, avec la date. Les tests automatisés couvrent le reste (voir `quickstart.md`).

## Référencement (constitution III)

- [ ] Test des résultats enrichis de Google et validateur Schema.org sur une URL par type de
      page : accueil (TravelAgency, WebSite), fiche séjour (TouristTrip, FAQPage), fiche
      expérience (TouristAttraction + TouristTrip), destination (TouristDestination), réserve
      (TouristAttraction), hébergement (LodgingBusiness), film (VideoObject + Clip), FAQ
      (FAQPage), contact (ContactPage), listes (ItemList).
- [ ] Propriété de **domaine** vérifiée dans Search Console (DNS) ; `sitemap.xml` soumis ; aucune
      erreur de couverture sur les pages FR et EN.
- [ ] Les 10 mots-clés cibles et leur équivalent anglais pointent vers leur page principale
      réelle (`src/lib/seo/keywords.ts`, contrôlé par `pnpm seo:check`), une fois le contenu de
      démonstration remplacé.
- [ ] Nom, adresse et téléphone (NAP) des « Réglages du site » **identiques** à ceux de la fiche
      Google Business Profile.

## Mesure et performance terrain

- [ ] Domaine Plausible créé, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` renseigné au build ; objectifs
      configurés : `request_submitted`, `whatsapp_click`, `request_item_added`,
      `language_switch`, `video_play`, `web_vital` (contrat analytics-events.md). Vérifier que le
      script ne part qu'après inactivité.
- [ ] Suivi du LCP terrain : une personne désignée (nom : ………) consulte chaque semaine du premier
      mois les CWV (Plausible `web_vital`, Search Console, CrUX dès qu'il y a du volume) ; seuil
      d'alerte LCP p75 > 2,5 s ; revoir la dérogation D-LCP-photo avec ces données.
- [ ] Mesure de latence depuis Dakar et Ndangane faite selon `latency-dakar.md` ; décision CDN
      consignée.
- [ ] Offre Vercel Pro active (tâches planifiées toutes les 10 min) ; `CRON_SECRET` renseigné.

## Accessibilité

- [ ] Audit manuel TalkBack et VoiceOver réalisé selon `manual-a11y-audit.md` ; anomalies
      bloquantes corrigées.

## Données personnelles (constitution IX)

- [ ] Un juriste vérifie la déclaration des traitements auprès de la Commission de protection
      des données personnelles (CDP, loi 2008-12) et le registre publié sur la page
      Confidentialité (finalités, bases légales, durées, destinataires, transferts hors du
      Sénégal).
- [ ] Garanties contractuelles confirmées pour les transferts vers Resend (États-Unis) et Mux
      (États-Unis) ; durée de conservation des données de lecture chez Mux confirmée.
- [ ] En-têtes de sécurité vérifiés en production (CSP, HSTS, Referrer-Policy) : aucune
      ressource bloquée dans la console sur les pages film, demande et fiches.

## Contenus de démonstration à remplacer

- [ ] Film réel du Saloum chez Mux (identifiant de lecture, rendu MP4 statique activé, sous-titres
      FR et EN, chapitres, transcription descriptive) à la place du flux public de démonstration.
- [ ] Boucle d'ambiance réelle (≤ 8 s, rendu MP4 `low` ≤ 1,5 Mo, ou fichier hébergé).
- [ ] Photos : auteur, droits d'utilisation et lieu exacts de chaque photo fournie ; originaux en
      haute définition (≥ 1600 px) pour les photos agrandies par le seed ; photo portant le logo
      d'un autre prestataire (`Iles-du-Saloum-Decouverte-2.jpg`) remplacée ou autorisée.
- [ ] Portraits réels de l'équipe ; photos réelles des hébergements.
- [ ] Mentions légales complétées (éditeur, NINEA, RCCM, siège, directeur de la publication,
      hébergeur).
- [ ] Destinataire réel des demandes (« Réglages du site ») à la place de l'adresse de
      démonstration, et adresse de secours renseignée ; numéro WhatsApp réel.
