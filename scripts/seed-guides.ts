import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import config from '@payload-config';
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical';
import { getPayload, type Payload } from 'payload';
import { parseDraft, type DraftSegment, type DraftValue } from '@/lib/guides/draft';

// Carnets du Saloum (004, T020, research R10) : thèmes, champs d'auteur des membres de
// démonstration, et import des brouillons content/carnets/{fr,en}/*.md **en brouillon**.
// Ne publie jamais un guide et n'écrase jamais un guide existant (créé seulement s'il manque,
// repéré par son slug français) : la relecture, la signature et la publication se font dans
// l'admin par un membre de l'équipe. Usage : `pnpm seed:guides` (après `pnpm seed`).

const context = { disableRevalidate: true };

const CONTENT_DIR = join(process.cwd(), 'content', 'carnets');

const THEMES = [
  { key: 'preparer', fr: 'Préparer son voyage', en: 'Plan your trip', order: 1 },
  { key: 'que-faire', fr: 'Que faire', en: 'Things to do', order: 2 },
  { key: 'culture-nature', fr: 'Culture et nature', en: 'Culture and nature', order: 3 },
];

const DEMO_BIO = {
  fr: 'Profil de démonstration, à remplacer par la vraie présentation du membre de l’équipe avant toute publication. Né dans le Saloum, il connaît les bolongs, les villages et les îles depuis l’enfance ; il accompagne les voyageurs en pirogue, à pied ou à vélo, et aime partager les histoires des familles qui vivent ici, la cuisine des femmes de Ndangane et le calendrier des marées qui rythme la vie de la mangrove. Il relit les guides des Carnets du Saloum pour que chaque conseil reste juste et à jour.',
  en: 'Demonstration profile, to be replaced by the team member’s real bio before any publication. Born in the Saloum, he has known the bolongs, villages and islands since childhood; he guides travellers by pirogue, on foot or by bike, and loves sharing the stories of the families who live here, the cooking of the women of Ndangane and the tide calendar that sets the rhythm of life in the mangrove. He reviews the Saloum Travel Guides so that every tip stays accurate and up to date.',
};

const text = (value: DraftValue | undefined): string => (typeof value === 'string' ? value : '');

const slugs = (value: DraftValue | undefined, key: string): string[] => {
  if (typeof value !== 'object' || Array.isArray(value)) return [];
  return value[key] ?? [];
};

const upsertThemes = async (payload: Payload): Promise<Map<string, number>> => {
  const ids = new Map<string, number>();
  for (const theme of THEMES) {
    const found = await payload.find({
      collection: 'guideThemes',
      where: { key: { equals: theme.key } },
      limit: 1,
    });
    const data = { key: theme.key, name: theme.fr, order: theme.order };
    const doc = found.docs[0]
      ? await payload.update({
          collection: 'guideThemes',
          id: found.docs[0].id,
          locale: 'fr',
          data,
          context,
        })
      : await payload.create({ collection: 'guideThemes', locale: 'fr', data, context });
    await payload.update({
      collection: 'guideThemes',
      id: doc.id,
      locale: 'en',
      data: { name: theme.en },
      context,
    });
    ids.set(theme.key, doc.id);
  }
  return ids;
};

/** Membres de démonstration du seed 001 : slug, lieu et présentation pour signer un guide. */
const prepareDemoAuthors = async (payload: Payload): Promise<void> => {
  const { docs } = await payload.find({
    collection: 'teamMembers',
    where: { name: { like: '(démonstration)' } },
    sort: 'order',
    limit: 20,
  });
  for (const [index, member] of docs.entries()) {
    if (member.slug) continue;
    await payload.update({
      collection: 'teamMembers',
      id: member.id,
      locale: 'fr',
      data: { slug: `membre-demo-${index + 1}`, place: 'Ndangane', bio: DEMO_BIO.fr },
      context,
    });
    await payload.update({
      collection: 'teamMembers',
      id: member.id,
      locale: 'en',
      data: { place: 'Ndangane', bio: DEMO_BIO.en },
      context,
    });
  }
};

type DraftFile = { meta: Record<string, DraftValue>; segments: DraftSegment[]; file: string };

