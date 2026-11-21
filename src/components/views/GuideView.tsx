import Link from 'next/link';
import { RichText } from '@payloadcms/richtext-lexical/react';
import { getTranslations } from 'next-intl/server';
import { GuideByline } from '@/components/guides/GuideByline';
import { GuideCard } from '@/components/guides/GuideCard';
import { GuideRichText } from '@/components/guides/GuideRichText';
import { RelatedOffers } from '@/components/guides/RelatedOffers';
import { TableOfContents } from '@/components/guides/TableOfContents';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CmsImage, HERO_SIZES } from '@/components/ui/CmsImage';
import { Container } from '@/components/ui/Container';
import { ActionBarSpacer, StickyActionBar } from '@/components/ui/StickyActionBar';
import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { destinationPath, relationId } from '@/lib/catalogPaths';
import { populated, populatedList } from '@/lib/cms/populated';
import { publishedIn } from '@/lib/guides/related';
import { tocOf } from '@/lib/guides/toc';
import { whatsappAction } from '@/lib/pageActions';
import { countWords } from '@/fields/validators';
import { lexicalToPlainText } from '@/lib/richText';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildArticle } from '@/lib/seo/jsonld/article';
import { buildBreadcrumbList } from '@/lib/seo/jsonld/breadcrumb';
import { buildFaqPage } from '@/lib/seo/jsonld/faq';
import { buildGraph } from '@/lib/seo/jsonld/graph';
import { buildOrganization } from '@/lib/seo/jsonld/organization';
import { absoluteUrl, siteUrl, type SiteSettings } from '@/lib/site';
import type { Destination, FaqItem, Guide, Media, TeamMember } from '@/payload-types';

// Page d'un guide des Carnets du Saloum (004, T031, contracts/routes.md « Structure d'une page
// guide ») : fil d'Ariane, H1, chapeau, signature, image principale (LCP), table des matières,
// corps, FAQ, offres liées, présentation de l'auteur, autres guides, WhatsApp.

type GuideViewProps = {
  guide: Guide;
  locale: Locale;
  settings: SiteSettings;
  /** Slug français du guide : clé stable des mesures d'audience. */
  guideKey: string;
  /** Autres guides publiés dans la langue (déjà sans le guide affiché). */
  others: readonly Guide[];
};

const MAX_OTHERS = 3;

const imageUrls = (media: Media | null): string[] =>
  media?.url ? [media.url.startsWith('http') ? media.url : absoluteUrl(media.url)] : [];

const authorPath = (locale: Locale, member: TeamMember | null): string | null =>
  member?.slug ? buildPath(locale, { type: 'author', slug: member.slug }) : null;

