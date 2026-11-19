# Contrat — Synchronisation iCal des unités louables

Format : iCalendar (RFC 5545), sous-ensemble utilisé par Airbnb et Booking.com.

## Export : `GET /api/ical/{token}.ics`

- Un flux par unité louable ; `token` = `rentalUnits.icalExportToken` (128 bits, base64url) ;
  jeton inconnu ou révoqué → `404` sans indication.
- `Content-Type: text/calendar; charset=utf-8`, `Cache-Control: private, max-age=300`,
  `X-Robots-Tag: noindex`.
- Contenu : périodes contiguës de nuits vendues ou fermées sur Saloum Évasion, sur les 12 mois à
  venir, **à l'exclusion des nuits importées** de ce même flux (évite les boucles) mais en
  incluant celles importées d'une autre plateforme (Airbnb voit les réservations Booking).

```text
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Saloum Evasion//Disponibilites//FR
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:se-unit12-20270210@saloum-evasion.sn
DTSTAMP:20270101T120000Z
DTSTART;VALUE=DATE:20270210
DTEND;VALUE=DATE:20270213
SUMMARY:Indisponible
END:VEVENT
END:VCALENDAR
```

- **Aucune donnée personnelle** : ni nom, ni téléphone, ni référence de réservation ; `SUMMARY`
  toujours « Indisponible » ; `UID` stable par période (unité + date de début).
- Lignes repliées à 75 octets, fins de ligne CRLF.

## Import

- Tâche `syncExternalCalendars` toutes les 15 minutes (file Payload, route cron existante) ;
  traite les calendriers dont `lastAttemptAt` a plus de 15 min, 20 par passage.
- Téléchargement : `https` seulement ; hôte résolu vers une adresse publique (refus des plages
  privées, de boucle locale et de lien local, contrôle après redirection, 3 redirections au plus) ;
  délai 10 s ; corps ≤ 1 Mo ; `If-None-Match` / `If-Modified-Since` ; `304` = rien à faire.
- Analyse (module pur `src/lib/ical/parse.ts`) : dépliage des lignes, blocs `VEVENT`, propriétés
  `UID`, `DTSTART`, `DTEND`, `SUMMARY`, `STATUS` ; `DTSTART;VALUE=DATE` (jour entier) ou date-heure
  (convertie en date civile de Dakar) ; `DTEND` exclusif ; évènement sans `DTEND` = une nuit ;
  `STATUS:CANCELLED` ignoré ; tout autre composant ou propriété ignoré.
- Application : nuits du flux sur les 12 mois à venir → `closed = true`,
  `closedOrigin = airbnb | booking | ical` ; nuits présentes dans `importedNights` mais absentes du
  nouveau flux → rouvertes si leur origine est encore ce flux ; `importedNights` mis à jour.
- **Conflit** : nuit importée déjà `sold > 0` sur Saloum Évasion → alerte immédiate (équipe et
  propriétaire, `partner_ical_conflict`), réservation Saloum Évasion signalée pour la règle
  d'indisponibilité de la 002 ; la nuit reste vendue.
- **Erreur** : échec réseau, `4xx/5xx`, flux non iCal → `lastError`, `lastAttemptAt` ; si
  `lastSuccessAt` > 2 h : `status = error`, avertissement dans l'espace, alerte équipe
  (`partner_ical_error`, une fois par épisode) ; les nuits importées restent fermées.

## Tests

- Unitaires : flux réels anonymisés d'Airbnb et de Booking (jour entier et date-heure), lignes
  repliées, `STATUS:CANCELLED`, évènement sans `DTEND`, fuseaux, flux vide, flux invalide ;
  génération de l'export (repliement, CRLF, absence de données personnelles, exclusion des nuits
  du même flux) ; protection SSRF (adresses privées, redirection vers une adresse privée).
- E2E : flux de démonstration servi localement → nuits fermées sur le site public ; export lisible.