const readDrafts = async (locale: 'fr' | 'en'): Promise<Map<string, DraftFile>> => {
  const dir = join(CONTENT_DIR, locale);
  const files = (await readdir(dir).catch(() => [])).filter((file) => file.endsWith('.md'));
  const drafts = new Map<string, DraftFile>();
  for (const file of files) {
    const { meta, segments } = parseDraft(await readFile(join(dir, file), 'utf8'));
    const key = text(meta.key);
    if (!key) throw new Error(`${locale}/${file} : clé « key » absente de l’en-tête.`);
    drafts.set(key, { meta, segments, file });
  }
  return drafts;
};

const idsBySlug = async (
  payload: Payload,
  collection: 'stays' | 'experiences' | 'accommodations' | 'destinations',
  values: string[],
): Promise<number[]> => {
  if (values.length === 0) return [];
  const { docs } = await payload.find({
    collection,
    locale: 'fr',
    where: { 'seo.slug': { in: values } },
    depth: 0,
    limit: values.length,
  });
  // Ordre du brouillon conservé ; slug inconnu signalé et ignoré.
  return values.flatMap((slug) => {
    const doc = docs.find((candidate) => candidate.seo?.slug === slug);
    if (!doc) payload.logger.warn(`Lien ignoré : ${collection} « ${slug} » introuvable.`);
    return doc ? [doc.id] : [];
  });
};

const memberId = async (payload: Payload, slug: string): Promise<number | null> => {
  if (!slug) return null;
  const { docs } = await payload.find({
    collection: 'teamMembers',
    where: { slug: { equals: slug } },
    limit: 1,
  });
  return docs[0]?.id ?? null;
};

type ToLexical = (segments: DraftSegment[]) => ReturnType<typeof buildBody>;

/** Corps Lexical d'un brouillon : Markdown converti, encadrés en blocs « Encadré pratique ». */
const buildBody = (
  editorConfig: Awaited<ReturnType<typeof editorConfigFactory.default>>,
  segments: DraftSegment[],
) => {
  type LexicalNode = { type: string; version: number; [key: string]: unknown };
  const children: LexicalNode[] = segments.flatMap((segment): LexicalNode[] =>
    segment.kind === 'markdown'
      ? convertMarkdownToLexical({ editorConfig, markdown: segment.markdown }).root.children
      : [
          {
            type: 'block',
            version: 2,
            format: '',
            fields: {
              id: crypto.randomUUID().replace(/-/g, '').slice(0, 24),
              blockName: '',
              blockType: 'practicalBox',
              title: segment.title,
              text: segment.text,
              variant: segment.variant,
            },
          },
        ],
  );
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children,
    },
  };
};

const importDrafts = async (
  payload: Payload,
  themes: Map<string, number>,
  toLexical: ToLexical,
): Promise<number> => {
  const french = await readDrafts('fr');
  const english = await readDrafts('en');
  const fallbackAuthor = (
    await payload.find({ collection: 'teamMembers', sort: 'order', limit: 1 })
  ).docs[0]?.id;
  let created = 0;
  for (const [key, fr] of french) {
    const slug = text(fr.meta.slug);
    const existing = await payload.find({
      collection: 'guides',
      locale: 'fr',
      where: { 'seo.slug': { equals: slug } },
      draft: true,
      limit: 1,
    });
    if (existing.docs.length > 0) {
      payload.logger.info(`Guide « ${slug} » déjà présent : non modifié.`);
      continue;
    }
    const related = fr.meta.related;
    const author = (await memberId(payload, text(fr.meta.author))) ?? fallbackAuthor;
    const reviewer = await memberId(payload, text(fr.meta.reviewer));
    const doc = await payload.create({
      collection: 'guides',
      locale: 'fr',
      draft: true,
      context,
      data: {
        _status: 'draft',
        title: text(fr.meta.title),
        standfirst: text(fr.meta.standfirst),
        theme: themes.get(text(fr.meta.theme)) ?? themes.get('que-faire') ?? 0,
        author: author ?? 0,
        ...(reviewer === null ? {} : { reviewer }),
        requiresCommunityReview: fr.meta.requiresCommunityReview === true,
        body: toLexical(fr.segments),
        relatedStays: await idsBySlug(payload, 'stays', slugs(related, 'stays')),
        relatedExperiences: await idsBySlug(payload, 'experiences', slugs(related, 'experiences')),
        relatedAccommodations: await idsBySlug(
          payload,
          'accommodations',
          slugs(related, 'accommodations'),
        ),
        relatedDestinations: await idsBySlug(
          payload,
          'destinations',
          slugs(related, 'destinations'),
        ),
        seo: {
          slug,
          metaTitle: text(fr.meta.metaTitle),
          metaDescription: text(fr.meta.metaDescription),
          targetKeyword: text(fr.meta.targetKeyword),
        },
      },
    });
    const en = english.get(key);
    if (en) {
      await payload.update({
        collection: 'guides',
        id: doc.id,
        locale: 'en',
        draft: true,
        context,
        data: {
          title: text(en.meta.title),
          standfirst: text(en.meta.standfirst),
          body: toLexical(en.segments),
          seo: {
            slug: text(en.meta.slug),
            metaTitle: text(en.meta.metaTitle),
            metaDescription: text(en.meta.metaDescription),
            targetKeyword: text(en.meta.targetKeyword),
          },
        },
      });
    }
    created += 1;
    payload.logger.info(`Brouillon importé : ${fr.file}${en ? ` + en/${en.file}` : ''}.`);
  }
  return created;
};

