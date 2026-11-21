import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { GuideCard } from '@/components/guides/GuideCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CmsImage } from '@/components/ui/CmsImage';
import { Container } from '@/components/ui/Container';
import { buildPath } from '@/i18n/pathnames';
import type { Locale } from '@/i18n/routing';
import { populated } from '@/lib/cms/populated';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbList } from '@/lib/seo/jsonld/breadcrumb';
import { buildGraph } from '@/lib/seo/jsonld/graph';
import { buildOrganization } from '@/lib/seo/jsonld/organization';
import { buildProfilePage } from '@/lib/seo/jsonld/profilePage';
import { absoluteUrl, siteUrl, type SiteSettings } from '@/lib/site';
import type { Guide, Media, TeamMember } from '@/payload-types';

// Page d'auteur (004, T032, FR-003b) : photo, nom (H1), rôle, lieu, présentation, liens publics,
// guides signés ou relus publiés dans la langue, lien vers l'équipe sur « À propos ».

/** Libellé d'un lien public : nom de domaine, ou l'adresse brute si elle est mal formée. */
const linkLabel = (link: string): string => {
  try {
    return new URL(link).hostname.replace(/^www\./, '');
  } catch {
    return link;
  }
};

type AuthorViewProps = {
  member: TeamMember;
  guides: readonly Guide[];
  locale: Locale;
  settings: SiteSettings;
};

export const AuthorView = async ({ member, guides, locale, settings }: AuthorViewProps) => {
  const t = await getTranslations({ locale, namespace: 'guides' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const path = buildPath(locale, { type: 'author', slug: member.slug ?? '' });
  const url = absoluteUrl(path);
  const origin = siteUrl();
  const photo = populated<Media>(member.photo);
  const sameAs = (member.sameAs ?? []).map((link) => link.url).filter(Boolean);
  const crumbs = buildBreadcrumbs({
    locale,
    route: { type: 'author', slug: member.slug ?? '' },
    currentName: member.name,
  });
  const graph = buildGraph([
    buildOrganization(settings, origin),
    buildBreadcrumbList(crumbs, url, origin),
    buildProfilePage({
      url,
      origin,
      locale,
      name: member.name,
      jobTitle: member.role ?? '',
      description: member.bio ?? '',
      image: photo?.url ? absoluteUrl(photo.url) : null,
      place: member.place ?? '',
      sameAs,
    }),
  ]);

  return (
    <article>
      <JsonLd graph={graph} />
      <Breadcrumbs crumbs={crumbs} label={tCommon('breadcrumbLabel')} />
      <Container className="max-w-3xl pt-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <CmsImage
            media={photo}
            locale={locale}
            sizes="128px"
            priority
            className="size-32 shrink-0 rounded-full object-cover"
          />
          <div>
            <h1 className="text-mangrove">{member.name}</h1>
            <p className="mt-1 text-lg text-ink-muted">
              {member.role}
              {member.place ? ` · ${t('basedIn', { place: member.place })}` : ''}
            </p>
          </div>
        </div>
        {member.bio && <p className="mt-6 text-lg whitespace-pre-line">{member.bio}</p>}
        {sameAs.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-4">
            {sameAs.map((link) => (
              <li key={link}>
                <a
                  href={link}
                  rel="me noopener"
                  className="inline-flex min-h-touch items-center underline underline-offset-4"
                >
                  {linkLabel(link)}
                </a>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4">
          <Link
            href={buildPath(locale, { type: 'about' })}
            className="inline-flex min-h-touch items-center underline underline-offset-4"
          >
            {t('teamLink')}
          </Link>
        </p>
      </Container>

      {guides.length > 0 && (
        <Container className="mt-10">
          <section aria-labelledby="auteur-guides">
            <h2 id="auteur-guides" className="text-mangrove">
              {t('authorGuides')}
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {guides.map((guide) => (
                <li key={guide.id}>
                  <GuideCard guide={guide} locale={locale} />
                </li>
              ))}
            </ul>
          </section>
        </Container>
      )}
    </article>
  );
};
