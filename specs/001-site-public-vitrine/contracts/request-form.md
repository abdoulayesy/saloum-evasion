# Contrat — Demande de séjour

## 1. « Demande en cours » (côté client)

Stockage local `localStorage["se.request.v1"]` (accès dans `try/catch` ; repli : paramètre
d'URL). Strictement nécessaire au service demandé, donc sans consentement.

```ts
type RequestItemKind = 'stay' | 'experience' | 'accommodation';

type RequestDraft = {
  version: 1;
  items: ReadonlyArray<{ kind: RequestItemKind; id: string; title: string }>; // ≤ 10, sans doublon (kind+id)
  arrivalDate?: string;   // ISO AAAA-MM-JJ
  departureDate?: string;
  adults?: number;
  children?: number;
  updatedAt: string;      // ISO ; brouillon ignoré après 30 jours
};
```

Repli sans JavaScript : `/fr/demande?sejour={id}` (ou `experience=`, `hebergement=`) ;
`/en/request?stay=…|experience=…|accommodation=…`.

## 2. Champs du formulaire

| Champ (`name`) | Contrôle | Clavier / autocomplete | Obligatoire |
|---|---|---|---|
| `items[]` | liste pré-remplie, retirables | — | non |
| `arrivalDate` | `type="date"` | `autocomplete="off"` | **oui** |
| `departureDate` | `type="date"` | | non |
| `adults` | stepper (boutons de 44 px) + `inputmode="numeric"` | | **oui** (défaut 2) |
| `children` | stepper | | non (défaut 0) |
| `moods[]` | puces à cocher | | non |
| `budgetBand` | boutons radio | | non |
| `firstName` | `type="text"` | `autocomplete="given-name"` | **oui** |
| `whatsapp` | sélecteur d'indicatif (défaut +221) + `type="tel"` | `autocomplete="tel"`, `inputmode="tel"` | **oui** |
| `email` | `type="email"` | `autocomplete="email"` | non |
| `message` | `textarea` | | non |
| `consent` | case à cocher + lien Confidentialité | | **oui** |
| `website` | **honeypot**, masqué visuellement et pour les lecteurs d'écran (`aria-hidden`, `tabindex=-1`) | | doit être vide |
| `startedAt` | caché, horodatage du rendu | | ≥ 3 s avant l'envoi |
| `submissionId` | caché, UUID v4 généré à l'affichage | | unique |
| `locale`, `sourcePath` | cachés | | oui |

Les conditions d'annulation du ou des séjours choisis (`cancellationPolicies.summary`) sont
affichées au-dessus du bouton d'envoi (FR-036).

## 3. Schéma de validation (serveur, Zod)

```ts
import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const todayDakar = (): string => new Date().toISOString().slice(0, 10); // Dakar = UTC+0

export const requestItemSchema = z.object({
  kind: z.enum(['stay', 'experience', 'accommodation']),
  id: z.string().min(1).max(64),
});

export const stayRequestSchema = z
  .object({
    items: z.array(requestItemSchema).max(10).default([]),
    arrivalDate: isoDate.refine((d) => d >= todayDakar(), 'arrival_in_past'),
    departureDate: isoDate.optional(),
    adults: z.coerce.number().int().min(1).max(30),
    children: z.coerce.number().int().min(0).max(20).default(0),
    moods: z.array(z.enum(['nature', 'culture', 'gastronomie', 'detente', 'aventure', 'famille'])).max(6).default([]),
    budgetBand: z.enum(['lt250k', '250k-500k', 'gt500k']).optional(),
    firstName: z.string().trim().min(1).max(60),
    whatsapp: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'whatsapp_invalid'),
    email: z.string().trim().email().max(254).optional().or(z.literal('')),
    message: z.string().trim().max(1000).optional(),
    consent: z.literal('on', { errorMap: () => ({ message: 'consent_required' }) }),
    website: z.literal(''),                       // honeypot
    startedAt: z.coerce.number().int(),
    submissionId: z.string().uuid(),
    locale: z.enum(['fr', 'en']),
    sourcePath: z.string().startsWith('/').max(300),
  })
  .refine((v) => !v.departureDate || v.departureDate > v.arrivalDate, {
    path: ['departureDate'], message: 'departure_before_arrival',
  })
  .refine((v) => Date.now() - v.startedAt >= 3000, { path: ['startedAt'], message: 'too_fast' });

export type StayRequestInput = z.infer<typeof stayRequestSchema>;
```

Les codes d'erreur (`arrival_in_past`, …) sont traduits par next-intl ; aucun message
technique n'est montré au visiteur.

## 4. Server Action `submitStayRequest`

```ts
type SubmitResult =
  | { status: 'ok'; reference: string; whatsappUrl: string }
  | { status: 'invalid'; fieldErrors: Partial<Record<keyof StayRequestInput, string>>; values: Partial<StayRequestInput> }
  | { status: 'rate_limited' }          // message : réessayer plus tard ou WhatsApp
  | { status: 'error' };                // message générique + WhatsApp ; saisies conservées

declare function submitStayRequest(prev: SubmitResult | null, form: FormData): Promise<SubmitResult>;
```

**Séquence** :

1. Parser `FormData` → `stayRequestSchema.safeParse`. Échec → `invalid` (valeurs renvoyées pour
   ré-afficher le formulaire, y compris sans JavaScript).
2. Honeypot non vide ou `too_fast` → répondre `ok` avec une référence factice, **sans**
   enregistrer ni notifier (ne pas renseigner le robot).
3. Limitation : `ipHash = sha256(salt + ip)` ; au-delà de 5 par heure → `rate_limited`.
4. Idempotence : si `submissionId` existe déjà → renvoyer le résultat `ok` existant.
5. Résoudre les `items` (documents publiés uniquement) → `titleSnapshot` ; ignorer les ids
   inconnus.
6. Créer `requests` (`status: new`, `consentAt: now`, référence `SE-AAAAMMJJ-XXXX`).
7. Envoyer l'e-mail Resend à `siteSettings.notificationEmail` (objet :
   `[Demande {ref}] {firstName} – {arrivée} – {adultes}+{enfants}`) ; succès → `notifiedAt`.
   Échec d'envoi : la demande est conservée, `notifiedAt = null` (alerte dans l'admin et
   journal) ; le visiteur reçoit quand même `ok`.
8. Construire `whatsappUrl = https://wa.me/{whatsappNumber}?text={récapitulatif localisé + ref}`.
9. Renvoyer `ok`. Avec JavaScript : la confirmation s'affiche sur place, le brouillon local
   est vidé et l'évènement `request_submitted` est envoyé. Sans JavaScript : redirection 303
   vers `/{locale}/demande/merci?ref=…`.

**Écran de confirmation** : référence, récapitulatif, `siteSettings.responseTimeText`, mention
« Les dates sont des souhaits ; l'équipe confirme la disponibilité », bouton principal
**« Envoyer aussi sur WhatsApp »** (`whatsappUrl`), lien retour.

## 5. Lien WhatsApp global (toutes les pages)

```text
https://wa.me/{siteSettings.whatsappNumber sans +}?text={encodeURIComponent(message)}
FR : « Bonjour Saloum Évasion, je regarde « {titre de la page} » ({URL}). »
EN : "Hello Saloum Évasion, I'm looking at "{page title}" ({URL})."
```

Simple `<a>` (pas de widget tiers), `rel="noopener"`, évènement `whatsapp_click` avec
`{ placement: sticky_bar|header|footer|confirmation, pageType }`.
