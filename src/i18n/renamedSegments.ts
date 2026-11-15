// Segments fixes renommés (seo CHK036) : si un segment de src/i18n/pathnames.ts change
// (ex. « hebergements » → « logements »), ajouter ici l'ancien préfixe et le nouveau.
// next.config.ts en tire des redirections 301 qui conservent la suite de l'adresse.
// Les slugs de documents, eux, sont redirigés automatiquement par le CMS (hooks/autoRedirect).

export type RenamedSegment = { from: string; to: string };

export const renamedSegments: readonly RenamedSegment[] = [];
