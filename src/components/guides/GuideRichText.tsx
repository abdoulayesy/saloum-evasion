import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react';
import { CmsImage } from '@/components/ui/CmsImage';
import type { Locale } from '@/i18n/routing';
import { isH2, type TocEntry } from '@/lib/guides/toc';
import type { Guide, Media } from '@/payload-types';

// Corps d'un guide (004, T027, research R2) : H2 avec l'ancre de la table des matières (même
// ordre que `tocOf`), H3, encadrés pratiques en `<aside>`, images en `CmsImage` (différées,
// dimensions connues) avec crédit de provenance. Composant serveur, aucun JavaScript.

type GuideRichTextProps = {
  body: NonNullable<Guide['body']>;
  toc: readonly TocEntry[];
  locale: Locale;
  labels: { credit: string; info: string; warning: string };
};

type PracticalBoxFields = { title?: unknown; text?: unknown; variant?: unknown };

const isMedia = (value: unknown): value is Media =>
  typeof value === 'object' && value !== null && 'url' in value && 'alt' in value;

const IMAGE_SIZES = '(min-width: 768px) 720px, 100vw';

export const GuideRichText = ({ body, toc, locale, labels }: GuideRichTextProps) => {
  const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
    ...defaultConverters,
    heading: ({ node, nodesToJSX, childIndex, parent }) => {
      const children = nodesToJSX({ nodes: node.children });
      if (node.tag !== 'h2') return <h3 className="mt-8 text-xl text-mangrove">{children}</h3>;
      // Rang de ce H2 parmi les H2 de la racine : même ordre que la table des matières.
      const parentChildren: unknown = 'children' in parent ? parent.children : null;
      const siblings: unknown[] = Array.isArray(parentChildren) ? parentChildren : [];
      const rank = siblings.slice(0, childIndex + 1).filter(isH2).length - 1;
      const id = toc[rank]?.id;
      return (
        <h2 id={id} className="mt-10 scroll-mt-24 text-mangrove">
          {children}
        </h2>
      );
    },
    upload: ({ node }) => {
      if (!isMedia(node.value)) return null;
      const media = node.value;
      const credit = media.provenance?.author;
      return (
        <figure className="my-6">
          <CmsImage
            media={media}
            locale={locale}
            sizes={IMAGE_SIZES}
            className="w-full rounded-card object-cover"
          />
          {credit && (
            <figcaption className="mt-2 text-sm text-ink-muted">
              {labels.credit} {credit}
              {media.provenance?.place ? `, ${media.provenance.place}` : ''}
            </figcaption>
          )}
        </figure>
      );
    },
    blocks: {
      practicalBox: ({ node }: { node: { fields: PracticalBoxFields } }) => {
        const { title, text, variant } = node.fields;
        const warning = variant === 'warning';
        return (
          <aside
            aria-label={`${warning ? labels.warning : labels.info} : ${String(title)}`}
            className={`my-6 rounded-card border-l-4 p-4 ${warning ? 'border-ocre bg-ocre/10' : 'border-mangrove bg-mangrove/5'}`}
          >
            <p className="font-semibold text-ink">{String(title)}</p>
            <p className="mt-1 whitespace-pre-line text-ink">{String(text)}</p>
          </aside>
        );
      },
    },
  });

  return <RichText data={body} converters={converters} className="rich-text" />;
};
