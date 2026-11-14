import type { Graph } from 'schema-dts';

// Un seul <script type="application/ld+json"> par page, rendu côté serveur (contrat jsonld.md).

/** Sérialise sans permettre de fermer la balise <script> (« </ » échappé). */
export const serializeJsonLd = (graph: Graph): string =>
  JSON.stringify(graph).replace(/</g, '\\u003c');

type JsonLdProps = { graph: Graph };

export const JsonLd = ({ graph }: JsonLdProps) => (
  <script
    type="application/ld+json"
    // Contenu produit par nos générateurs typés et échappé ci-dessus.
    dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }}
  />
);