// --- Guides de démonstration publiés (tests seulement, research R12) -----------------------

const DEMO_GUIDES = [
  {
    theme: 'que-faire',
    withFaq: true,
    related: {
      stays: ['week-end-bolong-ndangane'],
      experiences: ['excursion-pirogue-bolongs'],
      accommodations: ['ecolodge-des-bolongs'],
      destinations: ['ndangane', 'mar-lodj'],
    },
    fr: {
      slug: 'guide-de-demonstration',
      title: 'Guide de démonstration des Carnets du Saloum',
      standfirst:
        'Guide de démonstration utilisé par les tests automatiques : il montre la signature, la table des matières, un encadré pratique et les offres liées. Il ne doit jamais être publié en production.',
      metaTitle: 'Guide de démonstration | Carnets du Saloum',
      metaDescription:
        'Guide de démonstration des Carnets du Saloum, publié seulement dans les environnements de test.',
      targetKeyword: 'guide de démonstration carnets',
      body: [
        'Ce texte de démonstration remplace un vrai guide le temps des tests. Les guides réels sont rédigés à partir des réponses de l’équipe de Ndangane, puis relus et signés.',
        '## Les bolongs en pirogue',
        'Les bolongs sont des bras de mer bordés de palétuviers. Une sortie se prépare avec les horaires des marées.',
        ':::encadre attention Marées',
        'Exemple d’information datée : horaires constatés en novembre 2026.',
        ':::',
        '## Les îles du delta',
        'Mar Lodj se visite à pied ou en charrette. Ndangane est le point de départ des pirogues.',
        '### Une journée sur l’île',
        'Prévoir de l’argent liquide et de l’eau.',
        '## Venir à Ndangane',
        'La route depuis Dakar passe par Mbour et Fatick.',
      ],
    },
    en: {
      slug: 'demonstration-guide',
      title: 'Saloum Travel Guides demonstration guide',
      standfirst:
        'Demonstration guide used by automated tests: it shows the byline, the table of contents, a practical box and related offers. It must never be published in production.',
      metaTitle: 'Demonstration guide | Saloum Travel Guides',
      metaDescription:
        'Demonstration guide of the Saloum Travel Guides, published only in test environments.',
      targetKeyword: 'demonstration travel guide',
      body: [
        'This demonstration text stands in for a real guide during tests.',
        '## The bolongs by pirogue',
        'Bolongs are sea channels lined with mangroves.',
        '## The islands of the delta',
        'Mar Lodj is explored on foot or by cart.',
        '## Getting to Ndangane',
        'The road from Dakar goes through Mbour and Fatick.',
      ],
    },
  },
  {
    theme: 'culture-nature',
    withFaq: false,
    related: {
      stays: [],
      experiences: ['excursion-pirogue-bolongs'],
      accommodations: [],
      destinations: ['mar-lodj'],
    },
    fr: {
      slug: 'guide-de-demonstration-francais',
      title: 'Second guide de démonstration, en français seulement',
      standfirst:
        'Second guide de démonstration, sans version anglaise : il vérifie que la bascule de langue mène à la rubrique et qu’aucune version anglaise n’est annoncée.',
      metaTitle: 'Second guide de démonstration | Carnets du Saloum',
      metaDescription:
        'Second guide de démonstration, publié en français seulement, dans les tests.',
      targetKeyword: 'second guide de démonstration',
      body: ['Texte de démonstration.', '## Une seule section', 'Pas de table des matières ici.'],
    },
    en: null,
  },
] as const;

