import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import { en } from '@payloadcms/translations/languages/en';
import { fr } from '@payloadcms/translations/languages/fr';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { Accommodations } from './collections/Accommodations';
import { Bookings } from './collections/Bookings';
import { CancellationPolicies } from './collections/CancellationPolicies';
import { Carts } from './collections/Carts';
import { CommissionEntries } from './collections/CommissionEntries';
import { Destinations } from './collections/Destinations';
import { Experiences } from './collections/Experiences';
import { FaqItems } from './collections/FaqItems';
import { Media } from './collections/Media';
import { Notifications } from './collections/Notifications';
import { Pages } from './collections/Pages';
import { Partners } from './collections/Partners';
import { PaymentEvents } from './collections/PaymentEvents';
import { Payments } from './collections/Payments';
import { Payouts } from './collections/Payouts';
import { RateLimits } from './collections/RateLimits';
import { Redirects } from './collections/Redirects';
import { Refunds } from './collections/Refunds';
import { Reminders } from './collections/Reminders';
import { Requests } from './collections/Requests';
import { Stays } from './collections/Stays';
import { TeamMembers } from './collections/TeamMembers';
import { Transfers } from './collections/Transfers';
import { Universes } from './collections/Universes';
import { Users } from './collections/Users';
import { Videos } from './collections/Videos';
import { CommissionRates } from './globals/CommissionRates';
import { Navigation } from './globals/Navigation';
import { sendNotificationTask } from './jobs/sendNotification';
import { SiteSettings } from './globals/SiteSettings';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const s3Enabled = Boolean(process.env.S3_BUCKET);

// CMS intégré (plan 001) : PostgreSQL, contenus localisés FR/EN sans repli silencieux
// (`fallback: false`, constitution « Bilinguisme »), admin en français, API GraphQL coupée
// (non utilisée : surface d'attaque réduite).
export default buildConfig({
  secret: process.env.PAYLOAD_SECRET ?? '',
  serverURL: process.env.NEXT_PUBLIC_SITE_URL,
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' — Saloum Évasion', robots: 'noindex, nofollow' },
    importMap: { baseDir: path.resolve(dirname) },
    // Paniers abandonnés et paiements échoués (002, US3, T080, FR-032).
    components: {
      afterNavLinks: ['/components/admin/AbandonedCartsNavLink#AbandonedCartsNavLink'],
      views: {
        abandonedCarts: {
          Component: '/components/admin/AbandonedCarts#AbandonedCarts',
          path: '/paniers-abandonnes',
        },
      },
    },
  },
  i18n: { supportedLanguages: { fr, en }, fallbackLanguage: 'fr' },
  localization: {
    locales: [
      { code: 'fr', label: 'Français' },
      { code: 'en', label: 'English' },
    ],
    defaultLocale: 'fr',
    fallback: false,
  },
  collections: [
    Stays,
    Experiences,
    Accommodations,
    Transfers,
    Destinations,
    Universes,
    Videos,
    Media,
    Pages,
    FaqItems,
    CancellationPolicies,
    TeamMembers,
    Requests,
    Partners,
    Carts,
    Bookings,
    Payments,
    PaymentEvents,
    Refunds,
    CommissionEntries,
    Payouts,
    Reminders,
    Notifications,
    Redirects,
    RateLimits,
    Users,
  ],
  globals: [SiteSettings, Navigation, CommissionRates],
  // File de tâches (002, T028) : exécutée par /api/jobs/run (Vercel Cron chaque minute,
  // `pnpm jobs:dev` en local). Tâches terminées supprimées ; le journal métier est dans
  // `notifications`, `reminders` et `paymentEvents`.
  jobs: {
    tasks: [sendNotificationTask],
    deleteJobOnComplete: true,
    jobsCollectionOverrides: ({ defaultJobsCollection }) => ({
      ...defaultJobsCollection,
      admin: { ...defaultJobsCollection.admin, hidden: true },
    }),
  },
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI ?? '' },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Schéma uniquement par migrations versionnées (aucune synchronisation automatique).
    push: false,
  }),
  graphQL: { disable: true },
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  plugins: [
    s3Storage({
      enabled: s3Enabled,
      collections: { media: true },
      bucket: process.env.S3_BUCKET ?? '',
      config: {
        region: process.env.S3_REGION,
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: Boolean(process.env.S3_ENDPOINT),
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
        },
      },
    }),
  ],
});