export const GuideView = async ({ guide, locale, settings, guideKey, others }: GuideViewProps) => {
  const t = await getTranslations({ locale, namespace: 'guides' });
  const tActions = await getTranslations({ locale, namespace: 'actions' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const title = guide.title ?? '';
  const path = buildPath(locale, { type: 'guide', slug: guide.seo?.slug ?? '' });
  const url = absoluteUrl(path);
  const origin = siteUrl();
  const hero = populated<Media>(guide.heroImage);
  const author = populated<TeamMember>(guide.author);
  const reviewer = populated<TeamMember>(guide.reviewer);
  const faq = populatedList<FaqItem>(guide.faq).filter((item) => item.question);
  const toc = tocOf(guide.body);
  const updatedOn = guide.updatedOn ?? guide.publishedOn ?? '';
  const themeId = relationId(guide.theme);
  const nearby = [
    ...others.filter((other) => relationId(other.theme) === themeId),
    ...others.filter((other) => relationId(other.theme) !== themeId),
  ].slice(0, MAX_OTHERS);

  const crumbs = buildBreadcrumbs({
    locale,
    route: { type: 'guide', slug: guide.seo?.slug ?? '' },
    currentName: title,
  });
  const authorUrl = authorPath(locale, author);
  const reviewerUrl = authorPath(locale, reviewer);
  const graph = buildGraph([
    buildOrganization(settings, origin),
    buildBreadcrumbList(crumbs, url, origin),
    buildArticle({
      url,
      origin,
      locale,
      headline: title,
      description: guide.seo?.metaDescription ?? guide.standfirst ?? '',
      images: imageUrls(hero),
      publishedOn: guide.publishedOn ?? updatedOn,
      updatedOn,
      wordCount: countWords(guide.body),
      author: { name: author?.name ?? '', url: authorUrl ? absoluteUrl(authorUrl) : url },
      reviewer:
        reviewer && reviewerUrl ? { name: reviewer.name, url: absoluteUrl(reviewerUrl) } : null,
      destinationUrls: populatedList<Destination>(guide.relatedDestinations)
        .filter((destination) => publishedIn(destination, locale))
        .flatMap((destination) => {
          const destinationUrl = destinationPath(locale, destination);
          return destinationUrl ? [absoluteUrl(destinationUrl)] : [];
        }),
    }),
    ...(faq.length > 0
      ? [
          buildFaqPage(
            url,
            faq.map((item) => ({
              question: item.question ?? '',
              answer: lexicalToPlainText(item.answer),
            })),
          ),
        ]
      : []),
  ]);
  const whatsapp = await whatsappAction(locale, settings, { title, path });

  return (
    <article>
      <JsonLd graph={graph} />
      <Breadcrumbs crumbs={crumbs} label={tCommon('breadcrumbLabel')} />

      <Container className="max-w-3xl pt-4">
        <h1 className="text-mangrove">{title}</h1>
        {guide.standfirst && <p className="mt-3 text-lg text-ink-muted">{guide.standfirst}</p>}
        {author && updatedOn && (
          <GuideByline
            locale={locale}
            author={author}
            reviewer={reviewer}
            updatedOn={updatedOn}
            readingMinutes={guide.readingMinutes ?? 1}
          />
        )}
      </Container>

      <div className="mx-auto mt-6 max-w-4xl sm:px-8">
        <CmsImage
          media={hero}
          locale={locale}
          sizes={HERO_SIZES}
          priority
          className="aspect-[4/3] w-full object-cover sm:rounded-card md:aspect-[16/9]"
        />
      </div>

      <Container className="max-w-3xl">
        <TableOfContents entries={toc} title={t('toc')} />
        {guide.body && (
          <div className="mt-6">
            <GuideRichText
              body={guide.body}
              toc={toc}
              locale={locale}
              labels={{ credit: t('credit'), info: t('boxInfo'), warning: t('boxWarning') }}
            />
          </div>
        )}

        {faq.length > 0 && (
          <section aria-labelledby="guide-faq" className="mt-12">
            <h2 id="guide-faq" className="text-mangrove">
              {t('faq')}
            </h2>
            <div className="mt-4 flex flex-col gap-2">
              {faq.map((item) => (
                <details key={item.id} className="rounded-card bg-white p-4">
                  <summary className="flex min-h-touch cursor-pointer items-center font-semibold">
                    {item.question}
                  </summary>
                  {item.answer && (
                    <div className="rich-text mt-2 text-ink-muted">
                      <RichText data={item.answer} />
                    </div>
                  )}
                </details>
              ))}
            </div>
          </section>
        )}

        <RelatedOffers
          guide={guide}
          locale={locale}
          title={t('relatedTitle')}
          guideKey={guideKey}
        />

        {author && (
          <section
            aria-labelledby="guide-auteur"
            className="mt-12 flex gap-4 rounded-card bg-white p-4"
          >
            <CmsImage
              media={populated<Media>(author.photo)}
              locale={locale}
              sizes="80px"
              className="size-20 shrink-0 rounded-full object-cover"
            />
            <div>
              <h2 id="guide-auteur" className="text-xl text-mangrove">
                {t('aboutAuthor')}
              </h2>
              <p className="mt-1 font-semibold">
                {author.name}
                {author.role ? `, ${author.role}` : ''}
              </p>
              {author.bio && <p className="mt-2 line-clamp-4 text-ink-muted">{author.bio}</p>}
              {authorUrl && (
                <p className="mt-2">
                  <Link href={authorUrl} className="underline underline-offset-4">
                    {t('authorPageLink', { name: author.name })}
                  </Link>
                </p>
              )}
            </div>
          </section>
        )}

        {whatsapp && (
          <p data-guide-contact className="mt-8">
            <a
              href={whatsapp.href}
              className="inline-flex min-h-touch items-center rounded-control bg-mangrove px-4 font-semibold text-sable"
            >
              {t('whatsapp')}
            </a>
          </p>
        )}
      </Container>

      {nearby.length > 0 && (
        <Container className="mt-12">
          <section aria-labelledby="guide-autres">
            <h2 id="guide-autres" className="text-mangrove">
              {t('moreGuides')}
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {nearby.map((other) => (
                <li key={other.id}>
                  <GuideCard guide={other} locale={locale} />
                </li>
              ))}
            </ul>
          </section>
        </Container>
      )}

      <StickyActionBar primary={null} whatsapp={whatsapp} label={tActions('barLabel')} />
      <ActionBarSpacer />
    </article>
  );
};