const publishDemoGuides = async (
  payload: Payload,
  themes: Map<string, number>,
  toLexical: ToLexical,
): Promise<void> => {
  const authors = (
    await payload.find({
      collection: 'teamMembers',
      where: { slug: { like: 'membre-demo-' } },
      sort: 'slug',
      limit: 2,
    })
  ).docs;
  const heroImage = (
    await payload.find({
      collection: 'media',
      where: { 'provenance.author': { equals: 'Démonstration' } },
      limit: 1,
    })
  ).docs[0];
  const [author, reviewer] = authors;
  if (!author || !heroImage) throw new Error('Démonstration : lancer `pnpm seed` d’abord.');
  const faq = (await payload.find({ collection: 'faqItems', limit: 1, depth: 0 })).docs.map(
    (item) => item.id,
  );
  for (const demo of DEMO_GUIDES) {
    const existing = await payload.find({
      collection: 'guides',
      locale: 'fr',
      where: { 'seo.slug': { equals: demo.fr.slug } },
      draft: true,
      limit: 1,
    });
    const body = (lines: readonly string[]) =>
      toLexical(parseDraft(`---\nkey: demo\n---\n${lines.join('\n\n')}`).segments);
    const data = {
      _status: 'published' as const,
      title: demo.fr.title,
      standfirst: demo.fr.standfirst,
      heroImage: heroImage.id,
      theme: themes.get(demo.theme) ?? 0,
      author: author.id,
      ...(reviewer ? { reviewer: reviewer.id } : {}),
      body: body(demo.fr.body),
      // FAQ sur le premier guide seulement : le second vérifie l'absence de FAQPage.
      faq: demo.withFaq ? faq : [],
      relatedStays: await idsBySlug(payload, 'stays', [...demo.related.stays]),
      relatedExperiences: await idsBySlug(payload, 'experiences', [...demo.related.experiences]),
      relatedAccommodations: await idsBySlug(payload, 'accommodations', [
        ...demo.related.accommodations,
      ]),
      relatedDestinations: await idsBySlug(payload, 'destinations', [...demo.related.destinations]),
      seo: {
        slug: demo.fr.slug,
        metaTitle: demo.fr.metaTitle,
        metaDescription: demo.fr.metaDescription,
        targetKeyword: demo.fr.targetKeyword,
      },
    };
    const found = existing.docs[0];
    const doc = found
      ? await payload.update({ collection: 'guides', id: found.id, locale: 'fr', data, context })
      : await payload.create({ collection: 'guides', locale: 'fr', data, context });
    if (demo.en) {
      await payload.update({
        collection: 'guides',
        id: doc.id,
        locale: 'en',
        context,
        data: {
          _status: 'published',
          title: demo.en.title,
          standfirst: demo.en.standfirst,
          body: body(demo.en.body),
          seo: {
            slug: demo.en.slug,
            metaTitle: demo.en.metaTitle,
            metaDescription: demo.en.metaDescription,
            targetKeyword: demo.en.targetKeyword,
          },
        },
      });
    }
    payload.logger.info(`Guide de démonstration publié : ${demo.fr.slug}.`);
  }
};

const seed = async (): Promise<void> => {
  const payload = await getPayload({ config });
  const editorConfig = await editorConfigFactory.default({ config: payload.config });
  const toLexical: ToLexical = (segments) => buildBody(editorConfig, segments);
  const themes = await upsertThemes(payload);
  if (process.env.NODE_ENV !== 'production') await prepareDemoAuthors(payload);
  const created = await importDrafts(payload, themes, toLexical);
  payload.logger.info(
    `Carnets du Saloum : ${themes.size} thèmes, ${created} brouillon(s) importé(s), aucun publié.`,
  );
  // Tests seulement (Lighthouse CI, E2E) : jamais en production sans dérogation explicite.
  if (process.env.SEED_GUIDES_DEMO_PUBLISH === '1') {
    if (process.env.NODE_ENV === 'production' && process.env.SEED_ALLOW_PRODUCTION !== '1') {
      throw new Error('Guides de démonstration interdits en production.');
    }
    await publishDemoGuides(payload, themes, toLexical);
  }
};

await seed();
process.exit(0);
