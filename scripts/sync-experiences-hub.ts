import config from '@payload-config';
import { getPayload } from 'payload';

// Recentrage du hub des expériences (004, T066, FR-020b) dans un CMS déjà rempli : « que faire
// au Sine-Saloum » appartient désormais au guide des Carnets ; le hub cible « activités et
// excursions ». Met à jour le titre (H1) et le SEO de la page `experiences_hub` en FR et en EN.
// Idempotent. Usage : `pnpm cms:experiences-hub`.

const TEXT = {
  fr: {
    title: 'Activités et excursions dans le Sine-Saloum',
    metaTitle: 'Activités et excursions dans le Sine-Saloum | Saloum Évasion',
    metaDescription:
      'Pirogue dans les bolongs, quad, cheval, table chez l’habitant : toutes nos activités et excursions dans le Sine-Saloum, avec des guides de Ndangane.',
  },
  en: {
    title: 'Sine-Saloum activities and excursions',
    metaTitle: 'Sine-Saloum activities and excursions | Saloum Évasion',
    metaDescription:
      'Pirogue trips through the bolongs, quad, horse riding, meals with local families: all our Sine-Saloum activities and excursions, with Ndangane guides.',
  },
} as const;

const payload = await getPayload({ config });
const found = await payload.find({
  collection: 'pages',
  where: { key: { equals: 'experiences_hub' } },
  locale: 'fr',
  depth: 0,
  limit: 1,
});
const page = found.docs[0];
if (!page) {
  payload.logger.warn('Page « experiences_hub » introuvable : rien à faire.');
  process.exit(0);
}
for (const locale of ['fr', 'en'] as const) {
  const current = await payload.findByID({ collection: 'pages', id: page.id, locale, depth: 0 });
  await payload.update({
    collection: 'pages',
    id: page.id,
    locale,
    data: {
      title: TEXT[locale].title,
      seo: {
        ...current.seo,
        metaTitle: TEXT[locale].metaTitle,
        metaDescription: TEXT[locale].metaDescription,
        targetKeyword: locale === 'fr' ? 'activités Sine-Saloum' : 'Sine-Saloum activities',
      },
    },
  });
}
payload.logger.info('Hub des expériences recentré sur « activités et excursions ».');
process.exit(0);
