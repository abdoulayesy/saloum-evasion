import { MIN_TOC_ENTRIES, type TocEntry } from '@/lib/guides/toc';

// Table des matières d'un guide (004, T028, FR-004) : à partir de trois intertitres, liens
// d'ancre dans un `<details>` ouvert, sans JavaScript ; entrées de 44 px de haut au moins.

type TableOfContentsProps = { entries: readonly TocEntry[]; title: string };

export const TableOfContents = ({ entries, title }: TableOfContentsProps) => {
  if (entries.length < MIN_TOC_ENTRIES) return null;
  return (
    <details open className="mt-8 rounded-card border border-sable-deep bg-white/60 p-4">
      <summary className="flex min-h-touch cursor-pointer items-center font-semibold text-mangrove">
        {title}
      </summary>
      <nav aria-labelledby="guide-toc-title" className="mt-2">
        <h2 id="guide-toc-title" className="sr-only">
          {title}
        </h2>
        <ol className="space-y-1">
          {entries.map((entry, index) => (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                className="flex min-h-touch items-center gap-3 rounded-control px-2 underline-offset-4 hover:underline focus-visible:underline"
              >
                <span aria-hidden="true" className="w-6 text-right text-ink-muted tabular-nums">
                  {index + 1}.
                </span>
                <span>{entry.text}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </details>
  );
};
